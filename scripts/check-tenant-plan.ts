import prisma from '../lib/prisma';

async function checkTenantPlan() {
    try {
        const tenant = await prisma.tenant.findFirst({
            where: { slug: 'default' },
            include: {
                plan: true,
                subscriptionPlan: true
            }
        });

        if (!tenant) {
            console.log('❌ No tenant found');
            return;
        }

        console.log('\n✅ Tenant:', tenant.name);
        console.log('Tenant ID:', tenant.id);
        console.log('Slug:', tenant.slug);

        console.log('\n📋 Legacy Plan:');
        console.log('  Name:', tenant.plan.name);
        console.log('  allowAnalytics:', tenant.plan.allowAnalytics);
        console.log('  allowQRCodeGenerator:', tenant.plan.allowQRCodeGenerator);

        console.log('\n📋 Subscription Plan:');
        if (tenant.subscriptionPlan) {
            console.log('  Name:', tenant.subscriptionPlan.name);
            console.log('  advancedAnalytics:', tenant.subscriptionPlan.advancedAnalytics);
            console.log('  allowQRCodeGenerator:', tenant.subscriptionPlan.allowQRCodeGenerator);
            console.log('  customBranding:', tenant.subscriptionPlan.customBranding);
        } else {
            console.log('  No subscription plan assigned');
        }

        // Check what the analytics API would see
        const hasAnalyticsAccess = tenant.subscriptionPlan?.advancedAnalytics || tenant.plan.allowAnalytics;
        console.log('\n🔍 Analytics Access:', hasAnalyticsAccess ? '✅ YES' : '❌ NO');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTenantPlan();
