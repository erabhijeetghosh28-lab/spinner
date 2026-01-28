import { requireAdminAuth } from '@/lib/auth';
import { ensureMonthlyUsage, getOrCreateMonthlyUsage } from '@/lib/monthly-reset';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all campaigns for a tenant
export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Get tenant with plan info
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { 
                plan: true,
                subscriptionPlan: true 
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Get all campaigns for tenant (excluding archived by default, but can include them)
        const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true';
        const campaigns = await prisma.campaign.findMany({
            where: {
                tenantId: tenantId,
                ...(includeArchived ? {} : { isArchived: false }),
            },
            include: {
                template: {
                    select: {
                        id: true,
                        name: true,
                        componentKey: true
                    }
                },
                _count: {
                    select: {
                        prizes: true,
                        spins: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Check subscription plan first for features
        const allowAnalytics = tenant.subscriptionPlan?.advancedAnalytics || tenant.plan.allowAnalytics || false;
        const allowQRCodeGenerator = tenant.subscriptionPlan?.allowQRCodeGenerator || tenant.plan.allowQRCodeGenerator || false;
        const allowInventoryTracking = tenant.plan.allowInventoryTracking || false; // Only legacy plan has this

        return NextResponse.json({
            campaigns,
            plan: {
                maxCampaigns: tenant.plan.maxCampaigns,
                currentCount: campaigns.length,
                allowAnalytics,
                allowQRCodeGenerator,
                allowInventoryTracking
            }
        });
    } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

// POST: Create new campaign
export async function POST(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { tenantId, name, description, logoUrl, templateId, spinLimit, spinCooldown, referralsRequiredForSpin, prizes, supportMobile, websiteUrl } = await req.json();

        if (!tenantId || !name) {
            return NextResponse.json({ error: 'Tenant ID and name are required' }, { status: 400 });
        }

        // Get tenant with subscription plan info
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                plan: true,
                subscriptionPlan: true,
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

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Get or create monthly usage record (event-based, auto-handles month transitions)
        const usage = await getOrCreateMonthlyUsage(tenantId);
        
        if (!usage) {
            return NextResponse.json({ error: 'Failed to initialize monthly usage' }, { status: 500 });
        }
        
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Determine limits based on subscription plan
        const subscriptionPlan = tenant.subscriptionPlan;
        let activeLimit = 0;
        let monthlyLimit = 0;
        let planName = '';

        if (subscriptionPlan) {
            // Use subscription plan limits
            activeLimit = subscriptionPlan.campaignsPerMonth;
            monthlyLimit = subscriptionPlan.campaignsPerMonth;
            planName = subscriptionPlan.name;
        } else {
            // Fallback to legacy plan limits
            activeLimit = tenant.plan.maxCampaigns;
            monthlyLimit = tenant.plan.maxCampaigns;
            planName = tenant.plan.name;
        }

        const activeCount = tenant._count.campaigns;
        const monthlyCount = usage.campaignsCreated;

        // Check active campaign limit
        if (activeCount >= activeLimit) {
            return NextResponse.json({
                error: `Active campaign limit reached. Your plan (${planName}) allows ${activeLimit} active campaign(s). Please archive an existing campaign to create a new one.`,
                limitType: 'active',
            }, { status: 403 });
        }

        // Check monthly creation limit
        if (monthlyCount >= monthlyLimit) {
            return NextResponse.json({
                error: `Monthly campaign creation limit reached. Your plan (${planName}) allows ${monthlyLimit} campaign(s) per month. You've already created ${monthlyCount} this month.`,
                limitType: 'monthly',
            }, { status: 403 });
        }

        // Auto-calculate dates based on plan's campaignDurationDays
        const campaignDurationDays = tenant.plan.campaignDurationDays || 30; // Default to 30 days if not set
        const start = now;
        const end = new Date(now);
        end.setDate(end.getDate() + campaignDurationDays);

        // Create campaign and prizes in a transaction, and increment usage
        const result = await prisma.$transaction(async (tx) => {
            const campaign = await tx.campaign.create({
                data: {
                    tenantId,
                    name: name.trim(),
                    description: description ? description.trim() : null,
                    logoUrl: logoUrl ? logoUrl.trim() : null,
                    templateId: templateId && templateId.trim() !== '' ? templateId : null,
                    supportMobile: supportMobile ? supportMobile.trim() : null,
                    websiteUrl: websiteUrl ? websiteUrl.trim() : null,
                    spinLimit: parseInt(String(spinLimit)) || 1,
                    spinCooldown: parseInt(String(spinCooldown)) || 24,
                    referralsRequiredForSpin: parseInt(String(referralsRequiredForSpin)) || 0,
                    startDate: start,
                    endDate: end,
                    isActive: true,
                    isArchived: false,
                }
            });

            // Ensure monthly usage exists (handles month transitions)
            await ensureMonthlyUsage(tenantId);
            
            // Increment monthly campaign creation count
            await tx.tenantUsage.update({
                where: {
                    tenantId_month: {
                        tenantId: tenantId,
                        month: currentMonth,
                    },
                },
                data: {
                    campaignsCreated: {
                        increment: 1,
                    },
                },
            });

            // Create prizes if provided
            if (prizes && Array.isArray(prizes)) {
                await Promise.all(prizes.map((prize: any, idx: number) =>
                    tx.prize.create({
                        data: {
                            campaignId: campaign.id,
                            tenantId: tenantId,
                            name: prize.name,
                            couponCode: prize.couponCode ? prize.couponCode.trim().toUpperCase() : null,
                            probability: parseFloat(prize.probability) || 0,
                            dailyLimit: parseInt(prize.dailyLimit) || 0,
                            isActive: prize.isActive !== false,
                            position: prize.position ?? idx,
                            colorCode: prize.colorCode || '#1E3A8A',
                            currentStock: prize.currentStock !== undefined ? prize.currentStock : null,
                            lowStockAlert: prize.lowStockAlert !== undefined ? prize.lowStockAlert : null
                        }
                    })
                ));
            }

            return campaign;
        });

        return NextResponse.json({ success: true, campaign: result });
    } catch (error: any) {
        console.error('Error creating campaign:', error);
        // Return more detailed error message
        const errorMessage = error.message || 'Failed to create campaign';
        return NextResponse.json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

// PUT: Update campaign
export async function PUT(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { campaignId, tenantId, name, description, logoUrl, templateId, spinLimit, spinCooldown, referralsRequiredForSpin, isActive, prizes, supportMobile, websiteUrl } = await req.json();

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
        if (name !== undefined) updateData.name = typeof name === 'string' ? name.trim() : name;
        if (description !== undefined) updateData.description = description ? (typeof description === 'string' ? description.trim() : description) : null;
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl ? (typeof logoUrl === 'string' ? logoUrl.trim() : logoUrl) : null;
        if (templateId !== undefined) updateData.templateId = templateId && String(templateId).trim() !== '' ? templateId : null;
        if (supportMobile !== undefined) updateData.supportMobile = supportMobile ? (typeof supportMobile === 'string' ? supportMobile.trim() : supportMobile) : null;
        if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl ? (typeof websiteUrl === 'string' ? websiteUrl.trim() : websiteUrl) : null;
        if (spinLimit !== undefined) updateData.spinLimit = parseInt(String(spinLimit)) || 1;
        if (spinCooldown !== undefined) updateData.spinCooldown = parseInt(String(spinCooldown)) || 24;
        if (referralsRequiredForSpin !== undefined) updateData.referralsRequiredForSpin = parseInt(String(referralsRequiredForSpin)) || 0;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;

        // Note: Dates are auto-managed based on plan's campaignDurationDays
        // When updating, we don't change dates unless explicitly needed
        // For now, we keep existing dates on update

        const updatedCampaign = await prisma.$transaction(async (tx) => {
            // Update campaign basics
            const updated = await tx.campaign.update({
                where: { id: campaignId },
                data: updateData
            });

            // Update prizes if provided
            if (prizes && Array.isArray(prizes)) {
                const existingPrizes = await tx.prize.findMany({
                    where: { campaignId }
                });

                const incomingIds = prizes.map(p => p.id).filter(id => !!id);
                const toDelete = existingPrizes.filter(p => !incomingIds.includes(p.id));

                // Delete missing prizes
                if (toDelete.length > 0) {
                    await tx.prize.deleteMany({
                        where: { id: { in: toDelete.map(p => p.id) } }
                    });
                }

                // Update or Create prizes
                await Promise.all(prizes.map((prize: any, idx: number) => {
                    const prizeData = {
                        name: prize.name,
                        couponCode: prize.couponCode ? prize.couponCode.trim().toUpperCase() : null,
                        probability: parseFloat(prize.probability) || 0,
                        dailyLimit: parseInt(prize.dailyLimit) || 0,
                        isActive: prize.isActive !== false,
                        position: prize.position ?? idx,
                        colorCode: prize.colorCode || '#1E3A8A',
                        currentStock: prize.currentStock !== undefined ? prize.currentStock : null,
                        lowStockAlert: prize.lowStockAlert !== undefined ? prize.lowStockAlert : null
                    };

                    if (prize.id) {
                        return tx.prize.update({
                            where: { id: prize.id },
                            data: prizeData
                        });
                    } else {
                        return tx.prize.create({
                            data: {
                                ...prizeData,
                                campaignId,
                                tenantId
                            }
                        });
                    }
                }));
            }

            return updated;
        });

        return NextResponse.json({ success: true, campaign: updatedCampaign });
    } catch (error: any) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({
            error: error.message || 'Failed to update campaign',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

// DELETE: Archive campaign (soft delete)
export async function DELETE(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { campaignId, tenantId } = await req.json();

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

        // Soft delete: Archive the campaign instead of deleting
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                isActive: false,
                isArchived: true,
                archivedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true, message: 'Campaign archived successfully' });
    } catch (error: any) {
        console.error('Error archiving campaign:', error);
        return NextResponse.json({
            error: error.message || 'Failed to archive campaign',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
