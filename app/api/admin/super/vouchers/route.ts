/**
 * GET /api/admin/super/vouchers
 * 
 * Global voucher oversight endpoint for Super Admins.
 * Provides comprehensive voucher search and filtering across all tenants.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - search: Search by voucher code or customer phone
 * - tenantId: Filter by specific tenant
 * - status: Filter by status (active, redeemed, expired)
 * - startDate: Filter by creation date (ISO string)
 * - endDate: Filter by creation date (ISO string)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    // Search by voucher code or phone number
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search } } }
      ];
    }

    // Filter by tenant
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Filter by status
    if (status) {
      const now = new Date();
      if (status === 'active') {
        where.isRedeemed = false;
        where.expiresAt = { gt: now };
      } else if (status === 'redeemed') {
        where.isRedeemed = true;
      } else if (status === 'expired') {
        where.isRedeemed = false;
        where.expiresAt = { lte: now };
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch vouchers with tenant and user details
    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
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
          user: {
            select: {
              id: true,
              phone: true,
              name: true
            }
          },
          prize: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.voucher.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      vouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch vouchers',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
