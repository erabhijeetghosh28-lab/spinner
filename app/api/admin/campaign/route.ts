import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Get first active campaign for tenant (within date range)
        const now = new Date();
        const campaign = await prisma.campaign.findFirst({
            where: {
                tenantId: tenantId,
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now }
            },
            include: {
                template: {
                    select: {
                        id: true,
                        name: true,
                        componentKey: true
                    }
                },
                tenant: {
                    select: {
                        slug: true
                    }
                }
            }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'No active campaign found' }, { status: 404 });
        }

        return NextResponse.json({
            campaign: {
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                logoUrl: campaign.logoUrl,
                supportMobile: campaign.supportMobile,
                websiteUrl: campaign.websiteUrl,
                spinLimit: campaign.spinLimit,
                spinCooldown: campaign.spinCooldown,
                referralsRequiredForSpin: campaign.referralsRequiredForSpin,
                templateId: campaign.templateId,
                template: campaign.template,
                tenantSlug: campaign.tenant.slug,
                defaultSpinRewards: campaign.defaultSpinRewards
            }
        });
    } catch (error: any) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { campaignId, tenantId, spinLimit, spinCooldown, referralsRequiredForSpin, logoUrl, templateId, supportMobile, websiteUrl, defaultSpinRewards } = await req.json();

        if (!campaignId || !tenantId) {
            return NextResponse.json({ error: 'Campaign ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this campaign
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                tenantId: tenantId
            }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        const updateData: any = {};
        if (spinLimit !== undefined) updateData.spinLimit = parseInt(spinLimit);
        if (spinCooldown !== undefined) updateData.spinCooldown = parseInt(spinCooldown);
        if (referralsRequiredForSpin !== undefined) updateData.referralsRequiredForSpin = parseInt(referralsRequiredForSpin);
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl ? (typeof logoUrl === 'string' ? logoUrl.trim() : logoUrl) : null;
        if (templateId !== undefined) updateData.templateId = templateId && String(templateId).trim() !== '' ? templateId : null;
        if (supportMobile !== undefined) updateData.supportMobile = supportMobile ? (typeof supportMobile === 'string' ? supportMobile.trim() : supportMobile) : null;
        if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl ? (typeof websiteUrl === 'string' ? websiteUrl.trim() : websiteUrl) : null;
        if (defaultSpinRewards !== undefined) updateData.defaultSpinRewards = defaultSpinRewards ? JSON.parse(JSON.stringify(defaultSpinRewards)) : null;

        await prisma.campaign.update({
            where: { id: campaignId },
            data: updateData
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({ 
            error: 'Failed to update campaign',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
