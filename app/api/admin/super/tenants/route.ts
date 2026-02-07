import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                plan: true,
                subscriptionPlan: true,
                tenantAdmins: {
                    take: 1,
                    select: {
                        id: true,
                        email: true,
                        adminId: true,
                        name: true
                    }
                },
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
        const { name, slug, contactPhone, planId, isActive, waConfig, adminId, email, password } = await req.json();

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
                planId: 'plan-basic', // Required legacy planId
                subscriptionPlanId: planId, // The ID from frontend is actually a SubscriptionPlan ID
                isActive: isActive ?? true,
                waConfig: waConfig ? JSON.parse(JSON.stringify(waConfig)) : null,
            },
            include: { 
                plan: true,
                subscriptionPlan: true
            }
        });

        // Create the Tenant Admin if details are provided
        if (adminId || email) {
            const hashedPassword = await bcrypt.hash(password || 'Admin@123', 10);
            await prisma.tenantAdmin.create({
                data: {
                    tenantId: tenant.id,
                    adminId: adminId || null,
                    email: email || null,
                    password: hashedPassword,
                    name: name // Default name to tenant name
                }
            });
        }

        // NOTE: We intentionally no longer auto-create a default campaign or prizes for a new tenant.
        // Default campaigns create surprises for new users. Campaigns should be created explicitly
        // by tenant admins via the UI so they are aware of configuration and branding.

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
        const { id, name, slug, contactPhone, planId, isActive, waConfig, adminId, email } = body;
        const tenantAdminPassword = body.tenantAdminPassword || body.password;

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
        
        // Handle plan ID - only SubscriptionPlan is used now
        if (planId) {
            console.log('PUT /api/admin/super/tenants - Setting subscriptionPlanId:', planId);
            updateData.subscriptionPlanId = planId;
            // Note: planId (legacy) remains unchanged as it's a required field
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

        // Update Tenant Admin details if provided
        if ((tenantAdminPassword && tenantAdminPassword.trim()) || adminId !== undefined || email !== undefined) {
            // Find the tenant admin
            const tenantAdmin = await prisma.tenantAdmin.findFirst({
                where: { tenantId: id }
            });

            if (tenantAdmin) {
                const adminUpdateData: any = {};
                if (tenantAdminPassword && tenantAdminPassword.trim()) {
                    if (tenantAdminPassword.length < 6) {
                        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
                    }
                    adminUpdateData.password = await bcrypt.hash(tenantAdminPassword, 10);
                }
                
                if (adminId !== undefined) adminUpdateData.adminId = adminId || null;
                if (email !== undefined) adminUpdateData.email = email || null;

                await prisma.tenantAdmin.update({
                    where: { id: tenantAdmin.id },
                    data: adminUpdateData
                });
                console.log('PUT /api/admin/super/tenants - Tenant admin details updated');
            } else if (adminId || email) {
                // Create if missing
                const hashedPassword = await bcrypt.hash(tenantAdminPassword || 'Admin@123', 10);
                await prisma.tenantAdmin.create({
                    data: {
                        tenantId: id,
                        adminId: adminId || null,
                        email: email || null,
                        password: hashedPassword,
                        name: tenant.name
                    }
                });
                console.log('PUT /api/admin/super/tenants - Tenant admin created (was missing)');
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
