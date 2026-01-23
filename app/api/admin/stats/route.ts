import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        const today = new Date();
        const dayStart = startOfDay(today);
        const dayEnd = endOfDay(today);

        // Get first active campaign for tenant
        const campaign = await prisma.campaign.findFirst({
            where: {
                tenantId: tenantId,
                isActive: true
            }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'No active campaign found' }, { status: 404 });
        }

        // Get Total Spins Today (tenant-scoped)
        const spinsToday = await prisma.spin.count({
            where: {
                campaignId: campaign.id,
                spinDate: { gte: dayStart, lte: dayEnd }
            }
        });

        // Get Total Users (tenant-scoped)
        const totalUsers = await prisma.endUser.count({
            where: { tenantId: tenantId }
        });

        // Get Prizes Won Today (tenant-scoped)
        // Ensure we only count real prizes, excluding "No Prize", "No Offer" etc.
        const prizesWonToday = await prisma.spin.count({
            where: {
                campaignId: campaign.id,
                wonPrize: true,
                prize: {
                    NOT: [
                        { name: { contains: 'No Prize', mode: 'insensitive' } },
                        { name: { contains: 'No Offer', mode: 'insensitive' } }
                    ]
                },
                spinDate: { gte: dayStart, lte: dayEnd }
            }
        });

        // Get Recent Users with Referral Count (tenant-scoped)
        const recentUsers = await prisma.endUser.findMany({
            where: { tenantId: tenantId },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                phone: true,
                name: true,
                email: true,
                createdAt: true,
                _count: {
                    select: { referrals: true }
                }
            }
        });

        // Get Prize Stats (campaign-scoped)
        const prizeStats = await prisma.prize.findMany({
            where: { campaignId: campaign.id },
            include: {
                _count: {
                    select: {
                        spins: {
                            where: { wonPrize: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            stats: {
                spinsToday,
                totalUsers,
                prizesWonToday,
                conversionRate: spinsToday > 0 ? Number(((prizesWonToday / spinsToday) * 100).toFixed(1)) : 0
            },
            campaign: {
                id: campaign.id,
                spinLimit: campaign.spinLimit,
                spinCooldown: campaign.spinCooldown,
                referralsRequiredForSpin: campaign.referralsRequiredForSpin,
                logoUrl: campaign.logoUrl,
                templateId: campaign.templateId
            },
            prizeDistribution: prizeStats.map((p: any) => ({
                name: p.name,
                count: p._count.spins,
                limit: p.dailyLimit,
                isActive: p.isActive
            })),
            recentUsers: recentUsers.map((u: any) => ({
                ...u,
                referralCount: u._count.referrals
            }))
        });
    } catch (error: any) {
        console.error('Admin stats error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
