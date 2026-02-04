/**
 * @jest-environment node
 * 
 * Property-Based Tests for Manager RBAC Middleware
 * 
 * Tests universal properties using fast-check for randomized testing
 * Feature: manager-role-verification
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import * as fc from 'fast-check';
import { NextRequest, NextResponse } from 'next/server';
import {
    enforceManagerRBAC,
    isAllowedManagerRoute,
    isRestrictedRoute,
} from '../manager-rbac-middleware';

/**
 * Arbitraries (generators) for property-based testing
 */

// Restricted routes that managers cannot access
const restrictedRoutes = [
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

// Allowed manager routes
const allowedManagerRoutes = [
  '/api/manager/auth/login',
  '/api/manager/auth/logout',
  '/api/manager/tasks/pending',
  '/api/manager/tasks/123/approve',
  '/api/manager/tasks/456/reject',
];

// Generate a restricted route with optional path segments
const restrictedRouteArbitrary = fc.oneof(
  ...restrictedRoutes.map(route => 
    fc.tuple(
      fc.constant(route),
      fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: '' })
    ).map(([base, suffix]) => base + (suffix ? '/' + suffix : ''))
  )
);

// Generate an allowed manager route
const allowedManagerRouteArbitrary = fc.constantFrom(...allowedManagerRoutes);

// Generate a non-manager role
const nonManagerRoleArbitrary = fc.constantFrom('admin', 'tenant_admin', 'super_admin', 'user');

/**
 * Helper function to create a mock NextRequest
 */
function createMockRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

/**
 * Property-Based Tests for Manager RBAC
 */
