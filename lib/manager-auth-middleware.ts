import { managerAuthService } from '@/lib/manager-auth-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Manager Authentication Middleware
 * 
 * Validates JWT token from Authorization header
 * Extracts manager ID and tenant ID from token
 * Attaches to request context
 * 
 * Requirements: 2.4, 8.4
 */

export interface ManagerContext {
  managerId: string;
  tenantId: string;
  role: 'manager';
}

export async function validateManagerAuth(
  request: NextRequest
): Promise<{ valid: boolean; context?: ManagerContext; error?: string }> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[validateManagerAuth] Missing or invalid authorization header');
      return {
        valid: false,
        error: 'Missing or invalid authorization header'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[validateManagerAuth] Validating token:', token.substring(0, 20) + '...');

    // Validate token
    const result = await managerAuthService.validateToken(token);

    if (!result.valid) {
      console.log('[validateManagerAuth] Token validation failed:', result.error);
      return {
        valid: false,
        error: result.error || 'Invalid or expired token'
      };
    }

    console.log('[validateManagerAuth] Token valid for manager:', result.managerId);

    return {
      valid: true,
      context: {
        managerId: result.managerId!,
        tenantId: result.tenantId!,
        role: result.role!
      }
    };

  } catch (error) {
    console.error('Manager auth middleware error:', error);
    return {
      valid: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Middleware wrapper for manager routes
 */
export function withManagerAuth(
  handler: (request: NextRequest, context: ManagerContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await validateManagerAuth(request);

    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    return handler(request, authResult.context!);
  };
}
