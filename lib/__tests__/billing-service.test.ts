/**
 * Unit Tests for BillingService
 * 
 * Tests revenue calculations, billing metrics, and payment tracking.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import prisma from '@/lib/prisma';
import { BillingService } from '../billing-service';

describe('BillingService', () => {
  let billingService: BillingService;

  beforeEach(() => {
    billingService = new BillingService();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.tenant.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.plan.deleteMany({});
  });

  // Helper function to create a base plan (required for Tenant)
  async function createBasePlan() {
    return await prisma.plan.create({
      data: {
        name: 'Base Plan',
        maxSpins: 5000,
        maxCampaigns: 10,
      },
    });
  }

  describe('calculateMRR', () => {
    it('should calculate MRR as sum of active tenant subscription prices', async () => {
      // Create base plan (required for Tenant)
      const basePlan = await createBasePlan();

      // Create subscription plans
      const starterPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900, // ₹999 in paise
          interval: 'MONTHLY',
        },
      });

      const proPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Pro',
          price: 499900, // ₹4999 in paise
          interval: 'MONTHLY',
        },
      });

      // Create active tenants
      await prisma.tenant.create({
        data: {
          name: 'Cafe A',
          slug: 'cafe-a',
          planId: basePlan.id,
          subscriptionPlanId: starterPlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      await prisma.tenant.create({
        data: {
          name: 'Cafe B',
          slug: 'cafe-b',
          planId: basePlan.id,
          subscriptionPlanId: proPlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      await prisma.tenant.create({
        data: {
          name: 'Cafe C',
          slug: 'cafe-c',
          planId: basePlan.id,
          subscriptionPlanId: starterPlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      const mrr = await billingService.calculateMRR();

      // Expected: 999 + 4999 + 999 = 6997 rupees = 699700 paise
      expect(mrr).toBe(699700);
    });

    it('should exclude non-active tenants from MRR calculation', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      // Active tenant
      await prisma.tenant.create({
        data: {
          name: 'Active Cafe',
          slug: 'active-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      // Canceled tenant
      await prisma.tenant.create({
        data: {
          name: 'Canceled Cafe',
          slug: 'canceled-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'CANCELED',
        },
      });

      // Trial tenant
      await prisma.tenant.create({
        data: {
          name: 'Trial Cafe',
          slug: 'trial-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'TRIAL',
        },
      });

      const mrr = await billingService.calculateMRR();

      // Only active tenant should be counted
      expect(mrr).toBe(99900);
    });

    it('should return 0 when no active tenants exist', async () => {
      const mrr = await billingService.calculateMRR();
      expect(mrr).toBe(0);
    });

    it('should exclude tenants without subscription plans', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      // Tenant with subscription plan
      await prisma.tenant.create({
        data: {
          name: 'Cafe A',
          slug: 'cafe-a',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      // Tenant without subscription plan
      await prisma.tenant.create({
        data: {
          name: 'Cafe B',
          slug: 'cafe-b',
          planId: basePlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      const mrr = await billingService.calculateMRR();

      // Only tenant with subscription plan should be counted
      expect(mrr).toBe(99900);
    });
  });

  describe('getRevenueMetrics', () => {
    it('should return comprehensive revenue metrics', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Active tenant (contributes to MRR)
      await prisma.tenant.create({
        data: {
          name: 'Active Cafe',
          slug: 'active-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      // New tenant this month (contributes to new revenue)
      await prisma.tenant.create({
        data: {
          name: 'New Cafe',
          slug: 'new-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionStart: startOfMonth,
        },
      });

      // Churned tenant this month (contributes to churned revenue)
      await prisma.tenant.create({
        data: {
          name: 'Churned Cafe',
          slug: 'churned-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'CANCELED',
          subscriptionEnd: endOfMonth,
        },
      });

      const metrics = await billingService.getRevenueMetrics();

      expect(metrics.mrr).toBeGreaterThan(0);
      expect(metrics.newRevenue).toBeGreaterThan(0);
      expect(metrics.churnedRevenue).toBeGreaterThan(0);
      expect(metrics.activeTenantsCount).toBeGreaterThanOrEqual(0);
      expect(metrics.totalTenantsCount).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.revenueByPlan).toBe('object');
      expect(Array.isArray(metrics.upcomingRenewals)).toBe(true);
      expect(Array.isArray(metrics.failedPayments)).toBe(true);
    });
  });

  describe('getUpcomingRenewals', () => {
    it('should return tenants with renewals within specified days', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      const now = new Date();
      const in3Days = new Date(now);
      in3Days.setDate(in3Days.getDate() + 3);

      const in10Days = new Date(now);
      in10Days.setDate(in10Days.getDate() + 10);

      // Tenant with renewal in 3 days
      await prisma.tenant.create({
        data: {
          name: 'Cafe A',
          slug: 'cafe-a',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionEnd: in3Days,
        },
      });

      // Tenant with renewal in 10 days
      await prisma.tenant.create({
        data: {
          name: 'Cafe B',
          slug: 'cafe-b',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionEnd: in10Days,
        },
      });

      const renewals = await billingService.getUpcomingRenewals(7);

      // Only tenant with renewal in 3 days should be included
      expect(renewals).toHaveLength(1);
      expect(renewals[0].name).toBe('Cafe A');
      expect(renewals[0].daysUntilRenewal).toBeGreaterThanOrEqual(2);
      expect(renewals[0].daysUntilRenewal).toBeLessThanOrEqual(4);
      expect(renewals[0].planName).toBe('Starter');
      expect(renewals[0].planPrice).toBe(99900);
    });

    it('should return empty array when no renewals are upcoming', async () => {
      const renewals = await billingService.getUpcomingRenewals(7);
      expect(renewals).toHaveLength(0);
    });

    it('should sort renewals by date (soonest first)', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      const now = new Date();
      const in2Days = new Date(now);
      in2Days.setDate(in2Days.getDate() + 2);

      const in5Days = new Date(now);
      in5Days.setDate(in5Days.getDate() + 5);

      // Create in reverse order
      await prisma.tenant.create({
        data: {
          name: 'Cafe B',
          slug: 'cafe-b',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionEnd: in5Days,
        },
      });

      await prisma.tenant.create({
        data: {
          name: 'Cafe A',
          slug: 'cafe-a',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionEnd: in2Days,
        },
      });

      const renewals = await billingService.getUpcomingRenewals(7);

      expect(renewals).toHaveLength(2);
      expect(renewals[0].name).toBe('Cafe A'); // Soonest first
      expect(renewals[1].name).toBe('Cafe B');
    });

    it('should use default of 7 days when no parameter provided', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      const now = new Date();
      const in5Days = new Date(now);
      in5Days.setDate(in5Days.getDate() + 5);

      await prisma.tenant.create({
        data: {
          name: 'Cafe A',
          slug: 'cafe-a',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionEnd: in5Days,
        },
      });

      const renewals = await billingService.getUpcomingRenewals();

      expect(renewals).toHaveLength(1);
    });
  });

  describe('getFailedPayments', () => {
    it('should return tenants with PAST_DUE status', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      // Tenant with failed payment
      await prisma.tenant.create({
        data: {
          name: 'Failed Cafe',
          slug: 'failed-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'PAST_DUE',
        },
      });

      // Active tenant (should not be included)
      await prisma.tenant.create({
        data: {
          name: 'Active Cafe',
          slug: 'active-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      const failedPayments = await billingService.getFailedPayments();

      expect(failedPayments).toHaveLength(1);
      expect(failedPayments[0].name).toBe('Failed Cafe');
      expect(failedPayments[0].subscriptionStatus).toBe('PAST_DUE');
      expect(failedPayments[0].planName).toBe('Starter');
      expect(failedPayments[0].planPrice).toBe(99900);
    });

    it('should return empty array when no failed payments exist', async () => {
      const failedPayments = await billingService.getFailedPayments();
      expect(failedPayments).toHaveLength(0);
    });

    it('should exclude tenants without subscription plans', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      // Tenant with subscription plan
      await prisma.tenant.create({
        data: {
          name: 'Failed Cafe A',
          slug: 'failed-cafe-a',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'PAST_DUE',
        },
      });

      // Tenant without subscription plan
      await prisma.tenant.create({
        data: {
          name: 'Failed Cafe B',
          slug: 'failed-cafe-b',
          planId: basePlan.id,
          subscriptionStatus: 'PAST_DUE',
        },
      });

      const failedPayments = await billingService.getFailedPayments();

      expect(failedPayments).toHaveLength(1);
      expect(failedPayments[0].name).toBe('Failed Cafe A');
    });
  });

  describe('getRevenueByPlan', () => {
    it('should group revenue by subscription plan', async () => {
      const basePlan = await createBasePlan();
      const starterPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      const proPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Pro',
          price: 499900,
          interval: 'MONTHLY',
        },
      });

      // Two Starter tenants
      await prisma.tenant.create({
        data: {
          name: 'Cafe A',
          slug: 'cafe-a',
          planId: basePlan.id,
          subscriptionPlanId: starterPlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      await prisma.tenant.create({
        data: {
          name: 'Cafe B',
          slug: 'cafe-b',
          planId: basePlan.id,
          subscriptionPlanId: starterPlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      // One Pro tenant
      await prisma.tenant.create({
        data: {
          name: 'Cafe C',
          slug: 'cafe-c',
          planId: basePlan.id,
          subscriptionPlanId: proPlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      const revenueByPlan = await billingService.getRevenueByPlan();

      expect(revenueByPlan['Starter']).toBe(199800); // 2 * 99900
      expect(revenueByPlan['Pro']).toBe(499900);
    });

    it('should only include active tenants', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      // Active tenant
      await prisma.tenant.create({
        data: {
          name: 'Active Cafe',
          slug: 'active-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      // Canceled tenant
      await prisma.tenant.create({
        data: {
          name: 'Canceled Cafe',
          slug: 'canceled-cafe',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'CANCELED',
        },
      });

      const revenueByPlan = await billingService.getRevenueByPlan();

      expect(revenueByPlan['Starter']).toBe(99900); // Only active tenant
    });

    it('should return empty object when no active tenants exist', async () => {
      const revenueByPlan = await billingService.getRevenueByPlan();
      expect(revenueByPlan).toEqual({});
    });

    it('should handle multiple plans correctly', async () => {
      const basePlan = await createBasePlan();
      const freePlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Free',
          price: 0,
          interval: 'MONTHLY',
        },
      });

      const starterPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      const proPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Pro',
          price: 499900,
          interval: 'MONTHLY',
        },
      });

      await prisma.tenant.create({
        data: {
          name: 'Free Cafe',
          slug: 'free-cafe',
          planId: basePlan.id,
          subscriptionPlanId: freePlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      await prisma.tenant.create({
        data: {
          name: 'Starter Cafe',
          slug: 'starter-cafe',
          planId: basePlan.id,
          subscriptionPlanId: starterPlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      await prisma.tenant.create({
        data: {
          name: 'Pro Cafe',
          slug: 'pro-cafe',
          planId: basePlan.id,
          subscriptionPlanId: proPlan.id,
          subscriptionStatus: 'ACTIVE',
        },
      });

      const revenueByPlan = await billingService.getRevenueByPlan();

      expect(revenueByPlan['Free']).toBe(0);
      expect(revenueByPlan['Starter']).toBe(99900);
      expect(revenueByPlan['Pro']).toBe(499900);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tenants with null subscriptionEnd gracefully', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      await prisma.tenant.create({
        data: {
          name: 'Cafe A',
          slug: 'cafe-a',
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionEnd: null,
        },
      });

      const renewals = await billingService.getUpcomingRenewals(7);
      expect(renewals).toHaveLength(0);
    });

    it('should handle large numbers of tenants efficiently', async () => {
      const basePlan = await createBasePlan();
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter',
          price: 99900,
          interval: 'MONTHLY',
        },
      });

      // Create 100 active tenants
      const tenants = [];
      for (let i = 0; i < 100; i++) {
        tenants.push({
          name: `Cafe ${i}`,
          slug: `cafe-${i}`,
          planId: basePlan.id,
          subscriptionPlanId: plan.id,
          subscriptionStatus: 'ACTIVE',
        });
      }

      await prisma.tenant.createMany({ data: tenants });

      const mrr = await billingService.calculateMRR();
      expect(mrr).toBe(99900 * 100);

      const revenueByPlan = await billingService.getRevenueByPlan();
      expect(revenueByPlan['Starter']).toBe(99900 * 100);
    });
  });
});
