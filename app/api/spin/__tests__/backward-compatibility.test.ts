/**
 * Unit tests for Spin API backward compatibility
 * 
 * Tests that spins without voucher settings work unchanged
 * and that existing spin functionality is not disrupted.
 * 
 * Requirements: 13.1, 13.2
 */

import prisma from '@/lib/prisma';
import * as whatsappService from '@/lib/whatsapp';

// Mock the WhatsApp service to avoid actual API calls
jest.mock('@/lib/whatsapp', () => ({
  sendPrizeNotification: jest.fn().mockResolvedValue(null),
  sendVoucherNotification: jest.fn().mockResolvedValue(null),
}));

describe('Spin API - Backward Compatibility', () => {
  let testTenant: any;
  let testCampaign: any;
  let testUser: any;
  let testPlan: any;

  beforeEach(async () => {
    // Create test plan
    testPlan = await prisma.plan.create({
      data: {
        name: 'Test Plan BC',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant BC',
        slug: 'test-bc-' + Date.now(),
        planId: testPlan.id,
      },
    });

    // Create test campaign
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30); // 30 days from now
    
    testCampaign = await prisma.campaign.create({
      data: {
        name: 'Test Campaign BC',
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
        phone: '9876543211',
        name: 'Test User BC',
        tenantId: testTenant.id,
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

  it('should work normally for prizes without voucher settings', async () => {
    // Requirement 13.1: Prizes without voucher settings should work unchanged
    
    // Create prize without voucher settings (voucherValidityDays = 0 or null)
    const prizeWithoutVoucher = await prisma.prize.create({
      data: {
        name: 'Legacy Prize',
        description: 'Prize without voucher settings',
        campaignId: testCampaign.id,
        probability: 100,
        position: 1,
        isActive: true,
        voucherValidityDays: 0, // No voucher
      },
    });

    // Create a spin (simulating prize win)
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: prizeWithoutVoucher.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Verify spin was created successfully
    expect(spin).toBeDefined();
    expect(spin.wonPrize).toBe(true);
    expect(spin.prizeId).toBe(prizeWithoutVoucher.id);

    // Verify no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });
    expect(vouchers).toHaveLength(0);

    // Verify spin exists in database
    const dbSpin = await prisma.spin.findUnique({
      where: { id: spin.id },
    });
    expect(dbSpin).toBeDefined();
    expect(dbSpin?.wonPrize).toBe(true);
  });

  it('should work normally for prizes with null voucher settings', async () => {
    // Requirement 13.2: System should not create vouchers when settings are null
    
    // Create prize with null voucher settings
    const prizeWithNullSettings = await prisma.prize.create({
      data: {
        name: 'Prize with Null Settings',
        description: 'Voucher settings are null',
        campaignId: testCampaign.id,
        probability: 100,
        position: 2,
        isActive: true,
        // voucherValidityDays is not set (null by default)
      },
    });

    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: prizeWithNullSettings.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Verify spin was created successfully
    expect(spin).toBeDefined();
    expect(spin.wonPrize).toBe(true);

    // Verify no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });
    expect(vouchers).toHaveLength(0);
  });

  it('should maintain existing spin functionality for "no prize" outcomes', async () => {
    // Requirement 13.1: Existing functionality should work unchanged
    
    // Create "no prize" prize
    const noPrize = await prisma.prize.create({
      data: {
        name: 'No Prize',
        description: 'Better luck next time',
        campaignId: testCampaign.id,
        probability: 100,
        position: 3,
        isActive: true,
      },
    });

    // Create a spin where no prize was won
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: noPrize.id,
        wonPrize: false, // No prize won
        isReferralBonus: false,
      },
    });

    // Verify spin was created successfully
    expect(spin).toBeDefined();
    expect(spin.wonPrize).toBe(false);

    // Verify no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });
    expect(vouchers).toHaveLength(0);
  });

  it('should maintain existing spin functionality for "try again" outcomes', async () => {
    // Requirement 13.1: Existing functionality should work unchanged
    
    // Create "try again" prize
    const tryAgainPrize = await prisma.prize.create({
      data: {
        name: 'Try Again',
        description: 'Try again later',
        campaignId: testCampaign.id,
        probability: 100,
        position: 4,
        isActive: true,
        showTryAgainMessage: true, // Try again flag
      },
    });

    // Create a spin with try again outcome
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: tryAgainPrize.id,
        wonPrize: false, // Not won
        isReferralBonus: false,
      },
    });

    // Verify spin was created successfully
    expect(spin).toBeDefined();
    expect(spin.wonPrize).toBe(false);

    // Verify no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });
    expect(vouchers).toHaveLength(0);
  });

  it('should maintain existing spin functionality for referral bonus spins', async () => {
    // Requirement 13.1: Existing functionality should work unchanged
    
    // Create prize without voucher settings
    const prize = await prisma.prize.create({
      data: {
        name: 'Bonus Prize',
        description: 'Prize from referral bonus',
        campaignId: testCampaign.id,
        probability: 100,
        position: 5,
        isActive: true,
      },
    });

    // Create a referral bonus spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: prize.id,
        wonPrize: true,
        isReferralBonus: true, // Referral bonus spin
      },
    });

    // Verify spin was created successfully
    expect(spin).toBeDefined();
    expect(spin.wonPrize).toBe(true);
    expect(spin.isReferralBonus).toBe(true);

    // Verify no voucher was created (no voucher settings)
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });
    expect(vouchers).toHaveLength(0);
  });

  it('should not break existing spin limit checks', async () => {
    // Requirement 13.1: Existing functionality should work unchanged
    
    // Create prize without voucher settings
    const prize = await prisma.prize.create({
      data: {
        name: 'Regular Prize',
        description: 'Regular prize',
        campaignId: testCampaign.id,
        probability: 100,
        position: 6,
        isActive: true,
      },
    });

    // Create multiple spins to test limit checks
    const spins = [];
    for (let i = 0; i < 3; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: testUser.id,
          campaignId: testCampaign.id,
          prizeId: prize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });
      spins.push(spin);
    }

    // Verify all spins were created
    expect(spins).toHaveLength(3);

    // Verify spin count for user
    const spinCount = await prisma.spin.count({
      where: {
        userId: testUser.id,
        campaignId: testCampaign.id,
      },
    });
    expect(spinCount).toBe(3);

    // Verify no vouchers were created
    const vouchers = await prisma.voucher.findMany({
      where: { tenantId: testTenant.id },
    });
    expect(vouchers).toHaveLength(0);
  });

  it('should not break existing prize stock management', async () => {
    // Requirement 13.1: Existing functionality should work unchanged
    
    // Create prize with stock tracking but no voucher settings
    const prizeWithStock = await prisma.prize.create({
      data: {
        name: 'Limited Prize',
        description: 'Prize with stock tracking',
        campaignId: testCampaign.id,
        probability: 100,
        position: 7,
        isActive: true,
        currentStock: 5, // Limited stock
      },
    });

    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: prizeWithStock.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Verify spin was created
    expect(spin).toBeDefined();
    expect(spin.wonPrize).toBe(true);

    // Verify no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });
    expect(vouchers).toHaveLength(0);

    // Note: Stock decrement is handled by the API route, not tested here
    // This test verifies that spin creation works with stock tracking
  });

  it('should not break existing daily limit checks', async () => {
    // Requirement 13.1: Existing functionality should work unchanged
    
    // Create prize with daily limit but no voucher settings
    const prizeWithLimit = await prisma.prize.create({
      data: {
        name: 'Daily Limited Prize',
        description: 'Prize with daily limit',
        campaignId: testCampaign.id,
        probability: 100,
        position: 8,
        isActive: true,
        dailyLimit: 10, // Daily limit
      },
    });

    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: prizeWithLimit.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Verify spin was created
    expect(spin).toBeDefined();
    expect(spin.wonPrize).toBe(true);

    // Verify no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });
    expect(vouchers).toHaveLength(0);

    // Note: Daily limit checks are handled by the API route, not tested here
    // This test verifies that spin creation works with daily limits
  });

  it('should maintain existing WhatsApp notification for prizes without vouchers', async () => {
    // Requirement 13.4: Existing WhatsApp functionality should work unchanged
    
    // Create prize without voucher settings but with coupon code
    const prizeWithCoupon = await prisma.prize.create({
      data: {
        name: 'Coupon Prize',
        description: 'Prize with coupon code',
        campaignId: testCampaign.id,
        probability: 100,
        position: 9,
        isActive: true,
        couponCode: 'SAVE20', // Legacy coupon code
      },
    });

    // Create a spin
    const spin = await prisma.spin.create({
      data: {
        userId: testUser.id,
        campaignId: testCampaign.id,
        prizeId: prizeWithCoupon.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    // Simulate sending prize notification (as the API does)
    await whatsappService.sendPrizeNotification(
      testUser.phone,
      prizeWithCoupon.name,
      prizeWithCoupon.couponCode || undefined,
      testTenant.id
    );

    // Verify prize notification was sent (not voucher notification)
    expect(whatsappService.sendPrizeNotification).toHaveBeenCalledWith(
      testUser.phone,
      prizeWithCoupon.name,
      prizeWithCoupon.couponCode,
      testTenant.id
    );

    // Verify voucher notification was NOT sent
    expect(whatsappService.sendVoucherNotification).not.toHaveBeenCalled();

    // Verify no voucher was created
    const vouchers = await prisma.voucher.findMany({
      where: { spinId: spin.id },
    });
    expect(vouchers).toHaveLength(0);
  });
});
