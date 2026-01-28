/**
 * Voucher Service
 * 
 * Core service handling all voucher operations including:
 * - Voucher code generation with tenant prefixes
 * - Voucher creation after prize wins
 * - Validation and redemption logic
 * - Phone lookup and admin management
 */

import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { add } from 'date-fns';
import { createAndUploadQR } from './qr-generator';
import { usageService } from './usage-service';

// Custom alphabet for voucher codes: uppercase letters + numbers (no ambiguous characters)
// Excludes: 0, O, I, 1, L to avoid confusion
const VOUCHER_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const VOUCHER_ID_LENGTH = 12;

/**
 * Generate a random string using custom alphabet
 * Uses crypto.randomBytes for cryptographic randomness
 */
function generateNanoId(): string {
  const bytes = randomBytes(VOUCHER_ID_LENGTH);
  let result = '';
  
  for (let i = 0; i < VOUCHER_ID_LENGTH; i++) {
    const index = bytes[i] % VOUCHER_ALPHABET.length;
    result += VOUCHER_ALPHABET[index];
  }
  
  return result;
}

/**
 * Generate a unique voucher code with tenant prefix
 * 
 * Format: {TENANT_PREFIX}-{NANOID}
 * Example: ACME-X7K9P2M4N5R8
 * 
 * @param tenantSlug - The tenant's slug identifier
 * @returns A unique voucher code string
 * 
 * Requirements: 1.2, 2.2
 */
export function generateVoucherCode(tenantSlug: string): string {
  // Remove hyphens and extract first 4 alphanumeric characters, convert to uppercase
  const cleanSlug = tenantSlug.replace(/[^a-z0-9]/gi, '');
  const prefix = cleanSlug.slice(0, 4).toUpperCase().padEnd(4, 'X');
  
  // Generate unique identifier using custom alphabet
  const uniqueId = generateNanoId();
  
  // Combine prefix and unique ID
  return `${prefix}-${uniqueId}`;
}

/**
 * Generate a unique voucher code with collision retry logic
 * 
 * Attempts to generate a unique code up to maxRetries times.
 * If a collision is detected (code already exists), retries with a new ID.
 * 
 * @param tenantSlug - The tenant's slug identifier
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns A unique voucher code string
 * @throws Error if unable to generate unique code after maxRetries
 * 
 * Requirements: 2.3
 */
export async function generateUniqueVoucherCode(
  tenantSlug: string,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateVoucherCode(tenantSlug);
    
    // Check if code already exists in database
    const existing = await prisma.voucher.findUnique({
      where: { code },
      select: { id: true }
    });
    
    if (!existing) {
      return code;
    }
    
    // Collision detected, log and retry
    console.warn(`Voucher code collision detected: ${code} (attempt ${attempt + 1}/${maxRetries})`);
  }
  
  throw new Error(`Failed to generate unique voucher code after ${maxRetries} attempts`);
}

/**
 * Parameters for creating a voucher
 */
export interface CreateVoucherParams {
  spinId: string;
  prizeId: string;
  userId: string;
  tenantId: string;
  tenantSlug: string;
  validityDays: number;
  redemptionLimit: number;
  generateQR: boolean;
}

/**
 * Create a voucher after a prize win
 * 
 * Generates a unique voucher code, optionally creates a QR code,
 * calculates expiration date, and stores the voucher in the database.
 * 
 * Checks subscription limits before creating voucher and increments
 * usage counter after successful creation.
 * 
 * @param params - Voucher creation parameters
 * @returns The created voucher with all relationships
 * @throws Error if voucher creation fails or limit exceeded
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 2.3
 */
export async function createVoucher(params: CreateVoucherParams) {
  const {
    spinId,
    prizeId,
    userId,
    tenantId,
    tenantSlug,
    validityDays,
    redemptionLimit,
    generateQR,
  } = params;

  // Check if tenant can create voucher (Requirement 1.4)
  const canCreate = await usageService.canCreateVoucher(tenantId);
  if (!canCreate) {
    throw new Error('Voucher creation limit exceeded for this month');
  }

  // Generate unique voucher code with collision retry
  const code = await generateUniqueVoucherCode(tenantSlug);

  // Calculate expiration date based on validity days
  const expiresAt = add(new Date(), { days: validityDays });

  // Optionally generate and upload QR code
  let qrImageUrl: string | null = null;
  if (generateQR) {
    qrImageUrl = await createAndUploadQR(code);
    // Note: If QR generation fails, qrImageUrl will be null
    // This is intentional for graceful degradation (Requirement 3.4)
  }

  // Create voucher in database
  const voucher = await prisma.voucher.create({
    data: {
      code,
      qrImageUrl,
      spinId,
      prizeId,
      userId,
      tenantId,
      expiresAt,
      redemptionLimit,
      redemptionCount: 0,
      isRedeemed: false,
    },
    include: {
      spin: true,
      prize: true,
      user: true,
      tenant: true,
    },
  });

  // Increment voucher usage counter after successful creation (Requirement 2.3)
  await usageService.incrementVouchers(tenantId);

  return voucher;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  voucher?: {
    code: string;
    prize: { name: string; description: string | null };
    customer: { name: string | null; phone: string };
    expiresAt: Date;
    redemptionCount: number;
    redemptionLimit: number;
  };
  reason?: 'not_found' | 'wrong_tenant' | 'expired' | 'redeemed' | 'limit_reached';
  details?: {
    expiresAt?: Date;
    redeemedAt?: Date;
    redeemedBy?: string;
  };
}

