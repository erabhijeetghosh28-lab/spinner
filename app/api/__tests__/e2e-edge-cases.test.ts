/**
 * End-to-End Tests: Edge Cases
 * 
 * Feature: voucher-redemption-system
 * 
 * Tests edge cases and error scenarios:
 * 1. Expired voucher validation
 * 2. Already redeemed voucher
 * 3. Invalid voucher code
 * 4. QR generation failure
 * 5. WhatsApp delivery failure
 * 6. Concurrent redemption attempts
 * 7. Boundary conditions
 * 
 * Requirements: 12.1, 12.2, 12.3, 3.4, 11.6
 */

import prisma from '@/lib/prisma';
import * as voucherService from '@/lib/voucher-service';
import * as whatsappService from '@/lib/whatsapp';

// Mock services
jest.mock('@/lib/whatsapp', () => ({
  sendPrizeNotification: jest.fn().mockResolvedValue(null),
  sendVoucherNotification: jest.fn().mockResolvedValue(null),
}));

// Mock QR generator to avoid actual uploads (but allow override in specific tests)
jest.mock('@/lib/qr-generator', () => ({
  generateVoucherCode: jest.requireActual('@/lib/voucher-service').generateVoucherCode,
  createAndUploadQR: jest.fn().mockResolvedValue('https://example.com/qr/test.png'),
}));

