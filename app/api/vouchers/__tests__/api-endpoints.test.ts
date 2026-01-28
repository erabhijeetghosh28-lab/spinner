/**
 * Integration Tests for Voucher API Endpoints
 * 
 * Feature: voucher-redemption-system
 * 
 * Tests the API endpoints for voucher validation, redemption, phone lookup, and admin management.
 * 
 * Requirements: 4.1, 5.1, 6.1, 8.3
 */

import * as voucherService from '@/lib/voucher-service';
import { NextRequest } from 'next/server';
import { POST as lookupPhonePOST } from '../lookup-phone/route';
import { POST as redeemPOST } from '../redeem/route';
import { GET as vouchersGET } from '../route';
import { POST as validatePOST } from '../validate/route';

// Mock the voucher service
jest.mock('@/lib/voucher-service');

const mockVoucherService = voucherService as jest.Mocked<typeof voucherService>;

describe('Voucher API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/vouchers/validate', () => {
    test('should validate a valid voucher successfully', async () => {
      // Mock validation result
      const mockValidationResult: voucherService.ValidationResult = {
        valid: true,
        voucher: {
          code: 'TEST-ABC123456789',
          prize: {
            name: '10% Discount',
            description: 'Get 10% off your next purchase',
          },
          customer: {
            name: 'John Doe',
            phone: '+1234567890',
          },
          expiresAt: new Date('2024-12-31'),
          redemptionCount: 0,
          redemptionLimit: 1,
        },
      };

      mockVoucherService.validateVoucher.mockResolvedValue(mockValidationResult);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-ABC123456789',
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await validatePOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.voucher).toBeDefined();
      expect(data.voucher.code).toBe('TEST-ABC123456789');
      expect(mockVoucherService.validateVoucher).toHaveBeenCalledWith('TEST-ABC123456789', 'tenant-123');
    });

    test('should return invalid for expired voucher', async () => {
      // Mock validation result for expired voucher
      const mockValidationResult: voucherService.ValidationResult = {
        valid: false,
        reason: 'expired',
        details: {
          expiresAt: new Date('2023-12-31'),
        },
      };

      mockVoucherService.validateVoucher.mockResolvedValue(mockValidationResult);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-EXPIRED12345',
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await validatePOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe('expired');
      expect(data.details).toBeDefined();
    });

    test('should return 400 for missing code', async () => {
      // Create request without code
      const request = new NextRequest('http://localhost:3000/api/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await validatePOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Voucher code is required');
      expect(mockVoucherService.validateVoucher).not.toHaveBeenCalled();
    });

    test('should return 400 for missing tenantId', async () => {
      // Create request without tenantId
      const request = new NextRequest('http://localhost:3000/api/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-ABC123456789',
        }),
      });

      // Call endpoint
      const response = await validatePOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Tenant ID is required');
      expect(mockVoucherService.validateVoucher).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/vouchers/redeem', () => {
    test('should redeem a valid voucher successfully', async () => {
      // Mock redemption result
      const mockRedemptionResult: voucherService.RedemptionResult = {
        success: true,
        voucher: {
          id: 'voucher-123',
          code: 'TEST-ABC123456789',
          isRedeemed: true,
          redeemedAt: new Date(),
          redeemedBy: 'merchant-456',
          redemptionCount: 1,
        },
      };

      mockVoucherService.redeemVoucher.mockResolvedValue(mockRedemptionResult);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-ABC123456789',
          merchantId: 'merchant-456',
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await redeemPOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.voucher).toBeDefined();
      expect(mockVoucherService.redeemVoucher).toHaveBeenCalledWith(
        'TEST-ABC123456789',
        'merchant-456',
        'tenant-123'
      );
    });

    test('should return 400 for already redeemed voucher', async () => {
      // Mock redemption result for already redeemed voucher
      const mockRedemptionResult: voucherService.RedemptionResult = {
        success: false,
        error: 'Voucher already redeemed',
      };

      mockVoucherService.redeemVoucher.mockResolvedValue(mockRedemptionResult);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-REDEEMED1234',
          merchantId: 'merchant-456',
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await redeemPOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Voucher already redeemed');
    });

    test('should return 400 for missing required fields', async () => {
      // Create request without merchantId
      const request = new NextRequest('http://localhost:3000/api/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({
          code: 'TEST-ABC123456789',
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await redeemPOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Merchant ID is required');
      expect(mockVoucherService.redeemVoucher).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/vouchers/lookup-phone', () => {
    test('should return vouchers for a phone number', async () => {
      // Mock vouchers result
      const mockVouchers: voucherService.VoucherWithStatus[] = [
        {
          code: 'TEST-ABC123456789',
          prize: {
            name: '10% Discount',
            description: 'Get 10% off',
          },
          status: 'active',
          expiresAt: new Date('2024-12-31'),
          createdAt: new Date('2024-01-01'),
          redemptionCount: 0,
          redemptionLimit: 1,
          qrImageUrl: 'https://example.com/qr.png',
        },
        {
          code: 'TEST-XYZ987654321',
          prize: {
            name: 'Free Item',
            description: 'Get a free item',
          },
          status: 'redeemed',
          expiresAt: new Date('2024-12-31'),
          createdAt: new Date('2024-01-15'),
          redemptionCount: 1,
          redemptionLimit: 1,
          qrImageUrl: null,
        },
      ];

      mockVoucherService.getVouchersByPhone.mockResolvedValue(mockVouchers);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/vouchers/lookup-phone', {
        method: 'POST',
        body: JSON.stringify({
          phone: '+1234567890',
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await lookupPhonePOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.vouchers).toHaveLength(2);
      expect(data.vouchers[0].code).toBe('TEST-ABC123456789');
      expect(data.vouchers[0].status).toBe('active');
      expect(data.vouchers[1].status).toBe('redeemed');
      expect(mockVoucherService.getVouchersByPhone).toHaveBeenCalledWith('+1234567890', 'tenant-123');
    });

    test('should return empty array for phone with no vouchers', async () => {
      // Mock empty result
      mockVoucherService.getVouchersByPhone.mockResolvedValue([]);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/vouchers/lookup-phone', {
        method: 'POST',
        body: JSON.stringify({
          phone: '+9999999999',
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await lookupPhonePOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.vouchers).toEqual([]);
    });

    test('should return 400 for missing phone', async () => {
      // Create request without phone
      const request = new NextRequest('http://localhost:3000/api/vouchers/lookup-phone', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: 'tenant-123',
        }),
      });

      // Call endpoint
      const response = await lookupPhonePOST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Phone number is required');
      expect(mockVoucherService.getVouchersByPhone).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/vouchers (admin)', () => {
    test('should return vouchers list with statistics', async () => {
      // Mock vouchers result
      const mockVouchersResult: voucherService.VoucherListResponse = {
        vouchers: [
          {
            id: 'voucher-1',
            code: 'TEST-ABC123456789',
            customer: {
              name: 'John Doe',
              phone: '+1234567890',
            },
            prize: {
              name: '10% Discount',
              description: 'Get 10% off',
            },
            status: 'active',
            createdAt: new Date('2024-01-01'),
            expiresAt: new Date('2024-12-31'),
            redemptionCount: 0,
            redemptionLimit: 1,
            redeemedAt: null,
            redeemedBy: null,
            qrImageUrl: 'https://example.com/qr.png',
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      };

      const mockStats: voucherService.VoucherStats = {
        total: 10,
        active: 5,
        redeemed: 3,
        expired: 2,
      };

      mockVoucherService.getVouchers.mockResolvedValue(mockVouchersResult);
      mockVoucherService.getVoucherStats.mockResolvedValue(mockStats);

      // Create request
      const request = new NextRequest(
        'http://localhost:3000/api/vouchers?tenantId=tenant-123&status=all&page=1&limit=50'
      );

      // Call endpoint
      const response = await vouchersGET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.vouchers).toHaveLength(1);
      expect(data.stats).toEqual(mockStats);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      });
      expect(mockVoucherService.getVouchers).toHaveBeenCalledWith('tenant-123', {
        status: 'all',
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 1,
        limit: 50,
      });
    });

    test('should filter vouchers by status', async () => {
      // Mock filtered result
      const mockVouchersResult: voucherService.VoucherListResponse = {
        vouchers: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };

      const mockStats: voucherService.VoucherStats = {
        total: 10,
        active: 5,
        redeemed: 3,
        expired: 2,
      };

      mockVoucherService.getVouchers.mockResolvedValue(mockVouchersResult);
      mockVoucherService.getVoucherStats.mockResolvedValue(mockStats);

      // Create request with status filter
      const request = new NextRequest(
        'http://localhost:3000/api/vouchers?tenantId=tenant-123&status=redeemed'
      );

      // Call endpoint
      const response = await vouchersGET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(mockVoucherService.getVouchers).toHaveBeenCalledWith('tenant-123', {
        status: 'redeemed',
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 1,
        limit: 50,
      });
    });

    test('should search vouchers by code or phone', async () => {
      // Mock search result
      const mockVouchersResult: voucherService.VoucherListResponse = {
        vouchers: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };

      const mockStats: voucherService.VoucherStats = {
        total: 10,
        active: 5,
        redeemed: 3,
        expired: 2,
      };

      mockVoucherService.getVouchers.mockResolvedValue(mockVouchersResult);
      mockVoucherService.getVoucherStats.mockResolvedValue(mockStats);

      // Create request with search parameter
      const request = new NextRequest(
        'http://localhost:3000/api/vouchers?tenantId=tenant-123&search=TEST-ABC'
      );

      // Call endpoint
      const response = await vouchersGET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(mockVoucherService.getVouchers).toHaveBeenCalledWith('tenant-123', {
        status: 'all',
        search: 'TEST-ABC',
        startDate: undefined,
        endDate: undefined,
        page: 1,
        limit: 50,
      });
    });

    test('should return 400 for missing tenantId', async () => {
      // Create request without tenantId
      const request = new NextRequest('http://localhost:3000/api/vouchers');

      // Call endpoint
      const response = await vouchersGET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Tenant ID is required');
      expect(mockVoucherService.getVouchers).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid date format', async () => {
      // Create request with invalid date
      const request = new NextRequest(
        'http://localhost:3000/api/vouchers?tenantId=tenant-123&startDate=invalid-date'
      );

      // Call endpoint
      const response = await vouchersGET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid start date format');
    });

    test('should return 400 for invalid pagination parameters', async () => {
      // Create request with invalid page number
      const request = new NextRequest(
        'http://localhost:3000/api/vouchers?tenantId=tenant-123&page=0'
      );

      // Call endpoint
      const response = await vouchersGET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid page number');
    });
  });
});
