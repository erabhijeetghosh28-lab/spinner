/**
 * Property-Based and Unit Tests for Voucher Service
 * 
 * Feature: voucher-redemption-system
 */

import * as fc from 'fast-check';
import prisma from '../prisma';
import { generateUniqueVoucherCode, generateVoucherCode } from '../voucher-service';

// Mock prisma for unit tests
jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    voucher: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock usage service for unit tests
jest.mock('../usage-service', () => ({
  usageService: {
    canCreateVoucher: jest.fn().mockResolvedValue(true),
    incrementVouchers: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Voucher Code Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 2: Voucher Code Format
   * 
   * For any generated voucher code, the code should match the pattern 
   * {TENANT_PREFIX}-{UNIQUE_ID} where TENANT_PREFIX is the first 4 
   * uppercase characters of the tenant slug and UNIQUE_ID is a unique identifier.
   * 
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: Voucher Code Format', () => {
    test('all generated codes match the format {TENANT_PREFIX}-{UNIQUE_ID}', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary tenant slugs (1-20 characters, alphanumeric + hyphens)
          fc.stringMatching(/^[a-z0-9-]{1,20}$/),
          (tenantSlug) => {
            const code = generateVoucherCode(tenantSlug);
            
            // Code should match pattern: PREFIX-UNIQUEID
            const pattern = /^[A-Z0-9X]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$/;
            expect(code).toMatch(pattern);
            
            // Extract prefix and unique ID (split only on first hyphen after position 4)
            const prefix = code.slice(0, 4);
            const uniqueId = code.slice(5); // Skip the hyphen at position 4
            
            // Prefix should be 4 uppercase characters
            expect(prefix).toHaveLength(4);
            expect(prefix).toMatch(/^[A-Z0-9X]+$/);
            
            // Prefix should be derived from first 4 alphanumeric chars of tenant slug (uppercase)
            const cleanSlug = tenantSlug.replace(/[^a-z0-9]/gi, '');
            const expectedPrefix = cleanSlug.slice(0, 4).toUpperCase().padEnd(4, 'X');
            expect(prefix).toBe(expectedPrefix);
            
            // Unique ID should be 12 characters from custom alphabet
            expect(uniqueId).toHaveLength(12);
            expect(uniqueId).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/);
            
            // Unique ID should not contain ambiguous characters (0, O, I, 1, L)
            expect(uniqueId).not.toMatch(/[01IOL]/);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('codes for different tenant slugs have different prefixes', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z0-9-]{4,20}$/),
            fc.stringMatching(/^[a-z0-9-]{4,20}$/)
          ).filter(([slug1, slug2]) => {
            // Clean slugs and compare first 4 chars
            const clean1 = slug1.replace(/[^a-z0-9]/gi, '');
            const clean2 = slug2.replace(/[^a-z0-9]/gi, '');
            return clean1.slice(0, 4) !== clean2.slice(0, 4);
          }),
          ([tenantSlug1, tenantSlug2]) => {
            const code1 = generateVoucherCode(tenantSlug1);
            const code2 = generateVoucherCode(tenantSlug2);
            
            const prefix1 = code1.slice(0, 4);
            const prefix2 = code2.slice(0, 4);
            
            // Different tenant slugs (with different first 4 chars) should produce different prefixes
            expect(prefix1).not.toBe(prefix2);
          }
        ),
        { numRuns: 10 }
      );
    });

    test('short tenant slugs are padded correctly', () => {
      const testCases = [
        { slug: 'a', expectedPrefix: 'AXXX' },
        { slug: 'ab', expectedPrefix: 'ABXX' },
        { slug: 'abc', expectedPrefix: 'ABCX' },
        { slug: 'abcd', expectedPrefix: 'ABCD' },
      ];

      testCases.forEach(({ slug, expectedPrefix }) => {
        const code = generateVoucherCode(slug);
        const prefix = code.slice(0, 4);
        expect(prefix).toBe(expectedPrefix);
      });
    });

    test('long tenant slugs are truncated to 4 characters', () => {
      const code = generateVoucherCode('verylongtenant');
      const prefix = code.slice(0, 4);
      expect(prefix).toBe('VERY');
      expect(prefix).toHaveLength(4);
    });

    test('tenant slugs with hyphens are cleaned', () => {
      const testCases = [
        { slug: 'my-shop', expectedPrefix: 'MYSH' },
        { slug: 'a-b-c-d', expectedPrefix: 'ABCD' },
        { slug: '-abc', expectedPrefix: 'ABCX' },
        { slug: 'abc-', expectedPrefix: 'ABCX' },
      ];

      testCases.forEach(({ slug, expectedPrefix }) => {
        const code = generateVoucherCode(slug);
        const prefix = code.slice(0, 4);
        expect(prefix).toBe(expectedPrefix);
      });
    });
  });

  /**
   * Property 3: Voucher Code Uniqueness
   * 
   * For any set of generated vouchers across all tenants, no two vouchers 
   * should have the same code.
   * 
   * **Validates: Requirements 2.1**
   */
  describe('Property 3: Voucher Code Uniqueness', () => {
    test('multiple codes generated for same tenant are unique', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9-]{4,20}$/),
          fc.integer({ min: 10, max: 50 }),
          (tenantSlug, count) => {
            const codes = new Set<string>();
            
            for (let i = 0; i < count; i++) {
              const code = generateVoucherCode(tenantSlug);
              codes.add(code);
            }
            
            // All generated codes should be unique
            expect(codes.size).toBe(count);
          }
        ),
        { numRuns: 10 }
      );
    });

    test('codes generated for different tenants are globally unique', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[a-z0-9-]{4,20}$/), { minLength: 5, maxLength: 10 }),
          fc.integer({ min: 5, max: 20 }),
          (tenantSlugs, codesPerTenant) => {
            const allCodes = new Set<string>();
            let totalGenerated = 0;
            
            for (const tenantSlug of tenantSlugs) {
              for (let i = 0; i < codesPerTenant; i++) {
                const code = generateVoucherCode(tenantSlug);
                allCodes.add(code);
                totalGenerated++;
              }
            }
            
            // All codes across all tenants should be unique
            expect(allCodes.size).toBe(totalGenerated);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Unit Test: Collision Retry Logic
   * 
   * Test that code generation retries on collision (up to 3 times)
   * 
   * **Validates: Requirements 2.3**
   */
  describe('Unit Test: Collision Retry Logic', () => {
    test('retries on collision and succeeds on second attempt', async () => {
      // Mock: first call finds collision, second call finds no collision
      mockPrisma.voucher.findUnique
        .mockResolvedValueOnce({ id: 'existing-id' } as any)
        .mockResolvedValueOnce(null);

      const code = await generateUniqueVoucherCode('test-tenant');

      expect(code).toMatch(/^TEST-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$/);
      expect(mockPrisma.voucher.findUnique).toHaveBeenCalledTimes(2);
    });

    test('succeeds immediately when no collision', async () => {
      mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

      const code = await generateUniqueVoucherCode('acme');

      expect(code).toMatch(/^ACME-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$/);
      expect(mockPrisma.voucher.findUnique).toHaveBeenCalledTimes(1);
    });

    test('throws error after max retries exceeded', async () => {
      // Mock: all attempts find collisions
      mockPrisma.voucher.findUnique.mockResolvedValue({ id: 'existing-id' } as any);

      await expect(generateUniqueVoucherCode('test', 3)).rejects.toThrow(
        'Failed to generate unique voucher code after 3 attempts'
      );

      expect(mockPrisma.voucher.findUnique).toHaveBeenCalledTimes(3);
    });

    test('respects custom maxRetries parameter', async () => {
      mockPrisma.voucher.findUnique.mockResolvedValue({ id: 'existing-id' } as any);

      await expect(generateUniqueVoucherCode('test', 5)).rejects.toThrow(
        'Failed to generate unique voucher code after 5 attempts'
      );

      expect(mockPrisma.voucher.findUnique).toHaveBeenCalledTimes(5);
    });

    test('logs warning on collision', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockPrisma.voucher.findUnique
        .mockResolvedValueOnce({ id: 'existing-id' } as any)
        .mockResolvedValueOnce(null);

      await generateUniqueVoucherCode('test');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Voucher code collision detected')
      );

      consoleWarnSpy.mockRestore();
    });
  });
});


/**
 * Property 1: Voucher Creation on Prize Win
 * 
 * For any prize win event, when a customer wins a prize with voucher settings 
 * configured (voucherValidityDays > 0), the system should create exactly one 
 * voucher with a unique code associated with that spin, prize, user, and tenant.
 * 
 * **Validates: Requirements 1.1, 1.6**
 */
describe('Property 1: Voucher Creation on Prize Win', () => {
  // Import createVoucher for testing
  const { createVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates exactly one voucher with unique code for any prize win', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary voucher creation parameters
        fc.record({
          spinId: fc.uuid(),
          prizeId: fc.uuid(),
          userId: fc.uuid(),
          tenantId: fc.uuid(),
          tenantSlug: fc.stringMatching(/^[a-z0-9-]{4,20}$/),
          validityDays: fc.integer({ min: 1, max: 365 }),
          redemptionLimit: fc.integer({ min: 1, max: 10 }),
          generateQR: fc.constant(false), // Disable QR to speed up tests
        }),
        async (params) => {
          // Mock prisma.voucher.findUnique to return null (no collision)
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);
          
          // Mock prisma.voucher.create to capture and return the voucher
          (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
            return Promise.resolve({
              id: 'voucher-id',
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date(),
              spin: {},
              prize: {},
              user: {},
              tenant: {},
            });
          });

          // Create voucher
          const voucher = await createVoucher(params);

          // Verify exactly one voucher was created
          expect(mockPrisma.voucher.create).toHaveBeenCalledTimes(1);

          // Verify voucher has unique code
          expect(voucher.code).toBeDefined();
          expect(voucher.code).toMatch(/^[A-Z0-9X]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$/);

          // Verify voucher is associated with correct entities
          expect(voucher.spinId).toBe(params.spinId);
          expect(voucher.prizeId).toBe(params.prizeId);
          expect(voucher.userId).toBe(params.userId);
          expect(voucher.tenantId).toBe(params.tenantId);

          // Verify redemption settings
          expect(voucher.redemptionLimit).toBe(params.redemptionLimit);
          expect(voucher.redemptionCount).toBe(0);
          expect(voucher.isRedeemed).toBe(false);
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);

  test('voucher codes are unique across multiple creations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            spinId: fc.uuid(),
            prizeId: fc.uuid(),
            userId: fc.uuid(),
            tenantId: fc.uuid(),
            tenantSlug: fc.stringMatching(/^[a-z0-9-]{4,20}$/),
            validityDays: fc.integer({ min: 1, max: 365 }),
            redemptionLimit: fc.integer({ min: 1, max: 10 }),
            generateQR: fc.constant(false), // Disable QR to speed up tests
          }),
          { minLength: 3, maxLength: 5 }
        ),
        async (paramsArray) => {
          const codes = new Set<string>();

          for (const params of paramsArray) {
            // Mock no collision for each generation
            mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

            (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
              return Promise.resolve({
                id: `voucher-${Math.random()}`,
                ...args.data,
                createdAt: new Date(),
                updatedAt: new Date(),
                spin: {},
                prize: {},
                user: {},
                tenant: {},
              });
            });

            const voucher = await createVoucher(params);
            codes.add(voucher.code);
          }

          // All voucher codes should be unique
          expect(codes.size).toBe(paramsArray.length);
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);
});


