/**
 * @jest-environment node
 * 
 * Property-Based Tests for Manager Verification Service
 * 
 * Tests universal properties using fast-check for randomized testing
 * Feature: manager-role-verification
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 8.2, 8.3
 */

import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import {
    approveTask,
    getPendingTasks,
    getTaskDetail,
    rejectTask
} from '../manager-verification-service';

const prisma = new PrismaClient();

/**
 * Arbitraries (generators) for property-based testing
 */

// Generate valid names (2-100 characters)
const nameArbitrary = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2);

// Generate phone numbers (10 digits)
const phoneArbitrary = fc.string({ minLength: 10, maxLength: 10 }).map(s => 
  '+1' + s.replace(/\D/g, '').padEnd(10, '0').slice(0, 10)
);

// Generate comments (10-500 characters)
const commentArbitrary = fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10);

// Generate bonus spins (1-50)
const bonusSpinsArbitrary = fc.integer({ min: 1, max: 50 });

// Generate max bonus spins per approval (1-50)
const maxBonusSpinsArbitrary = fc.integer({ min: 1, max: 50 });

// Generate task status
const taskStatusArbitrary = fc.constantFrom('PENDING', 'VERIFIED', 'REJECTED', 'FAILED');

/**
 * Property-Based Tests for Manager Verification Service
 */
