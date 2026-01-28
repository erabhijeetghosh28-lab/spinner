/**
 * GET /api/admin/super/tenants/:id/overrides
 * 
 * Retrieves all active limit overrides for a specific tenant.
 * 
 * Requirements: 4.7
 * 
 * POST /api/admin/super/tenants/:id/overrides
 * 
 * Creates a manual limit override for a specific tenant, granting bonus
 * spins and/or vouchers. This allows Super Admins to provide additional
 * capacity beyond the tenant's subscription plan limits.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { auditService, getIpAddress, getUserAgent } from '@/lib/audit-service';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Request body schema for creating a limit override
 */
interface CreateOverrideRequest {
  bonusSpins?: number;
  bonusVouchers?: number;
  reason: string;
  expiresAt?: string; // ISO date string
}

/**
 * GET handler - Retrieve active overrides for a tenant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add Super Admin authentication check
    const { id } = await params;
    const tenantId = id;

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

    // Get active overrides
    const now = new Date();
    const overrides = await prisma.tenantLimitOverride.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { expiresAt: null }, // Permanent overrides
          { expiresAt: { gte: now } }, // Not yet expired
        ],
      },
      include: {
        grantedByAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error('Error fetching overrides:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch overrides',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Create a new limit override
 */

export async function POST(
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

    // Parse request body
    let body: CreateOverrideRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Validate reason is provided and non-empty (Requirement 4.3)
    if (!body.reason || typeof body.reason !== 'string' || body.reason.trim() === '') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REASON',
            message: 'Reason is required and must be a non-empty string',
          },
        },
        { status: 400 }
      );
    }

    // Validate at least one bonus amount is provided and positive
    const hasValidBonusSpins = body.bonusSpins !== undefined && body.bonusSpins > 0;
    const hasValidBonusVouchers = body.bonusVouchers !== undefined && body.bonusVouchers > 0;

    if (!hasValidBonusSpins && !hasValidBonusVouchers) {
      // Check if they provided zero or negative values
      if (body.bonusSpins !== undefined && body.bonusSpins <= 0) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_BONUS_SPINS',
              message: 'Bonus spins must be a positive number',
            },
          },
          { status: 400 }
        );
      }
      if (body.bonusVouchers !== undefined && body.bonusVouchers <= 0) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_BONUS_VOUCHERS',
              message: 'Bonus vouchers must be a positive number',
            },
          },
          { status: 400 }
        );
      }
      // Neither was provided
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_BONUS_AMOUNTS',
            message: 'At least one of bonusSpins or bonusVouchers must be provided',
          },
        },
        { status: 400 }
      );
    }

    // Validate bonus spins if provided (Requirement 4.1)
    if (body.bonusSpins !== undefined && body.bonusSpins <= 0) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_BONUS_SPINS',
            message: 'Bonus spins must be a positive number',
          },
        },
        { status: 400 }
      );
    }

    // Validate bonus vouchers if provided (Requirement 4.2)
    if (body.bonusVouchers !== undefined && body.bonusVouchers <= 0) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_BONUS_VOUCHERS',
            message: 'Bonus vouchers must be a positive number',
          },
        },
        { status: 400 }
      );
    }

    // Validate expiresAt if provided
    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_EXPIRES_AT',
              message: 'expiresAt must be a valid ISO date string',
            },
          },
          { status: 400 }
        );
      }
      // Validate expiresAt is in the future
      if (expiresAt <= new Date()) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_EXPIRES_AT',
              message: 'expiresAt must be in the future',
            },
          },
          { status: 400 }
        );
      }
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

    // Create TenantLimitOverride record (Requirement 4.4)
    const override = await prisma.tenantLimitOverride.create({
      data: {
        tenantId,
        bonusSpins: body.bonusSpins || 0,
        bonusVouchers: body.bonusVouchers || 0,
        reason: body.reason.trim(),
        grantedBy: adminId,
        expiresAt,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        grantedByAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Create audit log entry (Requirement 4.4)
    await auditService.logAction({
      adminId,
      action: 'GRANT_OVERRIDE',
      targetType: 'Tenant',
      targetId: tenantId,
      changes: {
        bonusSpins: body.bonusSpins || 0,
        bonusVouchers: body.bonusVouchers || 0,
        reason: body.reason.trim(),
        expiresAt: expiresAt?.toISOString() || null,
        tenantName: tenant.name
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request)
    });

    // Return created override record
    return NextResponse.json(override, { status: 201 });
  } catch (error) {
    console.error('Error creating limit override:', error);

    // Handle Prisma foreign key constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2003') {
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
    }

    // Generic error response
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create limit override',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
