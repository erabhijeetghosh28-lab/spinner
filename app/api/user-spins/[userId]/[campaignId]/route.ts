import prisma from '@/lib/prisma';
import { subHours } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string; campaignId: string }> }
) {
    try {
        const { userId, campaignId } = await params;

        if (!userId || !campaignId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Fetch user
        const user = await prisma.endUser.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch campaign
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Verify tenant isolation
        if (user.tenantId !== campaign.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Calculate regular spins used (within cooldown period)
        const cooldownStart = subHours(new Date(), campaign.spinCooldown);
        const regularSpinsUsed = await prisma.spin.count({
            where: {
                userId,
                campaignId,
                isReferralBonus: false,
                spinDate: {
                    gte: cooldownStart
                }
            }
        });

        // Calculate bonus spins available
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

        const bonusSpinsRemaining = Math.max(0, totalBonusesEarned - bonusSpinsUsed);

        // Calculate total spins remaining
        const regularSpinsRemaining = Math.max(0, campaign.spinLimit - regularSpinsUsed);
        const totalSpinsRemaining = regularSpinsRemaining + bonusSpinsRemaining;

        return NextResponse.json({
            success: true,
            remainingSpins: totalSpinsRemaining,
            regularSpinsRemaining,
            bonusSpinsRemaining,
            spinLimit: campaign.spinLimit,
            spinCooldown: campaign.spinCooldown
        });
    } catch (error: any) {
        console.error('Error fetching user spins:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
