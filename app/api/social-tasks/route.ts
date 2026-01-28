import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/social-tasks?campaignId=xxx
 * 
 * Public endpoint to get active social tasks for a campaign
 * Used by landing page templates to display available tasks
 */
export async function GET(req: NextRequest) {
    try {
        const campaignId = req.nextUrl.searchParams.get('campaignId');
        const userId = req.nextUrl.searchParams.get('userId');

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
            include: {
                completions: userId ? {
                    where: { userId }
                } : false
            },
            orderBy: { displayOrder: 'asc' },
        });

        // Filter out verified tasks if userId is provided
        let filteredTasks = tasks;
        if (userId) {
            filteredTasks = tasks.filter(task => {
                const completion = task.completions?.[0];
                return completion?.status !== 'VERIFIED';
            });
        }

        // Map to simpler format for frontend
        const resultTasks = filteredTasks.map(task => ({
            id: task.id,
            platform: task.platform,
            actionType: task.actionType,
            title: task.title,
            targetUrl: task.targetUrl,
            spinsReward: task.spinsReward,
            displayOrder: task.displayOrder,
            isCompleted: task.completions?.length > 0,
            completion: task.completions?.[0] || null
        }));

        // Automatic fix: If campaign has active tasks but socialMediaEnabled is false, enable it
        if (resultTasks.length > 0 && !campaign.socialMediaEnabled) {
            await prisma.campaign.update({
                where: { id: campaignId },
                data: { socialMediaEnabled: true },
            });
        }

        // Return empty array if social media is disabled and no tasks exist
        if (!campaign.socialMediaEnabled && (resultTasks?.length || 0) === 0) {
            return NextResponse.json({ tasks: [] });
        }

        return NextResponse.json({ tasks: resultTasks });
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
