import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

// GET: Get all sections for a landing page
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
            include: {
                sections: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });

        if (!landingPage) {
            return NextResponse.json({ error: 'Landing page not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ sections: landingPage.sections });
    } catch (error: any) {
        console.error('Error fetching sections:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch sections',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// POST: Create a new section
export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const body = await req.json();
        const { landingPageId, tenantId, type, content, displayOrder } = body;

        if (!landingPageId || !tenantId || !type) {
            return NextResponse.json({ error: 'Landing Page ID, Tenant ID, and type required' }, { status: 400 });
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
        const maxOrder = await prisma.landingPageSection.findFirst({
            where: { landingPageId },
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true },
        });

        const section = await prisma.landingPageSection.create({
            data: {
                landingPageId,
                type,
                content: content || {},
                displayOrder: displayOrder ?? (maxOrder ? maxOrder.displayOrder + 1 : 0),
            },
        });

        return NextResponse.json({ section, success: true });
    } catch (error: any) {
        console.error('Error creating section:', error);
        return NextResponse.json(
            {
                error: 'Failed to create section',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// PUT: Update a section
export async function PUT(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const body = await req.json();
        const { sectionId, tenantId, ...updateData } = body;

        if (!sectionId || !tenantId) {
            return NextResponse.json({ error: 'Section ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this section
        const section = await prisma.landingPageSection.findFirst({
            where: {
                id: sectionId,
                landingPage: {
                    campaign: { tenantId },
                },
            },
        });

        if (!section) {
            return NextResponse.json({ error: 'Section not found or access denied' }, { status: 404 });
        }

        const updated = await prisma.landingPageSection.update({
            where: { id: sectionId },
            data: updateData,
        });

        return NextResponse.json({ section: updated, success: true });
    } catch (error: any) {
        console.error('Error updating section:', error);
        return NextResponse.json(
            {
                error: 'Failed to update section',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// DELETE: Delete a section
export async function DELETE(req: NextRequest) {
    try {
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { searchParams } = new URL(req.url);
        const sectionId = searchParams.get('sectionId');
        const tenantId = searchParams.get('tenantId');

        if (!sectionId || !tenantId) {
            return NextResponse.json({ error: 'Section ID and Tenant ID required' }, { status: 400 });
        }

        // Verify tenant owns this section
        const section = await prisma.landingPageSection.findFirst({
            where: {
                id: sectionId,
                landingPage: {
                    campaign: { tenantId },
                },
            },
        });

        if (!section) {
            return NextResponse.json({ error: 'Section not found or access denied' }, { status: 404 });
        }

        await prisma.landingPageSection.delete({
            where: { id: sectionId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting section:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete section',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
