/**
 * Unit tests for ManagerVerificationService
 * 
 * Tests specific examples, edge cases, and error conditions for:
 * - getPendingTasks: Task visibility with tenant isolation and customer eligibility
 * - getTaskDetail: Task detail retrieval with access validation
 * - approveTask: Task approval with validation, spin capping, and audit logging
 * - rejectTask: Task rejection with validation and audit logging
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.1, 7.2, 8.2, 8.3
 */


// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    manager: {
      findUnique: jest.fn(),
    },
    socialTaskCompletion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    socialMediaTask: {
      findUnique: jest.fn(),
    },
    managerAuditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock the bonus spin service
jest.mock('@/lib/bonus-spin-service', () => ({
  grantBonusSpins: jest.fn(),
  sendApprovalNotification: jest.fn(),
  sendRejectionNotification: jest.fn(),
}));

import * as bonusSpinService from '@/lib/bonus-spin-service';
import {
    approveTask,
    getPendingTasks,
    getTaskDetail,
    rejectTask
} from '@/lib/manager-verification-service';
import prisma from '@/lib/prisma';

describe('ManagerVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPendingTasks', () => {
    it('should return tasks only from manager\'s tenant', async () => {
      // This test validates Requirement 3.3: Multi-tenant isolation
      const managerId = 'manager-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findMany as jest.Mock).mockResolvedValue([]);

      await getPendingTasks(managerId);

      // Verify query filters by tenant
      expect(prisma.socialTaskCompletion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            task: expect.objectContaining({
              campaign: expect.objectContaining({
                tenantId
              })
            })
          })
        })
      );
    });

    it('should only return tasks from customers who have spun at least once', async () => {
      // This test validates Requirement 3.4: Customer eligibility
      const managerId = 'manager-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findMany as jest.Mock).mockResolvedValue([]);

      await getPendingTasks(managerId);

      // Verify query filters for customers with spins
      expect(prisma.socialTaskCompletion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              spins: {
                some: {}
              }
            })
          })
        })
      );
    });

    it('should return minimal customer data (ID and phone last 4 digits)', async () => {
      // This test validates Requirement 3.2: Data minimization
      const managerId = 'manager-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletions = [
        {
          id: 'task-1',
          taskId: 'social-task-1',
          userId: 'user-1',
          status: 'PENDING',
          claimedAt: new Date(),
          user: {
            id: 'user-1',
            phone: '+1234567890'
          },
          task: {
            id: 'social-task-1',
            actionType: 'FOLLOW',
            platform: 'Instagram',
            targetUrl: 'https://instagram.com/test'
          }
        }
      ];

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findMany as jest.Mock).mockResolvedValue(mockTaskCompletions);

      const result = await getPendingTasks(managerId);

      expect(result).toHaveLength(1);
      expect(result[0].customer).toEqual({
        id: 'user-1',
        phoneLast4: '7890' // Only last 4 digits
      });
    });

    it('should filter by status when provided', async () => {
      // This test validates Requirement 3.6: Status filtering
      const managerId = 'manager-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findMany as jest.Mock).mockResolvedValue([]);

      await getPendingTasks(managerId, { status: 'VERIFIED' });

      expect(prisma.socialTaskCompletion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'VERIFIED'
          })
        })
      );
    });

    it('should throw error if manager not found', async () => {
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getPendingTasks('invalid-manager')).rejects.toThrow('Manager not found');
    });

    it('should throw error if manager is inactive', async () => {
      const mockManager = {
        id: 'manager-1',
        isActive: false,
        tenantId: 'tenant-1',
        maxBonusSpinsPerApproval: 10
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

      await expect(getPendingTasks('manager-1')).rejects.toThrow('Manager account is inactive');
    });
  });

  describe('getTaskDetail', () => {
    it('should return complete task information with minimal customer data', async () => {
      // This test validates Requirements 4.1, 8.3: Task detail completeness and data minimization
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        taskId: 'social-task-1',
        userId: 'user-1',
        status: 'PENDING',
        claimedAt: new Date(),
        verifiedBy: null,
        verifiedAt: null,
        verificationComment: null,
        task: {
          campaign: {
            tenantId
          }
        }
      };

      const mockDetailedTask = {
        id: taskCompletionId,
        taskId: 'social-task-1',
        userId: 'user-1',
        status: 'PENDING',
        claimedAt: new Date(),
        verifiedBy: null,
        verifiedAt: null,
        verificationComment: null,
        user: {
          id: 'user-1',
          phone: '+1234567890'
        },
        task: {
          actionType: 'FOLLOW',
          platform: 'Instagram',
          targetUrl: 'https://instagram.com/test',
          description: 'Follow our Instagram',
          spinsReward: 5
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTaskCompletion)
        .mockResolvedValueOnce(mockDetailedTask);

      const result = await getTaskDetail(managerId, taskCompletionId);

      expect(result).toMatchObject({
        id: taskCompletionId,
        taskType: 'Instagram - FOLLOW',
        targetUrl: 'https://instagram.com/test',
        status: 'PENDING',
        customer: {
          id: 'user-1',
          phoneLast4: '7890'
        },
        task: {
          bonusSpins: 5,
          description: 'Follow our Instagram'
        }
      });
    });

    it('should reject cross-tenant access', async () => {
      // This test validates Requirement 8.2: Cross-tenant access prevention
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId: 'tenant-1',
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        task: {
          campaign: {
            tenantId: 'tenant-2' // Different tenant
          }
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock).mockResolvedValue(mockTaskCompletion);

      await expect(getTaskDetail(managerId, taskCompletionId))
        .rejects.toThrow('Access denied: task belongs to different tenant');
    });
  });

  describe('approveTask', () => {
    it('should reject approval without comment', async () => {
      // This test validates Requirement 4.3: Mandatory comment validation
      const result1 = await approveTask('manager-1', 'task-1', '');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Comment is required');

      const result2 = await approveTask('manager-1', 'task-1', '   ');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Comment is required');
    });

    it('should reject approval of already verified task', async () => {
      // This test validates Requirement 4.8: Idempotent task verification
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        status: 'VERIFIED', // Already verified
        task: {
          campaign: {
            tenantId
          }
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock).mockResolvedValue(mockTaskCompletion);

      const result = await approveTask(managerId, taskCompletionId, 'Good job!');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already been verified');
    });

    it('should cap bonus spins at manager\'s maxBonusSpinsPerApproval', async () => {
      // This test validates Requirements 4.6, 4.7: Bonus spin limit enforcement
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 5 // Manager can only grant 5 spins
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        taskId: 'social-task-1',
        userId: 'user-1',
        status: 'PENDING',
        task: {
          campaign: {
            tenantId
          }
        }
      };

      const mockTask = {
        id: 'social-task-1',
        spinsReward: 10, // Task configured for 10 spins
        platform: 'Instagram',
        actionType: 'FOLLOW',
        campaign: {
          tenantId
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock).mockResolvedValue(mockTaskCompletion);
      (prisma.socialMediaTask.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(prisma);
      });
      (prisma.socialTaskCompletion.update as jest.Mock).mockResolvedValue({});
      (prisma.managerAuditLog.create as jest.Mock).mockResolvedValue({});
      (bonusSpinService.grantBonusSpins as jest.Mock).mockResolvedValue({ success: true, newSpinCount: 5 });
      (bonusSpinService.sendApprovalNotification as jest.Mock).mockResolvedValue({ success: true });

      const result = await approveTask(managerId, taskCompletionId, 'Approved!');

      expect(result.success).toBe(true);
      expect(result.bonusSpinsGranted).toBe(5); // Capped at manager's limit
      expect(bonusSpinService.grantBonusSpins).toHaveBeenCalledWith(
        'user-1',
        5, // Capped value
        expect.any(String),
        managerId
      );
    });

    it('should update task status to VERIFIED and create audit log', async () => {
      // This test validates Requirements 4.4, 7.1, 7.2: Status update and audit logging
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';
      const tenantId = 'tenant-1';
      const comment = 'Task completed successfully';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        taskId: 'social-task-1',
        userId: 'user-1',
        status: 'PENDING',
        task: {
          campaign: {
            tenantId
          }
        }
      };

      const mockTask = {
        id: 'social-task-1',
        spinsReward: 5,
        platform: 'Instagram',
        actionType: 'FOLLOW',
        campaign: {
          tenantId
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock).mockResolvedValue(mockTaskCompletion);
      (prisma.socialMediaTask.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(prisma);
      });
      (prisma.socialTaskCompletion.update as jest.Mock).mockResolvedValue({});
      (prisma.managerAuditLog.create as jest.Mock).mockResolvedValue({});
      (bonusSpinService.grantBonusSpins as jest.Mock).mockResolvedValue({ success: true, newSpinCount: 5 });
      (bonusSpinService.sendApprovalNotification as jest.Mock).mockResolvedValue({ success: true });

      await approveTask(managerId, taskCompletionId, comment);

      // Verify task status updated
      expect(prisma.socialTaskCompletion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: taskCompletionId },
          data: expect.objectContaining({
            status: 'VERIFIED',
            verifiedBy: managerId,
            verificationComment: comment
          })
        })
      );

      // Verify audit log created
      expect(prisma.managerAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            managerId,
            tenantId,
            action: 'APPROVE',
            taskCompletionId,
            comment,
            bonusSpinsGranted: 5
          })
        })
      );
    });

    it('should send approval notification to customer', async () => {
      // This test validates Requirements 6.1, 6.3: Notification delivery
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        taskId: 'social-task-1',
        userId: 'user-1',
        status: 'PENDING',
        task: {
          campaign: {
            tenantId
          }
        }
      };

      const mockTask = {
        id: 'social-task-1',
        spinsReward: 5,
        platform: 'Instagram',
        actionType: 'FOLLOW',
        campaign: {
          tenantId
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock).mockResolvedValue(mockTaskCompletion);
      (prisma.socialMediaTask.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(prisma);
      });
      (prisma.socialTaskCompletion.update as jest.Mock).mockResolvedValue({});
      (prisma.managerAuditLog.create as jest.Mock).mockResolvedValue({});
      (bonusSpinService.grantBonusSpins as jest.Mock).mockResolvedValue({ success: true, newSpinCount: 5 });
      (bonusSpinService.sendApprovalNotification as jest.Mock).mockResolvedValue({ success: true });

      await approveTask(managerId, taskCompletionId, 'Approved!');

      expect(bonusSpinService.sendApprovalNotification).toHaveBeenCalledWith(
        'user-1',
        'Instagram - FOLLOW',
        5,
        tenantId
      );
    });
  });

  describe('rejectTask', () => {
    it('should reject rejection without comment', async () => {
      // This test validates Requirement 4.3: Mandatory comment validation
      const result = await rejectTask('manager-1', 'task-1', '');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Comment is required');
    });

    it('should update task status to REJECTED and create audit log', async () => {
      // This test validates Requirements 4.5, 7.1, 7.2: Status update and audit logging
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';
      const tenantId = 'tenant-1';
      const comment = 'Task does not meet requirements';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        taskId: 'social-task-1',
        userId: 'user-1',
        status: 'PENDING',
        task: {
          campaign: {
            tenantId
          }
        }
      };

      const mockTask = {
        id: 'social-task-1',
        platform: 'Instagram',
        actionType: 'FOLLOW',
        campaign: {
          tenantId
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock).mockResolvedValue(mockTaskCompletion);
      (prisma.socialMediaTask.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(prisma);
      });
      (prisma.socialTaskCompletion.update as jest.Mock).mockResolvedValue({});
      (prisma.managerAuditLog.create as jest.Mock).mockResolvedValue({});
      (bonusSpinService.sendRejectionNotification as jest.Mock).mockResolvedValue({ success: true });

      await rejectTask(managerId, taskCompletionId, comment);

      // Verify task status updated
      expect(prisma.socialTaskCompletion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: taskCompletionId },
          data: expect.objectContaining({
            status: 'REJECTED',
            verifiedBy: managerId,
            verificationComment: comment
          })
        })
      );

      // Verify audit log created with null bonus spins
      expect(prisma.managerAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            managerId,
            tenantId,
            action: 'REJECT',
            taskCompletionId,
            comment,
            bonusSpinsGranted: null
          })
        })
      );
    });

    it('should send rejection notification to customer', async () => {
      // This test validates Requirements 6.2, 6.3: Rejection notification
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';
      const tenantId = 'tenant-1';
      const comment = 'Task does not meet requirements';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        taskId: 'social-task-1',
        userId: 'user-1',
        status: 'PENDING',
        task: {
          campaign: {
            tenantId
          }
        }
      };

      const mockTask = {
        id: 'social-task-1',
        platform: 'Instagram',
        actionType: 'FOLLOW',
        campaign: {
          tenantId
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock).mockResolvedValue(mockTaskCompletion);
      (prisma.socialMediaTask.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(prisma);
      });
      (prisma.socialTaskCompletion.update as jest.Mock).mockResolvedValue({});
      (prisma.managerAuditLog.create as jest.Mock).mockResolvedValue({});
      (bonusSpinService.sendRejectionNotification as jest.Mock).mockResolvedValue({ success: true });

      await rejectTask(managerId, taskCompletionId, comment);

      expect(bonusSpinService.sendRejectionNotification).toHaveBeenCalledWith(
        'user-1',
        'Instagram - FOLLOW',
        comment,
        tenantId
      );
    });

    it('should reject already verified or rejected tasks', async () => {
      const managerId = 'manager-1';
      const taskCompletionId = 'task-1';
      const tenantId = 'tenant-1';

      const mockManager = {
        id: managerId,
        isActive: true,
        tenantId,
        maxBonusSpinsPerApproval: 10
      };

      const mockTaskCompletion = {
        id: taskCompletionId,
        status: 'VERIFIED',
        task: {
          campaign: {
            tenantId
          }
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (prisma.socialTaskCompletion.findUnique as jest.Mock).mockResolvedValue(mockTaskCompletion);

      const result = await rejectTask(managerId, taskCompletionId, 'Rejected');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already been verified');
    });
  });
});
