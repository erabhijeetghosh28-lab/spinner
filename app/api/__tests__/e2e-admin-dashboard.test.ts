/**
 * End-to-End Tests: Admin Dashboard
 * 
 * Feature: voucher-redemption-system
 * 
 * Tests the admin dashboard functionality:
 * 1. Create vouchers with various states
 * 2. Verify statistics are accurate
 * 3. Test filtering by status
 * 4. Test search functionality
 * 5. Test export data consistency
 * 
 * Requirements: 8.1, 8.3, 8.6
 */

import prisma from '@/lib/prisma';
import * as voucherService from '@/lib/voucher-service';

// Mock QR generator to avoid actual uploads
jest.mock('@/lib/qr-generator', () => ({
  generateVoucherCode: jest.requireActual('@/lib/voucher-service').generateVoucherCode,
  createAndUploadQR: jest.fn().mockResolvedValue('https://example.com/qr/test.png'),
}));

describe('E2E: Admin Dashboard', () => {
  // Increase timeout for E2E tests (these tests create many vouchers)
  jest.setTimeout(90000);
  let testTenant: any;
  let testCampaign: any;
  let testCustomer1: any;
  let testCustomer2: any;
  let testMerchant: any;
  let testPrize: any;
  let testPlan: any;

  beforeEach(async () => {
    // Create test plan
    testPlan = await prisma.plan.create({
      data: {
        name: 'Admin Dashboard Test Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Admin Dashboard Test Tenant',
        slug: 'admin-dash-' + Date.now(),
        planId: testPlan.id,
      },
    });

    // Create test campaign
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    
    testCampaign = await prisma.campaign.create({
      data: {
        name: 'Admin Dashboard Test Campaign',
        tenantId: testTenant.id,
        spinLimit: 10,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        startDate: now,
        endDate: endDate,
      },
    });

    // Create test customers
    testCustomer1 = await prisma.endUser.create({
      data: {
        phone: '+1555111111',
        name: 'Customer One',
        tenantId: testTenant.id,
      },
    });

    testCustomer2 = await prisma.endUser.create({
      data: {
        phone: '+1555222222',
        name: 'Customer Two',
        tenantId: testTenant.id,
      },
    });

    // Create test merchant
    testMerchant = await prisma.tenantAdmin.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin User',
        password: 'hashed_password',
        tenantId: testTenant.id,
      },
    });

    // Create test prize
    testPrize = await prisma.prize.create({
      data: {
        name: 'Dashboard Test Prize',
        description: 'Prize for dashboard testing',
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
  });

  it('should display accurate statistics for all voucher states', async () => {
    // Create 3 active vouchers
    for (let i = 0; i < 3; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: testCustomer1.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      await voucherService.createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer1.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: testPrize.voucherValidityDays,
        redemptionLimit: testPrize.voucherRedemptionLimit,
        generateQR: testPrize.sendQRCode,
      });
    }

    // Create 2 redeemed vouchers
    for (let i = 0; i < 2; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: testCustomer2.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      const voucher = await voucherService.createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer2.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: testPrize.voucherValidityDays,
        redemptionLimit: testPrize.voucherRedemptionLimit,
        generateQR: testPrize.sendQRCode,
      });

      await voucherService.redeemVoucher(
        voucher.code,
        testMerchant.id,
        testTenant.id
      );
    }

    // Create 1 expired voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer1.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    await prisma.voucher.create({
      data: {
        code: await voucherService.generateVoucherCode(testTenant.slug),
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer1.id,
        tenantId: testTenant.id,
        expiresAt: pastDate,
        redemptionLimit: 1,
        redemptionCount: 0,
        isRedeemed: false,
      },
    });

    // Get statistics
    const stats = await voucherService.getVoucherStats(testTenant.id);

    // Verify statistics
    expect(stats.total).toBe(6); // 3 active + 2 redeemed + 1 expired
    expect(stats.active).toBe(3); // Not redeemed and not expired
    expect(stats.redeemed).toBe(2); // Marked as redeemed
    expect(stats.expired).toBe(1); // Expired but not redeemed
  });

  it('should filter vouchers by status correctly', async () => {
    // Create vouchers with different statuses
    const activeVoucher = await createTestVoucher(testCustomer1.id, false, false);
    const redeemedVoucher = await createTestVoucher(testCustomer1.id, true, false);
    const expiredVoucher = await createTestVoucher(testCustomer1.id, false, true);

    // Filter by active status
    const activeResults = await voucherService.getVouchers(testTenant.id, {
      status: 'active',
    });

    expect(activeResults.vouchers.length).toBeGreaterThanOrEqual(1);
    const foundActive = activeResults.vouchers.find(v => v.code === activeVoucher.code);
    expect(foundActive).toBeDefined();
    expect(foundActive?.status).toBe('active');

    // Filter by redeemed status
    const redeemedResults = await voucherService.getVouchers(testTenant.id, {
      status: 'redeemed',
    });

    expect(redeemedResults.vouchers.length).toBeGreaterThanOrEqual(1);
    const foundRedeemed = redeemedResults.vouchers.find(v => v.code === redeemedVoucher.code);
    expect(foundRedeemed).toBeDefined();
    expect(foundRedeemed?.status).toBe('redeemed');

    // Filter by expired status
    const expiredResults = await voucherService.getVouchers(testTenant.id, {
      status: 'expired',
    });

    expect(expiredResults.vouchers.length).toBeGreaterThanOrEqual(1);
    const foundExpired = expiredResults.vouchers.find(v => v.code === expiredVoucher.code);
    expect(foundExpired).toBeDefined();
    expect(foundExpired?.status).toBe('expired');

    // Get all vouchers
    const allResults = await voucherService.getVouchers(testTenant.id, {
      status: 'all',
    });

    expect(allResults.vouchers.length).toBeGreaterThanOrEqual(3);
  });

  it('should search vouchers by code', async () => {
    // Create test voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer1.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer1.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Search by full code
    const fullCodeResults = await voucherService.getVouchers(testTenant.id, {
      search: voucher.code,
    });

    expect(fullCodeResults.vouchers.length).toBeGreaterThanOrEqual(1);
    const found = fullCodeResults.vouchers.find(v => v.code === voucher.code);
    expect(found).toBeDefined();

    // Search by partial code
    const partialCode = voucher.code.substring(0, 8);
    const partialResults = await voucherService.getVouchers(testTenant.id, {
      search: partialCode,
    });

    expect(partialResults.vouchers.length).toBeGreaterThanOrEqual(1);
    const foundPartial = partialResults.vouchers.find(v => v.code === voucher.code);
    expect(foundPartial).toBeDefined();
  });

  it('should search vouchers by customer phone', async () => {
    // Create voucher for customer 1
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer1.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer1.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Search by phone number
    const phoneResults = await voucherService.getVouchers(testTenant.id, {
      search: testCustomer1.phone,
    });

    expect(phoneResults.vouchers.length).toBeGreaterThanOrEqual(1);
    const found = phoneResults.vouchers.find(v => v.code === voucher.code);
    expect(found).toBeDefined();
    expect(found?.customer.phone).toBe(testCustomer1.phone);

    // Search by partial phone
    const partialPhone = testCustomer1.phone.substring(0, 8);
    const partialResults = await voucherService.getVouchers(testTenant.id, {
      search: partialPhone,
    });

    expect(partialResults.vouchers.length).toBeGreaterThanOrEqual(1);
  });

  it('should include all required fields in voucher list', async () => {
    // Create test voucher
    const spin = await prisma.spin.create({
      data: {
        userId: testCustomer1.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: testCustomer1.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Get vouchers
    const results = await voucherService.getVouchers(testTenant.id, {
      status: 'all',
    });

    const found = results.vouchers.find(v => v.code === voucher.code);
    expect(found).toBeDefined();

    // Verify all required fields are present
    expect(found?.code).toBeDefined();
    expect(found?.customer).toBeDefined();
    expect(found?.customer.name).toBe(testCustomer1.name);
    expect(found?.customer.phone).toBe(testCustomer1.phone);
    expect(found?.prize).toBeDefined();
    expect(found?.prize.name).toBe(testPrize.name);
    expect(found?.status).toBeDefined();
    expect(found?.createdAt).toBeDefined();
    expect(found?.expiresAt).toBeDefined();
  });

  it('should support pagination', async () => {
    // Create 15 vouchers
    for (let i = 0; i < 15; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: testCustomer1.id,
          campaignId: testCampaign.id,
          prizeId: testPrize.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      await voucherService.createVoucher({
        spinId: spin.id,
        prizeId: testPrize.id,
        userId: testCustomer1.id,
        tenantId: testTenant.id,
        tenantSlug: testTenant.slug,
        validityDays: testPrize.voucherValidityDays,
        redemptionLimit: testPrize.voucherRedemptionLimit,
        generateQR: testPrize.sendQRCode,
      });
    }

    // Get first page (10 items)
    const page1 = await voucherService.getVouchers(testTenant.id, {
      status: 'all',
      page: 1,
      limit: 10,
    });

    expect(page1.vouchers.length).toBe(10);
    expect(page1.pagination.page).toBe(1);
    expect(page1.pagination.limit).toBe(10);
    expect(page1.pagination.total).toBeGreaterThanOrEqual(15);

    // Get second page (5 items)
    const page2 = await voucherService.getVouchers(testTenant.id, {
      status: 'all',
      page: 2,
      limit: 10,
    });

    expect(page2.vouchers.length).toBeGreaterThanOrEqual(5);
    expect(page2.pagination.page).toBe(2);

    // Verify no overlap between pages
    const page1Codes = page1.vouchers.map(v => v.code);
    const page2Codes = page2.vouchers.map(v => v.code);
    const overlap = page1Codes.filter(code => page2Codes.includes(code));
    expect(overlap).toHaveLength(0);
  });

  it('should filter by date range', async () => {
    // Create voucher today
    const spin1 = await prisma.spin.create({
      data: {
        userId: testCustomer1.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const todayVoucher = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: testPrize.id,
      userId: testCustomer1.id,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    // Create voucher in the past
    const spin2 = await prisma.spin.create({
      data: {
        userId: testCustomer1.id,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const pastVoucher = await prisma.voucher.create({
      data: {
        code: await voucherService.generateVoucherCode(testTenant.slug),
        spinId: spin2.id,
        prizeId: testPrize.id,
        userId: testCustomer1.id,
        tenantId: testTenant.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        redemptionLimit: 1,
        redemptionCount: 0,
        isRedeemed: false,
        createdAt: pastDate,
      },
    });

    // Filter by today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayResults = await voucherService.getVouchers(testTenant.id, {
      startDate: today,
      endDate: tomorrow,
    });

    // Should include today's voucher
    const foundToday = todayResults.vouchers.find(v => v.code === todayVoucher.code);
    expect(foundToday).toBeDefined();

    // Should not include past voucher
    const foundPast = todayResults.vouchers.find(v => v.code === pastVoucher.code);
    expect(foundPast).toBeUndefined();
  });

  it('should export data matching filtered results', async () => {
    // Create vouchers with different statuses
    const activeVoucher = await createTestVoucher(testCustomer1.id, false, false);
    const redeemedVoucher = await createTestVoucher(testCustomer2.id, true, false);

    // Get filtered results (active only)
    const filteredResults = await voucherService.getVouchers(testTenant.id, {
      status: 'active',
    });

    // Get all results
    const allResults = await voucherService.getVouchers(testTenant.id, {
      status: 'all',
    });

    // Verify filtered results only include active vouchers
    const activeInFiltered = filteredResults.vouchers.filter(v => v.status === 'active');
    expect(activeInFiltered.length).toBe(filteredResults.vouchers.length);

    // Verify all results include both active and redeemed
    const activeInAll = allResults.vouchers.filter(v => v.status === 'active');
    const redeemedInAll = allResults.vouchers.filter(v => v.status === 'redeemed');
    expect(activeInAll.length).toBeGreaterThanOrEqual(1);
    expect(redeemedInAll.length).toBeGreaterThanOrEqual(1);
  });

  // Helper function to create test voucher with specific state
  async function createTestVoucher(
    customerId: string,
    shouldRedeem: boolean,
    shouldExpire: boolean
  ) {
    const spin = await prisma.spin.create({
      data: {
        userId: customerId,
        campaignId: testCampaign.id,
        prizeId: testPrize.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    if (shouldExpire) {
      // Create expired voucher directly
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      return await prisma.voucher.create({
        data: {
          code: await voucherService.generateVoucherCode(testTenant.slug),
          spinId: spin.id,
          prizeId: testPrize.id,
          userId: customerId,
          tenantId: testTenant.id,
          expiresAt: pastDate,
          redemptionLimit: 1,
          redemptionCount: 0,
          isRedeemed: false,
        },
      });
    }

    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: testPrize.id,
      userId: customerId,
      tenantId: testTenant.id,
      tenantSlug: testTenant.slug,
      validityDays: testPrize.voucherValidityDays,
      redemptionLimit: testPrize.voucherRedemptionLimit,
      generateQR: testPrize.sendQRCode,
    });

    if (shouldRedeem) {
      await voucherService.redeemVoucher(
        voucher.code,
        testMerchant.id,
        testTenant.id
      );

      // Fetch updated voucher
      return await prisma.voucher.findUnique({
        where: { code: voucher.code },
      });
    }

    return voucher;
  }
});
