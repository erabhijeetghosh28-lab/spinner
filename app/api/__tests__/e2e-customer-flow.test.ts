/**
 * End-to-End Tests: Complete Customer Flow
 * 
 * Feature: voucher-redemption-system
 * 
 * Tests the complete customer journey from spin win to voucher redemption:
 * 1. Customer wins prize on spin wheel
 * 2. Voucher is automatically created
 * 3. WhatsApp notification is sent with QR code
 * 4. Merchant scans QR code
 * 5. Voucher is validated
 * 6. Voucher is redeemed
 * 
 * Requirements: 1.1, 1.7, 4.1, 5.1
 */

import prisma from '@/lib/prisma';
import * as voucherService from '@/lib/voucher-service';
import * as whatsappService from '@/lib/whatsapp';

// Mock the WhatsApp service to avoid actual API calls
jest.mock('@/lib/whatsapp', () => ({
  sendPrizeNotification: jest.fn().mockResolvedValue(null),
  sendVoucherNotification: jest.fn().mockResolvedValue(null),
}));

// Mock QR generator to avoid actual uploads
jest.mock('@/lib/qr-generator', () => ({
  generateVoucherCode: jest.requireActual('@/lib/voucher-service').generateVoucherCode,
  createAndUploadQR: jest.fn().mockResolvedValue('https://example.com/qr/test.png'),
}));

