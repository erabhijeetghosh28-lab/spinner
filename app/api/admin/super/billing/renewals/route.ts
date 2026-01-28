/**
 * GET /api/admin/super/billing/renewals
 * 
 * Returns tenants with upcoming subscription renewals.
 * Accepts a query parameter 'days' to specify the number of days to look ahead.
 * Default is 7 days if not specified.
 * 
 * Query Parameters:
 * - days: Number of days to look ahead for renewals (default: 7)
 * 
 * Returns:
 * - Array of TenantWithRenewal objects containing:
 *   - id: Tenant ID
 *   - name: Tenant name
 *   - subscriptionEnd: Renewal date
 *   - daysUntilRenewal: Days until renewal
 *   - planName: Subscription plan name
 *   - planPrice: Subscription plan price
 * 
 * Requirements: 5.4
 */

import { billingService } from '@/lib/billing-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check
    // For now, proceeding without auth for implementation

    // Extract 'days' query parameter, default to 7
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    // Validate days parameter
    if (isNaN(days) || days < 1) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid days parameter. Must be a positive integer.',
          },
        },
        { status: 400 }
      );
    }

    // Get upcoming renewals from BillingService
    const renewals = await billingService.getUpcomingRenewals(days);

    // Return array of TenantWithRenewal objects
    return NextResponse.json(renewals);
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch upcoming renewals',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