describe('Manager Verification Service Property-Based Tests', () => {
  let testTenantId1: string;
  let testTenantId2: string;
  let testPlanId: string;
  let testCampaignId1: string;
  let testCampaignId2: string;

  beforeAll(async () => {
    // Create a test plan
    const existingPlan = await prisma.plan.findFirst({
      where: { name: 'Test Plan for Verification Tests' },
    });

    if (existingPlan) {
      testPlanId = existingPlan.id;
    } else {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan for Verification Tests',
          maxSpins: 1000,
          maxCampaigns: 10,
          campaignDurationDays: 30,
        },
      });
      testPlanId = plan.id;
    }

    // Create two test tenants for multi-tenant isolation tests
    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Test Tenant 1 for Verification',
        slug: 'test-tenant-verification-1-' + Date.now(),
        planId: testPlanId,
      },
    });
    testTenantId1 = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Test Tenant 2 for Verification',
        slug: 'test-tenant-verification-2-' + Date.now(),
        planId: testPlanId,
      },
    });
    testTenantId2 = tenant2.id;

    // Create test campaigns for each tenant
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const campaign1 = await prisma.campaign.create({
      data: {
        name: 'Test Campaign 1',
        tenantId: testTenantId1,
        isActive: true,
        startDate: now,
        endDate: futureDate,
      },
    });
    testCampaignId1 = campaign1.id;

    const campaign2 = await prisma.campaign.create({
      data: {
        name: 'Test Campaign 2',
        tenantId: testTenantId2,
        isActive: true,
        startDate: now,
        endDate: futureDate,
      },
    });
    testCampaignId2 = campaign2.id;
  });

  afterAll(async () => {
    // Cleanup: Delete all test data
    await prisma.managerAuditLog.deleteMany({
      where: { tenantId: { in: [testTenantId1, testTenantId2] } },
    });

    await prisma.socialTaskCompletion.deleteMany({
      where: {
        task: {
          campaignId: { in: [testCampaignId1, testCampaignId2] }
        }
      }
    });

    await prisma.socialMediaTask.deleteMany({
      where: { campaignId: { in: [testCampaignId1, testCampaignId2] } },
    });

    await prisma.spin.deleteMany({
      where: {
        campaign: {
          tenantId: { in: [testTenantId1, testTenantId2] }
        }
      }
    });

    await prisma.endUser.deleteMany({
      where: {
        tenantId: { in: [testTenantId1, testTenantId2] }
      }
    });

    await prisma.manager.deleteMany({
      where: { tenantId: { in: [testTenantId1, testTenantId2] } },
    });

    await prisma.campaign.deleteMany({
      where: { id: { in: [testCampaignId1, testCampaignId2] } },
    });

    await prisma.tenant.deleteMany({
      where: { id: { in: [testTenantId1, testTenantId2] } },
    });

    await prisma.$disconnect();
  });

  /**
   * Property 2: Multi-Tenant Isolation for Task Visibility
   * **Validates: Requirements 3.1, 3.3, 3.4, 8.1**
   * 
   * For any manager and set of task completions across multiple tenants,
   * querying pending tasks should return only tasks belonging to the manager's
   * tenant and only from customers who have spun at least once.
   */
  describe('Property 2: Multi-Tenant Isolation for Task Visibility', () => {
    it('should only return tasks from manager\'s tenant and eligible customers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
            customerPhone: phoneArbitrary,
            taskBonusSpins: bonusSpinsArbitrary,
          }),
          async ({ managerName, maxBonusSpins, customerPhone, taskBonusSpins }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager in tenant 1
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            // Create customer in tenant 1 with spin history
            const customer1 = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId1,
              },
            });

            // Create a spin for customer1 (makes them eligible)
            await prisma.spin.create({
              data: {
                userId: customer1.id,
                campaignId: testCampaignId1,
                },
            });

            // Create customer in tenant 2
            const customer2 = await prisma.endUser.create({
              data: {
                phone: uniquePhone + '2',
                tenantId: testTenantId2,
              },
            });

            // Create social media tasks
            const task1 = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId1,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                spinsReward: taskBonusSpins,
              },
            });

            const task2 = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId2,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test2',
                spinsReward: taskBonusSpins,
              },
            });

            // Create task completions
            const completion1 = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer1.id,
                taskId: task1.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            const completion2 = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer2.id,
                taskId: task2.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            try {
              // Action: Get pending tasks for manager in tenant 1
              const tasks = await getPendingTasks(manager.id);

              // Assertions: Should only see tasks from tenant 1
              expect(tasks.length).toBeGreaterThanOrEqual(1);
              
              // All tasks should be from tenant 1
              const taskIds = tasks.map(t => t.id);
              expect(taskIds).toContain(completion1.id);
              expect(taskIds).not.toContain(completion2.id);

              // All customers should have spin history
              for (const task of tasks) {
                const customer = await prisma.endUser.findUnique({
                  where: { id: task.customer.id },
                  include: { spins: true },
                });
                expect(customer?.spins.length).toBeGreaterThan(0);
              }
            } finally {
              // Cleanup
              await prisma.socialTaskCompletion.deleteMany({
                where: { id: { in: [completion1.id, completion2.id] } },
              });
              await prisma.socialMediaTask.deleteMany({
                where: { id: { in: [task1.id, task2.id] } },
              });
              await prisma.spin.deleteMany({
                where: { userId: customer1.id },
              });
              await prisma.endUser.deleteMany({
                where: { id: { in: [customer1.id, customer2.id] } },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 3: Data Minimization for Customer Information
   * **Validates: Requirements 3.2, 8.3**
   * 
   * For any task completion viewed by a manager, the returned customer data
   * should contain only customer ID and the last 4 digits of the phone number,
   * with no additional personal information exposed.
   */
  describe('Property 3: Data Minimization for Customer Information', () => {
    it('should only expose customer ID and phone last 4 digits', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
            customerPhone: phoneArbitrary,
            taskBonusSpins: bonusSpinsArbitrary,
          }),
          async ({ managerName, maxBonusSpins, customerPhone, taskBonusSpins }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            // Create customer with spin history
            const customer = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId1,
              },
            });

            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId1,
                },
            });

            // Create social media task
            const task = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId1,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                spinsReward: taskBonusSpins,
              },
            });

            const completion = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer.id,
                taskId: task.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            try {
              // Action: Get task detail
              const taskDetail = await getTaskDetail(manager.id, completion.id);

              // Assertions: Customer data should be minimized
              expect(taskDetail.customer).toBeDefined();
              expect(taskDetail.customer.id).toBe(customer.id);
              expect(taskDetail.customer.phoneLast4).toBe(uniquePhone.slice(-4));
              
              // Should not contain full phone number
              expect(taskDetail.customer).not.toHaveProperty('phone');
              expect(JSON.stringify(taskDetail)).not.toContain(uniquePhone.slice(0, -4));
            } finally {
              // Cleanup
              await prisma.socialTaskCompletion.delete({
                where: { id: completion.id },
              });
              await prisma.socialMediaTask.delete({
                where: { id: task.id },
              });
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 4: Task Status Filtering
   * **Validates: Requirements 3.6**
   * 
   * For any manager and status filter (PENDING, VERIFIED, REJECTED),
   * querying tasks with that filter should return only tasks matching
   * the specified status.
   */
  describe('Property 4: Task Status Filtering', () => {
    it('should only return tasks matching the specified status filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
            customerPhone: phoneArbitrary,
            taskBonusSpins: bonusSpinsArbitrary,
            filterStatus: taskStatusArbitrary,
          }),
          async ({ managerName, maxBonusSpins, customerPhone, taskBonusSpins, filterStatus }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            // Create customer with spin history
            const customer = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId1,
              },
            });

            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId1,
                },
            });

            // Create social media task
            const task = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId1,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                spinsReward: taskBonusSpins,
              },
            });

            // Create task completion with the filter status
            const completion = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer.id,
                taskId: task.id,
                status: filterStatus,
              },
            });

            try {
              // Action: Get tasks with status filter
              const tasks = await getPendingTasks(manager.id, { status: filterStatus });

              // Assertions: All returned tasks should match the filter status
              for (const t of tasks) {
                expect(t.status).toBe(filterStatus);
              }

              // Should include our test completion
              const taskIds = tasks.map(t => t.id);
              expect(taskIds).toContain(completion.id);
            } finally {
              // Cleanup
              await prisma.socialTaskCompletion.delete({
                where: { id: completion.id },
              });
              await prisma.socialMediaTask.delete({
                where: { id: task.id },
              });
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 5: Mandatory Comment Validation
   * **Validates: Requirements 4.2, 4.3**
   * 
   * For any approval or rejection attempt without a comment,
   * the system should reject the operation and return a validation error.
   */
  describe('Property 5: Mandatory Comment Validation', () => {
    it('should reject approval without comment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
          }),
          async ({ managerName, maxBonusSpins }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Setup: Create manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            try {
              // Action: Attempt approval with empty comment
              const result1 = await approveTask(manager.id, 'fake-task-id', '');
              const result2 = await approveTask(manager.id, 'fake-task-id', '   ');

              // Assertions: Both should fail with validation error
              expect(result1.success).toBe(false);
              expect(result1.error).toContain('Comment is required');
              
              expect(result2.success).toBe(false);
              expect(result2.error).toContain('Comment is required');
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 120000); // 2 minute timeout

    it('should reject rejection without comment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
          }),
          async ({ managerName, maxBonusSpins }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Setup: Create manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            try {
              // Action: Attempt rejection with empty comment
              const result = await rejectTask(manager.id, 'fake-task-id', '');

              // Assertions: Should fail with validation error
              expect(result.success).toBe(false);
              expect(result.error).toContain('Comment is required');
            } finally {
              // Cleanup
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Property 6: Task Approval Status Update
   * **Validates: Requirements 4.4**
   * 
   * For any pending task completion, when a manager approves it with a valid comment,
   * the task status should be updated to VERIFIED.
   */
  describe('Property 6: Task Approval Status Update', () => {
    it('should update task status to VERIFIED on approval', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
            customerPhone: phoneArbitrary,
            taskBonusSpins: bonusSpinsArbitrary,
            comment: commentArbitrary,
          }),
          async ({ managerName, maxBonusSpins, customerPhone, taskBonusSpins, comment }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            // Create customer with spin history
            const customer = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId1,
                },
            });

            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId1,
                },
            });

            // Create social media task
            const task = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId1,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                spinsReward: taskBonusSpins,
              },
            });

            const completion = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer.id,
                taskId: task.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            try {
              // Action: Approve task
              const result = await approveTask(manager.id, completion.id, comment);

              // Assertions: Should succeed
              expect(result.success).toBe(true);

              // Verify task status updated to VERIFIED
              const updatedCompletion = await prisma.socialTaskCompletion.findUnique({
                where: { id: completion.id },
              });
              expect(updatedCompletion?.status).toBe('VERIFIED');
              expect(updatedCompletion?.verifiedBy).toBe(manager.id);
              expect(updatedCompletion?.verificationComment).toBe(comment);
              expect(updatedCompletion?.verifiedAt).toBeDefined();
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { taskCompletionId: completion.id },
              });
              await prisma.socialTaskCompletion.delete({
                where: { id: completion.id },
              });
              await prisma.socialMediaTask.delete({
                where: { id: task.id },
              });
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 7: Task Rejection Status Update
   * **Validates: Requirements 4.5**
   * 
   * For any pending task completion, when a manager rejects it with a valid comment,
   * the task status should be updated to REJECTED.
   */
  describe('Property 7: Task Rejection Status Update', () => {
    it('should update task status to REJECTED on rejection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
            customerPhone: phoneArbitrary,
            taskBonusSpins: bonusSpinsArbitrary,
            comment: commentArbitrary,
          }),
          async ({ managerName, maxBonusSpins, customerPhone, taskBonusSpins, comment }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            // Create customer with spin history
            const customer = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId1,
              },
            });

            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId1,
                },
            });

            // Create social media task
            const task = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId1,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                spinsReward: taskBonusSpins,
              },
            });

            const completion = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer.id,
                taskId: task.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            try {
              // Action: Reject task
              const result = await rejectTask(manager.id, completion.id, comment);

              // Assertions: Should succeed
              expect(result.success).toBe(true);

              // Verify task status updated to REJECTED
              const updatedCompletion = await prisma.socialTaskCompletion.findUnique({
                where: { id: completion.id },
              });
              expect(updatedCompletion?.status).toBe('REJECTED');
              expect(updatedCompletion?.verifiedBy).toBe(manager.id);
              expect(updatedCompletion?.verificationComment).toBe(comment);
              expect(updatedCompletion?.verifiedAt).toBeDefined();
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { taskCompletionId: completion.id },
              });
              await prisma.socialTaskCompletion.delete({
                where: { id: completion.id },
              });
              await prisma.socialMediaTask.delete({
                where: { id: task.id },
              });
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 8: Bonus Spin Limit Enforcement
   * **Validates: Requirements 4.6, 4.7**
   * 
   * For any task approval where the configured bonus spins exceed the manager's
   * maxBonusSpinsPerApproval, the granted spins should be capped at the manager's
   * maximum limit.
   */
  describe('Property 8: Bonus Spin Limit Enforcement', () => {
    it('should cap bonus spins at manager\'s maxBonusSpinsPerApproval', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            managerMaxSpins: fc.integer({ min: 1, max: 10 }), // Manager limit is low
            taskBonusSpins: fc.integer({ min: 15, max: 50 }), // Task reward is higher
            customerPhone: phoneArbitrary,
            comment: commentArbitrary,
          }),
          async ({ managerName, managerMaxSpins, taskBonusSpins, customerPhone, comment }) => {
            // Ensure task spins exceed manager limit
            fc.pre(taskBonusSpins > managerMaxSpins);

            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager with low max spins
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: managerMaxSpins,
                isActive: true,
              },
            });

            // Create customer with spin history
            const customer = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId1,
                },
            });

            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId1,
                },
            });

            // Create social media task with high bonus spins
            const task = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId1,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                spinsReward: taskBonusSpins,
              },
            });

            const completion = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer.id,
                taskId: task.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            try {
              // Action: Approve task
              const result = await approveTask(manager.id, completion.id, comment);

              // Assertions: Bonus spins should be capped at manager's limit
              expect(result.success).toBe(true);
              expect(result.bonusSpinsGranted).toBe(managerMaxSpins);
              expect(result.bonusSpinsGranted).toBeLessThan(taskBonusSpins);

              // Verify audit log records capped amount
              const auditLog = await prisma.managerAuditLog.findFirst({
                where: { taskCompletionId: completion.id },
              });
              expect(auditLog?.bonusSpinsGranted).toBe(managerMaxSpins);
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { taskCompletionId: completion.id },
              });
              await prisma.socialTaskCompletion.delete({
                where: { id: completion.id },
              });
              await prisma.socialMediaTask.delete({
                where: { id: task.id },
              });
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 9: Idempotent Task Verification
   * **Validates: Requirements 4.8**
   * 
   * For any task completion that has already been verified, attempting to verify
   * it again should be rejected and return an error without modifying the task
   * or granting additional spins.
   */
  describe('Property 9: Idempotent Task Verification', () => {
    it('should reject duplicate approval attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
            customerPhone: phoneArbitrary,
            taskBonusSpins: bonusSpinsArbitrary,
            comment1: commentArbitrary,
            comment2: commentArbitrary,
          }),
          async ({ managerName, maxBonusSpins, customerPhone, taskBonusSpins, comment1, comment2 }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            // Create customer with spin history
            const customer = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId1,
                },
            });

            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId1,
                },
            });

            // Create social media task
            const task = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId1,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                spinsReward: taskBonusSpins,
              },
            });

            const completion = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer.id,
                taskId: task.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            try {
              // Action 1: First approval (should succeed)
              const result1 = await approveTask(manager.id, completion.id, comment1);
              expect(result1.success).toBe(true);

              // Get initial spin count
              const customerAfterFirst = await prisma.endUser.findUnique({
                where: { id: customer.id },
              });
              const initialSpinCount = customerAfterFirst?.availableSpins || 0;

              // Action 2: Second approval attempt (should fail)
              const result2 = await approveTask(manager.id, completion.id, comment2);

              // Assertions: Second approval should fail
              expect(result2.success).toBe(false);
              expect(result2.error).toContain('already been verified');

              // Verify task status unchanged
              const finalCompletion = await prisma.socialTaskCompletion.findUnique({
                where: { id: completion.id },
              });
              expect(finalCompletion?.status).toBe('VERIFIED');
              expect(finalCompletion?.verificationComment).toBe(comment1); // Original comment

              // Verify no additional spins granted
              const customerAfterSecond = await prisma.endUser.findUnique({
                where: { id: customer.id },
              });
              expect(customerAfterSecond?.availableSpins).toBe(initialSpinCount);

              // Verify only one audit log entry
              const auditLogs = await prisma.managerAuditLog.findMany({
                where: { taskCompletionId: completion.id },
              });
              expect(auditLogs.length).toBe(1);
            } finally {
              // Cleanup
              await prisma.managerAuditLog.deleteMany({
                where: { taskCompletionId: completion.id },
              });
              await prisma.socialTaskCompletion.delete({
                where: { id: completion.id },
              });
              await prisma.socialMediaTask.delete({
                where: { id: task.id },
              });
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 19: Cross-Tenant Access Prevention
   * **Validates: Requirements 8.2**
   * 
   * For any manager attempting to access a task completion from a different tenant,
   * the request should be rejected with an authorization error.
   */
  describe('Property 19: Cross-Tenant Access Prevention', () => {
    it('should reject cross-tenant task access', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
            customerPhone: phoneArbitrary,
            taskBonusSpins: bonusSpinsArbitrary,
            comment: commentArbitrary,
          }),
          async ({ managerName, maxBonusSpins, customerPhone, taskBonusSpins, comment }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager in tenant 1
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            // Create customer in tenant 2 (different tenant)
            const customer = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId2,
              },
            });

            // Create social media task in tenant 2
            const task = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId2,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                spinsReward: taskBonusSpins,
              },
            });

            const completion = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer.id,
                taskId: task.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            try {
              // Action 1: Attempt to get task detail from different tenant
              await expect(getTaskDetail(manager.id, completion.id))
                .rejects.toThrow('Access denied: task belongs to different tenant');

              // Action 2: Attempt to approve task from different tenant
              const approveResult = await approveTask(manager.id, completion.id, comment);
              expect(approveResult.success).toBe(false);
              expect(approveResult.error).toContain('Access denied: task belongs to different tenant');

              // Action 3: Attempt to reject task from different tenant
              const rejectResult = await rejectTask(manager.id, completion.id, comment);
              expect(rejectResult.success).toBe(false);
              expect(rejectResult.error).toContain('Access denied: task belongs to different tenant');

              // Verify task status unchanged
              const finalCompletion = await prisma.socialTaskCompletion.findUnique({
                where: { id: completion.id },
              });
              expect(finalCompletion?.status).toBe('PENDING');
              expect(finalCompletion?.verifiedBy).toBeNull();
            } finally {
              // Cleanup
              await prisma.socialTaskCompletion.delete({
                where: { id: completion.id },
              });
              await prisma.socialMediaTask.delete({
                where: { id: task.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 31: Task Detail Information Completeness
   * **Validates: Requirements 4.1**
   * 
   * For any task completion detail view, the response should include task type,
   * target URL, submission timestamp, minimal customer data, task requirements,
   * and configured bonus spins.
   */
  describe('Property 31: Task Detail Information Completeness', () => {
    it('should return complete task information', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            managerName: nameArbitrary,
            maxBonusSpins: maxBonusSpinsArbitrary,
            customerPhone: phoneArbitrary,
            taskBonusSpins: bonusSpinsArbitrary,
          }),
          async ({ managerName, maxBonusSpins, customerPhone, taskBonusSpins }) => {
            const uniqueManagerName = `${managerName.trim()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const uniquePhone = customerPhone + Math.random().toString(36).substring(7);

            // Setup: Create manager
            const manager = await prisma.manager.create({
              data: {
                name: uniqueManagerName,
                tenantId: testTenantId1,
                maxBonusSpinsPerApproval: maxBonusSpins,
                isActive: true,
              },
            });

            // Create customer with spin history
            const customer = await prisma.endUser.create({
              data: {
                phone: uniquePhone,
                tenantId: testTenantId1,
              },
            });

            await prisma.spin.create({
              data: {
                userId: customer.id,
                campaignId: testCampaignId1,
                },
            });

            // Create social media task
            const task = await prisma.socialMediaTask.create({
              data: {
                campaignId: testCampaignId1,
                platform: 'Instagram',
                actionType: 'FOLLOW',
                title: 'Follow us on Instagram',
                targetUrl: 'https://instagram.com/test',
                description: 'Follow our Instagram account',
                spinsReward: taskBonusSpins,
              },
            });

            const completion = await prisma.socialTaskCompletion.create({
              data: {
                userId: customer.id,
                taskId: task.id,
                status: 'PENDING',
                spinsAwarded: 0,
              },
            });

            try {
              // Action: Get task detail
              const taskDetail = await getTaskDetail(manager.id, completion.id);

              // Assertions: All required fields should be present
              expect(taskDetail.id).toBe(completion.id);
              expect(taskDetail.taskType).toBe('Instagram - FOLLOW');
              expect(taskDetail.targetUrl).toBe('https://instagram.com/test');
              expect(taskDetail.submittedAt).toBeDefined();
              expect(taskDetail.status).toBe('PENDING');
              
              // Customer data (minimal)
              expect(taskDetail.customer).toBeDefined();
              expect(taskDetail.customer.id).toBe(customer.id);
              expect(taskDetail.customer.phoneLast4).toBe(uniquePhone.slice(-4));
              
              // Task requirements
              expect(taskDetail.task).toBeDefined();
              expect(taskDetail.task.bonusSpins).toBe(taskBonusSpins);
              expect(taskDetail.task.description).toBe('Follow our Instagram account');
            } finally {
              // Cleanup
              await prisma.socialTaskCompletion.delete({
                where: { id: completion.id },
              });
              await prisma.socialMediaTask.delete({
                where: { id: task.id },
              });
              await prisma.spin.deleteMany({
                where: { userId: customer.id },
              });
              await prisma.endUser.delete({
                where: { id: customer.id },
              });
              await prisma.manager.delete({
                where: { id: manager.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 180000); // 3 minute timeout
  });
});




