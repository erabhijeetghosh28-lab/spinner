import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Get tenant with plan to check if inventory tracking is allowed
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

        // Check subscription plan first, fallback to legacy plan
        const hasInventoryAccess = tenant.plan.allowInventoryTracking; // Only legacy plan has this feature
        
        if (!hasInventoryAccess) {
            return NextResponse.json({ error: 'Inventory Tracking feature not available for your plan' }, { status: 403 });
        }

        // Find all prizes with low stock
        const prizes = await prisma.prize.findMany({
            where: {
                campaign: { tenantId },
                currentStock: { not: null },
                lowStockAlert: { not: null }
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        const lowStockPrizes = prizes.filter(prize => {
            if (prize.currentStock === null || prize.lowStockAlert === null) return false;
            return prize.currentStock <= prize.lowStockAlert;
        });

        return NextResponse.json({
            alerts: lowStockPrizes.map(prize => ({
                prizeId: prize.id,
                prizeName: prize.name,
                campaignId: prize.campaign?.id || null,
                campaignName: prize.campaign?.name || 'Unknown',
                currentStock: prize.currentStock,
                lowStockAlert: prize.lowStockAlert,
                isOutOfStock: prize.currentStock === 0
            })),
            count: lowStockPrizes.length
        });
    } catch (error: any) {
        console.error('Error fetching stock alerts:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
