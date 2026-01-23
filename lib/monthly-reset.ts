/**
 * Event-based monthly limit reset utility
 * Checks and resets monthly limits when needed (on-demand, not cron)
 */

import prisma from './prisma';

/**
 * Ensures monthly usage record exists for current month
 * If it's a new month, automatically resets counters
 * Called on-demand when checking limits or creating campaigns
 */
export async function ensureMonthlyUsage(tenantId: string): Promise<void> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if usage record exists for current month
    const existingUsage = await prisma.tenantUsage.findUnique({
        where: {
            tenantId_month: {
                tenantId: tenantId,
                month: currentMonth,
            },
        },
    });

    if (!existingUsage) {
        // New month - create fresh record
        await prisma.tenantUsage.create({
            data: {
                tenantId: tenantId,
                month: currentMonth,
                campaignsCreated: 0,
                spinsUsed: 0,
            },
        });
    }
    // If record exists, it means we're still in the same month - no reset needed
}

/**
 * Gets or creates monthly usage record for a tenant
 * Automatically handles month transitions
 */
export async function getOrCreateMonthlyUsage(tenantId: string) {
    await ensureMonthlyUsage(tenantId);
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return await prisma.tenantUsage.findUnique({
        where: {
            tenantId_month: {
                tenantId: tenantId,
                month: currentMonth,
            },
        },
    });
}
