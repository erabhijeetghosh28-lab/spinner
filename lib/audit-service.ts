/**
 * AuditService
 * 
 * Provides audit logging functionality for Super Admin actions.
 * Tracks all administrative operations with details including
 * admin ID, action type, target entity, changes, and metadata.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import prisma from './prisma';

export interface AuditLogData {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface QueryLogsParams {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AuditService {
  /**
   * Create an audit log entry
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
   */
  async logAction(data: AuditLogData) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          adminId: data.adminId,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          changes: data.changes || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Query audit logs with filtering and pagination
   * Requirements: 9.8, 9.9, 9.10
   */
  async queryLogs(params: QueryLogsParams) {
    const {
      page = 1,
      limit = 50,
      adminId,
      action,
      startDate,
      endDate
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (adminId) {
      where.adminId = adminId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    };
  }

  /**
   * Get audit logs for a specific target entity
   */
  async getLogsForTarget(targetType: string, targetId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        targetType,
        targetId
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return logs;
  }

  /**
   * Get recent audit logs for an admin
   */
  async getRecentLogsForAdmin(adminId: string, limit: number = 20) {
    const logs = await prisma.auditLog.findMany({
      where: {
        adminId
      },
      take: limit,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return logs;
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [totalLogs, actionCounts] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true
        },
        orderBy: {
          _count: {
            action: 'desc'
          }
        }
      })
    ]);

    return {
      totalLogs,
      actionCounts: actionCounts.map(item => ({
        action: item.action,
        count: item._count.action
      }))
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();

// Helper function to extract IP address from request
export function getIpAddress(request: Request): string | undefined {
  const headers = request.headers;
  return headers.get('x-forwarded-for')?.split(',')[0].trim() || 
         headers.get('x-real-ip') || 
         undefined;
}

// Helper function to extract user agent from request
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
