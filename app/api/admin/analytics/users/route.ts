import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');
        const campaignIdParam = req.nextUrl.searchParams.get('campaignId');
        const campaignId = campaignIdParam && campaignIdParam.trim() !== '' ? campaignIdParam : null;
        const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // 1. Group spins by User and Campaign to get participation stats
        // Note: Prisma groupBy doesn't support pagination easily with rich data, 
        // so we'll fetch a reasonable amount or all if dataset is small.
        // For scalability, we might need a raw query or better strategy later.
        // For now, allow fetching "recent" activity.
        
        // Actually, we can just fetch Spins with distinct [userId, campaignId] but Prisma Distinct is limited.
        // Let's use groupBy.
        const groupWhere: any = campaignId ? { campaignId } : { campaign: { tenantId } };

        const groupedSpins = await prisma.spin.groupBy({
            by: ['userId', 'campaignId'],
            where: groupWhere,
            _count: {
                id: true
            },
            _max: {
                spinDate: true
            },
            orderBy: {
                _max: {
                    spinDate: 'desc'
                }
            },
            take: limit, // Simple cursor-like pagination on the groups
            skip: skip
        });

        // Get total count of groups (expensive?)
        // optimize: separate count query or just use a large arbitrary number
        const totalGroups = await prisma.spin.groupBy({
             by: ['userId', 'campaignId'],
             where: groupWhere,
             _count: { _all: true }
        }).then(res => res.length);


        // 2. Fetch related User and Campaign details
        const userIds = groupedSpins.map(g => g.userId);
        const campaignIds = groupedSpins.map(g => g.campaignId);

        const [users, campaigns] = await Promise.all([
            prisma.endUser.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true, phone: true, successfulReferrals: true, referralCode: true }
            }),
            prisma.campaign.findMany({
                where: { id: { in: campaignIds } },
                select: { id: true, name: true }
            })
        ]);

        // 3. Map back to result
        const data = groupedSpins.map(g => {
            const user = users.find(u => u.id === g.userId);
            const campaign = campaigns.find(c => c.id === g.campaignId);
            return {
                userId: g.userId,
                campaignId: g.campaignId,
                userName: user?.name || 'Anonymous',
                userPhone: user?.phone || 'N/A',
                referralCount: user?.successfulReferrals || 0,
                referralCode: user?.referralCode || '',
                campaignName: campaign?.name || 'Unknown',
                spinCount: g._count.id,
                lastActive: g._max.spinDate
            };
        });

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total: totalGroups,
                pages: Math.ceil(totalGroups / limit)
            }
        });

    } catch (error: any) {
        console.error('Error fetching user analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch user analytics' }, { status: 500 });
    }
}
