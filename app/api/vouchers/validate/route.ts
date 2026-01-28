import { validateVoucher } from '@/lib/voucher-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/vouchers/validate
 * 
 * Validates a voucher code without redeeming it.
 * 
 * Request body:
 * - code: string (required) - The voucher code to validate
 * - tenantId: string (required) - The tenant ID of the requesting user
 * 
 * Response:
 * - valid: boolean - Whether the voucher is valid
 * - voucher?: object - Voucher details if valid (code, prize, customer, expiresAt, redemptionCount, redemptionLimit)
 * - reason?: string - Error reason if invalid (not_found, wrong_tenant, expired, redeemed, limit_reached)
 * - details?: object - Additional error details
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;
    const tenantId = body.tenantId || req.headers.get('x-tenant-id');

    // Validate required parameters
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Voucher code is required' },
        { status: 400 }
      );
    }

    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Call validation service
    const result = await validateVoucher(code.trim(), tenantId);

    // Return validation result
    // Status 200 for both valid and invalid vouchers (validation completed successfully)
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Voucher Validate] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
