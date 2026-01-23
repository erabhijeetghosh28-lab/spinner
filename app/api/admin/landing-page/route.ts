import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// GET: Get landing page for a campaign
export async function GET(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get('campaignId');
        const tenantId = searchParams.get('tenantId');

        if (!campaignId || !tenantId) {
            return NextResponse.json({ error: 'Campaign ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this campaign
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, tenantId },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        // Get or create landing page
        let landingPage = await prisma.landingPage.findUnique({
            where: { campaignId },
            include: {
                sections: {
                    orderBy: { displayOrder: 'asc' },
                },
                offers: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                },
                footer: true,
            },
        });

        // Create default landing page if it doesn't exist
        if (!landingPage) {
            await prisma.landingPage.create({
                data: {
                    campaignId,
                    title: campaign.name || 'Campaign Landing Page',
                    template: 'template_1',
                    brandColor: '#f59e0b',
                    metaTitle: campaign.name || 'Campaign Landing Page',
                    metaDescription: campaign.description || 'Spin to win amazing prizes!',
                    sections: {
                        create: [
                            {
                                type: 'HERO',
                                displayOrder: 0,
                                content: {
                                    headline: campaign.name || 'Spin to Win!',
                                    subheadline: campaign.description || 'Enter your phone number and spin the wheel to win amazing prizes!',
                                    buttonText: 'Spin Now',
                                },
                            },
                            {
                                type: 'SOCIAL_TASKS',
                                displayOrder: 1,
                                content: {
                                    title: 'Earn Extra Spins',
                                    description: 'Complete social media tasks to get bonus spins!',
                                },
                            },
                            {
                                type: 'OFFERS',
                                displayOrder: 2,
                                content: {
                                    title: 'What You Can Win',
                                    description: 'Check out these amazing prizes!',
                                },
                            },
                            {
                                type: 'FOOTER',
                                displayOrder: 3,
                                content: {},
                            },
                        ],
                    },
                    footer: {
                        create: {
                            companyName: campaign.name || 'Your Company',
                            supportEmail: campaign.websiteUrl || 'support@example.com',
                            supportPhone: campaign.supportMobile || null,
                        },
                    },
                },
            });

            // Fetch the created landing page with all relations
            landingPage = await prisma.landingPage.findUnique({
                where: { campaignId },
                include: {
                    sections: {
                        orderBy: { displayOrder: 'asc' },
                    },
                    offers: {
                        where: { isActive: true },
                        orderBy: { displayOrder: 'asc' },
                    },
                    footer: true,
                },
            });
        }

        return NextResponse.json({ landingPage });
    } catch (error: any) {
        console.error('Error fetching landing page:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch landing page',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// POST: Create or update landing page
export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const body = await req.json();
        const { campaignId, tenantId, ...landingPageData } = body;

        if (!campaignId || !tenantId) {
            return NextResponse.json({ error: 'Campaign ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this campaign
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, tenantId },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        // Ensure required fields have defaults
        const defaultData = {
            title: landingPageData.title || campaign.name || 'Campaign Landing Page',
            template: landingPageData.template || 'template_1',
            brandColor: landingPageData.brandColor || '#f59e0b',
            metaTitle: landingPageData.metaTitle || landingPageData.title || campaign.name || 'Campaign Landing Page',
            metaDescription: landingPageData.metaDescription || campaign.description || 'Spin to win amazing prizes!',
        };

        // Upsert landing page
        const landingPage = await prisma.landingPage.upsert({
            where: { campaignId },
            update: {
                ...landingPageData,
                ...defaultData, // Ensure defaults are set on update too
                updatedAt: new Date(),
            },
            create: {
                campaignId,
                ...defaultData,
                ...landingPageData,
            },
            include: {
                sections: {
                    orderBy: { displayOrder: 'asc' },
                },
                offers: {
                    orderBy: { displayOrder: 'asc' },
                },
                footer: true,
            },
        });

        return NextResponse.json({ landingPage, success: true });
    } catch (error: any) {
        console.error('Error saving landing page:', error);
        return NextResponse.json(
            {
                error: 'Failed to save landing page',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// PATCH: Publish/unpublish landing page
export async function PATCH(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const body = await req.json();
        const { campaignId, tenantId, isPublished } = body;

        if (!campaignId || !tenantId) {
            return NextResponse.json({ error: 'Campaign ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this campaign
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, tenantId },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        const landingPage = await prisma.landingPage.update({
            where: { campaignId },
            data: {
                isPublished: isPublished ?? true,
                publishedAt: isPublished ? new Date() : null,
            },
        });

        return NextResponse.json({ landingPage, success: true });
    } catch (error: any) {
        console.error('Error updating landing page:', error);
        return NextResponse.json(
            {
                error: 'Failed to update landing page',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
