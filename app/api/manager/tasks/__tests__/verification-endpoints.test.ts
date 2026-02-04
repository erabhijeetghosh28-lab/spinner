/**
 * Integration Tests for Manager Task Verification API Endpoints
 * 
 * Feature: manager-role-verification
 * 
 * Tests the API endpoints for manager task verification including:
 * - GET /api/manager/tasks/pending (list pending tasks)
 * - GET /api/manager/tasks/[id] (get task detail)
 * - POST /api/manager/tasks/[id]/approve (approve task)
 * - POST /api/manager/tasks/[id]/reject (reject task)
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 8.2
 * 
 * @jest-environment node
 */

import { managerAuthService } from '@/lib/manager-auth-service';
import * as verificationService from '@/lib/manager-verification-service';
import { NextRequest } from 'next/server';
import { POST as approveTask } from '../[id]/approve/route';
import { POST as rejectTask } from '../[id]/reject/route';
import { GET as getTaskDetail } from '../[id]/route';
import { GET as getPendingTasks } from '../pending/route';

// Mock the services
jest.mock('@/lib/manager-auth-service');
jest.mock('@/lib/manager-verification-service');

const mockManagerAuthService = managerAuthService as jest.Mocked<typeof managerAuthService>;
const mockVerificationService = verificationService as jest.Mocked<typeof verificationService>;

