import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subHours, startOfDay, endOfDay } from 'date-fns';

export async function POST(req: NextRequest) {
    try {
        const { userId, campaignId, isReferralBonus, requestedPrizeId } = await req.json();
        const today = new Date();

        if (!userId || !campaignId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Check if user exists (now EndUser)
        const user = await prisma.endUser.findUnique({
            where: { id: userId },
            include: { tenant: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found. Please log in again.' }, { status: 404 });
        }

        // Fetch campaign to get limits and tenant context
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { tenant: true }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Verify tenant isolation - user must belong to the same tenant as campaign
        if (user.tenantId !== campaign.tenantId) {
            return NextResponse.json({ error: 'Unauthorized: User and campaign must belong to the same tenant' }, { status: 403 });
        }

        // 1. Check spin limits based on campaign configuration
        if (isReferralBonus) {
            // Check if user has available bonus spins
            let referralBonusesEarned = 0;
            if (campaign.referralsRequiredForSpin > 0) {
                referralBonusesEarned = Math.floor(user.successfulReferrals / campaign.referralsRequiredForSpin);
            }
            const totalBonusesEarned = referralBonusesEarned + user.bonusSpinsEarned;

            const bonusSpinsUsed = await prisma.spin.count({
                where: {
                    userId,
                    campaignId,
                    isReferralBonus: true
                }
            });

            if (bonusSpinsUsed >= totalBonusesEarned) {
                return NextResponse.json({
                    error: "You don't have any bonus spins available. Invite friends or share your wins to earn more!"
                }, { status: 429 });
            }
        } else {
            const cooldownStart = subHours(new Date(), campaign.spinCooldown);

            const spinCount = await prisma.spin.count({
                where: {
                    userId,
                    campaignId,
                    isReferralBonus: false,
                    spinDate: {
                        gte: cooldownStart
                    }
                }
            });

            if (spinCount >= campaign.spinLimit) {
                return NextResponse.json({
                    error: `You have reached your limit of ${campaign.spinLimit} spin(s) in the last ${campaign.spinCooldown} hours.`
                }, { status: 429 });
            }
        }

        // 2. Fetch active prizes for campaign
        const prizes = await prisma.prize.findMany({
            where: { campaignId, isActive: true },
            orderBy: { position: 'asc' },
        });

        if (prizes.length === 0) {
            return NextResponse.json({ error: 'No active prizes found for this campaign' }, { status: 404 });
        }

        // 3. Filter prizes by daily limits (optimized: single query instead of N+1)
        const prizeIds = prizes.map(p => p.id);
        const winCountsToday = await prisma.spin.groupBy({
            by: ['prizeId'],
            where: {
                prizeId: { in: prizeIds },
                spinDate: {
                    gte: startOfDay(today),
                    lte: endOfDay(today),
                },
            },
            _count: {
                id: true
            }
        });

        const winCountMap = new Map(winCountsToday.map(w => [w.prizeId, w._count.id]));
        const prizesWithCurrentWinCount = prizes.map((prize: any) => ({
            ...prize,
            winCountToday: winCountMap.get(prize.id) || 0
        }));

        const availablePrizes = prizesWithCurrentWinCount.filter(
            (p) => {
                // Check daily limit
                if (p.dailyLimit !== null && p.winCountToday >= p.dailyLimit) {
                    return false;
                }
                // Check stock if inventory tracking is enabled
                if (p.currentStock !== null && p.currentStock <= 0) {
                    return false;
                }
                return true;
            }
        );

        // 4. Weighted random selection OR Honor requested prize (from guest preview)
        if (availablePrizes.length === 0) {
            return NextResponse.json({ error: 'No prizes available for spinning' }, { status: 400 });
        }


        let selectedPrize = null;

        // Try to honor requested prize if it's still available
        if (requestedPrizeId) {
            selectedPrize = availablePrizes.find(p => p.id === requestedPrizeId);
        }

        // Fallback to weighted random if no valid requested prize
        if (!selectedPrize) {
            const totalProbability = availablePrizes.reduce((sum, p) => sum + (p.probability || 0), 0);

            if (totalProbability <= 0) {
                // If no valid probabilities, select first prize
                selectedPrize = availablePrizes[0];
            } else {
                let randomValue = Math.random() * totalProbability;
                for (const prize of availablePrizes) {
                    if (randomValue < (prize.probability || 0)) {
                        selectedPrize = prize;
                        break;
                    }
                    randomValue -= (prize.probability || 0);
                }
            }
        }

        // Fallback: if no prize selected, use first available
        if (!selectedPrize) {
            selectedPrize = availablePrizes[0];
        }

        // 4.5. Check if prize has "try again" flag enabled
        // If enabled, return a special response without awarding the prize
        if (selectedPrize.showTryAgainMessage === true) {
            // Still record the spin but mark it as not won
            const spin = await prisma.spin.create({
                data: {
                    userId,
                    campaignId,
                    prizeId: selectedPrize.id,
                    wonPrize: false,
                    isReferralBonus: isReferralBonus || false,
                },
            });

            return NextResponse.json({
                success: true,
                tryAgain: true,
                message: 'Sorry, try again in some time',
                prize: {
                    id: selectedPrize.id,
                    name: selectedPrize.name,
                    description: selectedPrize.description,
                    imageUrl: selectedPrize.imageUrl
                },
                referrerBonusAwarded: false,
                referrerId: null
            });
        }

        // 5. Check if prize was won
        const wonPrize = selectedPrize.name &&
            !selectedPrize.name.toLowerCase().includes('no prize') &&
            !selectedPrize.name.toLowerCase().includes('no offer') &&
            !selectedPrize.showTryAgainMessage;

        // 6. Decrement stock atomically if prize was won and inventory tracking is enabled
        // Use transaction to prevent race conditions and ensure atomic decrement
        if (wonPrize && selectedPrize.currentStock !== null && selectedPrize.currentStock > 0) {
            try {
                // Use update with where clause to ensure stock is still > 0 (prevents overselling)
                const updatedPrize = await prisma.prize.updateMany({
                    where: {
                        id: selectedPrize.id,
                        currentStock: { gt: 0 } // Only update if stock is still positive
                    },
                    data: {
                        currentStock: {
                            decrement: 1
                        }
                    }
                });

                // If no rows were updated, stock was already 0 (race condition occurred)
                if (updatedPrize.count === 0) {
                    // Stock was depleted between check and update - this is acceptable
                    // The prize was already filtered out in step 3, but handle edge case
                    console.warn(`Stock depleted for prize ${selectedPrize.id} during spin`);
                }
            } catch (error) {
                // Log error but don't fail the spin - stock decrement is best effort
                console.error('Error decrementing stock:', error);
            }
        }

        // 7. Record the spin
        const spin = await prisma.spin.create({
            data: {
                userId,
                campaignId,
                prizeId: selectedPrize.id,
                wonPrize: wonPrize,
                isReferralBonus: isReferralBonus || false,
            },
        });

        // Send WhatsApp notification if prize won
        if (wonPrize) {
            const { sendPrizeNotification } = await import('@/lib/whatsapp');
            await sendPrizeNotification(user.phone, selectedPrize.name, selectedPrize.couponCode || undefined, user.tenantId);
        }

        // 8. Handle referral bonus logic (only for non-bonus spins)
        let referrerBonusAwarded = false;
        let referrerId = null;
        if (!isReferralBonus && user.referredById && campaign.referralsRequiredForSpin > 0) {
            // Verify referrer is in same tenant
            const referrer = await prisma.endUser.findUnique({
                where: { id: user.referredById }
            });

            if (referrer && referrer.tenantId === user.tenantId) {
                // Increment referrer's successfulReferrals
                const updatedReferrer = await prisma.endUser.update({
                    where: { id: user.referredById },
                    data: {
                        successfulReferrals: {
                            increment: 1
                        }
                    }
                });

                // Check if referrer earned a bonus spin
                if (updatedReferrer.successfulReferrals > 0 &&
                    updatedReferrer.successfulReferrals % campaign.referralsRequiredForSpin === 0) {
                    referrerBonusAwarded = true;
                    referrerId = updatedReferrer.id;
                    // Note: The bonus spin will be available when referrer calls this API again
                    // The isReferralBonus flag will bypass the limit check
                }
            }
        }

        return NextResponse.json({
            success: true,
            prize: {
                id: selectedPrize.id,
                name: selectedPrize.name,
                description: selectedPrize.description,
                couponCode: selectedPrize.couponCode,
                imageUrl: selectedPrize.imageUrl
            },
            referrerBonusAwarded, // Inform frontend if referrer got bonus
            referrerId // ID of referrer who earned bonus (for notification purposes)
        });
    } catch (error: any) {
        console.error('Error processing spin:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
