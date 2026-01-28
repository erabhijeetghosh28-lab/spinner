/**
 * Unit Tests for GET /api/admin/super/billing/renewals
 * 
 * Feature: super-admin-controls
 * Task: 6.3 Create GET /api/admin/super/billing/renewals endpoint
 * 
 * Tests upcoming renewals endpoint:
 * - Returns tenants with upcoming renewals within specified days
 * - Accepts and validates 'days' query parameter
 * - Defaults to 7 days when parameter not provided
 * - Returns correct TenantWithRenewal structure
 * - Filters tenants correctly based on renewal date
 * - Sorts results by renewal date (soonest first)
 * - Handles edge cases and errors gracefully
 * 
 * Requirements: 5.4
 */

import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('GET /api/admin/super/billing/renewals', () => {
  let testPlan: any;
  let testPlanStarter: any;
  let testPlanPro: any;

  beforeEach(async () => {
    // Create test subscription plans
    testPlanStarter = await prisma.subscriptionPlan.create({
      data: {
        name: 'Starter',
        price: 999, // ₹9.99 in paise
        interval: 'MONTHLY',
        spinsPerMonth: 1000,
        vouchersPerMonth: 500,
      },
    });

    testPlanPro = await prisma.subscriptionPlan.create({
      data: {
        name: 'Pro',
        price: 2999, // ₹29.99 in paise
        interval: 'MONTHLY',
        spinsPerMonth: 5000,
        vouchersPerMonth: 2000,
      },
    });

    // Create legacy plan for compatibility
    testPlan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
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

  it('should return upcoming renewals within default 7 days', async () => {
    const now = new Date();
    const in5Days = new Date(now);
    in5Days.setDate(in5Days.getDate() + 5);

    const in10Days = new Date(now);
    in10Days.setDate(in10Days.getDate() + 10);

    // Create tenant with renewal in 5 days (should be included)
    await prisma.tenant.create({
      data: {
        name: 'Renewal Soon',
        slug: 'renewal-soon-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in5Days,
        isActive: true,
      },
    });

    // Create tenant with renewal in 10 days (should not be included)
    await prisma.tenant.create({
      data: {
        name: 'Renewal Later',
        slug: 'renewal-later-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in10Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    
    // Should include the tenant with renewal in 5 days
    const upcomingRenewal = data.find((r: any) => r.name === 'Renewal Soon');
    expect(upcomingRenewal).toBeDefined();
    expect(upcomingRenewal.planName).toBe('Starter');
    expect(upcomingRenewal.planPrice).toBe(999);
    
    // Should not include the tenant with renewal in 10 days
    const laterRenewal = data.find((r: any) => r.name === 'Renewal Later');
    expect(laterRenewal).toBeUndefined();
  });

  it('should accept custom days parameter', async () => {
    const now = new Date();
    const in8Days = new Date(now);
    in8Days.setDate(in8Days.getDate() + 8);

    const in15Days = new Date(now);
    in15Days.setDate(in15Days.getDate() + 15);

    // Create tenant with renewal in 8 days
    await prisma.tenant.create({
      data: {
        name: 'Renewal 8 Days',
        slug: 'renewal-8-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in8Days,
        isActive: true,
      },
    });

    // Create tenant with renewal in 15 days
    await prisma.tenant.create({
      data: {
        name: 'Renewal 15 Days',
        slug: 'renewal-15-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in15Days,
        isActive: true,
      },
    });

    // Request with days=10 (should include 8 days, not 15 days)
    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals?days=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    
    // Should include the tenant with renewal in 8 days
    const renewal8Days = data.find((r: any) => r.name === 'Renewal 8 Days');
    expect(renewal8Days).toBeDefined();
    
    // Should not include the tenant with renewal in 15 days
    const renewal15Days = data.find((r: any) => r.name === 'Renewal 15 Days');
    expect(renewal15Days).toBeUndefined();
  });

  it('should return all required fields in TenantWithRenewal structure', async () => {
    const now = new Date();
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);

    await prisma.tenant.create({
      data: {
        name: 'Test Renewal',
        slug: 'test-renewal-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in3Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const renewal = data.find((r: any) => r.name === 'Test Renewal');
    expect(renewal).toBeDefined();
    expect(renewal).toHaveProperty('id');
    expect(renewal).toHaveProperty('name');
    expect(renewal).toHaveProperty('subscriptionEnd');
    expect(renewal).toHaveProperty('daysUntilRenewal');
    expect(renewal).toHaveProperty('planName');
    expect(renewal).toHaveProperty('planPrice');
    
    expect(typeof renewal.id).toBe('string');
    expect(typeof renewal.name).toBe('string');
    expect(typeof renewal.daysUntilRenewal).toBe('number');
    expect(typeof renewal.planName).toBe('string');
    expect(typeof renewal.planPrice).toBe('number');
  });

  it('should calculate daysUntilRenewal correctly', async () => {
    const now = new Date();
    const in4Days = new Date(now);
    in4Days.setDate(in4Days.getDate() + 4);

    await prisma.tenant.create({
      data: {
        name: 'Renewal 4 Days',
        slug: 'renewal-4-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in4Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const renewal = data.find((r: any) => r.name === 'Renewal 4 Days');
    expect(renewal).toBeDefined();
    // Allow for some variance due to timing
    expect(renewal.daysUntilRenewal).toBeGreaterThanOrEqual(3);
    expect(renewal.daysUntilRenewal).toBeLessThanOrEqual(5);
  });

  it('should sort renewals by date (soonest first)', async () => {
    const now = new Date();
    
    const in2Days = new Date(now);
    in2Days.setDate(in2Days.getDate() + 2);
    
    const in5Days = new Date(now);
    in5Days.setDate(in5Days.getDate() + 5);
    
    const in6Days = new Date(now);
    in6Days.setDate(in6Days.getDate() + 6);

    await prisma.tenant.create({
      data: {
        name: 'Renewal Day 5',
        slug: 'renewal-day-5-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in5Days,
        isActive: true,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Renewal Day 2',
        slug: 'renewal-day-2-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in2Days,
        isActive: true,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Renewal Day 6',
        slug: 'renewal-day-6-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in6Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(3);
    
    // Find our test renewals
    const renewals = data.filter(
      (r: any) => r.name.startsWith('Renewal Day')
    );
    
    expect(renewals.length).toBe(3);
    
    // Verify they are sorted by daysUntilRenewal (ascending)
    for (let i = 0; i < renewals.length - 1; i++) {
      expect(renewals[i].daysUntilRenewal).toBeLessThanOrEqual(renewals[i + 1].daysUntilRenewal);
    }
  });

  it('should return empty array when no renewals upcoming', async () => {
    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    // Create tenant with renewal far in the future
    await prisma.tenant.create({
      data: {
        name: 'Renewal Far Future',
        slug: 'renewal-far-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in30Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it('should handle invalid days parameter (non-numeric)', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals?days=invalid');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INVALID_PARAMETER');
    expect(data.error.message).toContain('Invalid days parameter');
  });

  it('should handle invalid days parameter (negative)', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals?days=-5');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INVALID_PARAMETER');
    expect(data.error.message).toContain('Invalid days parameter');
  });

  it('should handle invalid days parameter (zero)', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals?days=0');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INVALID_PARAMETER');
    expect(data.error.message).toContain('Invalid days parameter');
  });

  it('should handle large days parameter', async () => {
    const now = new Date();
    const in60Days = new Date(now);
    in60Days.setDate(in60Days.getDate() + 60);

    await prisma.tenant.create({
      data: {
        name: 'Renewal 60 Days',
        slug: 'renewal-60-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in60Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals?days=90');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    
    const renewal = data.find((r: any) => r.name === 'Renewal 60 Days');
    expect(renewal).toBeDefined();
  });

  it('should only include tenants with subscription plans', async () => {
    const now = new Date();
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);

    // Create tenant without subscription plan
    await prisma.tenant.create({
      data: {
        name: 'No Plan Tenant',
        slug: 'no-plan-' + Date.now(),
        planId: testPlan.id,
        subscriptionEnd: in3Days,
        isActive: true,
      },
    });

    // Create tenant with subscription plan
    await prisma.tenant.create({
      data: {
        name: 'With Plan Tenant',
        slug: 'with-plan-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in3Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Should include tenant with plan
    const withPlan = data.find((r: any) => r.name === 'With Plan Tenant');
    expect(withPlan).toBeDefined();
    
    // Should not include tenant without plan
    const noPlan = data.find((r: any) => r.name === 'No Plan Tenant');
    expect(noPlan).toBeUndefined();
  });

  it('should handle tenants with renewal today', async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    await prisma.tenant.create({
      data: {
        name: 'Renewal Today',
        slug: 'renewal-today-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: today,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const renewal = data.find((r: any) => r.name === 'Renewal Today');
    expect(renewal).toBeDefined();
    expect(renewal.daysUntilRenewal).toBeGreaterThanOrEqual(0);
    expect(renewal.daysUntilRenewal).toBeLessThanOrEqual(1);
  });

  it('should handle database errors gracefully', async () => {
    // Mock billingService to throw an error
    const billingService = require('@/lib/billing-service').billingService;
    const originalGetUpcomingRenewals = billingService.getUpcomingRenewals;
    billingService.getUpcomingRenewals = jest.fn().mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INTERNAL_ERROR');
    expect(data.error.message).toBe('Failed to fetch upcoming renewals');

    // Restore original function
    billingService.getUpcomingRenewals = originalGetUpcomingRenewals;
  });

  it('should handle multiple tenants with same renewal date', async () => {
    const now = new Date();
    const in4Days = new Date(now);
    in4Days.setDate(in4Days.getDate() + 4);

    await prisma.tenant.create({
      data: {
        name: 'Tenant A',
        slug: 'tenant-a-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in4Days,
        isActive: true,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Tenant B',
        slug: 'tenant-b-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in4Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const tenantA = data.find((r: any) => r.name === 'Tenant A');
    const tenantB = data.find((r: any) => r.name === 'Tenant B');
    
    expect(tenantA).toBeDefined();
    expect(tenantB).toBeDefined();
    expect(tenantA.daysUntilRenewal).toBe(tenantB.daysUntilRenewal);
  });

  it('should include correct plan information', async () => {
    const now = new Date();
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);

    await prisma.tenant.create({
      data: {
        name: 'Plan Info Test',
        slug: 'plan-info-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in3Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const renewal = data.find((r: any) => r.name === 'Plan Info Test');
    expect(renewal).toBeDefined();
    expect(renewal.planName).toBe('Pro');
    expect(renewal.planPrice).toBe(2999);
  });

  it('should handle days parameter as string number', async () => {
    const now = new Date();
    const in12Days = new Date(now);
    in12Days.setDate(in12Days.getDate() + 12);

    await prisma.tenant.create({
      data: {
        name: 'Renewal 12 Days',
        slug: 'renewal-12-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in12Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals?days=15');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const renewal = data.find((r: any) => r.name === 'Renewal 12 Days');
    expect(renewal).toBeDefined();
  });

  it('should not include past renewals', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.tenant.create({
      data: {
        name: 'Past Renewal',
        slug: 'past-renewal-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: yesterday,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/renewals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const pastRenewal = data.find((r: any) => r.name === 'Past Renewal');
    expect(pastRenewal).toBeUndefined();
  });
});
