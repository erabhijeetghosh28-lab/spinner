/**
 * @jest-environment node
 * 
 * Property-Based Tests for Notification Service
 * 
 * Tests universal properties using fast-check for randomized testing
 * Feature: manager-role-verification
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import {
    notifyCustomer,
    sendApprovalNotification,
    sendRejectionNotification,
} from '../bonus-spin-service';
import { sendWhatsAppMessage } from '../whatsapp';

// Mock WhatsApp service
jest.mock('../whatsapp', () => ({
  sendWhatsAppMessage: jest.fn(),
}));

const prisma = new PrismaClient();
const mockSendWhatsAppMessage = sendWhatsAppMessage as jest.MockedFunction<typeof sendWhatsAppMessage>;

/**
 * Arbitraries (generators) for property-based testing
 */

// Generate customer names (2-100 characters)
const customerNameArbitrary = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2);

// Generate phone numbers (10 digits)
const phoneArbitrary = fc.integer({ min: 1000000000, max: 9999999999 }).map(n => n.toString());

// Generate task types
const taskTypeArbitrary = fc.constantFrom(
  'Instagram Follow',
  'Facebook Like',
  'Twitter Retweet',
  'YouTube Subscribe',
  'TikTok Follow',
  'LinkedIn Connect'
);

// Generate bonus spin amounts (1-50)
const bonusSpinAmountArbitrary = fc.integer({ min: 1, max: 50 });

// Generate rejection reasons
const rejectionReasonArbitrary = fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 10);

// Generate notification messages
const messageArbitrary = fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10);

/**
 * Property-Based Tests for Notification Service
 */
