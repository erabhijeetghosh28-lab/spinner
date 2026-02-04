import { NextRequest, NextResponse } from 'next/server';

/**
 * Manager RBAC Middleware
 * 
 * Enforces role-based access control for manager routes.
 * Managers have limited permissions and cannot access:
 * - Campaign creation/management
 * - Tenant settings
 * - Voucher management
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

// Routes that managers are NOT allowed to access
const RESTRICTED_ROUTES = [
  '/api/admin/campaign',
  '/api/admin/campaigns',
  '/api/admin/settings',
  '/api/admin/vouchers',
  '/api/admin/qr',
  '/api/admin/prizes',
  '/api/admin/upload',
  '/api/admin/landing-page',
  '/api/admin/social-tasks',
  '/api/admin/super',
];

// Routes that managers ARE allowed to access
const ALLOWED_MANAGER_ROUTES = [
  '/api/manager/auth',
  '/api/manager/tasks',
];

/**
 * Check if a route is restricted for managers
 */
export function isRestrictedRoute(pathname: string): boolean {
  return RESTRICTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is allowed for managers
 */
export function isAllowedManagerRoute(pathname: string): boolean {
  return ALLOWED_MANAGER_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Enforce RBAC for manager role
 * Returns 403 if manager tries to access restricted routes
 */
export function enforceManagerRBAC(request: NextRequest, role: string): NextResponse | null {
  if (role !== 'manager') {
    return null; // Not a manager, no restrictions
  }

  const pathname = new URL(request.url).pathname;

  // Check if trying to access restricted route
  if (isRestrictedRoute(pathname)) {
    return NextResponse.json(
      { 
        error: 'Access denied: Managers cannot access this resource',
        code: 'INSUFFICIENT_PERMISSIONS'
      },
      { status: 403 }
    );
  }

  return null; // Access allowed
}

/**
 * Middleware wrapper that enforces RBAC
 */
export function withManagerRBAC(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    // Check RBAC if role is present in context
    if (context?.role) {
      const rbacResult = enforceManagerRBAC(request, context.role);
      if (rbacResult) {
        return rbacResult; // Return 403 response
      }
    }

    // RBAC passed, continue to handler
    return handler(request, context);
  };
}
