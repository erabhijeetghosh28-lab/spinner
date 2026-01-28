/**
 * GET /api/admin/super/security/dashboard
 * 
 * Get security dashboard with alerts, suspicious activity, and failed logins.
 * Requires Super Admin authentication.
 * 
 * Requirements: 14.8
 */

import { securityService } from '@/lib/security-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // TODO: Validate Super Admin authentication
    // For now, proceeding without auth check

    // Get security dashboard data
    const dashboard = await securityService.getSecurityDashboard();

    return NextResponse.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    console.error('Error fetching security dashboard:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch security dashboard',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
