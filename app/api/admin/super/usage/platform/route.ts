/**
 * GET /api/admin/super/usage/platform
 * 
 * Returns platform-wide usage statistics including:
 * - Total spins across all tenants
 * - Total vouchers across all tenants
 * - Active tenants count
 * - Total tenants count
 * 
 * Requirements: 2.1, 5.7
 */

import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check
    // For now, proceeding without auth for implementation

    // Get current month and year for usage aggregation
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calculate total spins across all tenants (all time)
    const totalSpinsResult = await prisma.spin.count();

    // Calculate total vouchers across all tenants (all time)
    const totalVouchersResult = await prisma.voucher.count();

    // Count active tenants (isActive = true)
    const activeTenantsCount = await prisma.tenant.count({
      where: {
        isActive: true,
      },
    });

    // Count total tenants (all records)
    const totalTenantsCount = await prisma.tenant.count();

    // Return platform-wide statistics
    return NextResponse.json({
      totalSpins: totalSpinsResult,
      totalVouchers: totalVouchersResult,
      activeTenantsCount,
      totalTenantsCount,
    });
  } catch (error) {
    console.error('Error fetching platform usage:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch platform usage statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
