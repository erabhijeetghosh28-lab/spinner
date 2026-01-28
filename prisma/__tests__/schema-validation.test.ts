import { PrismaClient } from '@prisma/client';

describe('Super Admin Controls Schema Validation', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('SubscriptionPlan Model', () => {
    it('should have spinsPerMonth and vouchersPerMonth fields', async () => {
      // This test validates that the schema includes the new fields
      const planData = {
        name: 'Test Plan',
        price: 999,
        interval: 'MONTHLY',
        spinsPerMonth: 5000,
        vouchersPerMonth: 2000,
      };

      // Type checking ensures fields exist
      const plan = await prisma.subscriptionPlan.create({
        data: planData,
      });

      expect(plan.spinsPerMonth).toBe(5000);
      expect(plan.vouchersPerMonth).toBe(2000);

      // Cleanup
      await prisma.subscriptionPlan.delete({ where: { id: plan.id } });
    });
  });

  describe('MonthlyUsage Model', () => {
    it('should create MonthlyUsage record with composite unique key', async () => {
      // First create a tenant with required relations
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan',
          maxSpins: 1000,
        },
      });

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          slug: 'test-tenant-' + Date.now(),
          planId: plan.id,
        },
      });

      const usage = await prisma.monthlyUsage.create({
        data: {
          tenantId: tenant.id,
          month: 1,
          year: 2024,
          spinsUsed: 100,
          vouchersUsed: 50,
        },
      });

      expect(usage.spinsUsed).toBe(100);
      expect(usage.vouchersUsed).toBe(50);
      expect(usage.month).toBe(1);
      expect(usage.year).toBe(2024);

      // Cleanup
      await prisma.monthlyUsage.delete({ where: { id: usage.id } });
      await prisma.tenant.delete({ where: { id: tenant.id } });
      await prisma.plan.delete({ where: { id: plan.id } });
    });

    it('should enforce unique constraint on (tenantId, month, year)', async () => {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan 2',
          maxSpins: 1000,
        },
      });

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant 2',
          slug: 'test-tenant-2-' + Date.now(),
          planId: plan.id,
        },
      });

      await prisma.monthlyUsage.create({
        data: {
          tenantId: tenant.id,
          month: 2,
          year: 2024,
        },
      });

      // Attempting to create duplicate should fail
      await expect(
        prisma.monthlyUsage.create({
          data: {
            tenantId: tenant.id,
            month: 2,
            year: 2024,
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.monthlyUsage.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.tenant.delete({ where: { id: tenant.id } });
      await prisma.plan.delete({ where: { id: plan.id } });
    });
  });

  describe('TenantLimitOverride Model', () => {
    it('should create TenantLimitOverride with admin relation', async () => {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan 3',
          maxSpins: 1000,
        },
      });

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant 3',
          slug: 'test-tenant-3-' + Date.now(),
          planId: plan.id,
        },
      });

      const admin = await prisma.admin.create({
        data: {
          email: 'test-admin-' + Date.now() + '@example.com',
          password: 'hashed_password',
          name: 'Test Admin',
          isSuperAdmin: true,
        },
      });

      const override = await prisma.tenantLimitOverride.create({
        data: {
          tenantId: tenant.id,
          bonusSpins: 1000,
          bonusVouchers: 500,
          reason: 'Test bonus grant',
          grantedBy: admin.id,
        },
      });

      expect(override.bonusSpins).toBe(1000);
      expect(override.bonusVouchers).toBe(500);
      expect(override.reason).toBe('Test bonus grant');
      expect(override.isActive).toBe(true);

      // Cleanup
      await prisma.tenantLimitOverride.delete({ where: { id: override.id } });
      await prisma.admin.delete({ where: { id: admin.id } });
      await prisma.tenant.delete({ where: { id: tenant.id } });
      await prisma.plan.delete({ where: { id: plan.id } });
    });
  });

  describe('AuditLog Model', () => {
    it('should create AuditLog with all required fields', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: 'audit-admin-' + Date.now() + '@example.com',
          password: 'hashed_password',
          name: 'Audit Admin',
          isSuperAdmin: true,
        },
      });

      const auditLog = await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'EDIT_TENANT',
          targetType: 'Tenant',
          targetId: 'tenant-123',
          changes: { field: 'name', before: 'Old Name', after: 'New Name' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });

      expect(auditLog.action).toBe('EDIT_TENANT');
      expect(auditLog.targetType).toBe('Tenant');
      expect(auditLog.targetId).toBe('tenant-123');
      expect(auditLog.ipAddress).toBe('192.168.1.1');

      // Cleanup
      await prisma.auditLog.delete({ where: { id: auditLog.id } });
      await prisma.admin.delete({ where: { id: admin.id } });
    });
  });

  describe('Tenant Model Security Fields', () => {
    it('should have security tracking fields', async () => {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan 4',
          maxSpins: 1000,
        },
      });

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant 4',
          slug: 'test-tenant-4-' + Date.now(),
          planId: plan.id,
          isLocked: false,
          failedLoginCount: 0,
        },
      });

      expect(tenant.isLocked).toBe(false);
      expect(tenant.failedLoginCount).toBe(0);
      expect(tenant.lastFailedLogin).toBeNull();
      expect(tenant.lockedAt).toBeNull();
      expect(tenant.lockedBy).toBeNull();

      // Update security fields
      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          failedLoginCount: 3,
          lastFailedLogin: new Date(),
        },
      });

      expect(updated.failedLoginCount).toBe(3);
      expect(updated.lastFailedLogin).not.toBeNull();

      // Cleanup
      await prisma.tenant.delete({ where: { id: tenant.id } });
      await prisma.plan.delete({ where: { id: plan.id } });
    });
  });

  describe('SecurityEvent Model', () => {
    it('should create SecurityEvent with tenant relation', async () => {
      const plan = await prisma.plan.create({
        data: {
          name: 'Test Plan 5',
          maxSpins: 1000,
        },
      });

      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant 5',
          slug: 'test-tenant-5-' + Date.now(),
          planId: plan.id,
        },
      });

      const securityEvent = await prisma.securityEvent.create({
        data: {
          tenantId: tenant.id,
          eventType: 'FAILED_LOGIN',
          severity: 'MEDIUM',
          description: 'Multiple failed login attempts detected',
          metadata: { count: 5, timeWindow: '1 hour' },
        },
      });

      expect(securityEvent.eventType).toBe('FAILED_LOGIN');
      expect(securityEvent.severity).toBe('MEDIUM');
      expect(securityEvent.resolved).toBe(false);

      // Cleanup
      await prisma.securityEvent.delete({ where: { id: securityEvent.id } });
      await prisma.tenant.delete({ where: { id: tenant.id } });
      await prisma.plan.delete({ where: { id: plan.id } });
    });
  });

  describe('Notification Model', () => {
    it('should create Notification with admin relation', async () => {
      const admin = await prisma.admin.create({
        data: {
          email: 'notif-admin-' + Date.now() + '@example.com',
          password: 'hashed_password',
          name: 'Notification Admin',
          isSuperAdmin: true,
        },
      });

      const notification = await prisma.notification.create({
        data: {
          subject: 'Test Notification',
          body: 'This is a test notification body',
          recipientType: 'ALL_TENANTS',
          sentBy: admin.id,
          recipientCount: 10,
        },
      });

      expect(notification.subject).toBe('Test Notification');
      expect(notification.recipientType).toBe('ALL_TENANTS');
      expect(notification.recipientCount).toBe(10);

      // Cleanup
      await prisma.notification.delete({ where: { id: notification.id } });
      await prisma.admin.delete({ where: { id: admin.id } });
    });
  });
});
