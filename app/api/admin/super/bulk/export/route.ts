import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add Super Admin authentication check

    const body = await request.json();
    const { tenantIds } = body;

    // Validation
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json(
        { error: 'tenantIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Fetch tenant data
    const tenants = await prisma.tenant.findMany({
      where: {
        id: { in: tenantIds }
      },
      include: {
        plan: {
          select: {
            name: true,
            price: true
          }
        },
        _count: {
          select: {
            campaigns: true,
            endUsers: true,
            admins: true
          } as any
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Generate CSV
    const headers = [
      'Tenant ID',
      'Tenant Name',
      'Slug',
      'Plan',
      'Plan Price (₹)',
      'Status',
      'Contact Phone',
      'Campaigns',
      'Users',
      'Admins',
      'Created At',
      'Subscription Start',
      'Subscription End'
    ];

    const rows = tenants.map((tenant: any) => [
      tenant.id,
      tenant.name,
      tenant.slug,
      tenant.plan?.name || 'N/A',
      tenant.plan?.price ? (tenant.plan.price / 100).toFixed(2) : '0.00',
      tenant.isActive ? 'Active' : 'Inactive',
      tenant.contactPhone || 'N/A',
      tenant._count?.campaigns?.toString() || '0',
      tenant._count?.endUsers?.toString() || '0',
      tenant._count?.admins?.toString() || '0',
      tenant.createdAt.toISOString(),
      tenant.subscriptionStart ? tenant.subscriptionStart.toISOString() : 'N/A',
      tenant.subscriptionEnd ? tenant.subscriptionEnd.toISOString() : 'N/A'
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tenants-export-${new Date().toISOString()}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Bulk export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export tenant data' },
      { status: 500 }
    );
  }
}
