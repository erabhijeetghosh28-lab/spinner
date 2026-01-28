import { redeemVoucher } from '@/lib/voucher-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/vouchers/redeem
 * 
 * Redeems a valid voucher.
 * 
 * Request body:
 * - code: string (required) - The voucher code to redeem
 * - merchantId: string (required) - The ID of the merchant redeeming the voucher
 * - tenantId: string (required) - The tenant ID of the requesting merchant
 * 
 * Response:
 * - success: boolean - Whether redemption was successful
 * - voucher?: object - Full voucher object with all relationships if successful
 * - error?: string - Error message if redemption failed
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, merchantId, tenantId } = body;

    // Validate required parameters
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Voucher code is required' },
        { status: 400 }
      );
    }

    if (!merchantId || typeof merchantId !== 'string') {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Call redemption service
    const result = await redeemVoucher(code.trim(), merchantId, tenantId);

    // Return appropriate status code based on result
    if (result.success) {
      return NextResponse.json(result);
    } else {
      // Return 400 for validation failures (expired, already redeemed, etc.)
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Voucher Redeem] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
