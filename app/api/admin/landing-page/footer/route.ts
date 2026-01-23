import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// GET: Get footer for a landing page
export async function GET(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { searchParams } = new URL(req.url);
        const landingPageId = searchParams.get('landingPageId');
        const tenantId = searchParams.get('tenantId');

        if (!landingPageId || !tenantId) {
            return NextResponse.json({ error: 'Landing Page ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this landing page
        const landingPage = await prisma.landingPage.findFirst({
            where: {
                id: landingPageId,
                campaign: { tenantId },
            },
        });

        if (!landingPage) {
            return NextResponse.json({ error: 'Landing page not found or access denied' }, { status: 404 });
        }

        let footer = await prisma.campaignFooter.findUnique({
            where: { landingPageId },
        });

        // Create default footer if it doesn't exist
        if (!footer) {
            const campaign = await prisma.campaign.findUnique({
                where: { id: landingPage.campaignId },
            });

            footer = await prisma.campaignFooter.create({
                data: {
                    landingPageId,
                    companyName: campaign?.name || 'Your Company',
                    supportEmail: campaign?.websiteUrl || 'support@example.com',
                    supportPhone: campaign?.supportMobile || null,
                },
            });
        }

        return NextResponse.json({ footer });
    } catch (error: any) {
        console.error('Error fetching footer:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch footer',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// POST/PUT: Create or update footer
export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const body = await req.json();
        const { landingPageId, tenantId, ...footerData } = body;

        if (!landingPageId || !tenantId) {
            return NextResponse.json({ error: 'Landing Page ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this landing page
        const landingPage = await prisma.landingPage.findFirst({
            where: {
                id: landingPageId,
                campaign: { tenantId },
            },
        });

        if (!landingPage) {
            return NextResponse.json({ error: 'Landing page not found or access denied' }, { status: 404 });
        }

        const footer = await prisma.campaignFooter.upsert({
            where: { landingPageId },
            update: footerData,
            create: {
                landingPageId,
                companyName: footerData.companyName || 'Your Company',
                supportEmail: footerData.supportEmail || 'support@example.com',
                ...footerData,
            },
        });

        return NextResponse.json({ footer, success: true });
    } catch (error: any) {
        console.error('Error saving footer:', error);
        return NextResponse.json(
            {
                error: 'Failed to save footer',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
