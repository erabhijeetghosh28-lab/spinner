import { getVouchers, getVoucherStats } from '@/lib/voucher-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/vouchers
 * 
 * Admin endpoint to list all vouchers with filters and statistics.
 * 
 * Query parameters:
 * - tenantId: string (required) - The tenant ID to filter vouchers
 * - status?: "all" | "active" | "redeemed" | "expired" - Filter by status
 * - search?: string - Search by voucher code or customer phone
 * - startDate?: string - Filter by creation date (ISO format)
 * - endDate?: string - Filter by creation date (ISO format)
 * - page?: number - Page number for pagination (default: 1)
 * - limit?: number - Items per page (default: 50)
 * 
 * Response:
 * - vouchers: array - List of vouchers with all details
 * - stats: object - Voucher statistics (total, active, redeemed, expired)
 * - pagination: object - Pagination metadata (page, limit, total, totalPages)
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5, 8.7
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Get required tenant ID (support both query param and header)
    const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Check if export is requested
    const isExport = searchParams.get('export') === 'true';

    // Parse optional filter parameters
    const status = searchParams.get('status') as 'all' | 'active' | 'redeemed' | 'expired' | null;
    const search = searchParams.get('search');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    // Parse dates if provided
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date format' },
        { status: 400 }
      );
    }
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid end date format' },
        { status: 400 }
      );
    }

    // Parse pagination parameters (skip pagination for export)
    const page = isExport ? 1 : (pageStr ? parseInt(pageStr, 10) : 1);
    const limit = isExport ? 10000 : (limitStr ? parseInt(limitStr, 10) : 50);

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }
    if (!isExport && (isNaN(limit) || limit < 1 || limit > 100)) {
      return NextResponse.json(
        { error: 'Invalid limit (must be between 1 and 100)' },
        { status: 400 }
      );
    }

    // Build filters object
    const filters = {
      status: status || 'all',
      search: search || undefined,
      startDate,
      endDate,
      page,
      limit,
    };

    // If export is requested, return CSV
    if (isExport) {
      const vouchersResult = await getVouchers(tenantId, filters);
      
      // Generate CSV
      const headers = ['Code', 'Customer Name', 'Customer Phone', 'Prize', 'Status', 'Created', 'Expires', 'Redeemed At'];
      const rows = vouchersResult.vouchers.map(v => [
        v.code,
        v.customer.name,
        v.customer.phone,
        v.prize.name,
        v.status,
        new Date(v.createdAt).toLocaleDateString(),
        new Date(v.expiresAt).toLocaleDateString(),
        v.redeemedAt ? new Date(v.redeemedAt).toLocaleDateString() : ''
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="vouchers-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Fetch vouchers and statistics in parallel
    const [vouchersResult, stats] = await Promise.all([
      getVouchers(tenantId, filters),
      getVoucherStats(tenantId),
    ]);

    // Return combined response
    return NextResponse.json({
      vouchers: vouchersResult.vouchers,
      stats,
      pagination: vouchersResult.pagination,
    });

  } catch (error: any) {
    console.error('[Vouchers List] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
