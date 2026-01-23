import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const campaignId = req.nextUrl.searchParams.get('campaignId');
        const tenantId = req.nextUrl.searchParams.get('tenantId');

        if (!campaignId || !tenantId) {
            return NextResponse.json({ error: 'Campaign ID and Tenant ID required' }, { status: 400 });
        }

        // Verify campaign belongs to tenant
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                tenantId: tenantId
            }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const prizes = await prisma.prize.findMany({
            where: { campaignId },
            orderBy: { position: 'asc' }
        });
        return NextResponse.json({ prizes });
    } catch (error: any) {
        return NextResponse.json({ 
            error: 'Failed to fetch prizes',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { prizes, campaignId, tenantId } = await req.json();

        if (!Array.isArray(prizes) || !campaignId || !tenantId) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Verify campaign belongs to tenant
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                tenantId: tenantId
            }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        // Validate prizes data before processing
        for (const p of prizes) {
            if (!p.name || p.name.trim() === '') {
                return NextResponse.json({ error: 'Prize name is required for all prizes' }, { status: 400 });
            }
            if (p.probability === undefined || p.probability === null || isNaN(parseFloat(p.probability))) {
                return NextResponse.json({ error: `Invalid probability for prize "${p.name}"` }, { status: 400 });
            }
            if (p.dailyLimit === undefined || p.dailyLimit === null || isNaN(parseInt(p.dailyLimit))) {
                return NextResponse.json({ error: `Invalid daily limit for prize "${p.name}"` }, { status: 400 });
            }
            if (p.position === undefined || p.position === null || isNaN(parseInt(p.position))) {
                return NextResponse.json({ error: `Invalid position for prize "${p.name}"` }, { status: 400 });
            }
        }

        // Check for duplicate positions within the same campaign
        const positions = prizes.map((p: any) => parseInt(p.position));
        const uniquePositions = new Set(positions);
        if (positions.length !== uniquePositions.size) {
            return NextResponse.json({ error: 'Duplicate positions detected. Each prize must have a unique position.' }, { status: 400 });
        }

        // Get existing prizes for this campaign to handle updates properly
        const existingPrizes = await prisma.prize.findMany({
            where: { campaignId }
        });

        // We'll update prizes in a transaction
        await prisma.$transaction(async (tx) => {
            // First, delete prizes that are no longer in the list
            const incomingIds = prizes.map((p: any) => p.id).filter((id: any) => id);
            const toDelete = existingPrizes.filter(p => !incomingIds.includes(p.id));
            
            if (toDelete.length > 0) {
                await tx.prize.deleteMany({
                    where: { id: { in: toDelete.map(p => p.id) } }
                });
            }

            // Then update or create prizes
            for (const p of prizes) {
                const prizeData = {
                    name: p.name.trim(),
                    imageUrl: p.imageUrl || null,
                    couponCode: p.couponCode || null,
                    probability: parseFloat(p.probability),
                    dailyLimit: parseInt(p.dailyLimit),
                    currentStock: p.currentStock !== undefined ? (p.currentStock === null || p.currentStock === '' ? null : parseInt(p.currentStock)) : null,
                    lowStockAlert: p.lowStockAlert !== undefined ? (p.lowStockAlert === null || p.lowStockAlert === '' ? null : parseInt(p.lowStockAlert)) : null,
                    isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
                    showTryAgainMessage: p.showTryAgainMessage !== undefined ? Boolean(p.showTryAgainMessage) : false,
                    position: parseInt(p.position),
                    colorCode: p.colorCode || '#f59e0b'
                };

                if (p.id && existingPrizes.some(ep => ep.id === p.id)) {
                    // Update existing prize
                    await tx.prize.update({
                        where: { id: p.id },
                        data: prizeData
                    });
                } else {
                    // Create new prize
                    await tx.prize.create({
                        data: {
                            ...prizeData,
                            campaignId: campaignId,
                            tenantId: tenantId
                        }
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating prizes:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { prizeId, campaignId, tenantId } = await req.json();

        if (!prizeId || !campaignId || !tenantId) {
            return NextResponse.json({ error: 'Prize ID, Campaign ID and Tenant ID required' }, { status: 400 });
        }

        // Verify campaign belongs to tenant and prize belongs to campaign
        const prize = await prisma.prize.findFirst({
            where: {
                id: prizeId,
                campaign: {
                    id: campaignId,
                    tenantId: tenantId
                }
            }
        });

        if (!prize) {
            return NextResponse.json({ error: 'Prize not found or access denied' }, { status: 404 });
        }

        await prisma.prize.delete({
            where: { id: prizeId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting prize:', error);
        return NextResponse.json({ 
            error: 'Failed to delete prize',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
