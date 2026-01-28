/**
 * GET /api/admin/super/audit-logs
 * 
 * Audit log query endpoint for Super Admins.
 * Provides comprehensive audit trail with filtering and pagination.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - adminId: Filter by admin ID
 * - action: Filter by action type
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * 
 * Requirements: 9.8, 9.9, 9.10
 */

import { auditService } from '@/lib/audit-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check

    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Filters
    const adminId = searchParams.get('adminId') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Parse dates
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Query logs
    const result = await auditService.queryLogs({
      page,
      limit,
      adminId,
      action,
      startDate,
      endDate
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch audit logs',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