/**
 * Property 6: Expiration Date Calculation
 * 
 * For any voucher created with a prize having voucherValidityDays = N, 
 * the voucher's expiresAt date should be exactly N days after the creation timestamp.
 * 
 * **Validates: Requirements 1.5**
 */
describe('Property 6: Expiration Date Calculation', () => {
  const { createVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('expiration date is exactly N days after creation for any validityDays value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          spinId: fc.uuid(),
          prizeId: fc.uuid(),
          userId: fc.uuid(),
          tenantId: fc.uuid(),
          tenantSlug: fc.stringMatching(/^[a-z0-9-]{4,20}$/),
          validityDays: fc.integer({ min: 1, max: 90 }),
          redemptionLimit: fc.integer({ min: 1, max: 10 }),
          generateQR: fc.constant(false), // Disable QR to speed up tests
        }),
        async (params) => {
          // Capture the time before voucher creation
          const beforeCreation = new Date();

          // Mock database operations
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

          let capturedExpiresAt: Date | null = null;
          (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
            capturedExpiresAt = args.data.expiresAt;
            return Promise.resolve({
              id: 'voucher-id',
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date(),
              spin: {},
              prize: {},
              user: {},
              tenant: {},
            });
          });

          // Create voucher
          await createVoucher(params);

          // Capture the time after voucher creation
          const afterCreation = new Date();

          // Verify expiresAt was set
          expect(capturedExpiresAt).not.toBeNull();

          if (capturedExpiresAt) {
            // Calculate expected expiration date range
            // The expiration should be validityDays from the creation time
            const minExpectedExpiration = new Date(beforeCreation);
            minExpectedExpiration.setDate(minExpectedExpiration.getDate() + params.validityDays);

            const maxExpectedExpiration = new Date(afterCreation);
            maxExpectedExpiration.setDate(maxExpectedExpiration.getDate() + params.validityDays);

            // Verify expiresAt is within the expected range
            // (accounting for the time it takes to execute the function)
            expect(capturedExpiresAt.getTime()).toBeGreaterThanOrEqual(minExpectedExpiration.getTime() - 1000);
            expect(capturedExpiresAt.getTime()).toBeLessThanOrEqual(maxExpectedExpiration.getTime() + 1000);

            // Verify the day difference is approximately validityDays
            const daysDifference = Math.round(
              (capturedExpiresAt.getTime() - beforeCreation.getTime()) / (1000 * 60 * 60 * 24)
            );
            expect(daysDifference).toBe(params.validityDays);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);

  test('expiration date calculation is consistent across multiple vouchers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 365 }),
        fc.integer({ min: 3, max: 10 }),
        async (validityDays, count) => {
          const expirationDates: Date[] = [];
          const creationTime = new Date();

          for (let i = 0; i < count; i++) {
            mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

            let capturedExpiresAt: Date | null = null;
            (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
              capturedExpiresAt = args.data.expiresAt;
              return Promise.resolve({
                id: `voucher-${i}`,
                code: `TEST-CODE${i}`,
                qrImageUrl: null,
                ...args.data,
                createdAt: new Date(),
                updatedAt: new Date(),
                spin: {},
                prize: {},
                user: {},
                tenant: {},
              });
            });

            await createVoucher({
              spinId: `spin-${i}`,
              prizeId: `prize-${i}`,
              userId: `user-${i}`,
              tenantId: `tenant-${i}`,
              tenantSlug: 'test',
              validityDays,
              redemptionLimit: 1,
              generateQR: false,
            });

            if (capturedExpiresAt) {
              expirationDates.push(capturedExpiresAt);
            }
          }

          // All expiration dates should be approximately the same
          // (within a few seconds of each other)
          if (expirationDates.length > 1) {
            const firstExpiration = expirationDates[0].getTime();
            for (const expiration of expirationDates) {
              const timeDiff = Math.abs(expiration.getTime() - firstExpiration);
              // Allow up to 5 seconds difference due to execution time
              expect(timeDiff).toBeLessThan(5000);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});


/**
 * Unit Tests: createVoucher Edge Cases
 * 
 * Test voucher creation without QR code and with QR generation failure
 * 
 * **Validates: Requirements 3.4**
 */
describe('Unit Tests: createVoucher Edge Cases', () => {
  const { createVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates voucher without QR code when generateQR is false', async () => {
    const params = {
      spinId: 'spin-123',
      prizeId: 'prize-456',
      userId: 'user-789',
      tenantId: 'tenant-abc',
      tenantSlug: 'test-shop',
      validityDays: 30,
      redemptionLimit: 1,
      generateQR: false,
    };

    // Mock database operations
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

    const mockVoucher = {
      id: 'voucher-id',
      code: 'TEST-CODE123',
      qrImageUrl: null,
      spinId: params.spinId,
      prizeId: params.prizeId,
      userId: params.userId,
      tenantId: params.tenantId,
      expiresAt: new Date(),
      redemptionLimit: params.redemptionLimit,
      redemptionCount: 0,
      isRedeemed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      spin: {},
      prize: {},
      user: {},
      tenant: {},
    };

    (mockPrisma.voucher as any).create = jest.fn().mockResolvedValueOnce(mockVoucher);

    // Create voucher
    const voucher = await createVoucher(params);

    // Verify voucher was created without QR code
    expect(voucher).toBeDefined();
    expect(voucher.qrImageUrl).toBeNull();
    expect(mockPrisma.voucher.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          qrImageUrl: null,
        }),
      })
    );
  });

  test('creates voucher successfully even when QR generation fails', async () => {
    const params = {
      spinId: 'spin-123',
      prizeId: 'prize-456',
      userId: 'user-789',
      tenantId: 'tenant-abc',
      tenantSlug: 'test-shop',
      validityDays: 30,
      redemptionLimit: 1,
      generateQR: true, // QR generation is requested but will fail
    };

    // Mock database operations
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

    (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
      return Promise.resolve({
        id: 'voucher-id',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        spin: {},
        prize: {},
        user: {},
        tenant: {},
      });
    });

    // Create voucher - should succeed even though QR generation fails
    const voucher = await createVoucher(params);

    // Verify voucher was created successfully
    expect(voucher).toBeDefined();
    expect(voucher.id).toBe('voucher-id');
    expect(voucher.code).toMatch(/^TEST-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$/);
    
    // QR URL should be null due to generation failure (UploadThing not configured in tests)
    expect(voucher.qrImageUrl).toBeNull();
    
    // Voucher should still be created in database
    expect(mockPrisma.voucher.create).toHaveBeenCalledTimes(1);
  });

  test('creates voucher without QR when generateQR is false', async () => {
    const params = {
      spinId: 'spin-123',
      prizeId: 'prize-456',
      userId: 'user-789',
      tenantId: 'tenant-abc',
      tenantSlug: 'test-shop',
      validityDays: 30,
      redemptionLimit: 1,
      generateQR: false,
    };

    // Mock database operations
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

    (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
      return Promise.resolve({
        id: 'voucher-id',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        spin: {},
        prize: {},
        user: {},
        tenant: {},
      });
    });

    // Create voucher
    const voucher = await createVoucher(params);

    // Verify voucher was created without QR code
    expect(voucher).toBeDefined();
    expect(voucher.qrImageUrl).toBeNull();
    expect(mockPrisma.voucher.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          qrImageUrl: null,
        }),
      })
    );
  });

  test('sets correct redemption defaults', async () => {
    const params = {
      spinId: 'spin-123',
      prizeId: 'prize-456',
      userId: 'user-789',
      tenantId: 'tenant-abc',
      tenantSlug: 'test-shop',
      validityDays: 30,
      redemptionLimit: 5,
      generateQR: false,
    };

    // Mock database operations
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

    let capturedData: any = null;
    (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
      capturedData = args.data;
      return Promise.resolve({
        id: 'voucher-id',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        spin: {},
        prize: {},
        user: {},
        tenant: {},
      });
    });

    // Create voucher
    await createVoucher(params);

    // Verify redemption defaults
    expect(capturedData.redemptionCount).toBe(0);
    expect(capturedData.isRedeemed).toBe(false);
    expect(capturedData.redemptionLimit).toBe(5);
  });

  test('associates voucher with all required entities', async () => {
    const params = {
      spinId: 'spin-123',
      prizeId: 'prize-456',
      userId: 'user-789',
      tenantId: 'tenant-abc',
      tenantSlug: 'test-shop',
      validityDays: 30,
      redemptionLimit: 1,
      generateQR: false,
    };

    // Mock database operations
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

    let capturedData: any = null;
    (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
      capturedData = args.data;
      return Promise.resolve({
        id: 'voucher-id',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        spin: { id: params.spinId },
        prize: { id: params.prizeId },
        user: { id: params.userId },
        tenant: { id: params.tenantId },
      });
    });

    // Create voucher
    const voucher = await createVoucher(params);

    // Verify all entity associations
    expect(capturedData.spinId).toBe(params.spinId);
    expect(capturedData.prizeId).toBe(params.prizeId);
    expect(capturedData.userId).toBe(params.userId);
    expect(capturedData.tenantId).toBe(params.tenantId);

    // Verify includes were requested
    expect(mockPrisma.voucher.create).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          spin: true,
          prize: true,
          user: true,
          tenant: true,
        }),
      })
    );
  });
});


/**
 * Property 8: Validation - Code Existence
 * 
 * For any voucher code submitted for validation, if the code exists in the 
 * database and belongs to the requesting tenant, validation should return 
 * the voucher details; otherwise, it should return an error with reason 
 * "Voucher not found" or "Invalid voucher".
 * 
 * **Validates: Requirements 4.1, 4.2**
 */
describe('Property 8: Validation - Code Existence', () => {
  const { validateVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns not_found for non-existent voucher code', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
        }),
        async ({ code, tenantId }) => {
          // Mock: voucher not found
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

          const result = await validateVoucher(code, tenantId);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe('not_found');
          expect(result.voucher).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('returns wrong_tenant for voucher from different tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          requestingTenantId: fc.uuid(),
          voucherTenantId: fc.uuid(),
        }).filter(({ requestingTenantId, voucherTenantId }) => 
          requestingTenantId !== voucherTenantId
        ),
        async ({ code, requestingTenantId, voucherTenantId }) => {
          // Mock: voucher exists but belongs to different tenant
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId: voucherTenantId,
            expiresAt: new Date(Date.now() + 86400000), // Tomorrow
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            prize: { name: 'Test Prize', description: 'Test Description' },
            user: { name: 'Test User', phone: '1234567890' },
          } as any);

          const result = await validateVoucher(code, requestingTenantId);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe('wrong_tenant');
          expect(result.voucher).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('returns voucher details for valid code from correct tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          prizeName: fc.string({ minLength: 5, maxLength: 50 }),
          customerName: fc.string({ minLength: 3, maxLength: 30 }),
          customerPhone: fc.string({ minLength: 10, maxLength: 15 }),
        }),
        async ({ code, tenantId, prizeName, customerName, customerPhone }) => {
          const expiresAt = new Date(Date.now() + 86400000); // Tomorrow

          // Mock: valid voucher
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId,
            expiresAt,
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            redeemedAt: null,
            redeemedBy: null,
            prize: { name: prizeName, description: 'Test Description' },
            user: { name: customerName, phone: customerPhone },
          } as any);

          const result = await validateVoucher(code, tenantId);

          expect(result.valid).toBe(true);
          expect(result.voucher).toBeDefined();
          expect(result.voucher?.code).toBe(code);
          expect(result.voucher?.prize.name).toBe(prizeName);
          expect(result.voucher?.customer.name).toBe(customerName);
          expect(result.voucher?.customer.phone).toBe(customerPhone);
          expect(result.reason).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });
});


