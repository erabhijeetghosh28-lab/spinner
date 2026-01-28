/**
 * Billing Service
 * 
 * Core service handling revenue calculations and billing metrics:
 * - Monthly Recurring Revenue (MRR) calculation
 * - New and churned revenue tracking
 * - Upcoming renewals monitoring
 * - Failed payments tracking
 * - Revenue breakdown by subscription plan
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import prisma from '@/lib/prisma';

/**
 * Tenant with renewal information
 */
export interface TenantWithRenewal {
  id: string;
  name: string;
  subscriptionEnd: Date;
  daysUntilRenewal: number;
  planName: string;
  planPrice: number;
}

/**
 * Tenant with payment issue information
 */
export interface TenantWithPaymentIssue {
  id: string;
  name: string;
  subscriptionStatus: string;
  subscriptionEnd: Date | null;
  planName: string;
  planPrice: number;
}

/**
 * Comprehensive revenue metrics
 */
export interface RevenueMetrics {
  mrr: number;
  newRevenue: number;
  churnedRevenue: number;
  upcomingRenewals: TenantWithRenewal[];
  failedPayments: TenantWithPaymentIssue[];
  revenueByPlan: Record<string, number>;
  activeTenantsCount: number;
  totalTenantsCount: number;
}

/**
 * Billing Service Class
 * 
 * Provides methods for calculating revenue metrics and monitoring billing status
 */
