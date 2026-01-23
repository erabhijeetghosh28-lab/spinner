import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const today = new Date();
        const dayStart = startOfDay(today);
        const dayEnd = endOfDay(today);

        // Platform-wide stats
        const totalTenants = await prisma.tenant.count();
        const activeTenants = await prisma.tenant.count({ where: { isActive: true } });
        const totalUsers = await prisma.endUser.count();
        const totalSpins = await prisma.spin.count();
        const spinsToday = await prisma.spin.count({
            where: { spinDate: { gte: dayStart, lte: dayEnd } }
        });
        const totalCampaigns = await prisma.campaign.count();
        const activeCampaigns = await prisma.campaign.count({ where: { isActive: true } });

        // Recent activity
        const recentTenants = await prisma.tenant.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                plan: true,
                _count: {
                    select: { campaigns: true, endUsers: true }
                }
            }
        });

        // Top tenants by user count
        const topTenants = await prisma.tenant.findMany({
            take: 5,
            include: {
                plan: true,
                _count: {
                    select: { endUsers: true, campaigns: true }
                }
            },
            orderBy: {
                endUsers: {
                    _count: 'desc'
                }
            }
        });

        return NextResponse.json({
            stats: {
                totalTenants,
                activeTenants,
                totalUsers,
                totalSpins,
                spinsToday,
                totalCampaigns,
                activeCampaigns,
            },
            recentTenants,
            topTenants
        });
    } catch (error: any) {
        console.error('Error fetching super admin stats:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
