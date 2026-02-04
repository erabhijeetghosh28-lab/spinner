import { requireAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/managers/:id/audit-logs
 * 
 * Get audit logs for a manager
 * 
 * IMMUTABILITY: This endpoint is READ-ONLY. Audit logs are immutable and cannot be
 * updated or deleted to maintain audit trail integrity (Requirement 7.5).
 * 
 * Requirements: 7.3, 7.4, 7.5
 */
export async function GET(
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

    if (!manager || manager.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Manager not found or access denied' },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');

    // Build where clause
    const where: any = {
      managerId,
      tenantId
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (action) {
      where.action = action;
    }

    // Fetch audit logs
    const logs = await prisma.managerAuditLog.findMany({
      where,
      include: {
        taskCompletion: {
          select: {
            id: true,
            task: {
              select: {
                platform: true,
                actionType: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        taskCompletionId: log.taskCompletionId,
        taskType: `${log.taskCompletion.task.platform} - ${log.taskCompletion.task.actionType}`,
        comment: log.comment,
        bonusSpinsGranted: log.bonusSpinsGranted,
        createdAt: log.createdAt
      }))
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
