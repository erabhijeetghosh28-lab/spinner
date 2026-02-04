import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const { searchParams } = req.nextUrl;
        const campaignId = searchParams.get('campaignId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaign ID' }, { status: 400 });
        }

        // Count how many users this user has referred for this campaign
        const referralCount = await prisma.endUser.count({
            where: {
                referredBy: userId,
                campaignId: campaignId
            }
        });

        return NextResponse.json({
            success: true,
            count: referralCount
        });
    } catch (error: any) {
        console.error('Error fetching referral progress:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
