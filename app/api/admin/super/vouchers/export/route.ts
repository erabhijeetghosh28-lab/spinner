/**
 * GET /api/admin/super/vouchers/export
 * 
 * Exports vouchers to CSV format with same filtering as the list endpoint.
 * 
 * Query Parameters: Same as GET /api/admin/super/vouchers
 * - search, tenantId, status, startDate, endDate
 * 
 * Requirements: 6.9
 */

import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check

    const searchParams = request.nextUrl.searchParams;
    
    // Search and filters (same as list endpoint)
    const search = searchParams.get('search');
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } }
      ];
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (status) {
      const now = new Date();
      if (status === 'active') {
        where.isRedeemed = false;
        where.expiresAt = { gt: now };
      } else if (status === 'redeemed') {
        where.isRedeemed = true;
      } else if (status === 'expired') {
        where.isRedeemed = false;
        where.expiresAt = { lte: now };
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch all matching vouchers (no pagination for export)
    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        tenant: {
          select: {
            name: true,
            slug: true
          }
        },
        user: {
          select: {
            phone: true,
            name: true
          }
        },
        prize: {
          select: {
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generate CSV
    const headers = [
      'Voucher Code',
      'Tenant',
      'Customer Phone',
      'Customer Name',
      'Prize',
      'Prize Description',
      'Status',
      'Created At',
      'Expires At',
      'Redeemed At',
      'QR Code URL'
    ];

    const rows = vouchers.map(v => {
      const now = new Date();
      let status = 'Active';
      if (v.isRedeemed) {
        status = 'Redeemed';
      } else if (v.expiresAt && v.expiresAt < now) {
        status = 'Expired';
      }

      return [
        v.code,
        v.tenant.name,
        v.user.phone || '',
        v.user.name || '',
        v.prize.name,
        v.prize.description || '',
        status,
        v.createdAt.toISOString(),
        v.expiresAt?.toISOString() || '',
        v.redeemedAt?.toISOString() || '',
        v.qrImageUrl || ''
      ];
    });

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="vouchers-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting vouchers:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to export vouchers',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
