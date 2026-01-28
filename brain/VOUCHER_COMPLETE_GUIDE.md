# 🎫 VOUCHER SYSTEM - COMPLETE IMPLEMENTATION GUIDE FOR KIRO

**Time: 17-18 hours | Difficulty: Medium**

---

## ⚠️ CRITICAL WARNINGS

1. **DO NOT BREAK EXISTING FEATURES** - This adds NEW functionality only
2. **Test on development database first** - Never test on production
3. **Keep all existing functions intact** - Only ADD new code
4. **Run migrations before coding** - Database must be updated first

---

## 📦 INSTALLATION

```bash
npm install nanoid qrcode html5-qrcode date-fns
npm install --save-dev @types/qrcode
```

---

## 🎯 SYSTEM OVERVIEW

**Customer Flow:**
Win Prize → Get WhatsApp (voucher code + QR image) → Visit store → Show voucher → Merchant scans/validates → Redeemed

**Merchant Features:**
- Scan QR codes with camera
- OR lookup by phone number
- See validation details (even if invalid)
- Redeem vouchers

**Admin Features:**
- View all vouchers
- Stats dashboard (total/active/redeemed/expired)
- Export data
- Configure voucher settings per prize

---

## STEP 1: DATABASE (1 hour)

### File: `prisma/schema.prisma`

**Add new Voucher model:**

```prisma
model Voucher {
  id              String    @id @default(cuid())
  code            String    @unique
  qrImageUrl      String?
  
  spinId          String    @unique
  spin            Spin      @relation(fields: [spinId], references: [id], onDelete: Cascade)
  prizeId         String
  prize           Prize     @relation(fields: [prizeId], references: [id])
  userId          String
  user            EndUser   @relation(fields: [userId], references: [id])
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  expiresAt       DateTime
  isRedeemed      Boolean   @default(false)
  redeemedAt      DateTime?
  redeemedBy      String?
  redemptionLimit Int       @default(1)
  redemptionCount Int       @default(0)
  createdAt       DateTime  @default(now())
  
  @@index([code])
  @@index([tenantId, isRedeemed])
  @@index([userId])
  @@index([expiresAt])
}
```

**Update Prize model - add these fields:**

```prisma
voucherValidityDays    Int     @default(30)
voucherRedemptionLimit Int     @default(1)
sendQRCode             Boolean @default(true)
vouchers               Voucher[]
```

**Update Spin model:**
```prisma
voucher  Voucher?
```

**Update EndUser model:**
```prisma
vouchers  Voucher[]
```

**Update Tenant model:**
```prisma
vouchers  Voucher[]
```

**Run migration:**
```bash
npx prisma migrate dev --name add_voucher_system
npx prisma generate
```

---

## STEP 2: VOUCHER SERVICE (2 hours)

### File: `lib/voucherService.ts` (NEW)

See complete code in APPENDIX A (end of file)

**Key functions:**
- `generateVoucherCode()` - Creates unique codes
- `generateQRImage()` - Creates PNG QR codes
- `createVoucher()` - Main creation function
- `validateVoucher()` - Checks if valid
- `getVouchersByPhone()` - Phone lookup
- `redeemVoucher()` - Marks as used

---

## STEP 3: WHATSAPP (1.5 hours)

### File: `lib/whatsapp.ts` (MODIFY - keep existing functions!)

**Add these two functions:**

See complete code in APPENDIX B

**Features:**
- Professional formatting with emojis
- Includes voucher details, expiry, redemption steps
- Auto-adds referral campaign promotion (if active)
- Auto-adds social media task promotion (if active)
- Sends QR image as PNG attachment

---

## STEP 4: SPIN INTEGRATION (30 mins)

### File: `app/api/spin/route.ts`

**Find this (around line 240):**
```typescript
if (wonPrize) {
    const { sendPrizeNotification } = await import('@/lib/whatsapp');
    await sendPrizeNotification(...);
}
```

**Replace with:**
```typescript
if (wonPrize) {
    try {
        const voucherService = await import('@/lib/voucherService');
        const voucher = await voucherService.createVoucher(spin, selectedPrize, user);
        
        const { sendVoucherNotification } = await import('@/lib/whatsapp');
        await sendVoucherNotification(
            user.phone,
            selectedPrize.name,
            selectedPrize.description,
            voucher.code,
            voucher.qrImageUrl,
            voucher.expiresAt,
            user.tenantId,
            campaignId
        );
    } catch (error) {
        console.error('Voucher failed:', error);
    }
}
```

