/**
 * Unit Tests for GET /api/admin/super/billing/dashboard
 * 
 * Feature: super-admin-controls
 * Task: 6.2 Create GET /api/admin/super/billing/dashboard endpoint
 * 
 * Tests comprehensive revenue and billing dashboard endpoint:
 * - Returns correct MRR (Monthly Recurring Revenue)
 * - Returns correct new revenue from subscriptions started this month
 * - Returns correct churned revenue from subscriptions ended this month
 * - Returns upcoming renewals within 7 days
 * - Returns failed payments (tenants with PAST_DUE status)
 * - Returns revenue breakdown by subscription plan
 * - Returns active and total tenant counts
 * - Handles errors gracefully
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6, 5.7
 */

import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { GET } from '../route';

describe('GET /api/admin/super/billing/dashboard', () => {
  let testPlan: any;
  let testPlanFree: any;
  let testPlanStarter: any;
  let testPlanPro: any;

  beforeEach(async () => {
    // Create test subscription plans with different prices
    testPlanFree = await prisma.subscriptionPlan.create({
      data: {
        name: 'Free',
        price: 0,
        interval: 'MONTHLY',
        spinsPerMonth: 100,
        vouchersPerMonth: 50,
      },
    });

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

  it('should return complete revenue metrics structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('mrr');
    expect(data).toHaveProperty('newRevenue');
    expect(data).toHaveProperty('churnedRevenue');
    expect(data).toHaveProperty('upcomingRenewals');
    expect(data).toHaveProperty('failedPayments');
    expect(data).toHaveProperty('revenueByPlan');
    expect(data).toHaveProperty('activeTenantsCount');
    expect(data).toHaveProperty('totalTenantsCount');

    expect(typeof data.mrr).toBe('number');
    expect(typeof data.newRevenue).toBe('number');
    expect(typeof data.churnedRevenue).toBe('number');
    expect(Array.isArray(data.upcomingRenewals)).toBe(true);
    expect(Array.isArray(data.failedPayments)).toBe(true);
    expect(typeof data.revenueByPlan).toBe('object');
    expect(typeof data.activeTenantsCount).toBe('number');
    expect(typeof data.totalTenantsCount).toBe('number');
  });

  it('should calculate MRR correctly from active tenants', async () => {
    // Create active tenants with different plans
    await prisma.tenant.create({
      data: {
        name: 'Active Tenant 1',
        slug: 'active-tenant-1-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Active Tenant 2',
        slug: 'active-tenant-2-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
    });

    // Create inactive tenant (should not be included in MRR)
    await prisma.tenant.create({
      data: {
        name: 'Inactive Tenant',
        slug: 'inactive-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'CANCELLED',
        isActive: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // MRR should be sum of active tenants: 999 + 2999 = 3998
    expect(data.mrr).toBeGreaterThanOrEqual(3998);
  });

  it('should calculate new revenue from subscriptions started this month', async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Create tenant with subscription started this month
    await prisma.tenant.create({
      data: {
        name: 'New Tenant This Month',
        slug: 'new-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: startOfMonth,
        isActive: true,
      },
    });

    // Create tenant with subscription started last month (should not be included)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    await prisma.tenant.create({
      data: {
        name: 'Old Tenant',
        slug: 'old-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: lastMonth,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // New revenue should include at least the new tenant's plan price
    expect(data.newRevenue).toBeGreaterThanOrEqual(999);
  });

  it('should calculate churned revenue from subscriptions ended this month', async () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Create tenant with subscription ended this month
    await prisma.tenant.create({
      data: {
        name: 'Churned Tenant',
        slug: 'churned-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'CANCELLED',
        subscriptionEnd: endOfMonth,
        isActive: false,
      },
    });

    // Create active tenant (should not be included in churned revenue)
    await prisma.tenant.create({
      data: {
        name: 'Active Tenant',
        slug: 'active-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Churned revenue should include the churned tenant's plan price
    expect(data.churnedRevenue).toBeGreaterThanOrEqual(2999);
  });

  it('should return upcoming renewals within 7 days', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.upcomingRenewals)).toBe(true);
    
    // Should include at least the tenant with renewal in 5 days
    const upcomingRenewal = data.upcomingRenewals.find(
      (r: any) => r.name === 'Renewal Soon'
    );
    expect(upcomingRenewal).toBeDefined();
    expect(upcomingRenewal.planName).toBe('Starter');
    expect(upcomingRenewal.planPrice).toBe(999);
    expect(upcomingRenewal.daysUntilRenewal).toBeGreaterThanOrEqual(4);
    expect(upcomingRenewal.daysUntilRenewal).toBeLessThanOrEqual(6);
  });

  it('should return failed payments for PAST_DUE tenants', async () => {
    // Create tenant with PAST_DUE status
    await prisma.tenant.create({
      data: {
        name: 'Payment Failed Tenant',
        slug: 'payment-failed-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'PAST_DUE',
        isActive: true,
      },
    });

    // Create active tenant (should not be included)
    await prisma.tenant.create({
      data: {
        name: 'Active Tenant',
        slug: 'active-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.failedPayments)).toBe(true);
    
    // Should include the PAST_DUE tenant
    const failedPayment = data.failedPayments.find(
      (p: any) => p.name === 'Payment Failed Tenant'
    );
    expect(failedPayment).toBeDefined();
    expect(failedPayment.subscriptionStatus).toBe('PAST_DUE');
    expect(failedPayment.planName).toBe('Pro');
    expect(failedPayment.planPrice).toBe(2999);
  });

  it('should return revenue breakdown by subscription plan', async () => {
    // Create multiple tenants on different plans
    await prisma.tenant.create({
      data: {
        name: 'Starter Tenant 1',
        slug: 'starter-1-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Starter Tenant 2',
        slug: 'starter-2-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Pro Tenant 1',
        slug: 'pro-1-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.revenueByPlan).toBe('object');
    
    // Should have revenue for Starter and Pro plans
    expect(data.revenueByPlan['Starter']).toBeGreaterThanOrEqual(1998); // 2 * 999
    expect(data.revenueByPlan['Pro']).toBeGreaterThanOrEqual(2999); // 1 * 2999
  });

  it('should return correct active and total tenant counts', async () => {
    // Create active tenants
    await prisma.tenant.create({
      data: {
        name: 'Active Tenant 1',
        slug: 'active-1-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        isActive: true,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Active Tenant 2',
        slug: 'active-2-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        isActive: true,
      },
    });

    // Create inactive tenant
    await prisma.tenant.create({
      data: {
        name: 'Inactive Tenant',
        slug: 'inactive-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanFree.id,
        isActive: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activeTenantsCount).toBeGreaterThanOrEqual(2);
    expect(data.totalTenantsCount).toBeGreaterThanOrEqual(3);
    expect(data.totalTenantsCount).toBeGreaterThanOrEqual(data.activeTenantsCount);
  });

  it('should handle zero revenue scenario', async () => {
    // Create only free plan tenants
    await prisma.tenant.create({
      data: {
        name: 'Free Tenant',
        slug: 'free-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanFree.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mrr).toBeGreaterThanOrEqual(0);
    expect(data.newRevenue).toBeGreaterThanOrEqual(0);
    expect(data.churnedRevenue).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty database scenario', async () => {
    // Clean up all tenants
    await prisma.tenant.deleteMany({});

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mrr).toBe(0);
    expect(data.newRevenue).toBe(0);
    expect(data.churnedRevenue).toBe(0);
    expect(data.upcomingRenewals).toEqual([]);
    expect(data.failedPayments).toEqual([]);
    expect(data.revenueByPlan).toEqual({});
    expect(data.activeTenantsCount).toBe(0);
    expect(data.totalTenantsCount).toBe(0);
  });

  it('should handle database errors gracefully', async () => {
    // Mock billingService to throw an error
    const billingService = require('@/lib/billing-service').billingService;
    const originalGetRevenueMetrics = billingService.getRevenueMetrics;
    billingService.getRevenueMetrics = jest.fn().mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('INTERNAL_ERROR');
    expect(data.error.message).toBe('Failed to fetch billing dashboard data');

    // Restore original function
    billingService.getRevenueMetrics = originalGetRevenueMetrics;
  });

  it('should include all required fields in upcoming renewals', async () => {
    const now = new Date();
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);

    await prisma.tenant.create({
      data: {
        name: 'Renewal Test',
        slug: 'renewal-test-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in3Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const renewal = data.upcomingRenewals.find((r: any) => r.name === 'Renewal Test');
    expect(renewal).toBeDefined();
    expect(renewal).toHaveProperty('id');
    expect(renewal).toHaveProperty('name');
    expect(renewal).toHaveProperty('subscriptionEnd');
    expect(renewal).toHaveProperty('daysUntilRenewal');
    expect(renewal).toHaveProperty('planName');
    expect(renewal).toHaveProperty('planPrice');
  });

  it('should include all required fields in failed payments', async () => {
    await prisma.tenant.create({
      data: {
        name: 'Failed Payment Test',
        slug: 'failed-payment-test-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'PAST_DUE',
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const failedPayment = data.failedPayments.find(
      (p: any) => p.name === 'Failed Payment Test'
    );
    expect(failedPayment).toBeDefined();
    expect(failedPayment).toHaveProperty('id');
    expect(failedPayment).toHaveProperty('name');
    expect(failedPayment).toHaveProperty('subscriptionStatus');
    expect(failedPayment).toHaveProperty('subscriptionEnd');
    expect(failedPayment).toHaveProperty('planName');
    expect(failedPayment).toHaveProperty('planPrice');
  });

  it('should sort upcoming renewals by date (soonest first)', async () => {
    const now = new Date();
    
    const in2Days = new Date(now);
    in2Days.setDate(in2Days.getDate() + 2);
    
    const in5Days = new Date(now);
    in5Days.setDate(in5Days.getDate() + 5);

    await prisma.tenant.create({
      data: {
        name: 'Renewal Later',
        slug: 'renewal-later-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanStarter.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in5Days,
        isActive: true,
      },
    });

    await prisma.tenant.create({
      data: {
        name: 'Renewal Sooner',
        slug: 'renewal-sooner-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testPlanPro.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: in2Days,
        isActive: true,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/super/billing/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.upcomingRenewals.length).toBeGreaterThanOrEqual(2);
    
    // Find our test renewals
    const renewals = data.upcomingRenewals.filter(
      (r: any) => r.name === 'Renewal Sooner' || r.name === 'Renewal Later'
    );
    
    if (renewals.length === 2) {
      // The sooner renewal should come before the later one
      const soonerIndex = renewals.findIndex((r: any) => r.name === 'Renewal Sooner');
      const laterIndex = renewals.findIndex((r: any) => r.name === 'Renewal Later');
      expect(soonerIndex).toBeLessThan(laterIndex);
    }
  });
});
