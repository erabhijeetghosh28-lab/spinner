/**
 * Integration Tests for Limit Enforcement in Spin/Voucher Flows
 * 
 * Feature: super-admin-controls
 * Task: 3.3 Write integration tests for limit enforcement in spin/voucher flows
 * 
 * Tests the complete flow from API endpoint through to database:
 * - Spin rejection at limit
 * - Voucher creation rejection at limit
 * - Successful operations under limit
 * 
 * Requirements: 1.3, 1.4
 */

import prisma from '@/lib/prisma';
import { usageService } from '@/lib/usage-service';
import { NextRequest } from 'next/server';
import { POST as spinPOST } from '../spin/route';

// Mock WhatsApp service to avoid actual API calls
jest.mock('@/lib/whatsapp', () => ({
  sendPrizeNotification: jest.fn().mockResolvedValue(null),
  sendVoucherNotification: jest.fn().mockResolvedValue(null),
}));

// Mock QR generator to avoid actual uploads
jest.mock('@/lib/qr-generator', () => ({
  generateQRCode: jest.fn().mockResolvedValue('https://example.com/qr-test.png'),
  createAndUploadQR: jest.fn().mockResolvedValue('https://example.com/qr-test.png'),
}));

describe('Limit Enforcement Integration Tests', () => {
  let testTenant: any;
  let testCampaign: any;
  let testUser: any;
  let testPrize: any;
  let testPlan: any;
  let testSubscriptionPlan: any;
  let testAdmin: any;

  beforeEach(async () => {
    // Create test subscription plan with low limits for testing
    testSubscriptionPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Test Plan',
        price: 0,
        interval: 'MONTHLY',
        spinsPerMonth: 2, // Low limit for easy testing
        vouchersPerMonth: 2, // Low limit for easy testing
      },
    });

    // Create test plan (legacy)
    testPlan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test admin for overrides
    testAdmin = await prisma.admin.create({
      data: {
        email: `test-admin-${Date.now()}@example.com`,
        name: 'Test Admin',
        password: 'test-password',
      },
    });

    // Create test tenant with subscription plan
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        slug: 'test-tenant-' + Date.now(),
        planId: testPlan.id,
        subscriptionPlanId: testSubscriptionPlan.id,
      },
    });

    // Create test campaign
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    
    testCampaign = await prisma.campaign.create({
      data: {
        name: 'Test Campaign',
        tenantId: testTenant.id,
        spinLimit: 10,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        startDate: now,
        endDate: endDate,
      },
    });

    // Create test user
    testUser = await prisma.endUser.create({
      data: {
        phone: '9876543210',
        name: 'Test User',
        tenantId: testTenant.id,
      },
    });

    // Create test prize with voucher settings
    testPrize = await prisma.prize.create({
      data: {
        name: 'Test Prize',
        description: 'A test prize',
        campaignId: testCampaign.id,
        probability: 100,
        position: 1,
        isActive: true,
        voucherValidityDays: 30,
        voucherRedemptionLimit: 1,
        sendQRCode: true,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.voucher.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.spin.deleteMany({ where: { campaignId: testCampaign.id } });
    await prisma.prize.deleteMany({ where: { campaignId: testCampaign.id } });
    await prisma.endUser.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.campaign.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.tenantLimitOverride.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.monthlyUsage.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.tenant.delete({ where: { id: testTenant.id } });
    await prisma.plan.delete({ where: { id: testPlan.id } });
    await prisma.subscriptionPlan.delete({ where: { id: testSubscriptionPlan.id } });
    await prisma.admin.delete({ where: { id: testAdmin.id } });
    
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Spin Limit Enforcement', () => {
    it('should allow spin when under limit', async () => {
      // Verify we're under limit
      const canSpin = await usageService.canSpin(testTenant.id);
      expect(canSpin).toBe(true);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      // Call spin endpoint
      const response = await spinPOST(request);
      const data = await response.json();

      // Verify spin succeeded
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.prize).toBeDefined();

      // Verify usage was incremented
      const usage = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usage.spinsUsed).toBe(1);
    }, 30000);

    it('should reject spin when at limit', async () => {
      // Use up the spin limit (2 spins)
      await usageService.incrementSpins(testTenant.id);
      await usageService.incrementSpins(testTenant.id);

      // Verify we're at limit
      const usage = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usage.spinsUsed).toBe(2);

      const canSpin = await usageService.canSpin(testTenant.id);
      expect(canSpin).toBe(false);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      // Call spin endpoint
      const response = await spinPOST(request);
      const data = await response.json();

      // Verify spin was rejected
      expect(response.status).toBe(429);
      expect(data.error).toContain('Monthly spin limit reached');

      // Verify usage was NOT incremented
      const usageAfter = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usageAfter.spinsUsed).toBe(2); // Still 2, not 3
    });

    it('should reject spin when exceeding limit', async () => {
      // Manually set usage above limit
      const now = new Date();
      await prisma.monthlyUsage.upsert({
        where: {
          tenantId_month_year: {
            tenantId: testTenant.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: {
          spinsUsed: 5, // Above limit of 2
        },
        create: {
          tenantId: testTenant.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          spinsUsed: 5,
          vouchersUsed: 0,
        },
      });

      // Verify we're over limit
      const canSpin = await usageService.canSpin(testTenant.id);
      expect(canSpin).toBe(false);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      // Call spin endpoint
      const response = await spinPOST(request);
      const data = await response.json();

      // Verify spin was rejected
      expect(response.status).toBe(429);
      expect(data.error).toContain('Monthly spin limit reached');

      // Verify usage was NOT incremented
      const usageAfter = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usageAfter.spinsUsed).toBe(5); // Still 5, not 6
    });

    it('should allow multiple spins up to limit', async () => {
      // First spin - should succeed
      const request1 = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      const response1 = await spinPOST(request1);
      expect(response1.status).toBe(200);

      // Second spin - should succeed (at limit)
      const request2 = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      const response2 = await spinPOST(request2);
      expect(response2.status).toBe(200);

      // Verify usage is at limit
      const usage = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usage.spinsUsed).toBe(2);

      // Third spin - should fail
      const request3 = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      const response3 = await spinPOST(request3);
      expect(response3.status).toBe(429);

      // Verify usage is still at limit
      const usageAfter = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usageAfter.spinsUsed).toBe(2);
    }, 30000);
  });

  describe('Voucher Creation Limit Enforcement', () => {
    it('should allow voucher creation when under limit', async () => {
      // Verify we're under limit
      const canCreate = await usageService.canCreateVoucher(testTenant.id);
      expect(canCreate).toBe(true);

      // Create a spin (prerequisite for voucher)
      const spin = await prisma.spin.create({
        data: {
          userId: testUser.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      // Create request for spin that triggers voucher creation
      const request = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      // Call spin endpoint (which creates voucher)
      const response = await spinPOST(request);
      const data = await response.json();

      // Verify spin succeeded
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify voucher was created
      const vouchers = await prisma.voucher.findMany({
        where: { tenantId: testTenant.id },
      });
      expect(vouchers.length).toBeGreaterThan(0);

      // Verify voucher usage was incremented
      const usage = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usage.vouchersUsed).toBeGreaterThan(0);
    }, 30000);

    it('should reject voucher creation when at limit', async () => {
      // Use up the voucher limit (2 vouchers)
      await usageService.incrementVouchers(testTenant.id);
      await usageService.incrementVouchers(testTenant.id);

      // Verify we're at limit
      const usage = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usage.vouchersUsed).toBe(2);

      const canCreate = await usageService.canCreateVoucher(testTenant.id);
      expect(canCreate).toBe(false);

      // Try to create voucher directly (simulating what spin endpoint does)
      const { createVoucher } = await import('@/lib/voucher-service');
      
      const spin = await prisma.spin.create({
        data: {
          userId: testUser.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      // Attempt to create voucher - should fail
      await expect(
        createVoucher({
          spinId: spin.id,
          prizeId: testPrize.id,
          userId: testUser.id,
          tenantId: testTenant.id,
          tenantSlug: testTenant.slug,
          validityDays: 30,
          redemptionLimit: 1,
          generateQR: true,
        })
      ).rejects.toThrow('Voucher creation limit exceeded');

      // Verify usage was NOT incremented
      const usageAfter = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usageAfter.vouchersUsed).toBe(2); // Still 2, not 3
    });

    it('should reject voucher creation when exceeding limit', async () => {
      // Manually set usage above limit
      const now = new Date();
      await prisma.monthlyUsage.upsert({
        where: {
          tenantId_month_year: {
            tenantId: testTenant.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: {
          vouchersUsed: 5, // Above limit of 2
        },
        create: {
          tenantId: testTenant.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          spinsUsed: 0,
          vouchersUsed: 5,
        },
      });

      // Verify we're over limit
      const canCreate = await usageService.canCreateVoucher(testTenant.id);
      expect(canCreate).toBe(false);

      // Try to create voucher
      const { createVoucher } = await import('@/lib/voucher-service');
      
      const spin = await prisma.spin.create({
        data: {
          userId: testUser.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      // Attempt to create voucher - should fail
      await expect(
        createVoucher({
          spinId: spin.id,
          prizeId: testPrize.id,
          userId: testUser.id,
          tenantId: testTenant.id,
          tenantSlug: testTenant.slug,
          validityDays: 30,
          redemptionLimit: 1,
          generateQR: true,
        })
      ).rejects.toThrow('Voucher creation limit exceeded');

      // Verify usage was NOT incremented
      const usageAfter = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usageAfter.vouchersUsed).toBe(5); // Still 5, not 6
    });

    it('should allow multiple voucher creations up to limit', async () => {
      // Create first voucher
      const { createVoucher } = await import('@/lib/voucher-service');
      
      const spin1 = await prisma.spin.create({
        data: {
          userId: testUser.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      const voucher1 = await createVoucher({
        spinId: spin1.id,
        prizeId: testPrize.id,
        userId: testUser.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: 30,
        redemptionLimit: 1,
        generateQR: true,
      });

      expect(voucher1).toBeDefined();

      // Create second voucher (at limit)
      const spin2 = await prisma.spin.create({
        data: {
          userId: testUser.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      const voucher2 = await createVoucher({
        spinId: spin2.id,
        prizeId: testPrize.id,
        userId: testUser.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: 30,
        redemptionLimit: 1,
        generateQR: true,
      });

      expect(voucher2).toBeDefined();

      // Verify usage is at limit
      const usage = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usage.vouchersUsed).toBe(2);

      // Try to create third voucher - should fail
      const spin3 = await prisma.spin.create({
        data: {
          userId: testUser.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      await expect(
        createVoucher({
          spinId: spin3.id,
          prizeId: testPrize.id,
          userId: testUser.id,
          tenantId: testTenant.id,
          tenantSlug: testTenant.slug,
          validityDays: 30,
          redemptionLimit: 1,
          generateQR: true,
        })
      ).rejects.toThrow('Voucher creation limit exceeded');

      // Verify usage is still at limit
      const usageAfter = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usageAfter.vouchersUsed).toBe(2);
    }, 30000);
  });

  describe('Combined Spin and Voucher Limit Enforcement', () => {
    it('should enforce both spin and voucher limits independently', async () => {
      // Use up spin limit
      await usageService.incrementSpins(testTenant.id);
      await usageService.incrementSpins(testTenant.id);

      // Verify spin limit reached but voucher limit not reached
      const canSpin = await usageService.canSpin(testTenant.id);
      const canCreateVoucher = await usageService.canCreateVoucher(testTenant.id);
      
      expect(canSpin).toBe(false);
      expect(canCreateVoucher).toBe(true);

      // Try to spin - should fail
      const request = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      const response = await spinPOST(request);
      expect(response.status).toBe(429);

      // Verify voucher creation would still work (if we had a spin)
      const { createVoucher } = await import('@/lib/voucher-service');
      
      const spin = await prisma.spin.create({
        data: {
          userId: testUser.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      const voucher = await createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testUser.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: 30,
        redemptionLimit: 1,
        generateQR: true,
      });

      expect(voucher).toBeDefined();
    }, 30000);

    it('should allow spin but reject voucher when voucher limit reached', async () => {
      // Use up voucher limit
      await usageService.incrementVouchers(testTenant.id);
      await usageService.incrementVouchers(testTenant.id);

      // Verify voucher limit reached but spin limit not reached
      const canSpin = await usageService.canSpin(testTenant.id);
      const canCreateVoucher = await usageService.canCreateVoucher(testTenant.id);
      
      expect(canSpin).toBe(true);
      expect(canCreateVoucher).toBe(false);

      // Spin should succeed (but voucher creation will fail silently in the endpoint)
      const request = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      const response = await spinPOST(request);
      const data = await response.json();

      // Spin succeeds
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify spin was recorded
      const usage = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usage.spinsUsed).toBe(1);

      // Verify voucher was NOT created (because limit was reached)
      // Note: The spin endpoint catches voucher creation errors and logs them
      // but doesn't fail the spin itself
      const vouchers = await prisma.voucher.findMany({
        where: { tenantId: testTenant.id },
      });
      expect(vouchers.length).toBe(0);
    });
  });

  describe('Limit Enforcement with Overrides', () => {
    it('should allow operations when bonus limits are granted', async () => {
      // Use up base limit
      await usageService.incrementSpins(testTenant.id);
      await usageService.incrementSpins(testTenant.id);

      // Verify at limit
      let canSpin = await usageService.canSpin(testTenant.id);
      expect(canSpin).toBe(false);

      // Grant bonus spins
      await prisma.tenantLimitOverride.create({
        data: {
          tenantId: testTenant.id,
          bonusSpins: 5,
          bonusVouchers: 0,
          reason: 'Test bonus',
          grantedBy: testAdmin.id,
          isActive: true,
        },
      });

      // Verify can spin again
      canSpin = await usageService.canSpin(testTenant.id);
      expect(canSpin).toBe(true);

      // Spin should succeed
      const request = new NextRequest('http://localhost:3000/api/spin', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          campaignId: testCampaign.id,
          isReferralBonus: false,
        }),
      });

      const response = await spinPOST(request);
      expect(response.status).toBe(200);

      // Verify usage incremented
      const usage = await usageService.getCurrentMonthUsage(testTenant.id);
      expect(usage.spinsUsed).toBe(3); // 2 from before + 1 new
    }, 30000);
  });
});
