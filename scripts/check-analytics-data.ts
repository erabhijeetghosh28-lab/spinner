import prisma from '../lib/prisma';

async function checkAnalyticsData() {
    try {
        // Get the tenant (assuming it's the first one or "default")
        const tenant = await prisma.tenant.findFirst({
            where: { slug: 'default' },
            include: {
                campaigns: {
                    include: {
                        spins: {
                            take: 5,
                            orderBy: { spinDate: 'desc' }
                        }
                    }
                }
            }
        });

        if (!tenant) {
            console.log('❌ No tenant found with slug "default"');
            return;
        }

        console.log('\n✅ Tenant found:', tenant.name);
        console.log('Tenant ID:', tenant.id);
        console.log('Campaigns:', tenant.campaigns.length);

        // Check spins for this tenant
        const totalSpins = await prisma.spin.count({
            where: {
                campaign: { tenantId: tenant.id }
            }
        });

        console.log('\n📊 Total spins for tenant:', totalSpins);

        // Get recent spins with dates
        const recentSpins = await prisma.spin.findMany({
            where: {
                campaign: { tenantId: tenant.id }
            },
            select: {
                id: true,
                spinDate: true,
                wonPrize: true,
                campaign: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { spinDate: 'desc' },
            take: 10
        });

        console.log('\n🎡 Recent spins:');
        recentSpins.forEach(spin => {
            console.log(`  - ${spin.spinDate.toISOString()} | Campaign: ${spin.campaign.name} | Won: ${spin.wonPrize}`);
        });

        // Check date range
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        console.log('\n📅 Date range check:');
        console.log('Now:', now.toISOString());
        console.log('30 days ago:', thirtyDaysAgo.toISOString());

        const spinsInRange = await prisma.spin.count({
            where: {
                campaign: { tenantId: tenant.id },
                spinDate: {
                    gte: thirtyDaysAgo,
                    lte: now
                }
            }
        });

        console.log('Spins in last 30 days:', spinsInRange);

        // Check users
        const totalUsers = await prisma.endUser.count({
            where: { tenantId: tenant.id }
        });

        console.log('\n👥 Total users:', totalUsers);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAnalyticsData();
