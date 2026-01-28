import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { subDays } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');
        const startDate = req.nextUrl.searchParams.get('startDate');
        const endDate = req.nextUrl.searchParams.get('endDate');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Get tenant with plan to check if analytics is allowed
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { 
                plan: true,
                subscriptionPlan: true 
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Check subscription plan first, fallback to legacy plan
        const hasAnalyticsAccess = tenant.subscriptionPlan?.advancedAnalytics || tenant.plan.allowAnalytics;
        
        if (!hasAnalyticsAccess) {
            return NextResponse.json({ error: 'Analytics feature not available for your plan' }, { status: 403 });
        }

        // Parse date range or use defaults (last 30 days)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : subDays(end, 30);

        // Validate dates
        if (isNaN(end.getTime())) {
            return NextResponse.json({ error: 'Invalid end date format' }, { status: 400 });
        }
        if (isNaN(start.getTime())) {
            return NextResponse.json({ error: 'Invalid start date format' }, { status: 400 });
        }
        if (start > end) {
            return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
        }

        // KPIs
        const totalSpins = await prisma.spin.count({
            where: {
                campaign: { tenantId },
                spinDate: { gte: start, lte: end }
            }
        });

        const totalUsers = await prisma.endUser.count({
            where: {
                tenantId,
                createdAt: { gte: start, lte: end }
            }
        });

        const prizesWon = await prisma.spin.count({
            where: {
                campaign: { tenantId },
                wonPrize: true,
                prize: {
                    NOT: [
                        { name: { contains: 'No Prize', mode: 'insensitive' } },
                        { name: { contains: 'No Offer', mode: 'insensitive' } }
                    ]
                },
                spinDate: { gte: start, lte: end }
            }
        });

        const conversionRate = totalSpins > 0 ? ((prizesWon / totalSpins) * 100).toFixed(2) : '0.00';

        // Daily spins chart data
        const dailySpins = await prisma.spin.groupBy({
            by: ['spinDate'],
            where: {
                campaign: { tenantId },
                spinDate: { gte: start, lte: end }
            },
            _count: {
                id: true
            },
            orderBy: {
                spinDate: 'asc'
            }
        });

        // Prize distribution
        const prizeDistribution = await prisma.spin.groupBy({
            by: ['prizeId'],
            where: {
                campaign: { tenantId },
                wonPrize: true,
                prize: {
                    NOT: [
                        { name: { contains: 'No Prize', mode: 'insensitive' } },
                        { name: { contains: 'No Offer', mode: 'insensitive' } }
                    ]
                },
                spinDate: { gte: start, lte: end }
            },
            _count: {
                id: true
            }
        });

        // Get prize names
        const prizeIds = prizeDistribution
            .map(p => p.prizeId)
            .filter((id): id is string => id !== null && id !== undefined);

        const prizes = prizeIds.length > 0 ? await prisma.prize.findMany({
            where: { id: { in: prizeIds } },
            select: { id: true, name: true }
        }) : [];

        const prizeData = prizeDistribution
            .filter(p => p.prizeId) // Filter out null prizeIds
            .map(p => {
                const prize = prizes.find(pr => pr.id === p.prizeId);
                return {
                    prizeName: prize?.name || 'Unknown',
                    count: p._count.id
                };
            });

        // Referral stats
        const referralSpins = await prisma.spin.count({
            where: {
                campaign: { tenantId },
                isReferralBonus: true,
                spinDate: { gte: start, lte: end }
            }
        });

        const topReferrers = await prisma.endUser.findMany({
            where: {
                tenantId,
                successfulReferrals: { gt: 0 }
            },
            select: {
                name: true,
                phone: true,
                successfulReferrals: true,
                referralCode: true
            },
            orderBy: {
                successfulReferrals: 'desc'
            },
            take: 10
        });

        // Format daily data for charts and aggregate by date
        const dailyAggregated: Record<string, number> = {};

        dailySpins.forEach(item => {
            const dateStr = item.spinDate.toISOString().split('T')[0];
            dailyAggregated[dateStr] = (dailyAggregated[dateStr] || 0) + item._count.id;
        });

        const chartData = Object.entries(dailyAggregated)
            .map(([date, spins]) => ({ date, spins }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            kpis: {
                totalSpins,
                totalUsers,
                prizesWon,
                conversionRate: parseFloat(conversionRate),
                referralSpins
            },
            charts: {
                dailySpins: chartData,
                prizeDistribution: prizeData
            },
            topReferrers,
            dateRange: {
                start: start.toISOString(),
                end: end.toISOString()
            }
        });
    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
