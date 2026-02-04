/**
 * @jest-environment node
 * 
 * Unit tests for Manager RBAC Middleware Edge Cases
 * 
 * Tests specific scenarios for role-based access control:
 * - Manager accessing campaign routes (denied)
 * - Manager accessing tenant settings (denied)
 * - Manager accessing voucher management (denied)
 * - Manager accessing allowed routes (permitted)
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { NextRequest } from 'next/server';
import {
    enforceManagerRBAC,
    isAllowedManagerRoute,
    isRestrictedRoute,
} from '../manager-rbac-middleware';

// Helper function to create mock NextRequest
function createMockRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('Manager RBAC Middleware - Edge Cases', () => {
  describe('Campaign Route Access (Requirement 10.1)', () => {
    it('should deny manager access to campaign creation route', () => {
      const request = createMockRequest('/api/admin/campaign');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to campaigns listing route', () => {
      const request = createMockRequest('/api/admin/campaigns');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to specific campaign route', () => {
      const request = createMockRequest('/api/admin/campaigns/campaign123');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to campaign check-limit route', () => {
      const request = createMockRequest('/api/admin/campaigns/check-limit');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should return error message for campaign route access', async () => {
      const request = createMockRequest('/api/admin/campaign');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      const json = await result?.json();
      expect(json.error).toBe('Access denied: Managers cannot access this resource');
      expect(json.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Tenant Settings Access (Requirement 10.2)', () => {
    it('should deny manager access to tenant settings route', () => {
      const request = createMockRequest('/api/admin/settings');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to landing page settings', () => {
      const request = createMockRequest('/api/admin/landing-page');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to landing page footer settings', () => {
      const request = createMockRequest('/api/admin/landing-page/footer');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to social tasks settings', () => {
      const request = createMockRequest('/api/admin/social-tasks');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to prizes settings', () => {
      const request = createMockRequest('/api/admin/prizes');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should return error message for settings route access', async () => {
      const request = createMockRequest('/api/admin/settings');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      const json = await result?.json();
      expect(json.error).toBe('Access denied: Managers cannot access this resource');
      expect(json.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Voucher Management Access (Requirement 10.3)', () => {
    it('should deny manager access to vouchers route', () => {
      const request = createMockRequest('/api/admin/vouchers');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to QR code generation', () => {
      const request = createMockRequest('/api/admin/qr');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to branded QR generation', () => {
      const request = createMockRequest('/api/admin/qr/branded');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to file upload', () => {
      const request = createMockRequest('/api/admin/upload');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should return error message for voucher route access', async () => {
      const request = createMockRequest('/api/admin/vouchers');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      const json = await result?.json();
      expect(json.error).toBe('Access denied: Managers cannot access this resource');
      expect(json.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Super Admin Access', () => {
    it('should deny manager access to super admin routes', () => {
      const request = createMockRequest('/api/admin/super/tenants');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to super admin analytics', () => {
      const request = createMockRequest('/api/admin/super/analytics');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should deny manager access to super admin billing', () => {
      const request = createMockRequest('/api/admin/super/billing/dashboard');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });
  });

  describe('Allowed Manager Routes (Requirement 10.4)', () => {
    it('should permit manager access to login route', () => {
      const request = createMockRequest('/api/manager/auth/login');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).toBeNull();
    });

    it('should permit manager access to logout route', () => {
      const request = createMockRequest('/api/manager/auth/logout');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).toBeNull();
    });

    it('should permit manager access to pending tasks route', () => {
      const request = createMockRequest('/api/manager/tasks/pending');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).toBeNull();
    });

    it('should permit manager access to specific task route', () => {
      const request = createMockRequest('/api/manager/tasks/task123');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).toBeNull();
    });

    it('should permit manager access to task approval route', () => {
      const request = createMockRequest('/api/manager/tasks/task123/approve');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).toBeNull();
    });

    it('should permit manager access to task rejection route', () => {
      const request = createMockRequest('/api/manager/tasks/task123/reject');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).toBeNull();
    });
  });

  describe('Route Detection Helpers', () => {
    it('should correctly identify restricted routes', () => {
      expect(isRestrictedRoute('/api/admin/campaign')).toBe(true);
      expect(isRestrictedRoute('/api/admin/campaigns')).toBe(true);
      expect(isRestrictedRoute('/api/admin/settings')).toBe(true);
      expect(isRestrictedRoute('/api/admin/vouchers')).toBe(true);
      expect(isRestrictedRoute('/api/admin/qr')).toBe(true);
      expect(isRestrictedRoute('/api/admin/prizes')).toBe(true);
      expect(isRestrictedRoute('/api/admin/upload')).toBe(true);
      expect(isRestrictedRoute('/api/admin/landing-page')).toBe(true);
      expect(isRestrictedRoute('/api/admin/social-tasks')).toBe(true);
      expect(isRestrictedRoute('/api/admin/super')).toBe(true);
    });

    it('should correctly identify allowed manager routes', () => {
      expect(isAllowedManagerRoute('/api/manager/auth/login')).toBe(true);
      expect(isAllowedManagerRoute('/api/manager/auth/logout')).toBe(true);
      expect(isAllowedManagerRoute('/api/manager/tasks/pending')).toBe(true);
      expect(isAllowedManagerRoute('/api/manager/tasks/task123')).toBe(true);
    });

    it('should not identify manager routes as restricted', () => {
      expect(isRestrictedRoute('/api/manager/auth/login')).toBe(false);
      expect(isRestrictedRoute('/api/manager/tasks/pending')).toBe(false);
    });

    it('should not identify restricted routes as allowed manager routes', () => {
      expect(isAllowedManagerRoute('/api/admin/campaign')).toBe(false);
      expect(isAllowedManagerRoute('/api/admin/settings')).toBe(false);
      expect(isAllowedManagerRoute('/api/admin/vouchers')).toBe(false);
    });
  });

  describe('Non-Manager Roles', () => {
    it('should not restrict tenant admin access to campaign routes', () => {
      const request = createMockRequest('/api/admin/campaign');
      const result = enforceManagerRBAC(request, 'tenant_admin');
      
      expect(result).toBeNull();
    });

    it('should not restrict tenant admin access to settings routes', () => {
      const request = createMockRequest('/api/admin/settings');
      const result = enforceManagerRBAC(request, 'tenant_admin');
      
      expect(result).toBeNull();
    });

    it('should not restrict tenant admin access to voucher routes', () => {
      const request = createMockRequest('/api/admin/vouchers');
      const result = enforceManagerRBAC(request, 'tenant_admin');
      
      expect(result).toBeNull();
    });

    it('should not restrict super admin access to any routes', () => {
      const request = createMockRequest('/api/admin/super/tenants');
      const result = enforceManagerRBAC(request, 'super_admin');
      
      expect(result).toBeNull();
    });

    it('should not restrict undefined role', () => {
      const request = createMockRequest('/api/admin/campaign');
      const result = enforceManagerRBAC(request, 'undefined');
      
      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle routes with query parameters', () => {
      const request = createMockRequest('/api/admin/campaigns?status=active');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should handle routes with trailing slashes', () => {
      const request = createMockRequest('/api/admin/campaign/');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should handle deeply nested restricted routes', () => {
      const request = createMockRequest('/api/admin/campaigns/123/settings/advanced');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should handle deeply nested allowed routes', () => {
      const request = createMockRequest('/api/manager/tasks/123/approve/confirm');
      const result = enforceManagerRBAC(request, 'manager');
      
      expect(result).toBeNull();
    });

    it('should be case-sensitive for routes', () => {
      // Uppercase should not match lowercase route patterns
      const request = createMockRequest('/api/admin/CAMPAIGN');
      const result = enforceManagerRBAC(request, 'manager');
      
      // Route matching is case-sensitive, so /api/admin/CAMPAIGN doesn't match /api/admin/campaign
      // This means the uppercase version is NOT restricted (though it wouldn't exist in practice)
      expect(result).toBeNull();
    });

    it('should handle empty role string', () => {
      const request = createMockRequest('/api/admin/campaign');
      const result = enforceManagerRBAC(request, '');
      
      expect(result).toBeNull();
    });

    it('should handle role with different casing', () => {
      const request = createMockRequest('/api/admin/campaign');
      const result = enforceManagerRBAC(request, 'Manager');
      
      // Should not restrict because role is case-sensitive
      expect(result).toBeNull();
    });
  });

  describe('Multiple Restricted Routes in Sequence', () => {
    it('should consistently deny access to multiple restricted routes', () => {
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

      restrictedRoutes.forEach(route => {
        const request = createMockRequest(route);
        const result = enforceManagerRBAC(request, 'manager');
        
        expect(result).not.toBeNull();
        expect(result?.status).toBe(403);
      });
    });
  });

  describe('Multiple Allowed Routes in Sequence', () => {
    it('should consistently permit access to multiple allowed routes', () => {
      const allowedRoutes = [
        '/api/manager/auth/login',
        '/api/manager/auth/logout',
        '/api/manager/tasks/pending',
        '/api/manager/tasks/task123',
        '/api/manager/tasks/task456/approve',
        '/api/manager/tasks/task789/reject',
      ];

      allowedRoutes.forEach(route => {
        const request = createMockRequest(route);
        const result = enforceManagerRBAC(request, 'manager');
        
        expect(result).toBeNull();
      });
    });
  });
});
