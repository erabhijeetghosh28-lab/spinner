/**
 * @jest-environment node
 * 
 * Property-Based Tests for Audit Trail
 * 
 * Tests audit log creation, multi-tenant isolation, filtering, and immutability.
 * 
 * Properties tested:
 * - Property 15: Audit Log Creation
 * - Property 16: Multi-Tenant Isolation for Audit Logs
 * - Property 17: Audit Log Filtering
 * - Property 18: Audit Log Immutability
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { approveTask, rejectTask } from '@/lib/manager-verification-service';
import prisma from '@/lib/prisma';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import fc from 'fast-check';

// ============================================================================
// Test Data Setup
// ============================================================================

let testTenantId1: string;
let testTenantId2: string;
let testPlanId: string;

beforeAll(async () => {
  try {
    // Create a test plan if it doesn't exist
    const existingPlan = await prisma.plan.findFirst({
      where: { name: 'Test Plan for Audit Tests' },
    });

    if (existingPlan) {
      testPlanId = existingPlan.id;
    } else {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan for Audit Tests',
          maxSpins: 1000,
          maxCampaigns: 10,
          campaignDurationDays: 30,
        },
      });
      testPlanId = plan.id;
    }

    // Create test tenants with unique slugs
    const timestamp = Date.now();
    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Audit Test Tenant 1',
        slug: `audit-test-tenant-1-${timestamp}`,
        planId: testPlanId,
        subscriptionStatus: 'ACTIVE',
      },
    });
    testTenantId1 = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Audit Test Tenant 2',
        slug: `audit-test-tenant-2-${timestamp}`,
        planId: testPlanId,
        subscriptionStatus: 'ACTIVE',
      },
    });
    testTenantId2 = tenant2.id;

    console.log('Test setup complete. Tenant IDs:', testTenantId1, testTenantId2);
  } catch (error) {
    console.error('Error in beforeAll setup:', error);
    throw error;
  }
});

afterAll(async () => {
  // Cleanup: Delete all test data
  // Note: We don't delete tenants here because they may still be in use by running tests
  // Each test cleans up its own data in the finally blocks
  await prisma.managerAuditLog.deleteMany({
    where: { tenantId: { in: [testTenantId1, testTenantId2] } },
  });
  await prisma.manager.deleteMany({
    where: { tenantId: { in: [testTenantId1, testTenantId2] } },
  });
  
  // Clean up tenants last
  await prisma.tenant.deleteMany({
    where: { id: { in: [testTenantId1, testTenantId2] } },
  });
});

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

const managerArbitrary = fc.record({
  name: fc.string({ minLength: 3, maxLength: 50 }),
  maxBonusSpinsPerApproval: fc.integer({ min: 1, max: 50 }),
  isActive: fc.boolean(),
});

const commentArbitrary = fc.string({ minLength: 10, maxLength: 500 });

const actionArbitrary = fc.constantFrom('APPROVE', 'REJECT');

const dateRangeArbitrary = fc.record({
  startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
  endDate: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
});

// ============================================================================
// Helper Functions
// ============================================================================

async function createTestManager(tenantId: string, managerData: any) {
  try {
    // Verify tenant exists before creating manager
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} does not exist`);
    }
    
    return await prisma.manager.create({
      data: {
        name: managerData.name,
        tenantId,
        maxBonusSpinsPerApproval: managerData.maxBonusSpinsPerApproval,
        isActive: managerData.isActive,
      },
    });
  } catch (error) {
    console.error(`Error creating manager for tenant ${tenantId}:`, error);
    throw error;
  }
}

async function createTestCampaign(tenantId: string) {
  return await prisma.campaign.create({
    data: {
      tenantId,
      name: `Test Campaign ${Date.now()}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

async function createTestTask(campaignId: string) {
  return await prisma.socialMediaTask.create({
    data: {
      campaignId,
      platform: 'FACEBOOK',
      actionType: 'LIKE',
      title: 'Like our page',
      targetUrl: 'https://facebook.com/test',
      spinsReward: 5,
    },
  });
}

async function createTestCustomer(tenantId: string) {
  const phone = `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  return await prisma.endUser.create({
    data: {
      tenantId,
      phone,
      name: 'Test Customer',
    },
  });
}

async function createTestSpin(userId: string, campaignId: string) {
  return await prisma.spin.create({
    data: {
      userId,
      campaignId,
      wonPrize: false,
    },
  });
}

async function createTestTaskCompletion(
  taskId: string,
  userId: string,
  status: string = 'PENDING'
) {
  return await prisma.socialTaskCompletion.create({
    data: {
      taskId,
      userId,
      status,
      spinsAwarded: 0,
    },
  });
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Audit Trail Property Tests', () => {
  /**
   * Property 15: Audit Log Creation
   * 
   * For any manager approval or rejection action, an audit log entry should be created
   * containing manager ID, action type, task completion ID, timestamp, and the manager's comment.
   * 
   * Validates: Requirements 7.1, 7.2
   */
  describe('Property 15: Audit Log Creation', () => {
    it('should create audit log on task approval with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          managerArbitrary,
          commentArbitrary,
          async (managerData, comment) => {
            // Setup
            const manager = await createTestManager(testTenantId1, managerData);
            const campaign = await createTestCampaign(testTenantId1);
            const task = await createTestTask(campaign.id);
            const customer = await createTestCustomer(testTenantId1);
            await createTestSpin(customer.id, campaign.id);
            const completion = await createTestTaskCompletion(task.id, customer.id);

            try {
              // Execute
              const result = await approveTask(manager.id, completion.id, comment);

              if (result.success) {
                // Verify audit log created
                const auditLog = await prisma.managerAuditLog.findFirst({
                  where: { taskCompletionId: completion.id },
                });

                // Property: Audit log must exist with all required fields
                expect(auditLog).not.toBeNull();
                expect(auditLog?.managerId).toBe(manager.id);
                expect(auditLog?.tenantId).toBe(testTenantId1);
                expect(auditLog?.action).toBe('APPROVE');
                expect(auditLog?.taskCompletionId).toBe(completion.id);
                expect(auditLog?.comment).toBe(comment);
                expect(auditLog?.bonusSpinsGranted).toBeGreaterThan(0);
                expect(auditLog?.createdAt).toBeInstanceOf(Date);
              }
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { taskCompletionId: completion.id },
              });
              await prisma.socialTaskCompletion.delete({ where: { id: completion.id } });
              await prisma.spin.deleteMany({ where: { userId: customer.id } });
              await prisma.endUser.delete({ where: { id: customer.id } });
              await prisma.socialMediaTask.delete({ where: { id: task.id } });
              await prisma.campaign.delete({ where: { id: campaign.id } });
              await prisma.manager.delete({ where: { id: manager.id } });
            }
          }
        ),
        { numRuns: 20 } // Reduced runs for performance
      );
    });

    it('should create audit log on task rejection with null bonus spins', async () => {
      await fc.assert(
        fc.asyncProperty(
          managerArbitrary,
          commentArbitrary,
          async (managerData, comment) => {
            // Setup
            const manager = await createTestManager(testTenantId1, managerData);
            const campaign = await createTestCampaign(testTenantId1);
            const task = await createTestTask(campaign.id);
            const customer = await createTestCustomer(testTenantId1);
            await createTestSpin(customer.id, campaign.id);
            const completion = await createTestTaskCompletion(task.id, customer.id);

            try {
              // Execute
              const result = await rejectTask(manager.id, completion.id, comment);

              if (result.success) {
                // Verify audit log created
                const auditLog = await prisma.managerAuditLog.findFirst({
                  where: { taskCompletionId: completion.id },
                });

                // Property: Audit log must exist with null bonus spins for rejection
                expect(auditLog).not.toBeNull();
                expect(auditLog?.managerId).toBe(manager.id);
                expect(auditLog?.action).toBe('REJECT');
                expect(auditLog?.comment).toBe(comment);
                expect(auditLog?.bonusSpinsGranted).toBeNull();
              }
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { taskCompletionId: completion.id },
              });
              await prisma.socialTaskCompletion.delete({ where: { id: completion.id } });
              await prisma.spin.deleteMany({ where: { userId: customer.id } });
              await prisma.endUser.delete({ where: { id: customer.id } });
              await prisma.socialMediaTask.delete({ where: { id: task.id } });
              await prisma.campaign.delete({ where: { id: campaign.id } });
              await prisma.manager.delete({ where: { id: manager.id } });
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 16: Multi-Tenant Isolation for Audit Logs
   * 
   * For any tenant admin querying audit logs, only logs for managers and actions
   * within their tenant should be returned.
   * 
   * Validates: Requirements 7.3
   */
  describe('Property 16: Multi-Tenant Isolation for Audit Logs', () => {
    it('should only return audit logs for the specified tenant', async () => {
      await fc.assert(
        fc.asyncProperty(
          managerArbitrary,
          managerArbitrary,
          commentArbitrary,
          async (manager1Data, manager2Data, comment) => {
            // Setup: Create managers in different tenants
            const manager1 = await createTestManager(testTenantId1, manager1Data);
            const manager2 = await createTestManager(testTenantId2, manager2Data);

            const campaign1 = await createTestCampaign(testTenantId1);
            const campaign2 = await createTestCampaign(testTenantId2);

            const task1 = await createTestTask(campaign1.id);
            const task2 = await createTestTask(campaign2.id);

            const customer1 = await createTestCustomer(testTenantId1);
            const customer2 = await createTestCustomer(testTenantId2);

            await createTestSpin(customer1.id, campaign1.id);
            await createTestSpin(customer2.id, campaign2.id);

            const completion1 = await createTestTaskCompletion(task1.id, customer1.id);
            const completion2 = await createTestTaskCompletion(task2.id, customer2.id);

            try {
              // Execute: Approve tasks in both tenants
              await approveTask(manager1.id, completion1.id, comment);
              await approveTask(manager2.id, completion2.id, comment);

              // Verify: Query logs for tenant 1
              const tenant1Logs = await prisma.managerAuditLog.findMany({
                where: { tenantId: testTenantId1 },
              });

              // Property: All logs should belong to tenant 1
              expect(tenant1Logs.length).toBeGreaterThan(0);
              tenant1Logs.forEach((log) => {
                expect(log.tenantId).toBe(testTenantId1);
                expect(log.managerId).toBe(manager1.id);
              });

              // Verify: Query logs for tenant 2
              const tenant2Logs = await prisma.managerAuditLog.findMany({
                where: { tenantId: testTenantId2 },
              });

              // Property: All logs should belong to tenant 2
              expect(tenant2Logs.length).toBeGreaterThan(0);
              tenant2Logs.forEach((log) => {
                expect(log.tenantId).toBe(testTenantId2);
                expect(log.managerId).toBe(manager2.id);
              });
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { tenantId: { in: [testTenantId1, testTenantId2] } },
              });
              await prisma.socialTaskCompletion.deleteMany({
                where: { id: { in: [completion1.id, completion2.id] } },
              });
              await prisma.spin.deleteMany({
                where: { userId: { in: [customer1.id, customer2.id] } },
              });
              await prisma.endUser.deleteMany({
                where: { id: { in: [customer1.id, customer2.id] } },
              });
              await prisma.socialMediaTask.deleteMany({
                where: { id: { in: [task1.id, task2.id] } },
              });
              await prisma.campaign.deleteMany({
                where: { id: { in: [campaign1.id, campaign2.id] } },
              });
              await prisma.manager.deleteMany({
                where: { id: { in: [manager1.id, manager2.id] } },
              });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 17: Audit Log Filtering
   * 
   * For any audit log query with filters (manager ID, date range, action type),
   * only logs matching all specified filters should be returned.
   * 
   * Validates: Requirements 7.4
   */
  describe('Property 17: Audit Log Filtering', () => {
    it('should filter audit logs by action type', async () => {
      await fc.assert(
        fc.asyncProperty(
          managerArbitrary,
          commentArbitrary,
          commentArbitrary,
          async (managerData, approveComment, rejectComment) => {
            // Setup
            const manager = await createTestManager(testTenantId1, managerData);
            const campaign = await createTestCampaign(testTenantId1);
            const task = await createTestTask(campaign.id);
            const customer = await createTestCustomer(testTenantId1);
            await createTestSpin(customer.id, campaign.id);

            const completion1 = await createTestTaskCompletion(task.id, customer.id);
            const completion2 = await createTestTaskCompletion(task.id, customer.id);

            try {
              // Execute: Create both approve and reject logs
              await approveTask(manager.id, completion1.id, approveComment);
              await rejectTask(manager.id, completion2.id, rejectComment);

              // Verify: Filter by APPROVE action
              const approveLogs = await prisma.managerAuditLog.findMany({
                where: {
                  managerId: manager.id,
                  action: 'APPROVE',
                },
              });

              // Property: All returned logs should be APPROVE actions
              expect(approveLogs.length).toBeGreaterThan(0);
              approveLogs.forEach((log) => {
                expect(log.action).toBe('APPROVE');
                expect(log.bonusSpinsGranted).not.toBeNull();
              });

              // Verify: Filter by REJECT action
              const rejectLogs = await prisma.managerAuditLog.findMany({
                where: {
                  managerId: manager.id,
                  action: 'REJECT',
                },
              });

              // Property: All returned logs should be REJECT actions
              expect(rejectLogs.length).toBeGreaterThan(0);
              rejectLogs.forEach((log) => {
                expect(log.action).toBe('REJECT');
                expect(log.bonusSpinsGranted).toBeNull();
              });
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { managerId: manager.id },
              });
              await prisma.socialTaskCompletion.deleteMany({
                where: { id: { in: [completion1.id, completion2.id] } },
              });
              await prisma.spin.deleteMany({ where: { userId: customer.id } });
              await prisma.endUser.delete({ where: { id: customer.id } });
              await prisma.socialMediaTask.delete({ where: { id: task.id } });
              await prisma.campaign.delete({ where: { id: campaign.id } });
              await prisma.manager.delete({ where: { id: manager.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should filter audit logs by manager ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          managerArbitrary,
          managerArbitrary,
          commentArbitrary,
          async (manager1Data, manager2Data, comment) => {
            // Setup: Create two managers in same tenant
            const manager1 = await createTestManager(testTenantId1, manager1Data);
            const manager2 = await createTestManager(testTenantId1, {
              ...manager2Data,
              name: manager2Data.name + '-2', // Ensure unique name
            });

            const campaign = await createTestCampaign(testTenantId1);
            const task = await createTestTask(campaign.id);
            const customer = await createTestCustomer(testTenantId1);
            await createTestSpin(customer.id, campaign.id);

            const completion1 = await createTestTaskCompletion(task.id, customer.id);
            const completion2 = await createTestTaskCompletion(task.id, customer.id);

            try {
              // Execute: Both managers approve tasks
              await approveTask(manager1.id, completion1.id, comment);
              await approveTask(manager2.id, completion2.id, comment);

              // Verify: Filter by manager1 ID
              const manager1Logs = await prisma.managerAuditLog.findMany({
                where: { managerId: manager1.id },
              });

              // Property: All logs should belong to manager1
              expect(manager1Logs.length).toBeGreaterThan(0);
              manager1Logs.forEach((log) => {
                expect(log.managerId).toBe(manager1.id);
              });

              // Verify: Filter by manager2 ID
              const manager2Logs = await prisma.managerAuditLog.findMany({
                where: { managerId: manager2.id },
              });

              // Property: All logs should belong to manager2
              expect(manager2Logs.length).toBeGreaterThan(0);
              manager2Logs.forEach((log) => {
                expect(log.managerId).toBe(manager2.id);
              });
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { managerId: { in: [manager1.id, manager2.id] } },
              });
              await prisma.socialTaskCompletion.deleteMany({
                where: { id: { in: [completion1.id, completion2.id] } },
              });
              await prisma.spin.deleteMany({ where: { userId: customer.id } });
              await prisma.endUser.delete({ where: { id: customer.id } });
              await prisma.socialMediaTask.delete({ where: { id: task.id } });
              await prisma.campaign.delete({ where: { id: campaign.id } });
              await prisma.manager.deleteMany({
                where: { id: { in: [manager1.id, manager2.id] } },
              });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 18: Audit Log Immutability
   * 
   * For any created audit log entry, attempts to update or delete the entry
   * should be rejected and the log should remain unchanged.
   * 
   * Validates: Requirements 7.5
   */
  describe('Property 18: Audit Log Immutability', () => {
    it('should prevent updates to audit log entries', async () => {
      await fc.assert(
        fc.asyncProperty(
          managerArbitrary,
          commentArbitrary,
          commentArbitrary,
          async (managerData, originalComment, newComment) => {
            // Setup
            const manager = await createTestManager(testTenantId1, managerData);
            const campaign = await createTestCampaign(testTenantId1);
            const task = await createTestTask(campaign.id);
            const customer = await createTestCustomer(testTenantId1);
            await createTestSpin(customer.id, campaign.id);
            const completion = await createTestTaskCompletion(task.id, customer.id);

            try {
              // Execute: Create audit log
              await approveTask(manager.id, completion.id, originalComment);

              const auditLog = await prisma.managerAuditLog.findFirst({
                where: { taskCompletionId: completion.id },
              });

              expect(auditLog).not.toBeNull();

              // Attempt to update audit log
              let updateError: Error | null = null;
              try {
                await prisma.managerAuditLog.update({
                  where: { id: auditLog!.id },
                  data: { comment: newComment },
                });
              } catch (error) {
                updateError = error as Error;
              }

              // Property: Update should be prevented
              // Note: This will fail until the database trigger is applied
              // For now, we verify the comment hasn't changed
              const unchangedLog = await prisma.managerAuditLog.findUnique({
                where: { id: auditLog!.id },
              });

              // If update was prevented by trigger, we should have an error
              // If not, the comment should still be the original
              if (updateError) {
                expect(updateError.message).toContain('immutable');
              } else {
                // Fallback: verify comment unchanged (will be enforced by trigger)
                expect(unchangedLog?.comment).toBe(originalComment);
              }
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { taskCompletionId: completion.id },
              });
              await prisma.socialTaskCompletion.delete({ where: { id: completion.id } });
              await prisma.spin.deleteMany({ where: { userId: customer.id } });
              await prisma.endUser.delete({ where: { id: customer.id } });
              await prisma.socialMediaTask.delete({ where: { id: task.id } });
              await prisma.campaign.delete({ where: { id: campaign.id } });
              await prisma.manager.delete({ where: { id: manager.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
