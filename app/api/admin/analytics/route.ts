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

        // Set end date to end of day to include all spins on that day
        end.setHours(23, 59, 59, 999);
        // Set start date to beginning of day
        start.setHours(0, 0, 0, 0);

        console.log('Analytics date range:', { start, end, tenantId });

        // --- CORE KPI QUERIES ---

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

        const referralSpins = await prisma.spin.count({
            where: {
                campaign: { tenantId },
                isReferralBonus: true,
                spinDate: { gte: start, lte: end }
            }
        });

        // --- 1. HEATMAP & DEVICE STATS (Aggregated from Spins) ---
        // We fetch raw spin data (lightweight) for processing
        const allSpins = await prisma.spin.findMany({
            where: {
                campaign: { tenantId },
                spinDate: { gte: start, lte: end }
            },
            select: {
                spinDate: true,
                userAgent: true
            }
        });

        // Process Heatmap
        const heatmapData: Record<number, Record<number, number>> = {}; // { day: { hour: count } }
        // Process Device Stats
        const deviceStats = { mobile: 0, desktop: 0, tablet: 0 };
        const browserStats: Record<string, number> = {};

        allSpins.forEach(spin => {
            // Heatmap
            const date = new Date(spin.spinDate);
            const day = date.getDay(); // 0-6
            const hour = date.getHours(); // 0-23
            
            if (!heatmapData[day]) heatmapData[day] = {};
            heatmapData[day][hour] = (heatmapData[day][hour] || 0) + 1;

            // Device/Browser parsing
            const ua = (spin.userAgent || '').toLowerCase();
            if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
                deviceStats.mobile++;
            } else if (ua.includes('tablet') || ua.includes('ipad')) {
                deviceStats.tablet++;
            } else {
                deviceStats.desktop++;
            }

            let browser = 'Other';
            if (ua.includes('chrome')) browser = 'Chrome';
            else if (ua.includes('safari')) browser = 'Safari';
            else if (ua.includes('firefox')) browser = 'Firefox';
            else if (ua.includes('edge')) browser = 'Edge';
            
            browserStats[browser] = (browserStats[browser] || 0) + 1;
        });

        // --- 2. REFERRAL GROWTH (Organic vs Referred) ---
        const newUsers = await prisma.endUser.findMany({
            where: {
                tenantId,
                createdAt: { gte: start, lte: end }
            },
            select: {
                createdAt: true,
                referredById: true
            }
        });

        const referralGrowth: Record<string, { organic: number, referred: number }> = {};
        let totalReferringUsers = 0; // For viral coefficient

        newUsers.forEach(user => {
            const dateStr = new Date(user.createdAt).toISOString().split('T')[0];
            if (!referralGrowth[dateStr]) referralGrowth[dateStr] = { organic: 0, referred: 0 };
            
            if (user.referredById) {
                referralGrowth[dateStr].referred++;
            } else {
                referralGrowth[dateStr].organic++;
            }
        });

        // Calculate Viral Coefficient (Referrals / Active Users) roughly
        const uniqueReferrers = await prisma.endUser.count({
            where: {
                tenantId,
                successfulReferrals: { gt: 0 }
            }
        });
        // Viral Coefficient = Total Referrals / Total Users (Simple metric)
        const totalReferrals = await prisma.endUser.count({ 
            where: { tenantId, referredById: { not: null } } 
        });
        const viralCoefficient = totalUsers > 0 ? (totalReferrals / totalUsers).toFixed(2) : '0';

        // --- 3. REDEMPTION FUNNEL & TIME ---
        const totalVouchers = await prisma.voucher.count({
            where: { tenantId, createdAt: { gte: start, lte: end } }
        });
        
        const redeemedVouchers = await prisma.voucher.findMany({
            where: { 
                tenantId, 
                isRedeemed: true,
                createdAt: { gte: start, lte: end }
            },
            select: {
                createdAt: true,
                redeemedAt: true
            }
        });

        // Time to Redeem Analysis
        const redemptionTimes: Record<string, number> = {
            '1h': 0, '24h': 0, '3d': 0, '1w': 0, '1w+': 0
        };

        redeemedVouchers.forEach(v => {
            if (!v.redeemedAt) return;
            const diffMs = new Date(v.redeemedAt).getTime() - new Date(v.createdAt).getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours <= 1) redemptionTimes['1h']++;
            else if (diffHours <= 24) redemptionTimes['24h']++;
            else if (diffHours <= 72) redemptionTimes['3d']++;
            else if (diffHours <= 168) redemptionTimes['1w']++;
            else redemptionTimes['1w+']++;
        });

        // --- 4. USER RETENTION & CHURN ---
        // Fetch users with high spin counts
        const allUserSpins = await prisma.spin.groupBy({
            by: ['userId'],
            where: { campaign: { tenantId } },
            _count: { id: true },
            _max: { spinDate: true }
        });

        const retentionBuckets = { '1': 0, '2-5': 0, '5-10': 0, '10+': 0 };
        const churnCandidates: any[] = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // We need user names for the churn table, so we'll fetch details for the churn candidates later
        const churnUserIds: string[] = [];

        allUserSpins.forEach(u => {
            const count = u._count.id;
            const lastSpin = u._max.spinDate;

            if (count === 1) retentionBuckets['1']++;
            else if (count <= 5) retentionBuckets['2-5']++;
            else if (count <= 10) retentionBuckets['5-10']++;
            else retentionBuckets['10+']++;

            // Churn Logic: > 5 spins BUT last spin was > 7 days ago
            if (count > 5 && lastSpin && new Date(lastSpin) < sevenDaysAgo) {
                churnUserIds.push(u.userId);
            }
        });

        // Fetch Churn User Details
        if (churnUserIds.length > 0) {
            const churningUsers = await prisma.endUser.findMany({
                where: { id: { in: churnUserIds.slice(0, 50) } }, // Limit to top 50
                select: { id: true, name: true, phone: true }
            });
            
            churningUsers.forEach(user => {
                const stats = allUserSpins.find(s => s.userId === user.id);
                churnCandidates.push({
                    name: user.name || 'Anonymous',
                    phone: user.phone,
                    totalSpins: stats?._count.id || 0,
                    lastActive: stats?._max.spinDate
                });
            });
        }

        // --- 5. PRIZE INTEGRITY ---
        const prizeStats = await prisma.prize.findMany({
            where: { campaign: { tenantId } },
            include: {
                _count: {
                    select: { spins: { where: { wonPrize: true } } }
                }
            }
        });

        const integrityData = prizeStats.map(p => ({
            name: p.name,
            probability: p.probability,
            actualWinCount: p._count.spins,
            // Calculate actual percentage relative to total wins (or total spins? usually total spins)
            actualWinRate: totalSpins > 0 ? ((p._count.spins / totalSpins) * 100).toFixed(2) : 0
        }));

        // --- 6. VIRAL GENOME (Top Connectors) ---
        // Find users with most referrals
        const superConnectors = await prisma.endUser.findMany({
            where: { tenantId, successfulReferrals: { gt: 0 } },
            orderBy: { successfulReferrals: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                successfulReferrals: true,
                referrals: {
                    select: {
                        name: true,
                        successfulReferrals: true // Secondary viral impact
                    }
                }
            }
        });

        // Flatten for graph: User -> [Ref1, Ref2...]
        const viralGenome = superConnectors.map(u => ({
            name: u.name || 'Unknown',
            totalReferrals: u.successfulReferrals,
            children: u.referrals.map(r => ({
                name: r.name || 'Unknown',
                ownReferrals: r.successfulReferrals
            }))
        }));


        // --- ASSEMBLE RESPONSE ---

        // Helper for Chart Data sorting
        const chartData = Object.entries(referralGrowth)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const dailySpins = await prisma.spin.groupBy({
            by: ['spinDate'],
            where: {
                campaign: { tenantId },
                spinDate: { gte: start, lte: end }
            },
            _count: { id: true },
            orderBy: { spinDate: 'asc' }
        });
        
        const dailySpinsChart = dailySpins.map(d => ({
            date: new Date(d.spinDate).toISOString().split('T')[0],
            spins: d._count.id
        }));

        return NextResponse.json({
            kpis: {
                totalSpins,
                totalUsers,
                prizesWon,
                conversionRate: parseFloat(conversionRate),
                referralSpins,
                viralCoefficient: parseFloat(viralCoefficient),
                redeemedVouchers: redeemedVouchers.length
            },
            charts: {
                dailySpins: dailySpinsChart,
                heatmap: heatmapData,
                referralGrowth: chartData,
                redemptionTime: redemptionTimes,
                retention: retentionBuckets,
                deviceStats: { device: deviceStats, browser: browserStats },
                prizeIntegrity: integrityData,
                redemptionFunnel: {
                    spins: totalSpins,
                    wins: prizesWon,
                    vouchers: totalVouchers,
                    redeemed: redeemedVouchers.length
                }
            },
            deepAnalysis: {
                churnCandidates,
                viralGenome,
                roiData: {
                    totalUsers,
                    totalRedemptions: redeemedVouchers.length,
                    totalSpins
                }
            },
            topReferrers: await prisma.endUser.findMany({
                where: { tenantId, successfulReferrals: { gt: 0 } },
                select: { name: true, phone: true, successfulReferrals: true, referralCode: true },
                orderBy: { successfulReferrals: 'desc' },
                take: 10
            }),
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
