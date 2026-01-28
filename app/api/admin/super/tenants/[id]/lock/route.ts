/**
 * PUT /api/admin/super/tenants/:id/lock
 * 
 * Lock a tenant account for security reasons.
 * Requires Super Admin authentication.
 * 
 * Requirements: 14.5, 14.7
 */

import { auditService, getIpAddress, getUserAgent } from '@/lib/audit-service';
import { securityService } from '@/lib/security-service';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = id;
    const { reason } = await req.json();

    // Validate input
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // TODO: Validate Super Admin authentication
    // For now, using mock admin ID
    const adminId = 'mock-super-admin-id';

    // Lock the tenant
    await securityService.lockTenant(tenantId, adminId, reason);

    // Create audit log
    await auditService.logAction({
      adminId,
      action: 'LOCK_TENANT',
      targetType: 'Tenant',
      targetId: tenantId,
      changes: {
        reason,
        lockedAt: new Date()
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant account locked successfully'
    });
  } catch (error: any) {
    console.error('Error locking tenant:', error);
    
    if (error.message === 'Tenant account is already locked') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to lock tenant account',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
