/**
 * Unit Tests for GET /api/admin/super/tenants/:id/usage
 * 
 * Feature: super-admin-controls
 * Task: 4.2 Create GET /api/admin/super/tenants/:id/usage endpoint
 * 
 * Tests tenant-specific usage statistics endpoint:
 * - Returns current month usage with limits and percentages
 * - Returns previous month usage for comparison
 * - Calculates usage trend (percentage change)
 * - Calculates days until monthly reset
 * - Handles tenant not found errors
 * - Handles missing tenant ID errors
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { GET } from '../[id]/usage/route';

describe('GET /api/admin/super/tenants/:id/usage', () => {
  let testTenant: any;
  let testPlan: any;
  let testSubscriptionPlan: any;
  let testAdmin: any;

  beforeEach(async () => {
    // Create test admin for limit overrides
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
    await prisma.tenantLimitOverride.deleteMany({});
    await prisma.monthlyUsage.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.plan.deleteMany({});
    await prisma.admin.deleteMany({});
  });

  it('should return usage data with zero usage for new tenant', async () => {
    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify current month structure
    expect(data).toHaveProperty('currentMonth');
    expect(data.currentMonth).toHaveProperty('spinsUsed');
    expect(data.currentMonth).toHaveProperty('spinsLimit');
    expect(data.currentMonth).toHaveProperty('spinsPercentage');
    expect(data.currentMonth).toHaveProperty('vouchersUsed');
    expect(data.currentMonth).toHaveProperty('vouchersLimit');
    expect(data.currentMonth).toHaveProperty('vouchersPercentage');
    expect(data.currentMonth).toHaveProperty('daysUntilReset');

    // Verify previous month structure
    expect(data).toHaveProperty('previousMonth');
    expect(data.previousMonth).toHaveProperty('spinsUsed');
    expect(data.previousMonth).toHaveProperty('vouchersUsed');

    // Verify trend structure
    expect(data).toHaveProperty('trend');
    expect(data.trend).toHaveProperty('spinsChange');
    expect(data.trend).toHaveProperty('vouchersChange');

    // Verify zero usage for new tenant
    expect(data.currentMonth.spinsUsed).toBe(0);
    expect(data.currentMonth.vouchersUsed).toBe(0);
    expect(data.currentMonth.spinsPercentage).toBe(0);
    expect(data.currentMonth.vouchersPercentage).toBe(0);

    // Verify limits match subscription plan
    expect(data.currentMonth.spinsLimit).toBe(1000);
    expect(data.currentMonth.vouchersLimit).toBe(500);

    // Verify days until reset is positive
    expect(data.currentMonth.daysUntilReset).toBeGreaterThan(0);
    expect(data.currentMonth.daysUntilReset).toBeLessThanOrEqual(31);
  });

  it('should return correct usage data with current month usage', async () => {
    // Create current month usage
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await prisma.monthlyUsage.create({
      data: {
        tenantId: testTenant.id,
        month: currentMonth,
        year: currentYear,
        spinsUsed: 250,
        vouchersUsed: 100,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.currentMonth.spinsUsed).toBe(250);
    expect(data.currentMonth.vouchersUsed).toBe(100);
    expect(data.currentMonth.spinsLimit).toBe(1000);
    expect(data.currentMonth.vouchersLimit).toBe(500);
    
    // Verify percentages are calculated correctly
    expect(data.currentMonth.spinsPercentage).toBe(25); // 250/1000 * 100 = 25%
    expect(data.currentMonth.vouchersPercentage).toBe(20); // 100/500 * 100 = 20%
  });

  it('should calculate usage trend with previous month data', async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calculate previous month/year
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = currentYear - 1;
    }

    // Create previous month usage
    await prisma.monthlyUsage.create({
      data: {
        tenantId: testTenant.id,
        month: previousMonth,
        year: previousYear,
        spinsUsed: 200,
        vouchersUsed: 80,
      },
    });

    // Create current month usage
    await prisma.monthlyUsage.create({
      data: {
        tenantId: testTenant.id,
        month: currentMonth,
        year: currentYear,
        spinsUsed: 300,
        vouchersUsed: 120,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify previous month data
    expect(data.previousMonth.spinsUsed).toBe(200);
    expect(data.previousMonth.vouchersUsed).toBe(80);

    // Verify trend calculation
    // Spins: (300 - 200) / 200 * 100 = 50%
    expect(data.trend.spinsChange).toBe(50);
    // Vouchers: (120 - 80) / 80 * 100 = 50%
    expect(data.trend.vouchersChange).toBe(50);
  });

  it('should handle negative trend (usage decreased)', async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = currentYear - 1;
    }

    // Previous month had higher usage
    await prisma.monthlyUsage.create({
      data: {
        tenantId: testTenant.id,
        month: previousMonth,
        year: previousYear,
        spinsUsed: 400,
        vouchersUsed: 200,
      },
    });

    // Current month has lower usage
    await prisma.monthlyUsage.create({
      data: {
        tenantId: testTenant.id,
        month: currentMonth,
        year: currentYear,
        spinsUsed: 200,
        vouchersUsed: 100,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify negative trend
    // Spins: (200 - 400) / 400 * 100 = -50%
    expect(data.trend.spinsChange).toBe(-50);
    // Vouchers: (100 - 200) / 200 * 100 = -50%
    expect(data.trend.vouchersChange).toBe(-50);
  });

  it('should include bonus limits from active overrides', async () => {
    // Create an active override
    await prisma.tenantLimitOverride.create({
      data: {
        tenantId: testTenant.id,
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Test bonus',
        grantedBy: testAdmin.id,
        isActive: true,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify limits include base + bonus
    expect(data.currentMonth.spinsLimit).toBe(1500); // 1000 + 500
    expect(data.currentMonth.vouchersLimit).toBe(750); // 500 + 250
  });

  it('should calculate correct percentages with overrides', async () => {
    // Create usage
    const now = new Date();
    await prisma.monthlyUsage.create({
      data: {
        tenantId: testTenant.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        spinsUsed: 750,
        vouchersUsed: 375,
      },
    });

    // Create override
    await prisma.tenantLimitOverride.create({
      data: {
        tenantId: testTenant.id,
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Test bonus',
        grantedBy: testAdmin.id,
        isActive: true,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify percentages calculated with effective limits
    // Spins: 750 / 1500 * 100 = 50%
    expect(data.currentMonth.spinsPercentage).toBe(50);
    // Vouchers: 375 / 750 * 100 = 50%
    expect(data.currentMonth.vouchersPercentage).toBe(50);
  });

  it('should return 404 for non-existent tenant', async () => {
    const nonExistentId = 'non-existent-tenant-id';
    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${nonExistentId}/usage`);
    const response = await GET(request, { params: { id: nonExistentId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('TENANT_NOT_FOUND');
    expect(data.error.message).toContain('not found');
  });

  it('should return 400 for missing tenant ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/super/tenants//usage');
    const response = await GET(request, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INVALID_TENANT_ID');
    expect(data.error.message).toBe('Tenant ID is required');
  });

  it('should handle tenant without subscription plan', async () => {
    // Create tenant without subscription plan
    const tenantWithoutPlan = await prisma.tenant.create({
      data: {
        name: 'Tenant Without Plan',
        slug: 'tenant-without-plan-' + Date.now(),
        planId: testPlan.id,
        isActive: true,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${tenantWithoutPlan.id}/usage`);
    const response = await GET(request, { params: { id: tenantWithoutPlan.id } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('TENANT_NOT_FOUND');

    // Clean up
    await prisma.tenant.delete({ where: { id: tenantWithoutPlan.id } });
  });

  it('should return consistent data types', async () => {
    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify all numeric fields are numbers
    expect(typeof data.currentMonth.spinsUsed).toBe('number');
    expect(typeof data.currentMonth.spinsLimit).toBe('number');
    expect(typeof data.currentMonth.spinsPercentage).toBe('number');
    expect(typeof data.currentMonth.vouchersUsed).toBe('number');
    expect(typeof data.currentMonth.vouchersLimit).toBe('number');
    expect(typeof data.currentMonth.vouchersPercentage).toBe('number');
    expect(typeof data.currentMonth.daysUntilReset).toBe('number');
    expect(typeof data.previousMonth.spinsUsed).toBe('number');
    expect(typeof data.previousMonth.vouchersUsed).toBe('number');
    expect(typeof data.trend.spinsChange).toBe('number');
    expect(typeof data.trend.vouchersChange).toBe('number');
  });

  it('should handle multiple active overrides additively', async () => {
    // Create multiple active overrides
    await prisma.tenantLimitOverride.create({
      data: {
        tenantId: testTenant.id,
        bonusSpins: 300,
        bonusVouchers: 150,
        reason: 'First bonus',
        grantedBy: testAdmin.id,
        isActive: true,
      },
    });

    await prisma.tenantLimitOverride.create({
      data: {
        tenantId: testTenant.id,
        bonusSpins: 200,
        bonusVouchers: 100,
        reason: 'Second bonus',
        grantedBy: testAdmin.id,
        isActive: true,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify limits include base + all bonuses
    expect(data.currentMonth.spinsLimit).toBe(1500); // 1000 + 300 + 200
    expect(data.currentMonth.vouchersLimit).toBe(750); // 500 + 150 + 100
  });

  it('should ignore expired overrides', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    // Create expired override
    await prisma.tenantLimitOverride.create({
      data: {
        tenantId: testTenant.id,
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Expired bonus',
        grantedBy: testAdmin.id,
        isActive: true,
        expiresAt: pastDate,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify limits only include base (expired override not counted)
    expect(data.currentMonth.spinsLimit).toBe(1000);
    expect(data.currentMonth.vouchersLimit).toBe(500);
  });

  it('should ignore inactive overrides', async () => {
    // Create inactive override
    await prisma.tenantLimitOverride.create({
      data: {
        tenantId: testTenant.id,
        bonusSpins: 500,
        bonusVouchers: 250,
        reason: 'Inactive bonus',
        grantedBy: testAdmin.id,
        isActive: false,
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/admin/super/tenants/${testTenant.id}/usage`);
    const response = await GET(request, { params: { id: testTenant.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify limits only include base (inactive override not counted)
    expect(data.currentMonth.spinsLimit).toBe(1000);
    expect(data.currentMonth.vouchersLimit).toBe(500);
  });
});
