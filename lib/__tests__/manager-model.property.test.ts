/**
 * @jest-environment node
 * 
 * Property-Based Tests for Manager Model Creation
 * 
 * Tests universal properties using fast-check for randomized testing
 * Feature: manager-role-verification
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fc from 'fast-check';

const prisma = new PrismaClient();

/**
 * Feature: manager-role-verification, Property 1: Manager Creation with Tenant Association
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * For any tenant and valid manager data (email, name, password, maxBonusSpinsPerApproval),
 * creating a manager account should result in a Manager record that is associated with the
 * correct tenant and has all required fields persisted.
 */
describe('Manager Model Property-Based Tests', () => {
  let testTenantId: string;
  let testPlanId: string;

  beforeAll(async () => {
    // Create a test plan if it doesn't exist
    const existingPlan = await prisma.plan.findFirst({
      where: { name: 'Test Plan for Manager Tests' },
    });

    if (existingPlan) {
      testPlanId = existingPlan.id;
    } else {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan for Manager Tests',
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
        name: 'Test Tenant for Manager Tests',
        slug: 'test-tenant-manager-' + Date.now(),
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

  describe('Property 1: Manager Creation with Tenant Association', () => {
    it('should create manager with correct tenant association and all required fields persisted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 2, maxLength: 100 }),
            password: fc.string({ minLength: 8, maxLength: 50 }),
            maxBonusSpinsPerApproval: fc.integer({ min: 1, max: 50 }),
          }),
          async ({ email, name, password, maxBonusSpinsPerApproval }) => {
            // Make email unique for this test run
            const uniqueEmail = `${email}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            
            // Hash the password
            const passwordHash = await bcrypt.hash(password, 10);

            // Action: Create manager
            const manager = await prisma.manager.create({
              data: {
                email: uniqueEmail,
                name,
                passwordHash,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval,
              },
            });

            try {
              // Assertions: Verify all required fields are persisted correctly
              expect(manager).toBeDefined();
              expect(manager.id).toBeDefined();
              expect(manager.email).toBe(uniqueEmail);
              expect(manager.name).toBe(name);
              expect(manager.passwordHash).toBeDefined();
              expect(manager.passwordHash).not.toBe(password); // Password should be hashed
              expect(manager.tenantId).toBe(testTenantId);
              expect(manager.maxBonusSpinsPerApproval).toBe(maxBonusSpinsPerApproval);
              expect(manager.isActive).toBe(true); // Default value
              expect(manager.createdAt).toBeInstanceOf(Date);
              expect(manager.updatedAt).toBeInstanceOf(Date);

              // Verify tenant association by fetching manager with tenant
              const managerWithTenant = await prisma.manager.findUnique({
                where: { id: manager.id },
                include: { tenant: true },
              });

              expect(managerWithTenant).toBeDefined();
              expect(managerWithTenant?.tenant).toBeDefined();
              expect(managerWithTenant?.tenant.id).toBe(testTenantId);

              // Verify password can be validated
              const isPasswordValid = await bcrypt.compare(password, manager.passwordHash);
              expect(isPasswordValid).toBe(true);
            } finally {
              // Cleanup this specific manager
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {
                // Ignore if already deleted
              });
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified (minimum requirement)
      );
    }, 300000); // 5 minute timeout for property test with 100 iterations

    it('should enforce email uniqueness constraint', async () => {
      const uniqueEmail = `test-unique-${Date.now()}@example.com`;
      const passwordHash = await bcrypt.hash('password123', 10);

      // Create first manager
      const manager1 = await prisma.manager.create({
        data: {
          email: uniqueEmail,
          name: 'Manager 1',
          passwordHash,
          tenantId: testTenantId,
          maxBonusSpinsPerApproval: 10,
        },
      });

      try {
        // Attempt to create second manager with same email should fail
        await expect(
          prisma.manager.create({
            data: {
              email: uniqueEmail,
              name: 'Manager 2',
              passwordHash,
              tenantId: testTenantId,
              maxBonusSpinsPerApproval: 10,
            },
          })
        ).rejects.toThrow();
      } finally {
        // Cleanup
        await prisma.manager.delete({
          where: { id: manager1.id },
        }).catch(() => {});
      }
    });

    it('should maintain tenant association integrity across multiple tenants', async () => {
      // Create a second tenant
      const tenant2 = await prisma.tenant.create({
        data: {
          name: 'Test Tenant 2 for Manager Tests',
          slug: 'test-tenant-2-manager-' + Date.now(),
          planId: testPlanId,
        },
      });

      try {
        const passwordHash = await bcrypt.hash('password123', 10);
        const timestamp = Date.now();

        // Create manager associated with tenant1
        const manager1 = await prisma.manager.create({
          data: {
            email: `manager1-${timestamp}@example.com`,
            name: 'Manager 1',
            passwordHash,
            tenantId: testTenantId,
            maxBonusSpinsPerApproval: 10,
          },
        });

        // Create manager associated with tenant2
        const manager2 = await prisma.manager.create({
          data: {
            email: `manager2-${timestamp}@example.com`,
            name: 'Manager 2',
            passwordHash,
            tenantId: tenant2.id,
            maxBonusSpinsPerApproval: 15,
          },
        });

        try {
          // Verify manager1 is associated with testTenantId, not tenant2
          expect(manager1.tenantId).toBe(testTenantId);
          expect(manager1.tenantId).not.toBe(tenant2.id);

          // Verify manager2 is associated with tenant2, not testTenantId
          expect(manager2.tenantId).toBe(tenant2.id);
          expect(manager2.tenantId).not.toBe(testTenantId);

          // Verify we can query managers by tenant
          const tenant1Managers = await prisma.manager.findMany({
            where: { tenantId: testTenantId },
          });
          
          const tenant2Managers = await prisma.manager.findMany({
            where: { tenantId: tenant2.id },
          });

          expect(tenant1Managers.some(m => m.id === manager1.id)).toBe(true);
          expect(tenant1Managers.some(m => m.id === manager2.id)).toBe(false);
          
          expect(tenant2Managers.some(m => m.id === manager2.id)).toBe(true);
          expect(tenant2Managers.some(m => m.id === manager1.id)).toBe(false);
        } finally {
          // Cleanup managers
          await prisma.manager.delete({ where: { id: manager1.id } }).catch(() => {});
          await prisma.manager.delete({ where: { id: manager2.id } }).catch(() => {});
        }
      } finally {
        // Cleanup tenant2
        await prisma.tenant.delete({ where: { id: tenant2.id } }).catch(() => {});
      }
    });

    it('should persist maxBonusSpinsPerApproval with correct default value', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      const timestamp = Date.now();

      // Create manager without specifying maxBonusSpinsPerApproval
      const manager = await prisma.manager.create({
        data: {
          email: `manager-default-${timestamp}@example.com`,
          name: 'Manager Default',
          passwordHash,
          tenantId: testTenantId,
          // maxBonusSpinsPerApproval not specified, should use default
        },
      });

      try {
        // Verify default value is 10 (as per schema)
        expect(manager.maxBonusSpinsPerApproval).toBe(10);
      } finally {
        // Cleanup
        await prisma.manager.delete({ where: { id: manager.id } }).catch(() => {});
      }
    });

    it('should allow updating maxBonusSpinsPerApproval', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            initialLimit: fc.integer({ min: 1, max: 50 }),
            newLimit: fc.integer({ min: 1, max: 50 }),
          }),
          async ({ initialLimit, newLimit }) => {
            const passwordHash = await bcrypt.hash('password123', 10);
            const uniqueEmail = `manager-update-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

            // Create manager with initial limit
            const manager = await prisma.manager.create({
              data: {
                email: uniqueEmail,
                name: 'Manager Update Test',
                passwordHash,
                tenantId: testTenantId,
                maxBonusSpinsPerApproval: initialLimit,
              },
            });

            try {
              // Verify initial limit
              expect(manager.maxBonusSpinsPerApproval).toBe(initialLimit);

              // Update the limit
              const updatedManager = await prisma.manager.update({
                where: { id: manager.id },
                data: { maxBonusSpinsPerApproval: newLimit },
              });

              // Verify new limit is persisted
              expect(updatedManager.maxBonusSpinsPerApproval).toBe(newLimit);

              // Verify tenant association is preserved
              expect(updatedManager.tenantId).toBe(testTenantId);
            } finally {
              // Cleanup
              await prisma.manager.delete({ where: { id: manager.id } }).catch(() => {});
            }
          }
        ),
        { numRuns: 20 } // Reduced iterations for update test
      );
    }, 60000); // 1 minute timeout
  });
});
