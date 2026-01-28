/**
 * Unit Tests for POST /api/admin/super/tenants/:id/overrides
 * 
 * Feature: super-admin-controls
 * Task: 5.1 Create POST /api/admin/super/tenants/:id/overrides endpoint
 * 
 * Tests manual limit override creation endpoint:
 * - Validates bonus amounts (must be positive)
 * - Validates reason (must be non-empty string)
 * - Creates TenantLimitOverride record
 * - Creates audit log entry
 * - Returns created override record
 * - Handles validation errors
 * - Handles tenant not found errors
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('POST /api/admin/super/tenants/:id/overrides', () => {
  let testTenant: any;
  let testPlan: any;
  let testSubscriptionPlan: any;
  let testAdmin: any;

  beforeEach(async () => {
    // Create test admin
    testAdmin = await prisma.admin.create({
      data: {
        email: 'test-admin-' + Date.now() + '@example.com',
        password: 'hashed-password',
        name: 'Test Admin',
        isSuperAdmin: true,
      },
    });

    // Create test subscription plan
    testSubscriptionPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Test Plan',
        price: 0,
        interval: 'MONTHLY',
        spinsPerMonth: 1000,
        vouchersPerMonth: 500,
      },
    });

    // Create test plan (legacy)
    testPlan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        slug: 'test-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testSubscriptionPlan.id,
        isActive: true,
      },
    });
  });

  afterEach(async () => {
    // Clean up in reverse order of dependencies
    await prisma.auditLog.deleteMany({});
    await prisma.tenantLimitOverride.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.plan.deleteMany({});
    await prisma.admin.deleteMany({});
  });

  describe('Successful override creation', () => {
    it('should create override with bonus spins only', async () => {
      const requestBody = {
        bonusSpins: 500,
        reason: 'Customer requested additional capacity',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.tenantId).toBe(testTenant.id);
      expect(data.bonusSpins).toBe(500);
      expect(data.bonusVouchers).toBe(0);
      expect(data.reason).toBe('Customer requested additional capacity');
      expect(data.isActive).toBe(true);
      expect(data.expiresAt).toBeNull();
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('tenant');
      expect(data).toHaveProperty('grantedByAdmin');
    });

    it('should create override with bonus vouchers only', async () => {
      const requestBody = {
        bonusVouchers: 250,
        reason: 'Promotional campaign support',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.bonusSpins).toBe(0);
      expect(data.bonusVouchers).toBe(250);
      expect(data.reason).toBe('Promotional campaign support');
    });

    it('should create override with both bonus spins and vouchers', async () => {
      const requestBody = {
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Full capacity boost for special event',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.bonusSpins).toBe(500);
      expect(data.bonusVouchers).toBe(250);
      expect(data.reason).toBe('Full capacity boost for special event');
    });

    it('should create override with expiration date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

      const requestBody = {
        bonusSpins: 500,
        reason: 'Temporary capacity increase',
        expiresAt: futureDate.toISOString(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.expiresAt).toBeTruthy();
      const expiresAt = new Date(data.expiresAt);
      expect(expiresAt.getTime()).toBeCloseTo(futureDate.getTime(), -3); // Within seconds
    });

    it('should create audit log entry when override is created', async () => {
      const requestBody = {
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Test audit logging',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      await POST(request, { params: { id: testTenant.id } });

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'GRANT_OVERRIDE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('GRANT_OVERRIDE');
      expect(auditLogs[0].targetType).toBe('Tenant');
      expect(auditLogs[0].targetId).toBe(testTenant.id);
      expect(auditLogs[0].changes).toEqual({
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Test audit logging',
        expiresAt: null,
      });
    });

    it('should trim whitespace from reason', async () => {
      const requestBody = {
        bonusSpins: 100,
        reason: '  Reason with extra spaces  ',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.reason).toBe('Reason with extra spaces');
    });

    it('should allow creating multiple overrides for same tenant', async () => {
      // Create first override
      const request1 = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify({
            bonusSpins: 300,
            reason: 'First override',
          }),
        }
      );
      const response1 = await POST(request1, { params: { id: testTenant.id } });
      expect(response1.status).toBe(201);

      // Create second override
      const request2 = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify({
            bonusVouchers: 150,
            reason: 'Second override',
          }),
        }
      );
      const response2 = await POST(request2, { params: { id: testTenant.id } });
      expect(response2.status).toBe(201);

      // Verify both exist
      const overrides = await prisma.tenantLimitOverride.findMany({
        where: { tenantId: testTenant.id },
      });
      expect(overrides).toHaveLength(2);
    });
  });

  describe('Validation errors', () => {
    it('should reject request with missing reason', async () => {
      const requestBody = {
        bonusSpins: 500,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_REASON');
      expect(data.error.message).toContain('required');
    });

    it('should reject request with empty reason', async () => {
      const requestBody = {
        bonusSpins: 500,
        reason: '',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_REASON');
    });

    it('should reject request with whitespace-only reason', async () => {
      const requestBody = {
        bonusSpins: 500,
        reason: '   ',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_REASON');
    });

    it('should reject request with non-string reason', async () => {
      const requestBody = {
        bonusSpins: 500,
        reason: 123, // Number instead of string
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_REASON');
    });

    it('should reject request with zero bonus spins', async () => {
      const requestBody = {
        bonusSpins: 0,
        reason: 'Test zero spins',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_BONUS_SPINS');
      expect(data.error.message).toContain('positive');
    });

    it('should reject request with negative bonus spins', async () => {
      const requestBody = {
        bonusSpins: -100,
        reason: 'Test negative spins',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_BONUS_SPINS');
    });

    it('should reject request with zero bonus vouchers', async () => {
      const requestBody = {
        bonusVouchers: 0,
        reason: 'Test zero vouchers',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_BONUS_VOUCHERS');
      expect(data.error.message).toContain('positive');
    });

    it('should reject request with negative bonus vouchers', async () => {
      const requestBody = {
        bonusVouchers: -50,
        reason: 'Test negative vouchers',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_BONUS_VOUCHERS');
    });

    it('should reject request with neither bonus spins nor vouchers', async () => {
      const requestBody = {
        reason: 'Test no bonuses',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_BONUS_AMOUNTS');
      expect(data.error.message).toContain('At least one');
    });

    it('should reject request with invalid expiresAt date', async () => {
      const requestBody = {
        bonusSpins: 500,
        reason: 'Test invalid date',
        expiresAt: 'not-a-date',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_EXPIRES_AT');
      expect(data.error.message).toContain('valid ISO date');
    });

    it('should reject request with past expiresAt date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const requestBody = {
        bonusSpins: 500,
        reason: 'Test past date',
        expiresAt: pastDate.toISOString(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_EXPIRES_AT');
      expect(data.error.message).toContain('future');
    });

    it('should reject request with invalid JSON', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: 'invalid json{',
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_JSON');
    });
  });

  describe('Tenant validation', () => {
    it('should return 404 for non-existent tenant', async () => {
      const nonExistentId = 'non-existent-tenant-id';
      const requestBody = {
        bonusSpins: 500,
        reason: 'Test non-existent tenant',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${nonExistentId}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: nonExistentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('TENANT_NOT_FOUND');
      expect(data.error.message).toContain('not found');
    });

    it('should return 400 for missing tenant ID', async () => {
      const requestBody = {
        bonusSpins: 500,
        reason: 'Test missing tenant ID',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/super/tenants//overrides',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_TENANT_ID');
      expect(data.error.message).toBe('Tenant ID is required');
    });
  });

  describe('Response structure', () => {
    it('should return complete override record with relations', async () => {
      const requestBody = {
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Test complete response',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      
      // Verify main fields
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('tenantId');
      expect(data).toHaveProperty('bonusSpins');
      expect(data).toHaveProperty('bonusVouchers');
      expect(data).toHaveProperty('reason');
      expect(data).toHaveProperty('grantedBy');
      expect(data).toHaveProperty('isActive');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('expiresAt');

      // Verify tenant relation
      expect(data).toHaveProperty('tenant');
      expect(data.tenant).toHaveProperty('id');
      expect(data.tenant).toHaveProperty('name');
      expect(data.tenant.id).toBe(testTenant.id);

      // Verify admin relation
      expect(data).toHaveProperty('grantedByAdmin');
      expect(data.grantedByAdmin).toHaveProperty('id');
      expect(data.grantedByAdmin).toHaveProperty('email');
    });

    it('should return correct data types', async () => {
      const requestBody = {
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Test data types',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(typeof data.id).toBe('string');
      expect(typeof data.tenantId).toBe('string');
      expect(typeof data.bonusSpins).toBe('number');
      expect(typeof data.bonusVouchers).toBe('number');
      expect(typeof data.reason).toBe('string');
      expect(typeof data.grantedBy).toBe('string');
      expect(typeof data.isActive).toBe('boolean');
      expect(typeof data.createdAt).toBe('string');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large bonus amounts', async () => {
      const requestBody = {
        bonusSpins: 1000000,
        bonusVouchers: 500000,
        reason: 'Test large amounts',
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.bonusSpins).toBe(1000000);
      expect(data.bonusVouchers).toBe(500000);
    });

    it('should handle very long reason text', async () => {
      const longReason = 'A'.repeat(1000);
      const requestBody = {
        bonusSpins: 100,
        reason: longReason,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.reason).toBe(longReason);
    });

    it('should handle special characters in reason', async () => {
      const specialReason = 'Reason with special chars: @#$%^&*()[]{}|\\/<>?';
      const requestBody = {
        bonusSpins: 100,
        reason: specialReason,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/overrides`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      const response = await POST(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.reason).toBe(specialReason);
    });
  });
});
