/**
 * Unit tests for GET /api/admin/super/tenants/:id/overrides endpoint
 * 
 * Tests:
 * - Retrieve active overrides for a tenant
 * - Filter out expired overrides
 * - Filter out inactive overrides
 * - Handle tenant not found
 * - Handle invalid tenant ID
 * 
 * Requirements: 4.7
 * 
 * @jest-environment node
 */

import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    tenant: {
      findUnique: jest.fn(),
    },
    tenantLimitOverride: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/admin/super/tenants/:id/overrides', () => {
  const mockTenantId = 'tenant-123';
  const mockRequest = {} as NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return active overrides for a tenant', async () => {
    const mockTenant = { id: mockTenantId, name: 'Test Tenant' };
    const mockOverrides = [
      {
        id: 'override-1',
        tenantId: mockTenantId,
        bonusSpins: 100,
        bonusVouchers: 50,
        reason: 'Promotional bonus',
        expiresAt: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        grantedByAdmin: {
          id: 'admin-1',
          email: 'admin@example.com',
        },
      },
    ];

    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
    (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue(mockOverrides);

    const response = await GET(mockRequest, { params: { id: mockTenantId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overrides).toHaveLength(1);
    expect(data.overrides[0].id).toBe('override-1');
    expect(data.overrides[0].bonusSpins).toBe(100);
    expect(data.overrides[0].bonusVouchers).toBe(50);
    expect(data.overrides[0].reason).toBe('Promotional bonus');
    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: { id: mockTenantId },
    });
    expect(prisma.tenantLimitOverride.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: mockTenantId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: expect.any(Date) } },
        ],
      },
      include: {
        grantedByAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should return empty array when no active overrides exist', async () => {
    const mockTenant = { id: mockTenantId, name: 'Test Tenant' };

    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
    (prisma.tenantLimitOverride.findMany as jest.Mock).mockResolvedValue([]);

    const response = await GET(mockRequest, { params: { id: mockTenantId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overrides).toEqual([]);
  });

  it('should return 404 when tenant not found', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await GET(mockRequest, { params: { id: mockTenantId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('TENANT_NOT_FOUND');
    expect(data.error.message).toBe('Tenant not found');
  });

  it('should return 400 when tenant ID is missing', async () => {
    const response = await GET(mockRequest, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_TENANT_ID');
    expect(data.error.message).toBe('Tenant ID is required');
  });

  it('should handle database errors gracefully', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET(mockRequest, { params: { id: mockTenantId } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
    expect(data.error.message).toBe('Failed to fetch overrides');
  });
});
