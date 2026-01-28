/**
 * End-to-End Tests: Multi-Tenant Isolation
 * 
 * Feature: voucher-redemption-system
 * 
 * Tests strict tenant isolation across all voucher operations:
 * 1. Create vouchers for multiple tenants
 * 2. Verify cross-tenant access is blocked
 * 3. Test validation across tenants
 * 4. Test redemption across tenants
 * 5. Test phone lookup across tenants
 * 6. Test admin dashboard across tenants
 * 
 * Requirements: 10.2, 10.3, 10.4, 10.5
 */

import prisma from '@/lib/prisma';
import * as voucherService from '@/lib/voucher-service';

// Mock QR generator to avoid actual uploads
jest.mock('@/lib/qr-generator', () => ({
  generateVoucherCode: jest.requireActual('@/lib/voucher-service').generateVoucherCode,
  createAndUploadQR: jest.fn().mockResolvedValue('https://example.com/qr/test.png'),
}));

describe('E2E: Multi-Tenant Isolation', () => {
  // Increase timeout for E2E tests
  jest.setTimeout(30000);
  let tenant1: any;
  let tenant2: any;
  let campaign1: any;
  let campaign2: any;
  let customer1: any;
  let customer2: any;
  let merchant1: any;
  let merchant2: any;
  let prize1: any;
  let prize2: any;
  let plan1: any;
  let plan2: any;

  beforeEach(async () => {
    // Create plans
    plan1 = await prisma.plan.create({
      data: {
        name: 'Tenant 1 Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    plan2 = await prisma.plan.create({
      data: {
        name: 'Tenant 2 Plan',
        maxSpins: 10000,
        maxCampaigns: 10,
        campaignDurationDays: 30,
      },
    });

    // Create two separate tenants
    tenant1 = await prisma.tenant.create({
      data: {
        name: 'Tenant One',
        slug: 'acme-corp-' + Date.now(),
        planId: plan1.id,
      },
    });

    tenant2 = await prisma.tenant.create({
      data: {
        name: 'Tenant Two',
        slug: 'beta-inc-' + Date.now(),
        planId: plan2.id,
      },
    });

    // Create campaigns for each tenant
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    campaign1 = await prisma.campaign.create({
      data: {
        name: 'Campaign 1',
        tenantId: tenant1.id,
        spinLimit: 10,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        startDate: now,
        endDate: endDate,
      },
    });

    campaign2 = await prisma.campaign.create({
      data: {
        name: 'Campaign 2',
        tenantId: tenant2.id,
        spinLimit: 10,
        spinCooldown: 24,
        referralsRequiredForSpin: 0,
        startDate: now,
        endDate: endDate,
      },
    });

    // Create customers for each tenant
    customer1 = await prisma.endUser.create({
      data: {
        phone: '+1555000001',
        name: 'Customer Tenant 1',
        tenantId: tenant1.id,
      },
    });

    customer2 = await prisma.endUser.create({
      data: {
        phone: '+1555000002',
        name: 'Customer Tenant 2',
        tenantId: tenant2.id,
      },
    });

    // Create merchants for each tenant
    merchant1 = await prisma.tenantAdmin.create({
      data: {
        email: 'merchant1@test.com',
        name: 'Merchant 1',
        password: 'hashed_password',
        tenantId: tenant1.id,
      },
    });

    merchant2 = await prisma.tenantAdmin.create({
      data: {
        email: 'merchant2@test.com',
        name: 'Merchant 2',
        password: 'hashed_password',
        tenantId: tenant2.id,
      },
    });

    // Create prizes for each tenant
    prize1 = await prisma.prize.create({
      data: {
        name: 'Prize Tenant 1',
        description: 'Prize for tenant 1',
        campaignId: campaign1.id,
        probability: 100,
        position: 1,
        isActive: true,
        voucherValidityDays: 30,
        voucherRedemptionLimit: 1,
        sendQRCode: true,
      },
    });

    prize2 = await prisma.prize.create({
      data: {
        name: 'Prize Tenant 2',
        description: 'Prize for tenant 2',
        campaignId: campaign2.id,
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
    await prisma.voucher.deleteMany({ where: { tenantId: tenant1.id } });
    await prisma.voucher.deleteMany({ where: { tenantId: tenant2.id } });
    await prisma.spin.deleteMany({ where: { campaignId: campaign1.id } });
    await prisma.spin.deleteMany({ where: { campaignId: campaign2.id } });
    await prisma.prize.deleteMany({ where: { campaignId: campaign1.id } });
    await prisma.prize.deleteMany({ where: { campaignId: campaign2.id } });
    await prisma.endUser.deleteMany({ where: { tenantId: tenant1.id } });
    await prisma.endUser.deleteMany({ where: { tenantId: tenant2.id } });
    await prisma.tenantAdmin.deleteMany({ where: { tenantId: tenant1.id } });
    await prisma.tenantAdmin.deleteMany({ where: { tenantId: tenant2.id } });
    await prisma.campaign.deleteMany({ where: { tenantId: tenant1.id } });
    await prisma.campaign.deleteMany({ where: { tenantId: tenant2.id } });
    await prisma.tenant.delete({ where: { id: tenant1.id } });
    await prisma.tenant.delete({ where: { id: tenant2.id } });
    await prisma.plan.delete({ where: { id: plan1.id } });
    await prisma.plan.delete({ where: { id: plan2.id } });
  });

  it('should prevent cross-tenant voucher validation', async () => {
    // Create voucher for tenant 1
    const spin1 = await prisma.spin.create({
      data: {
        userId: customer1.id,
        campaignId: campaign1.id,
        prizeId: prize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: prize1.id,
      userId: customer1.id,
      tenantId: tenant1.id,
      tenantSlug: tenant1.slug,
      validityDays: prize1.voucherValidityDays,
      redemptionLimit: prize1.voucherRedemptionLimit,
      generateQR: prize1.sendQRCode,
    });

    // Tenant 1 should be able to validate their own voucher
    const validationTenant1 = await voucherService.validateVoucher(
      voucher1.code,
      tenant1.id
    );

    expect(validationTenant1.valid).toBe(true);
    expect(validationTenant1.voucher?.code).toBe(voucher1.code);

    // Tenant 2 should NOT be able to validate tenant 1's voucher
    const validationTenant2 = await voucherService.validateVoucher(
      voucher1.code,
      tenant2.id
    );

    expect(validationTenant2.valid).toBe(false);
    expect(validationTenant2.reason).toMatch(/not found|wrong_tenant|invalid/i);
  });

  it('should prevent cross-tenant voucher redemption', async () => {
    // Create voucher for tenant 1
    const spin1 = await prisma.spin.create({
      data: {
        userId: customer1.id,
        campaignId: campaign1.id,
        prizeId: prize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: prize1.id,
      userId: customer1.id,
      tenantId: tenant1.id,
      tenantSlug: tenant1.slug,
      validityDays: prize1.voucherValidityDays,
      redemptionLimit: prize1.voucherRedemptionLimit,
      generateQR: prize1.sendQRCode,
    });

    // Merchant from tenant 2 should NOT be able to redeem tenant 1's voucher
    const redemptionAttempt = await voucherService.redeemVoucher(
      voucher1.code,
      merchant2.id,
      tenant2.id
    );

    expect(redemptionAttempt.success).toBe(false);
    expect(redemptionAttempt.error).toBeDefined();

    // Verify voucher is still not redeemed
    const dbVoucher = await prisma.voucher.findUnique({
      where: { code: voucher1.code },
    });

    expect(dbVoucher?.isRedeemed).toBe(false);
    expect(dbVoucher?.redeemedBy).toBeNull();

    // Merchant from tenant 1 should be able to redeem it
    const validRedemption = await voucherService.redeemVoucher(
      voucher1.code,
      merchant1.id,
      tenant1.id
    );

    expect(validRedemption.success).toBe(true);
  });

  it('should isolate phone lookup by tenant', async () => {
    // Use same phone number for customers in different tenants
    const sharedPhone = '+1555999999';

    // Update customers to have same phone
    await prisma.endUser.update({
      where: { id: customer1.id },
      data: { phone: sharedPhone },
    });

    await prisma.endUser.update({
      where: { id: customer2.id },
      data: { phone: sharedPhone },
    });

    // Create voucher for tenant 1
    const spin1 = await prisma.spin.create({
      data: {
        userId: customer1.id,
        campaignId: campaign1.id,
        prizeId: prize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: prize1.id,
      userId: customer1.id,
      tenantId: tenant1.id,
      tenantSlug: tenant1.slug,
      validityDays: prize1.voucherValidityDays,
      redemptionLimit: prize1.voucherRedemptionLimit,
      generateQR: prize1.sendQRCode,
    });

    // Create voucher for tenant 2
    const spin2 = await prisma.spin.create({
      data: {
        userId: customer2.id,
        campaignId: campaign2.id,
        prizeId: prize2.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher2 = await voucherService.createVoucher({
      spinId: spin2.id,
      prizeId: prize2.id,
      userId: customer2.id,
      tenantId: tenant2.id,
      tenantSlug: tenant2.slug,
      validityDays: prize2.voucherValidityDays,
      redemptionLimit: prize2.voucherRedemptionLimit,
      generateQR: prize2.sendQRCode,
    });

    // Tenant 1 lookup should only return tenant 1's voucher
    const tenant1Vouchers = await voucherService.getVouchersByPhone(
      sharedPhone,
      tenant1.id
    );

    expect(tenant1Vouchers).toHaveLength(1);
    expect(tenant1Vouchers[0].code).toBe(voucher1.code);

    // Tenant 2 lookup should only return tenant 2's voucher
    const tenant2Vouchers = await voucherService.getVouchersByPhone(
      sharedPhone,
      tenant2.id
    );

    expect(tenant2Vouchers).toHaveLength(1);
    expect(tenant2Vouchers[0].code).toBe(voucher2.code);
  });

  it('should isolate admin dashboard by tenant', async () => {
    // Create vouchers for both tenants
    const spin1 = await prisma.spin.create({
      data: {
        userId: customer1.id,
        campaignId: campaign1.id,
        prizeId: prize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: prize1.id,
      userId: customer1.id,
      tenantId: tenant1.id,
      tenantSlug: tenant1.slug,
      validityDays: prize1.voucherValidityDays,
      redemptionLimit: prize1.voucherRedemptionLimit,
      generateQR: prize1.sendQRCode,
    });

    const spin2 = await prisma.spin.create({
      data: {
        userId: customer2.id,
        campaignId: campaign2.id,
        prizeId: prize2.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher2 = await voucherService.createVoucher({
      spinId: spin2.id,
      prizeId: prize2.id,
      userId: customer2.id,
      tenantId: tenant2.id,
      tenantSlug: tenant2.slug,
      validityDays: prize2.voucherValidityDays,
      redemptionLimit: prize2.voucherRedemptionLimit,
      generateQR: prize2.sendQRCode,
    });

    // Tenant 1 admin should only see tenant 1's vouchers
    const tenant1Results = await voucherService.getVouchers(tenant1.id, {
      status: 'all',
    });

    expect(tenant1Results.vouchers.length).toBeGreaterThanOrEqual(1);
    const foundVoucher1 = tenant1Results.vouchers.find(v => v.code === voucher1.code);
    const foundVoucher2InTenant1 = tenant1Results.vouchers.find(v => v.code === voucher2.code);

    expect(foundVoucher1).toBeDefined();
    expect(foundVoucher2InTenant1).toBeUndefined();

    // Tenant 2 admin should only see tenant 2's vouchers
    const tenant2Results = await voucherService.getVouchers(tenant2.id, {
      status: 'all',
    });

    expect(tenant2Results.vouchers.length).toBeGreaterThanOrEqual(1);
    const foundVoucher2 = tenant2Results.vouchers.find(v => v.code === voucher2.code);
    const foundVoucher1InTenant2 = tenant2Results.vouchers.find(v => v.code === voucher1.code);

    expect(foundVoucher2).toBeDefined();
    expect(foundVoucher1InTenant2).toBeUndefined();
  });

  it('should isolate statistics by tenant', async () => {
    // Create 3 vouchers for tenant 1
    for (let i = 0; i < 3; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: customer1.id,
          campaignId: campaign1.id,
          prizeId: prize1.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      await voucherService.createVoucher({
        spinId: spin.id,
        prizeId: prize1.id,
        userId: customer1.id,
        tenantId: tenant1.id,
        tenantSlug: tenant1.slug,
        validityDays: prize1.voucherValidityDays,
        redemptionLimit: prize1.voucherRedemptionLimit,
        generateQR: prize1.sendQRCode,
      });
    }

    // Create 2 vouchers for tenant 2
    for (let i = 0; i < 2; i++) {
      const spin = await prisma.spin.create({
        data: {
          userId: customer2.id,
          campaignId: campaign2.id,
          prizeId: prize2.id,
          wonPrize: true,
          isReferralBonus: false,
        },
      });

      await voucherService.createVoucher({
        spinId: spin.id,
        prizeId: prize2.id,
        userId: customer2.id,
        tenantId: tenant2.id,
        tenantSlug: tenant2.slug,
        validityDays: prize2.voucherValidityDays,
        redemptionLimit: prize2.voucherRedemptionLimit,
        generateQR: prize2.sendQRCode,
      });
    }

    // Get statistics for each tenant
    const stats1 = await voucherService.getVoucherStats(tenant1.id);
    const stats2 = await voucherService.getVoucherStats(tenant2.id);

    // Tenant 1 should have 3 vouchers
    expect(stats1.total).toBe(3);

    // Tenant 2 should have 2 vouchers
    expect(stats2.total).toBe(2);

    // Statistics should not overlap
    expect(stats1.total).not.toBe(stats2.total);
  });

  it('should use tenant-specific code prefixes', async () => {
    // Create voucher for tenant 1
    const spin1 = await prisma.spin.create({
      data: {
        userId: customer1.id,
        campaignId: campaign1.id,
        prizeId: prize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: prize1.id,
      userId: customer1.id,
      tenantId: tenant1.id,
      tenantSlug: tenant1.slug,
      validityDays: prize1.voucherValidityDays,
      redemptionLimit: prize1.voucherRedemptionLimit,
      generateQR: prize1.sendQRCode,
    });

    // Create voucher for tenant 2
    const spin2 = await prisma.spin.create({
      data: {
        userId: customer2.id,
        campaignId: campaign2.id,
        prizeId: prize2.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher2 = await voucherService.createVoucher({
      spinId: spin2.id,
      prizeId: prize2.id,
      userId: customer2.id,
      tenantId: tenant2.id,
      tenantSlug: tenant2.slug,
      validityDays: prize2.voucherValidityDays,
      redemptionLimit: prize2.voucherRedemptionLimit,
      generateQR: prize2.sendQRCode,
    });

    // Verify codes have different prefixes
    const prefix1 = voucher1.code.split('-')[0];
    const prefix2 = voucher2.code.split('-')[0];

    expect(prefix1).not.toBe(prefix2);
    expect(prefix1).toBe(tenant1.slug.slice(0, 4).toUpperCase());
    expect(prefix2).toBe(tenant2.slug.slice(0, 4).toUpperCase());
  });

  it('should prevent search across tenants', async () => {
    // Create voucher for tenant 1
    const spin1 = await prisma.spin.create({
      data: {
        userId: customer1.id,
        campaignId: campaign1.id,
        prizeId: prize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: prize1.id,
      userId: customer1.id,
      tenantId: tenant1.id,
      tenantSlug: tenant1.slug,
      validityDays: prize1.voucherValidityDays,
      redemptionLimit: prize1.voucherRedemptionLimit,
      generateQR: prize1.sendQRCode,
    });

    // Tenant 1 should find their voucher by search
    const tenant1Search = await voucherService.getVouchers(tenant1.id, {
      search: voucher1.code,
    });

    expect(tenant1Search.vouchers.length).toBeGreaterThanOrEqual(1);
    const found = tenant1Search.vouchers.find(v => v.code === voucher1.code);
    expect(found).toBeDefined();

    // Tenant 2 should NOT find tenant 1's voucher by search
    const tenant2Search = await voucherService.getVouchers(tenant2.id, {
      search: voucher1.code,
    });

    const foundInTenant2 = tenant2Search.vouchers.find(v => v.code === voucher1.code);
    expect(foundInTenant2).toBeUndefined();
  });

  it('should maintain isolation after redemption', async () => {
    // Create voucher for tenant 1
    const spin1 = await prisma.spin.create({
      data: {
        userId: customer1.id,
        campaignId: campaign1.id,
        prizeId: prize1.id,
        wonPrize: true,
        isReferralBonus: false,
      },
    });

    const voucher1 = await voucherService.createVoucher({
      spinId: spin1.id,
      prizeId: prize1.id,
      userId: customer1.id,
      tenantId: tenant1.id,
      tenantSlug: tenant1.slug,
      validityDays: prize1.voucherValidityDays,
      redemptionLimit: prize1.voucherRedemptionLimit,
      generateQR: prize1.sendQRCode,
    });

    // Redeem with tenant 1 merchant
    await voucherService.redeemVoucher(
      voucher1.code,
      merchant1.id,
      tenant1.id
    );

    // Verify tenant 1 can see redeemed voucher
    const tenant1Results = await voucherService.getVouchers(tenant1.id, {
      status: 'redeemed',
    });

    const foundInTenant1 = tenant1Results.vouchers.find(v => v.code === voucher1.code);
    expect(foundInTenant1).toBeDefined();
    expect(foundInTenant1?.status).toBe('redeemed');

    // Verify tenant 2 cannot see tenant 1's redeemed voucher
    const tenant2Results = await voucherService.getVouchers(tenant2.id, {
      status: 'redeemed',
    });

    const foundInTenant2 = tenant2Results.vouchers.find(v => v.code === voucher1.code);
    expect(foundInTenant2).toBeUndefined();
  });
});
