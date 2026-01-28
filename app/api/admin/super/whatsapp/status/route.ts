/**
 * GET /api/admin/super/whatsapp/status
 * 
 * WhatsApp monitoring endpoint for Super Admins.
 * Provides overview of WhatsApp configuration status across all tenants.
 * 
 * Note: Message delivery tracking requires WhatsApp webhook integration
 * which is a future enhancement. Currently tracks configuration status only.
 * 
 * Requirements: 10.1, 10.2, 10.5
 */

import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check

    // Fetch all tenants with their WhatsApp configuration status
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        waConfig: true,
        isActive: true,
        subscriptionStatus: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Count configured vs unconfigured
    let configuredCount = 0;
    let unconfiguredCount = 0;

    const tenantStatus = tenants.map(tenant => {
      const hasConfig = tenant.waConfig !== null && 
                       typeof tenant.waConfig === 'object' &&
                       Object.keys(tenant.waConfig).length > 0;

      if (hasConfig) {
        configuredCount++;
      } else {
        unconfiguredCount++;
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        isActive: tenant.isActive,
        subscriptionStatus: tenant.subscriptionStatus,
        hasWhatsAppConfig: hasConfig,
        configDetails: hasConfig ? {
          hasApiUrl: !!(tenant.waConfig as any)?.apiUrl,
          hasApiKey: !!(tenant.waConfig as any)?.apiKey,
          hasSender: !!(tenant.waConfig as any)?.sender
        } : null
      };
    });

    // Note: Message delivery tracking would require WhatsApp webhook integration
    // For now, we return placeholder values
    const messagesToday = 0; // TODO: Implement when webhook is available
    const failedToday = 0;   // TODO: Implement when webhook is available

    return NextResponse.json({
      summary: {
        totalTenants: tenants.length,
        configuredCount,
        unconfiguredCount,
        configurationRate: tenants.length > 0 
          ? Math.round((configuredCount / tenants.length) * 100) 
          : 0
      },
      messaging: {
        messagesToday,
        failedToday,
        note: 'Message delivery tracking requires WhatsApp webhook integration (future enhancement)'
      },
      tenantStatus
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch WhatsApp status',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
