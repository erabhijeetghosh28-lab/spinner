/**
 * SecurityService
 * 
 * Provides security monitoring and threat detection functionality.
 * Tracks failed logins, detects suspicious activity, and manages
 * tenant account locking/unlocking.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.8
 */

import prisma from './prisma';

export interface SecurityDashboard {
  alerts: SecurityAlert[];
  suspiciousActivity: SuspiciousActivity[];
  failedLogins: FailedLoginSummary[];
}

export interface SecurityAlert {
  id: string;
  tenantId: string;
  tenantName: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  metadata?: any;
  resolved: boolean;
  createdAt: Date;
}

export interface SuspiciousActivity {
  tenantId: string;
  tenantName: string;
  activityType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedAt: Date;
}

export interface FailedLoginSummary {
  tenantId: string;
  tenantName: string;
  failedCount: number;
  lastFailedAt: Date | null;
}

export class SecurityService {
  /**
   * Track a failed login attempt
   * Requirements: 14.1
   */
  async trackFailedLogin(tenantId: string): Promise<void> {
    try {
      // Increment failed login count and update timestamp
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          failedLoginCount: { increment: 1 },
          lastFailedLogin: new Date()
        }
      });

      // Check if threshold exceeded (>10 failed logins in 1 hour)
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          failedLoginCount: true,
          lastFailedLogin: true,
          name: true
        }
      });

      if (tenant && tenant.failedLoginCount > 10) {
        // Check if within 1 hour window
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (tenant.lastFailedLogin && tenant.lastFailedLogin > oneHourAgo) {
          // Create security alert
          await this.createSecurityEvent({
            tenantId,
            eventType: 'FAILED_LOGIN',
            severity: 'HIGH',
            description: `Tenant "${tenant.name}" has ${tenant.failedLoginCount} failed login attempts in the last hour`,
            metadata: {
              failedCount: tenant.failedLoginCount,
              lastFailedAt: tenant.lastFailedLogin
            }
          });
        }
      }
    } catch (error) {
      console.error('Error tracking failed login:', error);
      throw error;
    }
  }

  /**
   * Detect suspicious activity for a tenant
   * Requirements: 14.2, 14.3, 14.4
   */
  async detectSuspiciousActivity(tenantId: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          spins: {
            where: {
              spinDate: { gte: oneHourAgo }
            }
          },
          endUsers: {
            where: {
              createdAt: { gte: oneDayAgo }
            }
          }
        } as any
      });

      if (!tenant) {
        return alerts;
      }

      // Check for suspicious spin activity (>1000 spins in 1 hour)
      const spinsInLastHour = tenant.spins.length;
      if (spinsInLastHour > 1000) {
        const alert = await this.createSecurityEvent({
          tenantId,
          eventType: 'SUSPICIOUS_SPINS',
          severity: 'HIGH',
          description: `Tenant "${tenant.name}" generated ${spinsInLastHour} spins in the last hour`,
          metadata: {
            spinsCount: spinsInLastHour,
            timeWindow: '1 hour'
          }
        });
        alerts.push(this.formatSecurityAlert(alert, tenant.name));
      }

      // Check for suspicious user creation (>500 users in 1 day)
      const usersInLastDay = tenant.endUsers.length;
      if (usersInLastDay > 500) {
        const alert = await this.createSecurityEvent({
          tenantId,
          eventType: 'SUSPICIOUS_USERS',
          severity: 'MEDIUM',
          description: `Tenant "${tenant.name}" created ${usersInLastDay} users in the last day`,
          metadata: {
            usersCount: usersInLastDay,
            timeWindow: '1 day'
          }
        });
        alerts.push(this.formatSecurityAlert(alert, tenant.name));
      }

      return alerts;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      throw error;
    }
  }

  /**
   * Lock a tenant account
   * Requirements: 14.5, 14.7
   */
  async lockTenant(tenantId: string, adminId: string, reason: string): Promise<void> {
    try {
      // Check if tenant is already locked
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { isLocked: true }
      });

      if (tenant?.isLocked) {
        throw new Error('Tenant account is already locked');
      }

      // Lock the tenant
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: adminId
        }
      });

      // Create security event
      await this.createSecurityEvent({
        tenantId,
        eventType: 'ACCOUNT_LOCKED',
        severity: 'HIGH',
        description: reason,
        metadata: {
          lockedBy: adminId,
          lockedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error locking tenant:', error);
      throw error;
    }
  }

  /**
   * Unlock a tenant account
   * Requirements: 14.6, 14.7
   */
  async unlockTenant(tenantId: string, adminId: string): Promise<void> {
    try {
      // Check if tenant is locked
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { isLocked: true }
      });

      if (!tenant?.isLocked) {
        throw new Error('Tenant account is not locked');
      }

      // Unlock the tenant and reset failed login count
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          isLocked: false,
          lockedAt: null,
          lockedBy: null,
          failedLoginCount: 0,
          lastFailedLogin: null
        }
      });

      // Create security event
      await this.createSecurityEvent({
        tenantId,
        eventType: 'ACCOUNT_UNLOCKED',
        severity: 'LOW',
        description: 'Account unlocked by Super Admin',
        metadata: {
          unlockedBy: adminId,
          unlockedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error unlocking tenant:', error);
      throw error;
    }
  }

  /**
   * Get security dashboard data
   * Requirements: 14.8
   */
  async getSecurityDashboard(): Promise<SecurityDashboard> {
    try {
      // Get all unresolved security events
      const securityEvents = await prisma.securityEvent.findMany({
        where: {
          resolved: false
        },
        include: {
          tenant: {
            select: {
              name: true
            }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 100
      });

      // Get tenants with failed logins
      const tenantsWithFailedLogins = await prisma.tenant.findMany({
        where: {
          failedLoginCount: { gt: 0 }
        },
        select: {
          id: true,
          name: true,
          failedLoginCount: true,
          lastFailedLogin: true
        },
        orderBy: {
          failedLoginCount: 'desc'
        },
        take: 50
      });

      // Format alerts
      const alerts: SecurityAlert[] = securityEvents.map(event => ({
        id: event.id,
        tenantId: event.tenantId,
        tenantName: event.tenant.name,
        eventType: event.eventType,
        severity: event.severity as 'LOW' | 'MEDIUM' | 'HIGH',
        description: event.description,
        metadata: event.metadata,
        resolved: event.resolved,
        createdAt: event.createdAt
      }));

      // Format suspicious activity (recent high-severity events)
      const suspiciousActivity: SuspiciousActivity[] = securityEvents
        .filter(event => event.severity === 'HIGH' || event.severity === 'MEDIUM')
        .map(event => ({
          tenantId: event.tenantId,
          tenantName: event.tenant.name,
          activityType: event.eventType,
          description: event.description,
          severity: event.severity as 'LOW' | 'MEDIUM' | 'HIGH',
          detectedAt: event.createdAt
        }));

      // Format failed logins
      const failedLogins: FailedLoginSummary[] = tenantsWithFailedLogins.map(tenant => ({
        tenantId: tenant.id,
        tenantName: tenant.name,
        failedCount: tenant.failedLoginCount,
        lastFailedAt: tenant.lastFailedLogin
      }));

      return {
        alerts,
        suspiciousActivity,
        failedLogins
      };
    } catch (error) {
      console.error('Error getting security dashboard:', error);
      throw error;
    }
  }

  /**
   * Resolve a security event
   */
  async resolveSecurityEvent(eventId: string, adminId: string): Promise<void> {
    try {
      await prisma.securityEvent.update({
        where: { id: eventId },
        data: {
          resolved: true,
          resolvedBy: adminId,
          resolvedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error resolving security event:', error);
      throw error;
    }
  }

  /**
   * Create a security event
   * Private helper method
   */
  private async createSecurityEvent(data: {
    tenantId: string;
    eventType: string;
    severity: string;
    description: string;
    metadata?: any;
  }) {
    return await prisma.securityEvent.create({
      data: {
        tenantId: data.tenantId,
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        metadata: data.metadata || null
      },
      include: {
        tenant: {
          select: {
            name: true
          }
        }
      }
    });
  }

  /**
   * Format security event as alert
   * Private helper method
   */
  private formatSecurityAlert(event: any, tenantName: string): SecurityAlert {
    return {
      id: event.id,
      tenantId: event.tenantId,
      tenantName,
      eventType: event.eventType,
      severity: event.severity as 'LOW' | 'MEDIUM' | 'HIGH',
      description: event.description,
      metadata: event.metadata,
      resolved: event.resolved,
      createdAt: event.createdAt
    };
  }

  /**
   * Get security events for a specific tenant
   */
  async getSecurityEventsForTenant(tenantId: string, includeResolved: boolean = false): Promise<SecurityAlert[]> {
    try {
      const where: any = { tenantId };
      if (!includeResolved) {
        where.resolved = false;
      }

      const events = await prisma.securityEvent.findMany({
        where,
        include: {
          tenant: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return events.map(event => ({
        id: event.id,
        tenantId: event.tenantId,
        tenantName: event.tenant.name,
        eventType: event.eventType,
        severity: event.severity as 'LOW' | 'MEDIUM' | 'HIGH',
        description: event.description,
        metadata: event.metadata,
        resolved: event.resolved,
        createdAt: event.createdAt
      }));
    } catch (error) {
      console.error('Error getting security events for tenant:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService();
