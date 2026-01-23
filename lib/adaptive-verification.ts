/**
 * Adaptive Social Verification - Traffic-Based Strategy
 * Phase 4: Automatically adjust verification strategy based on real-time traffic
 */

import prisma from './prisma';

export type VerificationStrategy = {
    type: 'INDIVIDUAL' | 'BATCHED' | 'STATISTICAL' | 'HONOR_SYSTEM';
    verificationWindow: number; // milliseconds
    verifyPercentage: number; // 0-100
    batchSize: number;
    currentRate?: number; // users/hour
    apiCallRate?: number; // calls/hour
    apiUsagePercent?: number; // percentage of 200/hour limit
};

/**
 * Determine verification strategy based on traffic volume
 */
export async function determineVerificationStrategy(cohortId: string): Promise<VerificationStrategy> {
    // Count completions in last hour
    const oneHourAgo = new Date(Date.now() - 3600000);

    const recentCount = await prisma.socialTaskCompletion.count({
        where: {
            cohortId: cohortId,
            claimedAt: { gte: oneHourAgo },
        },
    });

    // Return strategy based on volume
    if (recentCount < 200) {
        return {
            type: 'INDIVIDUAL',
            verificationWindow: 0, // Real-time
            verifyPercentage: 100,
            batchSize: 1,
            currentRate: recentCount,
            apiCallRate: recentCount,
            apiUsagePercent: (recentCount / 200) * 100,
        };
    } else if (recentCount < 1000) {
        const window = calculateWindow(recentCount);
        return {
            type: 'BATCHED',
            verificationWindow: window,
            verifyPercentage: 100,
            batchSize: Math.ceil(recentCount / 6),
            currentRate: recentCount,
            apiCallRate: Math.ceil(recentCount / (window / 3600000)),
            apiUsagePercent: (Math.ceil(recentCount / (window / 3600000)) / 200) * 100,
        };
    } else if (recentCount < 10000) {
        const samplePercent = calculateSampleSize(recentCount);
        return {
            type: 'STATISTICAL',
            verificationWindow: 12 * 3600000, // 12 hours
            verifyPercentage: samplePercent,
            batchSize: Math.ceil(recentCount * (samplePercent / 100)),
            currentRate: recentCount,
            apiCallRate: Math.ceil((recentCount * (samplePercent / 100)) / 12),
            apiUsagePercent: (Math.ceil((recentCount * (samplePercent / 100)) / 12) / 200) * 100,
        };
    } else {
        return {
            type: 'HONOR_SYSTEM',
            verificationWindow: 0,
            verifyPercentage: 0,
            batchSize: 0,
            currentRate: recentCount,
            apiCallRate: 24, // Hourly snapshots only
            apiUsagePercent: (24 / 200) * 100,
        };
    }
}

function calculateWindow(count: number): number {
    // Distribute to stay under 200 calls/hour
    const hoursNeeded = Math.ceil(count / 200);
    return Math.min(hoursNeeded, 12) * 3600000; // Max 12 hours, in milliseconds
}

function calculateSampleSize(count: number): number {
    // Statistical sample size for 95% confidence, ±2% error
    // For large populations, ~2400 is sufficient
    const sampleNeeded = Math.min(2400, count * 0.02);
    return (sampleNeeded / count) * 100; // Return as percentage
}

/**
 * Verify individual completion (used by all strategies)
 */
export async function verifyIndividualCompletion(completionId: string): Promise<'VERIFIED' | 'FAILED'> {
    const { verifyCompletion } = await import('./social-verification');
    
    // Get completion before verification
    const completion = await prisma.socialTaskCompletion.findUnique({
        where: { id: completionId },
        select: { status: true },
    });

    if (!completion || completion.status !== 'PENDING') {
        return 'FAILED'; // Already processed
    }

    // Perform verification
    await verifyCompletion(completionId);

    // Check result
    const updated = await prisma.socialTaskCompletion.findUnique({
        where: { id: completionId },
        select: { status: true },
    });

    return updated?.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED';
}

/**
 * Execute batched verification
 */
