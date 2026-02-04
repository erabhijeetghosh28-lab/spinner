import { managerAuthService } from '@/lib/manager-auth-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/manager/auth/login
 * 
 * Manager login endpoint - authenticates with ID and name
 * Requirements: 2.1, 2.2, 2.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { managerId, pin } = body;

    // Validate required fields
    if (!managerId || !pin) {
      return NextResponse.json(
        { error: 'Manager ID and PIN are required' },
        { status: 400 }
      );
    }

    // Authenticate manager
    const result = await managerAuthService.login(managerId, pin);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      token: result.token,
      manager: result.manager
    });

  } catch (error) {
    console.error('Login endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
