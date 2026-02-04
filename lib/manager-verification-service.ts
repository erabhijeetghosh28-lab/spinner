import {
    grantBonusSpins,
    sendApprovalNotification,
    sendRejectionNotification
} from '@/lib/bonus-spin-service';
import prisma from '@/lib/prisma';

/**
 * ManagerVerificationService
 * 
 * Handles manager verification of social media task completions.
 * Implements multi-tenant isolation, bonus spin allocation, and audit logging.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.1, 7.2, 8.2, 8.3
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TaskFilters {
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FAILED';
  page?: number;
  limit?: number;
}

export interface MinimalCustomerData {
  id: string;
  phoneLast4: string;
}

export interface TaskCompletion {
  id: string;
  taskType: string;
  submittedAt: Date;
  status: string;
  customer: MinimalCustomerData;
  taskId: string;
  targetUrl?: string;
}

export interface TaskCompletionDetail {
  id: string;
  taskType: string;
  targetUrl?: string;
  submittedAt: Date;
  status: string;
  customer: MinimalCustomerData;
  task: {
    bonusSpins: number;
    description: string;
  };
  verificationComment?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface ApprovalResult {
  success: boolean;
  bonusSpinsGranted: number;
  error?: string;
}

export interface RejectionResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract last 4 digits of phone number
 * Requirement 3.2, 8.3: Data minimization for customer information
 */
function getPhoneLast4(phone: string): string {
  if (!phone || phone.length < 4) {
    return phone || '';
  }
  return phone.slice(-4);
}

/**
 * Validate manager exists, is active, and belongs to tenant
 * Requirements: 4.2, 8.1, 8.2
 */
async function validateManager(managerId: string) {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    select: {
      id: true,
      isActive: true,
      tenantId: true,
      maxBonusSpinsPerApproval: true
    }
  });

  if (!manager) {
    throw new Error('Manager not found');
  }

  if (!manager.isActive) {
    throw new Error('Manager account is inactive');
  }

  return manager;
}

/**
 * Validate task belongs to manager's tenant
 * Requirements: 8.1, 8.2
 */
async function validateTaskAccess(taskCompletionId: string, tenantId: string) {
  const taskCompletion = await prisma.socialTaskCompletion.findUnique({
    where: { id: taskCompletionId },
    include: {
      task: {
        include: {
          campaign: {
            select: { tenantId: true }
          }
        }
      }
    }
  });

  if (!taskCompletion) {
    throw new Error('Task completion not found');
  }

  if (taskCompletion.task.campaign.tenantId !== tenantId) {
    throw new Error('Access denied: task belongs to different tenant');
  }

  return taskCompletion;
}

// ============================================================================
// Service Methods
// ============================================================================

/**
 * Get pending tasks for manager's tenant
 * 
 * Filters by manager's tenantId and only shows customers who have spun at least once.
 * Returns minimal customer data (ID, phone last 4 digits).
 * 
 * @param managerId - Manager ID
 * @param filters - Optional filters (status, pagination)
 * @returns Array of task completions with minimal customer data
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6
 */
