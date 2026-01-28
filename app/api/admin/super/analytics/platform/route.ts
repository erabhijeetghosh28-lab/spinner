/**
 * GET /api/admin/super/analytics/platform
 * 
 * Platform-wide analytics endpoint for Super Admins.
 * Provides comprehensive metrics including spins, vouchers, redemption rates,
 * tenant rankings, growth trends, and churn metrics.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.6, 8.7, 8.8, 8.9
 */

import { analyticsService } from '@/lib/analytics-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check

    // Fetch all analytics data in parallel
    const [
      platformStats,
      avgRedemptionRate,
      tenantComparison,
      growthTrends,
      churnMetrics,
      activePercentage,
      churnRiskTenants
    ] = await Promise.all([
      analyticsService.getPlatformStats(),
      analyticsService.calculateRedemptionRate(),
      analyticsService.getTenantComparison(10),
      analyticsService.getGrowthTrends(),
      analyticsService.getTenantChurnMetrics(),
      analyticsService.getActivePercentage(),
      analyticsService.getChurnRiskTenants()
    ]);

    return NextResponse.json({
      // Platform totals
      totalSpins: platformStats.totalSpins,
      totalVouchers: platformStats.totalVouchers,
      avgRedemptionRate,
      
      // Tenant metrics
      activeTenantsCount: platformStats.activeTenantsCount,
      totalTenantsCount: platformStats.totalTenantsCount,
      activePercentage,
      
      // Tenant rankings
      topTenants: tenantComparison.topTenants,
      bottomTenants: tenantComparison.bottomTenants,
      
      // Growth and churn
      newTenantsThisMonth: churnMetrics.newTenantsThisMonth,
      churnedTenantsThisMonth: churnMetrics.churnedTenantsThisMonth,
      churnRiskTenants,
      
      // Trends
      growthTrends: {
        currentMonth: growthTrends.currentMonth,
        previousMonth: growthTrends.previousMonth,
        spinsChange: growthTrends.growth.spinsChange,
        vouchersChange: growthTrends.growth.vouchersChange
      }
    });
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch platform analytics',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
