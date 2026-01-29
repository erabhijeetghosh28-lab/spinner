import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');
        
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Fetch ALL grouped spins
        const groupedSpins = await prisma.spin.groupBy({
            by: ['userId', 'campaignId'],
            where: { 
                campaign: { tenantId } 
            },
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
            take: 10000 // Limit export to 10k rows for safety
        });

        // Bulk fetch details
        const userIds = groupedSpins.map(g => g.userId);
        const campaignIds = groupedSpins.map(g => g.campaignId);

        // Fetch distinct using sets to avoid large query if unnecessary duplicates
        const uniqueUserIds = [...new Set(userIds)];
        const uniqueCampaignIds = [...new Set(campaignIds)];

        const [users, campaigns] = await Promise.all([
            prisma.endUser.findMany({
                where: { id: { in: uniqueUserIds } },
                select: { id: true, name: true, phone: true, successfulReferrals: true, referralCode: true }
            }),
            prisma.campaign.findMany({
                where: { id: { in: uniqueCampaignIds } },
                select: { id: true, name: true }
            })
        ]);

        // Map data
        const rows = groupedSpins.map(g => {
            const user = users.find(u => u.id === g.userId);
            const campaign = campaigns.find(c => c.id === g.campaignId);
            return [
                user?.name || 'Anonymous',
                user?.phone || 'N/A',
                groupedSpins.find(gs => gs.userId === g.userId && gs.campaignId === g.campaignId)?._count.id || 0,
                user?.successfulReferrals || 0,
                campaign?.name || 'Unknown',
                g._max.spinDate ? new Date(g._max.spinDate).toISOString() : 'N/A'
            ];
        });

        const headers = ['User Name', 'Mobile Number', 'No of Spins', 'No of Referrals', 'Campaign Name', 'Last Active'];
        
        // CSV Generation
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="campaign-users-report-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error: any) {
        console.error('Error exporting campaign users:', error);
        return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
    }
}