describe('Notification Service Property-Based Tests', () => {
  let testTenantId: string;
  let testPlanId: string;

  beforeAll(async () => {
    // Create a test plan
    const existingPlan = await prisma.plan.findFirst({
      where: { name: 'Test Plan for Notification Tests' },
    });

    if (existingPlan) {
      testPlanId = existingPlan.id;
    } else {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan for Notification Tests',
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
        name: 'Test Tenant for Notification Tests',
        slug: 'test-tenant-notification-' + Date.now(),
        planId: testPlanId,
      },
    });
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    // Cleanup: Delete all test data
    await prisma.endUser.deleteMany({
      where: { tenantId: testTenantId },
    });

    await prisma.tenant.delete({
      where: { id: testTenantId },
    });

    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 12: Approval Notification Delivery
   * **Validates: Requirements 6.1, 6.3**
   * 
   * For any approved task completion, a WhatsApp notification should be sent
   * to the customer containing the task type and number of bonus spins granted.
   */
  describe('Property 12: Approval Notification Delivery', () => {
    it('should send approval notification with task type and bonus spins', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            taskType: taskTypeArbitrary,
            bonusSpins: bonusSpinAmountArbitrary,
          }),
          async ({ customerName, phone, taskType, bonusSpins }) => {
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

            // Mock successful WhatsApp delivery
            mockSendWhatsAppMessage.mockResolvedValue({ success: true });

            try {
              // Action: Send approval notification
              const result = await sendApprovalNotification(
                customer.id,
                taskType,
                bonusSpins,
                testTenantId
              );

              // Assertion: Notification should be sent successfully
              expect(result.success).toBe(true);
              expect(result.error).toBeUndefined();

              // Verify WhatsApp service was called
              expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(1);
              expect(mockSendWhatsAppMessage).toHaveBeenCalledWith(
                uniquePhone,
                expect.any(String),
                testTenantId
              );

              // Verify message contains required information (Requirement 6.3)
              const sentMessage = mockSendWhatsAppMessage.mock.calls[0][1];
              expect(sentMessage).toContain(taskType);
              expect(sentMessage).toContain(bonusSpins.toString());
              expect(sentMessage.toLowerCase()).toContain('approved');
              expect(sentMessage.toLowerCase()).toContain('bonus spin');
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Property 13: Rejection Notification Delivery
   * **Validates: Requirements 6.2, 6.3**
   * 
   * For any rejected task completion, a WhatsApp notification should be sent
   * to the customer containing the rejection reason from the manager's comment.
   */
  describe('Property 13: Rejection Notification Delivery', () => {
    it('should send rejection notification with task type and reason', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            taskType: taskTypeArbitrary,
            rejectionReason: rejectionReasonArbitrary,
          }),
          async ({ customerName, phone, taskType, rejectionReason }) => {
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

            // Mock successful WhatsApp delivery
            mockSendWhatsAppMessage.mockResolvedValue({ success: true });

            try {
              // Action: Send rejection notification
              const result = await sendRejectionNotification(
                customer.id,
                taskType,
                rejectionReason.trim(),
                testTenantId
              );

              // Assertion: Notification should be sent successfully
              expect(result.success).toBe(true);
              expect(result.error).toBeUndefined();

              // Verify WhatsApp service was called
              expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(1);
              expect(mockSendWhatsAppMessage).toHaveBeenCalledWith(
                uniquePhone,
                expect.any(String),
                testTenantId
              );

              // Verify message contains required information (Requirement 6.3)
              const sentMessage = mockSendWhatsAppMessage.mock.calls[0][1];
              expect(sentMessage).toContain(taskType);
              expect(sentMessage).toContain(rejectionReason.trim());
              expect(sentMessage.toLowerCase()).toContain('reason');
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 120000); // 2 minute timeout
  });

  /**
   * Property 14: Notification Retry Logic
   * **Validates: Requirements 6.4**
   * 
   * For any failed notification delivery, the system should retry up to 3 times
   * with exponential backoff before marking the notification as failed.
   */
  describe('Property 14: Notification Retry Logic', () => {
    it('should retry up to 3 times on failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            message: messageArbitrary,
          }),
          async ({ customerName, phone, message }) => {
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

            // Mock all attempts to fail
            mockSendWhatsAppMessage.mockResolvedValue(null);

            try {
              // Action: Attempt to send notification (will fail)
              const result = await notifyCustomer(
                customer.id,
                message.trim(),
                testTenantId
              );

              // Assertion: Should fail after 3 attempts (Requirement 6.4)
              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();

              // Verify exactly 3 retry attempts were made
              expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(3);

              // Verify all calls were to the same phone number
              for (let i = 0; i < 3; i++) {
                expect(mockSendWhatsAppMessage.mock.calls[i][0]).toBe(uniquePhone);
                expect(mockSendWhatsAppMessage.mock.calls[i][1]).toBe(message.trim());
                expect(mockSendWhatsAppMessage.mock.calls[i][2]).toBe(testTenantId);
              }
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 } // Reduced for faster testing due to retry delays
      );
    }, 180000); // 3 minute timeout (includes retry delays)

    it('should succeed on retry if later attempt succeeds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            message: messageArbitrary,
            successOnAttempt: fc.integer({ min: 1, max: 3 }), // Which attempt succeeds
          }),
          async ({ customerName, phone, message, successOnAttempt }) => {
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

            // Mock: Fail until successOnAttempt, then succeed
            let attemptCount = 0;
            mockSendWhatsAppMessage.mockImplementation(async () => {
              attemptCount++;
              if (attemptCount === successOnAttempt) {
                return { success: true };
              }
              return null;
            });

            try {
              // Action: Send notification
              const result = await notifyCustomer(
                customer.id,
                message.trim(),
                testTenantId
              );

              // Assertion: Should succeed on the specified attempt
              expect(result.success).toBe(true);
              expect(result.error).toBeUndefined();

              // Verify correct number of attempts were made
              expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(successOnAttempt);
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 } // Reduced for faster testing due to retry delays
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Property 33: Notification Delivery Logging
   * **Validates: Requirements 6.5**
   * 
   * For any notification sent (success or failure), the delivery status
   * should be logged for audit purposes.
   */
  describe('Property 33: Notification Delivery Logging', () => {
    it('should log successful notification delivery', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            message: messageArbitrary,
          }),
          async ({ customerName, phone, message }) => {
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

            // Mock successful delivery
            mockSendWhatsAppMessage.mockResolvedValue({ success: true });

            // Spy on console.log to verify logging
            const consoleLogSpy = jest.spyOn(console, 'log');

            try {
              // Action: Send notification
              await notifyCustomer(customer.id, message.trim(), testTenantId);

              // Assertion: Success should be logged (Requirement 6.5)
              expect(consoleLogSpy).toHaveBeenCalled();
              
              const successLogs = consoleLogSpy.mock.calls.filter(call =>
                call.some(arg => 
                  typeof arg === 'string' && 
                  arg.includes('WhatsApp notification delivered')
                )
              );
              expect(successLogs.length).toBeGreaterThan(0);

              // Verify log contains customer ID
              const successLog = successLogs[0][0];
              expect(successLog).toContain(customer.id);
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 120000); // 2 minute timeout

    it('should log failed notification delivery with error details', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            message: messageArbitrary,
          }),
          async ({ customerName, phone, message }) => {
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

            // Mock all attempts to fail
            mockSendWhatsAppMessage.mockResolvedValue(null);

            // Spy on console.error to verify logging
            const consoleErrorSpy = jest.spyOn(console, 'error');

            try {
              // Action: Attempt to send notification (will fail)
              await notifyCustomer(customer.id, message.trim(), testTenantId);

              // Assertion: Failure should be logged (Requirement 6.5)
              expect(consoleErrorSpy).toHaveBeenCalled();
              
              const errorLogs = consoleErrorSpy.mock.calls.filter(call =>
                call.some(arg => 
                  typeof arg === 'string' && 
                  arg.includes('Failed to deliver WhatsApp notification')
                )
              );
              expect(errorLogs.length).toBeGreaterThan(0);

              // Verify log contains error details
              const errorLog = errorLogs[0];
              expect(errorLog[0]).toContain(customer.id);
              
              // Verify log object contains required fields
              const logObject = errorLog.find(arg => typeof arg === 'object' && arg !== null);
              expect(logObject).toBeDefined();
              expect(logObject).toHaveProperty('customerId', customer.id);
              expect(logObject).toHaveProperty('phone', uniquePhone);
              expect(logObject).toHaveProperty('timestamp');
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 } // Reduced for faster testing due to retry delays
      );
    }, 180000); // 3 minute timeout

    it('should log each retry attempt', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            message: messageArbitrary,
          }),
          async ({ customerName, phone, message }) => {
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

            // Mock all attempts to fail
            mockSendWhatsAppMessage.mockResolvedValue(null);

            // Spy on console.log and console.warn
            const consoleLogSpy = jest.spyOn(console, 'log');
            const consoleWarnSpy = jest.spyOn(console, 'warn');

            try {
              // Action: Attempt to send notification (will fail)
              await notifyCustomer(customer.id, message.trim(), testTenantId);

              // Assertion: Each attempt should be logged
              const attemptLogs = consoleLogSpy.mock.calls.filter(call =>
                call.some(arg => 
                  typeof arg === 'string' && 
                  arg.includes('Sending WhatsApp notification') &&
                  arg.includes('attempt')
                )
              );
              expect(attemptLogs.length).toBe(3); // 3 attempts

              // Verify each attempt is numbered correctly
              for (let i = 0; i < 3; i++) {
                const attemptLog = attemptLogs[i][0];
                expect(attemptLog).toContain(`attempt ${i + 1}/3`);
              }

              // Verify retry failures are logged
              const retryWarnings = consoleWarnSpy.mock.calls.filter(call =>
                call.some(arg => 
                  typeof arg === 'string' && 
                  arg.includes('WhatsApp notification attempt') &&
                  arg.includes('failed')
                )
              );
              expect(retryWarnings.length).toBe(3); // All 3 attempts failed
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 } // Reduced for faster testing due to retry delays
      );
    }, 180000); // 3 minute timeout
  });

  /**
   * Additional property tests for notification consistency
   */
  describe('Notification Consistency Properties', () => {
    it('should always call WhatsApp service with correct parameters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: customerNameArbitrary,
            phone: phoneArbitrary,
            taskType: taskTypeArbitrary,
            bonusSpins: bonusSpinAmountArbitrary,
          }),
          async ({ customerName, phone, taskType, bonusSpins }) => {
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

            // Mock successful delivery
            mockSendWhatsAppMessage.mockResolvedValue({ success: true });

            try {
              // Action: Send approval notification
              await sendApprovalNotification(
                customer.id,
                taskType,
                bonusSpins,
                testTenantId
              );

              // Assertion: WhatsApp service should be called with correct parameters
              expect(mockSendWhatsAppMessage).toHaveBeenCalledWith(
                uniquePhone,
                expect.any(String),
                testTenantId
              );

              // Verify phone number matches customer
              const calledPhone = mockSendWhatsAppMessage.mock.calls[0][0];
              expect(calledPhone).toBe(uniquePhone);

              // Verify tenant ID is passed correctly
              const calledTenantId = mockSendWhatsAppMessage.mock.calls[0][2];
              expect(calledTenantId).toBe(testTenantId);
            } finally {
              // Cleanup
              await prisma.endUser.delete({
                where: { id: customer.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 120000); // 2 minute timeout
  });
});
