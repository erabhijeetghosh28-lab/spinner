import {
    generateManagerToken,
    invalidateManagerToken,
    validateManagerToken
} from './manager-auth-utils';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

/**
 * Manager Authentication Service
 * 
 * Handles manager authentication operations including login, logout,
 * and token validation. Enforces business rules such as inactive
 * account prevention.
 * 
 * Requirements: 2.2, 2.3, 2.5, 1.5
 */

export interface LoginResult {
  success: boolean;
  token?: string;
  manager?: {
    id: string;
    name: string;
    tenantId: string;
    maxBonusSpinsPerApproval: number;
    maxSpinsPerUser: number;
  };
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

export interface ValidateTokenResult {
  valid: boolean;
  managerId?: string;
  tenantId?: string;
  role?: 'manager';
  error?: string;
}

/**
 * Manager Authentication Service
 */
export class ManagerAuthService {
  /**
   * Authenticate a manager with ID and PIN (credentials created by tenant admin)
   * 
   * @param managerId - Manager's ID assigned by tenant admin
   * @param pin - Manager's 4-digit PIN
   * @returns Login result with token and manager info on success
   * 
   * Requirements:
   * - 2.2: Authenticate manager and create session token
   * - 2.3: Reject invalid credentials
   * - 1.5: Prevent inactive managers from logging in
   */
  async login(managerId: string, pin: string): Promise<LoginResult> {
    try {
      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(pin)) {
        return {
          success: false,
          error: 'PIN must be exactly 4 digits'
        };
      }

      // Find manager by ID
      const manager = await prisma.manager.findUnique({
        where: { id: managerId },
        include: {
          tenant: true
        }
      });

      // Check if manager exists
      if (!manager) {
        return {
          success: false,
          error: 'Invalid manager ID or PIN'
        };
      }

      // Check if PIN is set
      if (!manager.pin) {
        return {
          success: false,
          error: 'PIN not set. Please contact your administrator.'
        };
      }

      // Verify PIN (hashed)
      const pinMatch = await bcrypt.compare(pin, manager.pin);
      if (!pinMatch) {
        return {
          success: false,
          error: 'Invalid manager ID or PIN'
        };
      }

      // Check if manager account is active (Requirement 1.5)
      if (!manager.isActive) {
        return {
          success: false,
          error: 'Account has been deactivated'
        };
      }

      // Generate authentication token (Requirement 2.2)
      const token = generateManagerToken(manager.id, manager.tenantId);

      // Return success with token and manager info
      return {
        success: true,
        token,
        manager: {
          id: manager.id,
          name: manager.name,
          tenantId: manager.tenantId,
          maxBonusSpinsPerApproval: manager.maxBonusSpinsPerApproval,
          maxSpinsPerUser: manager.maxSpinsPerUser
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login'
      };
    }
  }

  /**
   * Log out a manager by invalidating their token
   * 
   * @param token - Manager's authentication token
   * @returns Logout result
   * 
   * Requirements:
   * - 2.5: Invalidate session token immediately on logout
   */
  async logout(token: string): Promise<LogoutResult> {
    try {
      // Invalidate the token
      const wasInvalidated = invalidateManagerToken(token);

      if (!wasInvalidated) {
        return {
          success: false,
          error: 'Invalid or expired token'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'An error occurred during logout'
      };
    }
  }

  /**
   * Validate a manager authentication token
   * 
   * @param token - Manager's authentication token
   * @returns Validation result with manager and tenant info
   * 
   * Requirements:
   * - 2.4: Validate session token
   * - 8.4: Include tenant ID in session token
   */
  async validateToken(token: string): Promise<ValidateTokenResult> {
    try {
      // Validate token using auth utils
      const payload = validateManagerToken(token);

      if (!payload) {
        return {
          valid: false,
          error: 'Invalid or expired token'
        };
      }

      // Verify manager still exists and is active
      const manager = await prisma.manager.findUnique({
        where: { id: payload.managerId }
      });

      if (!manager) {
        // Manager was deleted, invalidate token
        invalidateManagerToken(token);
        return {
          valid: false,
          error: 'Manager account not found'
        };
      }

      if (!manager.isActive) {
        // Manager was deactivated, invalidate token
        invalidateManagerToken(token);
        return {
          valid: false,
          error: 'Manager account has been deactivated'
        };
      }

      return {
        valid: true,
        managerId: payload.managerId,
        tenantId: payload.tenantId,
        role: payload.role
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        valid: false,
        error: 'An error occurred during token validation'
      };
    }
  }
}

// Export singleton instance
export const managerAuthService = new ManagerAuthService();
