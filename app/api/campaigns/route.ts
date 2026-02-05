import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Cache campaign data for 5 minutes - campaigns don't change frequently
async function getCampaignData(tenantSlug: string, tenantId: string | null, campaignId: string) {
    // Get tenant context
    let tenant = null;
    if (tenantId) {
        tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    } else {
        tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    }

    if (!tenant || !tenant.isActive) {
        return null;
    }

    // Optimized: Single query with all includes
    const now = new Date();
    let campaign = await prisma.campaign.findFirst({
        where: {
            id: campaignId,
            tenantId: tenant.id,
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now }
        },
        include: {
            prizes: {
                where: { isActive: true },
                orderBy: { position: 'asc' },
                select: {
                    id: true,
                    name: true,
                    colorCode: true,
                    position: true,
                    showTryAgainMessage: true,
                    probability: true,
                    voucherValidityDays: true,
                    voucherRedemptionLimit: true
                }
            },
            socialTasks: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' }
            },
            template: {
                select: {
                    id: true,
                    name: true,
                    componentKey: true,
                    configSchema: true
                }
            }
        }
    });

    // If campaign not found by ID, try to get first active campaign for tenant
    if (!campaign) {
        campaign = await prisma.campaign.findFirst({
            where: {
                tenantId: tenant.id,
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now }
            },
            include: {
                prizes: {
                    where: { isActive: true },
                    orderBy: { position: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        colorCode: true,
                        position: true,
                        showTryAgainMessage: true,
                        probability: true,
                        voucherValidityDays: true,
                        voucherRedemptionLimit: true
                    }
                },
                socialTasks: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' }
                },
                template: {
                    select: {
                        id: true,
                        name: true,
                        componentKey: true,
                        configSchema: true
                    }
                }
            }
        });
    }

    if (!campaign || campaign.tenantId !== tenant.id) {
        return null;
    }

    return {
        campaign: {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            logoUrl: campaign.logoUrl,
            supportMobile: campaign.supportMobile,
            websiteUrl: campaign.websiteUrl,
            templateId: campaign.templateId,
            template: campaign.template,
            endDate: campaign.endDate,
            spinLimit: campaign.spinLimit,
            referralsRequiredForSpin: campaign.referralsRequiredForSpin,
            spinCooldown: campaign.spinCooldown,
            tenantId: campaign.tenantId,
            rulesText: campaign.rulesText,
            autoGenerateRules: campaign.autoGenerateRules
        },
        prizes: campaign.prizes,
        socialTasks: campaign.socialTasks
    };
}

// Cache campaigns for 5 minutes per tenant
const getCachedCampaign = unstable_cache(
    getCampaignData,
    ['campaign'],
    { revalidate: 300 }
);

export async function GET(req: NextRequest) {
    try {
        const campaignId = req.nextUrl.searchParams.get('id') || 'campaign-default';
        const tenantId = req.nextUrl.searchParams.get('tenantId');
        const tenantSlug = req.nextUrl.searchParams.get('tenantSlug') || 'default';

        const result = await getCachedCampaign(tenantSlug, tenantId, campaignId);

        if (!result) {
            // Check tenant for better error messages
            const tenant = tenantId
                ? await prisma.tenant.findUnique({ where: { id: tenantId } })
                : await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

            if (!tenant) {
                return NextResponse.json({
                    error: `Tenant not found with slug: ${tenantSlug}. Please run database seed.`
                }, { status: 404 });
            }

            if (!tenant.isActive) {
                return NextResponse.json({ error: 'Tenant is inactive' }, { status: 403 });
            }

            // Check if campaign exists but outside date range
            const anyCampaign = await prisma.campaign.findFirst({
                where: {
                    tenantId: tenant.id,
                    isActive: true
                }
            });

            if (anyCampaign) {
                return NextResponse.json({
                    error: `No active campaign found for tenant: ${tenantSlug}. The campaign exists but is not currently scheduled (check start/end dates).`
                }, { status: 404 });
            }

            return NextResponse.json({
                error: `No active campaign found for tenant: ${tenantSlug}. Please create a campaign.`
            }, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
