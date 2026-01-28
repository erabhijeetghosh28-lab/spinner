import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                plan: true,
                _count: {
                    select: {
                        campaigns: true,
                        endUsers: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ tenants });
    } catch (error: any) {
        console.error('Error fetching tenants:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch tenants',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, slug, contactPhone, planId, isActive, waConfig } = await req.json();

        if (!name || !slug || !planId) {
            return NextResponse.json({ error: 'Name, slug, and planId are required' }, { status: 400 });
        }

        // Check if slug is unique
        const existing = await prisma.tenant.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }

        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug,
                contactPhone: contactPhone || null,
                planId,
                isActive: isActive ?? true,
                waConfig: waConfig ? JSON.parse(JSON.stringify(waConfig)) : null,
            },
            include: { plan: true }
        });

        // Automatically create a default campaign for the new tenant
        try {
            // Get the Classic template (default template), fallback to first active template
            let template = await prisma.wheelTemplate.findFirst({
                where: { componentKey: 'Classic', isActive: true }
            });

            // Fallback to any active template if Classic not found
            if (!template) {
                template = await prisma.wheelTemplate.findFirst({
                    where: { isActive: true }
                });
            }

            if (!template) {
                console.warn('No active templates found, skipping default campaign creation');
            } else {
                // Create default campaign
                const defaultCampaign = await prisma.campaign.create({
                    data: {
                        tenantId: tenant.id,
                        templateId: template.id,
                        name: `${name} - Spin & Win Campaign`,
                        description: 'Try your luck and win exciting prizes!',
                        isActive: true,
                        spinLimit: 1,
                        spinCooldown: 24,
                        referralsRequiredForSpin: 0, // Disabled by default
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                    },
                });

                // Create default prizes for the campaign
                const defaultPrizes = [
                    {
                        campaignId: defaultCampaign.id,
                        name: '50% Off',
                        description: 'Get 50% discount on your next purchase',
                        couponCode: 'SAVE50',
                        probability: 20,
                        dailyLimit: 10,
                        totalLimit: 100,
                        colorCode: '#FFD700',
                        position: 0,
                        isActive: true,
                    },
                    {
                        campaignId: defaultCampaign.id,
                        name: 'Free Shipping',
                        description: 'Free shipping on your order',
                        couponCode: 'FREESHIP',
                        probability: 20,
                        dailyLimit: 20,
                        totalLimit: 200,
                        colorCode: '#1E3A8A',
                        position: 1,
                        isActive: true,
                    },
                    {
                        campaignId: defaultCampaign.id,
                        name: '₹100 Off',
                        description: 'Get ₹100 off on orders above ₹500',
                        couponCode: 'SAVE100',
                        probability: 20,
                        dailyLimit: 15,
                        totalLimit: 150,
                        colorCode: '#FFD700',
                        position: 2,
                        isActive: true,
                    },
                    {
                        campaignId: defaultCampaign.id,
                        name: 'Buy 1 Get 1',
                        description: 'Buy one get one free',
                        couponCode: 'BOGO',
                        probability: 20,
                        dailyLimit: 5,
                        totalLimit: 50,
                        colorCode: '#1E3A8A',
                        position: 3,
                        isActive: true,
                    },
                    {
                        campaignId: defaultCampaign.id,
                        name: 'No Prize',
                        description: 'Better luck next time!',
                        couponCode: null,
                        probability: 20,
                        dailyLimit: 999,
                        totalLimit: null,
                        colorCode: '#1E3A8A',
                        position: 4,
                        isActive: true,
                    },
                ];

                await prisma.prize.createMany({
                    data: defaultPrizes,
                });

                console.log(`✅ Default campaign and prizes created for tenant: ${tenant.name}`);
            }
        } catch (error: any) {
            // Log error but don't fail tenant creation
            console.error('Error creating default campaign for tenant:', error);
            // Continue - tenant is already created, campaign can be created manually later
        }

        return NextResponse.json({ success: true, tenant });
    } catch (error: any) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ 
            error: 'Failed to create tenant',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, slug, contactPhone, planId, isActive, waConfig, tenantAdminPassword } = body;

        console.log('PUT /api/admin/super/tenants - Request body:', JSON.stringify(body, null, 2));

        if (!id) {
            console.error('PUT /api/admin/super/tenants - Missing tenant ID');
            return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
        }

        // Verify tenant exists
        const existingTenant = await prisma.tenant.findUnique({
            where: { id }
        });

        if (!existingTenant) {
            console.error('PUT /api/admin/super/tenants - Tenant not found:', id);
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (slug) {
            // Check if slug is unique (excluding current tenant)
            const existing = await prisma.tenant.findFirst({
                where: { slug, id: { not: id } }
            });
            if (existing) {
                console.error('PUT /api/admin/super/tenants - Slug already exists:', slug);
                return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
            }
            updateData.slug = slug;
        }
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null;
        
        // Handle plan ID - check if it's a legacy Plan or SubscriptionPlan
        if (planId) {
            console.log('PUT /api/admin/super/tenants - Checking planId:', planId);
            
            // Check if it's a legacy Plan ID
            const legacyPlan = await prisma.plan.findUnique({
                where: { id: planId }
            });
            
            // Check if it's a SubscriptionPlan ID
            const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
                where: { id: planId }
            });
            
            if (legacyPlan) {
                console.log('PUT /api/admin/super/tenants - Using legacy plan:', legacyPlan.name);
                updateData.planId = planId;
                // Clear subscriptionPlanId if switching to legacy plan
                updateData.subscriptionPlanId = null;
            } else if (subscriptionPlan) {
                console.log('PUT /api/admin/super/tenants - Using subscription plan:', subscriptionPlan.name);
                // For subscription plans, set subscriptionPlanId
                updateData.subscriptionPlanId = planId;
                // Don't modify planId - it must remain set to a valid legacy Plan ID
                // The tenant must always have a valid planId (required field)
            } else {
                console.error('PUT /api/admin/super/tenants - Invalid plan ID:', planId);
                return NextResponse.json({ 
                    error: 'Invalid plan ID',
                    details: `Plan ID "${planId}" not found in either Plan or SubscriptionPlan tables`
                }, { status: 400 });
            }
        }
        
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        if (waConfig !== undefined) {
            updateData.waConfig = waConfig ? JSON.parse(JSON.stringify(waConfig)) : null;
        }

        console.log('PUT /api/admin/super/tenants - Update data:', JSON.stringify(updateData, null, 2));

        const tenant = await prisma.tenant.update({
            where: { id },
            data: updateData,
            include: { 
                plan: true,
                subscriptionPlan: true
            }
        });

        console.log('PUT /api/admin/super/tenants - Tenant updated successfully:', tenant.id);

        // Update Tenant Admin password if provided
        if (tenantAdminPassword && tenantAdminPassword.trim()) {
            if (tenantAdminPassword.length < 6) {
                console.error('PUT /api/admin/super/tenants - Password too short');
                return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(tenantAdminPassword, 10);
            
            // Find and update the tenant admin
            const tenantAdmin = await prisma.tenantAdmin.findFirst({
                where: { tenantId: id }
            });

            if (tenantAdmin) {
                await prisma.tenantAdmin.update({
                    where: { id: tenantAdmin.id },
                    data: { password: hashedPassword }
                });
                console.log('PUT /api/admin/super/tenants - Tenant admin password updated');
            } else {
                console.warn('PUT /api/admin/super/tenants - No tenant admin found for tenant:', id);
            }
        }

        return NextResponse.json({ success: true, tenant });
    } catch (error: any) {
        console.error('PUT /api/admin/super/tenants - Error updating tenant:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Return detailed error in all environments for debugging
        return NextResponse.json({ 
            error: 'Failed to update tenant',
            details: error.message,
            errorName: error.name,
            errorCode: error.code
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('id');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
        }

        // Check if tenant exists
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                _count: {
                    select: {
                        campaigns: true,
                        endUsers: true,
                        tenantAdmins: true,
                    }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Delete tenant (cascades to campaigns, admins, usage, etc. per schema)
        await prisma.tenant.delete({
            where: { id: tenantId }
        });

        console.log(`✅ Tenant deleted: ${tenant.name} (ID: ${tenantId})`);

        return NextResponse.json({ 
            success: true,
            message: `Tenant "${tenant.name}" and all associated data have been deleted`
        });
    } catch (error: any) {
        console.error('Error deleting tenant:', error);
        
        // Handle foreign key constraint errors
        if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
            return NextResponse.json({ 
                error: 'Cannot delete tenant: There are still references to this tenant in the database',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }, { status: 400 });
        }

        return NextResponse.json({ 
            error: 'Failed to delete tenant',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