export async function verifyBatch(cohortId: string): Promise<void> {
    const strategy = await determineVerificationStrategy(cohortId);

    const completions = await prisma.socialTaskCompletion.findMany({
        where: {
            cohortId,
            status: 'PENDING',
        },
        take: 1000, // Limit to avoid timeout
    });

    if (completions.length === 0) return;

    // Distribute calls over verification window
    const delayBetweenCalls = strategy.verificationWindow / completions.length;

    for (const completion of completions) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenCalls));
        await verifyIndividualCompletion(completion.id);
    }
}

/**
 * Execute statistical sampling verification
 */
export async function verifySample(cohortId: string): Promise<void> {
    const strategy = await determineVerificationStrategy(cohortId);

    // Get all pending completions
    const completions = await prisma.socialTaskCompletion.findMany({
        where: {
            cohortId,
            status: 'PENDING',
        },
    });

    if (completions.length === 0) return;

    // Randomly select sample
    const sampleSize = Math.ceil(completions.length * (strategy.verifyPercentage / 100));
    const shuffled = [...completions].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, sampleSize);

    // Mark sampled users
    await prisma.socialTaskCompletion.updateMany({
        where: {
            id: { in: sample.map((s) => s.id) },
        },
        data: {
            sampledForVerification: true,
        },
    });

    // Verify sample over verification window
    const delayBetweenCalls = strategy.verificationWindow / sample.length;

    let verified = 0;
    for (const completion of sample) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenCalls));
        const result = await verifyIndividualCompletion(completion.id);
        if (result === 'VERIFIED') verified++;
    }

    // Project to non-sampled users
    const verificationRate = verified / sample.length;

    const nonSampled = completions.filter((c) => !sample.find((s) => s.id === c.id));
    for (const completion of nonSampled) {
        const isVerified = Math.random() < verificationRate;

        await prisma.socialTaskCompletion.update({
            where: { id: completion.id },
            data: {
                status: isVerified ? 'VERIFIED' : 'FAILED',
                verifiedAt: new Date(),
                projectedFromSample: true,
            },
        });

        // Award spins if verified
        if (isVerified) {
            const task = await prisma.socialMediaTask.findUnique({
                where: { id: completion.taskId },
                include: { campaign: true },
            });

            if (task) {
                await prisma.endUser.update({
                    where: { id: completion.userId },
                    data: {
                        bonusSpinsEarned: {
                            increment: task.spinsReward,
                        },
                    },
                });

                // Send WhatsApp notification
                const { sendTaskVerifiedNotification } = await import('./whatsapp-notifications');
                // Check if notification should be sent now based on campaign settings
                const shouldSend = task.campaign.sendImmediately || 
                    (new Date().getHours() >= (task.campaign.notificationStartHour || 9) && 
                     new Date().getHours() < (task.campaign.notificationEndHour || 21));
                if (shouldSend) {
                    await sendTaskVerifiedNotification(
                        completion.userId,
                        completion.taskId,
                        task.campaignId
                    );
                }
            }
        }
    }
}

/**
 * Honor system mode - no verification, just tracking
 */
export async function honorSystemMode(cohortId: string): Promise<void> {
    // Mark all as "pending verification" but never actually verify
    // Admin dashboard shows aggregate growth stats
    console.log(`Honor system mode: ${cohortId} - tracking aggregate only`);
    
    // Optionally, mark all as VERIFIED (accept 100% fraud rate)
    await prisma.socialTaskCompletion.updateMany({
        where: {
            cohortId,
            status: 'PENDING',
        },
        data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
            verificationStrategy: 'HONOR_SYSTEM',
        },
    });

    // Award spins to all (honor system)
    const completions = await prisma.socialTaskCompletion.findMany({
        where: {
            cohortId,
            status: 'VERIFIED',
        },
        include: {
            task: {
                include: {
                    campaign: true,
                },
            },
        },
    });

    for (const completion of completions) {
        await prisma.endUser.update({
            where: { id: completion.userId },
            data: {
                bonusSpinsEarned: {
                    increment: completion.task.spinsReward,
                },
            },
        });
    }
}
