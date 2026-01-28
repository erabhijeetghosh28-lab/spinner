# Step 2: Voucher Service Implementation

**Time Estimate:** 2 hours  
**Difficulty:** Medium  
**File to Create:** `lib/voucherService.ts`

---

## Step 2.1: Install Dependencies

```bash
npm install nanoid qrcode
npm install --save-dev @types/qrcode
```

---

## Step 2.2: Create `lib/voucherService.ts`

Create a new file at `lib/voucherService.ts` with this complete implementation:

```typescript
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import prisma from './prisma';
import { format } from 'date-fns';
import { Prisma } from '@prisma/client';

// ============================================
// VOUCHER CODE GENERATION
// ============================================

/**
 * Generates a unique voucher code
 * Format: TENT-XXXXXXXX (TENT = first 4 chars of tenant slug)
 */
export async function generateVoucherCode(tenantSlug: string): Promise<string> {
  const prefix = tenantSlug.substring(0, 4).toUpperCase().padEnd(4, 'X');
  const randomPart = nanoid(8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

// ============================================
// QR CODE GENERATION
// ============================================

/**
 * Generates a QR code image as PNG buffer
 * @param code - Voucher code to encode
 * @returns PNG image buffer (400x400px)
 */
export async function generateQRImage(code: string): Promise<Buffer> {
  return await QRCode.toBuffer(code, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    type: 'png'
  });
}

/**
 * Uploads QR code image to storage
 * @param buffer - PNG image buffer
 * @param voucherId - Voucher ID for filename
 * @returns Public URL of uploaded image
 */
export async function uploadQRImage(buffer: Buffer, voucherId: string): Promise<string> {
  // TODO: Implement using your UploadThing setup
  // For now, return placeholder
  // In production, use uploadthing or your cloud storage
  
  // Example placeholder implementation:
  // const { uploadFiles } = await import('@/lib/uploadthing');
  // const file = new File([buffer], `voucher-${voucherId}.png`, { type: 'image/png' });
  // const result = await uploadFiles([file]);
  // return result[0].url;
  
  // TEMPORARY: Return a placeholder URL
  console.warn('QR upload not implemented yet. Using placeholder URL.');
  return `https://placeholder.com/qr/${voucherId}.png`;
}

// ============================================
// VOUCHER CREATION
// ============================================

/**
 * Creates a complete voucher record
 * @param spin - Spin record (includes spinId, campaignId, prizeId)
 * @param prize - Prize record (includes validity days, redemption limit, sendQRCode flag)
 * @param user - EndUser record (includes userId, tenantId, tenant)
 * @returns Created voucher with QR URL if applicable
 */
export async function createVoucher(
  spin: any,
  prize: any,
  user: any
) {
  // Step 1: Generate unique code with collision check
  let code = await generateVoucherCode(user.tenant.slug);
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const existing = await prisma.voucher.findUnique({ where: { code } });
    if (!existing) break;
    
    code = await generateVoucherCode(user.tenant.slug);
    attempts++;
  }
  
  if (attempts === maxAttempts) {
    throw new Error('Failed to generate unique voucher code after 10 attempts');
  }
  
  // Step 2: Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (prize.voucherValidityDays || 30));
  
  // Step 3: Create voucher record
  const voucher = await prisma.voucher.create({
    data: {
      code,
      spinId: spin.id,
      prizeId: prize.id,
      userId: user.id,
      tenantId: user.tenantId,
      expiresAt,
      redemptionLimit: prize.voucherRedemptionLimit || 1,
      redemptionCount: 0,
      isRedeemed: false
    }
  });
  
  // Step 4: Generate and upload QR if enabled
  let qrImageUrl = null;
  if (prize.sendQRCode) {
    try {
      const qrBuffer = await generateQRImage(code);
      qrImageUrl = await uploadQRImage(qrBuffer, voucher.id);
      
      // Update voucher with QR URL
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { qrImageUrl }
      });
    } catch (error) {
      console.error('Failed to generate/upload QR code:', error);
      // Continue without QR - customer still gets text code
    }
  }
  
  return { ...voucher, qrImageUrl };
}

// ============================================
// VOUCHER VALIDATION
// ============================================

/**
 * Validates a voucher code
 * @param code - Voucher code to validate
 * @param tenantId - Tenant ID making the request (for security)
 * @returns Validation result with voucher data if found
 */