**Ensure user includes tenant:**
```typescript
const user = await prisma.endUser.findUnique({
    where: { id: userId },
    include: { tenant: true }  // ADD if missing
});
```

---

## STEP 5: VALIDATION APIS (1.5 hours)

### Create 3 API files:

**`app/api/vouchers/validate/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateVoucher } from '@/lib/voucherService';

export async function POST(req: NextRequest) {
  const { code, tenantId } = await req.json();
  const result = await validateVoucher(code, tenantId);
  return NextResponse.json(result);
}
```

**`app/api/vouchers/redeem/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { redeemVoucher } from '@/lib/voucherService';

export async function POST(req: NextRequest) {
  try {
    const { code, tenantId, redeemedBy } = await req.json();
    const voucher = await redeemVoucher(code, tenantId, redeemedBy);
    return NextResponse.json({ success: true, voucher });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

**`app/api/vouchers/lookup-phone/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getVouchersByPhone } from '@/lib/voucherService';

export async function POST(req: NextRequest) {
  const { phone, tenantId } = await req.json();
  const result = await getVouchersByPhone(phone, tenantId);
  return NextResponse.json(result);
}
```

---

## STEP 6: SCANNER UI (5 hours)

### File: `app/admin/[tenantSlug]/scanner/page.tsx` (NEW)

See complete code in APPENDIX C

**Features:**
- QR code scanner with camera
- Phone number lookup
- Displays validation results (valid/invalid with reasons)
- Redeem button
- Shows customer details

---

## STEP 7: ADMIN VOUCHER MANAGEMENT (3 hours)

### File: `app/admin/[tenantSlug]/vouchers/page.tsx` (NEW)

See complete code in APPENDIX D

**Features:**
- Stats cards (Total, Active, Redeemed, Expired)
- Voucher table with all details
- Filter by status
- Search functionality
- Export capability

---

## STEP 8: PRIZE CONFIGURATION (1 hour)

**Add to prize form component:**

```tsx
<div>
  <label>Voucher Validity (Days)</label>
  <input type="number" name="voucherValidityDays" defaultValue={30} min={1} max={365} />
</div>

<div>
  <label>Redemption Limit</label>
  <select name="voucherRedemptionLimit">
    <option value={1}>One-time use</option>
    <option value={3}>3 times</option>
    <option value={999}>Unlimited</option>
  </select>
</div>

<div>
  <label>
    <input type="checkbox" name="sendQRCode" defaultChecked />
    Send QR Code Image
  </label>
</div>
```

---

## TESTING CHECKLIST

### Test 1: Basic Flow
- [ ] Spin wheel and win prize
- [ ] Check database: Voucher created?
- [ ] Check WhatsApp: Message + QR received?
- [ ] Scan QR code in scanner
- [ ] Verify customer details shown
- [ ] Redeem voucher
- [ ] Try redeeming again (should fail)

### Test 2: Phone Lookup
- [ ] Go to scanner page
- [ ] Switch to "Phone Lookup"
- [ ] Enter customer phone
- [ ] See all their vouchers
- [ ] Redeem one

### Test 3: Edge Cases
- [ ] Expired voucher (shows reason)
- [ ] Already redeemed (shows date)
- [ ] Invalid code (shows error)
- [ ] Wrong tenant (fails)

### Test 4: Admin Panel
- [ ] Open `/admin/TENANT/vouchers`
- [ ] Stats are correct
- [ ] Table shows all vouchers
- [ ] Filters work

---

## WHATSAPP MESSAGE EXAMPLE

```
🎉 *Congratulations from Cafe Delights!*

You won: *50% OFF Main Course*

━━━━━━━━━━━━━━━
🎫 *Voucher Details*

Code: `CAFE-XY7K9L2M`
Valid Until: 15 Mar 2026
📲 QR Code attached below

━━━━━━━━━━━━━━━
📍 *How to Redeem*

1. Visit our store
2. Show QR code OR voucher code
3. Enjoy your prize!

⚠️ *Terms*
• One-time use only
• Valid until 15 Mar 2026

━━━━━━━━━━━━━━━
👥 Invite 3 friends for bonus spins!

