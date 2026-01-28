import { auditService } from '@/lib/audit-service';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check
    const adminId = 'super-admin-id'; // Replace with actual admin ID from session

    const body = await request.json();
    const { tenantIds, bonusSpins, bonusVouchers, reason, expiresAt } = body;

    // Validation
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json(
        { error: 'tenantIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!bonusSpins && !bonusVouchers) {
      return NextResponse.json(
        { error: 'At least one of bonusSpins or bonusVouchers must be provided' },
        { status: 400 }
      );
    }

    if (bonusSpins && bonusSpins <= 0) {
      return NextResponse.json(
        { error: 'bonusSpins must be positive' },
        { status: 400 }
      );
    }

    if (bonusVouchers && bonusVouchers <= 0) {
      return NextResponse.json(
        { error: 'bonusVouchers must be positive' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'reason is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const results = {
      successCount: 0,
      failureCount: 0,
      errors: [] as Array<{ tenantId: string; error: string }>
    };

    // Process each tenant in a transaction
    for (const tenantId of tenantIds) {
      try {
        await prisma.$transaction(async (tx) => {
          // Verify tenant exists
          const tenant = await tx.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true }
          });

          if (!tenant) {
            throw new Error('Tenant not found');
          }

          // Create limit override
          const override = await tx.tenantLimitOverride.create({
            data: {
              tenantId,
              bonusSpins: bonusSpins || 0,
              bonusVouchers: bonusVouchers || 0,
              reason: reason.trim(),
              grantedBy: adminId,
              expiresAt: expiresAt ? new Date(expiresAt) : null,
              isActive: true
            }
          });

          // Create audit log
          await auditService.logAction({
            adminId,
            action: 'BULK_GRANT_BONUS',
            targetType: 'Tenant',
            targetId: tenantId,
            changes: {
              tenantName: tenant.name,
              bonusSpins: bonusSpins || 0,
              bonusVouchers: bonusVouchers || 0,
              reason: reason.trim(),
              expiresAt: expiresAt || null,
              overrideId: override.id
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined
          });
        });

        results.successCount++;
      } catch (error: any) {
        results.failureCount++;
        results.errors.push({
          tenantId,
          error: error.message || 'Failed to grant bonus'
        });
      }
    }

    return NextResponse.json({
      message: `Bulk bonus grant completed: ${results.successCount} succeeded, ${results.failureCount} failed`,
      ...results
    });

  } catch (error: any) {
    console.error('Bulk grant bonus error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process bulk bonus grant' },
      { status: 500 }
    );
  }
}
