import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: campaignId } = await params;

        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaign ID' }, { status: 400 });
        }

        // Fetch campaign
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Count total unique users who have spun
        const totalUsers = await prisma.spin.groupBy({
            by: ['userId'],
            where: {
                campaignId
            }
        });

        // Get total spins count
        const totalSpins = await prisma.spin.count({
            where: {
                campaignId
            }
        });

        // Get prizes won count (excluding "No Prize" variants)
        const prizesWon = await prisma.spin.count({
            where: {
                campaignId,
                wonPrize: true
            }
        });

        return NextResponse.json({
            success: true,
            totalUsers: totalUsers.length,
            totalSpins,
            prizesWon,
            campaignName: campaign.name
        });
    } catch (error: any) {
        console.error('Error fetching campaign stats:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
