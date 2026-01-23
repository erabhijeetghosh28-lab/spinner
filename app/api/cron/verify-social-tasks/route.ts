import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Event-based verification endpoint
 * Can be called manually or via a single daily cron to verify pending completions
 * 
 * NOTE: VISIT tasks verify immediately on claim (no cron needed)
 * This cron is primarily for legacy LIKE tasks and CONNECT tasks (when implemented)
 */
export async function GET(req: NextRequest) {
    try {
        // Optional: Verify secret for manual triggers
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all completions that are PENDING and scheduled for verification
        // Production-ready: Checks scheduled verifyAt timestamp instead of relying on setTimeout
        const now = new Date();

        // Get all pending completions (will filter VISIT tasks after fetching)
        const allPendingCompletions = await prisma.socialTaskCompletion.findMany({
            where: {
                status: 'PENDING',
                // Verify if scheduled time has passed (or was scheduled more than 5 minutes ago)
                OR: [
                    {
                        verifiedAt: {
                            lte: now, // Scheduled time has passed
                        },
                    },
                    {
                        // Fallback: If no scheduled time, check if claimed more than 5 minutes ago
                        verifiedAt: null,
                        claimedAt: {
                            lte: new Date(now.getTime() - 5 * 60 * 1000),
                        },
                    },
                ],
            },
            include: {
                task: true,
            },
            take: 500, // Increased batch size for scalability
        });

        // Filter out VISIT tasks - they verify immediately, no cron needed
        const pendingCompletions = allPendingCompletions.filter((completion) => {
            const actionType = completion.task.actionType.toUpperCase();
            return !(
                actionType.startsWith('VISIT_') ||
                actionType === 'VIEW_POST' ||
                actionType === 'VIEW_DISCUSSION' ||
                actionType === 'VISIT_TO_SHARE' ||
                actionType === 'VISIT_PROFILE'
            );
        });

        if (pendingCompletions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending completions to verify',
                verified: 0,
                flagged: 0,
            });
        }

        // Verify each completion using the verification function
        const { verifyCompletion } = await import('@/lib/social-verification');
        
        let verifiedCount = 0;
        let failedCount = 0;

        for (const completion of pendingCompletions) {
            const previousStatus = completion.status;
            await verifyCompletion(completion.id);
            
            // Check result
            const updated = await prisma.socialTaskCompletion.findUnique({
                where: { id: completion.id },
                select: { status: true },
            });
            
            if (updated?.status === 'VERIFIED' && previousStatus === 'PENDING') {
                verifiedCount++;
            } else if (updated?.status === 'FAILED' && previousStatus === 'PENDING') {
                failedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Verified ${verifiedCount} completion(s), flagged ${failedCount} as potentially fraudulent`,
            verified: verifiedCount,
            flagged: failedCount,
            total: pendingCompletions.length,
        });
    } catch (error: any) {
        console.error('Error verifying social tasks:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggers
export async function POST(req: NextRequest) {
    return GET(req);
}
