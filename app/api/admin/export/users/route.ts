import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

        // Fetch all users for this tenant
        const users = await prisma.endUser.findMany({
            where: { tenantId: tenantId },
            include: {
                _count: {
                    select: { referrals: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Generate CSV content
        const headers = ['Name', 'Phone', 'Email', 'Referral Code', 'Successful Referrals', 'Total Referrals', 'Created At'];
        const rows = users.map(user => [
            user.name || 'N/A',
            user.phone,
            user.email || 'N/A',
            user.referralCode || 'N/A',
            user.successfulReferrals.toString(),
            user._count.referrals.toString(),
            user.createdAt.toISOString()
        ]);

        // Create CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Escape commas and quotes in CSV
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(','))
        ].join('\n');

        // Return CSV file
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error: any) {
        console.error('Error exporting users:', error);
        return NextResponse.json({ 
            error: 'Failed to export users',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
