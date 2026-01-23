import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Schedule: Daily at midnight (0 0 * * *)
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (if using Vercel Cron)
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Only run on the 1st of the month
        if (now.getDate() !== 1) {
            return NextResponse.json({
                success: true,
                message: 'Not the first day of the month. Skipping reset.',
                currentDate: now.toISOString(),
            });
        }

        // Get all tenants
        const tenants = await prisma.tenant.findMany({
            select: { id: true },
        });

        let resetCount = 0;

        // For each tenant, ensure current month usage record exists (with reset values)
        for (const tenant of tenants) {
            // Check if current month record exists
            const existingUsage = await prisma.tenantUsage.findUnique({
                where: {
                    tenantId_month: {
                        tenantId: tenant.id,
                        month: currentMonth,
                    },
                },
            });

            if (!existingUsage) {
                // Create new record for current month (starts at 0)
                await prisma.tenantUsage.create({
                    data: {
                        tenantId: tenant.id,
                        month: currentMonth,
                        campaignsCreated: 0,
                        spinsUsed: 0,
                    },
                });
                resetCount++;
            } else {
                // Reset existing record to 0 (in case it was created mid-month)
                await prisma.tenantUsage.update({
                    where: {
                        tenantId_month: {
                            tenantId: tenant.id,
                            month: currentMonth,
                        },
                    },
                    data: {
                        campaignsCreated: 0,
                        spinsUsed: 0,
                    },
                });
                resetCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Monthly limits reset for ${resetCount} tenant(s)`,
            currentMonth,
            resetCount,
        });
    } catch (error: any) {
        console.error('Error resetting monthly limits:', error);
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