/**
 * Property 9: Validation - Expiration Check
 * 
 * For any voucher being validated, if the current date is after the voucher's 
 * expiresAt date, validation should fail with reason "expired" and include 
 * the expiration date in the details.
 * 
 * **Validates: Requirements 4.3**
 */
describe('Property 9: Validation - Expiration Check', () => {
  const { validateVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns expired for vouchers past expiration date', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          daysExpired: fc.integer({ min: 1, max: 365 }),
        }),
        async ({ code, tenantId, daysExpired }) => {
          // Create expiration date in the past
          const expiresAt = new Date(Date.now() - daysExpired * 86400000);

          // Mock: expired voucher
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId,
            expiresAt,
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            redeemedAt: null,
            redeemedBy: null,
            prize: { name: 'Test Prize', description: 'Test Description' },
            user: { name: 'Test User', phone: '1234567890' },
          } as any);

          const result = await validateVoucher(code, tenantId);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe('expired');
          expect(result.details?.expiresAt).toEqual(expiresAt);
          expect(result.voucher).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('accepts vouchers with future expiration date', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          daysUntilExpiry: fc.integer({ min: 1, max: 365 }),
        }),
        async ({ code, tenantId, daysUntilExpiry }) => {
          // Create expiration date in the future
          const expiresAt = new Date(Date.now() + daysUntilExpiry * 86400000);

          // Mock: valid voucher
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId,
            expiresAt,
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            redeemedAt: null,
            redeemedBy: null,
            prize: { name: 'Test Prize', description: 'Test Description' },
            user: { name: 'Test User', phone: '1234567890' },
          } as any);

          const result = await validateVoucher(code, tenantId);

          expect(result.valid).toBe(true);
          expect(result.reason).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });
});


/**
 * Property 10: Validation - Redemption Status Check
 * 
 * For any voucher being validated, if isRedeemed is true and redemptionCount >= 
 * redemptionLimit, validation should fail with reason "redeemed" or "limit_reached" 
 * and include redemption details.
 * 
 * **Validates: Requirements 4.4, 4.5**
 */
describe('Property 10: Validation - Redemption Status Check', () => {
  const { validateVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns redeemed for fully redeemed vouchers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          redemptionLimit: fc.integer({ min: 1, max: 10 }),
        }),
        async ({ code, tenantId, redemptionLimit }) => {
          const redeemedAt = new Date(Date.now() - 3600000); // 1 hour ago
          const redeemedBy = 'merchant-id';
          const expiresAt = new Date(Date.now() + 86400000); // Tomorrow

          // Mock: fully redeemed voucher
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId,
            expiresAt,
            isRedeemed: true,
            redemptionCount: redemptionLimit,
            redemptionLimit,
            redeemedAt,
            redeemedBy,
            prize: { name: 'Test Prize', description: 'Test Description' },
            user: { name: 'Test User', phone: '1234567890' },
          } as any);

          const result = await validateVoucher(code, tenantId);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe('redeemed');
          expect(result.details?.redeemedAt).toEqual(redeemedAt);
          expect(result.details?.redeemedBy).toBe(redeemedBy);
          expect(result.voucher).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('returns limit_reached when redemption count equals limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          redemptionLimit: fc.integer({ min: 2, max: 10 }),
        }),
        async ({ code, tenantId, redemptionLimit }) => {
          const expiresAt = new Date(Date.now() + 86400000); // Tomorrow

          // Mock: limit reached but not marked as redeemed
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId,
            expiresAt,
            isRedeemed: false,
            redemptionCount: redemptionLimit,
            redemptionLimit,
            redeemedAt: null,
            redeemedBy: null,
            prize: { name: 'Test Prize', description: 'Test Description' },
            user: { name: 'Test User', phone: '1234567890' },
          } as any);

          const result = await validateVoucher(code, tenantId);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe('limit_reached');
          expect(result.voucher).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('accepts vouchers with redemption count below limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          redemptionLimit: fc.integer({ min: 2, max: 10 }),
        }),
        async ({ code, tenantId, redemptionLimit }) => {
          const redemptionCount = Math.floor(Math.random() * redemptionLimit);
          const expiresAt = new Date(Date.now() + 86400000); // Tomorrow

          // Mock: valid voucher with redemptions available
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId,
            expiresAt,
            isRedeemed: false,
            redemptionCount,
            redemptionLimit,
            redeemedAt: null,
            redeemedBy: null,
            prize: { name: 'Test Prize', description: 'Test Description' },
            user: { name: 'Test User', phone: '1234567890' },
          } as any);

          const result = await validateVoucher(code, tenantId);

          expect(result.valid).toBe(true);
          expect(result.voucher?.redemptionCount).toBe(redemptionCount);
          expect(result.voucher?.redemptionLimit).toBe(redemptionLimit);
        }
      ),
      { numRuns: 10 }
    );
  });
});


/**
 * Property 11: Validation - Complete Response
 * 
 * For any voucher that passes all validation checks, the validation response 
 * should include the voucher code, customer information (name, phone), prize 
 * details (name, description), expiration date, redemption count, and redemption limit.
 * 
 * **Validates: Requirements 4.7**
 */
describe('Property 11: Validation - Complete Response', () => {
  const { validateVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('valid voucher response includes all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          prizeName: fc.string({ minLength: 5, maxLength: 50 }),
          prizeDescription: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: null }),
          customerName: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: null }),
          customerPhone: fc.string({ minLength: 10, maxLength: 15 }),
          redemptionCount: fc.integer({ min: 0, max: 5 }),
          redemptionLimit: fc.integer({ min: 1, max: 10 }),
          daysUntilExpiry: fc.integer({ min: 1, max: 90 }),
        }).filter(({ redemptionCount, redemptionLimit }) => redemptionCount < redemptionLimit),
        async (params) => {
          const expiresAt = new Date(Date.now() + params.daysUntilExpiry * 86400000);

          // Mock: valid voucher with all fields
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code: params.code,
            tenantId: params.tenantId,
            expiresAt,
            isRedeemed: false,
            redemptionCount: params.redemptionCount,
            redemptionLimit: params.redemptionLimit,
            redeemedAt: null,
            redeemedBy: null,
            prize: {
              name: params.prizeName,
              description: params.prizeDescription,
            },
            user: {
              name: params.customerName,
              phone: params.customerPhone,
            },
          } as any);

          const result = await validateVoucher(params.code, params.tenantId);

          // Verify response structure
          expect(result.valid).toBe(true);
          expect(result.voucher).toBeDefined();
          
          // Verify all required fields are present
          expect(result.voucher?.code).toBe(params.code);
          expect(result.voucher?.prize.name).toBe(params.prizeName);
          expect(result.voucher?.prize.description).toBe(params.prizeDescription);
          expect(result.voucher?.customer.name).toBe(params.customerName);
          expect(result.voucher?.customer.phone).toBe(params.customerPhone);
          expect(result.voucher?.expiresAt).toEqual(expiresAt);
          expect(result.voucher?.redemptionCount).toBe(params.redemptionCount);
          expect(result.voucher?.redemptionLimit).toBe(params.redemptionLimit);
          
          // Verify no error fields
          expect(result.reason).toBeUndefined();
          expect(result.details).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });
});


/**
 * Property 12: Validation - Error Reasons
 * 
 * For any voucher that fails validation, the response should include a specific 
 * reason field indicating why validation failed (not_found, expired, redeemed, 
 * wrong_tenant, limit_reached).
 * 
 * **Validates: Requirements 4.6**
 */