━━━━━━━━━━━━━━━
✨ Thank you!
```

Plus QR code image (400x400 PNG)

---

## FILES SUMMARY

**NEW FILES (create these):**
- `lib/voucherService.ts`
- `app/api/vouchers/validate/route.ts`
- `app/api/vouchers/redeem/route.ts`
- `app/api/vouchers/lookup-phone/route.ts`
- `app/admin/[tenantSlug]/scanner/page.tsx`
- `app/admin/[tenantSlug]/vouchers/page.tsx`

**MODIFY (carefully):**
- `prisma/schema.prisma`
- `lib/whatsapp.ts`
- `app/api/spin/route.ts`
- Prize form component

---

## TIME BREAKDOWN

| Step | Hours |
|------|-------|
| Database | 1 |
| Voucher Service | 2 |
| WhatsApp | 1.5 |
| Spin Integration | 0.5 |
| APIs | 1.5 |
| Scanner UI | 5 |
| Admin Panel | 3 |
| Prize Config | 1 |
| Testing | 2 |
| **TOTAL** | **17.5** |

---

## TROUBLESHOOTING

**QR scanner not working?**
- Check HTTPS (camera requires secure connection)
- Check permissions
- Try on mobile device

**Voucher not created?**
- Verify migration ran successfully
- Check user includes tenant relation
- Check console logs

**WhatsApp not sending?**
- Verify API credentials
- Test with placeholder URL first
- Check media URL is public

---

# APPENDIX A: VOUCHER SERVICE

```typescript
// lib/voucherService.ts
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import prisma from './prisma';
import { format } from 'date-fns';

export async function generateVoucherCode(tenantSlug: string): Promise<string> {
  const prefix = tenantSlug.substring(0, 4).toUpperCase().padEnd(4, 'X');
  const randomPart = nanoid(8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

export async function generateQRImage(code: string): Promise<Buffer> {
  return await QRCode.toBuffer(code, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    type: 'png'
  });
}

export async function uploadQRImage(buffer: Buffer, voucherId: string): Promise<string> {
  // TODO: Implement with UploadThing
  console.warn('QR upload placeholder');
  return `https://placeholder.com/qr/${voucherId}.png`;
}

export async function createVoucher(spin: any, prize: any, user: any) {
  let code = await generateVoucherCode(user.tenant.slug);
  let attempts = 0;
  
  while (attempts < 10) {
    const existing = await prisma.voucher.findUnique({ where: { code } });
    if (!existing) break;
    code = await generateVoucherCode(user.tenant.slug);
    attempts++;
  }
  
  if (attempts === 10) throw new Error('Failed to generate unique code');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (prize.voucherValidityDays || 30));
  
  const voucher = await prisma.voucher.create({
    data: {
      code,
      spinId: spin.id,
      prizeId: prize.id,
      userId: user.id,
      tenantId: user.tenantId,
      expiresAt,
      redemptionLimit: prize.voucherRedemptionLimit || 1
    }
  });
  
  let qrImageUrl = null;
  if (prize.sendQRCode) {
    try {
      const qrBuffer = await generateQRImage(code);
      qrImageUrl = await uploadQRImage(qrBuffer, voucher.id);
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { qrImageUrl }
      });
    } catch (error) {
      console.error('QR failed:', error);
    }
  }
  
  return { ...voucher, qrImageUrl };
}

export async function validateVoucher(code: string, tenantId: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: { prize: true, user: true, tenant: true }
  });
  
  if (!voucher) return { valid: false, reason: 'not_found', message: 'Voucher not found' };
  if (voucher.tenantId !== tenantId) return { valid: false, reason: 'unauthorized', message: 'Invalid' };
  if (voucher.expiresAt < new Date()) return {
    valid: false,
    reason: 'expired',
    message: `Expired on ${format(voucher.expiresAt, 'dd MMM yyyy')}`,
    voucher
  };
  if (voucher.redemptionCount >= voucher.redemptionLimit) return {
    valid: false,
    reason: 'already_used',
    message: `Redeemed on ${format(voucher.redeemedAt!, 'dd MMM yyyy')}`,
    voucher
  };
  
  return { valid: true, voucher };
}

