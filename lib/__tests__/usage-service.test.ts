/**
 * Unit Tests for UsageService
 * 
 * Tests core functionality of usage tracking and limit enforcement
 */

import prisma from '../prisma';
import { UsageService } from '../usage-service';

// Mock Prisma client
jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    monthlyUsage: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    tenantLimitOverride: {
      findMany: jest.fn(),
    },
  },
}));

describe('UsageService', () => {
  let usageService: UsageService;

  beforeEach(() => {
    usageService = new UsageService();
    jest.clearAllMocks();
  });

  describe('getCurrentMonthUsage', () => {
    it('should return existing usage record if found', async () => {
      const mockUsage = {
        id: 'usage-1',
        tenantId: 'tenant-1',
        month: 12,
        year: 2024,
        spinsUsed: 50,
        vouchersUsed: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(mockUsage);

      const result = await usageService.getCurrentMonthUsage('tenant-1');

      expect(result).toEqual(mockUsage);
      expect(prisma.monthlyUsage.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_month_year: {
            tenantId: 'tenant-1',
            month: expect.any(Number),
            year: expect.any(Number),
          },
        },
      });
    });

    it('should create new usage record if not found', async () => {
      const mockNewUsage = {
        id: 'usage-2',
        tenantId: 'tenant-1',
        month: 12,
        year: 2024,
        spinsUsed: 0,
        vouchersUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.monthlyUsage.create as jest.Mock).mockResolvedValue(mockNewUsage);

      const result = await usageService.getCurrentMonthUsage('tenant-1');

      expect(result).toEqual(mockNewUsage);
      expect(prisma.monthlyUsage.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          month: expect.any(Number),
          year: expect.any(Number),
          spinsUsed: 0,
          vouchersUsed: 0,
        },
      });
    });
  });

  describe('incrementSpins', () => {
    it('should increment spins counter by 1', async () => {
      (prisma.monthlyUsage.upsert as jest.Mock).mockResolvedValue({});

      await usageService.incrementSpins('tenant-1');

      expect(prisma.monthlyUsage.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_month_year: {
            tenantId: 'tenant-1',
            month: expect.any(Number),
            year: expect.any(Number),
          },
        },
        update: {
          spinsUsed: { increment: 1 },
        },
        create: {
          tenantId: 'tenant-1',
          month: expect.any(Number),
          year: expect.any(Number),
          spinsUsed: 1,
          vouchersUsed: 0,
        },
      });
    });
  });

  describe('incrementVouchers', () => {
    it('should increment vouchers counter by 1', async () => {
      (prisma.monthlyUsage.upsert as jest.Mock).mockResolvedValue({});

      await usageService.incrementVouchers('tenant-1');

      expect(prisma.monthlyUsage.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_month_year: {
            tenantId: 'tenant-1',
            month: expect.any(Number),
            year: expect.any(Number),
          },
        },
        update: {
          vouchersUsed: { increment: 1 },
        },
        create: {
          tenantId: 'tenant-1',
          month: expect.any(Number),
          year: expect.any(Number),
          spinsUsed: 0,
          vouchersUsed: 1,
        },
      });
    });
  });

  describe('getEffectiveLimits', () => {
    it('should return base plan limits when no overrides exist', async () => {
      const mockTenant = {
        id: 'tenant-1',
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.getEffectiveLimits('tenant-1');

      expect(result).toEqual({
        spins: 5000,
        vouchers: 2000,
      });
    });

    it('should add bonus amounts from active overrides', async () => {
      const mockTenant = {
        id: 'tenant-1',
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      const mockOverrides = [
        {
          id: 'override-1',
          bonusSpins: 1000,
          bonusVouchers: 500,
          isActive: true,
          expiresAt: null,
        },
        {
          id: 'override-2',
          bonusSpins: 500,
          bonusVouchers: 250,
          isActive: true,
          expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        },
      ];

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue(mockOverrides);

      const result = await usageService.getEffectiveLimits('tenant-1');

      expect(result).toEqual({
        spins: 6500, // 5000 + 1000 + 500
        vouchers: 2750, // 2000 + 500 + 250
      });
    });

    it('should throw error if tenant not found', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(usageService.getEffectiveLimits('tenant-1')).rejects.toThrow(
        'Tenant or subscription plan not found'
      );
    });

    it('should throw error if subscription plan not found', async () => {
      const mockTenant = {
        id: 'tenant-1',
        subscriptionPlan: null,
      };

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      await expect(usageService.getEffectiveLimits('tenant-1')).rejects.toThrow(
        'Tenant or subscription plan not found'
      );
    });
  });

  describe('canSpin', () => {
    it('should return true when usage is below limit', async () => {
      const mockUsage = {
        spinsUsed: 100,
        vouchersUsed: 50,
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(mockUsage);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.canSpin('tenant-1');

      expect(result).toBe(true);
    });

    it('should return false when usage equals limit', async () => {
      const mockUsage = {
        spinsUsed: 5000,
        vouchersUsed: 50,
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(mockUsage);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.canSpin('tenant-1');

      expect(result).toBe(false);
    });

    it('should return false when usage exceeds limit', async () => {
      const mockUsage = {
        spinsUsed: 5001,
        vouchersUsed: 50,
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(mockUsage);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.canSpin('tenant-1');

      expect(result).toBe(false);
    });
  });

  describe('canCreateVoucher', () => {
    it('should return true when usage is below limit', async () => {
      const mockUsage = {
        spinsUsed: 100,
        vouchersUsed: 50,
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(mockUsage);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.canCreateVoucher('tenant-1');

      expect(result).toBe(true);
    });

    it('should return false when usage equals limit', async () => {
      const mockUsage = {
        spinsUsed: 100,
        vouchersUsed: 2000,
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(mockUsage);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.canCreateVoucher('tenant-1');

      expect(result).toBe(false);
    });

    it('should return false when usage exceeds limit', async () => {
      const mockUsage = {
        spinsUsed: 100,
        vouchersUsed: 2001,
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(mockUsage);
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.canCreateVoucher('tenant-1');

      expect(result).toBe(false);
    });
  });

  describe('resetUsage', () => {
    it('should reset both counters to zero', async () => {
      (prisma.monthlyUsage.upsert as jest.Mock).mockResolvedValue({});

      await usageService.resetUsage('tenant-1');

      expect(prisma.monthlyUsage.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_month_year: {
            tenantId: 'tenant-1',
            month: expect.any(Number),
            year: expect.any(Number),
          },
        },
        update: {
          spinsUsed: 0,
          vouchersUsed: 0,
        },
        create: {
          tenantId: 'tenant-1',
          month: expect.any(Number),
          year: expect.any(Number),
          spinsUsed: 0,
          vouchersUsed: 0,
        },
      });
    });
  });

  describe('getUsageWithTrend', () => {
    it('should return usage with trend data', async () => {
      const currentUsage = {
        spinsUsed: 200,
        vouchersUsed: 80,
      };

      const previousUsage = {
        spinsUsed: 100,
        vouchersUsed: 50,
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      // Mock getCurrentMonthUsage call
      (prisma.monthlyUsage.findUnique as jest.Mock)
        .mockResolvedValueOnce(currentUsage) // First call for current month
        .mockResolvedValueOnce(previousUsage); // Second call for previous month

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.getUsageWithTrend('tenant-1');

      expect(result.currentMonth.spinsUsed).toBe(200);
      expect(result.currentMonth.spinsLimit).toBe(5000);
      expect(result.currentMonth.spinsPercentage).toBe(4); // 200/5000 * 100 = 4%
      expect(result.currentMonth.vouchersUsed).toBe(80);
      expect(result.currentMonth.vouchersLimit).toBe(2000);
      expect(result.currentMonth.vouchersPercentage).toBe(4); // 80/2000 * 100 = 4%
      expect(result.currentMonth.daysUntilReset).toBeGreaterThan(0);

      expect(result.previousMonth.spinsUsed).toBe(100);
      expect(result.previousMonth.vouchersUsed).toBe(50);

      expect(result.trend.spinsChange).toBe(100); // (200-100)/100 * 100 = 100%
      expect(result.trend.vouchersChange).toBe(60); // (80-50)/50 * 100 = 60%
    });

    it('should handle missing previous month data', async () => {
      const currentUsage = {
        spinsUsed: 200,
        vouchersUsed: 80,
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.monthlyUsage.findUnique as jest.Mock)
        .mockResolvedValueOnce(currentUsage) // Current month
        .mockResolvedValueOnce(null); // Previous month not found

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.getUsageWithTrend('tenant-1');

      expect(result.previousMonth.spinsUsed).toBe(0);
      expect(result.previousMonth.vouchersUsed).toBe(0);
      expect(result.trend.spinsChange).toBe(100); // From 0 to any positive = 100%
      expect(result.trend.vouchersChange).toBe(100);
    });

    it('should calculate correct percentages at 80% threshold', async () => {
      const currentUsage = {
        spinsUsed: 4000, // 80% of 5000
        vouchersUsed: 1600, // 80% of 2000
      };

      const mockTenant = {
        subscriptionPlan: {
          spinsPerMonth: 5000,
          vouchersPerMonth: 2000,
        },
      };

      (prisma.monthlyUsage.findUnique as jest.Mock)
        .mockResolvedValueOnce(currentUsage)
        .mockResolvedValueOnce(null);

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

      const result = await usageService.getUsageWithTrend('tenant-1');

      expect(result.currentMonth.spinsPercentage).toBe(80);
      expect(result.currentMonth.vouchersPercentage).toBe(80);
    });
  });
});