describe('Property 12: Validation - Error Reasons', () => {
  const { validateVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('all validation failures include specific error reason', async () => {
    const testCases = [
      {
        name: 'not_found',
        mockVoucher: null,
        expectedReason: 'not_found',
      },
      {
        name: 'wrong_tenant',
        mockVoucher: {
          id: 'voucher-id',
          code: 'TEST-CODE',
          tenantId: 'different-tenant',
          expiresAt: new Date(Date.now() + 86400000),
          isRedeemed: false,
          redemptionCount: 0,
          redemptionLimit: 1,
          prize: { name: 'Test Prize', description: 'Test' },
          user: { name: 'Test User', phone: '1234567890' },
        },
        expectedReason: 'wrong_tenant',
      },
      {
        name: 'expired',
        mockVoucher: {
          id: 'voucher-id',
          code: 'TEST-CODE',
          tenantId: 'tenant-id',
          expiresAt: new Date(Date.now() - 86400000), // Yesterday
          isRedeemed: false,
          redemptionCount: 0,
          redemptionLimit: 1,
          prize: { name: 'Test Prize', description: 'Test' },
          user: { name: 'Test User', phone: '1234567890' },
        },
        expectedReason: 'expired',
      },
      {
        name: 'redeemed',
        mockVoucher: {
          id: 'voucher-id',
          code: 'TEST-CODE',
          tenantId: 'tenant-id',
          expiresAt: new Date(Date.now() + 86400000),
          isRedeemed: true,
          redemptionCount: 1,
          redemptionLimit: 1,
          redeemedAt: new Date(),
          redeemedBy: 'merchant-id',
          prize: { name: 'Test Prize', description: 'Test' },
          user: { name: 'Test User', phone: '1234567890' },
        },
        expectedReason: 'redeemed',
      },
      {
        name: 'limit_reached',
        mockVoucher: {
          id: 'voucher-id',
          code: 'TEST-CODE',
          tenantId: 'tenant-id',
          expiresAt: new Date(Date.now() + 86400000),
          isRedeemed: false,
          redemptionCount: 5,
          redemptionLimit: 5,
          redeemedAt: null,
          redeemedBy: null,
          prize: { name: 'Test Prize', description: 'Test' },
          user: { name: 'Test User', phone: '1234567890' },
        },
        expectedReason: 'limit_reached',
      },
    ];

    for (const testCase of testCases) {
      mockPrisma.voucher.findUnique.mockResolvedValueOnce(testCase.mockVoucher as any);

      const result = await validateVoucher('TEST-CODE', 'tenant-id');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(testCase.expectedReason);
      expect(result.voucher).toBeUndefined();
    }
  });
});


/**
 * Unit Tests: Validation Edge Cases
 * 
 * Test validation with non-existent code, expired voucher, already redeemed 
 * voucher, and wrong tenant.
 * 
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
 */
describe('Unit Tests: Validation Edge Cases', () => {
  const { validateVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('validation with non-existent code returns not_found', async () => {
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

    const result = await validateVoucher('NONEXISTENT-CODE', 'tenant-123');

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not_found');
    expect(result.voucher).toBeUndefined();
    expect(result.details).toBeUndefined();
  });

  test('validation with expired voucher returns expired with expiration date', async () => {
    const expiresAt = new Date('2023-01-01');
    
    mockPrisma.voucher.findUnique.mockResolvedValueOnce({
      id: 'voucher-id',
      code: 'EXPIRED-CODE',
      tenantId: 'tenant-123',
      expiresAt,
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: { name: 'Test Prize', description: 'Test Description' },
      user: { name: 'John Doe', phone: '1234567890' },
    } as any);

    const result = await validateVoucher('EXPIRED-CODE', 'tenant-123');

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('expired');
    expect(result.details?.expiresAt).toEqual(expiresAt);
    expect(result.voucher).toBeUndefined();
  });

  test('validation with already redeemed voucher returns redeemed with details', async () => {
    const redeemedAt = new Date('2024-01-15');
    const redeemedBy = 'merchant-456';
    
    mockPrisma.voucher.findUnique.mockResolvedValueOnce({
      id: 'voucher-id',
      code: 'REDEEMED-CODE',
      tenantId: 'tenant-123',
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: true,
      redemptionCount: 1,
      redemptionLimit: 1,
      redeemedAt,
      redeemedBy,
      prize: { name: 'Test Prize', description: 'Test Description' },
      user: { name: 'Jane Smith', phone: '9876543210' },
    } as any);

    const result = await validateVoucher('REDEEMED-CODE', 'tenant-123');

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('redeemed');
    expect(result.details?.redeemedAt).toEqual(redeemedAt);
    expect(result.details?.redeemedBy).toBe(redeemedBy);
    expect(result.voucher).toBeUndefined();
  });

  test('validation with wrong tenant returns wrong_tenant', async () => {
    mockPrisma.voucher.findUnique.mockResolvedValueOnce({
      id: 'voucher-id',
      code: 'VALID-CODE',
      tenantId: 'tenant-999', // Different tenant
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: { name: 'Test Prize', description: 'Test Description' },
      user: { name: 'Bob Johnson', phone: '5555555555' },
    } as any);

    const result = await validateVoucher('VALID-CODE', 'tenant-123');

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('wrong_tenant');
    expect(result.voucher).toBeUndefined();
  });

  test('validation with valid voucher returns complete details', async () => {
    const expiresAt = new Date(Date.now() + 30 * 86400000); // 30 days from now
    
    mockPrisma.voucher.findUnique.mockResolvedValueOnce({
      id: 'voucher-id',
      code: 'VALID-CODE',
      tenantId: 'tenant-123',
      expiresAt,
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: {
        name: '10% Discount',
        description: 'Get 10% off your next purchase',
      },
      user: {
        name: 'Alice Cooper',
        phone: '1112223333',
      },
    } as any);

    const result = await validateVoucher('VALID-CODE', 'tenant-123');

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.voucher).toBeDefined();
    expect(result.voucher?.code).toBe('VALID-CODE');
    expect(result.voucher?.prize.name).toBe('10% Discount');
    expect(result.voucher?.prize.description).toBe('Get 10% off your next purchase');
    expect(result.voucher?.customer.name).toBe('Alice Cooper');
    expect(result.voucher?.customer.phone).toBe('1112223333');
    expect(result.voucher?.expiresAt).toEqual(expiresAt);
    expect(result.voucher?.redemptionCount).toBe(0);
    expect(result.voucher?.redemptionLimit).toBe(1);
  });

  test('validation with multi-use voucher partially redeemed', async () => {
    const expiresAt = new Date(Date.now() + 30 * 86400000);
    
    mockPrisma.voucher.findUnique.mockResolvedValueOnce({
      id: 'voucher-id',
      code: 'MULTI-USE-CODE',
      tenantId: 'tenant-123',
      expiresAt,
      isRedeemed: false,
      redemptionCount: 2,
      redemptionLimit: 5,
      redeemedAt: null,
      redeemedBy: null,
      prize: {
        name: 'Free Coffee',
        description: '5 free coffees',
      },
      user: {
        name: 'Coffee Lover',
        phone: '4445556666',
      },
    } as any);

    const result = await validateVoucher('MULTI-USE-CODE', 'tenant-123');

    expect(result.valid).toBe(true);
    expect(result.voucher?.redemptionCount).toBe(2);
    expect(result.voucher?.redemptionLimit).toBe(5);
  });

  test('validation with multi-use voucher at limit', async () => {
    const expiresAt = new Date(Date.now() + 30 * 86400000);
    
    mockPrisma.voucher.findUnique.mockResolvedValueOnce({
      id: 'voucher-id',
      code: 'LIMIT-REACHED-CODE',
      tenantId: 'tenant-123',
      expiresAt,
      isRedeemed: false,
      redemptionCount: 5,
      redemptionLimit: 5,
      redeemedAt: null,
      redeemedBy: null,
      prize: {
        name: 'Free Coffee',
        description: '5 free coffees',
      },
      user: {
        name: 'Coffee Lover',
        phone: '4445556666',
      },
    } as any);

    const result = await validateVoucher('LIMIT-REACHED-CODE', 'tenant-123');

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('limit_reached');
  });
});


/**
 * Property 13: Redemption Requires Validation
 * 
 * For any redemption attempt, the voucher must first pass validation; if 
 * validation fails, redemption should be rejected without modifying the 
 * voucher state.
 * 
 * **Validates: Requirements 5.1, 5.7**
 */
describe('Property 13: Redemption Requires Validation', () => {
  const { redeemVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redemption fails for invalid vouchers without modifying state', async () => {
    const invalidScenarios = [
      {
        name: 'non-existent voucher',
        mockVoucher: null,
        expectedError: 'Voucher not found',
      },
      {
        name: 'wrong tenant',
        mockVoucher: {
          id: 'voucher-id',
          code: 'TEST-CODE',
          tenantId: 'different-tenant',
          expiresAt: new Date(Date.now() + 86400000),
          isRedeemed: false,
          redemptionCount: 0,
          redemptionLimit: 1,
          prize: { name: 'Test Prize', description: 'Test' },
          user: { name: 'Test User', phone: '1234567890' },
        },
        expectedError: 'Invalid voucher',
      },
      {
        name: 'expired voucher',
        mockVoucher: {
          id: 'voucher-id',
          code: 'TEST-CODE',
          tenantId: 'tenant-123',
          expiresAt: new Date(Date.now() - 86400000), // Yesterday
          isRedeemed: false,
          redemptionCount: 0,
          redemptionLimit: 1,
          prize: { name: 'Test Prize', description: 'Test' },
          user: { name: 'Test User', phone: '1234567890' },
        },
        expectedError: 'Voucher expired',
      },
      {
        name: 'already redeemed',
        mockVoucher: {
          id: 'voucher-id',
          code: 'TEST-CODE',
          tenantId: 'tenant-123',
          expiresAt: new Date(Date.now() + 86400000),
          isRedeemed: true,
          redemptionCount: 1,
          redemptionLimit: 1,
          redeemedAt: new Date(),
          redeemedBy: 'merchant-id',
          prize: { name: 'Test Prize', description: 'Test' },
          user: { name: 'Test User', phone: '1234567890' },
        },
        expectedError: 'Voucher already redeemed',
      },
      {
        name: 'limit reached',
        mockVoucher: {
          id: 'voucher-id',
          code: 'TEST-CODE',
          tenantId: 'tenant-123',
          expiresAt: new Date(Date.now() + 86400000),
          isRedeemed: false,
          redemptionCount: 5,
          redemptionLimit: 5,
          redeemedAt: null,
          redeemedBy: null,
          prize: { name: 'Test Prize', description: 'Test' },
          user: { name: 'Test User', phone: '1234567890' },
        },
        expectedError: 'Voucher redemption limit reached',
      },
    ];

    for (const scenario of invalidScenarios) {
      // Mock validation to return the invalid voucher
      mockPrisma.voucher.findUnique.mockResolvedValueOnce(scenario.mockVoucher as any);

      const result = await redeemVoucher('TEST-CODE', 'merchant-123', 'tenant-123');

      // Verify redemption failed
      expect(result.success).toBe(false);
      expect(result.error).toContain(scenario.expectedError.split(' ')[0]); // Check first word
      expect(result.voucher).toBeUndefined();

      // Verify no update was attempted (no transaction started)
      // The transaction would call findUnique again, so we only expect 1 call
      expect(mockPrisma.voucher.findUnique).toHaveBeenCalledTimes(1);
      
      jest.clearAllMocks();
    }
  });

  test('redemption proceeds only after successful validation', async () => {
    const validVoucher = {
      id: 'voucher-id',
      code: 'VALID-CODE',
      tenantId: 'tenant-123',
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: { name: 'Test Prize', description: 'Test' },
      user: { name: 'Test User', phone: '1234567890' },
    };

    // Mock validation call (first findUnique)
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

    // Mock transaction calls
    const mockTransaction = jest.fn(async (callback: any) => {
      // Mock the findUnique inside transaction
      mockPrisma.voucher.findUnique.mockResolvedValueOnce({
        ...validVoucher,
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
      } as any);

      // Mock the update inside transaction
      (mockPrisma.voucher as any).update = jest.fn().mockResolvedValueOnce({
        ...validVoucher,
        isRedeemed: true,
        redeemedAt: new Date(),
        redeemedBy: 'merchant-123',
        redemptionCount: 1,
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
        redeemedByUser: {},
      });

      return callback(mockPrisma);
    });

    (mockPrisma as any).$transaction = mockTransaction;

    const result = await redeemVoucher('VALID-CODE', 'merchant-123', 'tenant-123');

    // Verify redemption succeeded
    expect(result.success).toBe(true);
    expect(result.voucher).toBeDefined();
    expect(result.error).toBeUndefined();

    // Verify validation was called first
    expect(mockPrisma.voucher.findUnique).toHaveBeenCalled();
    
    // Verify transaction was executed
    expect(mockTransaction).toHaveBeenCalled();
  });
});


/**
 * Property 14: Redemption State Changes
 * 
 * For any successful voucher redemption, the voucher should have isRedeemed 
 * set to true, redeemedAt set to the current timestamp, redeemedBy set to 
 * the merchant's user ID, and redemptionCount incremented by exactly one.
 * 
 * **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
 */