export class BillingService {
  /**
   * Calculate Monthly Recurring Revenue (MRR)
   * 
   * Sums the subscription prices for all tenants with subscriptionStatus = "ACTIVE".
   * Prices are stored in paise (smallest currency unit), so the result is in paise.
   * 
   * @returns Total MRR in paise
   * 
   * Requirements: 5.1
   * Property 15: MRR Calculation Accuracy
   */
  async calculateMRR(): Promise<number> {
    const activeTenants = await prisma.tenant.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlanId: { not: null },
      },
      include: {
        subscriptionPlan: true,
      },
    });

    let mrr = 0;
    for (const tenant of activeTenants) {
      if (tenant.subscriptionPlan) {
        mrr += tenant.subscriptionPlan.price;
      }
    }

    return mrr;
  }

  /**
   * Get comprehensive revenue metrics
   * 
   * Calculates all revenue-related metrics including:
   * - MRR (Monthly Recurring Revenue)
   * - New revenue from subscriptions started this month
   * - Churned revenue from subscriptions ended this month
   * - Upcoming renewals within 7 days
   * - Failed payments (tenants with PAST_DUE status)
   * - Revenue breakdown by subscription plan
   * - Active and total tenant counts
   * 
   * @returns Complete revenue metrics object
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Calculate MRR
    const mrr = await this.calculateMRR();

    // Calculate new revenue (subscriptions started this month)
    const newSubscriptions = await prisma.tenant.findMany({
      where: {
        subscriptionStart: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        subscriptionPlanId: { not: null },
      },
      include: {
        subscriptionPlan: true,
      },
    });

    let newRevenue = 0;
    for (const tenant of newSubscriptions) {
      if (tenant.subscriptionPlan) {
        newRevenue += tenant.subscriptionPlan.price;
      }
    }

    // Calculate churned revenue (subscriptions ended this month with status != ACTIVE)
    const churnedSubscriptions = await prisma.tenant.findMany({
      where: {
        subscriptionEnd: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        subscriptionStatus: { not: 'ACTIVE' },
        subscriptionPlanId: { not: null },
      },
      include: {
        subscriptionPlan: true,
      },
    });

    let churnedRevenue = 0;
    for (const tenant of churnedSubscriptions) {
      if (tenant.subscriptionPlan) {
        churnedRevenue += tenant.subscriptionPlan.price;
      }
    }

    // Get upcoming renewals (within 7 days)
    const upcomingRenewals = await this.getUpcomingRenewals(7);

    // Get failed payments
    const failedPayments = await this.getFailedPayments();

    // Get revenue by plan
    const revenueByPlan = await this.getRevenueByPlan();

    // Get tenant counts
    const totalTenantsCount = await prisma.tenant.count();
    const activeTenantsCount = await prisma.tenant.count({
      where: { isActive: true },
    });

    return {
      mrr,
      newRevenue,
      churnedRevenue,
      upcomingRenewals,
      failedPayments,
      revenueByPlan,
      activeTenantsCount,
      totalTenantsCount,
    };
  }

  /**
   * Get tenants with upcoming subscription renewals
   * 
   * Returns tenants whose subscriptionEnd date falls between now and now+N days.
   * Includes tenant details, renewal date, and subscription plan information.
   * 
   * @param days - Number of days to look ahead (default: 7)
   * @returns Array of tenants with upcoming renewals
   * 
   * Requirements: 5.4
   * Property 18: Upcoming Renewals Filter
   */
  async getUpcomingRenewals(days: number = 7): Promise<TenantWithRenewal[]> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    const tenants = await prisma.tenant.findMany({
      where: {
        subscriptionEnd: {
          gte: now,
          lte: futureDate,
        },
        subscriptionPlanId: { not: null },
      },
      include: {
        subscriptionPlan: true,
      },
      orderBy: {
        subscriptionEnd: 'asc',
      },
    });

    return tenants
      .filter((tenant) => tenant.subscriptionEnd && tenant.subscriptionPlan)
      .map((tenant) => {
        const subscriptionEnd = tenant.subscriptionEnd!;
        const daysUntilRenewal = Math.ceil(
          (subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: tenant.id,
          name: tenant.name,
          subscriptionEnd,
          daysUntilRenewal,
          planName: tenant.subscriptionPlan!.name,
          planPrice: tenant.subscriptionPlan!.price,
        };
      });
  }

  /**
   * Get tenants with failed or overdue payments
   * 
   * Returns tenants with subscriptionStatus = "PAST_DUE", indicating
   * payment issues that need attention.
   * 
   * @returns Array of tenants with payment issues
   * 
   * Requirements: 5.5
   * Property 19: Failed Payments Filter
   */
  async getFailedPayments(): Promise<TenantWithPaymentIssue[]> {
    const tenants = await prisma.tenant.findMany({
      where: {
        subscriptionStatus: 'PAST_DUE',
        subscriptionPlanId: { not: null },
      },
      include: {
        subscriptionPlan: true,
      },
      orderBy: {
        subscriptionEnd: 'asc',
      },
    });

    return tenants
      .filter((tenant) => tenant.subscriptionPlan)
      .map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        subscriptionStatus: tenant.subscriptionStatus,
        subscriptionEnd: tenant.subscriptionEnd,
        planName: tenant.subscriptionPlan!.name,
        planPrice: tenant.subscriptionPlan!.price,
      }));
  }

  /**
   * Get revenue breakdown by subscription plan
   * 
   * Groups active tenants by their subscription plan and sums the
   * subscription prices for each plan. Returns a map of plan names
   * to total revenue in paise.
   * 
   * @returns Record mapping plan names to revenue amounts
   * 
   * Requirements: 5.6
   * Property 20: Revenue by Plan Aggregation
   */
  async getRevenueByPlan(): Promise<Record<string, number>> {
    const activeTenants = await prisma.tenant.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlanId: { not: null },
      },
      include: {
        subscriptionPlan: true,
      },
    });

    const revenueByPlan: Record<string, number> = {};

    for (const tenant of activeTenants) {
      if (tenant.subscriptionPlan) {
        const planName = tenant.subscriptionPlan.name;
        const planPrice = tenant.subscriptionPlan.price;

        if (!revenueByPlan[planName]) {
          revenueByPlan[planName] = 0;
        }

        revenueByPlan[planName] += planPrice;
      }
    }

    return revenueByPlan;
  }
}

// Export singleton instance
export const billingService = new BillingService();
