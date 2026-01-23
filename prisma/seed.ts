import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding multi-tenant database...');

    // ============================================
    // 1. CREATE SUBSCRIPTION PLANS
    // ============================================
    const freePlan = await prisma.subscriptionPlan.upsert({
        where: { id: 'sub-plan-free' },
        update: {},
        create: {
            id: 'sub-plan-free',
            name: 'Free',
            price: 0,
            interval: 'MONTHLY',
            campaignsPerMonth: 1,
            spinsPerCampaign: 500,
            socialMediaEnabled: false,
            maxSocialTasks: 0,
            customBranding: false,
            advancedAnalytics: false,
            isActive: true,
        },
    });

    const starterPlan = await prisma.subscriptionPlan.upsert({
        where: { id: 'sub-plan-starter' },
        update: {},
        create: {
            id: 'sub-plan-starter',
            name: 'Starter',
            price: 99900, // ₹999
            interval: 'MONTHLY',
            campaignsPerMonth: 3,
            spinsPerCampaign: 5000,
            socialMediaEnabled: true,
            maxSocialTasks: 3,
            customBranding: false,
            advancedAnalytics: false,
            isActive: true,
        },
    });

    const proPlan = await prisma.subscriptionPlan.upsert({
        where: { id: 'sub-plan-pro' },
        update: {},
        create: {
            id: 'sub-plan-pro',
            name: 'Pro',
            price: 499900, // ₹4,999
            interval: 'MONTHLY',
            campaignsPerMonth: 10,
            spinsPerCampaign: 25000,
            socialMediaEnabled: true,
            maxSocialTasks: 10,
            customBranding: true,
            advancedAnalytics: true,
            isActive: true,
        },
    });

    const enterprisePlan = await prisma.subscriptionPlan.upsert({
        where: { id: 'sub-plan-enterprise' },
        update: {},
        create: {
            id: 'sub-plan-enterprise',
            name: 'Enterprise',
            price: 0, // Custom pricing
            interval: 'MONTHLY',
            campaignsPerMonth: 999999, // Unlimited (high number)
            spinsPerCampaign: 999999,
            socialMediaEnabled: true,
            maxSocialTasks: 999999,
            customBranding: true,
            advancedAnalytics: true,
            isActive: true,
        },
    });

    console.log('✅ Subscription plans created: Free, Starter, Pro, Enterprise');

    // ============================================
    // 2. CREATE LEGACY PLANS (for backward compatibility)
    // ============================================
    const basicPlan = await prisma.plan.upsert({
        where: { id: 'plan-basic' },
        update: {
            allowAnalytics: false,
            allowQRCodeGenerator: false,
            allowInventoryTracking: false
        },
        create: {
            id: 'plan-basic',
            name: 'Basic',
            maxSpins: 1000,
            maxCampaigns: 1,
            waIntegrationEnabled: true,
            canUseCustomTemplates: false,
            allowCustomDomain: false,
            allowEmbedding: false,
            allowAnalytics: false,
            allowQRCodeGenerator: false,
            allowInventoryTracking: false,
            price: 0,
        },
    });

    const legacyProPlan = await prisma.plan.upsert({
        where: { id: 'plan-pro' },
        update: {
            allowAnalytics: true,
            allowQRCodeGenerator: true,
            allowInventoryTracking: true
        },
        create: {
            id: 'plan-pro',
            name: 'Pro',
            maxSpins: 10000,
            maxCampaigns: 5,
            waIntegrationEnabled: true,
            canUseCustomTemplates: true,
            allowCustomDomain: true,
            allowEmbedding: true,
            allowAnalytics: true,
            allowQRCodeGenerator: true,
            allowInventoryTracking: true,
            price: 29.99,
        },
    });

    console.log('✅ Legacy plans created: Basic, Pro');

    // ============================================
    // 2. CREATE WHEEL TEMPLATES
    // ============================================
    const classicTemplate = await prisma.wheelTemplate.upsert({
        where: { id: 'template-classic' },
        update: {},
        create: {
            id: 'template-classic',
            name: 'Classic',
            componentKey: 'Classic',
            configSchema: {
                primaryColor: '#1E3A8A',
                secondaryColor: '#f59e0b',
                borderColor: '#0f172a',
                textColor: '#ffffff',
            },
            isActive: true,
        },
    });

    const modernTemplate = await prisma.wheelTemplate.upsert({
        where: { id: 'template-modern' },
        update: {},
        create: {
            id: 'template-modern',
            name: 'Modern',
            componentKey: 'Modern',
            configSchema: {
                primaryColor: '#6366f1',
                secondaryColor: '#8b5cf6',
                borderColor: '#1e293b',
                textColor: '#ffffff',
                gradient: true,
            },
            isActive: true,
        },
    });

    const neonTemplate = await prisma.wheelTemplate.upsert({
        where: { id: 'template-neon' },
        update: {},
        create: {
            id: 'template-neon',
            name: 'Neon',
            componentKey: 'Neon',
            configSchema: {
                primaryColor: '#00ff88',
                secondaryColor: '#ff0080',
                borderColor: '#000000',
                textColor: '#ffffff',
                glow: true,
            },
            isActive: true,
        },
    });

    console.log('✅ Wheel templates created: Classic, Modern, Neon');

    // ============================================
    // 3. CREATE SUPER ADMIN
    // ============================================
    const superAdminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    const superAdmin = await prisma.admin.upsert({
        where: { email: process.env.ADMIN_EMAIL || 'super@admin.com' },
        update: {
            // Ensure isSuperAdmin is set even if admin already exists
            isSuperAdmin: true,
            password: superAdminPassword, // Update password in case it changed
        },
        create: {
            email: process.env.ADMIN_EMAIL || 'super@admin.com',
            password: superAdminPassword,
            name: 'Super Admin',
            isSuperAdmin: true,
        },
    });

    console.log('✅ Super Admin created:', superAdmin.email);

    // ============================================
    // 4. CREATE DEFAULT TENANT (Demo Tenant)
    // ============================================
    const defaultTenant = await prisma.tenant.upsert({
        where: { id: 'tenant-default' },
        update: {
            subscriptionPlanId: starterPlan.id, // Upgrade to Starter for social tasks demo
            subscriptionStatus: 'ACTIVE',
        },
        create: {
            id: 'tenant-default',
            name: 'Demo Business',
            slug: 'default',
            planId: basicPlan.id,
            subscriptionPlanId: starterPlan.id, // Starter plan for social tasks
            subscriptionStatus: 'ACTIVE',
            isActive: true,
            // waConfig can be null to use global settings
        },
    });

    console.log('✅ Demo tenant created:', defaultTenant.name);

    // ============================================
    // 5. CREATE TENANT ADMIN
    // ============================================
    const tenantAdminPassword = await bcrypt.hash('tenant123', 10);
    const tenantAdmin = await prisma.tenantAdmin.upsert({
        where: { email: 'admin@default.com' },
        update: {},
        create: {
            tenantId: defaultTenant.id,
            email: 'admin@default.com',
            password: tenantAdminPassword,
            name: 'Tenant Admin',
        },
    });

    console.log('✅ Tenant Admin created:', tenantAdmin.email);

    // ============================================
    // 6. CREATE DEFAULT CAMPAIGN
    // ============================================
    const campaign = await prisma.campaign.upsert({
        where: { id: 'campaign-default' },
        update: {},
        create: {
            id: 'campaign-default',
            tenantId: defaultTenant.id,
            templateId: classicTemplate.id,
            name: 'Spin & Win Campaign',
            description: 'Try your luck and win exciting prizes!',
            isActive: true,
            spinLimit: 1,
            spinCooldown: 24,
            referralsRequiredForSpin: 0, // Disabled by default
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        },
    });

    console.log('✅ Default campaign created:', campaign.name);

    // ============================================
    // 7. CREATE DEFAULT PRIZES
    // ============================================
    const prizes = [
        {
            id: 'prize-1',
            campaignId: campaign.id,
            name: '50% Off',
            description: 'Get 50% discount on your next purchase',
            couponCode: 'ZIGGY50',
            probability: 20,
            dailyLimit: 10,
            totalLimit: 100,
            colorCode: '#FFD700',
            position: 0,
        },
        {
            id: 'prize-2',
            campaignId: campaign.id,
            name: 'Free Shipping',
            description: 'Free shipping on your order',
            couponCode: 'ZIGGYFREE',
            probability: 20,
            dailyLimit: 20,
            totalLimit: 200,
            colorCode: '#1E3A8A',
            position: 1,
        },
        {
            id: 'prize-3',
            campaignId: campaign.id,
            name: '₹100 Off',
            description: 'Get ₹100 off on orders above ₹500',
            couponCode: 'ZIGGY100',
            probability: 20,
            dailyLimit: 15,
            totalLimit: 150,
            colorCode: '#FFD700',
            position: 2,
        },
        {
            id: 'prize-4',
            campaignId: campaign.id,
            name: 'Buy 1 Get 1',
            description: 'Buy one get one free',
            couponCode: 'ZIGGY11',
            probability: 20,
            dailyLimit: 5,
            totalLimit: 50,
            colorCode: '#1E3A8A',
            position: 3,
        },
        {
            id: 'prize-5',
            campaignId: campaign.id,
            name: 'No Prize',
            description: 'Better luck next time!',
            couponCode: null,
            probability: 20,
            dailyLimit: 999,
            totalLimit: null,
            colorCode: '#1E3A8A',
            position: 4,
        },
    ];

    for (const prize of prizes) {
        await prisma.prize.upsert({
            where: { id: prize.id },
            update: {},
            create: prize,
        });
    }

    console.log('✅ 5 default prizes created');

    // ============================================
    // 8. CREATE DEMO SOCIAL TASKS (Policy-Compliant VISIT Tasks)
    // ============================================
    const socialTasks = [
        {
            id: 'task-visit-facebook',
            campaignId: campaign.id,
            platform: 'FACEBOOK',
            actionType: 'VISIT_PAGE', // Policy-compliant
            title: 'Visit Our Facebook Page',
            description: 'Check out our latest updates and offers',
            targetUrl: 'https://www.facebook.com',
            spinsReward: 2,
            isActive: true,
            displayOrder: 1,
        },
        {
            id: 'task-visit-instagram',
            campaignId: campaign.id,
            platform: 'INSTAGRAM',
            actionType: 'VISIT_PROFILE', // Policy-compliant
            title: 'Visit Our Instagram Profile',
            description: 'See our latest posts and stories',
            targetUrl: 'https://www.instagram.com',
            spinsReward: 2,
            isActive: true,
            displayOrder: 2,
        },
        {
            id: 'task-view-post',
            campaignId: campaign.id,
            platform: 'FACEBOOK',
            actionType: 'VIEW_POST', // Policy-compliant
            title: 'View Our Latest Post',
            description: 'Check out our newest announcement',
            targetUrl: 'https://www.facebook.com',
            spinsReward: 1,
            isActive: true,
            displayOrder: 3,
        },
    ];

    for (const task of socialTasks) {
        await prisma.socialMediaTask.upsert({
            where: { id: task.id },
            update: {},
            create: task,
        });
    }

    console.log('✅ 3 demo social tasks created (VISIT tasks - policy compliant)');

    // ============================================
    // 9. SEED GLOBAL SETTINGS
    // ============================================
    const settings = [
        {
            key: 'WHATSAPP_API_URL',
            value: process.env.WHATSAPP_API_URL || 'https://unofficial.cloudwapi.in/send-message',
            description: 'CloudWAPI Message Endpoint (Global Default)'
        },
        {
            key: 'WHATSAPP_API_KEY',
            value: process.env.WHATSAPP_API_KEY || '2MD9g9alop2SIyTpHdXqnVNZbPNiFR',
            description: 'CloudWAPI API Key (Global Default)'
        },
        {
            key: 'WHATSAPP_SENDER',
            value: process.env.WHATSAPP_SENDER || '919899011616',
            description: 'WhatsApp Sender Device Number (Global Default)'
        }
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
    }

    console.log('✅ Global WhatsApp settings seeded');
    
    // ============================================
    // 10. CREATE PLATFORM SETTINGS (Optional Global Fallback)
    // ============================================
    await prisma.platformSettings.upsert({
        where: { id: 'settings' },
        update: {},
        create: {
            id: 'settings',
            // Leave empty - tenants use their own tokens for Connect tasks
        },
    });

    console.log('✅ Platform settings created');
    
    console.log('🎉 Complete demo database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Super Admin: super@admin.com / admin123');
    console.log('   Tenant Admin: admin@default.com / tenant123');
    console.log('\n🌐 Demo URLs:');
    console.log('   User Campaign Page: http://localhost:3000/?tenant=default');
    console.log('   Admin Dashboard: http://localhost:3000/admin/dashboard');
    console.log('\n✨ Demo Features:');
    console.log('   - 1 Active Campaign with 5 Prizes');
    console.log('   - 3 Social Tasks (VISIT tasks - policy compliant)');
    console.log('   - Starter Plan (social tasks enabled)');
    console.log('   - Ready for immediate testing!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
