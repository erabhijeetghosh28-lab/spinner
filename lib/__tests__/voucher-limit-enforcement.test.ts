/**
 * Integration Tests: Voucher Creation Limit Enforcement
 * 
 * Feature: super-admin-controls
 * 
 * Tests that voucher creation respects subscription limits:
 * 1. Voucher creation succeeds when under limit
 * 2. Voucher creation fails when at or over limit
 * 3. Usage counter increments after successful creation
 * 
 * Requirements: 1.4, 2.3
 */

import prisma from '@/lib/prisma';
import { usageService } from '@/lib/usage-service';
import { createVoucher } from '@/lib/voucher-service';

// Mock QR generator to avoid actual uploads
jest.mock('@/lib/qr-generator', () => ({
  generateVoucherCode: jest.requireActual('@/lib/voucher-service').generateVoucherCode,
  createAndUploadQR: jest.fn().mockResolvedValue('https://example.com/qr/test.png'),
}));

describe('Integration: Voucher Creation Limit Enforcement', () => {
  jest.setTimeout(30000);
  
  let testTenant: any;
  let testCampaign: any;
  let testCustomer: any;
  let testPrize: any;
  let testPlan: any;
  let testSubscriptionPlan: any;

  beforeEach(async () => {
    // Create test plan
    testPlan = await prisma.plan.create({
      data: {
        name: 'Limit Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test subscription plan with low voucher limit for testing
    testSubscriptionPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Test Plan',
        price: 0,
        interval: 'MONTHLY',
        spinsPerMonth: 10000,
        vouchersPerMonth: 2, // Low limit for testing
      },
    });

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Limit Test Tenant',
        slug: 'limit-test-' + Date.now(),
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
        name: 'Limit Test Campaign',
        tenantId: testTenant.id,
        spinLimit: 10,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        startDate: now,
        endDate: endDate,
      },
    });

    // Create test customer
    testCustomer = await prisma.endUser.create({
      data: {
        phone: '+1555999888',
        name: 'Limit Test Customer',
        tenantId: testTenant.id,
      },
    });

    // Create test prize
    testPrize = await prisma.prize.create({
      data: {
        name: 'Test Prize',
        description: 'Test prize for limit testing',
        campaignId: testCampaign.id,
        probability: 100,
        position: 1,
        isActive: true,
        voucherValidityDays: 30,
        voucherRedemptionLimit: 1,
        sendQRCode: false,
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
    await prisma.monthlyUsage.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.tenant.delete({ where: { id: testTenant.id } });
    await prisma.plan.delete({ where: { id: testPlan.id } });
    await prisma.subscriptionPlan.delete({ where: { id: testSubscriptionPlan.id } });
  });

  it('should allow voucher creation when under limit', async () => {
    // Verify we can create vouchers
    const canCreate = await usageService.canCreateVoucher(testTenant.id);
    expect(canCreate).toBe(true);

    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Create voucher - should succeed
    const voucher = await createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: 30,
      redemptionLimit: 1,
      generateQR: false,
    });

    // Verify voucher was created
    expect(voucher).toBeDefined();
    expect(voucher.code).toBeDefined();
    expect(voucher.tenantId).toBe(testTenant.id);

    // Verify usage was incremented
    const usage = await usageService.getCurrentMonthUsage(testTenant.id);
    expect(usage.vouchersUsed).toBe(1);
  });

  it('should reject voucher creation when at limit', async () => {
    // Create vouchers up to the limit (2)
    for (let i = 0; i < 2; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: testCustomer.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      await createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: 30,
        redemptionLimit: 1,
        generateQR: false,
      });
    }

    // Verify we're at the limit
    const usage = await usageService.getCurrentMonthUsage(testTenant.id);
    expect(usage.vouchersUsed).toBe(2);

    // Verify canCreateVoucher returns false
    const canCreate = await usageService.canCreateVoucher(testTenant.id);
    expect(canCreate).toBe(false);

    // Try to create another voucher - should fail
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    await expect(
      createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: 30,
        redemptionLimit: 1,
        generateQR: false,
      })
    ).rejects.toThrow('Voucher creation limit exceeded for this month');

    // Verify usage counter was not incremented
    const finalUsage = await usageService.getCurrentMonthUsage(testTenant.id);
    expect(finalUsage.vouchersUsed).toBe(2); // Still 2, not 3
  });

  it('should increment usage counter after successful creation', async () => {
    // Check initial usage
    const initialUsage = await usageService.getCurrentMonthUsage(testTenant.id);
    expect(initialUsage.vouchersUsed).toBe(0);

    // Create first voucher
    const spin1 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    await createVoucher({
      spinId: spin1.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: 30,
      redemptionLimit: 1,
      generateQR: false,
    });

    // Check usage after first voucher
    const usage1 = await usageService.getCurrentMonthUsage(testTenant.id);
    expect(usage1.vouchersUsed).toBe(1);

    // Create second voucher
    const spin2 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    await createVoucher({
      spinId: spin2.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: 30,
      redemptionLimit: 1,
      generateQR: false,
    });

    // Check usage after second voucher
    const usage2 = await usageService.getCurrentMonthUsage(testTenant.id);
    expect(usage2.vouchersUsed).toBe(2);
  });

  it('should return appropriate error message when limit exceeded', async () => {
    // Create vouchers up to the limit
    for (let i = 0; i < 2; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: testCustomer.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      await createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: 30,
        redemptionLimit: 1,
        generateQR: false,
      });
    }

    // Try to create another voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Verify error message
    try {
      await createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: 30,
        redemptionLimit: 1,
        generateQR: false,
      });
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Voucher creation limit exceeded for this month');
    }
  });
});
