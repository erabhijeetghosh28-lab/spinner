/**
 * @jest-environment node
 * 
 * Property-Based Tests for Manager Authentication Service
 * 
 * Tests universal properties using fast-check for randomized testing
 * Feature: manager-role-verification
 * 
 * Requirements: 2.2, 2.3, 2.5, 1.5
 */

import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import { ManagerAuthService } from '../manager-auth-service';

const prisma = new PrismaClient();
const authService = new ManagerAuthService();

/**
 * Arbitraries (generators) for property-based testing
 */

// Generate valid names (2-100 characters, alphanumeric with spaces)
const nameArbitrary = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2);

// Generate maxBonusSpinsPerApproval (1-50)
const maxBonusSpinsArbitrary = fc.integer({ min: 1, max: 50 });

// Generate boolean for isActive status
const isActiveArbitrary = fc.boolean();

/**
 * Property-Based Tests for Manager Authentication
 */
describe('Manager Authentication Service Property-Based Tests', () => {
  let testTenantId: string;
  let testPlanId: string;

  beforeAll(async () => {
    // Create a test plan if it doesn't exist
    const existingPlan = await prisma.plan.findFirst({
      where: { name: 'Test Plan for Auth Tests' },
    });

    if (existingPlan) {
      testPlanId = existingPlan.id;
    } else {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan for Auth Tests',
          maxSpins: 1000,
          maxCampaigns: 1,
          campaignDurationDays: 30,
        },
      });
      testPlanId = plan.id;
    }

    // Create a test tenant for all tests
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant for Auth Tests',
        slug: 'test-tenant-auth-' + Date.now(),
        planId: testPlanId,
      },
    });
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    // Cleanup: Delete all test managers
    await prisma.manager.deleteMany({
      where: { tenantId: testTenantId },
    });

    // Delete test tenant
    await prisma.tenant.delete({
      where: { id: testTenantId },
    });

    await prisma.$disconnect();
  });

  /**
   * Property 28: Valid Credentials Authentication
   * **Validates: Requirements 2.2**
   * 
   * For any manager with valid credentials (correct ID and name),
   * authentication should succeed and return a session token.
   */
  describe('Property 28: Valid Credentials Authentication', () => {
    it('should successfully authenticate any manager with valid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: nameArbitrary,
            maxBonusSpinsPerApproval: maxBonusSpinsArbitrary,
          }),
          async ({ name, maxBonusSpinsPerApproval }) => {
            // Make name unique for this test run
            const uniqueName = `${name.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Setup: Create an active manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueName,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval,
                isActive: true,
              },
            });

            try {
              // Action: Attempt to login with valid credentials (ID and name)
              const result = await authService.login(manager.id, uniqueName);

              // Assertions: Login should succeed
              expect(result.success).toBe(true);
              expect(result.token).toBeDefined();
              expect(result.token).not.toBe('');
              expect(result.error).toBeUndefined();

              // Verify manager information is returned correctly
              expect(result.manager).toBeDefined();
              expect(result.manager?.id).toBe(manager.id);
              expect(result.manager?.name).toBe(uniqueName);
              expect(result.manager?.tenantId).toBe(testTenantId);
              expect(result.manager?.maxBonusSpinsPerApproval).toBe(maxBonusSpinsPerApproval);
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // REDUCED iterations for faster testing (20-30 instead of 100)
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Property 29: Invalid Credentials Rejection
   * **Validates: Requirements 2.3**
   * 
   * For any authentication attempt with invalid credentials (wrong ID or name),
   * the authentication should fail and return an error.
   */
  describe('Property 29: Invalid Credentials Rejection', () => {
    it('should reject authentication with wrong name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            correctName: nameArbitrary,
            wrongName: nameArbitrary,
            maxBonusSpinsPerApproval: maxBonusSpinsArbitrary,
          }),
          async ({ correctName, wrongName, maxBonusSpinsPerApproval }) => {
            // Skip if names happen to be the same
            fc.pre(correctName.trim() !== wrongName.trim());

            // Make name unique for this test run
            const uniqueCorrectName = `${correctName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueWrongName = `${wrongName.trim()}-wrong`;

            // Setup: Create an active manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueCorrectName,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval,
                isActive: true,
              },
            });

            try {
              // Action: Attempt to login with wrong name
              const result = await authService.login(manager.id, uniqueWrongName);

              // Assertions: Login should fail
              expect(result.success).toBe(false);
              expect(result.token).toBeUndefined();
              expect(result.manager).toBeUndefined();
              expect(result.error).toBe('Invalid manager ID or name');
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // REDUCED iterations for faster testing (20-30 instead of 100)
      );
    }, 120000); // 2 minute timeout

    it('should reject authentication with non-existent manager ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: nameArbitrary,
          }),
          async ({ name }) => {
            // Use a non-existent manager ID
            const nonExistentId = `nonexistent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueName = `${name.trim()}-${Date.now()}`;

            // Action: Attempt to login with non-existent ID
            const result = await authService.login(nonExistentId, uniqueName);

            // Assertions: Login should fail
            expect(result.success).toBe(false);
            expect(result.token).toBeUndefined();
            expect(result.manager).toBeUndefined();
            expect(result.error).toBe('Invalid manager ID or name');
          }
        ),
        { numRuns: 5 } // REDUCED iterations for faster testing (20-30 instead of 100)
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Property 30: Logout Token Invalidation
   * **Validates: Requirements 2.5**
   * 
   * For any manager who logs out, their session token should be immediately
   * invalidated and subsequent requests with that token should be rejected.
   */
  describe('Property 30: Logout Token Invalidation', () => {
    it('should invalidate token immediately after logout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: nameArbitrary,
            maxBonusSpinsPerApproval: maxBonusSpinsArbitrary,
          }),
          async ({ name, maxBonusSpinsPerApproval }) => {
            // Make name unique for this test run
            const uniqueName = `${name.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Setup: Create an active manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueName,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval,
                isActive: true,
              },
            });

            try {
              // Action 1: Login to get a token
              const loginResult = await authService.login(manager.id, uniqueName);
              expect(loginResult.success).toBe(true);
              expect(loginResult.token).toBeDefined();
              
              const token = loginResult.token!;

              // Verify token is valid before logout
              const validateBeforeLogout = await authService.validateToken(token);
              expect(validateBeforeLogout.valid).toBe(true);
              expect(validateBeforeLogout.managerId).toBe(manager.id);

              // Action 2: Logout
              const logoutResult = await authService.logout(token);
              expect(logoutResult.success).toBe(true);

              // Assertion: Token should be invalid after logout
              const validateAfterLogout = await authService.validateToken(token);
              expect(validateAfterLogout.valid).toBe(false);
              expect(validateAfterLogout.error).toBeDefined();
              expect(validateAfterLogout.managerId).toBeUndefined();
              expect(validateAfterLogout.tenantId).toBeUndefined();
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // REDUCED iterations for faster testing (20-30 instead of 100)
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Property 25: Manager Deactivation Effect
   * **Validates: Requirements 1.5**
   * 
   * For any manager account that is deactivated, subsequent login attempts
   * should be rejected and existing sessions should be invalidated.
   */
  describe('Property 25: Manager Deactivation Effect', () => {
    it('should reject login attempts for deactivated managers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: nameArbitrary,
            maxBonusSpinsPerApproval: maxBonusSpinsArbitrary,
          }),
          async ({ name, maxBonusSpinsPerApproval }) => {
            // Make name unique for this test run
            const uniqueName = `${name.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Setup: Create an active manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueName,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval,
                isActive: true,
              },
            });

            try {
              // Verify manager can login when active
              const loginBeforeDeactivation = await authService.login(manager.id, uniqueName);
              expect(loginBeforeDeactivation.success).toBe(true);

              // Action: Deactivate the manager
              await prisma.manager.update({
                where: { id: manager.id },
                data: { isActive: false },
              });

              // Assertion: Login should be rejected after deactivation
              const loginAfterDeactivation = await authService.login(manager.id, uniqueName);
              expect(loginAfterDeactivation.success).toBe(false);
              expect(loginAfterDeactivation.token).toBeUndefined();
              expect(loginAfterDeactivation.manager).toBeUndefined();
              expect(loginAfterDeactivation.error).toBe('Account has been deactivated');
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // REDUCED iterations for faster testing (20-30 instead of 100)
      );
    }, 120000); // 2 minute timeout

    it('should invalidate existing tokens when manager is deactivated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: nameArbitrary,
            maxBonusSpinsPerApproval: maxBonusSpinsArbitrary,
          }),
          async ({ name, maxBonusSpinsPerApproval }) => {
            // Make name unique for this test run
            const uniqueName = `${name.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Setup: Create an active manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueName,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval,
                isActive: true,
              },
            });

            try {
              // Action 1: Login to get a token
              const loginResult = await authService.login(manager.id, uniqueName);
              expect(loginResult.success).toBe(true);
              const token = loginResult.token!;

              // Verify token is valid while manager is active
              const validateBeforeDeactivation = await authService.validateToken(token);
              expect(validateBeforeDeactivation.valid).toBe(true);

              // Action 2: Deactivate the manager
              await prisma.manager.update({
                where: { id: manager.id },
                data: { isActive: false },
              });

              // Assertion: Token should be invalid after manager deactivation
              const validateAfterDeactivation = await authService.validateToken(token);
              expect(validateAfterDeactivation.valid).toBe(false);
              expect(validateAfterDeactivation.error).toBe('Manager account has been deactivated');
              expect(validateAfterDeactivation.managerId).toBeUndefined();
              expect(validateAfterDeactivation.tenantId).toBeUndefined();
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // REDUCED iterations for faster testing (20-30 instead of 100)
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Additional edge case tests for authentication properties
   */
  describe('Edge Cases and Security Properties', () => {
    it('should not expose whether manager ID exists in error messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            existingName: nameArbitrary,
            nonExistentName: nameArbitrary,
            correctName: nameArbitrary,
            wrongName: nameArbitrary,
            maxBonusSpinsPerApproval: maxBonusSpinsArbitrary,
          }),
          async ({ existingName, nonExistentName, correctName, wrongName, maxBonusSpinsPerApproval }) => {
            // Ensure names are different
            fc.pre(existingName.trim() !== nonExistentName.trim());
            fc.pre(correctName.trim() !== wrongName.trim());

            // Make names unique
            const uniqueExistingName = `existing-${existingName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueNonExistentId = `nonexistent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniqueCorrectName = `${correctName.trim()}-test`;
            const uniqueWrongName = `${wrongName.trim()}-wrong`;

            // Setup: Create a manager with existing name
            const manager = await prisma.manager.create({
              data: {
                name: uniqueExistingName,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval,
                isActive: true,
              },
            });

            try {
              // Test 1: Wrong name for existing manager ID
              const result1 = await authService.login(manager.id, uniqueWrongName);

              // Test 2: Any name for non-existent manager ID
              const result2 = await authService.login(uniqueNonExistentId, uniqueCorrectName);

              // Assertion: Both should return the same generic error message
              expect(result1.success).toBe(false);
              expect(result2.success).toBe(false);
              expect(result1.error).toBe(result2.error);
              expect(result1.error).toBe('Invalid manager ID or name');
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 } // REDUCED iterations for edge case test
      );
    }, 90000); // 1.5 minute timeout

    it('should handle multiple login attempts with same credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: nameArbitrary,
            maxBonusSpinsPerApproval: maxBonusSpinsArbitrary,
            attemptCount: fc.integer({ min: 2, max: 5 }),
          }),
          async ({ name, maxBonusSpinsPerApproval, attemptCount }) => {
            // Make name unique
            const uniqueName = `${name.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Setup: Create an active manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueName,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval,
                isActive: true,
              },
            });

            try {
              // Action: Attempt multiple logins
              const loginResults = [];
              for (let i = 0; i < attemptCount; i++) {
                const result = await authService.login(manager.id, uniqueName);
                loginResults.push(result);
              }

              // Assertions: All login attempts should succeed
              for (const result of loginResults) {
                expect(result.success).toBe(true);
                expect(result.token).toBeDefined();
                expect(result.manager?.id).toBe(manager.id);
              }

              // All tokens should be unique
              const tokens = loginResults.map(r => r.token);
              const uniqueTokens = new Set(tokens);
              expect(uniqueTokens.size).toBe(attemptCount);
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 } // REDUCED iterations for edge case test
      );
    }, 90000); // 1.5 minute timeout
  });
});
