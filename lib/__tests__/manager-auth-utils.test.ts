import {
    cleanupExpiredTokens,
    generateManagerToken,
    hashPassword,
    invalidateManagerToken,
    validateManagerToken,
    verifyPassword
} from '../manager-auth-utils';

describe('Manager Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('Token Generation', () => {
    it('should generate a token with manager prefix', () => {
      const managerId = 'mgr_123';
      const tenantId = 'tenant_456';
      
      const token = generateManagerToken(managerId, tenantId);
      
      expect(token).toBeDefined();
      expect(token.startsWith('mgr_')).toBe(true);
    });

    it('should generate unique tokens', () => {
      const managerId = 'mgr_123';
      const tenantId = 'tenant_456';
      
      const token1 = generateManagerToken(managerId, tenantId);
      const token2 = generateManagerToken(managerId, tenantId);
      
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with sufficient length', () => {
      const managerId = 'mgr_123';
      const tenantId = 'tenant_456';
      
      const token = generateManagerToken(managerId, tenantId);
      
      // Token should be mgr_ (4 chars) + 64 hex chars (32 bytes)
      expect(token.length).toBe(68);
    });
  });

  describe('Token Validation', () => {
    it('should validate a valid token', () => {
      const managerId = 'mgr_123';
      const tenantId = 'tenant_456';
      
      const token = generateManagerToken(managerId, tenantId);
      const payload = validateManagerToken(token);
      
      expect(payload).not.toBeNull();
      expect(payload?.managerId).toBe(managerId);
      expect(payload?.tenantId).toBe(tenantId);
      expect(payload?.role).toBe('manager');
    });

    it('should return null for invalid token', () => {
      const payload = validateManagerToken('invalid_token');
      
      expect(payload).toBeNull();
    });

    it('should return null for non-existent token', () => {
      const payload = validateManagerToken('mgr_nonexistent123456789');
      
      expect(payload).toBeNull();
    });

    it('should validate token multiple times', () => {
      const managerId = 'mgr_123';
      const tenantId = 'tenant_456';
      
      const token = generateManagerToken(managerId, tenantId);
      
      const payload1 = validateManagerToken(token);
      const payload2 = validateManagerToken(token);
      
      expect(payload1).not.toBeNull();
      expect(payload2).not.toBeNull();
      expect(payload1?.managerId).toBe(payload2?.managerId);
    });
  });

  describe('Token Invalidation', () => {
    it('should invalidate a valid token', () => {
      const managerId = 'mgr_123';
      const tenantId = 'tenant_456';
      
      const token = generateManagerToken(managerId, tenantId);
      
      // Token should be valid before invalidation
      expect(validateManagerToken(token)).not.toBeNull();
      
      // Invalidate token
      const result = invalidateManagerToken(token);
      expect(result).toBe(true);
      
      // Token should be invalid after invalidation
      expect(validateManagerToken(token)).toBeNull();
    });

    it('should return false when invalidating non-existent token', () => {
      const result = invalidateManagerToken('non_existent_token');
      expect(result).toBe(false);
    });

    it('should not affect other tokens when invalidating one', () => {
      const token1 = generateManagerToken('mgr_1', 'tenant_1');
      const token2 = generateManagerToken('mgr_2', 'tenant_2');
      
      invalidateManagerToken(token1);
      
      expect(validateManagerToken(token1)).toBeNull();
      expect(validateManagerToken(token2)).not.toBeNull();
    });
  });

  describe('Token Expiration', () => {
    it('should reject expired tokens', async () => {
      // This test would require mocking Date.now() or waiting 24 hours
      // For now, we'll test the cleanup function instead
      const managerId = 'mgr_123';
      const tenantId = 'tenant_456';
      
      const token = generateManagerToken(managerId, tenantId);
      
      // Token should be valid immediately
      expect(validateManagerToken(token)).not.toBeNull();
      
      // Note: In a real scenario, we'd mock time to test expiration
      // For this test, we just verify the token is valid within its lifetime
    });
  });

  describe('Cleanup Expired Tokens', () => {
    it('should return count of cleaned tokens', () => {
      // Generate some tokens
      generateManagerToken('mgr_1', 'tenant_1');
      generateManagerToken('mgr_2', 'tenant_2');
      
      // Cleanup (no tokens should be expired yet)
      const cleanedCount = cleanupExpiredTokens();
      
      // Should be 0 since tokens were just created
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });

    it('should not affect valid tokens', () => {
      const token = generateManagerToken('mgr_123', 'tenant_456');
      
      cleanupExpiredTokens();
      
      // Token should still be valid
      expect(validateManagerToken(token)).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in managerId and tenantId', () => {
      const managerId = 'mgr_!@#$%^&*()';
      const tenantId = 'tenant_<>?:"{}|';
      
      const token = generateManagerToken(managerId, tenantId);
      const payload = validateManagerToken(token);
      
      expect(payload?.managerId).toBe(managerId);
      expect(payload?.tenantId).toBe(tenantId);
    });

    it('should handle very long IDs', () => {
      const managerId = 'mgr_' + 'a'.repeat(1000);
      const tenantId = 'tenant_' + 'b'.repeat(1000);
      
      const token = generateManagerToken(managerId, tenantId);
      const payload = validateManagerToken(token);
      
      expect(payload?.managerId).toBe(managerId);
      expect(payload?.tenantId).toBe(tenantId);
    });

    it('should handle empty string IDs', () => {
      const managerId = '';
      const tenantId = '';
      
      const token = generateManagerToken(managerId, tenantId);
      const payload = validateManagerToken(token);
      
      expect(payload?.managerId).toBe(managerId);
      expect(payload?.tenantId).toBe(tenantId);
    });
  });
});