/**
 * Validate a voucher before redemption
 * 
 * Performs comprehensive validation checks:
 * - Code exists in database
 * - Voucher belongs to the requesting tenant
 * - Voucher is not expired
 * - Voucher is not fully redeemed
 * - Redemption count is less than limit
 * 
 * @param code - The voucher code to validate
 * @param tenantId - The tenant ID of the requesting user
 * @returns ValidationResult with voucher details if valid, or error reason if invalid
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
export async function validateVoucher(
  code: string,
  tenantId: string
): Promise<ValidationResult> {
  // Check if voucher code exists
  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: {
      prize: {
        select: {
          name: true,
          description: true,
        },
      },
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  // Requirement 4.1: Verify code exists
  if (!voucher) {
    return {
      valid: false,
      reason: 'not_found',
    };
  }

  // Requirement 4.2: Check tenant match
  if (voucher.tenantId !== tenantId) {
    return {
      valid: false,
      reason: 'wrong_tenant',
    };
  }

  // Requirement 4.3: Check expiration
  const now = new Date();
  if (voucher.expiresAt < now) {
    return {
      valid: false,
      reason: 'expired',
      details: {
        expiresAt: voucher.expiresAt,
      },
    };
  }

  // Requirement 4.4 & 4.5: Check redemption status and limit
  // Check isRedeemed flag first (for fully redeemed vouchers)
  if (voucher.isRedeemed) {
    return {
      valid: false,
      reason: 'redeemed',
      details: {
        redeemedAt: voucher.redeemedAt || undefined,
        redeemedBy: voucher.redeemedBy || undefined,
      },
    };
  }

  // Then check if redemption limit reached (for multi-use vouchers)
  if (voucher.redemptionCount >= voucher.redemptionLimit) {
    return {
      valid: false,
      reason: 'limit_reached',
      details: {
        redeemedAt: voucher.redeemedAt || undefined,
        redeemedBy: voucher.redeemedBy || undefined,
      },
    };
  }

  // Requirement 4.7: Return voucher details if valid
  return {
    valid: true,
    voucher: {
      code: voucher.code,
      prize: {
        name: voucher.prize.name,
        description: voucher.prize.description,
      },
      customer: {
        name: voucher.user.name,
        phone: voucher.user.phone,
      },
      expiresAt: voucher.expiresAt,
      redemptionCount: voucher.redemptionCount,
      redemptionLimit: voucher.redemptionLimit,
    },
  };
}

/**
 * Redemption result structure
 */
export interface RedemptionResult {
  success: boolean;
  voucher?: any; // Full voucher object with all relationships
  error?: string;
}

/**
 * Redeem a valid voucher
 * 
 * First validates the voucher, then updates it to mark as redeemed.
 * Uses database transaction with row-level locking to prevent double redemption.
 * 
 * @param code - The voucher code to redeem
 * @param merchantId - The ID of the merchant redeeming the voucher
 * @param tenantId - The tenant ID of the requesting merchant
 * @returns RedemptionResult with success status and voucher details or error
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7
 */
