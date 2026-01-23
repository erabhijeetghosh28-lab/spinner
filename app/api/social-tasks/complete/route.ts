import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyCompletion } from '@/lib/social-verification';

/**
 * POST /api/social-tasks/complete
 * 
 * Claims a social task completion (user clicks "Claim Reward" after timer)
 * For VISIT tasks: Verifies immediately with time-based check
 * For legacy LIKE tasks: Uses honor system
 * 
 * Flow:
 * 1. Receives completionId (completion already exists from /click endpoint)
 * 2. Fetches completion with clickedAt timestamp
 * 3. Checks action type and verifies accordingly
 * 4. Awards spins and sends notification if verified
 */
export async function POST(req: NextRequest) {
    try {
        const { completionId } = await req.json();

        if (!completionId) {
            return NextResponse.json(
                { error: 'Completion ID is required' },
                { status: 400 }
            );
        }

        // Fetch completion with task and user info
        const completion = await prisma.socialTaskCompletion.findUnique({
            where: { id: completionId },
            include: {
                task: {
                    include: {
                        campaign: {
                            include: {
                                tenant: true,
                            },
                        },
                    },
                },
                user: true,
            },
        });

        if (!completion) {
            return NextResponse.json({ error: 'Completion not found' }, { status: 404 });
        }

        // Check if already verified or failed
        if (completion.status === 'VERIFIED') {
            return NextResponse.json({
                success: true,
                message: 'Task already verified',
                spinsAwarded: completion.spinsAwarded,
                completion: {
                    id: completion.id,
                    status: completion.status,
                },
            });
        }

        if (completion.status === 'FAILED') {
            return NextResponse.json(
                { error: 'Task verification failed. Please try again.' },
                { status: 400 }
            );
        }

        // Check action type and verify accordingly
        const actionType = completion.task.actionType.toUpperCase();

        // VISIT tasks: Immediate time-based verification
        if (actionType.startsWith('VISIT_') || actionType === 'VIEW_POST' || actionType === 'VIEW_DISCUSSION' || actionType === 'VISIT_TO_SHARE' || actionType === 'VISIT_PROFILE') {
            // Check if clickedAt exists
            if (!completion.clickedAt) {
                return NextResponse.json(
                    { error: 'Click timestamp not found. Please click the Visit button first.' },
                    { status: 400 }
                );
            }

            // Check time elapsed (10 second minimum)
            const timeElapsed = Date.now() - new Date(completion.clickedAt).getTime();
            const minTimeRequired = 10000; // 10 seconds

            if (timeElapsed < minTimeRequired) {
                const remainingSeconds = Math.ceil((minTimeRequired - timeElapsed) / 1000);
                return NextResponse.json(
                    { 
                        error: `Please wait at least 10 seconds before claiming. Wait ${remainingSeconds} more second(s).`,
                        timeElapsed,
                        minTimeRequired,
                    },
                    { status: 400 }
                );
            }

            // Time check passed - verify immediately
            await verifyCompletion(completionId);

            // Fetch updated completion
            const updatedCompletion = await prisma.socialTaskCompletion.findUnique({
                where: { id: completionId },
            });

            if (updatedCompletion?.status === 'VERIFIED') {
                return NextResponse.json({
                    success: true,
                    message: `Task verified! You've earned ${updatedCompletion.spinsAwarded} bonus spin(s).`,
                    spinsAwarded: updatedCompletion.spinsAwarded,
                    completion: {
                        id: updatedCompletion.id,
                        status: updatedCompletion.status,
                        verifiedAt: updatedCompletion.verifiedAt,
                    },
                });
            } else {
                return NextResponse.json(
                    { error: 'Verification failed. Please try again.' },
                    { status: 400 }
                );
            }
        }

        // Legacy LIKE tasks: Use honor system (backward compatibility)
        if (actionType.startsWith('LIKE_') || actionType === 'FOLLOW' || actionType === 'SHARE' || actionType === 'COMMENT') {
            // For legacy tasks, use the old flow (schedule verification)
            // This maintains backward compatibility
            const { scheduleVerification } = await import('@/lib/social-verification');
            
            // Update status to PENDING if it's STARTED
            if (completion.status === 'STARTED') {
                await prisma.socialTaskCompletion.update({
                    where: { id: completionId },
                    data: {
                        status: 'PENDING',
                        spinsAwarded: completion.task.spinsReward,
                        claimedAt: new Date(),
                    },
                });
            }

            await scheduleVerification(completionId);

            return NextResponse.json({
                success: true,
                message: `Task submitted! We're verifying your completion. You'll receive a WhatsApp notification once verified with your ${completion.task.spinsReward} bonus spin(s).`,
                spinsAwarded: 0, // Not awarded yet - will be awarded after verification
                completion: {
                    id: completion.id,
                    status: 'PENDING',
                },
            });
        }

        // CONNECT tasks: Skip for MVP (will be implemented later with OAuth)
        if (actionType === 'CONNECT_ACCOUNT') {
            return NextResponse.json(
                { error: 'Connect account feature is not yet available. Please use Visit tasks instead.' },
                { status: 501 }
            );
        }

        // Unknown action type
        return NextResponse.json(
            { error: `Unknown action type: ${actionType}` },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error completing social task:', error);
        return NextResponse.json(
            {
                error: 'Failed to complete social task',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// GET: Get user's completed tasks for a campaign
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('userId');
        const campaignId = req.nextUrl.searchParams.get('campaignId');

        if (!userId || !campaignId) {
            return NextResponse.json({ error: 'User ID and Campaign ID required' }, { status: 400 });
        }

        // Get all tasks for this campaign
        const tasks = await prisma.socialMediaTask.findMany({
            where: {
                campaignId: campaignId,
                isActive: true,
            },
            include: {
                completions: {
                    where: {
                        userId: userId,
                    },
                },
            },
            orderBy: { displayOrder: 'asc' },
        });

        // Format response
        const formattedTasks = tasks.map((task) => ({
            id: task.id,
            platform: task.platform,
            actionType: task.actionType,
            title: task.title,
            targetUrl: task.targetUrl,
            spinsReward: task.spinsReward,
            displayOrder: task.displayOrder,
            isCompleted: task.completions.length > 0,
            completion: task.completions[0] || null,
        }));

        return NextResponse.json({ tasks: formattedTasks });
    } catch (error: any) {
        console.error('Error fetching user social tasks:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch social tasks',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
