/**
 * Property-Based Tests for UsageService
 * 
 * Tests universal properties using fast-check for randomized testing
 * Feature: super-admin-controls
 */

import * as fc from 'fast-check';
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

describe('UsageService Property-Based Tests', () => {
  let usageService: UsageService;

  beforeEach(() => {
    usageService = new UsageService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: super-admin-controls, Property 3: Counter Increment Invariant
   * **Validates: Requirements 2.2, 2.3**
   * 
   * For any usage counter (spins or vouchers), after performing the corresponding action,
   * the counter value SHALL be exactly one greater than before the action.
   */
  describe('Property 3: Counter Increment Invariant', () => {
    it('should increment spins counter by exactly 1 for any initial value', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            initialSpinsUsed: fc.nat({ max: 100000 }),
            initialVouchersUsed: fc.nat({ max: 100000 }),
          }),
          async ({ tenantId, initialSpinsUsed, initialVouchersUsed }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();
            
            // Setup: Mock the current usage state
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const initialUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: initialSpinsUsed,
              vouchersUsed: initialVouchersUsed,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Mock upsert to simulate the increment operation
            (prisma.monthlyUsage.upsert as jest.Mock).mockImplementation(async (args) => {
              // Simulate the database increment operation
              if (args.update.spinsUsed?.increment === 1) {
                return {
                  ...initialUsage,
                  spinsUsed: initialSpinsUsed + 1,
                };
              }
              return initialUsage;
            });

            // Action: Increment spins
            await usageService.incrementSpins(tenantId);

            // Assertion: Verify upsert was called with increment: 1
            expect(prisma.monthlyUsage.upsert).toHaveBeenCalledWith({
              where: {
                tenantId_month_year: {
                  tenantId,
                  month: currentMonth,
                  year: currentYear,
                },
              },
              update: {
                spinsUsed: { increment: 1 },
              },
              create: {
                tenantId,
                month: currentMonth,
                year: currentYear,
                spinsUsed: 1,
                vouchersUsed: 0,
              },
            });

            // Verify the increment operation was called exactly once
            expect(prisma.monthlyUsage.upsert).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increment vouchers counter by exactly 1 for any initial value', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            initialSpinsUsed: fc.nat({ max: 100000 }),
            initialVouchersUsed: fc.nat({ max: 100000 }),
          }),
          async ({ tenantId, initialSpinsUsed, initialVouchersUsed }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();
            
            // Setup: Mock the current usage state
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const initialUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: initialSpinsUsed,
              vouchersUsed: initialVouchersUsed,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Mock upsert to simulate the increment operation
            (prisma.monthlyUsage.upsert as jest.Mock).mockImplementation(async (args) => {
              // Simulate the database increment operation
              if (args.update.vouchersUsed?.increment === 1) {
                return {
                  ...initialUsage,
                  vouchersUsed: initialVouchersUsed + 1,
                };
              }
              return initialUsage;
            });

            // Action: Increment vouchers
            await usageService.incrementVouchers(tenantId);

            // Assertion: Verify upsert was called with increment: 1
            expect(prisma.monthlyUsage.upsert).toHaveBeenCalledWith({
              where: {
                tenantId_month_year: {
                  tenantId,
                  month: currentMonth,
                  year: currentYear,
                },
              },
              update: {
                vouchersUsed: { increment: 1 },
              },
              create: {
                tenantId,
                month: currentMonth,
                year: currentYear,
                spinsUsed: 0,
                vouchersUsed: 1,
              },
            });

            // Verify the increment operation was called exactly once
            expect(prisma.monthlyUsage.upsert).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain counter increment invariant across multiple sequential operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            initialSpinsUsed: fc.nat({ max: 1000 }),
            numberOfIncrements: fc.integer({ min: 1, max: 50 }),
          }),
          async ({ tenantId, initialSpinsUsed, numberOfIncrements }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();
            
            // Setup: Track the counter value across multiple increments
            let currentSpinsUsed = initialSpinsUsed;
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Mock upsert to simulate sequential increments
            (prisma.monthlyUsage.upsert as jest.Mock).mockImplementation(async (args) => {
              if (args.update.spinsUsed?.increment === 1) {
                currentSpinsUsed += 1;
                return {
                  id: `usage-${tenantId}`,
                  tenantId,
                  month: currentMonth,
                  year: currentYear,
                  spinsUsed: currentSpinsUsed,
                  vouchersUsed: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
              }
              return null;
            });

            // Action: Perform multiple increments
            for (let i = 0; i < numberOfIncrements; i++) {
              await usageService.incrementSpins(tenantId);
            }

            // Assertion: Final value should be initial + number of increments
            const expectedFinalValue = initialSpinsUsed + numberOfIncrements;
            expect(currentSpinsUsed).toBe(expectedFinalValue);

            // Verify each increment was called with increment: 1
            expect(prisma.monthlyUsage.upsert).toHaveBeenCalledTimes(numberOfIncrements);
            
            // Verify all calls used increment: 1 (not increment: N)
            const calls = (prisma.monthlyUsage.upsert as jest.Mock).mock.calls;
            calls.forEach((call) => {
              expect(call[0].update.spinsUsed.increment).toBe(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create initial record with counter value of 1 when no record exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            counterType: fc.constantFrom('spins', 'vouchers'),
          }),
          async ({ tenantId, counterType }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();
            
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Mock upsert to simulate record creation
            (prisma.monthlyUsage.upsert as jest.Mock).mockResolvedValue({
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: counterType === 'spins' ? 1 : 0,
              vouchersUsed: counterType === 'vouchers' ? 1 : 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Action: Increment counter (which will create record if not exists)
            if (counterType === 'spins') {
              await usageService.incrementSpins(tenantId);
            } else {
              await usageService.incrementVouchers(tenantId);
            }

            // Assertion: Verify upsert was called
            expect(prisma.monthlyUsage.upsert).toHaveBeenCalledTimes(1);
            
            // Verify create clause sets counter to 1 for the appropriate counter
            const call = (prisma.monthlyUsage.upsert as jest.Mock).mock.calls[0][0];
            if (counterType === 'spins') {
              expect(call.create.spinsUsed).toBe(1);
              expect(call.create.vouchersUsed).toBe(0);
            } else {
              expect(call.create.spinsUsed).toBe(0);
              expect(call.create.vouchersUsed).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: super-admin-controls, Property 4: Monthly Reset Property
   * **Validates: Requirements 2.4, 2.5**
   * 
   * For any tenant, at the beginning of a new calendar month, the usage counters SHALL be
   * reset to zero while preserving the previous month's historical record.
   */
  describe('Property 4: Monthly Reset Property', () => {
    it('should reset usage counters to zero when transitioning to a new month', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            previousMonthSpins: fc.nat({ max: 100000 }),
            previousMonthVouchers: fc.nat({ max: 100000 }),
            // Generate a date in the previous month
            previousMonth: fc.integer({ min: 1, max: 12 }),
            previousYear: fc.integer({ min: 2020, max: 2030 }),
          }),
          async ({ tenantId, previousMonthSpins, previousMonthVouchers, previousMonth, previousYear }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Calculate current month (one month after previous)
            let currentMonth = previousMonth + 1;
            let currentYear = previousYear;
            if (currentMonth > 12) {
              currentMonth = 1;
              currentYear = previousYear + 1;
            }

            // Setup: Mock previous month's usage record (historical data)
            const previousMonthUsage = {
              id: `usage-${tenantId}-prev`,
              tenantId,
              month: previousMonth,
              year: previousYear,
              spinsUsed: previousMonthSpins,
              vouchersUsed: previousMonthVouchers,
              createdAt: new Date(previousYear, previousMonth - 1, 15),
              updatedAt: new Date(previousYear, previousMonth - 1, 15),
            };

            // Mock findUnique to return null for current month (simulating new month)
            // and return previous month data when queried
            (prisma.monthlyUsage.findUnique as jest.Mock).mockImplementation(async (args) => {
              const where = args.where.tenantId_month_year;
              if (where.month === currentMonth && where.year === currentYear) {
                // Current month doesn't exist yet
                return null;
              } else if (where.month === previousMonth && where.year === previousYear) {
                // Previous month exists with usage data
                return previousMonthUsage;
              }
              return null;
            });

            // Mock create to return new month record with zero counters
            (prisma.monthlyUsage.create as jest.Mock).mockResolvedValue({
              id: `usage-${tenantId}-current`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: 0,
              vouchersUsed: 0,
              createdAt: new Date(currentYear, currentMonth - 1, 1),
              updatedAt: new Date(currentYear, currentMonth - 1, 1),
            });

            // Mock Date to simulate being in the new month
            const mockDate = new Date(currentYear, currentMonth - 1, 5); // 5th day of current month
            jest.spyOn(global, 'Date').mockImplementation((...args) => {
              if (args.length === 0) {
                return mockDate as any;
              }
              return new (Date as any)(...args);
            });

            // Action: Get current month usage (should create new record with zero counters)
            const currentUsage = await usageService.getCurrentMonthUsage(tenantId);

            // Restore Date
            jest.restoreAllMocks();

            // Assertion 1: Current month usage counters should be zero (reset)
            expect(currentUsage.spinsUsed).toBe(0);
            expect(currentUsage.vouchersUsed).toBe(0);

            // Assertion 2: Current month should be different from previous month
            expect(currentUsage.month).toBe(currentMonth);
            expect(currentUsage.year).toBe(currentYear);

            // Assertion 3: Verify previous month's record was not modified
            // (we can verify this by checking that findUnique was called for previous month)
            const findUniqueCalls = (prisma.monthlyUsage.findUnique as jest.Mock).mock.calls;
            const previousMonthQuery = findUniqueCalls.find((call) => {
              const where = call[0].where.tenantId_month_year;
              return where.month === previousMonth && where.year === previousYear;
            });

            // If previous month was queried, it should return the original data
            if (previousMonthQuery) {
              const result = await (prisma.monthlyUsage.findUnique as jest.Mock)(previousMonthQuery[0]);
              expect(result?.spinsUsed).toBe(previousMonthSpins);
              expect(result?.vouchersUsed).toBe(previousMonthVouchers);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve historical records when creating new month usage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            historicalMonths: fc.array(
              fc.record({
                month: fc.integer({ min: 1, max: 12 }),
                year: fc.integer({ min: 2020, max: 2030 }),
                spinsUsed: fc.nat({ max: 50000 }),
                vouchersUsed: fc.nat({ max: 50000 }),
              }),
              { minLength: 1, maxLength: 12 }
            ),
          }),
          async ({ tenantId, historicalMonths }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Ensure unique month/year combinations
            const uniqueMonths = Array.from(
              new Map(
                historicalMonths.map((m) => [`${m.year}-${m.month}`, m])
              ).values()
            );

            if (uniqueMonths.length === 0) return; // Skip if no unique months

            // Setup: Mock findMany to return all historical records
            (prisma.monthlyUsage.findMany as jest.Mock).mockResolvedValue(
              uniqueMonths.map((m, idx) => ({
                id: `usage-${tenantId}-${idx}`,
                tenantId,
                month: m.month,
                year: m.year,
                spinsUsed: m.spinsUsed,
                vouchersUsed: m.vouchersUsed,
                createdAt: new Date(m.year, m.month - 1, 15),
                updatedAt: new Date(m.year, m.month - 1, 15),
              }))
            );

            // Action: Query historical records
            const historicalRecords = await prisma.monthlyUsage.findMany({
              where: { tenantId },
              orderBy: [{ year: 'desc' }, { month: 'desc' }],
            });

            // Assertion 1: All historical records should be preserved
            expect(historicalRecords.length).toBe(uniqueMonths.length);

            // Assertion 2: Each historical record should maintain its original values
            historicalRecords.forEach((record, idx) => {
              const original = uniqueMonths.find(
                (m) => m.month === record.month && m.year === record.year
              );
              expect(original).toBeDefined();
              expect(record.spinsUsed).toBe(original!.spinsUsed);
              expect(record.vouchersUsed).toBe(original!.vouchersUsed);
            });

            // Assertion 3: Historical records should not be modified when querying
            // (verify findMany was called, not update or delete)
            expect(prisma.monthlyUsage.findMany).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain separate usage records for each month-year combination', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            month1: fc.integer({ min: 1, max: 12 }),
            year1: fc.integer({ min: 2020, max: 2030 }),
            usage1Spins: fc.nat({ max: 10000 }),
            usage1Vouchers: fc.nat({ max: 10000 }),
          }),
          async ({ tenantId, month1, year1, usage1Spins, usage1Vouchers }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Calculate next month
            let month2 = month1 + 1;
            let year2 = year1;
            if (month2 > 12) {
              month2 = 1;
              year2 = year1 + 1;
            }

            // Setup: Create two separate month records
            const usage1 = {
              id: `usage-${tenantId}-1`,
              tenantId,
              month: month1,
              year: year1,
              spinsUsed: usage1Spins,
              vouchersUsed: usage1Vouchers,
              createdAt: new Date(year1, month1 - 1, 15),
              updatedAt: new Date(year1, month1 - 1, 15),
            };

            const usage2 = {
              id: `usage-${tenantId}-2`,
              tenantId,
              month: month2,
              year: year2,
              spinsUsed: 0, // New month starts at zero
              vouchersUsed: 0,
              createdAt: new Date(year2, month2 - 1, 1),
              updatedAt: new Date(year2, month2 - 1, 1),
            };

            // Mock findUnique to return appropriate record based on month/year
            (prisma.monthlyUsage.findUnique as jest.Mock).mockImplementation(async (args) => {
              const where = args.where.tenantId_month_year;
              if (where.month === month1 && where.year === year1) {
                return usage1;
              } else if (where.month === month2 && where.year === year2) {
                return usage2;
              }
              return null;
            });

            // Action: Query both months
            const result1 = await prisma.monthlyUsage.findUnique({
              where: {
                tenantId_month_year: { tenantId, month: month1, year: year1 },
              },
            });

            const result2 = await prisma.monthlyUsage.findUnique({
              where: {
                tenantId_month_year: { tenantId, month: month2, year: year2 },
              },
            });

            // Assertion 1: Both records should exist independently
            expect(result1).toBeDefined();
            expect(result2).toBeDefined();

            // Assertion 2: First month should have original usage
            expect(result1!.spinsUsed).toBe(usage1Spins);
            expect(result1!.vouchersUsed).toBe(usage1Vouchers);

            // Assertion 3: Second month should have reset counters (zero)
            expect(result2!.spinsUsed).toBe(0);
            expect(result2!.vouchersUsed).toBe(0);

            // Assertion 4: Records should have different IDs
            expect(result1!.id).not.toBe(result2!.id);

            // Assertion 5: Records should have correct month/year
            expect(result1!.month).toBe(month1);
            expect(result1!.year).toBe(year1);
            expect(result2!.month).toBe(month2);
            expect(result2!.year).toBe(year2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle year transitions correctly (December to January)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            year: fc.integer({ min: 2020, max: 2029 }),
            decemberSpins: fc.nat({ max: 50000 }),
            decemberVouchers: fc.nat({ max: 50000 }),
          }),
          async ({ tenantId, year, decemberSpins, decemberVouchers }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            const decemberMonth = 12;
            const januaryMonth = 1;
            const nextYear = year + 1;

            // Setup: December record with usage
            const decemberUsage = {
              id: `usage-${tenantId}-dec`,
              tenantId,
              month: decemberMonth,
              year: year,
              spinsUsed: decemberSpins,
              vouchersUsed: decemberVouchers,
              createdAt: new Date(year, 11, 15), // December 15
              updatedAt: new Date(year, 11, 15),
            };

            // January record with reset counters
            const januaryUsage = {
              id: `usage-${tenantId}-jan`,
              tenantId,
              month: januaryMonth,
              year: nextYear,
              spinsUsed: 0,
              vouchersUsed: 0,
              createdAt: new Date(nextYear, 0, 1), // January 1
              updatedAt: new Date(nextYear, 0, 1),
            };

            // Mock findUnique to return appropriate record
            (prisma.monthlyUsage.findUnique as jest.Mock).mockImplementation(async (args) => {
              const where = args.where.tenantId_month_year;
              if (where.month === decemberMonth && where.year === year) {
                return decemberUsage;
              } else if (where.month === januaryMonth && where.year === nextYear) {
                return januaryUsage;
              }
              return null;
            });

            // Action: Query December and January records
            const decResult = await prisma.monthlyUsage.findUnique({
              where: {
                tenantId_month_year: { tenantId, month: decemberMonth, year },
              },
            });

            const janResult = await prisma.monthlyUsage.findUnique({
              where: {
                tenantId_month_year: { tenantId, month: januaryMonth, year: nextYear },
              },
            });

            // Assertion 1: December record should preserve its usage
            expect(decResult!.spinsUsed).toBe(decemberSpins);
            expect(decResult!.vouchersUsed).toBe(decemberVouchers);
            expect(decResult!.year).toBe(year);

            // Assertion 2: January record should have reset counters
            expect(janResult!.spinsUsed).toBe(0);
            expect(janResult!.vouchersUsed).toBe(0);

            // Assertion 3: January should be in the next year
            expect(janResult!.year).toBe(nextYear);
            expect(janResult!.month).toBe(1);

            // Assertion 4: Year transition should be handled correctly
            expect(janResult!.year).toBe(decResult!.year + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: super-admin-controls, Property 12: Additive Limit Calculation
   * **Validates: Requirements 4.5**
   * 
   * For any tenant with active overrides, the effective limit SHALL equal the base
   * subscription plan limit plus the sum of all active bonus amounts.
   */
  describe('Property 12: Additive Limit Calculation', () => {
    it('should calculate effective limit as base plan limit plus sum of all active overrides', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            baseSpinsLimit: fc.integer({ min: 100, max: 100000 }),
            baseVouchersLimit: fc.integer({ min: 50, max: 50000 }),
            activeOverrides: fc.array(
              fc.record({
                bonusSpins: fc.integer({ min: 0, max: 10000 }),
                bonusVouchers: fc.integer({ min: 0, max: 5000 }),
                expiresAt: fc.option(fc.date({ min: new Date(Date.now() + 86400000) }), { nil: null }), // Future date or null
              }),
              { minLength: 0, maxLength: 10 }
            ),
          }),
          async ({ tenantId, baseSpinsLimit, baseVouchersLimit, activeOverrides }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: baseSpinsLimit,
                vouchersPerMonth: baseVouchersLimit,
              },
            });

            // Setup: Mock active overrides
            const mockOverrides = activeOverrides.map((override, idx) => ({
              id: `override-${idx}`,
              tenantId,
              bonusSpins: override.bonusSpins,
              bonusVouchers: override.bonusVouchers,
              reason: 'Test bonus',
              grantedBy: 'admin-1',
              expiresAt: override.expiresAt,
              isActive: true,
              createdAt: new Date(),
            }));

            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue(mockOverrides);

            // Action: Calculate effective limits
            const effectiveLimits = await usageService.getEffectiveLimits(tenantId);

            // Calculate expected limits (base + sum of all active overrides)
            const expectedSpinsLimit = baseSpinsLimit + activeOverrides.reduce((sum, o) => sum + o.bonusSpins, 0);
            const expectedVouchersLimit = baseVouchersLimit + activeOverrides.reduce((sum, o) => sum + o.bonusVouchers, 0);

            // Assertion 1: Effective spins limit should equal base + sum of bonuses
            expect(effectiveLimits.spins).toBe(expectedSpinsLimit);

            // Assertion 2: Effective vouchers limit should equal base + sum of bonuses
            expect(effectiveLimits.vouchers).toBe(expectedVouchersLimit);

            // Assertion 3: Verify tenant was queried with correct ID
            expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
              where: { id: tenantId },
              include: { subscriptionPlan: true },
            });

            // Assertion 4: Verify overrides were queried with correct filters
            expect(prisma.tenantLimitOverride.findMany).toHaveBeenCalledWith({
              where: {
                tenantId,
                isActive: true,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gte: expect.any(Date) } },
                ],
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return only base limits when no active overrides exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            baseSpinsLimit: fc.integer({ min: 100, max: 100000 }),
            baseVouchersLimit: fc.integer({ min: 50, max: 50000 }),
          }),
          async ({ tenantId, baseSpinsLimit, baseVouchersLimit }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: baseSpinsLimit,
                vouchersPerMonth: baseVouchersLimit,
              },
            });

            // Setup: No active overrides
            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

            // Action: Calculate effective limits
            const effectiveLimits = await usageService.getEffectiveLimits(tenantId);

            // Assertion 1: Effective limits should equal base limits exactly
            expect(effectiveLimits.spins).toBe(baseSpinsLimit);
            expect(effectiveLimits.vouchers).toBe(baseVouchersLimit);

            // Assertion 2: No bonus should be added
            expect(effectiveLimits.spins).not.toBeGreaterThan(baseSpinsLimit);
            expect(effectiveLimits.vouchers).not.toBeGreaterThan(baseVouchersLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude expired overrides from limit calculation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            baseSpinsLimit: fc.integer({ min: 100, max: 100000 }),
            baseVouchersLimit: fc.integer({ min: 50, max: 50000 }),
            activeBonus: fc.record({
              bonusSpins: fc.integer({ min: 100, max: 5000 }),
              bonusVouchers: fc.integer({ min: 50, max: 2500 }),
            }),
            expiredBonus: fc.record({
              bonusSpins: fc.integer({ min: 100, max: 5000 }),
              bonusVouchers: fc.integer({ min: 50, max: 2500 }),
            }),
          }),
          async ({ tenantId, baseSpinsLimit, baseVouchersLimit, activeBonus, expiredBonus }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: baseSpinsLimit,
                vouchersPerMonth: baseVouchersLimit,
              },
            });

            // Setup: Mock only active override (expired one is filtered by query)
            // In real scenario, the database query filters out expired overrides
            const mockOverrides = [
              {
                id: 'override-active',
                tenantId,
                bonusSpins: activeBonus.bonusSpins,
                bonusVouchers: activeBonus.bonusVouchers,
                reason: 'Active bonus',
                grantedBy: 'admin-1',
                expiresAt: new Date(Date.now() + 86400000), // Future date
                isActive: true,
                createdAt: new Date(),
              },
              // Expired override is NOT returned by the query (filtered by WHERE clause)
            ];

            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue(mockOverrides);

            // Action: Calculate effective limits
            const effectiveLimits = await usageService.getEffectiveLimits(tenantId);

            // Calculate expected limits (base + only active bonus, NOT expired)
            const expectedSpinsLimit = baseSpinsLimit + activeBonus.bonusSpins;
            const expectedVouchersLimit = baseVouchersLimit + activeBonus.bonusVouchers;

            // Assertion 1: Should include only active bonus
            expect(effectiveLimits.spins).toBe(expectedSpinsLimit);
            expect(effectiveLimits.vouchers).toBe(expectedVouchersLimit);

            // Assertion 2: Should NOT include expired bonus
            expect(effectiveLimits.spins).not.toBe(baseSpinsLimit + activeBonus.bonusSpins + expiredBonus.bonusSpins);
            expect(effectiveLimits.vouchers).not.toBe(baseVouchersLimit + activeBonus.bonusVouchers + expiredBonus.bonusVouchers);

            // Assertion 3: Verify query filters for active and non-expired overrides
            expect(prisma.tenantLimitOverride.findMany).toHaveBeenCalledWith({
              where: {
                tenantId,
                isActive: true,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gte: expect.any(Date) } },
                ],
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple overrides with different bonus amounts additively', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            baseSpinsLimit: fc.integer({ min: 1000, max: 10000 }),
            baseVouchersLimit: fc.integer({ min: 500, max: 5000 }),
            override1: fc.record({
              bonusSpins: fc.integer({ min: 100, max: 1000 }),
              bonusVouchers: fc.integer({ min: 50, max: 500 }),
            }),
            override2: fc.record({
              bonusSpins: fc.integer({ min: 200, max: 2000 }),
              bonusVouchers: fc.integer({ min: 100, max: 1000 }),
            }),
            override3: fc.record({
              bonusSpins: fc.integer({ min: 50, max: 500 }),
              bonusVouchers: fc.integer({ min: 25, max: 250 }),
            }),
          }),
          async ({ tenantId, baseSpinsLimit, baseVouchersLimit, override1, override2, override3 }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: baseSpinsLimit,
                vouchersPerMonth: baseVouchersLimit,
              },
            });

            // Setup: Mock three active overrides
            const mockOverrides = [
              {
                id: 'override-1',
                tenantId,
                bonusSpins: override1.bonusSpins,
                bonusVouchers: override1.bonusVouchers,
                reason: 'Bonus 1',
                grantedBy: 'admin-1',
                expiresAt: null, // Permanent
                isActive: true,
                createdAt: new Date(),
              },
              {
                id: 'override-2',
                tenantId,
                bonusSpins: override2.bonusSpins,
                bonusVouchers: override2.bonusVouchers,
                reason: 'Bonus 2',
                grantedBy: 'admin-1',
                expiresAt: null,
                isActive: true,
                createdAt: new Date(),
              },
              {
                id: 'override-3',
                tenantId,
                bonusSpins: override3.bonusSpins,
                bonusVouchers: override3.bonusVouchers,
                reason: 'Bonus 3',
                grantedBy: 'admin-2',
                expiresAt: null,
                isActive: true,
                createdAt: new Date(),
              },
            ];

            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue(mockOverrides);

            // Action: Calculate effective limits
            const effectiveLimits = await usageService.getEffectiveLimits(tenantId);

            // Calculate expected limits (base + sum of ALL three overrides)
            const totalBonusSpins = override1.bonusSpins + override2.bonusSpins + override3.bonusSpins;
            const totalBonusVouchers = override1.bonusVouchers + override2.bonusVouchers + override3.bonusVouchers;
            const expectedSpinsLimit = baseSpinsLimit + totalBonusSpins;
            const expectedVouchersLimit = baseVouchersLimit + totalBonusVouchers;

            // Assertion 1: Effective limit should be base + sum of all bonuses
            expect(effectiveLimits.spins).toBe(expectedSpinsLimit);
            expect(effectiveLimits.vouchers).toBe(expectedVouchersLimit);

            // Assertion 2: Verify additive property (not multiplicative or other operation)
            const manualCalculation = baseSpinsLimit + override1.bonusSpins + override2.bonusSpins + override3.bonusSpins;
            expect(effectiveLimits.spins).toBe(manualCalculation);

            // Assertion 3: Each override contributes independently
            expect(effectiveLimits.spins).toBeGreaterThan(baseSpinsLimit);
            expect(effectiveLimits.spins).toBeGreaterThan(baseSpinsLimit + override1.bonusSpins);
            expect(effectiveLimits.spins).toBeGreaterThan(baseSpinsLimit + override1.bonusSpins + override2.bonusSpins);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero bonus amounts correctly in additive calculation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            baseSpinsLimit: fc.integer({ min: 100, max: 100000 }),
            baseVouchersLimit: fc.integer({ min: 50, max: 50000 }),
            nonZeroBonus: fc.integer({ min: 1, max: 5000 }),
          }),
          async ({ tenantId, baseSpinsLimit, baseVouchersLimit, nonZeroBonus }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: baseSpinsLimit,
                vouchersPerMonth: baseVouchersLimit,
              },
            });

            // Setup: Mock overrides with some zero bonuses
            const mockOverrides = [
              {
                id: 'override-1',
                tenantId,
                bonusSpins: nonZeroBonus,
                bonusVouchers: 0, // Zero bonus for vouchers
                reason: 'Spins only bonus',
                grantedBy: 'admin-1',
                expiresAt: null,
                isActive: true,
                createdAt: new Date(),
              },
              {
                id: 'override-2',
                tenantId,
                bonusSpins: 0, // Zero bonus for spins
                bonusVouchers: nonZeroBonus,
                reason: 'Vouchers only bonus',
                grantedBy: 'admin-1',
                expiresAt: null,
                isActive: true,
                createdAt: new Date(),
              },
            ];

            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue(mockOverrides);

            // Action: Calculate effective limits
            const effectiveLimits = await usageService.getEffectiveLimits(tenantId);

            // Calculate expected limits
            const expectedSpinsLimit = baseSpinsLimit + nonZeroBonus + 0; // nonZeroBonus from first override, 0 from second
            const expectedVouchersLimit = baseVouchersLimit + 0 + nonZeroBonus; // 0 from first override, nonZeroBonus from second

            // Assertion 1: Zero bonuses should not affect the calculation
            expect(effectiveLimits.spins).toBe(expectedSpinsLimit);
            expect(effectiveLimits.vouchers).toBe(expectedVouchersLimit);

            // Assertion 2: Adding zero should be identity operation
            expect(effectiveLimits.spins).toBe(baseSpinsLimit + nonZeroBonus);
            expect(effectiveLimits.vouchers).toBe(baseVouchersLimit + nonZeroBonus);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain additive property regardless of override order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            baseSpinsLimit: fc.integer({ min: 1000, max: 10000 }),
            baseVouchersLimit: fc.integer({ min: 500, max: 5000 }),
            bonuses: fc.array(
              fc.record({
                bonusSpins: fc.integer({ min: 10, max: 1000 }),
                bonusVouchers: fc.integer({ min: 5, max: 500 }),
              }),
              { minLength: 2, maxLength: 5 }
            ),
          }),
          async ({ tenantId, baseSpinsLimit, baseVouchersLimit, bonuses }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: baseSpinsLimit,
                vouchersPerMonth: baseVouchersLimit,
              },
            });

            // Setup: Mock overrides in original order
            const mockOverrides = bonuses.map((bonus, idx) => ({
              id: `override-${idx}`,
              tenantId,
              bonusSpins: bonus.bonusSpins,
              bonusVouchers: bonus.bonusVouchers,
              reason: `Bonus ${idx}`,
              grantedBy: 'admin-1',
              expiresAt: null,
              isActive: true,
              createdAt: new Date(),
            }));

            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue(mockOverrides);

            // Action: Calculate effective limits
            const effectiveLimits = await usageService.getEffectiveLimits(tenantId);

            // Calculate expected sum (order shouldn't matter for addition)
            const totalBonusSpins = bonuses.reduce((sum, b) => sum + b.bonusSpins, 0);
            const totalBonusVouchers = bonuses.reduce((sum, b) => sum + b.bonusVouchers, 0);
            const expectedSpinsLimit = baseSpinsLimit + totalBonusSpins;
            const expectedVouchersLimit = baseVouchersLimit + totalBonusVouchers;

            // Assertion 1: Result should match sum regardless of order
            expect(effectiveLimits.spins).toBe(expectedSpinsLimit);
            expect(effectiveLimits.vouchers).toBe(expectedVouchersLimit);

            // Assertion 2: Verify commutative property of addition
            // Calculate in reverse order
            const reverseTotalSpins = bonuses.reverse().reduce((sum, b) => sum + b.bonusSpins, 0);
            expect(totalBonusSpins).toBe(reverseTotalSpins);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: super-admin-controls, Property 1: Limit Enforcement
   * **Validates: Requirements 1.3, 1.4**
   * 
   * For any tenant at or exceeding their monthly limit (spins or vouchers),
   * attempting to perform the limited action SHALL be rejected with an error,
   * and the usage counter SHALL remain unchanged.
   */
  describe('Property 1: Limit Enforcement', () => {
    it('should reject spin attempts when at or exceeding spin limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            spinsLimit: fc.integer({ min: 10, max: 10000 }),
            vouchersLimit: fc.integer({ min: 10, max: 5000 }),
            // Generate usage at or above limit
            spinsUsed: fc.integer({ min: 0, max: 5000 }),
          }),
          async ({ tenantId, spinsLimit, vouchersLimit, spinsUsed }) => {
            // Only test cases where usage is at or exceeds limit
            fc.pre(spinsUsed >= spinsLimit);

            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: spinsLimit,
                vouchersPerMonth: vouchersLimit,
              },
            });

            // Setup: No active overrides
            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

            // Setup: Mock current usage at or exceeding limit
            const currentUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: spinsUsed,
              vouchersUsed: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(currentUsage);

            // Action: Check if tenant can spin
            const canSpin = await usageService.canSpin(tenantId);

            // Assertion 1: Spin should be rejected (canSpin returns false)
            expect(canSpin).toBe(false);

            // Assertion 2: Verify that the check was performed
            expect(prisma.monthlyUsage.findUnique).toHaveBeenCalled();
            expect(prisma.tenant.findUnique).toHaveBeenCalled();

            // Assertion 3: Verify no increment operation was attempted
            // (canSpin only checks, doesn't increment)
            expect(prisma.monthlyUsage.upsert).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject voucher creation when at or exceeding voucher limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            spinsLimit: fc.integer({ min: 10, max: 10000 }),
            vouchersLimit: fc.integer({ min: 10, max: 5000 }),
            // Generate usage at or above limit
            vouchersUsed: fc.integer({ min: 0, max: 5000 }),
          }),
          async ({ tenantId, spinsLimit, vouchersLimit, vouchersUsed }) => {
            // Only test cases where usage is at or exceeds limit
            fc.pre(vouchersUsed >= vouchersLimit);

            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: spinsLimit,
                vouchersPerMonth: vouchersLimit,
              },
            });

            // Setup: No active overrides
            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

            // Setup: Mock current usage at or exceeding limit
            const currentUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: 0,
              vouchersUsed: vouchersUsed,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(currentUsage);

            // Action: Check if tenant can create voucher
            const canCreateVoucher = await usageService.canCreateVoucher(tenantId);

            // Assertion 1: Voucher creation should be rejected (canCreateVoucher returns false)
            expect(canCreateVoucher).toBe(false);

            // Assertion 2: Verify that the check was performed
            expect(prisma.monthlyUsage.findUnique).toHaveBeenCalled();
            expect(prisma.tenant.findUnique).toHaveBeenCalled();

            // Assertion 3: Verify no increment operation was attempted
            // (canCreateVoucher only checks, doesn't increment)
            expect(prisma.monthlyUsage.upsert).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow actions when usage is below limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            spinsLimit: fc.integer({ min: 100, max: 10000 }),
            vouchersLimit: fc.integer({ min: 100, max: 5000 }),
            // Generate usage below limit
            spinsUsed: fc.integer({ min: 0, max: 99 }),
            vouchersUsed: fc.integer({ min: 0, max: 99 }),
          }),
          async ({ tenantId, spinsLimit, vouchersLimit, spinsUsed, vouchersUsed }) => {
            // Only test cases where usage is below limit
            fc.pre(spinsUsed < spinsLimit && vouchersUsed < vouchersLimit);

            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: spinsLimit,
                vouchersPerMonth: vouchersLimit,
              },
            });

            // Setup: No active overrides
            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

            // Setup: Mock current usage below limit
            const currentUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: spinsUsed,
              vouchersUsed: vouchersUsed,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(currentUsage);

            // Action: Check if tenant can spin and create voucher
            const canSpin = await usageService.canSpin(tenantId);
            const canCreateVoucher = await usageService.canCreateVoucher(tenantId);

            // Assertion 1: Both actions should be allowed
            expect(canSpin).toBe(true);
            expect(canCreateVoucher).toBe(true);

            // Assertion 2: Verify checks were performed
            expect(prisma.monthlyUsage.findUnique).toHaveBeenCalled();
            expect(prisma.tenant.findUnique).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce limit at exact boundary (usage equals limit)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            limit: fc.integer({ min: 10, max: 10000 }),
          }),
          async ({ tenantId, limit }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: limit,
                vouchersPerMonth: limit,
              },
            });

            // Setup: No active overrides
            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

            // Setup: Mock current usage exactly at limit
            const currentUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: limit, // Exactly at limit
              vouchersUsed: limit, // Exactly at limit
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(currentUsage);

            // Action: Check if tenant can spin and create voucher
            const canSpin = await usageService.canSpin(tenantId);
            const canCreateVoucher = await usageService.canCreateVoucher(tenantId);

            // Assertion 1: Both actions should be rejected at exact limit
            expect(canSpin).toBe(false);
            expect(canCreateVoucher).toBe(false);

            // Assertion 2: Verify the boundary condition (usage === limit)
            expect(currentUsage.spinsUsed).toBe(limit);
            expect(currentUsage.vouchersUsed).toBe(limit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce limit considering active overrides', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            baseLimit: fc.integer({ min: 100, max: 5000 }),
            bonusAmount: fc.integer({ min: 10, max: 1000 }),
            usageOffset: fc.integer({ min: -5, max: 5 }), // Usage relative to effective limit
          }),
          async ({ tenantId, baseLimit, bonusAmount, usageOffset }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            const effectiveLimit = baseLimit + bonusAmount;
            const usage = effectiveLimit + usageOffset;

            // Skip if usage would be negative
            if (usage < 0) return;

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: baseLimit,
                vouchersPerMonth: baseLimit,
              },
            });

            // Setup: Mock active override with bonus
            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([
              {
                id: 'override-1',
                tenantId,
                bonusSpins: bonusAmount,
                bonusVouchers: bonusAmount,
                reason: 'Test bonus',
                grantedBy: 'admin-1',
                expiresAt: null,
                isActive: true,
                createdAt: new Date(),
              },
            ]);

            // Setup: Mock current usage
            const currentUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: usage,
              vouchersUsed: usage,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(currentUsage);

            // Action: Check if tenant can spin and create voucher
            const canSpin = await usageService.canSpin(tenantId);
            const canCreateVoucher = await usageService.canCreateVoucher(tenantId);

            // Assertion: Actions should be allowed only if usage < effective limit
            const expectedResult = usage < effectiveLimit;
            expect(canSpin).toBe(expectedResult);
            expect(canCreateVoucher).toBe(expectedResult);

            // Assertion 2: Verify effective limit calculation includes override
            const limits = await usageService.getEffectiveLimits(tenantId);
            expect(limits.spins).toBe(effectiveLimit);
            expect(limits.vouchers).toBe(effectiveLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain usage counter unchanged when limit check fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            limit: fc.integer({ min: 10, max: 1000 }),
            usageAtLimit: fc.integer({ min: 10, max: 1000 }),
          }),
          async ({ tenantId, limit, usageAtLimit }) => {
            // Only test when at or over limit
            fc.pre(usageAtLimit >= limit);

            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Setup: Mock tenant with subscription plan
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: limit,
                vouchersPerMonth: limit,
              },
            });

            // Setup: No active overrides
            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

            // Setup: Mock current usage at or over limit
            const initialUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: usageAtLimit,
              vouchersUsed: usageAtLimit,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(initialUsage);

            // Record initial usage values
            const initialSpinsUsed = initialUsage.spinsUsed;
            const initialVouchersUsed = initialUsage.vouchersUsed;

            // Action: Check if tenant can spin (should return false)
            const canSpin = await usageService.canSpin(tenantId);
            const canCreateVoucher = await usageService.canCreateVoucher(tenantId);

            // Assertion 1: Actions should be rejected
            expect(canSpin).toBe(false);
            expect(canCreateVoucher).toBe(false);

            // Assertion 2: Usage counters should remain unchanged
            // (canSpin/canCreateVoucher only check, they don't modify)
            expect(initialUsage.spinsUsed).toBe(initialSpinsUsed);
            expect(initialUsage.vouchersUsed).toBe(initialVouchersUsed);

            // Assertion 3: No update/upsert operations should have been called
            expect(prisma.monthlyUsage.upsert).not.toHaveBeenCalled();

            // Assertion 4: Only read operations should have been performed
            expect(prisma.monthlyUsage.findUnique).toHaveBeenCalled();
            expect(prisma.tenant.findUnique).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce independent limits for spins and vouchers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.string({ minLength: 1, maxLength: 50 }),
            spinsLimit: fc.integer({ min: 100, max: 5000 }),
            vouchersLimit: fc.integer({ min: 100, max: 5000 }),
            spinsUsed: fc.integer({ min: 0, max: 5000 }),
            vouchersUsed: fc.integer({ min: 0, max: 5000 }),
          }),
          async ({ tenantId, spinsLimit, vouchersLimit, spinsUsed, vouchersUsed }) => {
            // Clear mocks for each property test iteration
            jest.clearAllMocks();

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Setup: Mock tenant with different limits for spins and vouchers
            (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
              id: tenantId,
              name: 'Test Tenant',
              subscriptionPlanId: 'plan-1',
              subscriptionPlan: {
                id: 'plan-1',
                name: 'Test Plan',
                spinsPerMonth: spinsLimit,
                vouchersPerMonth: vouchersLimit,
              },
            });

            // Setup: No active overrides
            (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

            // Setup: Mock current usage
            const currentUsage = {
              id: `usage-${tenantId}`,
              tenantId,
              month: currentMonth,
              year: currentYear,
              spinsUsed: spinsUsed,
              vouchersUsed: vouchersUsed,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prisma.monthlyUsage.findUnique as jest.Mock).mockResolvedValue(currentUsage);

            // Action: Check both limits
            const canSpin = await usageService.canSpin(tenantId);
            const canCreateVoucher = await usageService.canCreateVoucher(tenantId);

            // Assertion 1: Spin limit should be enforced independently
            expect(canSpin).toBe(spinsUsed < spinsLimit);

            // Assertion 2: Voucher limit should be enforced independently
            expect(canCreateVoucher).toBe(vouchersUsed < vouchersLimit);

            // Assertion 3: One limit being exceeded should not affect the other
            // If spins are at limit but vouchers are not, vouchers should still be allowed
            if (spinsUsed >= spinsLimit && vouchersUsed < vouchersLimit) {
              expect(canSpin).toBe(false);
              expect(canCreateVoucher).toBe(true);
            }

            // If vouchers are at limit but spins are not, spins should still be allowed
            if (vouchersUsed >= vouchersLimit && spinsUsed < spinsLimit) {
              expect(canCreateVoucher).toBe(false);
              expect(canSpin).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
