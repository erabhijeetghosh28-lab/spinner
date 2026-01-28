import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        // Get total tenants
        const totalTenants = await prisma.tenant.count();
        
        // Get active tenants
        const activeTenants = await prisma.tenant.count({
            where: { isActive: true }
        });
        
        // Get total revenue (sum of all subscription plan prices for active tenants)
        const tenantsWithPlans = await prisma.tenant.findMany({
            where: { isActive: true },
            include: {
                subscriptionPlan: true
            }
        });
        
        const totalRevenue = tenantsWithPlans.reduce((sum, tenant) => {
            if (tenant.subscriptionPlan) {
                return sum + tenant.subscriptionPlan.price;
            }
            return sum;
        }, 0);
        
        // Calculate MRR (Monthly Recurring Revenue)
        const mrr = tenantsWithPlans.reduce((sum, tenant) => {
            if (tenant.subscriptionPlan) {
                // Convert to monthly based on billing cycle
                if (tenant.subscriptionPlan.billingCycle === 'MONTHLY') {
                    return sum + tenant.subscriptionPlan.price;
                } else if (tenant.subscriptionPlan.billingCycle === 'YEARLY') {
                    return sum + (tenant.subscriptionPlan.price / 12);
                }
            }
            return sum;
        }, 0);
        
        // Get total campaigns
        const totalCampaigns = await prisma.campaign.count();
        
        // Get active campaigns
        const activeCampaigns = await prisma.campaign.count({
            where: { isActive: true }
        });
        
        // Get total users
        const totalUsers = await prisma.endUser.count();
        
        // Get total vouchers
        const totalVouchers = await prisma.voucher.count();

        const stats = {
            totalTenants,
            activeTenants,
            totalRevenue,
            mrr,
            totalCampaigns,
            activeCampaigns,
            totalUsers,
            totalVouchers
        };

        return NextResponse.json({ stats });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch stats',
            details: error.message
        }, { status: 500 });
    }
}