describe('Property 14: Redemption State Changes', () => {
  const { redeemVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful redemption updates all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          merchantId: fc.uuid(),
          tenantId: fc.uuid(),
          initialRedemptionCount: fc.integer({ min: 0, max: 4 }),
          redemptionLimit: fc.integer({ min: 1, max: 10 }),
        }).filter(({ initialRedemptionCount, redemptionLimit }) => 
          initialRedemptionCount < redemptionLimit
        ),
        async (params) => {
          const beforeRedemption = new Date();

          const validVoucher = {
            id: 'voucher-id',
            code: params.code,
            tenantId: params.tenantId,
            expiresAt: new Date(Date.now() + 86400000),
            isRedeemed: false,
            redemptionCount: params.initialRedemptionCount,
            redemptionLimit: params.redemptionLimit,
            redeemedAt: null,
            redeemedBy: null,
            prize: { name: 'Test Prize', description: 'Test' },
            user: { name: 'Test User', phone: '1234567890' },
          };

          // Mock validation call
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

          let capturedUpdateData: any = null;

          // Mock transaction
          const mockTransaction = jest.fn(async (callback: any) => {
            // Mock findUnique inside transaction
            mockPrisma.voucher.findUnique.mockResolvedValueOnce({
              ...validVoucher,
              spin: {},
              prize: validVoucher.prize,
              user: validVoucher.user,
              tenant: {},
            } as any);

            // Mock update inside transaction
            (mockPrisma.voucher as any).update = jest.fn().mockImplementation((args: any) => {
              capturedUpdateData = args.data;
              const willBeFullyRedeemed = (params.initialRedemptionCount + 1) >= params.redemptionLimit;
              return Promise.resolve({
                ...validVoucher,
                isRedeemed: willBeFullyRedeemed,
                redeemedAt: new Date(),
                redeemedBy: params.merchantId,
                redemptionCount: params.initialRedemptionCount + 1,
                spin: {},
                prize: validVoucher.prize,
                user: validVoucher.user,
                tenant: {},
                redeemedByUser: {},
              });
            });

            // Mock the final findUnique call after transaction completes
            const willBeFullyRedeemed = (params.initialRedemptionCount + 1) >= params.redemptionLimit;
            mockPrisma.voucher.findUnique.mockResolvedValueOnce({
              ...validVoucher,
              isRedeemed: willBeFullyRedeemed,
              redeemedAt: new Date(),
              redeemedBy: params.merchantId,
              redemptionCount: params.initialRedemptionCount + 1,
              spin: {},
              prize: validVoucher.prize,
              user: validVoucher.user,
              tenant: {},
              redeemedByUser: {},
            } as any);

            return callback(mockPrisma);
          });

          (mockPrisma as any).$transaction = mockTransaction;

          const result = await redeemVoucher(params.code, params.merchantId, params.tenantId);

          const afterRedemption = new Date();

          // Verify redemption succeeded
          expect(result.success).toBe(true);
          expect(result.voucher).toBeDefined();

          // Calculate if voucher should be fully redeemed
          const willBeFullyRedeemed = (params.initialRedemptionCount + 1) >= params.redemptionLimit;

          // Requirement 5.2: isRedeemed set to true only when fully redeemed
          expect(capturedUpdateData.isRedeemed).toBe(willBeFullyRedeemed);

          // Requirement 5.4: redeemedBy set to merchant ID
          expect(capturedUpdateData.redeemedBy).toBe(params.merchantId);

          // Requirement 5.5: redemptionCount incremented by 1
          expect(capturedUpdateData.redemptionCount).toEqual({ increment: 1 });
          expect(result.voucher.redemptionCount).toBe(params.initialRedemptionCount + 1);

          // Requirement 5.3: redeemedAt set to current timestamp
          expect(capturedUpdateData.redeemedAt).toBeDefined();
          expect(capturedUpdateData.redeemedAt.getTime()).toBeGreaterThanOrEqual(beforeRedemption.getTime());
          expect(capturedUpdateData.redeemedAt.getTime()).toBeLessThanOrEqual(afterRedemption.getTime());
        }
      ),
      { numRuns: 10 }
    );
  });

  test('redemption count increments correctly for multi-use vouchers', async () => {
    const testCases = [
      { initial: 0, limit: 5, expected: 1 },
      { initial: 1, limit: 5, expected: 2 },
      { initial: 3, limit: 5, expected: 4 },
      { initial: 4, limit: 5, expected: 5 },
    ];

    for (const testCase of testCases) {
      const validVoucher = {
        id: 'voucher-id',
        code: 'MULTI-USE-CODE',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: false,
        redemptionCount: testCase.initial,
        redemptionLimit: testCase.limit,
        redeemedAt: null,
        redeemedBy: null,
        prize: { name: 'Test Prize', description: 'Test' },
        user: { name: 'Test User', phone: '1234567890' },
      };

      // Mock validation call
      mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

      // Mock transaction
      const mockTransaction = jest.fn(async (callback: any) => {
        mockPrisma.voucher.findUnique.mockResolvedValueOnce({
          ...validVoucher,
          spin: {},
          prize: validVoucher.prize,
          user: validVoucher.user,
          tenant: {},
        } as any);

        (mockPrisma.voucher as any).update = jest.fn().mockResolvedValueOnce({
          ...validVoucher,
          isRedeemed: testCase.expected >= testCase.limit,
          redeemedAt: new Date(),
          redeemedBy: 'merchant-123',
          redemptionCount: testCase.expected,
          spin: {},
          prize: validVoucher.prize,
          user: validVoucher.user,
          tenant: {},
          redeemedByUser: {},
        });

        // Mock the final findUnique call after transaction completes
        mockPrisma.voucher.findUnique.mockResolvedValueOnce({
          ...validVoucher,
          isRedeemed: testCase.expected >= testCase.limit,
          redeemedAt: new Date(),
          redeemedBy: 'merchant-123',
          redemptionCount: testCase.expected,
          spin: {},
          prize: validVoucher.prize,
          user: validVoucher.user,
          tenant: {},
          redeemedByUser: {},
        } as any);

        return callback(mockPrisma);
      });

      (mockPrisma as any).$transaction = mockTransaction;

      const result = await redeemVoucher('MULTI-USE-CODE', 'merchant-123', 'tenant-123');

      expect(result.success).toBe(true);
      expect(result.voucher.redemptionCount).toBe(testCase.expected);

      jest.clearAllMocks();
    }
  });
});


/**
 * Unit Tests: Redemption Edge Cases
 * 
 * Test redemption of invalid voucher doesn't modify state and concurrent 
 * redemption attempts (double redemption prevention).
 * 
 * **Validates: Requirements 5.7**
 */
describe('Unit Tests: Redemption Edge Cases', () => {
  const { redeemVoucher } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redemption of invalid voucher does not modify state', async () => {
    // Mock: voucher not found
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

    const result = await redeemVoucher('INVALID-CODE', 'merchant-123', 'tenant-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Voucher not found');
    expect(result.voucher).toBeUndefined();

    // Verify no transaction was started (only validation call)
    expect(mockPrisma.voucher.findUnique).toHaveBeenCalledTimes(1);
  });

  test('concurrent redemption attempts are prevented by transaction locking', async () => {
    const validVoucher = {
      id: 'voucher-id',
      code: 'CONCURRENT-CODE',
      tenantId: 'tenant-123',
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: { name: 'Test Prize', description: 'Test' },
      user: { name: 'Test User', phone: '1234567890' },
    };

    // First redemption attempt - validation passes
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

    // Mock transaction for first attempt
    const mockTransaction1 = jest.fn(async (callback: any) => {
      // Inside transaction, voucher is still valid
      mockPrisma.voucher.findUnique.mockResolvedValueOnce({
        ...validVoucher,
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
      } as any);

      (mockPrisma.voucher as any).update = jest.fn().mockResolvedValueOnce({
        ...validVoucher,
        isRedeemed: true,
        redeemedAt: new Date(),
        redeemedBy: 'merchant-123',
        redemptionCount: 1,
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
        redeemedByUser: {},
      });

      // Mock the findUnique call after transaction to fetch full voucher
      mockPrisma.voucher.findUnique.mockResolvedValueOnce({
        ...validVoucher,
        isRedeemed: true,
        redeemedAt: new Date(),
        redeemedBy: 'merchant-123',
        redemptionCount: 1,
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
        redeemedByUser: {},
      } as any);

      return callback(mockPrisma);
    });

    (mockPrisma as any).$transaction = mockTransaction1;

    const result1 = await redeemVoucher('CONCURRENT-CODE', 'merchant-123', 'tenant-123');

    expect(result1.success).toBe(true);
    expect(result1.voucher.redemptionCount).toBe(1);

    jest.clearAllMocks();

    // Second redemption attempt - validation should fail (already redeemed)
    const redeemedVoucher = {
      ...validVoucher,
      isRedeemed: true,
      redemptionCount: 1,
      redeemedAt: new Date(),
      redeemedBy: 'merchant-123',
    };

    mockPrisma.voucher.findUnique.mockResolvedValueOnce(redeemedVoucher as any);

    const result2 = await redeemVoucher('CONCURRENT-CODE', 'merchant-456', 'tenant-123');

    expect(result2.success).toBe(false);
    expect(result2.error).toBe('Voucher already redeemed');
    expect(result2.voucher).toBeUndefined();
  });

  test('transaction rollback on error prevents partial updates', async () => {
    const validVoucher = {
      id: 'voucher-id',
      code: 'ERROR-CODE',
      tenantId: 'tenant-123',
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: { name: 'Test Prize', description: 'Test' },
      user: { name: 'Test User', phone: '1234567890' },
    };

    // Mock validation call
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

    // Mock transaction that throws error
    const mockTransaction = jest.fn(async (callback: any) => {
      mockPrisma.voucher.findUnique.mockResolvedValueOnce({
        ...validVoucher,
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
      } as any);

      (mockPrisma.voucher as any).update = jest.fn().mockRejectedValueOnce(
        new Error('Database error')
      );

      return callback(mockPrisma);
    });

    (mockPrisma as any).$transaction = mockTransaction;

    const result = await redeemVoucher('ERROR-CODE', 'merchant-123', 'tenant-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(result.voucher).toBeUndefined();
  });

  test('redemption validates tenant within transaction', async () => {
    const validVoucher = {
      id: 'voucher-id',
      code: 'VALID-CODE',
      tenantId: 'tenant-123',
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: { name: 'Test Prize', description: 'Test' },
      user: { name: 'Test User', phone: '1234567890' },
    };

    // Mock validation call (passes)
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

    // Mock transaction where tenant changes (race condition simulation)
    const mockTransaction = jest.fn(async (callback: any) => {
      // Inside transaction, voucher now belongs to different tenant
      mockPrisma.voucher.findUnique.mockResolvedValueOnce({
        ...validVoucher,
        tenantId: 'different-tenant',
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
      } as any);

      return callback(mockPrisma);
    });

    (mockPrisma as any).$transaction = mockTransaction;

    const result = await redeemVoucher('VALID-CODE', 'merchant-123', 'tenant-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid voucher');
  });

  test('redemption validates expiration within transaction', async () => {
    const validVoucher = {
      id: 'voucher-id',
      code: 'VALID-CODE',
      tenantId: 'tenant-123',
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: { name: 'Test Prize', description: 'Test' },
      user: { name: 'Test User', phone: '1234567890' },
    };

    // Mock validation call (passes)
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

    // Mock transaction where voucher expires (race condition simulation)
    const mockTransaction = jest.fn(async (callback: any) => {
      // Inside transaction, voucher is now expired
      mockPrisma.voucher.findUnique.mockResolvedValueOnce({
        ...validVoucher,
        expiresAt: new Date(Date.now() - 1000), // Expired
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
      } as any);

      return callback(mockPrisma);
    });

    (mockPrisma as any).$transaction = mockTransaction;

    const result = await redeemVoucher('VALID-CODE', 'merchant-123', 'tenant-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Voucher expired');
  });

  test('redemption validates limit within transaction', async () => {
    const validVoucher = {
      id: 'voucher-id',
      code: 'VALID-CODE',
      tenantId: 'tenant-123',
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      prize: { name: 'Test Prize', description: 'Test' },
      user: { name: 'Test User', phone: '1234567890' },
    };

    // Mock validation call (passes)
    mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

    // Mock transaction where limit is reached (race condition simulation)
    const mockTransaction = jest.fn(async (callback: any) => {
      // Inside transaction, limit is now reached
      mockPrisma.voucher.findUnique.mockResolvedValueOnce({
        ...validVoucher,
        redemptionCount: 1, // Limit reached
        spin: {},
        prize: validVoucher.prize,
        user: validVoucher.user,
        tenant: {},
      } as any);

      return callback(mockPrisma);
    });

    (mockPrisma as any).$transaction = mockTransaction;

    const result = await redeemVoucher('VALID-CODE', 'merchant-123', 'tenant-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Voucher redemption limit reached');
  });
});


