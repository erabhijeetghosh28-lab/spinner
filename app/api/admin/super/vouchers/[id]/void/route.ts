/**
 * PUT /api/admin/super/vouchers/:id/void
 * 
 * Voids an active voucher (marks it as unusable).
 * Creates an audit log entry for accountability.
 * 
 * Requirements: 6.8
 */

import { auditService, getIpAddress, getUserAgent } from '@/lib/audit-service';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add Super Admin authentication check
    const adminId = 'PLACEHOLDER_ADMIN_ID'; // TODO: Get from auth context
    const { id } = await params;

    // Get the voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true } },
        user: { select: { phone: true } }
      }
    });

    if (!voucher) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Voucher not found' } },
        { status: 404 }
      );
    }

    // Check if voucher is already redeemed or expired
    if (voucher.isRedeemed) {
      return NextResponse.json(
        { error: { code: 'ALREADY_REDEEMED', message: 'Voucher has already been redeemed' } },
        { status: 400 }
      );
    }

    const now = new Date();
    if (voucher.expiresAt && voucher.expiresAt < now) {
      return NextResponse.json(
        { error: { code: 'EXPIRED', message: 'Voucher has already expired' } },
        { status: 400 }
      );
    }

    // Void the voucher by setting expiry to now
    const voidedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        expiresAt: now,
      }
    });

    // Create audit log entry
    await auditService.logAction({
      adminId,
      action: 'VOID_VOUCHER',
      targetType: 'Voucher',
      targetId: id,
      changes: {
        voucherCode: voucher.code,
        tenantName: voucher.tenant.name,
        customerPhone: voucher.user.phone,
        previousExpiry: voucher.expiresAt,
        newExpiry: now
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request)
    });

    return NextResponse.json({
      success: true,
      voucher: voidedVoucher,
      message: 'Voucher voided successfully'
    });
  } catch (error) {
    console.error('Error voiding voucher:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to void voucher',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