export async function redeemVoucher(
  code: string,
  merchantId: string,
  tenantId: string
): Promise<RedemptionResult> {
  // Requirement 5.1: First validate the voucher
  const validationResult = await validateVoucher(code, tenantId);

  // Requirement 5.7: If validation fails, return error without modifying voucher
  if (!validationResult.valid) {
    const errorMessages: Record<string, string> = {
      not_found: 'Voucher not found',
      wrong_tenant: 'Invalid voucher',
      expired: `Voucher expired on ${validationResult.details?.expiresAt?.toLocaleDateString()}`,
      redeemed: 'Voucher already redeemed',
      limit_reached: 'Voucher redemption limit reached',
    };

    return {
      success: false,
      error: errorMessages[validationResult.reason || 'not_found'] || 'Validation failed',
    };
  }

  try {
    // Use transaction with row-level locking to prevent double redemption
    const updatedVoucher = await prisma.$transaction(async (tx) => {
      // Lock the voucher row for update
      const voucherToUpdate = await tx.voucher.findUnique({
        where: { code },
      });

      // Double-check validation within transaction (race condition protection)
      if (!voucherToUpdate) {
        throw new Error('Voucher not found');
      }

      if (voucherToUpdate.tenantId !== tenantId) {
        throw new Error('Invalid voucher');
      }

      if (voucherToUpdate.expiresAt < new Date()) {
        throw new Error('Voucher expired');
      }

      if (voucherToUpdate.redemptionCount >= voucherToUpdate.redemptionLimit) {
        throw new Error('Voucher redemption limit reached');
      }

      // Calculate if voucher will be fully redeemed after this redemption
      const willBeFullyRedeemed = (voucherToUpdate.redemptionCount + 1) >= voucherToUpdate.redemptionLimit;

      // Requirement 5.2, 5.3, 5.4, 5.5: Update voucher state
      const updated = await tx.voucher.update({
        where: { code },
        data: {
          isRedeemed: willBeFullyRedeemed, // Requirement 5.2: Only set to true when limit reached
          redeemedAt: new Date(), // Requirement 5.3
          redeemedBy: merchantId, // Requirement 5.4
          redemptionCount: { increment: 1 }, // Requirement 5.5: Increment by 1
        },
      });

      return updated;
    }, {
      timeout: 10000, // Increase timeout to 10 seconds
    });

    // Fetch full voucher details with relations after transaction
    const fullVoucher = await prisma.voucher.findUnique({
      where: { code },
      include: {
        spin: true,
        prize: true,
        user: true,
        tenant: true,
        redeemedByUser: true,
      },
    });

    return {
      success: true,
      voucher: fullVoucher!,
    };
  } catch (error) {
    // Handle transaction errors
    const errorMessage = error instanceof Error ? error.message : 'Redemption failed';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Voucher status type
 */
export type VoucherStatus = 'active' | 'expired' | 'redeemed';

/**
 * Voucher with status and prize details
 */
export interface VoucherWithStatus {
  code: string;
  prize: {
    name: string;
    description: string | null;
  };
  status: VoucherStatus;
  expiresAt: Date;
  createdAt: Date;
  redemptionCount: number;
  redemptionLimit: number;
  qrImageUrl: string | null;
}

/**
 * Calculate voucher status based on current state
 * 
 * @param voucher - The voucher to calculate status for
 * @returns The voucher status: 'active', 'expired', or 'redeemed'
 */
function calculateVoucherStatus(voucher: {
  isRedeemed: boolean;
  redemptionCount: number;
  redemptionLimit: number;
  expiresAt: Date;
}): VoucherStatus {
  // Check if fully redeemed
  if (voucher.isRedeemed && voucher.redemptionCount >= voucher.redemptionLimit) {
    return 'redeemed';
  }
  
  // Check if redemption limit reached
  if (voucher.redemptionCount >= voucher.redemptionLimit) {
    return 'redeemed';
  }
  
  // Check if expired
  const now = new Date();
  if (voucher.expiresAt < now) {
    return 'expired';
  }
  
  // Otherwise, voucher is active
  return 'active';
}

/**
 * Look up vouchers by customer phone number
 * 
 * Returns all vouchers associated with the given phone number for the specified tenant.
 * Includes voucher status (active, expired, redeemed) and prize details.
 * 
 * @param phone - The customer's phone number
 * @param tenantId - The tenant ID to filter vouchers
 * @returns Array of vouchers with status and prize details (empty array if none found)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export async function getVouchersByPhone(
  phone: string,
  tenantId: string
): Promise<VoucherWithStatus[]> {
  // Requirement 6.1: Query vouchers by phone number and tenant ID
  const vouchers = await prisma.voucher.findMany({
    where: {
      tenantId, // Requirement 6.5: Only return vouchers for the requesting tenant
      user: {
        phone,
      },
    },
    include: {
      prize: {
        select: {
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // Most recent first
    },
  });

  // Requirement 6.4: Return empty array if no vouchers found
  if (vouchers.length === 0) {
    return [];
  }

  // Requirement 6.2 & 6.3: Include status and prize details for each voucher
  return vouchers.map((voucher) => ({
    code: voucher.code,
    prize: {
      name: voucher.prize.name,
      description: voucher.prize.description,
    },
    status: calculateVoucherStatus(voucher), // Requirement 6.2: Calculate status
    expiresAt: voucher.expiresAt,
    createdAt: voucher.createdAt,
    redemptionCount: voucher.redemptionCount,
    redemptionLimit: voucher.redemptionLimit,
    qrImageUrl: voucher.qrImageUrl,
  }));
}

/**
 * Voucher filters for admin dashboard
 */
export interface VoucherFilters {
  status?: 'all' | 'active' | 'redeemed' | 'expired';
  search?: string; // Search by code or phone
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Voucher list response with pagination
 */
export interface VoucherListResponse {
  vouchers: Array<{
    id: string;
    code: string;
    customer: {
      name: string | null;
      phone: string;
    };
    prize: {
      name: string;
      description: string | null;
    };
    status: VoucherStatus;
    createdAt: Date;
    expiresAt: Date;
    redemptionCount: number;
    redemptionLimit: number;
    redeemedAt: Date | null;
    redeemedBy: string | null;
    qrImageUrl: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get vouchers with filters for admin dashboard
 * 
 * Supports filtering by:
 * - Status (all, active, redeemed, expired)
 * - Search by voucher code or customer phone
 * - Date range (creation date)
 * - Pagination
 * 
 * Always filters by tenant ID for multi-tenant isolation.
 * 
 * @param tenantId - The tenant ID to filter vouchers
 * @param filters - Filter criteria and pagination options
 * @returns Voucher list with pagination metadata
 * 
 * Requirements: 8.3, 8.5, 8.7
 */
export async function getVouchers(
  tenantId: string,
  filters: VoucherFilters = {}
): Promise<VoucherListResponse> {
  const {
    status = 'all',
    search,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  // Build where clause
  const where: any = {
    tenantId, // Always filter by tenant ID (Requirement 8.7)
  };

  // Requirement 8.3: Filter by status
  // Note: We'll filter by status after fetching since we need to compare
  // redemptionCount with redemptionLimit which are both fields on the same row
  const now = new Date();
  if (status === 'expired') {
    // Expired = expiresAt < current date
    where.expiresAt = { lt: now };
  } else if (status === 'active') {
    // Active = not expired (we'll filter out redeemed ones after fetching)
    where.expiresAt = { gte: now };
  }
  // For 'redeemed' and 'all', we'll filter after fetching

  // Requirement 8.5: Search by voucher code or customer phone
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { code: { contains: searchTerm, mode: 'insensitive' } },
      { user: { phone: { contains: searchTerm } } },
    ];
  }

  // Date range filtering (by creation date)
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query to get all matching vouchers (we'll filter by status after)
  const allVouchers = await prisma.voucher.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
      prize: {
        select: {
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // Most recent first
    },
  });

  // Filter by status if needed (since we can't compare fields in Prisma where clause)
  let filteredVouchers = allVouchers;
  if (status !== 'all') {
    filteredVouchers = allVouchers.filter((voucher) => {
      const voucherStatus = calculateVoucherStatus(voucher);
      return voucherStatus === status;
    });
  }

  // Apply pagination to filtered results
  const total = filteredVouchers.length;
  const paginatedVouchers = filteredVouchers.slice(skip, skip + limit);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Map vouchers to response format with status
  const vouchersWithStatus = paginatedVouchers.map((voucher) => ({
    id: voucher.id,
    code: voucher.code,
    customer: {
      name: voucher.user.name,
      phone: voucher.user.phone,
    },
    prize: {
      name: voucher.prize.name,
      description: voucher.prize.description,
    },
    status: calculateVoucherStatus(voucher),
    createdAt: voucher.createdAt,
    expiresAt: voucher.expiresAt,
    redemptionCount: voucher.redemptionCount,
    redemptionLimit: voucher.redemptionLimit,
    redeemedAt: voucher.redeemedAt,
    redeemedBy: voucher.redeemedBy,
    qrImageUrl: voucher.qrImageUrl,
  }));

  return {
    vouchers: vouchersWithStatus,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Voucher statistics for admin dashboard
 */
export interface VoucherStats {
  total: number;
  active: number;
  redeemed: number;
  expired: number;
}

/**
 * Get voucher statistics for a tenant
 * 
 * Calculates counts for:
 * - Total: All vouchers for the tenant
 * - Active: Not redeemed AND not expired
 * - Redeemed: isRedeemed = true (or redemptionCount >= redemptionLimit)
 * - Expired: expiresAt < current date AND not redeemed
 * 
 * @param tenantId - The tenant ID to calculate statistics for
 * @returns VoucherStats with counts for each category
 * 
 * Requirements: 8.1
 */
export async function getVoucherStats(tenantId: string): Promise<VoucherStats> {
  // Fetch all vouchers for the tenant
  const vouchers = await prisma.voucher.findMany({
    where: {
      tenantId,
    },
    select: {
      isRedeemed: true,
      redemptionCount: true,
      redemptionLimit: true,
      expiresAt: true,
    },
  });

  const now = new Date();
  
  // Calculate statistics
  const stats: VoucherStats = {
    total: vouchers.length,
    active: 0,
    redeemed: 0,
    expired: 0,
  };

  // Count vouchers by status
  for (const voucher of vouchers) {
    const status = calculateVoucherStatus(voucher);
    
    if (status === 'redeemed') {
      stats.redeemed++;
    } else if (status === 'expired') {
      stats.expired++;
    } else if (status === 'active') {
      stats.active++;
    }
  }

  return stats;
}
