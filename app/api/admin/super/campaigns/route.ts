/**
 * GET /api/admin/super/campaigns
 * 
 * Global campaign oversight endpoint for Super Admins.
 * Provides comprehensive campaign search and filtering across all tenants.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - search: Search by campaign name
 * - tenantId: Filter by specific tenant
 * - status: Filter by status (active, inactive, archived)
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8
 */

import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check

    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    // Search and filters
    const search = searchParams.get('search');
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};

    // Search by campaign name
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Filter by tenant
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Filter by status
    if (status) {
      if (status === 'active') {
        where.isActive = true;
        where.isArchived = false;
      } else if (status === 'inactive') {
        where.isActive = false;
        where.isArchived = false;
      } else if (status === 'archived') {
        where.isArchived = true;
      }
    }

    // Fetch campaigns with tenant details and performance metrics
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              spins: true,
              prizes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.campaign.count({ where })
    ]);

    // Calculate performance metrics for each campaign
    const campaignsWithMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        // Get total spins and vouchers for this campaign
        const spins = await prisma.spin.count({
          where: { campaignId: campaign.id }
        });

        const vouchers = await prisma.voucher.count({
          where: {
            spin: {
              campaignId: campaign.id
            }
          }
        });

        const redeemedVouchers = await prisma.voucher.count({
          where: {
            spin: {
              campaignId: campaign.id
            },
            isRedeemed: true
          }
        });

        // Calculate redemption rate
        const redemptionRate = vouchers > 0 
          ? Math.round((redeemedVouchers / vouchers) * 100) 
          : 0;

        return {
          ...campaign,
          metrics: {
            totalSpins: spins,
            totalVouchers: vouchers,
            redeemedVouchers,
            redemptionRate
          }
        };
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch campaigns',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
