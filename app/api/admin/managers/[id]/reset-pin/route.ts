import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/managers/:id/reset-pin
 * 
 * Reset manager PIN and return new PIN
 */
export async function POST(
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

    // Generate new 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(pin, 10);

    // Update manager PIN
    await prisma.manager.update({
      where: { id: managerId },
      data: { pin: hashedPin }
    });

    return NextResponse.json({
      success: true,
      pin: pin // Return plain PIN for display
    });

  } catch (error) {
    console.error('Reset PIN error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
