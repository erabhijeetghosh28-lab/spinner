import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const tenantId = req.nextUrl.searchParams.get('tenantId');
        const campaignId = req.nextUrl.searchParams.get('campaignId');
        const format = req.nextUrl.searchParams.get('format') || 'png'; // png or svg

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Get tenant with plan to check if QR code generation is allowed
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        if (!tenant.plan.allowQRCodeGenerator) {
            return NextResponse.json({ error: 'QR Code Generator feature not available for your plan' }, { status: 403 });
        }

        // Build the URL with proper fallback chain
        let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        
        if (!baseUrl) {
            // Try Vercel URL (automatically set by Vercel)
            if (process.env.VERCEL_URL) {
                baseUrl = `https://${process.env.VERCEL_URL}`;
            } else if (process.env.VERCEL) {
                // Fallback for Vercel deployments
                baseUrl = `https://${process.env.VERCEL}`;
            } else {
                // Development fallback
                baseUrl = 'http://localhost:3000';
            }
        }
        
        // Ensure baseUrl doesn't have trailing slash
        baseUrl = baseUrl.replace(/\/$/, '');
        
        let qrUrl = `${baseUrl}/?tenant=${tenant.slug}`;
        
        if (campaignId) {
            qrUrl += `&campaign=${campaignId}`;
        }

        // Generate QR code
        let qrData: string;
        if (format === 'svg') {
            qrData = await QRCode.toString(qrUrl, {
                type: 'svg',
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return new NextResponse(qrData, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Content-Disposition': `attachment; filename="qr-code-${tenant.slug}.svg"`
                }
            });
        } else {
            // PNG format
            const buffer = await QRCode.toBuffer(qrUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return new NextResponse(Buffer.from(buffer), {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Disposition': `attachment; filename="qr-code-${tenant.slug}.png"`
                }
            });
        }
    } catch (error: any) {
        console.error('Error generating QR code:', error);
        return NextResponse.json({ 
            error: 'Failed to generate QR code',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
