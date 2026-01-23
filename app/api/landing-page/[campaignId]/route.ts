import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Public endpoint to fetch published landing page
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const { campaignId } = await params;

        // Get published landing page
        const landingPage = await prisma.landingPage.findFirst({
            where: {
                campaignId,
                isPublished: true,
            },
            include: {
                sections: {
                    where: { isVisible: true },
                    orderBy: { displayOrder: 'asc' },
                },
                offers: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                },
                footer: true,
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        logoUrl: true,
                        supportMobile: true,
                        websiteUrl: true,
                        tenantId: true,
                        referralsForBonus: true,
                        referralBonusSpins: true,
                        tenant: {
                            select: {
                                slug: true,
                            },
                        },
                        prizes: {
                            where: { isActive: true },
                            orderBy: { position: 'asc' },
                            select: {
                                id: true,
                                name: true,
                                colorCode: true,
                                position: true,
                            },
                        },
                    },
                },
            },
        });

        if (!landingPage) {
            return NextResponse.json({ error: 'Landing page not found or not published' }, { status: 404 });
        }

        return NextResponse.json({ landingPage });
    } catch (error: any) {
        console.error('Error fetching landing page:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch landing page',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
