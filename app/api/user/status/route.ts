import prisma from '@/lib/prisma';
import { differenceInMinutes, subHours } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';

// Note: Not caching user status as it's user-specific and changes frequently
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('userId');
        const campaignId = req.nextUrl.searchParams.get('campaignId');

        if (!userId || !campaignId) {
            return NextResponse.json({ error: 'Missing userId or campaignId' }, { status: 400 });
        }

        // Optimized: Fetch user and campaign in parallel
        const [user, campaign] = await Promise.all([
            prisma.endUser.findUnique({
                where: { id: userId },
            }),
            prisma.campaign.findUnique({
                where: { id: campaignId },
            })
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        if (user.tenantId !== campaign.tenantId) {
            return NextResponse.json({ error: 'User and campaign mismatch' }, { status: 403 });
        }

        const now = new Date();
        const cooldownStart = subHours(now, campaign.spinCooldown);

        // Optimized: Run all spin queries in parallel
        const [baseSpinCount, bonusSpinsUsed, latestSpin] = await Promise.all([
            // Base spins used within cooldown window
            prisma.spin.count({
                where: {
                    userId,
                    campaignId,
                    isReferralBonus: false,
                    spinDate: { gte: cooldownStart },
                },
            }),
            // Bonus spins used
            prisma.spin.count({
                where: {
                    userId,
                    campaignId,
                    isReferralBonus: true,
                },
            }),
            // Latest spin for cooldown calculation
            prisma.spin.findFirst({
                where: {
                    userId,
                    campaignId,
                    isReferralBonus: false,
                    spinDate: { gte: cooldownStart },
                },
                orderBy: { spinDate: 'desc' },
                select: { spinDate: true },
            })
        ]);

        const baseSpinsAvailable = Math.max(campaign.spinLimit - baseSpinCount, 0);

        // Bonus spins calculation
        let referralBonusesEarned = 0;
        if (campaign.referralsRequiredForSpin > 0) {
            referralBonusesEarned = Math.floor(user.successfulReferrals / campaign.referralsRequiredForSpin);
        }
        const totalBonusesEarned = referralBonusesEarned + user.bonusSpinsEarned;
        const bonusSpinsAvailable = Math.max(totalBonusesEarned - bonusSpinsUsed, 0);

        // Next spin availability (hours)
        let nextSpinInHours = 0;
        if (baseSpinsAvailable <= 0 && latestSpin?.spinDate) {
            const minutesPassed = differenceInMinutes(now, latestSpin.spinDate);
            const minutesRemaining = Math.max(campaign.spinCooldown * 60 - minutesPassed, 0);
            nextSpinInHours = Math.ceil(minutesRemaining / 60);
        }

        // Determine whether user can spin: either base spins or bonus spins available
        const canSpin = (baseSpinsAvailable > 0) || (bonusSpinsAvailable > 0);

        // Show the actual total available (base + bonus). Remove the development fallback of 999.
        const displayedTotalAvailable = baseSpinsAvailable + bonusSpinsAvailable;

        // Referral progress toward next bonus
        const referralsRequired = campaign.referralsRequiredForSpin;
        const referralsProgress = referralsRequired > 0 ? user.successfulReferrals % referralsRequired : user.successfulReferrals;

        return NextResponse.json({
            canSpin,
            baseSpinsAvailable,
            bonusSpinsAvailable,
            totalAvailable: displayedTotalAvailable,
            nextSpinInHours,
            referralsRequired: referralsRequired > 0 ? referralsRequired : 0,
            referralsProgress,
            totalReferrals: user.successfulReferrals, // Total referrals made by this user
        });
    } catch (error: any) {
        console.error('[user/status] error:', error);
        return NextResponse.json({
            error: 'Failed to load spin status',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        }, { status: 500 });
    }
}
