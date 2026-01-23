import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/social-tasks?campaignId=xxx
 * 
 * Public endpoint to get active social tasks for a campaign
 * Used by landing page templates to display available tasks
 */
export async function GET(req: NextRequest) {
    try {
        const campaignId = req.nextUrl.searchParams.get('campaignId');

        if (!campaignId) {
            return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
        }

        // Verify campaign exists
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { id: true, socialMediaEnabled: true },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get all active tasks for this campaign
        const tasks = await prisma.socialMediaTask.findMany({
            where: {
                campaignId,
                isActive: true,
            },
            select: {
                id: true,
                platform: true,
                actionType: true,
                title: true,
                targetUrl: true,
                spinsReward: true,
                displayOrder: true,
            },
            orderBy: { displayOrder: 'asc' },
        });

        // Automatic fix: If campaign has active tasks but socialMediaEnabled is false, enable it
        if (tasks.length > 0 && !campaign.socialMediaEnabled) {
            await prisma.campaign.update({
                where: { id: campaignId },
                data: { socialMediaEnabled: true },
            });
        }

        // Return empty array if social media is disabled and no tasks exist
        if (!campaign.socialMediaEnabled && tasks.length === 0) {
            return NextResponse.json({ tasks: [] });
        }

        return NextResponse.json({ tasks });
    } catch (error: any) {
        console.error('Error fetching social tasks:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch social tasks',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
