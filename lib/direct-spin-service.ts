import { grantBonusSpins } from './bonus-spin-service';
import prisma from './prisma';

/**
 * DirectSpinService
 * 
 * Handles direct spin granting for standee use case (not tied to task completion).
 * Managers can search for customers and grant spins directly.
 */

export interface GrantDirectSpinResult {
  success: boolean;
  spinsGranted: number;
  totalGrantedToUser: number; // Total spins granted to this user by this manager
  remainingLimit: number; // How many more spins can be granted
  error?: string;
}

export interface CustomerSearchResult {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  totalSpinsGranted: number; // By this manager
  remainingLimit: number;
}

/**
 * Grant direct spin to customer (for standee use case)
 * Enforces maxSpinsPerUser limit per manager
 */
export async function grantDirectSpin(
  managerId: string,
  userId: string,
  comment?: string
): Promise<GrantDirectSpinResult> {
  try {
    // 1. Validate manager
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        tenantId: true,
        maxSpinsPerUser: true,
        isActive: true
      }
    });

    if (!manager || !manager.isActive) {
      throw new Error('Manager not found or inactive');
    }

    // 2. Validate user belongs to same tenant
    const user = await prisma.endUser.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    });

    if (!user || user.tenantId !== manager.tenantId) {
      throw new Error('User not found or belongs to different tenant');
    }

    // 3. Check how many spins already granted to this user by this manager
    const existingGrants = await prisma.directSpinGrant.findMany({
      where: {
        managerId,
        userId
      },
      select: { spinsGranted: true }
    });

    const totalGranted = existingGrants.reduce((sum, g) => sum + g.spinsGranted, 0);

    // 4. Check if limit reached
    if (totalGranted >= manager.maxSpinsPerUser) {
      return {
        success: false,
        spinsGranted: 0,
        totalGrantedToUser: totalGranted,
        remainingLimit: 0,
        error: `Limit reached. You have already granted ${totalGranted} spins to this user (max: ${manager.maxSpinsPerUser})`
      };
    }

    // 5. Grant 1 spin (or remaining limit, whichever is less)
    const spinsToGrant = Math.min(1, manager.maxSpinsPerUser - totalGranted);

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create grant record
      const grant = await tx.directSpinGrant.create({
        data: {
          managerId,
          userId,
          tenantId: manager.tenantId,
          spinsGranted: spinsToGrant,
          comment: comment || null
        }
      });

      return grant;
    });

    // 6. Grant bonus spins to user (reuse existing service)
    const spinResult = await grantBonusSpins(
      userId,
      spinsToGrant,
      `Direct spin grant by manager${comment ? `: ${comment}` : ''}`,
      managerId
    );

    if (!spinResult.success) {
      throw new Error(`Failed to grant spins: ${spinResult.error}`);
    }

    // 7. Create audit log (reuse ManagerAuditLog for consistency)
    await prisma.managerAuditLog.create({
      data: {
        managerId,
        tenantId: manager.tenantId,
        action: 'DIRECT_SPIN_GRANT',
        taskCompletionId: null, // No task completion for direct grants
        comment: comment || 'Direct spin grant (standee)',
        bonusSpinsGranted: spinsToGrant
      }
    });

    return {
      success: true,
      spinsGranted: spinsToGrant,
      totalGrantedToUser: totalGranted + spinsToGrant,
      remainingLimit: manager.maxSpinsPerUser - (totalGranted + spinsToGrant)
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in grantDirectSpin:', errorMessage);
    return {
      success: false,
      spinsGranted: 0,
      totalGrantedToUser: 0,
      remainingLimit: 0,
      error: errorMessage
    };
  }
}

/**
 * Search customers by phone or name (for standee use case)
 */
export async function searchCustomers(
  managerId: string,
  searchQuery: string
): Promise<CustomerSearchResult[]> {
  try {
    // Validate manager
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      select: { tenantId: true, maxSpinsPerUser: true }
    });

    if (!manager) {
      throw new Error('Manager not found');
    }

    // Normalize search query (remove spaces, dashes, plus signs for phone search)
    const normalizedQuery = searchQuery.replace(/[\s\-+()]/g, '');
    
    console.log('[searchCustomers] Manager:', managerId, 'Tenant:', manager.tenantId);
    console.log('[searchCustomers] Query:', searchQuery, 'Normalized:', normalizedQuery);
    
    // First, let's check how many users exist in this tenant (for debugging)
    const totalUsersInTenant = await prisma.endUser.count({
      where: { tenantId: manager.tenantId }
    });
    console.log('[searchCustomers] Total users in tenant:', totalUsersInTenant);
    
    // Build search conditions
    const searchConditions: any[] = [
      { phone: { contains: searchQuery } },
      { name: { contains: searchQuery, mode: 'insensitive' } }
    ];
    
    // Add normalized phone search if different
    if (normalizedQuery !== searchQuery) {
      searchConditions.push({ phone: { contains: normalizedQuery } });
    }
    
    // Also try searching last 10 digits (in case phone has country code)
    if (normalizedQuery.length >= 10) {
      const last10 = normalizedQuery.slice(-10);
      searchConditions.push({ phone: { endsWith: last10 } });
    }
    
    // Search users in same tenant
    const users = await prisma.endUser.findMany({
      where: {
        tenantId: manager.tenantId,
        OR: searchConditions
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true
      },
      take: 50 // Limit results
    });
    
    console.log('[searchCustomers] Found users:', users.length);
    if (users.length > 0) {
      console.log('[searchCustomers] Sample user phones:', users.slice(0, 3).map(u => u.phone));
    } else {
      // Try a broader search to see if ANY users exist with this phone (for debugging)
      const anyUserWithPhone = await prisma.endUser.findFirst({
        where: {
          OR: [
            { phone: { contains: searchQuery } },
            { phone: { contains: normalizedQuery } }
          ]
        },
        select: { id: true, phone: true, tenantId: true }
      });
      if (anyUserWithPhone) {
        console.log('[searchCustomers] DEBUG: Found user with phone in different tenant:', {
          phone: anyUserWithPhone.phone,
          tenantId: anyUserWithPhone.tenantId,
          managerTenantId: manager.tenantId
        });
      }
    }

    if (users.length === 0) {
      return [];
    }

    // Get grant counts for each user
    const userIds = users.map(u => u.id);
    const grants = await prisma.directSpinGrant.groupBy({
      by: ['userId'],
      where: {
        managerId,
        userId: { in: userIds }
      },
      _sum: {
        spinsGranted: true
      }
    });

    const grantMap = new Map(
      grants.map(g => [g.userId, g._sum.spinsGranted || 0])
    );

    return users.map(user => {
      const totalGranted = grantMap.get(user.id) || 0;
      return {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        totalSpinsGranted: totalGranted,
        remainingLimit: manager.maxSpinsPerUser - totalGranted
      };
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in searchCustomers:', errorMessage);
    throw error;
  }
}
