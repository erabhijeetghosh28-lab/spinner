import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/managers
 * 
 * Get all managers for tenant admin's tenant
 * Requirements: 11.1, 11.5
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    // Get tenant ID from query params
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    // Fetch managers with stats
    const managers = await prisma.manager.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            auditLogs: {
              where: { action: 'APPROVE' }
            }
          }
        },
        auditLogs: {
          where: { action: 'APPROVE' },
          select: { bonusSpinsGranted: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const managersWithStats = managers.map(manager => ({
      id: manager.id,
      name: manager.name,
      maxBonusSpinsPerApproval: manager.maxBonusSpinsPerApproval,
      maxSpinsPerUser: manager.maxSpinsPerUser,
      isActive: manager.isActive,
      createdAt: manager.createdAt,
      stats: {
        totalApprovals: manager._count.auditLogs,
        totalBonusSpinsGranted: manager.auditLogs.reduce(
          (sum, log) => sum + (log.bonusSpinsGranted || 0),
          0
        )
      }
    }));

    return NextResponse.json({ managers: managersWithStats });

  } catch (error) {
    console.error('Get managers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/managers
 * 
 * Create new manager for tenant
 * Requirements: 1.1, 1.2, 1.3, 11.2, 11.3
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { tenantId, name, maxBonusSpinsPerApproval, maxSpinsPerUser } = body;

    // Validate required fields
    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'Tenant ID and name are required' },
        { status: 400 }
      );
    }

    // Check for duplicate name in tenant
    const existing = await prisma.manager.findFirst({
      where: {
        tenantId,
        name
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Manager with this name already exists in your organization' },
        { status: 409 }
      );
    }

    // Generate 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create manager
    const manager = await prisma.manager.create({
      data: {
        name,
        tenantId,
        pin: hashedPin,
        maxBonusSpinsPerApproval: maxBonusSpinsPerApproval || 10,
        maxSpinsPerUser: maxSpinsPerUser || 5
      }
    });

    return NextResponse.json({
      manager: {
        id: manager.id,
        name: manager.name,
        maxBonusSpinsPerApproval: manager.maxBonusSpinsPerApproval,
        maxSpinsPerUser: manager.maxSpinsPerUser,
        isActive: manager.isActive,
        createdAt: manager.createdAt,
        pin: pin // Return plain PIN for display (only on creation)
      }
    });

  } catch (error) {
    console.error('Create manager error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
