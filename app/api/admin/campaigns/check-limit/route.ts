import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UsageService } from '@/lib/usage-service';
import { NextRequest, NextResponse } from 'next/server';

// GET: Check campaign creation limits for a tenant
export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Get tenant with subscription plan
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                subscriptionPlan: true,
                _count: {
                    select: {
                        campaigns: {
                            where: {
                                isActive: true,
                                isArchived: false,
                            },
                        },
                    },
                },
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Get or create monthly usage record (event-based, auto-handles month transitions)
        const usageService = new UsageService();
        const usage = await usageService.getCurrentMonthUsage(tenantId);
        
        if (!usage) {
            return NextResponse.json({ error: 'Failed to initialize monthly usage' }, { status: 500 });
        }
        
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Determine limits based on subscription plan
        const subscriptionPlan = tenant.subscriptionPlan;
        let activeLimit = 0;
        let monthlyLimit = 0;

        if (subscriptionPlan) {
            // Use subscription plan limits
            activeLimit = subscriptionPlan.campaignsPerMonth; // Active campaigns limit
            monthlyLimit = subscriptionPlan.campaignsPerMonth; // Monthly creation limit
        } else {
            // Fallback to legacy plan limits
            const legacyPlan = await prisma.plan.findUnique({
                where: { id: tenant.planId },
            });
            activeLimit = legacyPlan?.maxCampaigns || 1;
            monthlyLimit = legacyPlan?.maxCampaigns || 1;
        }

        const activeCount = tenant._count.campaigns;
        
        // Calculate campaigns created this month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyCount = await prisma.campaign.count({
            where: {
                tenantId,
                createdAt: { gte: startOfMonth }
            }
        });

        // Check if can create (both active and monthly limits)
        const canCreate = activeCount < activeLimit && monthlyCount < monthlyLimit;

        return NextResponse.json({
            canCreate,
            activeCount,
            activeLimit,
            monthlyCount,
            monthlyLimit,
            subscriptionPlan: subscriptionPlan
                ? {
                      name: subscriptionPlan.name,
                      campaignsPerMonth: subscriptionPlan.campaignsPerMonth,
                  }
                : null,
        });
    } catch (error: any) {
        console.error('Error checking campaign limit:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
