/**
 * AnalyticsService
 * 
 * Provides platform-wide analytics and insights for Super Admins.
 * Calculates metrics across all tenants including spins, vouchers,
 * redemption rates, tenant rankings, and growth trends.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
 */

import prisma from './prisma';

export class AnalyticsService {
  /**
   * Get platform-wide statistics
   * Requirements: 8.1, 8.2
   */
  async getPlatformStats() {
    const [totalSpins, totalVouchers, activeTenantsCount, totalTenantsCount] = await Promise.all([
      prisma.spin.count(),
      prisma.voucher.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.tenant.count()
    ]);

    return {
      totalSpins,
      totalVouchers,
      activeTenantsCount,
      totalTenantsCount
    };
  }

  /**
   * Calculate average redemption rate across all tenants
   * Requirements: 8.3
   */
  async calculateRedemptionRate() {
    const totalVouchers = await prisma.voucher.count();
    const redeemedVouchers = await prisma.voucher.count({
      where: { isRedeemed: true }
    });

    if (totalVouchers === 0) {
      return 0;
    }

    return Math.round((redeemedVouchers / totalVouchers) * 100);
  }

  /**
   * Get tenant comparison/ranking data
   * Requirements: 8.4, 8.5
   */
  async getTenantComparison(limit: number = 10) {
    // Get all tenants with their spin and voucher counts
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    // Calculate metrics for each tenant
    const tenantsWithMetrics = await Promise.all(
      tenants.map(async (tenant) => {
        const [spins, vouchers, redeemedVouchers] = await Promise.all([
          prisma.spin.count({
            where: {
              campaign: {
                tenantId: tenant.id
              }
            }
          }),
          prisma.voucher.count({
            where: { tenantId: tenant.id }
          }),
          prisma.voucher.count({
            where: {
              tenantId: tenant.id,
              isRedeemed: true
            }
          })
        ]);

        const redemptionRate = vouchers > 0 
          ? Math.round((redeemedVouchers / vouchers) * 100) 
          : 0;

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          spins,
          vouchers,
          redeemedVouchers,
          redemptionRate,
          campaigns: tenant._count.campaigns
        };
      })
    );

    // Sort by total spins (descending)
    const sortedBySpins = [...tenantsWithMetrics].sort((a, b) => b.spins - a.spins);

    // Get top and bottom tenants
    const topTenants = sortedBySpins.slice(0, limit).map((tenant, index) => ({
      ...tenant,
      rank: index + 1
    }));

    const bottomTenants = sortedBySpins.slice(-limit).reverse().map((tenant, index) => ({
      ...tenant,
      rank: sortedBySpins.length - index
    }));

    return {
      topTenants,
      bottomTenants,
      allTenants: sortedBySpins.map((tenant, index) => ({
        ...tenant,
        rank: index + 1
      }))
    };
  }

  /**
   * Get growth trends (month-over-month comparison)
   * Requirements: 8.9
   */
  async getGrowthTrends() {
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

    // Get current month usage
    const currentMonthUsage = await prisma.monthlyUsage.findMany({
      where: {
        month: currentMonth,
        year: currentYear
      }
    });

    // Get previous month usage
    const previousMonthUsage = await prisma.monthlyUsage.findMany({
      where: {
        month: previousMonth,
        year: previousYear
      }
    });

    // Calculate totals
    const currentSpins = currentMonthUsage.reduce((sum, record) => sum + record.spinsUsed, 0);
    const currentVouchers = currentMonthUsage.reduce((sum, record) => sum + record.vouchersUsed, 0);
    const previousSpins = previousMonthUsage.reduce((sum, record) => sum + record.spinsUsed, 0);
    const previousVouchers = previousMonthUsage.reduce((sum, record) => sum + record.vouchersUsed, 0);

    // Calculate percentage changes
    const spinsChange = previousSpins > 0 
      ? Math.round(((currentSpins - previousSpins) / previousSpins) * 100) 
      : 0;
    const vouchersChange = previousVouchers > 0 
      ? Math.round(((currentVouchers - previousVouchers) / previousVouchers) * 100) 
      : 0;

    return {
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        spins: currentSpins,
        vouchers: currentVouchers
      },
      previousMonth: {
        month: previousMonth,
        year: previousYear,
        spins: previousSpins,
        vouchers: previousVouchers
      },
      growth: {
        spinsChange,
        vouchersChange
      }
    };
  }

  /**
   * Get new and churned tenant counts for current month
   * Requirements: 8.6, 8.7
   */
  async getTenantChurnMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // New tenants this month
    const newTenantsCount = await prisma.tenant.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Churned tenants this month (subscriptionStatus changed to CANCELED)
    const churnedTenantsCount = await prisma.tenant.count({
      where: {
        subscriptionStatus: 'CANCELED',
        updatedAt: {
          gte: startOfMonth
        }
      }
    });

    return {
      newTenantsThisMonth: newTenantsCount,
      churnedTenantsThisMonth: churnedTenantsCount
    };
  }

  /**
   * Calculate active tenant percentage
   * Requirements: 8.8
   */
  async getActivePercentage() {
    const [activeCount, totalCount] = await Promise.all([
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.tenant.count()
    ]);

    if (totalCount === 0) {
      return 0;
    }

    return Math.round((activeCount / totalCount) * 100);
  }

  /**
   * Identify tenants at risk of churning (inactive for 30+ days)
   * Requirements: 8.6, 8.7
   */
  async getChurnRiskTenants() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find tenants with no spins in the last 30 days
    const allTenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        subscriptionStatus: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionStart: true
      }
    });

    const churnRiskTenants = await Promise.all(
      allTenants.map(async (tenant) => {
        const recentSpins = await prisma.spin.count({
          where: {
            campaign: {
              tenantId: tenant.id
            },
            spinDate: {
              gte: thirtyDaysAgo
            }
          }
        });

        return {
          tenant,
          recentSpins,
          isAtRisk: recentSpins === 0
        };
      })
    );

    return churnRiskTenants
      .filter(t => t.isAtRisk)
      .map(t => t.tenant);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