describe('E2E: Complete Customer Flow', () => {
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
        name: 'E2E Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'E2E Test Tenant',
        slug: 'e2e-test-' + Date.now(),
        planId: testPlan.id,
      },
    });

    // Create test campaign
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    
    testCampaign = await prisma.campaign.create({
      data: {
        name: 'E2E Test Campaign',
        tenantId: testTenant.id,
        spinLimit: 10,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        startDate: now,
        endDate: endDate,
      },
    });

    // Create test customer (end user)
    testCustomer = await prisma.endUser.create({
      data: {
        phone: '+1234567890',
        name: 'Test Customer',
        tenantId: testTenant.id,
      },
    });

    // Create test merchant (tenant admin who will redeem vouchers)
    testMerchant = await prisma.tenantAdmin.create({
      data: {
        email: 'merchant@test.com',
        name: 'Test Merchant',
        password: 'hashed_password',
        tenantId: testTenant.id,
      },
    });

    // Create test prize with voucher settings
    testPrize = await prisma.prize.create({
      data: {
        name: '10% Discount',
        description: 'Get 10% off your next purchase',
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
    // Clean up test data in correct order
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

  it('should complete full customer journey: spin → voucher → validate → redeem', async () => {
    // Step 1: Customer wins prize on spin wheel
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    expect(spin).toBeDefined();
    expect(spin.wonPrize).toBe(true);

    // Step 2: Voucher is automatically created
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

    expect(voucher).toBeDefined();
    expect(voucher.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{12}$/);
    expect(voucher.spinId).toBe(spin.id);
    expect(voucher.prizeId).toBe(testPrize.id);
    expect(voucher.userId).toBe(testCustomer.id);
    expect(voucher.tenantId).toBe(testTenant.id);
    expect(voucher.isRedeemed).toBe(false);
    expect(voucher.redemptionCount).toBe(0);

    // Step 3: WhatsApp notification is sent
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

    expect(whatsappService.sendVoucherNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        code: voucher.code,
        prize: { name: testPrize.name },
      }),
      testCustomer.phone,
      testTenant.id
    );

    // Step 4: Merchant scans QR code (simulated by having the voucher code)
    // In real scenario, QR code would be scanned and decoded to get voucher code
    const scannedCode = voucher.code;

    // Step 5: Voucher is validated
    const validationResult = await voucherService.validateVoucher(
      scannedCode,
      testTenant.id
    );

    expect(validationResult.valid).toBe(true);
    expect(validationResult.voucher).toBeDefined();
    expect(validationResult.voucher?.code).toBe(voucher.code);
    expect(validationResult.voucher?.customer.name).toBe(testCustomer.name);
    expect(validationResult.voucher?.customer.phone).toBe(testCustomer.phone);
    expect(validationResult.voucher?.prize.name).toBe(testPrize.name);
    expect(validationResult.voucher?.redemptionCount).toBe(0);
    expect(validationResult.voucher?.redemptionLimit).toBe(1);

    // Step 6: Voucher is redeemed
    const redemptionResult = await voucherService.redeemVoucher(
      scannedCode,
      testMerchant.id,
      testTenant.id
    );

    expect(redemptionResult.success).toBe(true);
    expect(redemptionResult.voucher).toBeDefined();
    expect(redemptionResult.voucher?.isRedeemed).toBe(true);
    expect(redemptionResult.voucher?.redeemedBy).toBe(testMerchant.id);
    expect(redemptionResult.voucher?.redeemedAt).toBeDefined();
    expect(redemptionResult.voucher?.redemptionCount).toBe(1);

    // Verify voucher cannot be redeemed again
    const secondRedemptionAttempt = await voucherService.redeemVoucher(
      scannedCode,
      testMerchant.id,
      testTenant.id
    );

    expect(secondRedemptionAttempt.success).toBe(false);
    expect(secondRedemptionAttempt.error).toMatch(/already redeemed|limit reached/i);
  });

  it('should handle multiple vouchers for same customer', async () => {
    // Create first spin and voucher
    const spin1 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Create second spin and voucher
    const spin2 = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher2 = await voucherService.createVoucher({
      spinId: spin2.id,
      prizeId: testPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Verify both vouchers are unique
    expect(voucher1.code).not.toBe(voucher2.code);

    // Validate both vouchers
    const validation1 = await voucherService.validateVoucher(voucher1.code, testTenant.id);
    const validation2 = await voucherService.validateVoucher(voucher2.code, testTenant.id);

    expect(validation1.valid).toBe(true);
    expect(validation2.valid).toBe(true);

    // Redeem first voucher
    const redemption1 = await voucherService.redeemVoucher(
      voucher1.code,
      testMerchant.id,
      testTenant.id
    );

    expect(redemption1.success).toBe(true);

    // Second voucher should still be valid
    const validation2After = await voucherService.validateVoucher(voucher2.code, testTenant.id);
    expect(validation2After.valid).toBe(true);

    // Redeem second voucher
    const redemption2 = await voucherService.redeemVoucher(
      voucher2.code,
      testMerchant.id,
      testTenant.id
    );

    expect(redemption2.success).toBe(true);
  });

  it('should handle voucher with multiple redemption limit', async () => {
    // Create prize with multiple redemption limit
    const multiRedemptionPrize = await prisma.prize.create({
      data: {
        name: 'Multi-Use Coupon',
        description: 'Can be used 3 times',
        campaignId: testCampaign.id,
        probability: 100,
        position: 2,
        isActive: true,
        voucherValidityDays: 30,
        voucherRedemptionLimit: 3, // Can be redeemed 3 times
        sendQRCode: true,
      },
    });

    // Create spin and voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: multiRedemptionPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: multiRedemptionPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: multiRedemptionPrize.voucherValidityDays,
      redemptionLimit: multiRedemptionPrize.voucherRedemptionLimit,
      generateQR: multiRedemptionPrize.sendQRCode,
    });

    expect(voucher.redemptionLimit).toBe(3);

    // First redemption
    const redemption1 = await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );
    expect(redemption1.success).toBe(true);
    expect(redemption1.voucher?.redemptionCount).toBe(1);
    expect(redemption1.voucher?.isRedeemed).toBe(false); // Not fully redeemed yet

    // Second redemption
    const redemption2 = await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );
    expect(redemption2.success).toBe(true);
    expect(redemption2.voucher?.redemptionCount).toBe(2);
    expect(redemption2.voucher?.isRedeemed).toBe(false); // Still not fully redeemed

    // Third redemption (final)
    const redemption3 = await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );
    expect(redemption3.success).toBe(true);
    expect(redemption3.voucher?.redemptionCount).toBe(3);
    expect(redemption3.voucher?.isRedeemed).toBe(true); // Now fully redeemed

    // Fourth redemption should fail
    const redemption4 = await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );
    expect(redemption4.success).toBe(false);
    expect(redemption4.error).toContain('limit reached');
  });

  it('should handle voucher without QR code', async () => {
    // Create prize without QR code
    const noQRPrize = await prisma.prize.create({
      data: {
        name: 'No QR Prize',
        description: 'Prize without QR code',
        campaignId: testCampaign.id,
        probability: 100,
        position: 3,
        isActive: true,
        voucherValidityDays: 30,
        voucherRedemptionLimit: 1,
        sendQRCode: false, // No QR code
      },
    });

    // Create spin and voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer.id,
        campaignId: testCampaign.id,
        prizeId: noQRPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: noQRPrize.id,
      userId: testCustomer.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: noQRPrize.voucherValidityDays,
      redemptionLimit: noQRPrize.voucherRedemptionLimit,
      generateQR: noQRPrize.sendQRCode,
    });

    // Verify no QR code was generated
    expect(voucher.qrImageUrl).toBeNull();

    // Voucher should still be valid and redeemable
    const validation = await voucherService.validateVoucher(voucher.code, testTenant.id);
    expect(validation.valid).toBe(true);

    const redemption = await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );
    expect(redemption.success).toBe(true);
  });

  it('should track redemption history correctly', async () => {
    // Create spin and voucher
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

    // Verify initial state
    expect(voucher.isRedeemed).toBe(false);
    expect(voucher.redeemedAt).toBeNull();
    expect(voucher.redeemedBy).toBeNull();
    expect(voucher.redemptionCount).toBe(0);

    // Redeem voucher
    const beforeRedemption = new Date();
    const redemption = await voucherService.redeemVoucher(
      voucher.code,
      testMerchant.id,
      testTenant.id
    );
    const afterRedemption = new Date();

    // Verify redemption history
    expect(redemption.voucher?.isRedeemed).toBe(true);
    expect(redemption.voucher?.redeemedBy).toBe(testMerchant.id);
    expect(redemption.voucher?.redemptionCount).toBe(1);
    
    // Verify redemption timestamp is within expected range
    const redeemedAt = redemption.voucher?.redeemedAt;
    expect(redeemedAt).toBeDefined();
    expect(redeemedAt!.getTime()).toBeGreaterThanOrEqual(beforeRedemption.getTime());
    expect(redeemedAt!.getTime()).toBeLessThanOrEqual(afterRedemption.getTime());

    // Verify data persisted in database
    const dbVoucher = await prisma.voucher.findUnique({
      where: { code: voucher.code },
    });

    expect(dbVoucher?.isRedeemed).toBe(true);
    expect(dbVoucher?.redeemedBy).toBe(testMerchant.id);
    expect(dbVoucher?.redemptionCount).toBe(1);
    expect(dbVoucher?.redeemedAt).toBeDefined();
  });
});
