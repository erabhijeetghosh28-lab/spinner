/**
 * Usage Service
 * 
 * Core service handling subscription usage tracking and limit enforcement:
 * - Monthly usage tracking for spins and vouchers
 * - Limit calculation (base plan + overrides)
 * - Usage validation and enforcement
 * - Usage reset and trend analysis
 * 
 * Requirements: 1.1-1.4, 2.1-2.5, 3.1-3.5, 4.5-4.6
 */

import prisma from '@/lib/prisma';

/**
 * Usage with trend comparison data
 */
export interface UsageWithTrend {
  currentMonth: {
    spinsUsed: number;
    spinsLimit: number;
    spinsPercentage: number;
    vouchersUsed: number;
    vouchersLimit: number;
    vouchersPercentage: number;
    daysUntilReset: number;
  };
  previousMonth: {
    spinsUsed: number;
    vouchersUsed: number;
  };
  trend: {
    spinsChange: number; // Percentage change
    vouchersChange: number; // Percentage change
  };
}

/**
 * Effective limits (base + overrides)
 */
export interface EffectiveLimits {
  spins: number;
  vouchers: number;
}

/**
 * Usage Service Class
 * 
 * Provides methods for tracking and enforcing subscription usage limits
 */
export class UsageService {
  /**
   * Get or create current month usage record
   * 
   * If a MonthlyUsage record exists for the current month, returns it.
   * Otherwise, creates a new record with zero counters.
   * 
   * @param tenantId - The tenant ID to get usage for
   * @returns The current month's MonthlyUsage record
   * 
   * Requirements: 2.1
   */
  async getCurrentMonthUsage(tenantId: string) {
    const now = new Date();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed
    const year = now.getFullYear();

    // Try to find existing record
    let usage = await prisma.monthlyUsage.findUnique({
      where: {
        tenantId_month_year: {
          tenantId,
          month,
          year,
        },
      },
    });

    // Create if doesn't exist
    if (!usage) {
      usage = await prisma.monthlyUsage.create({
        data: {
          tenantId,
          month,
          year,
          spinsUsed: 0,
          vouchersUsed: 0,
        },
      });
    }

    return usage;
  }

