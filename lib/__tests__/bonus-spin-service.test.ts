/**
 * Unit Tests for BonusSpinService
 * 
 * Feature: manager-role-verification
 * Tests specific examples and edge cases for bonus spin allocation
 */

// Mock dependencies before imports
jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    endUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../whatsapp', () => ({
  sendWhatsAppMessage: jest.fn(),
}));

import {
    grantBonusSpins,
    notifyCustomer,
    sendApprovalNotification,
    sendRejectionNotification,
} from '../bonus-spin-service';
import prisma from '../prisma';
import { sendWhatsAppMessage } from '../whatsapp';

const mockPrisma = prisma as any;
const mockSendWhatsAppMessage = sendWhatsAppMessage as jest.MockedFunction<typeof sendWhatsAppMessage>;

describe('BonusSpinService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('grantBonusSpins', () => {
    test('successfully grants bonus spins to eligible customer', async () => {
      const customerId = 'customer-123';
      const amount = 5;
      const reason = 'Task approval';
      const grantedBy = 'manager-456';

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          endUser: {
            findUnique: jest.fn().mockResolvedValue({
              id: customerId,
              phone: '1234567890',
              bonusSpinsEarned: 10,
              spins: [{ id: 'spin-1' }], // Has spun at least once
            }),
            update: jest.fn().mockResolvedValue({
              bonusSpinsEarned: 15,
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await grantBonusSpins(customerId, amount, reason, grantedBy);

      expect(result.success).toBe(true);
      expect(result.newSpinCount).toBe(15);
      expect(result.error).toBeUndefined();
    });

    test('rejects customer who has never spun', async () => {
      const customerId = 'customer-new';
      const amount = 3;
      const reason = 'Task approval';
      const grantedBy = 'manager-789';

      // Mock transaction with customer who has no spins
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          endUser: {
            findUnique: jest.fn().mockResolvedValue({
              id: customerId,
              phone: '9876543210',
              bonusSpinsEarned: 0,
              spins: [], // Never spun
            }),
            update: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      const result = await grantBonusSpins(customerId, amount, reason, grantedBy);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must spin at least once');
      expect(result.newSpinCount).toBeUndefined();
    });

    test('handles customer not found', async () => {
      const customerId = 'nonexistent';
      const amount = 2;
      const reason = 'Task approval';
      const grantedBy = 'manager-999';

      // Mock transaction with null customer
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          endUser: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      const result = await grantBonusSpins(customerId, amount, reason, grantedBy);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Customer not found');
    });

    test('handles database transaction failure', async () => {
      const customerId = 'customer-error';
      const amount = 4;
      const reason = 'Task approval';
      const grantedBy = 'manager-111';

      // Mock transaction failure
      mockPrisma.$transaction.mockRejectedValue(new Error('Database connection lost'));

      const result = await grantBonusSpins(customerId, amount, reason, grantedBy);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection lost');
    });

    test('logs success when spins are granted', async () => {
      const customerId = 'customer-log';
      const amount = 7;
      const reason = 'Social media task';
      const grantedBy = 'manager-222';

      const consoleLogSpy = jest.spyOn(console, 'log');

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          endUser: {
            findUnique: jest.fn().mockResolvedValue({
              id: customerId,
              spins: [{ id: 'spin-1' }],
            }),
            update: jest.fn().mockResolvedValue({
              bonusSpinsEarned: 7,
            }),
          },
        };
        return callback(mockTx);
      });

      await grantBonusSpins(customerId, amount, reason, grantedBy);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Granted 7 bonus spins')
      );
    });

    test('logs error on failure', async () => {
      const customerId = 'customer-fail';
      const amount = 3;
      const reason = 'Task approval';
      const grantedBy = 'manager-333';

      const consoleErrorSpy = jest.spyOn(console, 'error');

      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction timeout'));

      await grantBonusSpins(customerId, amount, reason, grantedBy);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to grant bonus spins'),
        expect.objectContaining({
          error: 'Transaction timeout',
          amount: 3,
        })
      );
    });
  });

  describe('notifyCustomer', () => {
    test('successfully sends notification on first attempt', async () => {
      const customerId = 'customer-notify';
      const message = 'Test notification';
      const tenantId = 'tenant-123';

      mockPrisma.endUser.findUnique.mockResolvedValue({
        id: customerId,
        phone: '1234567890',
        name: 'Test User',
      } as any);

      mockSendWhatsAppMessage.mockResolvedValue({ success: true });

      const result = await notifyCustomer(customerId, message, tenantId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(1);
      expect(mockSendWhatsAppMessage).toHaveBeenCalledWith('1234567890', message, tenantId);
    });

    test('retries on failure and succeeds on second attempt', async () => {
      const customerId = 'customer-retry';
      const message = 'Retry test';
      const tenantId = 'tenant-456';

      mockPrisma.endUser.findUnique.mockResolvedValue({
        id: customerId,
        phone: '9876543210',
        name: 'Retry User',
      } as any);

      // First call fails, second succeeds
      mockSendWhatsAppMessage
        .mockResolvedValueOnce(null) // First attempt fails
        .mockResolvedValueOnce({ success: true }); // Second attempt succeeds

      const result = await notifyCustomer(customerId, message, tenantId);

      expect(result.success).toBe(true);
      expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(2);
    });

    test('fails after 3 retry attempts', async () => {
      const customerId = 'customer-fail-all';
      const message = 'Fail test';
      const tenantId = 'tenant-789';

      mockPrisma.endUser.findUnique.mockResolvedValue({
        id: customerId,
        phone: '5555555555',
        name: 'Fail User',
      } as any);

      // All attempts fail
      mockSendWhatsAppMessage.mockResolvedValue(null);

      const result = await notifyCustomer(customerId, message, tenantId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(3);
    });

    test('handles customer not found', async () => {
      const customerId = 'nonexistent-customer';
      const message = 'Test';
      const tenantId = 'tenant-999';

      mockPrisma.endUser.findUnique.mockResolvedValue(null);

      const result = await notifyCustomer(customerId, message, tenantId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Customer not found');
      expect(mockSendWhatsAppMessage).not.toHaveBeenCalled();
    });

    test('logs each retry attempt', async () => {
      const customerId = 'customer-log-retry';
      const message = 'Log test';
      const tenantId = 'tenant-log';

      const consoleLogSpy = jest.spyOn(console, 'log');

      mockPrisma.endUser.findUnique.mockResolvedValue({
        id: customerId,
        phone: '1111111111',
        name: 'Log User',
      } as any);

      mockSendWhatsAppMessage.mockResolvedValue(null);

      await notifyCustomer(customerId, message, tenantId);

      // Should log 3 attempts
      const attemptLogs = consoleLogSpy.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('attempt'))
      );
      expect(attemptLogs.length).toBe(3);
    });
  });

  describe('sendApprovalNotification', () => {
    test('formats approval message correctly', async () => {
      const customerId = 'customer-approve';
      const taskType = 'Instagram Follow';
      const bonusSpinsGranted = 5;
      const tenantId = 'tenant-approve';

      mockPrisma.endUser.findUnique.mockResolvedValue({
        id: customerId,
        phone: '2222222222',
        name: 'Approve User',
      } as any);

      mockSendWhatsAppMessage.mockResolvedValue({ success: true });

      const result = await sendApprovalNotification(
        customerId,
        taskType,
        bonusSpinsGranted,
        tenantId
      );

      expect(result.success).toBe(true);
      
      // Verify message format
      const sentMessage = mockSendWhatsAppMessage.mock.calls[0][1];
      expect(sentMessage).toContain('Congratulations');
      expect(sentMessage).toContain(taskType);
      expect(sentMessage).toContain('5 bonus spins');
      expect(sentMessage).toContain('approved');
    });

    test('uses singular "spin" for single bonus spin', async () => {
      const customerId = 'customer-single';
      const taskType = 'Facebook Like';
      const bonusSpinsGranted = 1;
      const tenantId = 'tenant-single';

      mockPrisma.endUser.findUnique.mockResolvedValue({
        id: customerId,
        phone: '3333333333',
        name: 'Single User',
      } as any);

      mockSendWhatsAppMessage.mockResolvedValue({ success: true });

      await sendApprovalNotification(customerId, taskType, bonusSpinsGranted, tenantId);

      const sentMessage = mockSendWhatsAppMessage.mock.calls[0][1];
      expect(sentMessage).toContain('1 bonus spin');
      expect(sentMessage).not.toContain('1 bonus spins');
    });
  });

  describe('sendRejectionNotification', () => {
    test('formats rejection message correctly', async () => {
      const customerId = 'customer-reject';
      const taskType = 'Twitter Retweet';
      const rejectionReason = 'Could not verify the retweet on your profile';
      const tenantId = 'tenant-reject';

      mockPrisma.endUser.findUnique.mockResolvedValue({
        id: customerId,
        phone: '4444444444',
        name: 'Reject User',
      } as any);

      mockSendWhatsAppMessage.mockResolvedValue({ success: true });

      const result = await sendRejectionNotification(
        customerId,
        taskType,
        rejectionReason,
        tenantId
      );

      expect(result.success).toBe(true);

      // Verify message format
      const sentMessage = mockSendWhatsAppMessage.mock.calls[0][1];
      expect(sentMessage).toContain(taskType);
      expect(sentMessage).toContain('Reason:');
      expect(sentMessage).toContain(rejectionReason);
      expect(sentMessage).toContain('could not be approved');
    });

    test('includes helpful guidance in rejection message', async () => {
      const customerId = 'customer-guidance';
      const taskType = 'YouTube Subscribe';
      const rejectionReason = 'Subscription not found';
      const tenantId = 'tenant-guidance';

      mockPrisma.endUser.findUnique.mockResolvedValue({
        id: customerId,
        phone: '5555555555',
        name: 'Guidance User',
      } as any);

      mockSendWhatsAppMessage.mockResolvedValue({ success: true });

      await sendRejectionNotification(customerId, taskType, rejectionReason, tenantId);

      const sentMessage = mockSendWhatsAppMessage.mock.calls[0][1];
      expect(sentMessage).toContain('try again');
      expect(sentMessage).toContain('contact support');
    });
  });
});
