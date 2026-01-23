import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/social-tasks/click
 * 
 * Tracks when a user clicks "Visit" link (server-side timestamp)
 * Creates a SocialTaskCompletion with status: STARTED and clickedAt timestamp
 * 
 * This prevents timer manipulation by storing server-side timestamp
 */
export async function POST(req: NextRequest) {
    try {
        const { taskId, userId, campaignId } = await req.json();

        if (!taskId || !userId || !campaignId) {
            return NextResponse.json(
                { error: 'Task ID, User ID, and Campaign ID are required' },
                { status: 400 }
            );
        }

        // Verify task exists and is active
        const task = await prisma.socialMediaTask.findUnique({
            where: { id: taskId },
            include: {
                campaign: true,
            },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (!task.isActive) {
            return NextResponse.json({ error: 'Task is not active' }, { status: 400 });
        }

        if (task.campaignId !== campaignId) {
            return NextResponse.json({ error: 'Task does not belong to this campaign' }, { status: 400 });
        }

        // Check if completion already exists
        const existingCompletion = await prisma.socialTaskCompletion.findUnique({
            where: {
                taskId_userId: {
                    taskId: taskId,
                    userId: userId,
                },
            },
        });

        if (existingCompletion) {
            // If completion exists but no clickedAt, update it
            if (!existingCompletion.clickedAt) {
                const updated = await prisma.socialTaskCompletion.update({
                    where: { id: existingCompletion.id },
                    data: {
                        clickedAt: new Date(),
                        status: existingCompletion.status === 'PENDING' ? 'STARTED' : existingCompletion.status,
                    },
                });
                return NextResponse.json({
                    success: true,
                    completionId: updated.id,
                    clickedAt: updated.clickedAt,
                });
            }
            // Return existing completion
            return NextResponse.json({
                success: true,
                completionId: existingCompletion.id,
                clickedAt: existingCompletion.clickedAt,
            });
        }

        // Create new completion with STARTED status and clickedAt timestamp
        const clickedAt = new Date();
        const completion = await prisma.socialTaskCompletion.create({
            data: {
                taskId: taskId,
                userId: userId,
                status: 'STARTED', // New status: user has clicked but not claimed yet
                spinsAwarded: 0, // Not awarded yet
                clickedAt: clickedAt,
                claimedAt: clickedAt, // Set initially, will be updated on claim
            },
        });

        return NextResponse.json({
            success: true,
            completionId: completion.id,
            clickedAt: completion.clickedAt,
        });
    } catch (error: any) {
        // Handle unique constraint violation (already completed)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Task already started' }, { status: 400 });
        }

        console.error('Error tracking click:', error);
        return NextResponse.json(
            {
                error: 'Failed to track click',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
