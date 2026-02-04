import { managerAuthService } from '@/lib/manager-auth-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/manager/auth/logout
 * 
 * Manager logout endpoint
 * Requirements: 2.5
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const result = await managerAuthService.logout(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Logout endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