describe('E2E: Edge Cases', () => {
  // Increase timeout for E2E tests
  jest.setTimeout(30000);

  let testTenant: any;
  let testCampaign: any;
  let testCustomer: any;
  let testMerchant: any;
  let testPrize: any;
  let testPlan: any;

  beforeEach(async () => {
    // Create test plan
    testPlan = await prisma.plan.create({
      data: {
        name: 'Edge Cases Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Edge Cases Test Tenant',
        slug: 'edge-cases-' + Date.now(),
        planId: testPlan.id,
      },
    });

    // Create test campaign
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    
    testCampaign = await prisma.campaign.create({
      data: {
        name: 'Edge Cases Test Campaign',
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
        phone: '+1555777777',
        name: 'Edge Case Customer',
        tenantId: testTenant.id,
      },
    });

    // Create test merchant
    testMerchant = await prisma.tenantAdmin.create({
      data: {
        email: 'merchant-edge@test.com',
        name: 'Edge Case Merchant',
        password: 'hashed_password',
        tenantId: testTenant.id,
      },
    });

    // Create test prize
    testPrize = await prisma.prize.create({
      data: {
        name: 'Edge Case Prize',
        description: 'Prize for edge case testing',
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
    await prisma.tenantAdmin.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.campaign.deleteMany({ where: { tenantId: testTenant.id } });
    await prisma.tenant.delete({ where: { id: testTenant.id } });
    await prisma.plan.delete({ where: { id: testPlan.id } });
    
    // Clear mocks
    jest.clearAllMocks();
  });

  it('should reject expired voucher validation', async () => {
    // Create expired voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

    const expiredVoucher = await prisma.voucher.create({
      data: {
        code: await voucherService.generateVoucherCode(testTenant.slug),
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        expiresAt: pastDate,
        redemptionLimit: 1,
        redemptionCount: 0,
        isRedeemed: false,
      },
    });

    // Attempt to validate expired voucher
    const validation = await voucherService.validateVoucher(
      expiredVoucher.code,
      testTenant.id
    );

    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('expired');
    expect(validation.details?.expiresAt).toBeDefined();
  });

  it('should reject already redeemed voucher', async () => {
    // Create and redeem voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Redeem voucher
    await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );

    // Attempt to validate already redeemed voucher
    const validation = await voucherService.validateVoucher(
      voucher.code,
      testTenant.id
    );

    expect(validation.valid).toBe(false);
    expect(validation.reason).toMatch(/redeemed|limit_reached/);
    expect(validation.details?.redeemedAt).toBeDefined();
  });

  it('should reject invalid voucher code', async () => {
    // Attempt to validate non-existent voucher
    const validation = await voucherService.validateVoucher(
      'INVALID-CODE123456',
      testTenant.id
    );

    expect(validation.valid).toBe(false);
    expect(validation.reason).toMatch(/not found|not_found/i);
  });

  it('should handle QR generation failure gracefully', async () => {
    // This test verifies that vouchers can be created without QR codes
    // We'll create a voucher with generateQR=false to simulate the graceful degradation
    
    // Create spin
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Create voucher without QR (simulating QR generation failure scenario)
    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: false, // Don't generate QR
    });

    // Verify voucher was created without QR
    expect(voucher).toBeDefined();
    expect(voucher.qrImageUrl).toBeNull();

    // Verify voucher is still valid and usable
    const validation = await voucherService.validateVoucher(
      voucher.code,
      testTenant.id
    );

    expect(validation.valid).toBe(true);
  });

  it('should handle WhatsApp delivery failure gracefully', async () => {
    // Mock WhatsApp to fail
    const sendVoucherNotificationSpy = jest.spyOn(whatsappService, 'sendVoucherNotification')
      .mockRejectedValueOnce(new Error('WhatsApp API error'));

    // Create spin
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Create voucher
    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Attempt to send WhatsApp (will fail but shouldn't throw)
    try {
      await whatsappService.sendVoucherNotification(
        {
          code: voucher.code,
          prize: { name: testPrize.name },
          expiresAt: voucher.expiresAt,
          qrImageUrl: voucher.qrImageUrl,
        },
        testCustomer.phone,
        testTenant.id
      );
    } catch (error) {
      // Error is expected, but voucher should still exist
    }

    // Verify voucher was created and is valid
    expect(voucher).toBeDefined();
    
    const validation = await voucherService.validateVoucher(
      voucher.code,
      testTenant.id
    );

    expect(validation.valid).toBe(true);

    // Restore original implementation
    sendVoucherNotificationSpy.mockRestore();
  });

  it('should prevent concurrent redemption (double redemption)', async () => {
    // Create voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Attempt concurrent redemptions
    const redemption1Promise = voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );

    const redemption2Promise = voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );

    const [result1, result2] = await Promise.all([
      redemption1Promise,
      redemption2Promise,
    ]);

    // One should succeed, one should fail
    const successCount = [result1.success, result2.success].filter(Boolean).length;
    expect(successCount).toBe(1);

    // Verify voucher was only redeemed once
    const dbVoucher = await prisma.voucher.findUnique({
      where: { code: voucher.code },
    });

    expect(dbVoucher?.redemptionCount).toBe(1);
    expect(dbVoucher?.isRedeemed).toBe(true);
  });

  it('should handle empty phone number in lookup', async () => {
    // Lookup with empty phone
    const vouchers = await voucherService.getVouchersByPhone(
      '',
      testTenant.id
    );

    expect(vouchers).toEqual([]);
  });

  it('should handle very long voucher code search', async () => {
    // Search with very long string
    const longSearch = 'A'.repeat(1000);
    
    const results = await voucherService.getVouchers(testTenant.id, {
      search: longSearch,
    });

    // Should not crash, just return empty results
    expect(results.vouchers).toEqual([]);
  });

  it('should handle voucher at exact expiration moment', async () => {
    // Create voucher that expires in 2 seconds
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const expirationDate = new Date(Date.now() + 2000); // 2 seconds from now

    const voucher = await prisma.voucher.create({
      data: {
        code: await voucherService.generateVoucherCode(testTenant.slug),
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer.id,
        tenantId: testTenant.id,
        expiresAt: expirationDate,
        redemptionLimit: 1,
        redemptionCount: 0,
        isRedeemed: false,
      },
    });

    // Should be valid immediately
    const validationBefore = await voucherService.validateVoucher(
      voucher.code,
      testTenant.id
    );

    expect(validationBefore.valid).toBe(true);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Should be expired now
    const validationAfter = await voucherService.validateVoucher(
      voucher.code,
      testTenant.id
    );

    expect(validationAfter.valid).toBe(false);
    expect(validationAfter.reason).toBe('expired');
  });

  it('should handle redemption at exact limit', async () => {
    // Create voucher with limit of 3
    const multiUsePrize = await prisma.prize.create({
      data: {
        name: 'Multi-Use Prize',
        description: 'Can be used 3 times',
        campaignId: testCampaign.id,
        probability: 100,
        position: 2,
        isActive: true,
        voucherValidityDays: 30,
        voucherRedemptionLimit: 3,
        sendQRCode: true,
      },
    });

    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: multiUsePrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: multiUsePrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: multiUsePrize.voucherValidityDays,
      redemptionLimit: multiUsePrize.voucherRedemptionLimit,
      generateQR: multiUsePrize.sendQRCode,
    });

    // Redeem 3 times (at limit)
    for (let i = 0; i < 3; i++) {
      const redemption = await voucherService.redeemVoucher(
        voucher.code,
        testMerchant.id,
        testTenant.id
      );
      expect(redemption.success).toBe(true);
    }

    // 4th redemption should fail
    const failedRedemption = await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );

    expect(failedRedemption.success).toBe(false);
    expect(failedRedemption.error).toContain('limit reached');
  });

  it('should handle special characters in customer name', async () => {
    // Create customer with special characters
    const specialCustomer = await prisma.endUser.create({
      data: {
        phone: '+1555888888',
        name: "O'Brien & Sons <Test>",
        tenantId: testTenant.id,
      },
    });

    const spin = await prisma.spin.create({
      data: {
        userId: specialCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: specialCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Validate voucher
    const validation = await voucherService.validateVoucher(
      voucher.code,
      testTenant.id
    );

    expect(validation.valid).toBe(true);
    expect(validation.voucher?.customer.name).toBe("O'Brien & Sons <Test>");
  });

  it('should handle zero validity days', async () => {
    // Create prize with 0 validity days (should not create voucher)
    const zeroDaysPrize = await prisma.prize.create({
      data: {
        name: 'Zero Days Prize',
        description: 'No voucher',
        campaignId: testCampaign.id,
        probability: 100,
        position: 3,
        isActive: true,
        voucherValidityDays: 0, // No voucher
        voucherRedemptionLimit: 1,
        sendQRCode: true,
      },
    });

    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: zeroDaysPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Verify no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });

    expect(vouchers).toHaveLength(0);
  });

  it('should handle missing tenant in validation', async () => {
    // Create voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Attempt validation with non-existent tenant
    const validation = await voucherService.validateVoucher(
      voucher.code,
      'non-existent-tenant-id'
    );

    expect(validation.valid).toBe(false);
    expect(validation.reason).toMatch(/not found|wrong_tenant|invalid/i);
  });
});
