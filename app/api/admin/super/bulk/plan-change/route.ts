import { auditService } from '@/lib/audit-service';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check
    const adminId = 'super-admin-id'; // Replace with actual admin ID from session

    const body = await request.json();
    const { tenantIds, newPlanId } = body;

    // Validation
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json(
        { error: 'tenantIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!newPlanId || typeof newPlanId !== 'string') {
      return NextResponse.json(
        { error: 'newPlanId is required' },
        { status: 400 }
      );
    }

    // Verify plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
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
          // Get tenant
          const tenant = await tx.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, planId: true }
          });

          if (!tenant) {
            throw new Error('Tenant not found');
          }

          const oldPlanId = tenant.planId;

          // Update tenant plan
          await tx.tenant.update({
            where: { id: tenantId },
            data: { planId: newPlanId }
          });

          // Create audit log
          await auditService.logAction({
            adminId,
            action: 'BULK_PLAN_CHANGE',
            targetType: 'Tenant',
            targetId: tenantId,
            changes: {
              tenantName: tenant.name,
              oldPlanId,
              newPlanId,
              newPlanName: plan.name
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
          error: error.message || 'Failed to update plan'
        });
      }
    }

    return NextResponse.json({
      message: `Bulk plan change completed: ${results.successCount} succeeded, ${results.failureCount} failed`,
      ...results
    });

  } catch (error: any) {
    console.error('Bulk plan change error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process bulk plan change' },
      { status: 500 }
    );
  }
}
