/**
 * PUT /api/admin/super/campaigns/:id/pause
 * 
 * Pause a campaign (Super Admin only).
 * Sets isActive to false to temporarily disable the campaign.
 * 
 * Requirements: 7.6
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

    // Validate campaign is active
    if (!campaign.isActive) {
      return NextResponse.json(
        {
          error: {
            code: 'CAMPAIGN_ALREADY_PAUSED',
            message: 'Campaign is already paused'
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
            message: 'Cannot pause an archived campaign'
          }
        },
        { status: 400 }
      );
    }

    // Pause the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        isActive: false,
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
      action: 'PAUSE_CAMPAIGN',
      targetType: 'Campaign',
      targetId: campaignId,
      changes: {
        campaignName: campaign.name,
        tenantName: campaign.tenant.name,
        before: { isActive: true },
        after: { isActive: false }
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request)
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      message: `Campaign "${campaign.name}" has been paused`
    });
  } catch (error) {
    console.error('Error pausing campaign:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to pause campaign',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
