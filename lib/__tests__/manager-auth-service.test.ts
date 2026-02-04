import { ManagerAuthService } from '../manager-auth-service';
import {
    generateManagerToken,
    invalidateManagerToken,
    validateManagerToken
} from '../manager-auth-utils';
import prisma from '../prisma';

/**
 * Unit tests for ManagerAuthService
 * 
 * Tests specific examples and edge cases for manager authentication
 * including login, logout, and token validation.
 * 
 * Requirements: 2.2, 2.3, 2.5, 1.5
 */

// Mock Prisma client
jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    manager: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    tenant: {
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock the manager-auth-utils module
jest.mock('../manager-auth-utils', () => {
  const actual = jest.requireActual('../manager-auth-utils');
  return {
    ...actual,
    hashPassword: actual.hashPassword, // Keep real implementation for password hashing
    verifyPassword: actual.verifyPassword, // Keep real implementation for password verification
    generateManagerToken: jest.fn(),
    validateManagerToken: jest.fn(),
    invalidateManagerToken: jest.fn(),
  };
});

const authService = new ManagerAuthService();

describe('ManagerAuthService', () => {
  const testTenantId = 'test-tenant-123';
  const testManagerId = 'test-manager-123';
  const testManagerName = 'Test Manager';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockManager = {
        id: testManagerId,
        email: 'test@example.com',
        name: testManagerName,
        tenantId: testTenantId,
        maxBonusSpinsPerApproval: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: {
          id: testTenantId,
          name: 'Test Tenant'
        }
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (generateManagerToken as jest.Mock).mockReturnValue('mgr_test_token_123');

      const result = await authService.login(testManagerId, testManagerName);

      expect(result.success).toBe(true);
      expect(result.token).toBe('mgr_test_token_123');
      expect(result.manager).toBeDefined();
      expect(result.manager?.id).toBe(testManagerId);
      expect(result.manager?.name).toBe(testManagerName);
      expect(result.manager?.tenantId).toBe(testTenantId);
      expect(result.manager?.maxBonusSpinsPerApproval).toBe(10);
      expect(result.error).toBeUndefined();
      expect(generateManagerToken).toHaveBeenCalledWith(testManagerId, testTenantId);
    });

    it('should reject login with invalid manager ID', async () => {
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.login('nonexistent-id', testManagerName);

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.manager).toBeUndefined();
      expect(result.error).toBe('Invalid manager ID or name');
    });

    it('should reject login with invalid name', async () => {
      const mockManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: true,
        tenant: {}
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

      const result = await authService.login(testManagerId, 'Wrong Name');

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.manager).toBeUndefined();
      expect(result.error).toBe('Invalid manager ID or name');
    });

    it('should reject login for inactive manager account', async () => {
      const mockManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: false,
        tenant: {}
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

      const result = await authService.login(testManagerId, testManagerName);

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.manager).toBeUndefined();
      expect(result.error).toBe('Account has been deactivated');
    });

    it('should handle empty manager ID', async () => {
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.login('', testManagerName);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid manager ID or name');
    });

    it('should handle empty name', async () => {
      const mockManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: true,
        tenant: {}
      };

      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

      const result = await authService.login(testManagerId, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid manager ID or name');
    });

    it('should not expose whether manager ID exists in error message', async () => {
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(null);
      const result1 = await authService.login('nonexistent-id', testManagerName);
      
      const mockManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: true,
        tenant: {}
      };
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      const result2 = await authService.login(testManagerId, 'Wrong Name');

      // Both should return the same generic error message
      expect(result1.error).toBe(result2.error);
      expect(result1.error).toBe('Invalid manager ID or name');
    });
  });

  describe('logout', () => {
    it('should successfully logout with valid token', async () => {
      const token = 'mgr_test_token_123';
      (invalidateManagerToken as jest.Mock).mockReturnValue(true);

      const logoutResult = await authService.logout(token);

      expect(logoutResult.success).toBe(true);
      expect(logoutResult.error).toBeUndefined();
      expect(invalidateManagerToken).toHaveBeenCalledWith(token);
    });

    it('should handle logout with invalid token', async () => {
      (invalidateManagerToken as jest.Mock).mockReturnValue(false);

      const result = await authService.logout('invalid_token_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('should handle logout with empty token', async () => {
      (invalidateManagerToken as jest.Mock).mockReturnValue(false);

      const result = await authService.logout('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('should handle double logout', async () => {
      const token = 'mgr_test_token_123';
      
      // First logout succeeds
      (invalidateManagerToken as jest.Mock).mockReturnValueOnce(true);
      const firstLogout = await authService.logout(token);
      expect(firstLogout.success).toBe(true);

      // Second logout fails (token already invalidated)
      (invalidateManagerToken as jest.Mock).mockReturnValueOnce(false);
      const secondLogout = await authService.logout(token);
      expect(secondLogout.success).toBe(false);
      expect(secondLogout.error).toBe('Invalid or expired token');
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const token = 'mgr_test_token_123';
      const mockManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: true
      };

      (validateManagerToken as jest.Mock).mockReturnValue({
        managerId: testManagerId,
        tenantId: testTenantId,
        role: 'manager'
      });
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

      const result = await authService.validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.managerId).toBe(testManagerId);
      expect(result.tenantId).toBe(testTenantId);
      expect(result.role).toBe('manager');
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid token', async () => {
      (validateManagerToken as jest.Mock).mockReturnValue(null);

      const result = await authService.validateToken('invalid_token_123');

      expect(result.valid).toBe(false);
      expect(result.managerId).toBeUndefined();
      expect(result.tenantId).toBeUndefined();
      expect(result.error).toBe('Invalid or expired token');
    });

    it('should reject token for deleted manager', async () => {
      const token = 'mgr_test_token_123';

      (validateManagerToken as jest.Mock).mockReturnValue({
        managerId: testManagerId,
        tenantId: testTenantId,
        role: 'manager'
      });
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(null);
      (invalidateManagerToken as jest.Mock).mockReturnValue(true);

      const result = await authService.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Manager account not found');
      expect(invalidateManagerToken).toHaveBeenCalledWith(token);
    });

    it('should reject token for deactivated manager', async () => {
      const token = 'mgr_test_token_123';
      const mockManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: false
      };

      (validateManagerToken as jest.Mock).mockReturnValue({
        managerId: testManagerId,
        tenantId: testTenantId,
        role: 'manager'
      });
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (invalidateManagerToken as jest.Mock).mockReturnValue(true);

      const result = await authService.validateToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Manager account has been deactivated');
      expect(invalidateManagerToken).toHaveBeenCalledWith(token);
    });

    it('should validate token multiple times', async () => {
      const token = 'mgr_test_token_123';
      const mockManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: true
      };

      (validateManagerToken as jest.Mock).mockReturnValue({
        managerId: testManagerId,
        tenantId: testTenantId,
        role: 'manager'
      });
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

      const result1 = await authService.validateToken(token);
      const result2 = await authService.validateToken(token);
      const result3 = await authService.validateToken(token);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result3.valid).toBe(true);
      expect(result1.managerId).toBe(result2.managerId);
      expect(result2.managerId).toBe(result3.managerId);
    });

    it('should handle empty token', async () => {
      (validateManagerToken as jest.Mock).mockReturnValue(null);

      const result = await authService.validateToken('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete login-validate-logout flow', async () => {
      const token = 'mgr_test_token_123';
      const mockManager = {
        id: testManagerId,
        email: 'test@example.com',
        name: testManagerName,
        tenantId: testTenantId,
        maxBonusSpinsPerApproval: 10,
        isActive: true,
        tenant: {}
      };

      // Login
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      (generateManagerToken as jest.Mock).mockReturnValue(token);
      const loginResult = await authService.login(testManagerId, testManagerName);
      expect(loginResult.success).toBe(true);

      // Validate
      (validateManagerToken as jest.Mock).mockReturnValue({
        managerId: testManagerId,
        tenantId: testTenantId,
        role: 'manager'
      });
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
      const validateResult = await authService.validateToken(token);
      expect(validateResult.valid).toBe(true);
      expect(validateResult.managerId).toBe(testManagerId);

      // Logout
      (invalidateManagerToken as jest.Mock).mockReturnValue(true);
      const logoutResult = await authService.logout(token);
      expect(logoutResult.success).toBe(true);

      // Validate after logout should fail
      (validateManagerToken as jest.Mock).mockReturnValue(null);
      const validateAfterLogout = await authService.validateToken(token);
      expect(validateAfterLogout.valid).toBe(false);
    });

    it('should handle manager reactivation', async () => {
      const inactiveManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: false,
        tenant: {}
      };

      const activeManager = {
        ...inactiveManager,
        isActive: true
      };

      // Deactivated manager cannot login
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(inactiveManager);
      const loginResult1 = await authService.login(testManagerId, testManagerName);
      expect(loginResult1.success).toBe(false);

      // Reactivated manager can login
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(activeManager);
      (generateManagerToken as jest.Mock).mockReturnValue('mgr_test_token_123');
      const loginResult2 = await authService.login(testManagerId, testManagerName);
      expect(loginResult2.success).toBe(true);
    });

    it('should invalidate existing tokens when manager is deactivated', async () => {
      const token = 'mgr_test_token_123';
      const activeManager = {
        id: testManagerId,
        name: testManagerName,
        isActive: true
      };

      const inactiveManager = {
        ...activeManager,
        isActive: false
      };

      // Token should be valid for active manager
      (validateManagerToken as jest.Mock).mockReturnValue({
        managerId: testManagerId,
        tenantId: testTenantId,
        role: 'manager'
      });
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(activeManager);
      const validateBefore = await authService.validateToken(token);
      expect(validateBefore.valid).toBe(true);

      // Token should be invalid after manager deactivation
      (prisma.manager.findUnique as jest.Mock).mockResolvedValue(inactiveManager);
      (invalidateManagerToken as jest.Mock).mockReturnValue(true);
      const validateAfter = await authService.validateToken(token);
      expect(validateAfter.valid).toBe(false);
      expect(validateAfter.error).toBe('Manager account has been deactivated');
    });
  });

  describe('Edge Cases - Task 2.4', () => {
    describe('Inactive manager login rejection', () => {
      it('should reject login for inactive manager with correct credentials', async () => {
        const mockManager = {
          id: testManagerId,
          email: 'test@example.com',
          name: testManagerName,
          tenantId: testTenantId,
          maxBonusSpinsPerApproval: 10,
          isActive: false,
          tenant: {}
        };

        (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

        const result = await authService.login(testManagerId, testManagerName);

        expect(result.success).toBe(false);
        expect(result.token).toBeUndefined();
        expect(result.manager).toBeUndefined();
        expect(result.error).toBe('Account has been deactivated');
        expect(generateManagerToken).not.toHaveBeenCalled();
      });

      it('should not generate token for inactive manager', async () => {
        const mockManager = {
          id: testManagerId,
          name: testManagerName,
          isActive: false,
          tenant: {}
        };

        (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

        await authService.login(testManagerId, testManagerName);

        expect(generateManagerToken).not.toHaveBeenCalled();
      });

      it('should check name match before checking active status', async () => {
        const mockManager = {
          id: testManagerId,
          name: testManagerName,
          isActive: false,
          tenant: {}
        };

        (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

        // With wrong name, should fail on name validation
        const result = await authService.login(testManagerId, 'Wrong Name');

        expect(result.success).toBe(false);
        // The implementation checks name first, then active status
        // So with wrong name, we get name error even if inactive
        expect(result.error).toBe('Invalid manager ID or name');
      });
    });

    describe('Expired token handling', () => {
      it('should reject expired token during validation', async () => {
        const expiredToken = 'mgr_expired_token_123';

        // Mock validateManagerToken to return null for expired token
        (validateManagerToken as jest.Mock).mockReturnValue(null);

        const result = await authService.validateToken(expiredToken);

        expect(result.valid).toBe(false);
        expect(result.managerId).toBeUndefined();
        expect(result.tenantId).toBeUndefined();
        expect(result.error).toBe('Invalid or expired token');
      });

      it('should not query database for expired token', async () => {
        const expiredToken = 'mgr_expired_token_123';

        (validateManagerToken as jest.Mock).mockReturnValue(null);

        await authService.validateToken(expiredToken);

        // Should not call findUnique if token validation fails
        expect(prisma.manager.findUnique).not.toHaveBeenCalled();
      });

      it('should reject logout with expired token', async () => {
        const expiredToken = 'mgr_expired_token_123';

        (invalidateManagerToken as jest.Mock).mockReturnValue(false);

        const result = await authService.logout(expiredToken);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid or expired token');
      });

      it('should handle token that expires between validation calls', async () => {
        const token = 'mgr_test_token_123';
        const mockManager = {
          id: testManagerId,
          name: testManagerName,
          isActive: true
        };

        // First validation succeeds
        (validateManagerToken as jest.Mock).mockReturnValueOnce({
          managerId: testManagerId,
          tenantId: testTenantId,
          role: 'manager'
        });
        (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);

        const result1 = await authService.validateToken(token);
        expect(result1.valid).toBe(true);

        // Second validation fails (token expired)
        (validateManagerToken as jest.Mock).mockReturnValueOnce(null);

        const result2 = await authService.validateToken(token);
        expect(result2.valid).toBe(false);
        expect(result2.error).toBe('Invalid or expired token');
      });
    });

    describe('Invalid token format', () => {
      it('should reject token with invalid format', async () => {
        const invalidToken = 'not_a_valid_token_format';

        (validateManagerToken as jest.Mock).mockReturnValue(null);

        const result = await authService.validateToken(invalidToken);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid or expired token');
      });

      it('should reject token with wrong prefix', async () => {
        const wrongPrefixToken = 'usr_1234567890abcdef';

        (validateManagerToken as jest.Mock).mockReturnValue(null);

        const result = await authService.validateToken(wrongPrefixToken);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid or expired token');
      });

      it('should reject malformed token', async () => {
        const malformedToken = 'mgr_';

        (validateManagerToken as jest.Mock).mockReturnValue(null);

        const result = await authService.validateToken(malformedToken);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid or expired token');
      });

      it('should reject token with special characters', async () => {
        const specialCharToken = 'mgr_<script>alert("xss")</script>';

        (validateManagerToken as jest.Mock).mockReturnValue(null);

        const result = await authService.validateToken(specialCharToken);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid or expired token');
      });

      it('should reject extremely long token', async () => {
        const longToken = 'mgr_' + 'a'.repeat(10000);

        (validateManagerToken as jest.Mock).mockReturnValue(null);

        const result = await authService.validateToken(longToken);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid or expired token');
      });

      it('should reject null or undefined token', async () => {
        (validateManagerToken as jest.Mock).mockReturnValue(null);

        const result1 = await authService.validateToken(null as any);
        expect(result1.valid).toBe(false);

        const result2 = await authService.validateToken(undefined as any);
        expect(result2.valid).toBe(false);
      });

      it('should reject token with only whitespace', async () => {
        const whitespaceToken = '   ';

        (validateManagerToken as jest.Mock).mockReturnValue(null);

        const result = await authService.validateToken(whitespaceToken);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid or expired token');
      });

      it('should reject logout with invalid token format', async () => {
        const invalidToken = 'invalid_format';

        (invalidateManagerToken as jest.Mock).mockReturnValue(false);

        const result = await authService.logout(invalidToken);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid or expired token');
      });
    });

    describe('Additional edge cases', () => {
      it('should handle database error during login', async () => {
        (prisma.manager.findUnique as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        );

        const result = await authService.login(testManagerId, testManagerName);

        expect(result.success).toBe(false);
        expect(result.error).toBe('An error occurred during login');
      });

      it('should handle database error during token validation', async () => {
        const token = 'mgr_test_token_123';

        (validateManagerToken as jest.Mock).mockReturnValue({
          managerId: testManagerId,
          tenantId: testTenantId,
          role: 'manager'
        });
        (prisma.manager.findUnique as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        );

        const result = await authService.validateToken(token);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('An error occurred during token validation');
      });

      it('should handle concurrent login attempts for same manager', async () => {
        const mockManager = {
          id: testManagerId,
          name: testManagerName,
          tenantId: testTenantId,
          maxBonusSpinsPerApproval: 10,
          isActive: true,
          tenant: {}
        };

        (prisma.manager.findUnique as jest.Mock).mockResolvedValue(mockManager);
        (generateManagerToken as jest.Mock)
          .mockReturnValueOnce('mgr_token_1')
          .mockReturnValueOnce('mgr_token_2');

        const [result1, result2] = await Promise.all([
          authService.login(testManagerId, testManagerName),
          authService.login(testManagerId, testManagerName)
        ]);

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result1.token).not.toBe(result2.token);
      });

      it('should handle token validation for recently deleted manager', async () => {
        const token = 'mgr_test_token_123';

        (validateManagerToken as jest.Mock).mockReturnValue({
          managerId: testManagerId,
          tenantId: testTenantId,
          role: 'manager'
        });
        (prisma.manager.findUnique as jest.Mock).mockResolvedValue(null);
        (invalidateManagerToken as jest.Mock).mockReturnValue(true);

        const result = await authService.validateToken(token);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Manager account not found');
        expect(invalidateManagerToken).toHaveBeenCalledWith(token);
      });
    });
  });
});
