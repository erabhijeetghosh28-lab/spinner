import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError) return authError;
    
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { 
        subscriptionPlan: true,
        _count: {
          select: {
            campaigns: {
              where: {
                isActive: true,
                isArchived: false
              }
            }
          }
        }
      }
    });
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await prisma.tenantUsage.findUnique({
      where: {
        tenantId_month: { tenantId, month: currentMonth }
      }
    });
    
    return NextResponse.json({
      activeCampaigns: tenant._count.campaigns,
      monthlyCreated: usage?.campaignsCreated || 0,
      plan: {
        name: tenant.subscriptionPlan?.name || 'Free',
        campaignsPerMonth: tenant.subscriptionPlan?.campaignsPerMonth || 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
