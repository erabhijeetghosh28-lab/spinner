import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🧵 Seeding Stitch Marketing Demo Tenant...');

    // 1. Find or Create Starter Plan (needed for social tasks)
    const starterPlan = await prisma.subscriptionPlan.upsert({
        where: { id: 'sub-plan-starter' },
        update: {},
        create: {
            id: 'sub-plan-starter',
            name: 'Starter',
            price: 99900,
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

    const basicPlan = await prisma.plan.findUnique({ where: { id: 'plan-basic' } }); 

    // 2. Create Stitch Tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'stitch' },
        update: {},
        create: {
            name: 'Stitch Marketing',
            slug: 'stitch', // Access via /?tenant=stitch
            planId: basicPlan?.id || 'plan-basic',
            subscriptionPlanId: starterPlan.id,
            subscriptionStatus: 'ACTIVE',
            isActive: true,
        },
    });

    console.log('✅ Tenant created: Stitch Marketing (slug: stitch)');

    // 3. Create Tenant Admin
    const password = await bcrypt.hash('stitch123', 10);
    await prisma.tenantAdmin.upsert({
        where: { email: 'admin@stitch.com' },
        update: {},
        create: {
            tenantId: tenant.id,
            email: 'admin@stitch.com',
            password,
            name: 'Stitch Admin',
        },
    });

    // 4. Create Campaign "Summer Giveaway"
    const campaign = await prisma.campaign.create({
        data: {
            tenantId: tenant.id,
            name: 'Summer Tech Giveaway',
            description: 'Win exclusive tech gadgets and premium accessories!',
            isActive: true,
            spinLimit: 1,
            spinCooldown: 24,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    });

    console.log('✅ Campaign created:', campaign.name);

    // 5. Create Prizes (Matching Design)
    const prizes = [
        {
            campaignId: campaign.id,
            name: 'Pro Wireless Headphones',
            description: 'Mastering Sound: The Pro Series',
            couponCode: 'HEADPHONES-WIN',
            probability: 5, // Rare
            dailyLimit: 1,
            totalLimit: 5,
            colorCode: '#f48c25', // Brand Orange
            position: 0,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbOI_PCfJlj7oXsGwmsriAuLQalEOKDU0TlFUKsaqLLxt_Te6R3s5bkDxcpUQqKTHRGMy8Bl1RH9yZZKLdwRT4W3BK3OwIH7lmLONWfJiiPWk3ND70zn0i3pK-vNws-WdMVOLm71vy8-seE8N_Nrw7zfMCoXqgwWq-uh4F5cRxOZRObDtxQepEuwtrChFybobsX2EzDV8d0ElvrCkhDFWVHkkm7lwkDFqCTAUg5xcAlcFiBlK_6AvoYDWVpoNbYRVbk0Ue7wCJ8x0',
        },
        {
            campaignId: campaign.id,
            name: 'Smart Wellness Watch',
            description: 'The Future of Wellness',
            couponCode: 'WATCH-WIN',
            probability: 5,
            dailyLimit: 1,
            totalLimit: 5,
            colorCode: '#1e293b', // Dark Blue
            position: 1,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChKmHOle0DNxq4r1KNDIZdiNAFPlYl_9kNIEzmGjzGAs7w7DyVkc8KYWKVC_6rRLCAQ-ER-fJfp-im4QDvY3ETv2U_h9t4PCpu4pGVc2blNog3AugfW-a6iCtAF_8iovDoj2zzGa2CTp_IPWqyTXCowxVCNSd3is3piSeod0dSqqZhjpq8G35ayWDGdYYy7Ha7iUCHEelLxnZ3A4wOr-3QO9j2NlaUa0mWfU2X9_zwVPmsXR8lrKHPizE4RQBvsQxoXIFUSllQ7KU',
        },
        {
            campaignId: campaign.id,
            name: 'Artisan Pour-Over Set',
            description: 'Artisanal Craftsmanship',
            couponCode: 'COFFEE-WIN',
            probability: 10,
            dailyLimit: 2,
            totalLimit: 20,
            colorCode: '#f48c25',
            position: 2,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyX7dpl48zbY6N28pwri1breI4CArP2Xy2f-mBO7yKOGQScrBARu66huTAlrdlAQhVNLG-8IWENNdAc4E-kblnEkt8d4_AtI2ojc5TvSrDJDfNWUFfwRWDuIN4RW8mDcNGSZ7H2luZamGbHnuF1kRZ4kadikgV8RIisuEwNPcKsFv0XI31nNy0hwQU_N9Z_dLDLfYKiZHbKGDtVF2P41MTAhyh-VQL3UgIcuzmWKy7NbV0dzjyLiukLOXq_46DCRbIcUN90IFlsH0',
        },
        {
            campaignId: campaign.id,
            name: '15% Off Discount',
            description: 'Get 15% off your next order',
            couponCode: 'STITCH15',
            probability: 40,
            dailyLimit: 100,
            totalLimit: 1000,
            colorCode: '#334155', // Slate
            position: 3,
        },
        {
            campaignId: campaign.id,
            name: 'No Prize',
            description: 'Better luck next time!',
            couponCode: null,
            probability: 40,
            dailyLimit: 9999,
            totalLimit: null,
            colorCode: '#1e293b',
            position: 4,
        },
    ];

    for (const prize of prizes) {
        await prisma.prize.create({ data: prize });
    }

    console.log('✅ Prizes created matching Stitch design');

    // 6. Create Social Tasks
    const socialTasks = [
        {
            campaignId: campaign.id,
            platform: 'FACEBOOK',
            actionType: 'VISIT_PAGE',
            title: 'Visit Our Facebook Page',
            description: 'Check out our latest updates',
            targetUrl: 'https://facebook.com',
            spinsReward: 2,
            isActive: true,
            displayOrder: 1,
        },
        {
            campaignId: campaign.id,
            platform: 'INSTAGRAM',
            actionType: 'VISIT_PROFILE',
            title: 'Visit Our Instagram Profile',
            description: 'See our latest stories',
            targetUrl: 'https://instagram.com',
            spinsReward: 2,
            isActive: true,
            displayOrder: 2,
        },
    ];

    for (const task of socialTasks) {
        await prisma.socialMediaTask.create({ data: task });
    }

    console.log('✅ Social Tasks created');

    // 7. Create Landing Page Configuration
    // This allows the LandingPageRenderer to pick up the correct data and color
    await prisma.landingPage.create({
        data: {
            campaignId: campaign.id,
            template: 'template_1',
            title: 'Summer Giveaway Landing Page',
            metaTitle: campaign.name || 'Summer Giveaway',
            metaDescription: campaign.description || 'Spin to win exciting prizes!',
            isPublished: true,
            brandColor: '#f48c25', // Stitch Orange
            sections: {
                create: [
                    { type: 'HERO', displayOrder: 0, isVisible: true, content: {} }, // Will use StitchHeroSection
                    { type: 'OFFERS', displayOrder: 1, isVisible: true, content: {} }, // Will use StitchFeaturedSection
                ],
            },
            offers: {
                create: [
                    {
                        offerType: 'PRODUCT',
                        title: 'Pro Wireless Headphones',
                        description: 'Mastering Sound: The Pro Series',
                        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbOI_PCfJlj7oXsGwmsriAuLQalEOKDU0TlFUKsaqLLxt_Te6R3s5bkDxcpUQqKTHRGMy8Bl1RH9yZZKLdwRT4W3BK3OwIH7lmLONWfJiiPWk3ND70zn0i3pK-vNws-WdMVOLm71vy8-seE8N_Nrw7zfMCoXqgwWq-uh4F5cRxOZRObDtxQepEuwtrChFybobsX2EzDV8d0ElvrCkhDFWVHkkm7lwkDFqCTAUg5xcAlcFiBlK_6AvoYDWVpoNbYRVbk0Ue7wCJ8x0',
                        category: 'New Arrival',
                        originalValue: '$299',
                        displayOrder: 0,
                        isActive: true
                },
                {
                    offerType: 'PRODUCT',
                    title: 'Smart Wellness Watch',
                    description: 'The Future of Wellness',
                    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChKmHOle0DNxq4r1KNDIZdiNAFPlYl_9kNIEzmGjzGAs7w7DyVkc8KYWKVC_6rRLCAQ-ER-fJfp-im4QDvY3ETv2U_h9t4PCpu4pGVc2blNog3AugfW-a6iCtAF_8iovDoj2zzGa2CTp_IPWqyTXCowxVCNSd3is3piSeod0dSqqZhjpq8G35ayWDGdYYy7Ha7iUCHEelLxnZ3A4wOr-3QO9j2NlaUa0mWfU2X9_zwVPmsXR8lrKHPizE4RQBvsQxoXIFUSllQ7KU',
                    category: 'Innovation',
                    originalValue: '$399',
                    displayOrder: 1,
                    isActive: true
                },
                {
                    offerType: 'PRODUCT',
                    title: 'Artisan Pour-Over Set',
                    description: 'Artisanal Craftsmanship',
                    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyX7dpl48zbY6N28pwri1breI4CArP2Xy2f-mBO7yKOGQScrBARu66huTAlrdlAQhVNLG-8IWENNdAc4E-kblnEkt8d4_AtI2ojc5TvSrDJDfNWUFfwRWDuIN4RW8mDcNGSZ7H2luZamGbHnuF1kRZ4kadikgV8RIisuEwNPcKsFv0XI31nNy0hwQU_N9Z_dLDLfYKiZHbKGDtVF2P41MTAhyh-VQL3UgIcuzmWKy7NbV0dzjyLiukLOXq_46DCRbIcUN90IFlsH0',
                    category: 'Sustainability',
                    originalValue: '$120',
                    displayOrder: 2,
                    isActive: true
                }
                ]
            },
            footer: {
                create: {
                    companyName: 'Stitch Marketing',
                    supportEmail: 'support@stitch.com',
                    privacyPolicyUrl: '/privacy',
                    termsUrl: '/terms',
                    rulesUrl: '/rules',
                }
            }
        }
    });

    console.log('✅ Landing Page configuration created');
    console.log('\n🚀 Demo Ready! Access at: http://localhost:3000/?tenant=stitch');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
