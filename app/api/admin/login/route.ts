import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // First, check if it's a Super Admin
        const superAdmin = await prisma.admin.findUnique({
            where: { email },
        });

        if (superAdmin) {
            const passwordMatch = await bcrypt.compare(password, superAdmin.password);

            if (!passwordMatch) {
                return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
            }

            // Ensure isSuperAdmin is explicitly true
            const isSuperAdmin = superAdmin.isSuperAdmin === true;

            return NextResponse.json({
                success: true,
                admin: {
                    id: superAdmin.id,
                    email: superAdmin.email,
                    name: superAdmin.name,
                    isSuperAdmin: isSuperAdmin,
                },
                tenantId: null,
                token: 'mock-super-admin-token'
            });
        }

        // If not Super Admin, check if it's a Tenant Admin
        const tenantAdmin = await prisma.tenantAdmin.findUnique({
            where: { email },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                        isLocked: true
                    }
                }
            }
        });

        if (!tenantAdmin) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if tenant is locked (security feature)
        if (tenantAdmin.tenant.isLocked) {
            return NextResponse.json({ 
                error: 'Account locked due to security concerns. Please contact support.' 
            }, { status: 403 });
        }

        // Check if tenant is active
        if (!tenantAdmin.tenant.isActive) {
            return NextResponse.json({ error: 'Tenant account is inactive' }, { status: 403 });
        }

        const passwordMatch = await bcrypt.compare(password, tenantAdmin.password);

        if (!passwordMatch) {
            // Track failed login attempt
            await securityService.trackFailedLogin(tenantAdmin.tenantId);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Reset failed login count on successful login
        await prisma.tenant.update({
            where: { id: tenantAdmin.tenantId },
            data: {
                failedLoginCount: 0,
                lastFailedLogin: null
            }
        });

        return NextResponse.json({
            success: true,
            admin: {
                id: tenantAdmin.id,
                email: tenantAdmin.email,
                name: tenantAdmin.name,
                isSuperAdmin: false,
            },
            tenantId: tenantAdmin.tenantId,
            tenant: {
                id: tenantAdmin.tenant.id,
                name: tenantAdmin.tenant.name,
                slug: tenantAdmin.tenant.slug,
            },
            token: 'mock-tenant-admin-token'
        });
    } catch (error: any) {
        console.error('Admin login error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
