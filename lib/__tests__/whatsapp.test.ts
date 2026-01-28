/**
 * Property-Based and Unit Tests for WhatsApp Service
 * 
 * Feature: voucher-redemption-system
 */

import * as fc from 'fast-check';

// Mock axios before importing whatsapp module
jest.mock('axios');

// Mock prisma before importing whatsapp module
jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    tenant: {
      findUnique: jest.fn(),
    },
    setting: {
      findMany: jest.fn(),
    },
  },
}));

import axios from 'axios';
import prisma from '../prisma';
import { sendVoucherNotification } from '../whatsapp';

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('WhatsApp Voucher Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock prisma responses
    mockPrisma.tenant.findUnique.mockResolvedValue(null);
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'WHATSAPP_API_URL', value: 'https://test.api.com/send' } as any,
      { key: 'WHATSAPP_API_KEY', value: 'test-api-key' } as any,
      { key: 'WHATSAPP_SENDER', value: 'test-sender' } as any,
    ]);
    
    // Mock axios post to succeed by default
    mockAxios.post.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 7: WhatsApp Notification Content
   * 
   * For any voucher created, the WhatsApp notification should include 
   * the voucher code, prize name, expiration date, and (if present) 
   * the QR image URL.
   * 
   * **Validates: Requirements 1.7, 11.2, 11.3, 11.4, 11.5**
   */
  describe('Property 7: WhatsApp Notification Content', () => {
    test('notification includes voucher code, prize name, and expiration date', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary voucher data
          fc.record({
            code: fc.stringMatching(/^[A-Z0-9]{4}-[A-Z0-9]{12}$/),
            prize: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            expiresAt: fc.date({ min: new Date() }), // Future dates only
            qrImageUrl: fc.option(fc.webUrl(), { nil: null }),
          }),
          fc.string({ minLength: 10, maxLength: 15 }), // Phone number
          fc.uuid(), // Tenant ID
          async (voucher, customerPhone, tenantId) => {
            // Clear mocks before each property test run
            mockAxios.post.mockClear();
            
            // Call sendVoucherNotification
            await sendVoucherNotification(voucher, customerPhone, tenantId);

            // Verify axios.post was called
            expect(mockAxios.post).toHaveBeenCalledTimes(1);
            
            // Get the message that was sent
            const callArgs = mockAxios.post.mock.calls[0];
            const requestBody = callArgs[1];
            const sentMessage = requestBody.message;

            // Requirement 11.3: Message should include voucher code
            expect(sentMessage).toContain(voucher.code);

            // Requirement 11.4: Message should include prize name
            expect(sentMessage).toContain(voucher.prize.name);

            // Requirement 11.5: Message should include expiration date
            const expirationDate = new Date(voucher.expiresAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            expect(sentMessage).toContain(expirationDate);

            // Requirement 11.2: If QR image URL is present, it should be included
            if (voucher.qrImageUrl) {
              expect(sentMessage).toContain(voucher.qrImageUrl);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('notification message format is consistent', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            code: fc.stringMatching(/^[A-Z0-9]{4}-[A-Z0-9]{12}$/),
            prize: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            expiresAt: fc.date({ min: new Date() }),
            qrImageUrl: fc.option(fc.webUrl(), { nil: null }),
          }),
          fc.string({ minLength: 10, maxLength: 15 }),
          fc.uuid(),
          async (voucher, customerPhone, tenantId) => {
            // Clear mocks before each property test run
            mockAxios.post.mockClear();
            
            await sendVoucherNotification(voucher, customerPhone, tenantId);

            const callArgs = mockAxios.post.mock.calls[0];
            const requestBody = callArgs[1];
            const sentMessage = requestBody.message;

            // Message should have a greeting
            expect(sentMessage).toMatch(/congratulations/i);

            // Message should have clear structure with voucher code
            expect(sentMessage).toMatch(/voucher code/i);

            // Message should mention validity
            expect(sentMessage).toMatch(/valid until/i);

            // Message should have a call to action
            expect(sentMessage).toMatch(/show this code|claim your prize/i);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Unit Test: WhatsApp Failure Handling
   * 
   * Tests that voucher notification succeeds even when WhatsApp delivery fails.
   * The system should log the error but not throw an exception.
   * 
   * **Validates: Requirement 11.6**
   */
  describe('WhatsApp Failure Handling', () => {
    test('logs error but does not throw when WhatsApp delivery fails', async () => {
      // Mock axios to reject (simulate WhatsApp API failure)
      mockAxios.post.mockRejectedValue(new Error('WhatsApp API unavailable'));

      const voucher = {
        code: 'TEST-ABC123DEF456',
        prize: { name: 'Test Prize' },
        expiresAt: new Date('2025-12-31'),
        qrImageUrl: null,
      };
      const customerPhone = '1234567890';
      const tenantId = 'test-tenant-id';

      // Spy on console.error to verify error is logged
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Call sendVoucherNotification - should not throw
      await expect(
        sendVoucherNotification(voucher, customerPhone, tenantId)
      ).resolves.not.toThrow();

      // Verify error was logged (the sendWhatsAppMessage function logs errors)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error sending WhatsApp message')
      );

      // Verify axios was called (attempt was made)
      expect(mockAxios.post).toHaveBeenCalled();
    });

    test('logs error with phone number when WhatsApp fails', async () => {
      const errorMessage = 'Network timeout';
      mockAxios.post.mockRejectedValue(new Error(errorMessage));

      const voucher = {
        code: 'FAIL-XYZ789ABC123',
        prize: { name: 'Another Prize' },
        expiresAt: new Date('2026-01-15'),
        qrImageUrl: 'https://example.com/qr.png',
      };
      const customerPhone = '9876543210';
      const tenantId = 'another-tenant';

      const consoleErrorSpy = jest.spyOn(console, 'error');

      await sendVoucherNotification(voucher, customerPhone, tenantId);

      // Verify error log contains phone number information
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error sending WhatsApp message')
      );
      
      // Check that phone number appears in one of the error logs
      const errorCalls = consoleErrorSpy.mock.calls;
      const hasPhoneInLogs = errorCalls.some(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('91' + customerPhone))
      );
      expect(hasPhoneInLogs).toBe(true);
    });

    test('succeeds when WhatsApp delivery is successful', async () => {
      // Mock successful WhatsApp delivery
      mockAxios.post.mockResolvedValue({ data: { success: true, messageId: '123' } });

      const voucher = {
        code: 'GOOD-123456789AB',
        prize: { name: 'Success Prize' },
        expiresAt: new Date('2025-06-30'),
        qrImageUrl: null,
      };
      const customerPhone = '5555555555';
      const tenantId = 'success-tenant';

      const consoleLogSpy = jest.spyOn(console, 'log');
      const consoleErrorSpy = jest.spyOn(console, 'error');

      await sendVoucherNotification(voucher, customerPhone, tenantId);

      // Verify success was logged (check for the voucher notification success message)
      const logCalls = consoleLogSpy.mock.calls;
      const hasSuccessLog = logCalls.some(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('Voucher notification sent'))
      );
      expect(hasSuccessLog).toBe(true);

      // Verify no WhatsApp error was logged
      const errorCalls = consoleErrorSpy.mock.calls;
      const hasWhatsAppError = errorCalls.some(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('Error sending WhatsApp message'))
      );
      expect(hasWhatsAppError).toBe(false);
    });
  });
});
