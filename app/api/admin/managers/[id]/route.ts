import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/admin/managers/:id
 * 
 * Update manager information
 * Requirements: 1.6, 1.7, 11.4, 11.6
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    const managerId = params.id;

    // Get tenant ID from query params
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    // Verify manager belongs to tenant
    const manager = await prisma.manager.findUnique({
      where: { id: managerId }
    });

    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    if (manager.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, maxBonusSpinsPerApproval, maxSpinsPerUser, isActive } = body;

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (maxBonusSpinsPerApproval !== undefined) updateData.maxBonusSpinsPerApproval = maxBonusSpinsPerApproval;
    if (maxSpinsPerUser !== undefined) updateData.maxSpinsPerUser = maxSpinsPerUser;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update manager (tenant association is preserved)
    const updatedManager = await prisma.manager.update({
      where: { id: managerId },
      data: updateData
    });

    return NextResponse.json({
      manager: {
        id: updatedManager.id,
        name: updatedManager.name,
        maxBonusSpinsPerApproval: updatedManager.maxBonusSpinsPerApproval,
        maxSpinsPerUser: updatedManager.maxSpinsPerUser,
        isActive: updatedManager.isActive,
        updatedAt: updatedManager.updatedAt
      }
    });

  } catch (error) {
    console.error('Update manager error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
