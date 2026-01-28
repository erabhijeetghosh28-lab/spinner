import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        // Get both Plan models with tenant counts
        const [legacyPlans, subscriptionPlans] = await Promise.all([
            prisma.plan.findMany({
                include: {
                    _count: {
                        select: {
                            tenants: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.subscriptionPlan.findMany({
                where: { isActive: true },
                include: {
                    _count: {
                        select: {
                            tenants: true
                        }
                    }
                },
                orderBy: { price: 'asc' }
            })
        ]);

        // Combine both plan types with a type indicator
        const allPlans = [
            ...legacyPlans.map(plan => ({
                ...plan,
                type: 'legacy',
                displayName: `${plan.name} (Legacy)`
            })),
            ...subscriptionPlans.map(plan => ({
                ...plan,
                type: 'subscription',
                displayName: plan.name
            }))
        ];

        return NextResponse.json({ 
            plans: allPlans,
            legacyPlans,
            subscriptionPlans
        });
    } catch (error: any) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch plans',
            details: error.message
        }, { status: 500 });
    }
}
