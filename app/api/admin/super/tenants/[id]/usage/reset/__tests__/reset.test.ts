/**
 * Unit Tests for PUT /api/admin/super/tenants/:id/usage/reset
 * 
 * Feature: super-admin-controls
 * Task: 5.2 Create PUT /api/admin/super/tenants/:id/usage/reset endpoint
 * 
 * Tests usage reset endpoint:
 * - Resets current month usage to zero
 * - Creates audit log entry
 * - Returns updated usage record
 * - Handles validation errors
 * - Handles tenant not found errors
 * 
 * Requirements: 4.6
 */

import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { PUT } from '../route';

describe('PUT /api/admin/super/tenants/:id/usage/reset', () => {
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
    await prisma.monthlyUsage.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.plan.deleteMany({});
    await prisma.admin.deleteMany({});
  });

  describe('Successful usage reset', () => {
    it('should reset usage to zero when tenant has existing usage', async () => {
      // Create usage record with non-zero values
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 150,
          vouchersUsed: 75,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data.tenantId).toBe(testTenant.id);
      expect(data.spinsUsed).toBe(0);
      expect(data.vouchersUsed).toBe(0);
      expect(data.month).toBe(month);
      expect(data.year).toBe(year);
    });

    it('should create usage record if none exists and set to zero', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data.tenantId).toBe(testTenant.id);
      expect(data.spinsUsed).toBe(0);
      expect(data.vouchersUsed).toBe(0);
    });

    it('should create audit log entry when usage is reset', async () => {
      // Create usage record with non-zero values
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 200,
          vouchersUsed: 100,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      await PUT(request, { params: { id: testTenant.id } });

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'RESET_USAGE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('RESET_USAGE');
      expect(auditLogs[0].targetType).toBe('Tenant');
      expect(auditLogs[0].targetId).toBe(testTenant.id);
      expect(auditLogs[0].changes).toHaveProperty('before');
      expect(auditLogs[0].changes).toHaveProperty('after');
      expect((auditLogs[0].changes as any).before.spinsUsed).toBe(200);
      expect((auditLogs[0].changes as any).before.vouchersUsed).toBe(100);
      expect((auditLogs[0].changes as any).after.spinsUsed).toBe(0);
      expect((auditLogs[0].changes as any).after.vouchersUsed).toBe(0);
    });

    it('should reset only spins when vouchers are already zero', async () => {
      // Create usage record with only spins used
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 300,
          vouchersUsed: 0,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.spinsUsed).toBe(0);
      expect(data.vouchersUsed).toBe(0);
    });

    it('should reset only vouchers when spins are already zero', async () => {
      // Create usage record with only vouchers used
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 0,
          vouchersUsed: 250,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.spinsUsed).toBe(0);
      expect(data.vouchersUsed).toBe(0);
    });

    it('should be idempotent - resetting already zero usage', async () => {
      // Create usage record with zero values
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 0,
          vouchersUsed: 0,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.spinsUsed).toBe(0);
      expect(data.vouchersUsed).toBe(0);

      // Verify audit log still created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'RESET_USAGE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });
      expect(auditLogs).toHaveLength(1);
    });

    it('should allow multiple resets for same tenant', async () => {
      // Create usage record
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 100,
          vouchersUsed: 50,
        },
      });

      // First reset
      const request1 = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );
      const response1 = await PUT(request1, { params: { id: testTenant.id } });
      expect(response1.status).toBe(200);

      // Add some usage again
      await prisma.monthlyUsage.update({
        where: {
          tenantId_month_year: {
            tenantId: testTenant.id,
            month,
            year,
          },
        },
        data: {
          spinsUsed: 50,
          vouchersUsed: 25,
        },
      });

      // Second reset
      const request2 = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );
      const response2 = await PUT(request2, { params: { id: testTenant.id } });
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.spinsUsed).toBe(0);
      expect(data2.vouchersUsed).toBe(0);

      // Verify two audit logs exist
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'RESET_USAGE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });
      expect(auditLogs).toHaveLength(2);
    });
  });

  describe('Tenant validation', () => {
    it('should return 404 for non-existent tenant', async () => {
      const nonExistentId = 'non-existent-tenant-id';

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${nonExistentId}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: nonExistentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('TENANT_NOT_FOUND');
      expect(data.error.message).toContain('not found');
    });

    it('should return 400 for missing tenant ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/super/tenants//usage/reset',
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_TENANT_ID');
      expect(data.error.message).toBe('Tenant ID is required');
    });
  });

  describe('Response structure', () => {
    it('should return complete usage record', async () => {
      // Create usage record
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 100,
          vouchersUsed: 50,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Verify main fields
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('tenantId');
      expect(data).toHaveProperty('month');
      expect(data).toHaveProperty('year');
      expect(data).toHaveProperty('spinsUsed');
      expect(data).toHaveProperty('vouchersUsed');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });

    it('should return correct data types', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(typeof data.id).toBe('string');
      expect(typeof data.tenantId).toBe('string');
      expect(typeof data.month).toBe('number');
      expect(typeof data.year).toBe('number');
      expect(typeof data.spinsUsed).toBe('number');
      expect(typeof data.vouchersUsed).toBe('number');
      expect(typeof data.createdAt).toBe('string');
      expect(typeof data.updatedAt).toBe('string');
    });

    it('should return current month and year', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      const now = new Date();
      const expectedMonth = now.getMonth() + 1;
      const expectedYear = now.getFullYear();

      expect(response.status).toBe(200);
      expect(data.month).toBe(expectedMonth);
      expect(data.year).toBe(expectedYear);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large usage values being reset', async () => {
      // Create usage record with very large values
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 999999,
          vouchersUsed: 888888,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.spinsUsed).toBe(0);
      expect(data.vouchersUsed).toBe(0);

      // Verify audit log captured large values
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'RESET_USAGE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });
      expect((auditLogs[0].changes as any).before.spinsUsed).toBe(999999);
      expect((auditLogs[0].changes as any).before.vouchersUsed).toBe(888888);
    });

    it('should only affect current month usage, not historical records', async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Calculate previous month
      let previousMonth = currentMonth - 1;
      let previousYear = currentYear;
      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }

      // Create current month usage
      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month: currentMonth,
          year: currentYear,
          spinsUsed: 100,
          vouchersUsed: 50,
        },
      });

      // Create previous month usage (historical)
      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month: previousMonth,
          year: previousYear,
          spinsUsed: 200,
          vouchersUsed: 100,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const response = await PUT(request, { params: { id: testTenant.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.spinsUsed).toBe(0);
      expect(data.vouchersUsed).toBe(0);

      // Verify previous month usage is unchanged
      const previousMonthUsage = await prisma.monthlyUsage.findUnique({
        where: {
          tenantId_month_year: {
            tenantId: testTenant.id,
            month: previousMonth,
            year: previousYear,
          },
        },
      });

      expect(previousMonthUsage).toBeTruthy();
      expect(previousMonthUsage!.spinsUsed).toBe(200);
      expect(previousMonthUsage!.vouchersUsed).toBe(100);
    });

    it('should handle concurrent reset requests gracefully', async () => {
      // Create usage record
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 100,
          vouchersUsed: 50,
        },
      });

      // Make two concurrent reset requests
      const request1 = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const request2 = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      const [response1, response2] = await Promise.all([
        PUT(request1, { params: { id: testTenant.id } }),
        PUT(request2, { params: { id: testTenant.id } }),
      ]);

      // Both should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Both should show zero usage
      expect(data1.spinsUsed).toBe(0);
      expect(data1.vouchersUsed).toBe(0);
      expect(data2.spinsUsed).toBe(0);
      expect(data2.vouchersUsed).toBe(0);

      // Should have two audit log entries
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'RESET_USAGE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Audit log details', () => {
    it('should include admin ID in audit log', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      await PUT(request, { params: { id: testTenant.id } });

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'RESET_USAGE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].adminId).toBeTruthy();
      expect(typeof auditLogs[0].adminId).toBe('string');
    });

    it('should include before and after values in audit log changes', async () => {
      // Create usage record with specific values
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 123,
          vouchersUsed: 456,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      await PUT(request, { params: { id: testTenant.id } });

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'RESET_USAGE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });

      const changes = auditLogs[0].changes as any;
      expect(changes).toHaveProperty('before');
      expect(changes).toHaveProperty('after');
      expect(changes.before).toEqual({
        spinsUsed: 123,
        vouchersUsed: 456,
      });
      expect(changes.after).toEqual({
        spinsUsed: 0,
        vouchersUsed: 0,
      });
    });

    it('should create audit log even when usage was already zero', async () => {
      // Create usage record with zero values
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await prisma.monthlyUsage.create({
        data: {
          tenantId: testTenant.id,
          month,
          year,
          spinsUsed: 0,
          vouchersUsed: 0,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage/reset`,
        {
          method: 'PUT',
        }
      );

      await PUT(request, { params: { id: testTenant.id } });

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'RESET_USAGE',
          targetType: 'Tenant',
          targetId: testTenant.id,
        },
      });

      expect(auditLogs).toHaveLength(1);
      const changes = auditLogs[0].changes as any;
      expect(changes.before).toEqual({
        spinsUsed: 0,
        vouchersUsed: 0,
      });
      expect(changes.after).toEqual({
        spinsUsed: 0,
        vouchersUsed: 0,
      });
    });
  });
});
