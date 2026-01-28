/**
 * PUT /api/admin/super/tenants/:id/usage/reset
 * 
 * Resets a tenant's current month usage counters to zero. This allows
 * Super Admins to grant mid-month usage resets for billing adjustments
 * or customer service purposes.
 * 
 * Requirements: 4.6
 */

import { auditService, getIpAddress, getUserAgent } from '@/lib/audit-service';
import prisma from '@/lib/prisma';
import { usageService } from '@/lib/usage-service';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add Super Admin authentication check
    // For now, proceeding without auth for implementation
    // const session = await getSession(request);
    // if (!session || session.role !== 'SUPER_ADMIN') {
    //   return NextResponse.json(
    //     { error: { code: 'FORBIDDEN', message: 'Super Admin access required' } },
    //     { status: 403 }
    //   );
    // }

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

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
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

    // TODO: Get actual admin ID from session
    // For now, we need to get a valid admin ID from the database
    // In production, this would come from the authenticated session
    const firstAdmin = await prisma.admin.findFirst({
      where: { isSuperAdmin: true },
    });

    if (!firstAdmin) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_ADMIN_FOUND',
            message: 'No super admin found in the system',
          },
        },
        { status: 500 }
      );
    }

    const adminId = firstAdmin.id;

    // Get usage before reset for audit log
    const usageBeforeReset = await usageService.getCurrentMonthUsage(tenantId);

    // Reset current month usage to zero (Requirement 4.6)
    await usageService.resetUsage(tenantId);

    // Get updated usage record
    const updatedUsage = await usageService.getCurrentMonthUsage(tenantId);

    // Create audit log entry (Requirement 4.6)
    await auditService.logAction({
      adminId,
      action: 'RESET_USAGE',
      targetType: 'Tenant',
      targetId: tenantId,
      changes: {
        tenantName: tenant.name,
        before: {
          spinsUsed: usageBeforeReset.spinsUsed,
          vouchersUsed: usageBeforeReset.vouchersUsed,
        },
        after: {
          spinsUsed: updatedUsage.spinsUsed,
          vouchersUsed: updatedUsage.vouchersUsed,
        },
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request)
    });

    // Return updated usage record
    return NextResponse.json(updatedUsage, { status: 200 });
  } catch (error) {
    console.error('Error resetting usage:', error);

    // Generic error response
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reset usage',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
