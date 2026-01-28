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

        // Get top referrers
        const topReferrers = await prisma.endUser.findMany({
            where: {
                tenantId,
                successfulReferrals: { gt: 0 }
            },
            select: {
                id: true,
                name: true,
                phone: true,
                successfulReferrals: true,
                bonusSpinsEarned: true,
                referralCode: true,
                createdAt: true,
                referrals: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: {
                successfulReferrals: 'desc'
            },
            take: 50
        });

        // Get total referral stats
        const totalUsers = await prisma.endUser.count({
            where: { tenantId }
        });

        const referredUsers = await prisma.endUser.count({
            where: {
                tenantId,
                referredById: { not: null }
            }
        });

        const usersWithReferrals = await prisma.endUser.count({
            where: {
                tenantId,
                successfulReferrals: { gt: 0 }
            }
        });

        return NextResponse.json({
            stats: {
                totalUsers,
                referredUsers,
                usersWithReferrals,
                referralRate: totalUsers > 0 ? ((referredUsers / totalUsers) * 100).toFixed(1) : '0.0'
            },
            topReferrers: topReferrers.map(user => ({
                id: user.id,
                name: user.name || 'Anonymous',
                phone: user.phone,
                successfulReferrals: user.successfulReferrals,
                bonusSpinsEarned: user.bonusSpinsEarned,
                referralCode: user.referralCode,
                createdAt: user.createdAt,
                referrals: user.referrals
            }))
        });
    } catch (error: any) {
        console.error('Error fetching referral stats:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