export async function getPendingTasks(
  managerId: string,
  filters: TaskFilters = {}
): Promise<TaskCompletion[]> {
  try {
    // Validate manager and get tenant ID
    const manager = await validateManager(managerId);

    // Build query filters
    const whereClause: any = {
      task: {
        campaign: {
          tenantId: manager.tenantId // Requirement 3.3: Filter by manager's tenant
        }
      },
      // Requirement 3.4: Only show customers who have spun at least once
      user: {
        spins: {
          some: {}
        }
      }
    };

    // Requirement 3.6: Status filtering
    if (filters.status) {
      whereClause.status = filters.status;
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Fetch task completions
    const taskCompletions = await prisma.socialTaskCompletion.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            phone: true // Will be minimized to last 4 digits
          }
        },
        task: {
          select: {
            id: true,
            actionType: true,
            platform: true,
            targetUrl: true
          }
        }
      },
      orderBy: {
        claimedAt: 'desc'
      },
      skip,
      take: limit
    });

    // Requirement 3.2: Return minimal customer data (ID, phone last 4 digits)
    return taskCompletions.map(tc => ({
      id: tc.id,
      taskType: `${tc.task.platform} - ${tc.task.actionType}`,
      submittedAt: tc.claimedAt,
      status: tc.status,
      customer: {
        id: tc.user.id,
        phoneLast4: getPhoneLast4(tc.user.phone)
      },
      taskId: tc.taskId,
      targetUrl: tc.task.targetUrl || undefined
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in getPendingTasks:', errorMessage);
    throw error;
  }
}

/**
 * Get detailed task information
 * 
 * Validates manager access (tenant isolation).
 * Returns complete task information with minimal customer data.
 * 
 * @param managerId - Manager ID
 * @param taskCompletionId - Task completion ID
 * @returns Detailed task information
 * 
 * Requirements: 4.1, 8.2, 8.3
 */
export async function getTaskDetail(
  managerId: string,
  taskCompletionId: string
): Promise<TaskCompletionDetail> {
  try {
    // Validate manager
    const manager = await validateManager(managerId);

    // Requirement 8.2: Validate task belongs to manager's tenant
    const taskCompletion = await validateTaskAccess(taskCompletionId, manager.tenantId);

    // Fetch complete task information
    const detailedTask = await prisma.socialTaskCompletion.findUnique({
      where: { id: taskCompletionId },
      include: {
        user: {
          select: {
            id: true,
            phone: true
          }
        },
        task: {
          select: {
            actionType: true,
            platform: true,
            targetUrl: true,
            description: true,
            spinsReward: true
          }
        }
      }
    });

    if (!detailedTask) {
      throw new Error('Task completion not found');
    }

    // Requirement 4.1, 8.3: Return complete task info with minimal customer data
    return {
      id: detailedTask.id,
      taskType: `${detailedTask.task.platform} - ${detailedTask.task.actionType}`,
      targetUrl: detailedTask.task.targetUrl || undefined,
      submittedAt: detailedTask.claimedAt,
      status: detailedTask.status,
      customer: {
        id: detailedTask.user.id,
        phoneLast4: getPhoneLast4(detailedTask.user.phone)
      },
      task: {
        bonusSpins: detailedTask.task.spinsReward,
        description: detailedTask.task.description || ''
      },
      verificationComment: detailedTask.verificationComment || undefined,
      verifiedAt: detailedTask.verifiedAt || undefined,
      verifiedBy: detailedTask.verifiedBy || undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in getTaskDetail:', errorMessage);
    throw error;
  }
}

/**
 * Approve task completion and grant bonus spins
 * 
 * Validates manager, checks task not already verified (idempotency),
 * caps bonus spins at manager's limit, updates task status,
 * creates audit log, grants spins, and sends notification.
 * 
 * @param managerId - Manager ID
 * @param taskCompletionId - Task completion ID
 * @param comment - Mandatory comment explaining approval
 * @returns Result with success status and bonus spins granted
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 7.1, 7.2
 */
export async function approveTask(
  managerId: string,
  taskCompletionId: string,
  comment: string
): Promise<ApprovalResult> {
  try {
    // Requirement 4.3: Validate comment is not empty
    if (!comment || comment.trim().length === 0) {
      throw new Error('Comment is required for task verification');
    }

    // Validate manager
    const manager = await validateManager(managerId);

    // Requirement 8.2: Validate task belongs to manager's tenant
    const taskCompletion = await validateTaskAccess(taskCompletionId, manager.tenantId);

    // Requirement 4.8: Check task not already verified (idempotency)
    if (taskCompletion.status === 'VERIFIED') {
      throw new Error('Task has already been verified');
    }

    // Fetch task details for bonus spins
    const task = await prisma.socialMediaTask.findUnique({
      where: { id: taskCompletion.taskId },
      include: {
        campaign: {
          select: { tenantId: true }
        }
      }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Requirement 4.6, 4.7: Cap bonus spins at manager's maxBonusSpinsPerApproval
    const configuredSpins = task.spinsReward;
    const bonusSpinsToGrant = Math.min(configuredSpins, manager.maxBonusSpinsPerApproval);

    if (bonusSpinsToGrant < configuredSpins) {
      console.warn(`⚠️ Bonus spins capped: configured=${configuredSpins}, manager limit=${manager.maxBonusSpinsPerApproval}, granted=${bonusSpinsToGrant}`);
    }

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Requirement 4.4: Update task status to VERIFIED
      const updatedTask = await tx.socialTaskCompletion.update({
        where: { id: taskCompletionId },
        data: {
          status: 'VERIFIED',
          verifiedBy: managerId,
          verifiedAt: new Date(),
          verificationComment: comment
        }
      });

      // Requirement 7.1, 7.2: Create audit log entry
      await tx.managerAuditLog.create({
        data: {
          managerId,
          tenantId: manager.tenantId,
          action: 'APPROVE',
          taskCompletionId,
          comment,
          bonusSpinsGranted: bonusSpinsToGrant
        }
      });

      return updatedTask;
    });

    // Grant bonus spins (outside transaction to avoid long-running operations)
    const spinResult = await grantBonusSpins(
      taskCompletion.userId,
      bonusSpinsToGrant,
      `Task approval: ${task.platform} - ${task.actionType}`,
      managerId
    );

    if (!spinResult.success) {
      console.error('❌ Failed to grant bonus spins:', spinResult.error);
      // Note: Task is already marked as VERIFIED, but spins failed
      // This should be handled by retry logic or manual intervention
    }

    // Send approval notification
    await sendApprovalNotification(
      taskCompletion.userId,
      `${task.platform} - ${task.actionType}`,
      bonusSpinsToGrant,
      task.campaign.tenantId
    );

    console.log(`✅ Task ${taskCompletionId} approved by manager ${managerId}, granted ${bonusSpinsToGrant} spins`);

    return {
      success: true,
      bonusSpinsGranted: bonusSpinsToGrant
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in approveTask:', errorMessage);
    
    return {
      success: false,
      bonusSpinsGranted: 0,
      error: errorMessage
    };
  }
}

/**
 * Reject task completion
 * 
 * Validates manager, checks task not already verified,
 * updates task status, creates audit log, and sends notification.
 * 
 * @param managerId - Manager ID
 * @param taskCompletionId - Task completion ID
 * @param comment - Mandatory comment explaining rejection
 * @returns Result with success status
 * 
 * Requirements: 4.2, 4.3, 4.5, 7.1, 7.2
 */
export async function rejectTask(
  managerId: string,
  taskCompletionId: string,
  comment: string
): Promise<RejectionResult> {
  try {
    // Requirement 4.3: Validate comment is not empty
    if (!comment || comment.trim().length === 0) {
      throw new Error('Comment is required for task verification');
    }

    // Validate manager
    const manager = await validateManager(managerId);

    // Requirement 8.2: Validate task belongs to manager's tenant
    const taskCompletion = await validateTaskAccess(taskCompletionId, manager.tenantId);

    // Check task not already verified
    if (taskCompletion.status === 'VERIFIED' || taskCompletion.status === 'REJECTED') {
      throw new Error('Task has already been verified');
    }

    // Fetch task details
    const task = await prisma.socialMediaTask.findUnique({
      where: { id: taskCompletion.taskId },
      include: {
        campaign: {
          select: { tenantId: true }
        }
      }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Requirement 4.5: Update task status to REJECTED
      await tx.socialTaskCompletion.update({
        where: { id: taskCompletionId },
        data: {
          status: 'REJECTED',
          verifiedBy: managerId,
          verifiedAt: new Date(),
          verificationComment: comment
        }
      });

      // Requirement 7.1, 7.2: Create audit log entry with rejection comment
      await tx.managerAuditLog.create({
        data: {
          managerId,
          tenantId: manager.tenantId,
          action: 'REJECT',
          taskCompletionId,
          comment,
          bonusSpinsGranted: null // No spins for rejection
        }
      });
    });

    // Send rejection notification
    await sendRejectionNotification(
      taskCompletion.userId,
      `${task.platform} - ${task.actionType}`,
      comment,
      task.campaign.tenantId
    );

    console.log(`✅ Task ${taskCompletionId} rejected by manager ${managerId}`);

    return {
      success: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in rejectTask:', errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
