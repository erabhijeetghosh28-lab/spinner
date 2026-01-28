import { subDays } from 'date-fns';
import prisma from '../lib/prisma';

async function testAnalyticsAPI() {
    try {
        const tenantId = 'tenant-default';
        
        // Simulate what the API does
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { 
                plan: true,
                subscriptionPlan: true 
            }
        });

        if (!tenant) {
            console.log('❌ Tenant not found');
            return;
        }

        console.log('✅ Tenant found:', tenant.name);

        // Check analytics access
        const hasAnalyticsAccess = tenant.subscriptionPlan?.advancedAnalytics || tenant.plan.allowAnalytics;
        console.log('Analytics Access:', hasAnalyticsAccess ? '✅ YES' : '❌ NO');

        if (!hasAnalyticsAccess) {
            console.log('❌ Analytics not available for this plan');
            return;
        }

        // Date range (last 30 days)
        const end = new Date();
        const start = subDays(end, 30);

        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        // Set start date to beginning of day
        start.setHours(0, 0, 0, 0);

        console.log('\n📅 Date Range:');
        console.log('Start:', start.toISOString());
        console.log('End:', end.toISOString());

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

        console.log('\n📊 KPIs:');
        console.log('Total Spins:', totalSpins);
        console.log('Total Users:', totalUsers);
        console.log('Prizes Won:', prizesWon);
        console.log('Conversion Rate:', conversionRate + '%');

        // Daily spins
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

        console.log('\n📈 Daily Spins Data Points:', dailySpins.length);
        dailySpins.forEach(item => {
            console.log(`  ${item.spinDate.toISOString().split('T')[0]}: ${item._count.id} spins`);
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

        console.log('\n🏆 Prize Distribution:', prizeDistribution.length, 'different prizes');

        // Get prize names
        const prizeIds = prizeDistribution
            .map(p => p.prizeId)
            .filter((id): id is string => id !== null && id !== undefined);

        if (prizeIds.length > 0) {
            const prizes = await prisma.prize.findMany({
                where: { id: { in: prizeIds } },
                select: { id: true, name: true }
            });

            prizeDistribution.forEach(p => {
                const prize = prizes.find(pr => pr.id === p.prizeId);
                console.log(`  ${prize?.name || 'Unknown'}: ${p._count.id} times`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAnalyticsAPI();
