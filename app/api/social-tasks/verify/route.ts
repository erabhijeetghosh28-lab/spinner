import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyCompletion } from '@/lib/social-verification';

/**
 * POST: Verify a specific social task completion
 * Can be called by:
 * - Cron job (scheduled)
 * - Vercel Queue
 * - External service
 * - Manual trigger
 */
export async function POST(req: NextRequest) {
    try {
        const { completionId } = await req.json();

        if (!completionId) {
            return NextResponse.json({ error: 'Completion ID required' }, { status: 400 });
        }

        // Verify the completion
        await verifyCompletion(completionId);

        return NextResponse.json({ success: true, message: 'Verification completed' });
    } catch (error: any) {
        console.error('Error verifying social task:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

/**
 * GET: Process all pending verifications that are ready
 * Useful for cron jobs or manual triggers
 */
export async function GET(req: NextRequest) {
    try {
        // Optional: Verify secret for manual triggers
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Get completions ready for verification
        const readyCompletions = await prisma.socialTaskCompletion.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    {
                        verifiedAt: {
                            lte: now, // Scheduled time has passed
                        },
                    },
                    {
                        verifiedAt: null,
                        claimedAt: {
                            lte: fiveMinutesAgo, // Claimed more than 5 minutes ago
                        },
                    },
                ],
            },
            select: { id: true },
            take: 50, // Process in batches
        });

        if (readyCompletions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No completions ready for verification',
                processed: 0,
            });
        }

        let verifiedCount = 0;
        let failedCount = 0;

        for (const completion of readyCompletions) {
            try {
                await verifyCompletion(completion.id);
                
                // Check result
                const updated = await prisma.socialTaskCompletion.findUnique({
                    where: { id: completion.id },
                    select: { status: true },
                });
                
                if (updated?.status === 'VERIFIED') {
                    verifiedCount++;
                } else if (updated?.status === 'FAILED') {
                    failedCount++;
                }
            } catch (error) {
                console.error(`Error verifying completion ${completion.id}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${readyCompletions.length} completion(s)`,
            verified: verifiedCount,
            failed: failedCount,
            total: readyCompletions.length,
        });
    } catch (error: any) {
        console.error('Error processing verifications:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