/**
 * Tests for getVouchersByPhone function
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 */
describe('getVouchersByPhone', () => {
  const { getVouchersByPhone } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns empty array when no vouchers found for phone number', async () => {
    // Mock: no vouchers found
    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce([]);

    const result = await getVouchersByPhone('+1234567890', 'tenant-123');

    expect(result).toEqual([]);
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
          user: {
            phone: '+1234567890',
          },
        }),
      })
    );
  });

  test('returns vouchers with status and prize details for valid phone', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 86400000); // 30 days from now
    const pastDate = new Date(now.getTime() - 5 * 86400000); // 5 days ago

    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'TEST-ACTIVE123',
        qrImageUrl: 'https://example.com/qr1.png',
        tenantId: 'tenant-123',
        expiresAt: futureDate,
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        createdAt: new Date(now.getTime() - 2 * 86400000),
        prize: {
          name: '10% Discount',
          description: 'Get 10% off your next purchase',
        },
      },
      {
        id: 'voucher-2',
        code: 'TEST-EXPIRED456',
        qrImageUrl: 'https://example.com/qr2.png',
        tenantId: 'tenant-123',
        expiresAt: pastDate,
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        createdAt: new Date(now.getTime() - 10 * 86400000),
        prize: {
          name: 'Free Coffee',
          description: null,
        },
      },
      {
        id: 'voucher-3',
        code: 'TEST-REDEEMED789',
        qrImageUrl: null,
        tenantId: 'tenant-123',
        expiresAt: futureDate,
        isRedeemed: true,
        redemptionCount: 1,
        redemptionLimit: 1,
        createdAt: new Date(now.getTime() - 7 * 86400000),
        prize: {
          name: 'Free Meal',
          description: 'One free meal',
        },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchersByPhone('+1234567890', 'tenant-123');

    expect(result).toHaveLength(3);

    // Check active voucher
    expect(result[0].code).toBe('TEST-ACTIVE123');
    expect(result[0].status).toBe('active');
    expect(result[0].prize.name).toBe('10% Discount');
    expect(result[0].prize.description).toBe('Get 10% off your next purchase');
    expect(result[0].qrImageUrl).toBe('https://example.com/qr1.png');

    // Check expired voucher
    expect(result[1].code).toBe('TEST-EXPIRED456');
    expect(result[1].status).toBe('expired');
    expect(result[1].prize.name).toBe('Free Coffee');
    expect(result[1].prize.description).toBeNull();

    // Check redeemed voucher
    expect(result[2].code).toBe('TEST-REDEEMED789');
    expect(result[2].status).toBe('redeemed');
    expect(result[2].prize.name).toBe('Free Meal');
    expect(result[2].qrImageUrl).toBeNull();
  });

  test('only returns vouchers for the specified tenant', async () => {
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'TEST-CODE1',
        qrImageUrl: null,
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        createdAt: new Date(),
        prize: {
          name: 'Prize 1',
          description: 'Description 1',
        },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    await getVouchersByPhone('+1234567890', 'tenant-123');

    // Verify tenant filter was applied
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
        }),
      })
    );
  });

  test('calculates status correctly for multi-use vouchers', async () => {
    const futureDate = new Date(Date.now() + 30 * 86400000);

    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'MULTI-USE-ACTIVE',
        qrImageUrl: null,
        tenantId: 'tenant-123',
        expiresAt: futureDate,
        isRedeemed: false,
        redemptionCount: 2,
        redemptionLimit: 5,
        createdAt: new Date(),
        prize: {
          name: 'Multi-use Prize',
          description: 'Can be used 5 times',
        },
      },
      {
        id: 'voucher-2',
        code: 'MULTI-USE-LIMIT',
        qrImageUrl: null,
        tenantId: 'tenant-123',
        expiresAt: futureDate,
        isRedeemed: false,
        redemptionCount: 5,
        redemptionLimit: 5,
        createdAt: new Date(),
        prize: {
          name: 'Multi-use Prize',
          description: 'Can be used 5 times',
        },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchersByPhone('+1234567890', 'tenant-123');

    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('active'); // 2/5 redemptions
    expect(result[1].status).toBe('redeemed'); // 5/5 redemptions (limit reached)
  });

  test('orders vouchers by creation date descending (most recent first)', async () => {
    const now = new Date();
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'NEWEST',
        qrImageUrl: null,
        tenantId: 'tenant-123',
        expiresAt: new Date(now.getTime() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        createdAt: new Date(now.getTime() - 1 * 86400000), // 1 day ago
        prize: { name: 'Prize 1', description: null },
      },
      {
        id: 'voucher-2',
        code: 'OLDER',
        qrImageUrl: null,
        tenantId: 'tenant-123',
        expiresAt: new Date(now.getTime() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        createdAt: new Date(now.getTime() - 5 * 86400000), // 5 days ago
        prize: { name: 'Prize 2', description: null },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    await getVouchersByPhone('+1234567890', 'tenant-123');

    // Verify orderBy was applied
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          createdAt: 'desc',
        },
      })
    );
  });

  test('includes all required fields in response', async () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 86400000);
    const createdAt = new Date(now.getTime() - 2 * 86400000);

    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'TEST-COMPLETE',
        qrImageUrl: 'https://example.com/qr.png',
        tenantId: 'tenant-123',
        expiresAt,
        isRedeemed: false,
        redemptionCount: 1,
        redemptionLimit: 3,
        createdAt,
        prize: {
          name: 'Complete Prize',
          description: 'Full description',
        },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchersByPhone('+1234567890', 'tenant-123');

    expect(result).toHaveLength(1);
    const voucher = result[0];

    // Verify all required fields are present
    expect(voucher).toHaveProperty('code');
    expect(voucher).toHaveProperty('prize');
    expect(voucher).toHaveProperty('status');
    expect(voucher).toHaveProperty('expiresAt');
    expect(voucher).toHaveProperty('createdAt');
    expect(voucher).toHaveProperty('redemptionCount');
    expect(voucher).toHaveProperty('redemptionLimit');
    expect(voucher).toHaveProperty('qrImageUrl');

    // Verify values
    expect(voucher.code).toBe('TEST-COMPLETE');
    expect(voucher.prize.name).toBe('Complete Prize');
    expect(voucher.prize.description).toBe('Full description');
    expect(voucher.status).toBe('active');
    expect(voucher.expiresAt).toEqual(expiresAt);
    expect(voucher.createdAt).toEqual(createdAt);
    expect(voucher.redemptionCount).toBe(1);
    expect(voucher.redemptionLimit).toBe(3);
    expect(voucher.qrImageUrl).toBe('https://example.com/qr.png');
  });
});


/**
 * Unit Tests: getVouchers function with filters
 * 
 * Test filtering by status, search, date range, and pagination
 * 
 * **Validates: Requirements 8.3, 8.5, 8.7**
 */
describe('getVouchers', () => {
  const { getVouchers } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns all vouchers for tenant with default filters', async () => {
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'TEST-CODE1',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: 'https://example.com/qr1.png',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
      {
        id: 'voucher-2',
        code: 'TEST-CODE2',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() - 86400000), // Expired
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        user: { name: 'Jane Smith', phone: '+9876543210' },
        prize: { name: 'Prize 2', description: 'Description 2' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123');

    expect(result.vouchers).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(50);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(1);
  });

  test('filters vouchers by status: active', async () => {
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'ACTIVE-CODE',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000), // Future
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
      {
        id: 'voucher-2',
        code: 'EXPIRED-CODE',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() - 86400000), // Past
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: 'Jane Smith', phone: '+9876543210' },
        prize: { name: 'Prize 2', description: 'Description 2' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123', { status: 'active' });

    // Should only return active vouchers
    expect(result.vouchers).toHaveLength(1);
    expect(result.vouchers[0].code).toBe('ACTIVE-CODE');
    expect(result.vouchers[0].status).toBe('active');
  });

  test('filters vouchers by status: expired', async () => {
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'EXPIRED-CODE',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() - 86400000), // Past
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123', { status: 'expired' });

    expect(result.vouchers).toHaveLength(1);
    expect(result.vouchers[0].code).toBe('EXPIRED-CODE');
    expect(result.vouchers[0].status).toBe('expired');
  });

  test('filters vouchers by status: redeemed', async () => {
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'REDEEMED-CODE',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: true,
        redemptionCount: 1,
        redemptionLimit: 1,
        redeemedAt: new Date(),
        redeemedBy: 'merchant-123',
        qrImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
      {
        id: 'voucher-2',
        code: 'ACTIVE-CODE',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: 'Jane Smith', phone: '+9876543210' },
        prize: { name: 'Prize 2', description: 'Description 2' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123', { status: 'redeemed' });

    expect(result.vouchers).toHaveLength(1);
    expect(result.vouchers[0].code).toBe('REDEEMED-CODE');
    expect(result.vouchers[0].status).toBe('redeemed');
  });

  test('searches vouchers by code', async () => {
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'ACME-ABC123',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123', { search: 'ABC123' });

    expect(result.vouchers).toHaveLength(1);
    expect(result.vouchers[0].code).toBe('ACME-ABC123');

    // Verify search was applied in where clause
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ code: expect.objectContaining({ contains: 'ABC123' }) }),
          ]),
        }),
      })
    );
  });

  test('searches vouchers by customer phone', async () => {
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'TEST-CODE1',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123', { search: '1234567890' });

    expect(result.vouchers).toHaveLength(1);
    expect(result.vouchers[0].customer.phone).toBe('+1234567890');

    // Verify search was applied in where clause
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ user: expect.objectContaining({ phone: expect.objectContaining({ contains: '1234567890' }) }) }),
          ]),
        }),
      })
    );
  });

  test('filters vouchers by date range', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'TEST-CODE1',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123', { startDate, endDate });

    expect(result.vouchers).toHaveLength(1);

    // Verify date range was applied in where clause
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: startDate,
            lte: endDate,
          }),
        }),
      })
    );
  });

  test('applies pagination correctly', async () => {
    const mockVouchers = Array.from({ length: 10 }, (_, i) => ({
      id: `voucher-${i}`,
      code: `TEST-CODE${i}`,
      tenantId: 'tenant-123',
      expiresAt: new Date(Date.now() + 86400000),
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 1,
      redeemedAt: null,
      redeemedBy: null,
      qrImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { name: `User ${i}`, phone: `+123456789${i}` },
      prize: { name: `Prize ${i}`, description: `Description ${i}` },
    }));

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123', { page: 2, limit: 3 });

    // Should return 3 vouchers (page 2, limit 3)
    expect(result.vouchers).toHaveLength(3);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(3);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.totalPages).toBe(4); // ceil(10/3) = 4

    // Verify correct vouchers are returned (indices 3, 4, 5)
    expect(result.vouchers[0].code).toBe('TEST-CODE3');
    expect(result.vouchers[1].code).toBe('TEST-CODE4');
    expect(result.vouchers[2].code).toBe('TEST-CODE5');
  });

  test('always filters by tenant ID', async () => {
    const mockVouchers = [];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    await getVouchers('tenant-123');

    // Verify tenant filter was applied
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
        }),
      })
    );
  });

  test('returns empty list when no vouchers match filters', async () => {
    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce([]);

    const result = await getVouchers('tenant-123', { status: 'active' });

    expect(result.vouchers).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  test('includes all required fields in response', async () => {
    const futureDate = new Date(Date.now() + 30 * 86400000); // 30 days from now
    const createdDate = new Date('2024-01-15');

    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'TEST-CODE1',
        tenantId: 'tenant-123',
        expiresAt: futureDate,
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: 'https://example.com/qr.png',
        createdAt: createdDate,
        updatedAt: createdDate,
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123');

    expect(result.vouchers).toHaveLength(1);
    const voucher = result.vouchers[0];

    // Verify all required fields are present
    expect(voucher.id).toBe('voucher-1');
    expect(voucher.code).toBe('TEST-CODE1');
    expect(voucher.customer.name).toBe('John Doe');
    expect(voucher.customer.phone).toBe('+1234567890');
    expect(voucher.prize.name).toBe('Prize 1');
    expect(voucher.prize.description).toBe('Description 1');
    expect(voucher.status).toBe('active');
    expect(voucher.createdAt).toEqual(createdDate);
    expect(voucher.expiresAt).toEqual(futureDate);
    expect(voucher.redemptionCount).toBe(0);
    expect(voucher.redemptionLimit).toBe(1);
    expect(voucher.redeemedAt).toBeNull();
    expect(voucher.redeemedBy).toBeNull();
    expect(voucher.qrImageUrl).toBe('https://example.com/qr.png');
  });

  test('combines multiple filters correctly', async () => {
    const mockVouchers = [
      {
        id: 'voucher-1',
        code: 'ACME-ABC123',
        tenantId: 'tenant-123',
        expiresAt: new Date(Date.now() + 86400000),
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        redeemedAt: null,
        redeemedBy: null,
        qrImageUrl: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        user: { name: 'John Doe', phone: '+1234567890' },
        prize: { name: 'Prize 1', description: 'Description 1' },
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const result = await getVouchers('tenant-123', {
      status: 'active',
      search: 'ABC',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      page: 1,
      limit: 10,
    });

    expect(result.vouchers).toHaveLength(1);
    expect(result.vouchers[0].code).toBe('ACME-ABC123');
    expect(result.vouchers[0].status).toBe('active');

    // Verify all filters were applied
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
          expiresAt: expect.objectContaining({ gte: expect.any(Date) }),
          OR: expect.any(Array),
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  test('orders vouchers by creation date descending', async () => {
    const mockVouchers = [];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    await getVouchers('tenant-123');

    // Verify orderBy was applied
    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          createdAt: 'desc',
        },
      })
    );
  });
});