  /**
   * Increment spin counter for current month
   * 
   * Atomically increments the spinsUsed counter by 1 for the current month.
   * Creates the monthly usage record if it doesn't exist.
   * 
   * @param tenantId - The tenant ID to increment usage for
   * 
   * Requirements: 2.2
   */
  async incrementSpins(tenantId: string): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Use upsert to handle both create and increment in one operation
    await prisma.monthlyUsage.upsert({
      where: {
        tenantId_month_year: {
          tenantId,
          month,
          year,
        },
      },
      update: {
        spinsUsed: { increment: 1 },
      },
      create: {
        tenantId,
        month,
        year,
        spinsUsed: 1,
        vouchersUsed: 0,
      },
    });
  }

  /**
   * Increment voucher counter for current month
   * 
   * Atomically increments the vouchersUsed counter by 1 for the current month.
   * Creates the monthly usage record if it doesn't exist.
   * 
   * @param tenantId - The tenant ID to increment usage for
   * 
   * Requirements: 2.3
   */
  async incrementVouchers(tenantId: string): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Use upsert to handle both create and increment in one operation
    await prisma.monthlyUsage.upsert({
      where: {
        tenantId_month_year: {
          tenantId,
          month,
          year,
        },
      },
      update: {
        vouchersUsed: { increment: 1 },
      },
      create: {
        tenantId,
        month,
        year,
        spinsUsed: 0,
        vouchersUsed: 1,
      },
    });
  }

  /**
   * Calculate effective limits (base plan + active overrides)
   * 
   * Retrieves the tenant's subscription plan limits and adds any active
   * bonus amounts from limit overrides. Overrides are considered active
   * if isActive=true and either expiresAt is null or in the future.
   * 
   * Returns Infinity for unlimited limits (when plan limit is null).
   * 
   * @param tenantId - The tenant ID to calculate limits for
   * @returns Effective limits for spins and vouchers (Infinity = unlimited)
   * 
   * Requirements: 4.5
   */
  async getEffectiveLimits(tenantId: string): Promise<EffectiveLimits> {
    // Get tenant with subscription plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptionPlan: true,
      },
    });

    if (!tenant || !tenant.subscriptionPlan) {
      throw new Error('Tenant or subscription plan not found');
    }

    // Start with base plan limits (null = unlimited = Infinity)
    let spinsLimit = tenant.subscriptionPlan.spinsPerMonth ?? Infinity;
    let vouchersLimit = tenant.subscriptionPlan.vouchersPerMonth ?? Infinity;

    // Get active overrides
    const now = new Date();
    const activeOverrides = await prisma.tenantLimitOverride.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { expiresAt: null }, // Permanent overrides
          { expiresAt: { gte: now } }, // Not yet expired
        ],
      },
    });

    // Add bonus amounts from all active overrides (only if not already unlimited)
    for (const override of activeOverrides) {
      if (spinsLimit !== Infinity) {
        spinsLimit += override.bonusSpins;
      }
      if (vouchersLimit !== Infinity) {
        vouchersLimit += override.bonusVouchers;
      }
    }

    return {
      spins: spinsLimit,
      vouchers: vouchersLimit,
    };
  }

  /**
   * Check if tenant can perform a spin
   * 
   * Compares current month's spin usage against effective limits.
   * Returns true if usage is below limit, false otherwise.
   * 
   * @param tenantId - The tenant ID to check
   * @returns True if tenant can spin, false if at or over limit
   * 
   * Requirements: 1.3
   */
  async canSpin(tenantId: string): Promise<boolean> {
    const usage = await this.getCurrentMonthUsage(tenantId);
    const limits = await this.getEffectiveLimits(tenantId);

    return usage.spinsUsed < limits.spins;
  }

  /**
   * Check if tenant can create a voucher
   * 
   * Compares current month's voucher usage against effective limits.
   * Returns true if usage is below limit, false otherwise.
   * 
   * @param tenantId - The tenant ID to check
   * @returns True if tenant can create voucher, false if at or over limit
   * 
   * Requirements: 1.4
   */
  async canCreateVoucher(tenantId: string): Promise<boolean> {
    const usage = await this.getCurrentMonthUsage(tenantId);
    const limits = await this.getEffectiveLimits(tenantId);

    return usage.vouchersUsed < limits.vouchers;
  }

  /**
   * Reset usage counters to zero for current month
   * 
   * Sets both spinsUsed and vouchersUsed to 0 for the current month.
   * This is used for mid-month resets granted by Super Admins.
   * 
   * @param tenantId - The tenant ID to reset usage for
   * 
   * Requirements: 4.6
   */
  async resetUsage(tenantId: string): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await prisma.monthlyUsage.upsert({
      where: {
        tenantId_month_year: {
          tenantId,
          month,
          year,
        },
      },
      update: {
        spinsUsed: 0,
        vouchersUsed: 0,
      },
      create: {
        tenantId,
        month,
        year,
        spinsUsed: 0,
        vouchersUsed: 0,
      },
    });
  }

  /**
   * Calculate days until monthly reset
   * 
   * Returns the number of days remaining until the first day of next month.
   * 
   * @returns Number of days until reset
   * 
   * Requirements: 3.3
   */
  private calculateDaysUntilReset(): number {
    const now = new Date();
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = firstDayOfNextMonth.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get usage with trend comparison to previous month
   * 
   * Returns comprehensive usage data including:
   * - Current month usage with limits and percentages
   * - Previous month usage for comparison
   * - Trend analysis (percentage change)
   * - Days until monthly reset
   * 
   * @param tenantId - The tenant ID to get usage for
   * @returns UsageWithTrend object with all usage data
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  async getUsageWithTrend(tenantId: string): Promise<UsageWithTrend> {
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

    // Get current month usage
    const currentUsage = await this.getCurrentMonthUsage(tenantId);

    // Get previous month usage (may not exist)
    const previousUsage = await prisma.monthlyUsage.findUnique({
      where: {
        tenantId_month_year: {
          tenantId,
          month: previousMonth,
          year: previousYear,
        },
      },
    });

    // Get effective limits
    const limits = await this.getEffectiveLimits(tenantId);

    // Calculate percentages (handle unlimited limits)
    const spinsPercentage = limits.spins === Infinity
      ? 0 // Unlimited = 0% (never reaches limit)
      : limits.spins > 0 
        ? Math.round((currentUsage.spinsUsed / limits.spins) * 100)
        : 0;
    
    const vouchersPercentage = limits.vouchers === Infinity
      ? 0 // Unlimited = 0% (never reaches limit)
      : limits.vouchers > 0
        ? Math.round((currentUsage.vouchersUsed / limits.vouchers) * 100)
        : 0;

    // Calculate trends (percentage change from previous month)
    const previousSpins = previousUsage?.spinsUsed || 0;
    const previousVouchers = previousUsage?.vouchersUsed || 0;

    const spinsChange = previousSpins > 0
      ? Math.round(((currentUsage.spinsUsed - previousSpins) / previousSpins) * 100)
      : currentUsage.spinsUsed > 0 ? 100 : 0;

    const vouchersChange = previousVouchers > 0
      ? Math.round(((currentUsage.vouchersUsed - previousVouchers) / previousVouchers) * 100)
      : currentUsage.vouchersUsed > 0 ? 100 : 0;

    // Calculate days until reset
    const daysUntilReset = this.calculateDaysUntilReset();

    return {
      currentMonth: {
        spinsUsed: currentUsage.spinsUsed,
        spinsLimit: limits.spins,
        spinsPercentage,
        vouchersUsed: currentUsage.vouchersUsed,
        vouchersLimit: limits.vouchers,
        vouchersPercentage,
        daysUntilReset,
      },
      previousMonth: {
        spinsUsed: previousSpins,
        vouchersUsed: previousVouchers,
      },
      trend: {
        spinsChange,
        vouchersChange,
      },
    };
  }
}

// Export singleton instance
export const usageService = new UsageService();
