/**
 * PUT /api/admin/super/campaigns/:id/unpause
 * 
 * Unpause a campaign (Super Admin only).
 * Sets isActive to true to re-enable the campaign.
 * 
 * Requirements: 7.7
 */

import { auditService, getIpAddress, getUserAgent } from '@/lib/audit-service';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add Super Admin authentication check
    const adminId = 'PLACEHOLDER_ADMIN_ID'; // TODO: Get from auth context

    const { id } = await params;
    const campaignId = id;

    // Fetch the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        isActive: true,
        isArchived: true,
        tenantId: true,
        tenant: {
          select: {
            name: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        {
          error: {
            code: 'CAMPAIGN_NOT_FOUND',
            message: 'Campaign not found'
          }
        },
        { status: 404 }
      );
    }

    // Validate campaign is paused
    if (campaign.isActive) {
      return NextResponse.json(
        {
          error: {
            code: 'CAMPAIGN_ALREADY_ACTIVE',
            message: 'Campaign is already active'
          }
        },
        { status: 400 }
      );
    }

    // Validate campaign is not archived
    if (campaign.isArchived) {
      return NextResponse.json(
        {
          error: {
            code: 'CAMPAIGN_ARCHIVED',
            message: 'Cannot unpause an archived campaign'
          }
        },
        { status: 400 }
      );
    }

    // Unpause the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        isActive: true,
        updatedAt: new Date()
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Create audit log entry
    await auditService.logAction({
      adminId,
      action: 'UNPAUSE_CAMPAIGN',
      targetType: 'Campaign',
      targetId: campaignId,
      changes: {
        campaignName: campaign.name,
        tenantName: campaign.tenant.name,
        before: { isActive: false },
        after: { isActive: true }
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request)
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      message: `Campaign "${campaign.name}" has been unpaused`
    });
  } catch (error) {
    console.error('Error unpausing campaign:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unpause campaign',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
