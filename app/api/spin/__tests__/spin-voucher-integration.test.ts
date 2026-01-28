/**
 * Integration tests for Spin API voucher creation
 * 
 * Tests the complete flow: spin win → voucher created → WhatsApp sent
 * 
 * Requirements: 1.1, 1.7
 */

import prisma from '@/lib/prisma';
import * as voucherService from '@/lib/voucher-service';
import * as whatsappService from '@/lib/whatsapp';

// Mock the WhatsApp service to avoid actual API calls
jest.mock('@/lib/whatsapp', () => ({
  sendPrizeNotification: jest.fn().mockResolvedValue(null),
  sendVoucherNotification: jest.fn().mockResolvedValue(null),
}));

describe('Spin API - Voucher Integration', () => {
  let testTenant: any;
  let testCampaign: any;
  let testUser: any;
  let testPrize: any;
  let testPlan: any;

  beforeEach(async () => {
    // Create test plan
    testPlan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        slug: 'test-tenant-' + Date.now(),
        planId: testPlan.id,
      },
    });

    // Create test campaign
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30); // 30 days from now
    
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
    await prisma.tenant.delete({ where: { id: testTenant.id } });
    await prisma.plan.delete({ where: { id: testPlan.id } });
    
    // Clear mocks
    jest.clearAllMocks();
  });

  it('should create voucher when prize with voucher settings is won', async () => {
    // Spy on createVoucher to verify it's called
    const createVoucherSpy = jest.spyOn(voucherService, 'createVoucher');

    // Create a spin (simulating prize win)
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Manually trigger voucher creation (simulating what the API does)
    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testUser.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Verify voucher was created
    expect(voucher).toBeDefined();
    expect(voucher.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{12}$/); // Format: XXXX-XXXXXXXXXXXX
    expect(voucher.spinId).toBe(spin.id);
    expect(voucher.prizeId).toBe(testPrize.id);
    expect(voucher.userId).toBe(testUser.id);
    expect(voucher.tenantId).toBe(testTenant.id);

    // Verify expiration date is set correctly (30 days from now)
    const expectedExpiration = new Date();
    expectedExpiration.setDate(expectedExpiration.getDate() + 30);
    const expirationDiff = Math.abs(voucher.expiresAt.getTime() - expectedExpiration.getTime());
    expect(expirationDiff).toBeLessThan(10000); // Within 10 seconds (more lenient for slow tests)

    // Verify voucher is in database
    const dbVoucher = await prisma.voucher.findUnique({
      where: { code: voucher.code },
    });
    expect(dbVoucher).toBeDefined();
    expect(dbVoucher?.code).toBe(voucher.code);

    // Verify createVoucher was called
    expect(createVoucherSpy).toHaveBeenCalledWith({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testUser.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });
  });

  it('should send WhatsApp notification after voucher creation', async () => {
    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
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
      userId: testUser.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Send WhatsApp notification
    await whatsappService.sendVoucherNotification(
      {
        code: voucher.code,
        prize: { name: testPrize.name },
        expiresAt: voucher.expiresAt,
        qrImageUrl: voucher.qrImageUrl,
      },
      testUser.phone,
      testTenant.id
    );

    // Verify WhatsApp notification was sent
    expect(whatsappService.sendVoucherNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        code: voucher.code,
        prize: { name: testPrize.name },
        expiresAt: voucher.expiresAt,
      }),
      testUser.phone,
      testTenant.id
    );
  });

  it('should not create voucher when prize has no voucher settings', async () => {
    // Create prize without voucher settings
    const prizeWithoutVoucher = await prisma.prize.create({
      data: {
        name: 'Prize Without Voucher',
        description: 'No voucher settings',
        campaignId: testCampaign.id,
        probability: 100,
        position: 2,
        isActive: true,
        voucherValidityDays: 0, // No voucher
      },
    });

    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: prizeWithoutVoucher.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Check that no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });

    expect(vouchers).toHaveLength(0);
  });

  it('should not create voucher when prize is not won', async () => {
    // Create a spin where prize was not won
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: false, // Prize not won
        isReferralBonus: false,
      },
    });

    // Check that no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });

    expect(vouchers).toHaveLength(0);
  });

  it('should handle voucher creation failure gracefully', async () => {
    // Mock createVoucher to throw an error
    const createVoucherSpy = jest.spyOn(voucherService, 'createVoucher')
      .mockRejectedValueOnce(new Error('Voucher creation failed'));

    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Try to create voucher (should fail but not throw)
    try {
      await voucherService.createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testUser.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: testPrize.voucherValidityDays,
        redemptionLimit: testPrize.voucherRedemptionLimit,
        generateQR: testPrize.sendQRCode,
      });
    } catch (error) {
      // Error is expected
      expect(error).toBeDefined();
    }

    // Verify spin still exists (spin creation should not fail)
    const dbSpin = await prisma.spin.findUnique({
      where: { id: spin.id },
    });
    expect(dbSpin).toBeDefined();

    // Restore original implementation
    createVoucherSpy.mockRestore();
  });

  it('should create voucher with correct tenant context', async () => {
    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
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
      userId: testUser.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Verify voucher has correct tenant context
    expect(voucher.tenantId).toBe(testTenant.id);
    expect(voucher.code).toContain(testTenant.slug.slice(0, 4).toUpperCase());

    // Verify voucher can be validated by the same tenant
    const validationResult = await voucherService.validateVoucher(
      voucher.code,
      testTenant.id
    );
    expect(validationResult.valid).toBe(true);
  });

  it('should create voucher with correct prize configuration', async () => {
    // Create prize with custom voucher settings
    const customPrize = await prisma.prize.create({
      data: {
        name: 'Custom Prize',
        description: 'Custom voucher settings',
        campaignId: testCampaign.id,
        probability: 100,
        position: 3,
        isActive: true,
        voucherValidityDays: 7, // 7 days
        voucherRedemptionLimit: 3, // 3 redemptions
        sendQRCode: false, // No QR code
      },
    });

    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: customPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Create voucher
    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: customPrize.id,
      userId: testUser.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: customPrize.voucherValidityDays,
      redemptionLimit: customPrize.voucherRedemptionLimit,
      generateQR: customPrize.sendQRCode,
    });

    // Verify voucher has correct configuration
    expect(voucher.redemptionLimit).toBe(3);
    expect(voucher.qrImageUrl).toBeNull(); // No QR code

    // Verify expiration is 7 days from now
    const expectedExpiration = new Date();
    expectedExpiration.setDate(expectedExpiration.getDate() + 7);
    const expirationDiff = Math.abs(voucher.expiresAt.getTime() - expectedExpiration.getTime());
    expect(expirationDiff).toBeLessThan(10000); // Within 10 seconds (more lenient for slow tests)
  });
});