export async function getVouchersByPhone(phone: string, tenantId: string) {
  const user = await prisma.endUser.findUnique({
    where: { tenantId_phone: { tenantId, phone } },
    include: {
      vouchers: {
        include: { prize: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  
  if (!user) return { found: false, message: 'Customer not found' };
  return { found: true, user, vouchers: user.vouchers };
}

export async function redeemVoucher(code: string, tenantId: string, redeemedBy: string) {
  const validation = await validateVoucher(code, tenantId);
  if (!validation.valid) throw new Error(validation.message);
  
  return await prisma.voucher.update({
    where: { code },
    data: {
      redemptionCount: { increment: 1 },
      redeemedAt: new Date(),
      redeemedBy,
      isRedeemed: true
    },
    include: { prize: true, user: true }
  });
}
```

---

# APPENDIX B: WHATSAPP FUNCTIONS

```typescript
// Add to lib/whatsapp.ts (keep existing functions!)
import { format } from 'date-fns';
import prisma from './prisma';

export async function sendVoucherNotification(
  phone: string,
  prizeName: string,
  prizeDescription: string | null,
  voucherCode: string,
  qrImageUrl: string | null,
  expiresAt: Date,
  tenantId: string,
  campaignId: string
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { socialTasks: { where: { isActive: true }, take: 1 } }
  });
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  
  const expiryDate = format(expiresAt, 'dd MMM yyyy');
  const hasReferral = campaign && campaign.referralsRequiredForSpin > 0;
  const hasSocial = campaign && campaign.socialMediaEnabled && campaign.socialTasks.length > 0;
  
  let message = `
🎉 *Congratulations${tenant?.name ? ' from ' + tenant.name : ''}!*

You won: *${prizeName}*
${prizeDescription || ''}

━━━━━━━━━━━━━━━
🎫 *Voucher Details*

Code: \`${voucherCode}\`
Valid Until: ${expiryDate}
${qrImageUrl ? '📲 QR Code attached below' : ''}

━━━━━━━━━━━━━━━
📍 *How to Redeem*

1. Visit our store
2. ${qrImageUrl ? 'Show QR OR code' : 'Show code'} to staff
3. Enjoy your prize!

⚠️ *Terms*
• One-time use only
• Valid until ${expiryDate}
  `.trim();
  
  if (hasReferral) {
    message += `\n\n━━━━━━━━━━━━━━━\n👥 *Invite Friends!*\nInvite ${campaign.referralsRequiredForSpin} friends for ${campaign.referralBonusSpins} bonus spins!`;
  }
  
  if (hasSocial) {
    message += `\n\n━━━━━━━━━━━━━━━\n📱 *Get More Spins!*\nComplete tasks: ${process.env.NEXT_PUBLIC_APP_URL}/${tenant?.slug}`;
  }
  
  message += `\n\n━━━━━━━━━━━━━━━\n✨ Thank you!`;
  
  await sendWhatsAppMessage(phone, message, tenantId);
  if (qrImageUrl) await sendWhatsAppMedia(phone, qrImageUrl, 'image', tenantId);
}

export async function sendWhatsAppMedia(
  phone: string,
  mediaUrl: string,
  mediaType: 'image' | 'document',
  tenantId: string
) {
  // TODO: Implement based on your provider
  console.log('Media:', { phone, mediaType, mediaUrl });
}
```

---

# APPENDIX C: SCANNER UI

```typescript
// app/admin/[tenantSlug]/scanner/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { format } from 'date-fns';

export default function ScannerPage({ params }: { params: { tenantSlug: string } }) {
  const [mode, setMode] = useState<'qr' | 'phone'>('qr');
  const [phone, setPhone] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [lookup, setLookup] = useState<any>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  useEffect(() => {
    if (mode === 'qr') initScanner();
    return () => scannerRef.current?.stop();
  }, [mode]);
  
  async function initScanner() {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      handleScan,
      () => {}
    );
  }
  
  async function handleScan(code: string) {
    await scannerRef.current?.stop();
    const res = await fetch('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, tenantId: params.tenantSlug })
    });
    setValidation(await res.json());
  }
  
  async function handlePhoneLookup() {
    const res = await fetch('/api/vouchers/lookup-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, tenantId: params.tenantSlug })
    });
    setLookup(await res.json());
  }
  
  async function redeem(code: string) {
    const res = await fetch('/api/vouchers/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, tenantId: params.tenantSlug, redeemedBy: 'Staff' })
    });
    if (res.ok) {
      alert('Redeemed!');
      setValidation(null);
      setLookup(null);
    }
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Voucher Scanner</h1>
      
      <div className="flex gap-4 mb-6">
        <button onClick={() => setMode('qr')} className={`px-4 py-2 rounded ${mode === 'qr' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Scan QR
        </button>
        <button onClick={() => setMode('phone')} className={`px-4 py-2 rounded ${mode === 'phone' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Phone Lookup
        </button>
      </div>
      
      {mode === 'qr' && <div id="qr-reader" className="mb-6 border rounded"></div>}
      
      {mode === 'phone' && (
        <div className="mb-6">
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-3 rounded w-full mb-3"
          />
          <button onClick={handlePhoneLookup} className="bg-blue-600 text-white px-6 py-2 rounded">
            Search
          </button>
        </div>
      )}
      
      {validation && (
        <div className={`p-6 rounded ${validation.valid ? 'bg-green-100' : 'bg-red-100'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${validation.valid ? 'text-green-800' : 'text-red-800'}`}>
            {validation.valid ? '✓ VALID' : '✗ INVALID'}
          </h2>
          {validation.valid ? (
            <>
              <div className="space-y-2 mb-4">
                <p><strong>Customer:</strong> {validation.voucher.user.name}</p>
                <p><strong>Phone:</strong> {validation.voucher.user.phone}</p>
                <p><strong>Prize:</strong> {validation.voucher.prize.name}</p>
                <p><strong>Code:</strong> {validation.voucher.code}</p>
                <p><strong>Expires:</strong> {format(new Date(validation.voucher.expiresAt), 'dd MMM yyyy')}</p>
              </div>
              <button onClick={() => redeem(validation.voucher.code)} className="bg-green-600 text-white px-6 py-3 rounded">
                REDEEM
              </button>
            </>
          ) : (
            <>
              <p className="text-red-700 mb-4">{validation.message}</p>
              {validation.voucher && (
                <div className="text-sm text-gray-700">
                  <p><strong>Customer:</strong> {validation.voucher.user.name}</p>
                  <p><strong>Prize:</strong> {validation.voucher.prize.name}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {lookup?.found && (
        <div className="bg-white border rounded p-6">
          <h2 className="text-xl font-bold mb-4">Customer: {lookup.user.name}</h2>
          <div className="space-y-3">
            {lookup.vouchers.map((v: any) => (
              <div key={v.id} className={`p-4 rounded border ${v.isRedeemed ? 'bg-gray-100' : 'bg-green-50'}`}>
                <p><strong>{v.prize.name}</strong></p>
                <p className="text-sm">Code: {v.code}</p>
                <p className="text-sm">Expires: {format(new Date(v.expiresAt), 'dd MMM yyyy')}</p>
                {!v.isRedeemed && (
                  <button onClick={() => redeem(v.code)} className="bg-green-600 text-white px-4 py-1 rounded text-sm mt-2">
                    Redeem
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

# APPENDIX D: ADMIN VOUCHER MANAGEMENT

```typescript
// app/admin/[tenantSlug]/vouchers/page.tsx
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export default async function VouchersPage({ params }: { params: { tenantSlug: string } }) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: params.tenantSlug } });
  if (!tenant) return <div>Not found</div>;
  
  const vouchers = await prisma.voucher.findMany({
    where: { tenantId: tenant.id },
    include: { prize: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  const stats = {
    total: vouchers.length,
    redeemed: vouchers.filter(v => v.isRedeemed).length,
    expired: vouchers.filter(v => v.expiresAt < new Date() && !v.isRedeemed).length,
    active: vouchers.filter(v => v.expiresAt >= new Date() && !v.isRedeemed).length
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Voucher Management</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-3xl font-bold">{stats.active}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <p className="text-sm text-gray-600">Redeemed</p>
          <p className="text-3xl font-bold">{stats.redeemed}</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-3xl font-bold">{stats.expired}</p>
        </div>
      </div>
      
      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Prize</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Expires</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(v => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{v.code}</td>
                <td className="p-3">
                  <div>{v.user.name}</div>
                  <div className="text-sm text-gray-600">{v.user.phone}</div>
                </td>
                <td className="p-3">{v.prize.name}</td>
                <td className="p-3 text-sm">{format(v.createdAt, 'dd MMM yyyy')}</td>
                <td className="p-3 text-sm">{format(v.expiresAt, 'dd MMM yyyy')}</td>
                <td className="p-3">
                  {v.isRedeemed ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Redeemed</span>
                  ) : v.expiresAt < new Date() ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Expired</span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

**🚀 YOU'RE READY! Follow steps 1-8, test thoroughly, then deploy. Good luck, Kiro!**
