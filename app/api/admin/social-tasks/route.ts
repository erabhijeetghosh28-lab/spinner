import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// GET: List all social tasks for a campaign
export async function GET(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const campaignId = req.nextUrl.searchParams.get('campaignId');
        const tenantId = req.nextUrl.searchParams.get('tenantId');

        if (!campaignId || !tenantId) {
            return NextResponse.json({ error: 'Campaign ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this campaign
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                tenantId: tenantId,
            },
            include: {
                tenant: {
                    include: {
                        subscriptionPlan: true,
                    },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        // Get all tasks for this campaign
        const tasks = await prisma.socialMediaTask.findMany({
            where: { campaignId },
            orderBy: { displayOrder: 'asc' },
            include: {
                _count: {
                    select: { completions: true },
                },
            },
        });

        return NextResponse.json({
            tasks,
            subscriptionPlan: campaign.tenant.subscriptionPlan
                ? {
                      name: campaign.tenant.subscriptionPlan.name,
                      socialMediaEnabled: campaign.tenant.subscriptionPlan.socialMediaEnabled,
                      maxSocialTasks: campaign.tenant.subscriptionPlan.maxSocialTasks,
                  }
                : null,
        });
    } catch (error: any) {
        console.error('Error fetching social tasks:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// POST: Create new social task
export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { campaignId, tenantId, platform, actionType, title, targetUrl, spinsReward, displayOrder } =
            await req.json();

        if (!campaignId || !tenantId || !platform || !actionType || !title || !targetUrl) {
            return NextResponse.json(
                { error: 'Campaign ID, Tenant ID, platform, actionType, title, and targetUrl are required' },
                { status: 400 }
            );
        }

        // Validate spinsReward (minimum 1, no maximum limit)
        const reward = parseInt(String(spinsReward)) || 1;
        if (reward < 1) {
            return NextResponse.json({ error: 'Spins reward must be at least 1' }, { status: 400 });
        }

        // Verify tenant owns this campaign and check subscription
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                tenantId: tenantId,
            },
            include: {
                tenant: {
                    include: {
                        subscriptionPlan: true,
                    },
                },
                _count: {
                    select: { socialTasks: true },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        // Check subscription permission
        const subscriptionPlan = campaign.tenant.subscriptionPlan;
        if (!subscriptionPlan || !subscriptionPlan.socialMediaEnabled) {
            return NextResponse.json(
                {
                    error: 'Social media tasks are not available on your current plan. Please upgrade to Starter or higher.',
                },
                { status: 403 }
            );
        }

        // Check task limit
        if (campaign._count.socialTasks >= subscriptionPlan.maxSocialTasks) {
            return NextResponse.json(
                {
                    error: `Task limit reached. Your plan (${subscriptionPlan.name}) allows ${subscriptionPlan.maxSocialTasks} social task(s).`,
                },
                { status: 403 }
            );
        }

        // Create task
        const task = await prisma.socialMediaTask.create({
            data: {
                campaignId,
                platform: platform.toUpperCase(),
                actionType: actionType.toUpperCase(),
                title: title.trim(),
                targetUrl: targetUrl.trim(),
                spinsReward: reward,
                displayOrder: displayOrder || 0,
                isActive: true,
            },
        });

        // Automatically enable social media for the campaign if not already enabled
        if (!campaign.socialMediaEnabled) {
            await prisma.campaign.update({
                where: { id: campaignId },
                data: { socialMediaEnabled: true },
            });
        }

        return NextResponse.json({ success: true, task });
    } catch (error: any) {
        console.error('Error creating social task:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to create social task',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

// PUT: Update social task
export async function PUT(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { taskId, tenantId, platform, actionType, title, targetUrl, spinsReward, displayOrder, isActive } =
            await req.json();

        if (!taskId || !tenantId) {
            return NextResponse.json({ error: 'Task ID and Tenant ID required' }, { status: 400 });
        }

        // Validate spinsReward if provided (1-10)
        if (spinsReward !== undefined) {
            const reward = parseInt(String(spinsReward));
            if (reward < 1 || reward > 10) {
                return NextResponse.json({ error: 'Spins reward must be between 1 and 10' }, { status: 400 });
            }
        }

        // Verify tenant owns this task's campaign
        const task = await prisma.socialMediaTask.findUnique({
            where: { id: taskId },
            include: {
                campaign: {
                    include: {
                        tenant: true,
                    },
                },
            },
        });

        if (!task || task.campaign.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
        }

        // Update task
        const updateData: any = {};
        if (platform !== undefined) updateData.platform = platform.toUpperCase();
        if (actionType !== undefined) updateData.actionType = actionType.toUpperCase();
        if (title !== undefined) updateData.title = title.trim();
        if (targetUrl !== undefined) updateData.targetUrl = targetUrl.trim();
        if (spinsReward !== undefined) updateData.spinsReward = parseInt(String(spinsReward));
        if (displayOrder !== undefined) updateData.displayOrder = parseInt(String(displayOrder));
        if (typeof isActive === 'boolean') updateData.isActive = isActive;

        const updatedTask = await prisma.socialMediaTask.update({
            where: { id: taskId },
            data: updateData,
        });

        return NextResponse.json({ success: true, task: updatedTask });
    } catch (error: any) {
        console.error('Error updating social task:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to update social task',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

// DELETE: Delete social task
export async function DELETE(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { taskId, tenantId } = await req.json();

        if (!taskId || !tenantId) {
            return NextResponse.json({ error: 'Task ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this task's campaign
        const task = await prisma.socialMediaTask.findUnique({
            where: { id: taskId },
            include: {
                campaign: {
                    include: {
                        tenant: true,
                    },
                },
            },
        });

        if (!task || task.campaign.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
        }

        // Delete task (cascades to completions)
        await prisma.socialMediaTask.delete({
            where: { id: taskId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting social task:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to delete social task',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
