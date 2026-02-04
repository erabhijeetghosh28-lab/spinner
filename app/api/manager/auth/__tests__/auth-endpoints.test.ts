/**
 * Integration Tests for Manager Authentication API Endpoints
 * 
 * Feature: manager-role-verification
 * 
 * Tests the API endpoints for manager authentication including login,
 * logout, and middleware authentication.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 1.5, 8.4
 * 
 * @jest-environment node
 */

import { withManagerAuth } from '@/lib/manager-auth-middleware';
import { managerAuthService } from '@/lib/manager-auth-service';
import { NextRequest, NextResponse } from 'next/server';
import { POST as loginPOST } from '../login/route';
import { POST as logoutPOST } from '../logout/route';

// Mock the manager auth service
jest.mock('@/lib/manager-auth-service');

const mockManagerAuthService = managerAuthService as jest.Mocked<typeof managerAuthService>;

// Import middleware after mocking
import { validateManagerAuth } from '@/lib/manager-auth-middleware';

describe('Manager Authentication API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/manager/auth/login', () => {
    test('should successfully login with valid credentials', async () => {
      // Requirement 2.2: Authenticate manager and create session token
      const mockLoginResult = {
        success: true,
        token: 'mock-jwt-token-12345',
        manager: {
          id: 'manager-1',
          name: 'John Manager',
          tenantId: 'tenant-1',
          maxBonusSpinsPerApproval: 10
        }
      };

      mockManagerAuthService.login.mockResolvedValue(mockLoginResult);

      const request = new NextRequest('http://localhost:3000/api/manager/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          managerId: 'manager-1',
          name: 'John Manager'
        })
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBe('mock-jwt-token-12345');
      expect(data.manager).toBeDefined();
      expect(data.manager.id).toBe('manager-1');
      expect(data.manager.tenantId).toBe('tenant-1');
      expect(mockManagerAuthService.login).toHaveBeenCalledWith('manager-1', 'John Manager');
    });

    test('should reject login with invalid credentials', async () => {
      // Requirement 2.3: Reject invalid credentials
      const mockLoginResult = {
        success: false,
        error: 'Invalid manager ID or name'
      };

      mockManagerAuthService.login.mockResolvedValue(mockLoginResult);

      const request = new NextRequest('http://localhost:3000/api/manager/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          managerId: 'wrong-id',
          name: 'Wrong Name'
        })
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid manager ID or name');
    });

    test('should reject login for inactive manager account', async () => {
      // Requirement 1.5: Prevent inactive managers from logging in
      const mockLoginResult = {
        success: false,
        error: 'Account has been deactivated'
      };

      mockManagerAuthService.login.mockResolvedValue(mockLoginResult);

      const request = new NextRequest('http://localhost:3000/api/manager/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          managerId: 'inactive-manager',
          name: 'Inactive Manager'
        })
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Account has been deactivated');
    });

    test('should return 400 for missing managerId', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John Manager'
        })
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Manager ID and name are required');
    });

    test('should return 400 for missing name', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          managerId: 'manager-1'
        })
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Manager ID and name are required');
    });

    test('should handle service errors gracefully', async () => {
      mockManagerAuthService.login.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/manager/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          managerId: 'manager-1',
          name: 'John Manager'
        })
      });

      const response = await loginPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/manager/auth/logout', () => {
    test('should successfully logout with valid token', async () => {
      // Requirement 2.5: Invalidate session token immediately on logout
      const mockLogoutResult = {
        success: true
      };

      mockManagerAuthService.logout.mockResolvedValue(mockLogoutResult);

      const request = new NextRequest('http://localhost:3000/api/manager/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid-token-12345'
        })
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockManagerAuthService.logout).toHaveBeenCalledWith('valid-token-12345');
    });

    test('should return error for invalid token', async () => {
      const mockLogoutResult = {
        success: false,
        error: 'Invalid or expired token'
      };

      mockManagerAuthService.logout.mockResolvedValue(mockLogoutResult);

      const request = new NextRequest('http://localhost:3000/api/manager/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalid-token'
        })
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired token');
    });

    test('should return 400 for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/auth/logout', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token is required');
    });

    test('should handle service errors gracefully', async () => {
      mockManagerAuthService.logout.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost:3000/api/manager/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          token: 'some-token'
        })
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Manager Authentication Middleware', () => {
    test('should authenticate valid token from Authorization header', async () => {
      // Requirement 2.4: Validate session token
      // Requirement 8.4: Include tenant ID in session token
      const mockValidation = {
        valid: true,
        managerId: 'manager-1',
        tenantId: 'tenant-1',
        role: 'manager' as const
      };

      mockManagerAuthService.validateToken.mockResolvedValue(mockValidation);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token-12345'
        }
      });

      const authResult = await validateManagerAuth(request);

      expect(authResult.valid).toBe(true);
      expect(authResult.context?.managerId).toBe('manager-1');
      expect(authResult.context?.tenantId).toBe('tenant-1');
      expect(authResult.context?.role).toBe('manager');
      expect(mockManagerAuthService.validateToken).toHaveBeenCalledWith('valid-token-12345');
    });

    test('should return error for missing Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET'
      });

      const authResult = await validateManagerAuth(request);

      expect(authResult.valid).toBe(false);
      expect(authResult.error).toBe('Missing or invalid authorization header');
      expect(mockManagerAuthService.validateToken).not.toHaveBeenCalled();
    });

    test('should return error for Authorization header without Bearer prefix', async () => {
      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'token-without-bearer'
        }
      });

      const authResult = await validateManagerAuth(request);

      expect(authResult.valid).toBe(false);
      expect(authResult.error).toBe('Missing or invalid authorization header');
    });

    test('should return error for invalid token', async () => {
      const mockValidation = {
        valid: false,
        error: 'Invalid or expired token'
      };

      mockManagerAuthService.validateToken.mockResolvedValue(mockValidation);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      const authResult = await validateManagerAuth(request);

      expect(authResult.valid).toBe(false);
      expect(authResult.error).toBe('Invalid or expired token');
    });

    test('should return error for expired token', async () => {
      const mockValidation = {
        valid: false,
        error: 'Session expired, please login again'
      };

      mockManagerAuthService.validateToken.mockResolvedValue(mockValidation);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer expired-token'
        }
      });

      const authResult = await validateManagerAuth(request);

      expect(authResult.valid).toBe(false);
      expect(authResult.error).toBe('Session expired, please login again');
    });

    test('withManagerAuth should call handler with auth context for valid token', async () => {
      const mockValidation = {
        valid: true,
        managerId: 'manager-1',
        tenantId: 'tenant-1',
        role: 'manager' as const
      };

      mockManagerAuthService.validateToken.mockResolvedValue(mockValidation);

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ data: 'protected data' })
      );

      const wrappedHandler = withManagerAuth(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(
        request,
        {
          managerId: 'manager-1',
          tenantId: 'tenant-1',
          role: 'manager'
        }
      );
      expect(response.status).toBe(200);
    });

    test('withManagerAuth should return 401 for invalid token', async () => {
      const mockValidation = {
        valid: false,
        error: 'Invalid token'
      };

      mockManagerAuthService.validateToken.mockResolvedValue(mockValidation);

      const mockHandler = jest.fn();
      const wrappedHandler = withManagerAuth(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    test('withManagerAuth should return 401 for missing token', async () => {
      const mockHandler = jest.fn();
      const wrappedHandler = withManagerAuth(mockHandler);

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET'
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing or invalid authorization header');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    test('should handle middleware errors gracefully', async () => {
      mockManagerAuthService.validateToken.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost:3000/api/manager/tasks/pending', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer some-token'
        }
      });

      const authResult = await validateManagerAuth(request);

      expect(authResult.valid).toBe(false);
      expect(authResult.error).toBe('Authentication failed');
    });
  });
});