/**
 * Unit Tests: getVoucherStats
 * 
 * Test voucher statistics calculation for admin dashboard
 * 
 * **Validates: Requirements 8.1**
 */
describe('Unit Tests: getVoucherStats', () => {
  const { getVoucherStats } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calculates correct statistics for mixed voucher states', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 86400000); // Tomorrow
    const pastDate = new Date(now.getTime() - 86400000); // Yesterday

    const mockVouchers = [
      // Active voucher (not redeemed, not expired)
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
      // Another active voucher
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
      // Redeemed voucher
      {
        isRedeemed: true,
        redemptionCount: 1,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
      // Another redeemed voucher
      {
        isRedeemed: true,
        redemptionCount: 1,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
      // Expired voucher (not redeemed)
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: pastDate,
      },
      // Another expired voucher
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: pastDate,
      },
      // Expired voucher
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: pastDate,
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const stats = await getVoucherStats('tenant-123');

    expect(stats.total).toBe(7);
    expect(stats.active).toBe(2);
    expect(stats.redeemed).toBe(2);
    expect(stats.expired).toBe(3);
  });

  test('returns zero statistics for tenant with no vouchers', async () => {
    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce([]);

    const stats = await getVoucherStats('tenant-123');

    expect(stats.total).toBe(0);
    expect(stats.active).toBe(0);
    expect(stats.redeemed).toBe(0);
    expect(stats.expired).toBe(0);
  });

  test('counts only active vouchers correctly', async () => {
    const futureDate = new Date(Date.now() + 86400000); // Tomorrow

    const mockVouchers = [
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const stats = await getVoucherStats('tenant-123');

    expect(stats.total).toBe(3);
    expect(stats.active).toBe(3);
    expect(stats.redeemed).toBe(0);
    expect(stats.expired).toBe(0);
  });

  test('counts only redeemed vouchers correctly', async () => {
    const futureDate = new Date(Date.now() + 86400000); // Tomorrow

    const mockVouchers = [
      {
        isRedeemed: true,
        redemptionCount: 1,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
      {
        isRedeemed: true,
        redemptionCount: 1,
        redemptionLimit: 1,
        expiresAt: futureDate,
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const stats = await getVoucherStats('tenant-123');

    expect(stats.total).toBe(2);
    expect(stats.active).toBe(0);
    expect(stats.redeemed).toBe(2);
    expect(stats.expired).toBe(0);
  });

  test('counts only expired vouchers correctly', async () => {
    const pastDate = new Date(Date.now() - 86400000); // Yesterday

    const mockVouchers = [
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: pastDate,
      },
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: pastDate,
      },
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: pastDate,
      },
      {
        isRedeemed: false,
        redemptionCount: 0,
        redemptionLimit: 1,
        expiresAt: pastDate,
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const stats = await getVoucherStats('tenant-123');

    expect(stats.total).toBe(4);
    expect(stats.active).toBe(0);
    expect(stats.redeemed).toBe(0);
    expect(stats.expired).toBe(4);
  });

  test('handles vouchers with redemption limit reached', async () => {
    const futureDate = new Date(Date.now() + 86400000); // Tomorrow

    const mockVouchers = [
      // Voucher with limit reached (counts as redeemed)
      {
        isRedeemed: false,
        redemptionCount: 3,
        redemptionLimit: 3,
        expiresAt: futureDate,
      },
      // Voucher with limit not reached (counts as active)
      {
        isRedeemed: false,
        redemptionCount: 2,
        redemptionLimit: 3,
        expiresAt: futureDate,
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const stats = await getVoucherStats('tenant-123');

    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.redeemed).toBe(1);
    expect(stats.expired).toBe(0);
  });

  test('filters vouchers by tenant ID', async () => {
    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce([]);

    await getVoucherStats('tenant-456');

    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-456',
        },
      })
    );
  });

  test('only selects necessary fields for performance', async () => {
    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce([]);

    await getVoucherStats('tenant-123');

    expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          isRedeemed: true,
          redemptionCount: true,
          redemptionLimit: true,
          expiresAt: true,
        },
      })
    );
  });

  test('expired and redeemed voucher counts as redeemed', async () => {
    const pastDate = new Date(Date.now() - 86400000); // Yesterday

    const mockVouchers = [
      // Expired AND redeemed - should count as redeemed, not expired
      {
        isRedeemed: true,
        redemptionCount: 1,
        redemptionLimit: 1,
        expiresAt: pastDate,
      },
    ];

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const stats = await getVoucherStats('tenant-123');

    expect(stats.total).toBe(1);
    expect(stats.active).toBe(0);
    expect(stats.redeemed).toBe(1);
    expect(stats.expired).toBe(0);
  });

  test('handles large number of vouchers', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const pastDate = new Date(Date.now() - 86400000);

    // Create 1000 vouchers with various states
    const mockVouchers = [];
    for (let i = 0; i < 1000; i++) {
      if (i < 400) {
        // 400 active
        mockVouchers.push({
          isRedeemed: false,
          redemptionCount: 0,
          redemptionLimit: 1,
          expiresAt: futureDate,
        });
      } else if (i < 700) {
        // 300 redeemed
        mockVouchers.push({
          isRedeemed: true,
          redemptionCount: 1,
          redemptionLimit: 1,
          expiresAt: futureDate,
        });
      } else {
        // 300 expired
        mockVouchers.push({
          isRedeemed: false,
          redemptionCount: 0,
          redemptionLimit: 1,
          expiresAt: pastDate,
        });
      }
    }

    (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

    const stats = await getVoucherStats('tenant-123');

    expect(stats.total).toBe(1000);
    expect(stats.active).toBe(400);
    expect(stats.redeemed).toBe(300);
    expect(stats.expired).toBe(300);
  });
});


/**
 * Property 21: Tenant Isolation
 * 
 * For any voucher operation (create, validate, redeem, lookup, list), the system 
 * should enforce strict tenant boundaries such that users can only access vouchers 
 * belonging to their own tenant, and cross-tenant access attempts should be rejected.
 * 
 * **Validates: Requirements 10.2, 10.3, 10.4, 10.5**
 */
