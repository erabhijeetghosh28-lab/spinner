/**
 * GET /api/admin/super/tenants/:id/usage
 * 
 * Returns detailed usage statistics for a specific tenant including:
 * - Current month usage with limits and percentages
 * - Previous month usage for comparison
 * - Usage trend (percentage change)
 * - Days until monthly reset
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { usageService } from '@/lib/usage-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add Super Admin authentication check
    // For now, proceeding without auth for implementation

    const { id } = await params;
    const tenantId = id;

    // Validate tenant ID is provided
    if (!tenantId) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TENANT_ID',
            message: 'Tenant ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Get usage with trend data using the usage service
    const usageData = await usageService.getUsageWithTrend(tenantId);

    // Return the usage data
    return NextResponse.json(usageData);
  } catch (error) {
    console.error('Error fetching tenant usage:', error);

    // Handle specific error cases
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant or subscription plan not found',
            details: error.message,
          },
        },
        { status: 404 }
      );
    }

    // Handle Prisma foreign key constraint errors (tenant doesn't exist)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        {
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
          },
        },
        { status: 404 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch tenant usage statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
