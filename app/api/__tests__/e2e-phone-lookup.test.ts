/**
 * End-to-End Tests: Phone Lookup Flow
 * 
 * Feature: voucher-redemption-system
 * 
 * Tests the phone lookup functionality:
 * 1. Create multiple vouchers for a customer
 * 2. Lookup vouchers by phone number
 * 3. Verify results include correct status
 * 4. Redeem vouchers found via phone lookup
 * 
 * Requirements: 6.1, 5.1
 */

import prisma from '@/lib/prisma';
import * as voucherService from '@/lib/voucher-service';

// Mock QR generator to avoid actual uploads
jest.mock('@/lib/qr-generator', () => ({
  generateVoucherCode: jest.requireActual('@/lib/voucher-service').generateVoucherCode,
  createAndUploadQR: jest.fn().mockResolvedValue('https://example.com/qr/test.png'),
}));

describe('E2E: Phone Lookup Flow', () => {
  // Increase timeout for E2E tests
  jest.setTimeout(30000);
  let testTenant: any;
  let testCampaign: any;
  let testCustomer: any;
  let testMerchant: any;
  let testPrize1: any;
  let testPrize2: any;
  let testPlan: any;
  let testSubscriptionPlan: any;

  beforeEach(async () => {
    // Create test plan
    testPlan = await prisma.plan.create({
      data: {
        name: 'Phone Lookup Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test subscription plan for usage tracking
    testSubscriptionPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Test Plan',
        price: 0,
        interval: 'MONTHLY',
        spinsPerMonth: 10000,
        vouchersPerMonth: 5000,
      },
    });

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Phone Lookup Test Tenant',
        slug: 'phone-lookup-' + Date.now(),
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
        name: 'Phone Lookup Test Campaign',
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
        phone: '+1555123456',
        name: 'Phone Lookup Customer',
        tenantId: testTenant.id,
      },
    });

    // Create test merchant
    testMerchant = await prisma.tenantAdmin.create({
      data: {
        email: 'merchant-lookup@test.com',
        name: 'Lookup Merchant',
        password: 'hashed_password',
        tenantId: testTenant.id,
      },
    });

    // Create test prizes
    testPrize1 = await prisma.prize.create({
      data: {
        name: 'Prize 1',
        description: 'First prize',
        campaignId: testCampaign.id,
        probability: 100,
        position: 1,
        isActive: true,
        voucherValidityDays: 30,
        voucherRedemptionLimit: 1,
        sendQRCode: true,
      },
    });

    testPrize2 = await prisma.prize.create({
      data: {
        name: 'Prize 2',
        description: 'Second prize',
        campaignId: testCampaign.id,
        probability: 100,
        position: 2,
        isActive: true,
        voucherValidityDays: 7,
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
    await prisma.tenantAdmin.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.campaign.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.monthlyUsage.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.tenant.delete({ where: { id: testTenant.id } });
    await prisma.plan.delete({ where: { id: testPlan.id } });
    await prisma.subscriptionPlan.delete({ where: { id: testSubscriptionPlan.id } });
  });

  it('should lookup vouchers by phone number and display correct status', async () => {
    // Create multiple vouchers for the customer
    const spin1 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: testPrize1.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize1.voucherValidityDays,
      redemptionLimit: testPrize1.voucherRedemptionLimit,
      generateQR: testPrize1.sendQRCode,
    });

    const spin2 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize2.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher2 = await voucherService.createVoucher({
      spinId: spin2.id,
      prizeId: testPrize2.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize2.voucherValidityDays,
      redemptionLimit: testPrize2.voucherRedemptionLimit,
      generateQR: testPrize2.sendQRCode,
    });

    // Lookup vouchers by phone
    const vouchers = await voucherService.getVouchersByPhone(
      testCustomer.phone,
      testTenant.id
    );

    // Verify results
    expect(vouchers).toHaveLength(2);
    
    // Both should be active initially
    const activeVouchers = vouchers.filter(v => v.status === 'active');
    expect(activeVouchers).toHaveLength(2);

    // Verify voucher details
    const foundVoucher1 = vouchers.find(v => v.code === voucher1.code);
    const foundVoucher2 = vouchers.find(v => v.code === voucher2.code);

    expect(foundVoucher1).toBeDefined();
    expect(foundVoucher1?.prize.name).toBe(testPrize1.name);
    expect(foundVoucher1?.status).toBe('active');

    expect(foundVoucher2).toBeDefined();
    expect(foundVoucher2?.prize.name).toBe(testPrize2.name);
    expect(foundVoucher2?.status).toBe('active');
  });

  it('should show redeemed status after redemption', async () => {
    // Create voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize1.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize1.voucherValidityDays,
      redemptionLimit: testPrize1.voucherRedemptionLimit,
      generateQR: testPrize1.sendQRCode,
    });

    // Lookup before redemption
    const vouchersBefore = await voucherService.getVouchersByPhone(
      testCustomer.phone,
      testTenant.id
    );

    expect(vouchersBefore).toHaveLength(1);
    expect(vouchersBefore[0].status).toBe('active');

    // Redeem voucher
    await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );

    // Lookup after redemption
    const vouchersAfter = await voucherService.getVouchersByPhone(
      testCustomer.phone,
      testTenant.id
    );

    expect(vouchersAfter).toHaveLength(1);
    expect(vouchersAfter[0].status).toBe('redeemed');
    expect(vouchersAfter[0].code).toBe(voucher.code);
  });

  it('should show expired status for expired vouchers', async () => {
    // Create voucher with very short validity (will be expired)
    const expiredPrize = await prisma.prize.create({
      data: {
        name: 'Expired Prize',
        description: 'This will be expired',
        campaignId: testCampaign.id,
        probability: 100,
        position: 3,
        isActive: true,
        voucherValidityDays: 1, // 1 day validity
        voucherRedemptionLimit: 1,
        sendQRCode: true,
      },
    });

    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: expiredPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Create voucher with past expiration date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

    const expiredVoucher = await prisma.voucher.create({
      data: {
        code: await voucherService.generateVoucherCode(testTenant.slug),
        spinId: spin.id,
        prizeId: expiredPrize.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        expiresAt: pastDate, // Already expired
        redemptionLimit: 1,
        redemptionCount: 0,
        isRedeemed: false,
      },
    });

    // Lookup vouchers
    const vouchers = await voucherService.getVouchersByPhone(
      testCustomer.phone,
      testTenant.id
    );

    // Find the expired voucher
    const foundExpired = vouchers.find(v => v.code === expiredVoucher.code);
    expect(foundExpired).toBeDefined();
    expect(foundExpired?.status).toBe('expired');
  });

  it('should allow redemption of voucher found via phone lookup', async () => {
    // Create voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize1.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize1.voucherValidityDays,
      redemptionLimit: testPrize1.voucherRedemptionLimit,
      generateQR: testPrize1.sendQRCode,
    });

    // Merchant looks up customer's phone
    const vouchers = await voucherService.getVouchersByPhone(
      testCustomer.phone,
      testTenant.id
    );

    expect(vouchers).toHaveLength(1);
    const foundVoucher = vouchers[0];

    // Validate the found voucher
    const validation = await voucherService.validateVoucher(
      foundVoucher.code,
      testTenant.id
    );

    expect(validation.valid).toBe(true);

    // Redeem the found voucher
    const redemption = await voucherService.redeemVoucher(
      foundVoucher.code,
      testMerchant.id,
      testTenant.id
    );

    expect(redemption.success).toBe(true);
    expect(redemption.voucher?.code).toBe(voucher.code);
  });

  it('should return empty array for phone with no vouchers', async () => {
    // Lookup phone that has no vouchers
    const vouchers = await voucherService.getVouchersByPhone(
      '+1999999999',
      testTenant.id
    );

    expect(vouchers).toEqual([]);
  });

  it('should handle multiple vouchers with mixed statuses', async () => {
    // Create active voucher
    const spin1 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const activeVoucher = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: testPrize1.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize1.voucherValidityDays,
      redemptionLimit: testPrize1.voucherRedemptionLimit,
      generateQR: testPrize1.sendQRCode,
    });

    // Create and redeem second voucher
    const spin2 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize2.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const redeemedVoucher = await voucherService.createVoucher({
      spinId: spin2.id,
      prizeId: testPrize2.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize2.voucherValidityDays,
      redemptionLimit: testPrize2.voucherRedemptionLimit,
      generateQR: testPrize2.sendQRCode,
    });

    await voucherService.redeemVoucher(
      redeemedVoucher.code,
      testMerchant.id,
      testTenant.id
    );

    // Create expired voucher
    const spin3 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const expiredVoucher = await prisma.voucher.create({
      data: {
        code: await voucherService.generateVoucherCode(testTenant.slug),
        spinId: spin3.id,
        prizeId: testPrize1.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        expiresAt: pastDate,
        redemptionLimit: 1,
        redemptionCount: 0,
        isRedeemed: false,
      },
    });

    // Lookup all vouchers
    const vouchers = await voucherService.getVouchersByPhone(
      testCustomer.phone,
      testTenant.id
    );

    expect(vouchers).toHaveLength(3);

    // Verify statuses
    const active = vouchers.filter(v => v.status === 'active');
    const redeemed = vouchers.filter(v => v.status === 'redeemed');
    const expired = vouchers.filter(v => v.status === 'expired');

    expect(active).toHaveLength(1);
    expect(redeemed).toHaveLength(1);
    expect(expired).toHaveLength(1);

    expect(active[0].code).toBe(activeVoucher.code);
    expect(redeemed[0].code).toBe(redeemedVoucher.code);
    expect(expired[0].code).toBe(expiredVoucher.code);
  });

  it('should include prize details in lookup results', async () => {
    // Create voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize1.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize1.voucherValidityDays,
      redemptionLimit: testPrize1.voucherRedemptionLimit,
      generateQR: testPrize1.sendQRCode,
    });

    // Lookup vouchers
    const vouchers = await voucherService.getVouchersByPhone(
      testCustomer.phone,
      testTenant.id
    );

    expect(vouchers).toHaveLength(1);
    
    // Verify prize details are included
    expect(vouchers[0].prize).toBeDefined();
    expect(vouchers[0].prize.name).toBe(testPrize1.name);
    expect(vouchers[0].prize.description).toBe(testPrize1.description);
  });

  it('should sort vouchers by creation date (newest first)', async () => {
    // Create multiple vouchers with slight delays
    const vouchers = [];

    for (let i = 0; i < 3; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: testCustomer.id,
          campaignId: testCampaign.id,
          prizeId: testPrize1.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      const voucher = await voucherService.createVoucher({
        spinId: spin.id,
        prizeId: testPrize1.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: testPrize1.voucherValidityDays,
        redemptionLimit: testPrize1.voucherRedemptionLimit,
        generateQR: testPrize1.sendQRCode,
      });

      vouchers.push(voucher);

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Lookup vouchers
    const lookupResults = await voucherService.getVouchersByPhone(
      testCustomer.phone,
      testTenant.id
    );

    expect(lookupResults).toHaveLength(3);

    // Verify they are sorted by creation date (newest first)
    for (let i = 0; i < lookupResults.length - 1; i++) {
      const current = new Date(lookupResults[i].createdAt).getTime();
      const next = new Date(lookupResults[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});
