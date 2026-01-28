/**
 * GET /api/admin/super/billing/dashboard
 * 
 * Returns comprehensive revenue and billing metrics including:
 * - Monthly Recurring Revenue (MRR)
 * - New revenue from subscriptions started this month
 * - Churned revenue from subscriptions ended this month
 * - Upcoming renewals within 7 days
 * - Failed payments (tenants with PAST_DUE status)
 * - Revenue breakdown by subscription plan
 * - Active and total tenant counts
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6, 5.7
 */

import { billingService } from '@/lib/billing-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check
    // For now, proceeding without auth for implementation

    // Get comprehensive revenue metrics from BillingService
    const metrics = await billingService.getRevenueMetrics();

    // Return complete RevenueMetrics object
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching billing dashboard:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch billing dashboard data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