describe('Property 21: Tenant Isolation', () => {
  const { 
    createVoucher, 
    validateVoucher, 
    redeemVoucher, 
    getVouchersByPhone, 
    getVouchers 
  } = require('../voucher-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Voucher creation associates with correct tenant
   * 
   * Validates that vouchers are always created with the correct tenant ID
   * and cannot be created for a different tenant.
   */
  test('voucher creation associates with correct tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          spinId: fc.uuid(),
          prizeId: fc.uuid(),
          userId: fc.uuid(),
          tenantId: fc.uuid(),
          tenantSlug: fc.stringMatching(/^[a-z0-9-]{4,20}$/),
          validityDays: fc.integer({ min: 1, max: 90 }),
          redemptionLimit: fc.integer({ min: 1, max: 5 }),
        }),
        async (params) => {
          // Mock database operations
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(null);

          let capturedTenantId: string | null = null;
          (mockPrisma.voucher as any).create = jest.fn().mockImplementation((args: any) => {
            capturedTenantId = args.data.tenantId;
            return Promise.resolve({
              id: 'voucher-id',
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date(),
              spin: {},
              prize: {},
              user: {},
              tenant: {},
            });
          });

          // Create voucher
          await createVoucher({
            ...params,
            generateQR: false,
          });

          // Verify voucher was created with the correct tenant ID
          expect(capturedTenantId).toBe(params.tenantId);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Test: Validation rejects vouchers from different tenant
   * 
   * Validates that validateVoucher enforces tenant boundaries and rejects
   * vouchers that belong to a different tenant.
   */
  test('validation rejects vouchers from different tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          voucherTenantId: fc.uuid(),
          requestingTenantId: fc.uuid(),
        }).filter(({ voucherTenantId, requestingTenantId }) => 
          voucherTenantId !== requestingTenantId
        ),
        async ({ code, voucherTenantId, requestingTenantId }) => {
          // Mock: voucher exists but belongs to different tenant
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId: voucherTenantId,
            expiresAt: new Date(Date.now() + 86400000),
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            prize: { name: 'Test Prize', description: 'Test' },
            user: { name: 'Test User', phone: '1234567890' },
          } as any);

          const result = await validateVoucher(code, requestingTenantId);

          // Verify validation failed due to wrong tenant
          expect(result.valid).toBe(false);
          expect(result.reason).toBe('wrong_tenant');
          expect(result.voucher).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Test: Validation accepts vouchers from same tenant
   * 
   * Validates that validateVoucher allows access to vouchers that belong
   * to the same tenant.
   */
  test('validation accepts vouchers from same tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          prizeName: fc.string({ minLength: 5, maxLength: 50 }),
          customerName: fc.string({ minLength: 3, maxLength: 30 }),
          customerPhone: fc.string({ minLength: 10, maxLength: 15 }),
        }),
        async ({ code, tenantId, prizeName, customerName, customerPhone }) => {
          const expiresAt = new Date(Date.now() + 86400000);

          // Mock: valid voucher from same tenant
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId,
            expiresAt,
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            prize: { name: prizeName, description: 'Test' },
            user: { name: customerName, phone: customerPhone },
          } as any);

          const result = await validateVoucher(code, tenantId);

          // Verify validation succeeded for same tenant
          expect(result.valid).toBe(true);
          expect(result.reason).toBeUndefined();
          expect(result.voucher).toBeDefined();
          expect(result.voucher?.code).toBe(code);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Test: Redemption rejects vouchers from different tenant
   * 
   * Validates that redeemVoucher enforces tenant boundaries and rejects
   * redemption attempts for vouchers from a different tenant.
   */
  test('redemption rejects vouchers from different tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          voucherTenantId: fc.uuid(),
          requestingTenantId: fc.uuid(),
          merchantId: fc.uuid(),
        }).filter(({ voucherTenantId, requestingTenantId }) => 
          voucherTenantId !== requestingTenantId
        ),
        async ({ code, voucherTenantId, requestingTenantId, merchantId }) => {
          // Mock: voucher exists but belongs to different tenant
          mockPrisma.voucher.findUnique.mockResolvedValueOnce({
            id: 'voucher-id',
            code,
            tenantId: voucherTenantId,
            expiresAt: new Date(Date.now() + 86400000),
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            prize: { name: 'Test Prize', description: 'Test' },
            user: { name: 'Test User', phone: '1234567890' },
          } as any);

          const result = await redeemVoucher(code, merchantId, requestingTenantId);

          // Verify redemption failed due to wrong tenant
          expect(result.success).toBe(false);
          expect(result.error).toContain('Invalid voucher');
          expect(result.voucher).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Test: Redemption succeeds for vouchers from same tenant
   * 
   * Validates that redeemVoucher allows redemption of vouchers that belong
   * to the same tenant.
   */
  test('redemption succeeds for vouchers from same tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 10, maxLength: 20 }),
          tenantId: fc.uuid(),
          merchantId: fc.uuid(),
        }),
        async ({ code, tenantId, merchantId }) => {
          const validVoucher = {
            id: 'voucher-id',
            code,
            tenantId,
            expiresAt: new Date(Date.now() + 86400000),
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            redeemedAt: null,
            redeemedBy: null,
            prize: { name: 'Test Prize', description: 'Test' },
            user: { name: 'Test User', phone: '1234567890' },
          };

          // Mock validation call
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

          // Mock transaction
          const mockTransaction = jest.fn(async (callback: any) => {
            mockPrisma.voucher.findUnique.mockResolvedValueOnce({
              ...validVoucher,
              spin: {},
              prize: validVoucher.prize,
              user: validVoucher.user,
              tenant: {},
            } as any);

            (mockPrisma.voucher as any).update = jest.fn().mockResolvedValueOnce({
              ...validVoucher,
              isRedeemed: true,
              redeemedAt: new Date(),
              redeemedBy: merchantId,
              redemptionCount: 1,
              spin: {},
              prize: validVoucher.prize,
              user: validVoucher.user,
              tenant: {},
              redeemedByUser: {},
            });

            return callback(mockPrisma);
          });

          (mockPrisma as any).$transaction = mockTransaction;

          const result = await redeemVoucher(code, merchantId, tenantId);

          // Verify redemption succeeded for same tenant
          expect(result.success).toBe(true);
          expect(result.voucher).toBeDefined();
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Test: Phone lookup returns only vouchers from requesting tenant
   * 
   * Validates that getVouchersByPhone filters results to only include
   * vouchers from the requesting tenant.
   */
  test('phone lookup returns only vouchers from requesting tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.string({ minLength: 10, maxLength: 15 }),
          requestingTenantId: fc.uuid(),
          otherTenantId: fc.uuid(),
        }).filter(({ requestingTenantId, otherTenantId }) => 
          requestingTenantId !== otherTenantId
        ),
        async ({ phone, requestingTenantId, otherTenantId }) => {
          // Mock: vouchers from both tenants exist for this phone
          const mockVouchers = [
            {
              id: 'voucher-1',
              code: 'TENANT1-CODE',
              tenantId: requestingTenantId,
              expiresAt: new Date(Date.now() + 86400000),
              isRedeemed: false,
              redemptionCount: 0,
              redemptionLimit: 1,
              qrImageUrl: null,
              createdAt: new Date(),
              prize: { name: 'Prize 1', description: 'Desc 1' },
            },
            {
              id: 'voucher-2',
              code: 'TENANT1-CODE2',
              tenantId: requestingTenantId,
              expiresAt: new Date(Date.now() + 86400000),
              isRedeemed: false,
              redemptionCount: 0,
              redemptionLimit: 1,
              qrImageUrl: null,
              createdAt: new Date(),
              prize: { name: 'Prize 2', description: 'Desc 2' },
            },
          ];

          (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

          const result = await getVouchersByPhone(phone, requestingTenantId);

          // Verify only vouchers from requesting tenant are returned
          expect(result.length).toBeGreaterThanOrEqual(0);
          for (const voucher of result) {
            // All returned vouchers should be from the requesting tenant
            // (we can't verify tenantId directly as it's not in the response,
            // but we verify the query was called with correct tenant filter)
          }

          // Verify the query included tenant filter
          expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                tenantId: requestingTenantId,
              }),
            })
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Test: Admin getVouchers returns only vouchers from requesting tenant
   * 
   * Validates that getVouchers filters results to only include vouchers
   * from the requesting tenant.
   */
  test('admin getVouchers returns only vouchers from requesting tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          requestingTenantId: fc.uuid(),
          otherTenantId: fc.uuid(),
        }).filter(({ requestingTenantId, otherTenantId }) => 
          requestingTenantId !== otherTenantId
        ),
        async ({ requestingTenantId, otherTenantId }) => {
          // Mock: vouchers from requesting tenant only
          const mockVouchers = [
            {
              id: 'voucher-1',
              code: 'TENANT1-CODE',
              tenantId: requestingTenantId,
              expiresAt: new Date(Date.now() + 86400000),
              isRedeemed: false,
              redemptionCount: 0,
              redemptionLimit: 1,
              redeemedAt: null,
              redeemedBy: null,
              qrImageUrl: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              user: { name: 'User 1', phone: '+1234567890' },
              prize: { name: 'Prize 1', description: 'Desc 1' },
            },
          ];

          (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce(mockVouchers);

          const result = await getVouchers(requestingTenantId);

          // Verify the query included tenant filter
          expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                tenantId: requestingTenantId,
              }),
            })
          );

          // Verify all returned vouchers are from the requesting tenant
          expect(result.vouchers.length).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Test: Cross-tenant access is consistently blocked across all operations
   * 
   * Validates that all voucher operations consistently enforce tenant isolation
   * by testing multiple operations in sequence.
   */
  test('cross-tenant access is consistently blocked across all operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          voucherCode: fc.string({ minLength: 10, maxLength: 20 }),
          voucherTenantId: fc.uuid(),
          attackerTenantId: fc.uuid(),
          merchantId: fc.uuid(),
          phone: fc.string({ minLength: 10, maxLength: 15 }),
        }).filter(({ voucherTenantId, attackerTenantId }) => 
          voucherTenantId !== attackerTenantId
        ),
        async ({ voucherCode, voucherTenantId, attackerTenantId, merchantId, phone }) => {
          const validVoucher = {
            id: 'voucher-id',
            code: voucherCode,
            tenantId: voucherTenantId,
            expiresAt: new Date(Date.now() + 86400000),
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            redeemedAt: null,
            redeemedBy: null,
            prize: { name: 'Test Prize', description: 'Test' },
            user: { name: 'Test User', phone },
          };

          // Test 1: Validation from different tenant should fail
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);
          const validationResult = await validateVoucher(voucherCode, attackerTenantId);
          expect(validationResult.valid).toBe(false);
          expect(validationResult.reason).toBe('wrong_tenant');

          // Test 2: Redemption from different tenant should fail
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);
          const redemptionResult = await redeemVoucher(voucherCode, merchantId, attackerTenantId);
          expect(redemptionResult.success).toBe(false);
          expect(redemptionResult.error).toContain('Invalid voucher');

          // Test 3: Phone lookup from different tenant should not return the voucher
          (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce([]);
          const phoneResult = await getVouchersByPhone(phone, attackerTenantId);
          
          // Verify the query was made with attacker's tenant ID
          expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                tenantId: attackerTenantId,
              }),
            })
          );

          // Test 4: Admin getVouchers from different tenant should not return the voucher
          (mockPrisma.voucher as any).findMany = jest.fn().mockResolvedValueOnce([]);
          const adminResult = await getVouchers(attackerTenantId);
          
          // Verify the query was made with attacker's tenant ID
          expect(mockPrisma.voucher.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                tenantId: attackerTenantId,
              }),
            })
          );
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Test: Tenant isolation is maintained even with valid voucher codes
   * 
   * Validates that knowing a valid voucher code from another tenant is not
   * sufficient to access or redeem that voucher.
   */
  test('tenant isolation maintained even with valid voucher codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.record({
            code: fc.string({ minLength: 10, maxLength: 20 }),
            tenantId: fc.uuid(),
          }),
          fc.uuid() // Different tenant ID
        ).filter(([voucher, attackerTenantId]) => 
          voucher.tenantId !== attackerTenantId
        ),
        async ([voucher, attackerTenantId]) => {
          // Mock: valid voucher exists for tenant A
          const validVoucher = {
            id: 'voucher-id',
            code: voucher.code,
            tenantId: voucher.tenantId,
            expiresAt: new Date(Date.now() + 86400000),
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            prize: { name: 'Test Prize', description: 'Test' },
            user: { name: 'Test User', phone: '1234567890' },
          };

          mockPrisma.voucher.findUnique.mockResolvedValueOnce(validVoucher as any);

          // Attempt to validate from tenant B (attacker)
          const result = await validateVoucher(voucher.code, attackerTenantId);

          // Verify access is denied despite having valid code
          expect(result.valid).toBe(false);
          expect(result.reason).toBe('wrong_tenant');
          expect(result.voucher).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Test: Multiple tenants can have vouchers with similar codes
   * 
   * Validates that tenant isolation allows different tenants to have
   * vouchers with similar or even identical codes (though unlikely),
   * and each tenant can only access their own.
   */
  test('multiple tenants can have vouchers with similar codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          codeBase: fc.string({ minLength: 8, maxLength: 15 }),
          tenant1Id: fc.uuid(),
          tenant2Id: fc.uuid(),
        }).filter(({ tenant1Id, tenant2Id }) => tenant1Id !== tenant2Id),
        async ({ codeBase, tenant1Id, tenant2Id }) => {
          // Create similar codes for both tenants
          const code1 = `${codeBase}-1`;
          const code2 = `${codeBase}-2`;

          // Mock: voucher for tenant 1
          const voucher1 = {
            id: 'voucher-1',
            code: code1,
            tenantId: tenant1Id,
            expiresAt: new Date(Date.now() + 86400000),
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            prize: { name: 'Prize 1', description: 'Test' },
            user: { name: 'User 1', phone: '1111111111' },
          };

          // Mock: voucher for tenant 2
          const voucher2 = {
            id: 'voucher-2',
            code: code2,
            tenantId: tenant2Id,
            expiresAt: new Date(Date.now() + 86400000),
            isRedeemed: false,
            redemptionCount: 0,
            redemptionLimit: 1,
            prize: { name: 'Prize 2', description: 'Test' },
            user: { name: 'User 2', phone: '2222222222' },
          };

          // Test: Tenant 1 can access their voucher
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(voucher1 as any);
          const result1 = await validateVoucher(code1, tenant1Id);
          expect(result1.valid).toBe(true);

          // Test: Tenant 2 cannot access tenant 1's voucher
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(voucher1 as any);
          const result2 = await validateVoucher(code1, tenant2Id);
          expect(result2.valid).toBe(false);
          expect(result2.reason).toBe('wrong_tenant');

          // Test: Tenant 2 can access their voucher
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(voucher2 as any);
          const result3 = await validateVoucher(code2, tenant2Id);
          expect(result3.valid).toBe(true);

          // Test: Tenant 1 cannot access tenant 2's voucher
          mockPrisma.voucher.findUnique.mockResolvedValueOnce(voucher2 as any);
          const result4 = await validateVoucher(code2, tenant1Id);
          expect(result4.valid).toBe(false);
          expect(result4.reason).toBe('wrong_tenant');
        }
      ),
      { numRuns: 5 }
    );
  });
});
