import { requireAdminAuth } from '@/lib/auth';
import {
    BrandedQROptions,
    createAndUploadBrandedCard,
    createAndUploadBrandedPoster,
    generateBrandedQRCard,
    generateBrandedQRPoster
} from '@/lib/branded-qr-generator';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/qr/branded
 * 
 * Generate branded QR code poster or card for a campaign
 * 
 * Body:
 * - campaignId: Campaign ID
 * - type: 'poster' | 'card'
 * - download: boolean (if true, returns image directly for download)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authError = await requireAdminAuth(req);
    if (authError) return authError;

    const { campaignId, type = 'poster', download = false } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Get campaign with tenant info
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        tenant: {
          select: {
            name: true,
            contactPhone: true,
            slug: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Build campaign URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const campaignUrl = `${baseUrl}/${campaign.tenant.slug}`;

    // Prepare branding options
    const brandingOptions: BrandedQROptions = {
      campaignName: campaign.name,
      qrData: campaignUrl,
      businessName: campaign.tenant.name,
      phone: campaign.tenant.contactPhone || undefined,
      website: campaign.websiteUrl || undefined,
      logoUrl: campaign.logoUrl || undefined,
      primaryColor: '#1E3A8A', // Default blue
      backgroundColor: '#FFFFFF'
    };

    if (download) {
      // Generate image and return for direct download
      let imageBuffer: Buffer;
      let filename: string;

      if (type === 'card') {
        imageBuffer = await generateBrandedQRCard(brandingOptions);
        filename = `${campaign.name.replace(/[^a-zA-Z0-9]/g, '-')}-card.png`;
      } else {
        imageBuffer = await generateBrandedQRPoster(brandingOptions);
        filename = `${campaign.name.replace(/[^a-zA-Z0-9]/g, '-')}-poster.png`;
      }

      // Return image for download
      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': imageBuffer.length.toString(),
        },
      });
    } else {
      // Upload to storage and return URL
      let url: string | null;

      try {
        if (type === 'card') {
          url = await createAndUploadBrandedCard(brandingOptions, campaignId);
        } else {
          url = await createAndUploadBrandedPoster(brandingOptions, campaignId);
        }

        if (!url) {
          return NextResponse.json({ 
            error: 'Failed to generate branded QR',
            message: 'Image upload failed. Ensure UploadThing is configured.'
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          url,
          type,
          campaign: {
            id: campaign.id,
            name: campaign.name
          }
        });
      } catch (uploadError: any) {
        console.error('[BrandedQR API] Upload error:', uploadError);
        return NextResponse.json({ 
          error: 'Failed to generate branded QR',
          message: uploadError.message || 'Upload failed'
        }, { status: 500 });
      }
    }

  } catch (error: any) {
    console.error('[BrandedQR API] Error generating branded QR:', error);
    console.error('[BrandedQR API] Stack trace:', error.stack);
    return NextResponse.json({
      error: 'Failed to generate branded QR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      message: error.message
    }, { status: 500 });
  }
}