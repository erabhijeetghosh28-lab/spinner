import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWeek1() {
    console.log('🧪 Testing Week 1: Subscription System & Campaign Limits\n');

    // Test 1: Verify Subscription Plans exist
    console.log('1️⃣ Testing Subscription Plans...');
    const plans = await prisma.subscriptionPlan.findMany({
        orderBy: { price: 'asc' },
    });
    console.log(`   ✅ Found ${plans.length} subscription plans:`);
    plans.forEach((plan) => {
        console.log(`      - ${plan.name}: ${plan.campaignsPerMonth} campaigns/month, ₹${plan.price / 100}/month`);
    });

    // Test 2: Verify Tenant has subscription plan
    console.log('\n2️⃣ Testing Tenant Subscription...');
    const tenant = await prisma.tenant.findFirst({
        include: {
            subscriptionPlan: true,
            plan: true,
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

    if (tenant) {
        console.log(`   ✅ Tenant: ${tenant.name}`);
        console.log(`      - Subscription Plan: ${tenant.subscriptionPlan?.name || 'None (using legacy plan)'}`);
        console.log(`      - Subscription Status: ${tenant.subscriptionStatus}`);
        console.log(`      - Active Campaigns: ${tenant._count.campaigns}`);
        if (tenant.subscriptionPlan) {
            console.log(`      - Campaign Limit: ${tenant.subscriptionPlan.campaignsPerMonth}/month`);
        }
    } else {
        console.log('   ⚠️  No tenant found');
    }

    // Test 3: Verify TenantUsage tracking
    console.log('\n3️⃣ Testing Monthly Usage Tracking...');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    if (tenant) {
        const usage = await prisma.tenantUsage.findUnique({
            where: {
                tenantId_month: {
                    tenantId: tenant.id,
                    month: currentMonth,
                },
            },
        });

        if (usage) {
            console.log(`   ✅ Monthly usage for ${currentMonth}:`);
            console.log(`      - Campaigns Created: ${usage.campaignsCreated}`);
            console.log(`      - Spins Used: ${usage.spinsUsed}`);
        } else {
            console.log(`   ⚠️  No usage record for ${currentMonth} (will be created on first campaign creation)`);
        }
    }

    // Test 4: Verify Campaign soft delete fields
    console.log('\n4️⃣ Testing Campaign Soft Delete...');
    const campaigns = await prisma.campaign.findMany({
        take: 5,
        select: {
            id: true,
            name: true,
            isActive: true,
            isArchived: true,
            archivedAt: true,
        },
    });
    console.log(`   ✅ Found ${campaigns.length} campaigns (showing first 5):`);
    campaigns.forEach((camp) => {
        const status = camp.isArchived
            ? 'ARCHIVED'
            : camp.isActive
            ? 'ACTIVE'
            : 'INACTIVE';
        console.log(`      - ${camp.name}: ${status}${camp.archivedAt ? ` (archived at ${camp.archivedAt.toISOString()})` : ''}`);
    });

    // Test 5: Check archived campaigns
    console.log('\n5️⃣ Testing Archived Campaigns...');
    const archivedCount = await prisma.campaign.count({
        where: { isArchived: true },
    });
    const activeCount = await prisma.campaign.count({
        where: { isActive: true, isArchived: false },
    });
    console.log(`   ✅ Active Campaigns: ${activeCount}`);
    console.log(`   ✅ Archived Campaigns: ${archivedCount}`);

    // Test 6: Verify limit calculation logic
    console.log('\n6️⃣ Testing Limit Calculation...');
    if (tenant && tenant.subscriptionPlan) {
        const activeLimit = tenant.subscriptionPlan.campaignsPerMonth;
        const monthlyLimit = tenant.subscriptionPlan.campaignsPerMonth;
        const activeCount = tenant._count.campaigns;
        
        const usage = await prisma.tenantUsage.findUnique({
            where: {
                tenantId_month: {
                    tenantId: tenant.id,
                    month: currentMonth,
                },
            },
        });
        const monthlyCount = usage?.campaignsCreated || 0;

        console.log(`   ✅ Limit Check for ${tenant.name}:`);
        console.log(`      - Active: ${activeCount}/${activeLimit} (${activeCount < activeLimit ? '✅ Can create' : '❌ Limit reached'})`);
        console.log(`      - Monthly: ${monthlyCount}/${monthlyLimit} (${monthlyCount < monthlyLimit ? '✅ Can create' : '❌ Limit reached'})`);
        console.log(`      - Overall: ${activeCount < activeLimit && monthlyCount < monthlyLimit ? '✅ CAN CREATE' : '❌ CANNOT CREATE'}`);
    }

    console.log('\n✅ Week 1 Testing Complete!\n');
}

testWeek1()
    .catch((e) => {
        console.error('❌ Test failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
