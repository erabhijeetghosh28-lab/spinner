/**
 * @jest-environment node
 * 
 * Property-Based Tests for Bonus Spin Service
 * 
 * Tests universal properties using fast-check for randomized testing
 * Feature: manager-role-verification
 * 
 * Requirements: 5.1, 5.2, 5.5
 */

import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import { grantBonusSpins } from '../bonus-spin-service';

const prisma = new PrismaClient();

/**
 * Arbitraries (generators) for property-based testing
 */

// Generate valid bonus spin amounts (1-50)
const bonusSpinAmountArbitrary = fc.integer({ min: 1, max: 50 });

// Generate customer names (2-100 characters)
const customerNameArbitrary = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2);

// Generate phone numbers (10 digits)
const phoneArbitrary = fc.integer({ min: 1000000000, max: 9999999999 }).map(n => n.toString());

// Generate manager IDs
const managerIdArbitrary = fc.string({ minLength: 5, maxLength: 50 });

// Generate reasons for granting spins
const reasonArbitrary = fc.string({ minLength: 5, maxLength: 200 });

/**
 * Property-Based Tests for Bonus Spin Service
 */
describe('Bonus Spin Service Property-Based Tests', () => {
  let testTenantId: string;
  let testCampaignId: string;
  let testPlanId: string;

  beforeAll(async () => {
    // Create a test plan
    const existingPlan = await prisma.plan.findFirst({
      where: { name: 'Test Plan for Bonus Spin Tests' },
    });

    if (existingPlan) {
      testPlanId = existingPlan.id;
    } else {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan for Bonus Spin Tests',
          maxSpins: 10000,
          maxCampaigns: 10,
          campaignDurationDays: 30,
        },
      });
      testPlanId = plan.id;
    }

    // Create a test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant for Bonus Spin Tests',
        slug: 'test-tenant-bonus-' + Date.now(),
        planId: testPlanId,
      },
    });
    testTenantId = tenant.id;

    // Create a test campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Test Campaign for Bonus Spin Tests',
        tenantId: testTenantId,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        prizes: {
          create: [
            {
              name: 'Test Prize',
              probability: 100,
              currentStock: 1000,
              position: 0,
            },
          ],
        },
      },
    });
    testCampaignId = campaign.id;
  });

  afterAll(async () => {
    // Cleanup: Delete all test data
    await prisma.spin.deleteMany({
      where: { 
        user: {
          tenantId: testTenantId
        }
      },
    });

    await prisma.endUser.deleteMany({
      where: { tenantId: testTenantId },
    });

    await prisma.prize.deleteMany({
      where: { campaignId: testCampaignId },
    });

    await prisma.campaign.delete({
      where: { id: testCampaignId },
    });

    await prisma.tenant.delete({
      where: { id: testTenantId },
    });

    await prisma.$disconnect();
  });

  /**
   * Property 10: Customer Eligibility Check
   * **Validates: Requirements 5.1**
   * 
   * For any task approval, bonus spins should only be granted to customers
   * who have spun the wheel at least once; customers without spin history
   * should not receive bonus spins.
   */
  describe('Property 10: Customer Eligibility Check', () => {
    it('should grant bonus spins only to customers who have spun at least once', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            bonusAmount: bonusSpinAmountArbitrary,
            managerId: managerIdArbitrary,
            reason: reasonArbitrary,
          }),
          async ({ customerName, phone, bonusAmount, managerId, reason }) => {
            // Make customer unique
            const uniquePhone = `${phone}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueName = `${customerName.trim()}-${Date.now()}`;

            // Setup: Create a customer who HAS spun at least once
            const customerWithSpin = await prisma.endUser.create({
              data: {
                name: uniqueName,
                phone: uniquePhone,
                tenantId: testTenantId,
                bonusSpinsEarned: 0,
              },
            });

            // Create a spin record for this customer
            await prisma.spin.create({
              data: {
                userId: customerWithSpin.id,
                campaignId: testCampaignId,
                wonPrize: false,
              },
            });

            try {
              // Action: Grant bonus spins to eligible customer
              const result = await grantBonusSpins(
                customerWithSpin.id,
                bonusAmount,
                reason,
                managerId
              );

              // Assertion: Should succeed for eligible customer
              expect(result.success).toBe(true);
              expect(result.newSpinCount).toBeDefined();
              expect(result.newSpinCount).toBe(bonusAmount);
              expect(result.error).toBeUndefined();

              // Verify database was updated
              const updatedCustomer = await prisma.endUser.findUnique({
                where: { id: customerWithSpin.id },
              });
              expect(updatedCustomer?.bonusSpinsEarned).toBe(bonusAmount);
            } finally {
              // Cleanup
              await prisma.spin.deleteMany({
                where: { userId: customerWithSpin.id },
              });
              await prisma.endUser.delete({
                where: { id: customerWithSpin.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // Reduced iterations for faster testing
      );
    }, 120000); // 2 minute timeout

    it('should reject bonus spins for customers who have never spun', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            bonusAmount: bonusSpinAmountArbitrary,
            managerId: managerIdArbitrary,
            reason: reasonArbitrary,
          }),
          async ({ customerName, phone, bonusAmount, managerId, reason }) => {
            // Make customer unique
            const uniquePhone = `${phone}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueName = `${customerName.trim()}-${Date.now()}`;

            // Setup: Create a customer who has NEVER spun
            const customerWithoutSpin = await prisma.endUser.create({
              data: {
                name: uniqueName,
                phone: uniquePhone,
                tenantId: testTenantId,
                bonusSpinsEarned: 0,
              },
            });

            try {
              // Action: Attempt to grant bonus spins to ineligible customer
              const result = await grantBonusSpins(
                customerWithoutSpin.id,
                bonusAmount,
                reason,
                managerId
              );

              // Assertion: Should fail for ineligible customer
              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();
              expect(result.error).toContain('must spin at least once');
              expect(result.newSpinCount).toBeUndefined();

              // Verify database was NOT updated
              const unchangedCustomer = await prisma.endUser.findUnique({
                where: { id: customerWithoutSpin.id },
              });
              expect(unchangedCustomer?.bonusSpinsEarned).toBe(0);
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customerWithoutSpin.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // Reduced iterations for faster testing
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Property 11: Spin Count Increment
   * **Validates: Requirements 5.2, 5.3**
   * 
   * For any approved task completion for an eligible customer, the customer's
   * available spin count should increase by the granted bonus spin amount.
   */
  describe('Property 11: Spin Count Increment', () => {
    it('should increment customer spin count by exact bonus amount', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            initialSpins: fc.integer({ min: 0, max: 100 }),
            bonusAmount: bonusSpinAmountArbitrary,
            managerId: managerIdArbitrary,
            reason: reasonArbitrary,
          }),
          async ({ customerName, phone, initialSpins, bonusAmount, managerId, reason }) => {
            // Make customer unique
            const uniquePhone = `${phone}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueName = `${customerName.trim()}-${Date.now()}`;

            // Setup: Create a customer with initial bonus spins
            const customer = await prisma.endUser.create({
              data: {
                name: uniqueName,
                phone: uniquePhone,
                tenantId: testTenantId,
                bonusSpinsEarned: initialSpins,
              },
            });

            // Create a spin record to make customer eligible
            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId,
                wonPrize: false,
              },
            });

            try {
              // Action: Grant bonus spins
              const result = await grantBonusSpins(
                customer.id,
                bonusAmount,
                reason,
                managerId
              );

              // Assertion: Spin count should increase by exact bonus amount
              expect(result.success).toBe(true);
              expect(result.newSpinCount).toBe(initialSpins + bonusAmount);

              // Verify database reflects the increment
              const updatedCustomer = await prisma.endUser.findUnique({
                where: { id: customer.id },
              });
              expect(updatedCustomer?.bonusSpinsEarned).toBe(initialSpins + bonusAmount);
            } finally {
              // Cleanup
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // Reduced iterations for faster testing
      );
    }, 120000); // 2 minute timeout

    it('should handle multiple sequential bonus spin grants correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            bonusAmounts: fc.array(bonusSpinAmountArbitrary, { minLength: 2, maxLength: 5 }),
            managerId: managerIdArbitrary,
            reason: reasonArbitrary,
          }),
          async ({ customerName, phone, bonusAmounts, managerId, reason }) => {
            // Make customer unique
            const uniquePhone = `${phone}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueName = `${customerName.trim()}-${Date.now()}`;

            // Setup: Create a customer
            const customer = await prisma.endUser.create({
              data: {
                name: uniqueName,
                phone: uniquePhone,
                tenantId: testTenantId,
                bonusSpinsEarned: 0,
              },
            });

            // Create a spin record to make customer eligible
            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId,
                wonPrize: false,
              },
            });

            try {
              let expectedTotal = 0;

              // Action: Grant multiple bonus spins sequentially
              for (const amount of bonusAmounts) {
                const result = await grantBonusSpins(
                  customer.id,
                  amount,
                  reason,
                  managerId
                );

                expectedTotal += amount;

                // Assertion: Each grant should succeed and accumulate correctly
                expect(result.success).toBe(true);
                expect(result.newSpinCount).toBe(expectedTotal);
              }

              // Final verification
              const finalCustomer = await prisma.endUser.findUnique({
                where: { id: customer.id },
              });
              expect(finalCustomer?.bonusSpinsEarned).toBe(expectedTotal);
            } finally {
              // Cleanup
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 } // Reduced iterations for complex test
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 32: Error Logging on Spin Allocation Failure
   * **Validates: Requirements 5.5**
   * 
   * For any bonus spin allocation that fails, an error should be logged
   * and the task completion should be marked for retry.
   */
  describe('Property 32: Error Logging on Spin Allocation Failure', () => {
    it('should log errors and return failure status for non-existent customers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            bonusAmount: bonusSpinAmountArbitrary,
            managerId: managerIdArbitrary,
            reason: reasonArbitrary,
          }),
          async ({ bonusAmount, managerId, reason }) => {
            // Use a non-existent customer ID
            const nonExistentCustomerId = `nonexistent-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Spy on console.error to verify logging
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            try {
              // Action: Attempt to grant bonus spins to non-existent customer
              const result = await grantBonusSpins(
                nonExistentCustomerId,
                bonusAmount,
                reason,
                managerId
              );

              // Assertion: Should fail and return error
              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();
              expect(result.error).toContain('Customer not found');
              expect(result.newSpinCount).toBeUndefined();

              // Verify error was logged
              expect(consoleErrorSpy).toHaveBeenCalled();
              const errorCalls = consoleErrorSpy.mock.calls.filter(call =>
                call.some(arg => typeof arg === 'string' && arg.includes('Failed to grant bonus spins'))
              );
              expect(errorCalls.length).toBeGreaterThan(0);

              // Verify error log contains relevant information
              const errorLog = errorCalls[0];
              expect(errorLog).toBeDefined();
              const logObject = errorLog.find(arg => typeof arg === 'object' && arg !== null);
              expect(logObject).toBeDefined();
              expect(logObject).toHaveProperty('error');
              expect(logObject).toHaveProperty('amount', bonusAmount);
              expect(logObject).toHaveProperty('reason', reason);
              expect(logObject).toHaveProperty('grantedBy', managerId);
              expect(logObject).toHaveProperty('timestamp');
            } finally {
              consoleErrorSpy.mockRestore();
            }
          }
        ),
        { numRuns: 5 } // Reduced iterations for faster testing
      );
    }, 120000); // 2 minute timeout

    it('should log errors with complete context information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            bonusAmount: bonusSpinAmountArbitrary,
            managerId: managerIdArbitrary,
            reason: reasonArbitrary,
          }),
          async ({ customerName, phone, bonusAmount, managerId, reason }) => {
            // Make customer unique
            const uniquePhone = `${phone}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueName = `${customerName.trim()}-${Date.now()}`;

            // Setup: Create a customer without spin history (will fail eligibility check)
            const customer = await prisma.endUser.create({
              data: {
                name: uniqueName,
                phone: uniquePhone,
                tenantId: testTenantId,
                bonusSpinsEarned: 0,
              },
            });

            // Spy on console.error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            try {
              // Action: Attempt to grant bonus spins (will fail eligibility check)
              const result = await grantBonusSpins(
                customer.id,
                bonusAmount,
                reason,
                managerId
              );

              // Assertion: Should fail
              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();

              // Verify error log contains all context
              expect(consoleErrorSpy).toHaveBeenCalled();
              const errorCalls = consoleErrorSpy.mock.calls.filter(call =>
                call.some(arg => typeof arg === 'string' && arg.includes('Failed to grant bonus spins'))
              );
              expect(errorCalls.length).toBeGreaterThan(0);

              const logObject = errorCalls[0].find(arg => typeof arg === 'object' && arg !== null);
              expect(logObject).toBeDefined();
              
              // Verify all required fields are logged
              expect(logObject).toHaveProperty('error');
              expect(logObject).toHaveProperty('amount');
              expect(logObject).toHaveProperty('reason');
              expect(logObject).toHaveProperty('grantedBy');
              expect(logObject).toHaveProperty('timestamp');
              
              // Verify values match input
              expect(logObject.amount).toBe(bonusAmount);
              expect(logObject.reason).toBe(reason);
              expect(logObject.grantedBy).toBe(managerId);
            } finally {
              consoleErrorSpy.mockRestore();
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // Reduced iterations for faster testing
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Additional property tests for atomicity and consistency
   */
  describe('Transaction Atomicity Properties', () => {
    it('should maintain data consistency when granting spins', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            bonusAmount: bonusSpinAmountArbitrary,
            managerId: managerIdArbitrary,
            reason: reasonArbitrary,
          }),
          async ({ customerName, phone, bonusAmount, managerId, reason }) => {
            // Make customer unique
            const uniquePhone = `${phone}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueName = `${customerName.trim()}-${Date.now()}`;

            // Setup: Create a customer with spin history
            const customer = await prisma.endUser.create({
              data: {
                name: uniqueName,
                phone: uniquePhone,
                tenantId: testTenantId,
                bonusSpinsEarned: 0,
              },
            });

            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId,
                wonPrize: false,
              },
            });

            try {
              // Get initial state
              const initialCustomer = await prisma.endUser.findUnique({
                where: { id: customer.id },
              });
              const initialSpins = initialCustomer?.bonusSpinsEarned || 0;

              // Action: Grant bonus spins
              const result = await grantBonusSpins(
                customer.id,
                bonusAmount,
                reason,
                managerId
              );

              // Get final state
              const finalCustomer = await prisma.endUser.findUnique({
                where: { id: customer.id },
              });
              const finalSpins = finalCustomer?.bonusSpinsEarned || 0;

              // Assertion: Either operation succeeded and spins increased,
              // or operation failed and spins unchanged (atomicity)
              if (result.success) {
                expect(finalSpins).toBe(initialSpins + bonusAmount);
                expect(result.newSpinCount).toBe(finalSpins);
              } else {
                expect(finalSpins).toBe(initialSpins);
                expect(result.newSpinCount).toBeUndefined();
              }
            } finally {
              // Cleanup
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // Reduced iterations for faster testing
      );
    }, 120000); // 2 minute timeout
  });
});
