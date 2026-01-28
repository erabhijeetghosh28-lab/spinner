import { getVouchersByPhone } from '@/lib/voucher-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/vouchers/lookup-phone
 * 
 * Finds vouchers by customer phone number.
 * 
 * Request body:
 * - phone: string (required) - The customer's phone number
 * - tenantId: string (required) - The tenant ID to filter vouchers
 * 
 * Response:
 * - vouchers: array - List of vouchers with status and prize details
 *   Each voucher includes:
 *   - code: string
 *   - prize: { name, description }
 *   - status: "active" | "redeemed" | "expired"
 *   - expiresAt: string
 *   - createdAt: string
 *   - redemptionCount: number
 *   - redemptionLimit: number
 *   - qrImageUrl: string | null
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;
    const tenantId = body.tenantId || req.headers.get('x-tenant-id');

    // Validate required parameters
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Call lookup service
    const vouchers = await getVouchersByPhone(phone.trim(), tenantId);

    // Return vouchers list (empty array if none found)
    return NextResponse.json({ vouchers });

  } catch (error: any) {
    console.error('[Voucher Lookup Phone] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
