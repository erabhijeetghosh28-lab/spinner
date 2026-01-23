import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// PATCH: Archive a campaign (soft delete)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { id: campaignId } = await params;
        const { tenantId } = await req.json();

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this campaign
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                tenantId: tenantId,
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        // Archive the campaign
        const archivedCampaign = await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                isActive: false,
                isArchived: true,
                archivedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Campaign archived successfully',
            campaign: archivedCampaign,
        });
    } catch (error: any) {
        console.error('Error archiving campaign:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to archive campaign',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
