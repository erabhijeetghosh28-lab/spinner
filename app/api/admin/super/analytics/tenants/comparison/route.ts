/**
 * GET /api/admin/super/analytics/tenants/comparison
 * 
 * Tenant performance comparison endpoint for Super Admins.
 * Returns ranked list of all tenants with their performance metrics.
 * 
 * Requirements: 8.4, 8.5
 */

import { analyticsService } from '@/lib/analytics-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const tenantComparison = await analyticsService.getTenantComparison(limit);

    return NextResponse.json({
      topTenants: tenantComparison.topTenants,
      bottomTenants: tenantComparison.bottomTenants,
      allTenants: tenantComparison.allTenants
    });
  } catch (error) {
    console.error('Error fetching tenant comparison:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch tenant comparison',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
