import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// GET: Get all offers for a landing page
export async function GET(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { searchParams } = new URL(req.url);
        const landingPageId = searchParams.get('landingPageId');
        const tenantId = searchParams.get('tenantId');

        if (!landingPageId || !tenantId) {
            return NextResponse.json({ error: 'Landing Page ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this landing page
        const landingPage = await prisma.landingPage.findFirst({
            where: {
                id: landingPageId,
                campaign: { tenantId },
            },
        });

        if (!landingPage) {
            return NextResponse.json({ error: 'Landing page not found or access denied' }, { status: 404 });
        }

        const offers = await prisma.offerShowcase.findMany({
            where: { landingPageId },
            orderBy: { displayOrder: 'asc' },
        });

        return NextResponse.json({ offers });
    } catch (error: any) {
        console.error('Error fetching offers:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch offers',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// POST: Create a new offer
export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const body = await req.json();
        const { landingPageId, tenantId, ...offerData } = body;

        if (!landingPageId || !tenantId || !offerData.title) {
            return NextResponse.json({ error: 'Landing Page ID, Tenant ID, and title required' }, { status: 400 });
        }

        // Verify tenant owns this landing page
        const landingPage = await prisma.landingPage.findFirst({
            where: {
                id: landingPageId,
                campaign: { tenantId },
            },
        });

        if (!landingPage) {
            return NextResponse.json({ error: 'Landing page not found or access denied' }, { status: 404 });
        }

        // Get max display order
        const maxOrder = await prisma.offerShowcase.findFirst({
            where: { landingPageId },
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true },
        });

        const offer = await prisma.offerShowcase.create({
            data: {
                landingPageId,
                offerType: offerData.offerType || 'PRODUCT',
                title: offerData.title,
                description: offerData.description || null,
                shortDescription: offerData.shortDescription || null,
                image: offerData.image || '',
                category: offerData.category || null,
                originalValue: offerData.originalValue || null,
                discountValue: offerData.discountValue || null,
                externalLink: offerData.externalLink || null,
                displayOrder: offerData.displayOrder ?? (maxOrder ? maxOrder.displayOrder + 1 : 0),
            },
        });

        return NextResponse.json({ offer, success: true });
    } catch (error: any) {
        console.error('Error creating offer:', error);
        return NextResponse.json(
            {
                error: 'Failed to create offer',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// PUT: Update an offer
export async function PUT(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const body = await req.json();
        const { offerId, tenantId, ...updateData } = body;

        if (!offerId || !tenantId) {
            return NextResponse.json({ error: 'Offer ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this offer
        const offer = await prisma.offerShowcase.findFirst({
            where: {
                id: offerId,
                landingPage: {
                    campaign: { tenantId },
                },
            },
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found or access denied' }, { status: 404 });
        }

        const updated = await prisma.offerShowcase.update({
            where: { id: offerId },
            data: updateData,
        });

        return NextResponse.json({ offer: updated, success: true });
    } catch (error: any) {
        console.error('Error updating offer:', error);
        return NextResponse.json(
            {
                error: 'Failed to update offer',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// DELETE: Delete an offer
export async function DELETE(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { searchParams } = new URL(req.url);
        const offerId = searchParams.get('offerId');
        const tenantId = searchParams.get('tenantId');

        if (!offerId || !tenantId) {
            return NextResponse.json({ error: 'Offer ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this offer
        const offer = await prisma.offerShowcase.findFirst({
            where: {
                id: offerId,
                landingPage: {
                    campaign: { tenantId },
                },
            },
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found or access denied' }, { status: 404 });
        }

        await prisma.offerShowcase.delete({
            where: { id: offerId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting offer:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete offer',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
