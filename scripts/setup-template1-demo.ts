import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🎨 Setting up Template 1 demo with mock data...');

    // Find the default tenant and active campaign
    const defaultTenant = await prisma.tenant.findFirst({
        where: { slug: 'default' },
    });

    if (!defaultTenant) {
        console.error('❌ Default tenant not found. Please run seed first.');
        process.exit(1);
    }

    const campaign = await prisma.campaign.findFirst({
        where: {
            tenantId: defaultTenant.id,
            isActive: true,
        },
    });

    if (!campaign) {
        console.error('❌ No active campaign found. Please create a campaign first.');
        process.exit(1);
    }

    console.log(`✅ Found campaign: ${campaign.name} (${campaign.id})`);

    // Get or create landing page
    let landingPage = await prisma.landingPage.findUnique({
        where: { campaignId: campaign.id },
        include: {
            sections: true,
            offers: true,
            footer: true,
        },
    });

    if (!landingPage) {
        // Create landing page
        landingPage = await prisma.landingPage.create({
            data: {
                campaignId: campaign.id,
                template: 'template_1',
                title: 'Spin & Win Campaign',
                brandColor: '#f48c25',
                metaTitle: campaign.name || 'Spin to Win: Your Exclusive Brand Giveaway!',
                metaDescription: campaign.description || 'Take a spin on our prize wheel for a chance to win exclusive discounts and premium products.',
                isPublished: true,
                publishedAt: new Date(),
            },
            include: {
                sections: true,
                offers: true,
                footer: true,
            },
        });
        console.log('✅ Created landing page');
    } else {
        // Update existing landing page
        landingPage = await prisma.landingPage.update({
            where: { id: landingPage.id },
            data: {
                template: 'template_1',
                brandColor: '#f48c25',
                metaTitle: campaign.name || 'Spin to Win: Your Exclusive Brand Giveaway!',
                metaDescription: campaign.description || 'Take a spin on our prize wheel for a chance to win exclusive discounts and premium products.',
                isPublished: true,
                publishedAt: new Date(),
            },
            include: {
                sections: true,
                offers: true,
                footer: true,
            },
        });
        console.log('✅ Updated landing page');
    }

    // Create/Update Hero Section
    let heroSection = landingPage.sections.find((s: any) => s.type === 'HERO');
    if (!heroSection) {
        heroSection = await prisma.landingPageSection.create({
            data: {
                landingPageId: landingPage.id,
                type: 'HERO',
                displayOrder: 1,
                isVisible: true,
                content: {
                    headline: 'Spin to Win: Your Exclusive Brand Giveaway!',
                    subheadline: 'Take a spin on our prize wheel for a chance to win exclusive discounts and premium products. Out of spins? Invite friends to keep playing!',
                    buttonText: 'Spin the Wheel Now',
                },
            },
        });
        console.log('✅ Created Hero section');
    } else {
        await prisma.landingPageSection.update({
            where: { id: heroSection.id },
            data: {
                content: {
                    headline: 'Spin to Win: Your Exclusive Brand Giveaway!',
                    subheadline: 'Take a spin on our prize wheel for a chance to win exclusive discounts and premium products. Out of spins? Invite friends to keep playing!',
                    buttonText: 'Spin the Wheel Now',
                },
            },
        });
        console.log('✅ Updated Hero section');
    }

    // Delete existing offers and create new mock offers
    await prisma.offerShowcase.deleteMany({
        where: { landingPageId: landingPage.id },
    });

    const mockOffers = [
        {
            landingPageId: landingPage.id,
            offerType: 'PRODUCT',
            title: 'Mastering Sound: The Pro Series',
            description: 'Our latest audio engineering breakthrough delivers crystal clear highs and deep, immersive lows. Crafted for those who refuse to compromise on quality, the Pro Series represents the pinnacle of wireless technology.',
            shortDescription: 'Premium wireless headphones with active noise cancellation',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbOI_PCfJlj7oXsGwmsriAuLQalEOKDU0TlFUKsaqLLxt_Te6R3s5bkDxcpUQqKTHRGMy8Bl1RH9yZZKLdwRT4W3BK3OwIH7lmLONWfJiiPWk3ND70zn0i3pK-vNws-WdMVOLm71vy8-seE8N_Nrw7zfMCoXqgwWq-uh4F5cRxOZRObDtxQepEuwtrChFybobsX2EzDV8d0ElvrCkhDFWVHkkm7lwkDFqCTAUg5xcAlcFiBlK_6AvoYDWVpoNbYRVbk0Ue7wCJ8x0',
            category: 'Audio',
            originalValue: 'Worth ₹15,999',
            discountValue: 'Get for ₹12,999',
            displayOrder: 1,
            isActive: true,
        },
        {
            landingPageId: landingPage.id,
            offerType: 'PRODUCT',
            title: 'The Future of Wellness',
            description: 'More than just a timepiece. It\'s your personal health companion, designed to keep you at the top of your game with advanced biometrics and seamless integration into your digital life.',
            shortDescription: 'Advanced smartwatch with health tracking',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChKmHOle0DNxq4r1KNDIZdiNAFPlYl_9kNIEzmGjzGAs7w7DyVkc8KYWKVC_6rRLCAQ-ER-fJfp-im4QDvY3ETv2U_h9t4PCpu4pGVc2blNog3AugfW-a6iCtAF_8iovDoj2zzGa2CTp_IPWqyTXCowxVCNSd3is3piSeod0dSqqZhjpq8G35ayWDGdYYy7Ha7iUCHEelLxnZ3A4wOr-3QO9j2NlaUa0mWfU2X9_zwVPmsXR8lrKHPizE4RQBvsQxoXIFUSllQ7KU',
            category: 'Wearables',
            originalValue: 'Worth ₹25,999',
            discountValue: 'Get for ₹19,999',
            displayOrder: 2,
            isActive: true,
        },
        {
            landingPageId: landingPage.id,
            offerType: 'PRODUCT',
            title: 'Artisanal Craftsmanship',
            description: 'Experience the ritual of perfect coffee. Our pour-over collection combines temperature-stable borosilicate glass with minimalist design for a sensory experience like no other.',
            shortDescription: 'Premium pour-over coffee set',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyX7dpl48zbY6N28pwri1breI4CArP2Xy2f-mBO7yKOGQScrBARu66huTAlrdlAQhVNLG-8IWENNdAc4E-kblnEkt8d4_AtI2ojc5TvSrDJDfNWUFfwRWDuIN4RW8mDcNGSZ7H2luZamGbHnuF1kRZ4kadikgV8RIisuEwNPcKsFv0XI31nNy0hwQU_N9Z_dLDLfYKiZHbKGDtVF2P41MTAhyh-VQL3UgIcuzmWKy7NbV0dzjyLiukLOXq_46DCRbIcUN90IFlsH0',
            category: 'Lifestyle',
            originalValue: 'Worth ₹3,999',
            discountValue: 'Get for ₹2,999',
            displayOrder: 3,
            isActive: true,
        },
    ];

    for (const offer of mockOffers) {
        await prisma.offerShowcase.create({
            data: offer,
        });
    }
    console.log('✅ Created 3 mock offers');

    // Create/Update Footer
    if (!landingPage.footer) {
        await prisma.campaignFooter.create({
            data: {
                landingPageId: landingPage.id,
                companyName: 'BrandWheel',
                companyTagline: 'Spin to Win Exclusive Rewards',
                supportEmail: 'support@brandwheel.com',
                supportPhone: '+1 (555) 123-4567',
                privacyPolicyUrl: '/privacy',
                termsUrl: '/terms',
                rulesUrl: '/rules',
            },
        });
        console.log('✅ Created Footer');
    } else {
        await prisma.campaignFooter.update({
            where: { id: landingPage.footer.id },
            data: {
                companyName: 'BrandWheel',
                companyTagline: 'Spin to Win Exclusive Rewards',
                supportEmail: 'support@brandwheel.com',
                privacyPolicyUrl: '/privacy',
                termsUrl: '/terms',
                rulesUrl: '/rules',
            },
        });
        console.log('✅ Updated Footer');
    }

    // Update campaign with referral settings
    await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
            referralsForBonus: 5,
            referralBonusSpins: 1,
        },
    });
    console.log('✅ Updated campaign referral settings');

    console.log('\n🎉 Template 1 demo setup complete!');
    console.log(`\n📋 Campaign: ${campaign.name}`);
    console.log(`🌐 Landing Page: Published and ready`);
    console.log(`🎨 Template: template_1`);
    console.log(`\n🔗 View at: http://localhost:3000/?tenant=default`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