export async function validateVoucher(code: string, tenantId: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: {
      prize: true,
      user: true,
      tenant: true
    }
  });
  
  // Not found
  if (!voucher) {
    return {
      valid: false,
      reason: 'not_found',
      message: 'Voucher not found'
    };
  }
  
  // Tenant isolation check
  if (voucher.tenantId !== tenantId) {
    return {
      valid: false,
      reason: 'unauthorized',
      message: 'Invalid voucher'
    };
  }
  
  // Expired check
  if (voucher.expiresAt < new Date()) {
    return {
      valid: false,
      reason: 'expired',
      message: `Expired on ${format(voucher.expiresAt, 'dd MMM yyyy')}`,
      voucher // Still return voucher data for display
    };
  }
  
  // Already used check
  if (voucher.redemptionCount >= voucher.redemptionLimit) {
    return {
      valid: false,
      reason: 'already_used',
      message: voucher.redeemedAt
        ? `Already redeemed on ${format(voucher.redeemedAt, 'dd MMM yyyy')}`
        : 'Voucher has been used',
      voucher
    };
  }
  
  // Valid!
  return {
    valid: true,
    voucher
  };
}

// ============================================
// PHONE NUMBER LOOKUP
// ============================================

/**
 * Gets all vouchers for a customer by phone number
 * @param phone - Customer phone number
 * @param tenantId - Tenant ID (for security)
 * @returns User and their vouchers
 */
export async function getVouchersByPhone(phone: string, tenantId: string) {
  const user = await prisma.endUser.findUnique({
    where: {
      tenantId_phone: {
        tenantId,
        phone
      }
    },
    include: {
      vouchers: {
        include: { prize: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  
  if (!user) {
    return {
      found: false,
      message: 'Customer not found with this phone number'
    };
  }
  
  return {
    found: true,
    user,
    vouchers: user.vouchers
  };
}

// ============================================
// VOUCHER REDEMPTION
// ============================================

/**
 * Redeems a voucher (marks as used)
 * @param code - Voucher code
 * @param tenantId - Tenant ID (for security)
 * @param redeemedBy - Name/ID of staff who redeemed
 * @returns Updated voucher record
 */
export async function redeemVoucher(
  code: string,
  tenantId: string,
  redeemedBy: string
) {
  // First validate
  const validation = await validateVoucher(code, tenantId);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  
  // Atomic update to prevent race conditions
  try {
    const voucher = await prisma.voucher.update({
      where: { code },
      data: {
        redemptionCount: { increment: 1 },
        redeemedAt: new Date(),
        redeemedBy,
        isRedeemed: true
      },
      include: {
        prize: true,
        user: true
      }
    });
    
    return voucher;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Voucher not found or already redeemed');
      }
    }
    throw error;
  }
}
```

---

## Step 2.3: Understanding the Code

### Key Functions

**1. `generateVoucherCode(tenantSlug)`**
- Creates unique codes like `DEMO-XY7K9L2M`
- First 4 chars = tenant identifier
- Last 8 chars = random alphanumeric

**2. `generateQRImage(code)`**
- Creates 400x400px PNG
- Encodes voucher code
- Returns Buffer

**3. `createVoucher(spin, prize, user)`**
- Main function called after prize win
- Handles code generation, QR creation, upload
- Returns voucher with QR URL

**4. `validateVoucher(code, tenantId)`**
- Checks if voucher is valid
- Returns detailed status (valid/expired/used/not found)
- Always includes voucher data for display

**5. `getVouchersByPhone(phone, tenantId)`**
- Finds customer by phone
- Returns all their vouchers
- Used for phone lookup feature

**6. `redeemVoucher(code, tenantId, redeemedBy)`**
- Marks voucher as used
- Atomic update prevents double redemption
- Returns updated voucher

---

## Step 2.4: Testing

Create a test file `lib/__tests__/voucherService.test.ts` (optional but recommended):

```typescript
import { generateVoucherCode, validateVoucher } from '../voucherService';

describe('Voucher Service', () => {
  test('generates unique codes', async () => {
    const code1 = await generateVoucherCode('demo');
    const code2 = await generateVoucherCode('demo');
    expect(code1).not.toBe(code2);
    expect(code1).toMatch(/^DEMO-[A-Z0-9]{8}$/);
  });
  
  // Add more tests...
});
```

---

## ✅ Step 2 Complete!

You should now have:
- ✅ `lib/voucherService.ts` created
- ✅ All voucher functions implemented
- ✅ QR code generation working
- ✅ Validation logic ready

**Next:** Proceed to `STEP_3_WHATSAPP.md`
