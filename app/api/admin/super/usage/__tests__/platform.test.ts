/**
 * Unit Tests for GET /api/admin/super/usage/platform
 * 
 * Feature: super-admin-controls
 * Task: 4.1 Create GET /api/admin/super/usage/platform endpoint
 * 
 * Tests platform-wide usage statistics endpoint:
 * - Returns correct total spins count
 * - Returns correct total vouchers count
 * - Returns correct active tenants count
 * - Returns correct total tenants count
 * - Handles errors gracefully
 * 
 * Requirements: 2.1, 5.7
 */

import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { GET } from '../platform/route';

describe('GET /api/admin/super/usage/platform', () => {
  let testTenant1: any;
  let testTenant2: any;
  let testTenant3: any;
  let testPlan: any;
  let testSubscriptionPlan: any;
  let testCampaign1: any;
  let testCampaign2: any;
  let testUser1: any;
  let testUser2: any;
  let testPrize1: any;
  let testPrize2: any;

  beforeEach(async () => {
    // Create test subscription plan
    testSubscriptionPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Test Plan',
        price: 0,
        interval: 'MONTHLY',
        spinsPerMonth: 5000,
        vouchersPerMonth: 2000,
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

    // Create test tenants (2 active, 1 inactive)
    testTenant1 = await prisma.tenant.create({
      data: {
        name: 'Test Tenant 1',
        slug: 'test-tenant-1-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testSubscriptionPlan.id,
        isActive: true,
      },
    });

    testTenant2 = await prisma.tenant.create({
      data: {
        name: 'Test Tenant 2',
        slug: 'test-tenant-2-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testSubscriptionPlan.id,
        isActive: true,
      },
    });

    testTenant3 = await prisma.tenant.create({
      data: {
        name: 'Test Tenant 3',
        slug: 'test-tenant-3-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testSubscriptionPlan.id,
        isActive: false, // Inactive tenant
      },
    });

    // Create test campaigns
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    testCampaign1 = await prisma.campaign.create({
      data: {
        name: 'Test Campaign 1',
        tenantId: testTenant1.id,
        spinLimit: 10,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        startDate: now,
        endDate: endDate,
      },
    });

    testCampaign2 = await prisma.campaign.create({
      data: {
        name: 'Test Campaign 2',
        tenantId: testTenant2.id,
        spinLimit: 10,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        startDate: now,
        endDate: endDate,
      },
    });

    // Create test users
    testUser1 = await prisma.endUser.create({
      data: {
        tenantId: testTenant1.id,
        phone: '+919876543210',
        name: 'Test User 1',
      },
    });

    testUser2 = await prisma.endUser.create({
      data: {
        tenantId: testTenant2.id,
        phone: '+919876543211',
        name: 'Test User 2',
      },
    });

    // Create test prizes
    testPrize1 = await prisma.prize.create({
      data: {
        tenantId: testTenant1.id,
        campaignId: testCampaign1.id,
        name: 'Test Prize 1',
        probability: 50,
        dailyLimit: 100,
        position: 0,
      },
    });

    testPrize2 = await prisma.prize.create({
      data: {
        tenantId: testTenant2.id,
        campaignId: testCampaign2.id,
        name: 'Test Prize 2',
        probability: 50,
        dailyLimit: 100,
        position: 0,
      },
    });
  });

  afterEach(async () => {
    // Clean up in reverse order of dependencies
    await prisma.voucher.deleteMany({});
    await prisma.spin.deleteMany({});
    await prisma.prize.deleteMany({});
    await prisma.endUser.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.monthlyUsage.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.plan.deleteMany({});
  });

  it('should return zero counts when no spins or vouchers exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/super/usage/platform');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('totalSpins');
    expect(data).toHaveProperty('totalVouchers');
    expect(data).toHaveProperty('activeTenantsCount');
    expect(data).toHaveProperty('totalTenantsCount');
    
    // Verify spins and vouchers are zero (no spins/vouchers created in this test)
    expect(data.totalSpins).toBe(0);
    expect(data.totalVouchers).toBe(0);
    
    // Verify tenant counts include at least our test tenants
    expect(data.activeTenantsCount).toBeGreaterThanOrEqual(2); // At least testTenant1 and testTenant2
    expect(data.totalTenantsCount).toBeGreaterThanOrEqual(3); // At least all 3 test tenants
    expect(data.totalTenantsCount).toBeGreaterThanOrEqual(data.activeTenantsCount); // Total >= Active
  });

  it('should return correct counts with spins and vouchers', async () => {
    // Create spins for tenant 1
    const spin1 = await prisma.spin.create({
      data: {
        userId: testUser1.id,
        campaignId: testCampaign1.id,
        prizeId: testPrize1.id,
        wonPrize: true,
      },
    });

    const spin2 = await prisma.spin.create({
      data: {
        userId: testUser1.id,
        campaignId: testCampaign1.id,
        prizeId: testPrize1.id,
        wonPrize: true,
      },
    });

    // Create spins for tenant 2
    const spin3 = await prisma.spin.create({
      data: {
        userId: testUser2.id,
        campaignId: testCampaign2.id,
        prizeId: testPrize2.id,
        wonPrize: true,
      },
    });

    // Create vouchers
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.voucher.create({
      data: {
        code: 'VOUCHER1',
        spinId: spin1.id,
        prizeId: testPrize1.id,
        userId: testUser1.id,
        tenantId: testTenant1.id,
        expiresAt,
      },
    });

    await prisma.voucher.create({
      data: {
        code: 'VOUCHER2',
        spinId: spin2.id,
        prizeId: testPrize1.id,
        userId: testUser1.id,
        tenantId: testTenant1.id,
        expiresAt,
      },
    });

    await prisma.voucher.create({
      data: {
        code: 'VOUCHER3',
        spinId: spin3.id,
        prizeId: testPrize2.id,
        userId: testUser2.id,
        tenantId: testTenant2.id,
        expiresAt,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/usage/platform');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalSpins).toBe(3); // 3 spins created in this test
    expect(data.totalVouchers).toBe(3); // 3 vouchers created in this test
    expect(data.activeTenantsCount).toBeGreaterThanOrEqual(2); // At least our 2 active tenants
    expect(data.totalTenantsCount).toBeGreaterThanOrEqual(3); // At least our 3 tenants
  });

  it('should count active vs total tenants correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/super/usage/platform');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activeTenantsCount).toBeGreaterThanOrEqual(2); // At least our 2 active tenants
    expect(data.totalTenantsCount).toBeGreaterThanOrEqual(3); // At least our 3 tenants
    expect(data.totalTenantsCount).toBeGreaterThanOrEqual(data.activeTenantsCount); // Total >= Active
  });

  it('should aggregate spins and vouchers across all tenants', async () => {
    // Create multiple spins across different tenants
    const spin1 = await prisma.spin.create({
      data: {
        userId: testUser1.id,
        campaignId: testCampaign1.id,
        prizeId: testPrize1.id,
        wonPrize: true,
      },
    });

    const spin2 = await prisma.spin.create({
      data: {
        userId: testUser2.id,
        campaignId: testCampaign2.id,
        prizeId: testPrize2.id,
        wonPrize: false,
      },
    });

    const spin3 = await prisma.spin.create({
      data: {
        userId: testUser1.id,
        campaignId: testCampaign1.id,
        wonPrize: false,
      },
    });

    // Create vouchers for winning spins
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.voucher.create({
      data: {
        code: 'VOUCHER1',
        spinId: spin1.id,
        prizeId: testPrize1.id,
        userId: testUser1.id,
        tenantId: testTenant1.id,
        expiresAt,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/usage/platform');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalSpins).toBe(3); // All 3 spins created in this test
    expect(data.totalVouchers).toBe(1); // Only 1 voucher created in this test
  });

  it('should handle database errors gracefully', async () => {
    // Mock prisma to throw an error
    const originalCount = prisma.spin.count;
    prisma.spin.count = jest.fn().mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/admin/super/usage/platform');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INTERNAL_ERROR');
    expect(data.error.message).toBe('Failed to fetch platform usage statistics');

    // Restore original function
    prisma.spin.count = originalCount;
  });

  it('should return consistent data structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/super/usage/platform');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('totalSpins');
    expect(data).toHaveProperty('totalVouchers');
    expect(data).toHaveProperty('activeTenantsCount');
    expect(data).toHaveProperty('totalTenantsCount');
    expect(typeof data.totalSpins).toBe('number');
    expect(typeof data.totalVouchers).toBe('number');
    expect(typeof data.activeTenantsCount).toBe('number');
    expect(typeof data.totalTenantsCount).toBe('number');
  });
});
