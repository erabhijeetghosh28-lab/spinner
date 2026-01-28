/**
 * PUT /api/admin/super/tenants/:id/unlock
 * 
 * Unlock a tenant account.
 * Requires Super Admin authentication.
 * 
 * Requirements: 14.6, 14.7
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

    // TODO: Validate Super Admin authentication
    // For now, using mock admin ID
    const adminId = 'mock-super-admin-id';

    // Unlock the tenant
    await securityService.unlockTenant(tenantId, adminId);

    // Create audit log
    await auditService.logAction({
      adminId,
      action: 'UNLOCK_TENANT',
      targetType: 'Tenant',
      targetId: tenantId,
      changes: {
        unlockedAt: new Date()
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant account unlocked successfully'
    });
  } catch (error: any) {
    console.error('Error unlocking tenant:', error);
    
    if (error.message === 'Tenant account is not locked') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to unlock tenant account',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