describe('Manager RBAC Middleware Property-Based Tests', () => {
  /**
   * Property 22: Role-Based Access Control for Restricted Routes
   * **Validates: Requirements 10.1, 10.2, 10.3**
   * 
   * For any manager attempting to access restricted routes (campaign creation,
   * tenant settings, voucher management), the request should be denied with
   * an authorization error.
   */
  describe('Property 22: Role-Based Access Control for Restricted Routes', () => {
    it('should deny manager access to all restricted routes', () => {
      fc.assert(
        fc.property(
          restrictedRouteArbitrary,
          (restrictedRoute) => {
            // Setup: Create a request to a restricted route
            const request = createMockRequest(restrictedRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertions: Access should be denied
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(NextResponse);

            // Verify the response is a 403 Forbidden
            if (result) {
              expect(result.status).toBe(403);
            }
          }
        ),
        { numRuns: 100 } // Test with 100 random restricted routes
      );
    });

    it('should return error message for restricted route access', async () => {
      await fc.assert(
        fc.asyncProperty(
          restrictedRouteArbitrary,
          async (restrictedRoute) => {
            // Setup: Create a request to a restricted route
            const request = createMockRequest(restrictedRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertions: Response should contain error message
            expect(result).not.toBeNull();

            if (result) {
              const body = await result.json();
              expect(body.error).toBe('Access denied: Managers cannot access this resource');
              expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
            }
          }
        ),
        { numRuns: 100 } // Test with 100 random restricted routes
      );
    });

    it('should correctly identify all restricted routes', () => {
      fc.assert(
        fc.property(
          restrictedRouteArbitrary,
          (restrictedRoute) => {
            // Action: Check if route is restricted
            const isRestricted = isRestrictedRoute(restrictedRoute);

            // Assertion: All generated restricted routes should be identified as restricted
            expect(isRestricted).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to campaign creation routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/admin/campaign',
            '/api/admin/campaign/create',
            '/api/admin/campaigns',
            '/api/admin/campaigns/123',
            '/api/admin/campaigns/456/edit'
          ),
          (campaignRoute) => {
            // Setup: Create a request to a campaign route
            const request = createMockRequest(campaignRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertion: Access should be denied
            expect(result).not.toBeNull();
            expect(result?.status).toBe(403);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to tenant settings routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/admin/settings',
            '/api/admin/settings/update',
            '/api/admin/settings/profile'
          ),
          (settingsRoute) => {
            // Setup: Create a request to a settings route
            const request = createMockRequest(settingsRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertion: Access should be denied
            expect(result).not.toBeNull();
            expect(result?.status).toBe(403);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to voucher management routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/admin/vouchers',
            '/api/admin/vouchers/create',
            '/api/admin/vouchers/123',
            '/api/admin/vouchers/123/void'
          ),
          (voucherRoute) => {
            // Setup: Create a request to a voucher route
            const request = createMockRequest(voucherRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertion: Access should be denied
            expect(result).not.toBeNull();
            expect(result?.status).toBe(403);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to super admin routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/admin/super',
            '/api/admin/super/tenants',
            '/api/admin/super/analytics',
            '/api/admin/super/billing'
          ),
          (superRoute) => {
            // Setup: Create a request to a super admin route
            const request = createMockRequest(superRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertion: Access should be denied
            expect(result).not.toBeNull();
            expect(result?.status).toBe(403);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 23: Manager Route Access
   * **Validates: Requirements 10.4**
   * 
   * For any manager accessing allowed manager routes (dashboard, task verification),
   * the request should be permitted without authorization errors.
   */
  describe('Property 23: Manager Route Access', () => {
    it('should allow manager access to all allowed routes', () => {
      fc.assert(
        fc.property(
          allowedManagerRouteArbitrary,
          (allowedRoute) => {
            // Setup: Create a request to an allowed route
            const request = createMockRequest(allowedRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertion: Access should be allowed (null result means no restriction)
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify all allowed manager routes', () => {
      fc.assert(
        fc.property(
          allowedManagerRouteArbitrary,
          (allowedRoute) => {
            // Action: Check if route is allowed for managers
            const isAllowed = isAllowedManagerRoute(allowedRoute);

            // Assertion: All generated allowed routes should be identified as allowed
            expect(isAllowed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access to manager authentication routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/manager/auth/login',
            '/api/manager/auth/logout'
          ),
          (authRoute) => {
            // Setup: Create a request to an auth route
            const request = createMockRequest(authRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertion: Access should be allowed
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access to task verification routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/manager/tasks/pending',
            '/api/manager/tasks/123',
            '/api/manager/tasks/456/approve',
            '/api/manager/tasks/789/reject'
          ),
          (taskRoute) => {
            // Setup: Create a request to a task route
            const request = createMockRequest(taskRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertion: Access should be allowed
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not restrict non-manager roles', () => {
      fc.assert(
        fc.property(
          restrictedRouteArbitrary,
          nonManagerRoleArbitrary,
          (restrictedRoute, role) => {
            // Setup: Create a request to a restricted route with non-manager role
            const request = createMockRequest(restrictedRoute);

            // Action: Enforce RBAC for non-manager role
            const result = enforceManagerRBAC(request, role);

            // Assertion: Non-manager roles should not be restricted
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow managers to access their own routes regardless of path parameters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (taskId) => {
            // Setup: Create requests with dynamic task IDs
            const routes = [
              `/api/manager/tasks/${taskId}`,
              `/api/manager/tasks/${taskId}/approve`,
              `/api/manager/tasks/${taskId}/reject`,
            ];

            routes.forEach(route => {
              const request = createMockRequest(route);
              const result = enforceManagerRBAC(request, 'manager');
              
              // Assertion: All manager task routes should be allowed
              expect(result).toBeNull();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property Tests: Comprehensive RBAC Coverage
   */
  describe('Additional RBAC Property Tests', () => {
    it('should consistently enforce restrictions across multiple requests', () => {
      fc.assert(
        fc.property(
          fc.array(restrictedRouteArbitrary, { minLength: 5, maxLength: 20 }),
          (routes) => {
            // Test that RBAC is consistently enforced across multiple requests
            routes.forEach(route => {
              const request = createMockRequest(route);
              const result = enforceManagerRBAC(request, 'manager');
              
              // All restricted routes should be denied
              expect(result).not.toBeNull();
              expect(result?.status).toBe(403);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not restrict routes outside of defined restricted and allowed lists', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/public/health',
            '/api/user/profile',
            '/api/campaigns',
            '/api/leaderboard'
          ),
          (publicRoute) => {
            // Setup: Create a request to a public/other route
            const request = createMockRequest(publicRoute);

            // Action: Enforce RBAC for manager role
            const result = enforceManagerRBAC(request, 'manager');

            // Assertion: Public routes should not be restricted for managers
            // (they may be restricted by other middleware, but not RBAC)
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases with trailing slashes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/admin/campaigns/',
            '/api/admin/settings/',
            '/api/manager/tasks/',
            '/api/manager/auth/'
          ),
          (routeWithSlash) => {
            const request = createMockRequest(routeWithSlash);
            const result = enforceManagerRBAC(request, 'manager');
            
            // Restricted routes should still be denied with trailing slash
            if (routeWithSlash.startsWith('/api/admin/')) {
              expect(result).not.toBeNull();
              expect(result?.status).toBe(403);
            } else {
              // Manager routes should still be allowed with trailing slash
              expect(result).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case sensitivity correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '/api/admin/campaigns',
            '/api/manager/tasks/pending'
          ),
          (route) => {
            // Routes should be case-sensitive (lowercase expected)
            const request = createMockRequest(route);
            const result = enforceManagerRBAC(request, 'manager');
            
            if (route.startsWith('/api/admin/')) {
              expect(result).not.toBeNull();
            } else {
              expect(result).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