describe('Manager Task Verification API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for authentication
    mockManagerAuthService.validateToken.mockResolvedValue({
      valid: true,
      managerId: 'manager-1',
      tenantId: 'tenant-1',
      role: 'manager'
    });
  });

  describe('GET /api/manager/tasks/pending', () => {
    test('should return pending tasks for authenticated manager', async () => {
      // Requirement 3.1: Display all pending social task completions for manager's tenant
      const mockTasks = [
        {
          id: 'task-1',
          taskType: 'Instagram - Follow',
          submittedAt: new Date('2024-01-15T10:00:00Z'),
          status: 'PENDING',
          customer: {
            id: 'customer-1',
            phoneLast4: '1234'
          },
          taskId: 'social-task-1',
          targetUrl: 'https://instagram.com/example'
        },
        {
          id: 'task-2',
          taskType: 'Facebook - Like',
          submittedAt: new Date('2024-01-15T11:00:00Z'),
          status: 'PENDING',
          customer: {
            id: 'customer-2',
            phoneLast4: '5678'
          },
          taskId: 'social-task-2',
          targetUrl: 'https://facebook.com/example'
        }
      ];

      mockVerificationService.getPendingTasks.mockResolvedValue(mockTasks);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getPendingTasks(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tasks).toHaveLength(2);
      expect(data.tasks[0].id).toBe('task-1');
      // Requirement 3.2: Show only minimal customer data
      expect(data.tasks[0].customer.phoneLast4).toBe('1234');
      expect(data.tasks[0].customer).not.toHaveProperty('phone');
      expect(mockVerificationService.getPendingTasks).toHaveBeenCalledWith('manager-1', {});
    });

    test('should filter tasks by status', async () => {
      // Requirement 3.6: Filter task completions by status
      const mockTasks = [
        {
          id: 'task-1',
          taskType: 'Instagram - Follow',
          submittedAt: new Date('2024-01-15T10:00:00Z'),
          status: 'VERIFIED',
          customer: {
            id: 'customer-1',
            phoneLast4: '1234'
          },
          taskId: 'social-task-1'
        }
      ];

      mockVerificationService.getPendingTasks.mockResolvedValue(mockTasks);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending?status=VERIFIED', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getPendingTasks(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockVerificationService.getPendingTasks).toHaveBeenCalledWith('manager-1', {
        status: 'VERIFIED'
      });
    });

    test('should support pagination', async () => {
      mockVerificationService.getPendingTasks.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending?page=2&limit=25', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getPendingTasks(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.page).toBe(2);
      expect(data.limit).toBe(25);
      expect(mockVerificationService.getPendingTasks).toHaveBeenCalledWith('manager-1', {
        page: 2,
        limit: 25
      });
    });

    test('should return 400 for invalid status', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending?status=INVALID', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getPendingTasks(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_STATUS');
    });

    test('should return 400 for invalid page number', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending?page=0', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getPendingTasks(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_PAGE');
    });

    test('should return 400 for invalid limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending?limit=200', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getPendingTasks(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_LIMIT');
    });

    test('should return 401 for missing authentication', async () => {
      mockManagerAuthService.validateToken.mockResolvedValue({
        valid: false,
        error: 'Invalid token'
      });

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      const response = await getPendingTasks(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('should return 403 for inactive manager', async () => {
      mockVerificationService.getPendingTasks.mockRejectedValue(
        new Error('Manager account is inactive')
      );

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getPendingTasks(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('GET /api/manager/tasks/[id]', () => {
    test('should return task detail for authenticated manager', async () => {
      // Requirement 4.1: Display detailed information
      const mockTaskDetail = {
        id: 'task-1',
        taskType: 'Instagram - Follow',
        targetUrl: 'https://instagram.com/example',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        status: 'PENDING',
        customer: {
          id: 'customer-1',
          phoneLast4: '1234'
        },
        task: {
          bonusSpins: 5,
          description: 'Follow our Instagram account'
        }
      };

      mockVerificationService.getTaskDetail.mockResolvedValue(mockTaskDetail);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getTaskDetail(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.task.id).toBe('task-1');
      expect(data.task.task.bonusSpins).toBe(5);
      expect(mockVerificationService.getTaskDetail).toHaveBeenCalledWith('manager-1', 'task-1');
    });

    test('should return 400 for missing task ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getTaskDetail(request, { params: { id: undefined } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_TASK_ID');
    });

    test('should return 404 for non-existent task', async () => {
      mockVerificationService.getTaskDetail.mockRejectedValue(
        new Error('Task completion not found')
      );

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/non-existent', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getTaskDetail(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('TASK_NOT_FOUND');
    });

    test('should return 403 for cross-tenant access attempt', async () => {
      // Requirement 8.2: Reject cross-tenant access attempts
      mockVerificationService.getTaskDetail.mockRejectedValue(
        new Error('Access denied: task belongs to different tenant')
      );

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/other-tenant-task', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await getTaskDetail(request, { params: { id: 'other-tenant-task' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toContain('different tenant');
    });
  });

  describe('POST /api/manager/tasks/[id]/approve', () => {
    test('should approve task with valid comment', async () => {
      // Requirement 4.4: Update completion status to VERIFIED
      // Requirement 4.6: Grant bonus spins
      const mockResult = {
        success: true,
        bonusSpinsGranted: 5
      };

      mockVerificationService.approveTask.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/approve', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Task completed successfully, verified Instagram follow'
        })
      });

      const response = await approveTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bonusSpinsGranted).toBe(5);
      expect(mockVerificationService.approveTask).toHaveBeenCalledWith(
        'manager-1',
        'task-1',
        'Task completed successfully, verified Instagram follow'
      );
    });

    test('should cap bonus spins at manager limit', async () => {
      // Requirement 4.7: Cap bonus spins at manager's maximum
      const mockResult = {
        success: true,
        bonusSpinsGranted: 10 // Capped at manager's limit
      };

      mockVerificationService.approveTask.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/approve', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Approved'
        })
      });

      const response = await approveTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bonusSpinsGranted).toBe(10);
    });

    test('should return 400 for missing comment', async () => {
      // Requirement 4.3: Prevent submission without a comment
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/approve', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({})
      });

      const response = await approveTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('COMMENT_REQUIRED');
      expect(data.error.message).toContain('Comment is required');
    });

    test('should return 400 for empty comment', async () => {
      // Requirement 4.3: Validate comment is not empty
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/approve', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: '   '
        })
      });

      const response = await approveTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('COMMENT_REQUIRED');
    });

    test('should return 400 for comment too long', async () => {
      const longComment = 'a'.repeat(1001);
      
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/approve', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: longComment
        })
      });

      const response = await approveTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('COMMENT_TOO_LONG');
    });

    test('should return 409 for already verified task', async () => {
      // Requirement 4.8: Prevent duplicate verification
      const mockResult = {
        success: false,
        bonusSpinsGranted: 0,
        error: 'Task has already been verified'
      };

      mockVerificationService.approveTask.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/approve', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Trying to approve again'
        })
      });

      const response = await approveTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('ALREADY_VERIFIED');
    });

    test('should return 403 for cross-tenant access', async () => {
      const mockResult = {
        success: false,
        bonusSpinsGranted: 0,
        error: 'Access denied: task belongs to different tenant'
      };

      mockVerificationService.approveTask.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/other-task/approve', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Approved'
        })
      });

      const response = await approveTask(request, { params: { id: 'other-task' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    test('should return 400 for invalid task ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks//approve', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Approved'
        })
      });

      const response = await approveTask(request, { params: { id: undefined } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_TASK_ID');
    });
  });

  describe('POST /api/manager/tasks/[id]/reject', () => {
    test('should reject task with valid comment', async () => {
      // Requirement 4.5: Update completion status to REJECTED
      const mockResult = {
        success: true
      };

      mockVerificationService.rejectTask.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/reject', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Task not completed properly, Instagram account not followed'
        })
      });

      const response = await rejectTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockVerificationService.rejectTask).toHaveBeenCalledWith(
        'manager-1',
        'task-1',
        'Task not completed properly, Instagram account not followed'
      );
    });

    test('should return 400 for missing comment', async () => {
      // Requirement 4.3: Prevent submission without a comment
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/reject', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({})
      });

      const response = await rejectTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('COMMENT_REQUIRED');
    });

    test('should return 400 for empty comment', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/reject', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: '   '
        })
      });

      const response = await rejectTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('COMMENT_REQUIRED');
    });

    test('should return 400 for comment too long', async () => {
      const longComment = 'a'.repeat(1001);
      
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/reject', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: longComment
        })
      });

      const response = await rejectTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('COMMENT_TOO_LONG');
    });

    test('should return 409 for already verified task', async () => {
      const mockResult = {
        success: false,
        error: 'Task has already been verified'
      };

      mockVerificationService.rejectTask.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/task-1/reject', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Trying to reject verified task'
        })
      });

      const response = await rejectTask(request, { params: { id: 'task-1' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('ALREADY_VERIFIED');
    });

    test('should return 403 for cross-tenant access', async () => {
      const mockResult = {
        success: false,
        error: 'Access denied: task belongs to different tenant'
      };

      mockVerificationService.rejectTask.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/other-task/reject', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Rejected'
        })
      });

      const response = await rejectTask(request, { params: { id: 'other-task' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    test('should return 404 for non-existent task', async () => {
      const mockResult = {
        success: false,
        error: 'Task completion not found'
      };

      mockVerificationService.rejectTask.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/non-existent/reject', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Rejected'
        })
      });

      const response = await rejectTask(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('TASK_NOT_FOUND');
    });

    test('should return 400 for invalid task ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks//reject', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          comment: 'Rejected'
        })
      });

      const response = await rejectTask(request, { params: { id: undefined } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_TASK_ID');
    });
  });

  describe('Cross-cutting concerns', () => {
    test('all endpoints should require authentication', async () => {
      mockManagerAuthService.validateToken.mockResolvedValue({
        valid: false,
        error: 'Invalid token'
      });

      const endpoints = [
        { handler: getPendingTasks, url: 'http://localhost:3000/api/manager/tasks/pending', method: 'GET' },
        { handler: getTaskDetail, url: 'http://localhost:3000/api/manager/tasks/task-1', method: 'GET', params: { params: { id: 'task-1' } } },
        { handler: approveTask, url: 'http://localhost:3000/api/manager/tasks/task-1/approve', method: 'POST', params: { params: { id: 'task-1' } }, body: { comment: 'test' } },
        { handler: rejectTask, url: 'http://localhost:3000/api/manager/tasks/task-1/reject', method: 'POST', params: { params: { id: 'task-1' } }, body: { comment: 'test' } }
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Authorization': 'Bearer invalid-token'
          },
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
        });

        const response = await endpoint.handler(request, endpoint.params);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error.code).toBe('UNAUTHORIZED');
      }
    });

    test('all endpoints should handle service errors gracefully', async () => {
      mockVerificationService.getPendingTasks.mockRejectedValue(new Error('Database error'));
      mockVerificationService.getTaskDetail.mockRejectedValue(new Error('Database error'));
      mockVerificationService.approveTask.mockRejectedValue(new Error('Database error'));
      mockVerificationService.rejectTask.mockRejectedValue(new Error('Database error'));

      const endpoints = [
        { handler: getPendingTasks, url: 'http://localhost:3000/api/manager/tasks/pending', method: 'GET' },
        { handler: getTaskDetail, url: 'http://localhost:3000/api/manager/tasks/task-1', method: 'GET', params: { params: { id: 'task-1' } } },
        { handler: approveTask, url: 'http://localhost:3000/api/manager/tasks/task-1/approve', method: 'POST', params: { params: { id: 'task-1' } }, body: { comment: 'test' } },
        { handler: rejectTask, url: 'http://localhost:3000/api/manager/tasks/task-1/reject', method: 'POST', params: { params: { id: 'task-1' } }, body: { comment: 'test' } }
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Authorization': 'Bearer valid-token'
          },
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
        });

        const response = await endpoint.handler(request, endpoint.params);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error.code).toBe('INTERNAL_ERROR');
      }
    });
  });
});
