import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, slug, phone } = await req.json();

        // 1. Basic validation
        if (!name || !email || !password || !slug) {
            return NextResponse.json({ 
                error: 'Company name, email, password, and slug are required' 
            }, { status: 400 });
        }

        // 2. Validate uniqueness of email and slug
        const existingAdmin = await prisma.tenantAdmin.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        const existingTenant = await prisma.tenant.findUnique({
            where: { slug }
        });

        if (existingTenant) {
            return NextResponse.json({ error: 'Slug already taken' }, { status: 400 });
        }

        // 3. Get or Create Default Plan
        let defaultPlan = await prisma.plan.findUnique({
            where: { id: 'plan-basic' }
        });

        if (!defaultPlan) {
            // Create a basic plan if it doesn't exist
            defaultPlan = await prisma.plan.create({
                data: {
                    id: 'plan-basic',
                    name: 'Basic',
                    maxSpins: 1000,
                    maxCampaigns: 1,
                    price: 0
                }
            });
        }

        // 4. Get or Create Default Subscription Plan
        let defaultSubPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: 'sub-plan-free' }
        });

        if (!defaultSubPlan) {
            defaultSubPlan = await prisma.subscriptionPlan.create({
                data: {
                    id: 'sub-plan-free',
                    name: 'Free',
                    price: 0,
                    interval: 'MONTHLY',
                    campaignsPerMonth: 1,
                    spinsPerCampaign: 500
                }
            });
        }

        // 5. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Create Tenant and Admin in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    slug: slug.toLowerCase(),
                    contactPhone: phone || null,
                    planId: defaultPlan.id,
                    subscriptionPlanId: defaultSubPlan.id,
                    subscriptionStatus: 'TRIAL',
                    isActive: true
                }
            });

            const admin = await tx.tenantAdmin.create({
                data: {
                    tenantId: tenant.id,
                    email,
                    password: hashedPassword,
                    name: name // Use company name as admin name initially
                }
            });

            return { tenant, admin };
        });

        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            tenantId: result.tenant.id,
            admin: {
                id: result.admin.id,
                email: result.admin.email,
                name: result.admin.name
            },
            tenant: {
                id: result.tenant.id,
                name: result.tenant.name,
                slug: result.tenant.slug
            },
            token: 'mock-registered-token' // In real app, generate a real JWT
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ 
            error: 'Internal server error during registration',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
