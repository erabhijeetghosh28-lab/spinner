import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

/**
 * Manager Authentication Utilities
 * 
 * Provides password hashing, token generation, and token validation
 * for manager authentication in the multi-tenant platform.
 */

// Token storage (in production, use Redis or database)
// Map of token -> { managerId, tenantId, role, expiresAt }
const tokenStore = new Map<string, {
  managerId: string;
  tenantId: string;
  role: 'manager';
  expiresAt: number;
}>();

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure authentication token for a manager
 * @param managerId - Manager's unique identifier
 * @param tenantId - Tenant's unique identifier
 * @returns Authentication token
 */
export function generateManagerToken(managerId: string, tenantId: string): string {
  // Generate a secure random token
  const tokenBytes = randomBytes(32);
  const token = `mgr_${tokenBytes.toString('hex')}`;
  
  // Store token with metadata
  const expiresAt = Date.now() + TOKEN_EXPIRATION_MS;
  tokenStore.set(token, {
    managerId,
    tenantId,
    role: 'manager',
    expiresAt
  });
  
  return token;
}

/**
 * Validate and decode a manager authentication token
 * @param token - Authentication token
 * @returns Token payload if valid, null otherwise
 */
export function validateManagerToken(token: string): {
  managerId: string;
  tenantId: string;
  role: 'manager';
} | null {
  const tokenData = tokenStore.get(token);
  
  if (!tokenData) {
    return null;
  }
  
  // Check if token has expired
  if (Date.now() > tokenData.expiresAt) {
    // Remove expired token
    tokenStore.delete(token);
    return null;
  }
  
  return {
    managerId: tokenData.managerId,
    tenantId: tokenData.tenantId,
    role: tokenData.role
  };
}

/**
 * Invalidate a manager authentication token (logout)
 * @param token - Authentication token to invalidate
 * @returns True if token was invalidated, false if token didn't exist
 */
export function invalidateManagerToken(token: string): boolean {
  return tokenStore.delete(token);
}

/**
 * Clean up expired tokens (should be called periodically)
 */
export function cleanupExpiredTokens(): number {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(token);
      cleanedCount++;
    }
  }
  
  return cleanedCount;
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
}
