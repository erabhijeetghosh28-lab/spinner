# 📖 Voucher System Overview

## What We're Building

A complete voucher management system that allows:
- Customers to receive vouchers after winning prizes
- QR code or text code delivery via WhatsApp
- Merchants to validate and redeem vouchers  
- Phone number lookup for customer vouchers
- Detailed validation status (including why vouchers are invalid)

---

## The Complete User Journey

### Customer Side

**1. Customer Spins the Wheel**
- Opens campaign landing page
- Verifies phone with OTP
- Spins the wheel
- Wins a prize

**2. Voucher Generation (NEW)**
- System creates unique voucher code (e.g., `DEMO-ABC12345`)
- If prize has "Send QR" enabled:
  - Generates QR code image (400x400px PNG)
  - Uploads to cloud storage
  - Gets public URL

**3. WhatsApp Notification (ENHANCED)**

Receives professional message like:

```
🎉 Congratulations from Cafe Delights!

You won: *50% OFF Main Course*

━━━━━━━━━━━━━━━
🎫 Voucher Details

Code: `CAFE-XY7K9L2M`
Valid Until: 15 Mar 2026
📲 QR Code attached below

━━━━━━━━━━━━━━━
📍 How to Redeem

1. Visit our store
2. Show QR code OR voucher code to staff
3. Enjoy your prize!

⚠️ Terms
• One-time use only
• Valid until 15 Mar 2026

━━━━━━━━━━━━━━━
👥 Invite Friends, Earn More Spins!
Invite 3 friends to get 1 bonus spin!

━━━━━━━━━━━━━━━
✨ Thank you for participating!
```

Plus QR image attachment (if enabled)

**4. Customer Uses Voucher**
- Visits merchant store
- Shows QR code or tells voucher code
- Merchant validates & redeems

---

### Merchant Side

**Scanner Page** (`/admin/[tenantSlug]/scanner`)

Two validation modes:

**Mode 1: QR Scanner**
```
┌─────────────────────────┐
│  📷 Camera Preview      │
│  [Scanning QR Code...]  │
└─────────────────────────┘

👇 Point camera at QR
```

**Mode 2: Phone Lookup**
```
┌─────────────────────────┐
│  Enter Phone Number:    │
│  [+91__________]        │
│  [Search Button]        │
└─────────────────────────┘
```

**Validation Results**

**✅ Valid Voucher (Green Card)**
```
┌─────────────────────────────────┐
│ ✓ VALID VOUCHER                 │
│                                  │
│ Customer: Rajesh Kumar          │
│ Phone: +91-9876543210           │
│ Prize: 50% OFF Dinner           │
│ Code: DEMO-ABC123               │
│ Expires: 28 Feb 2026            │
│                                  │
│ [REDEEM VOUCHER] ←  BIG BUTTON │
└─────────────────────────────────┘
```

**❌ Invalid Voucher (Red Card)**
```
┌─────────────────────────────────┐
│ ✗ INVALID VOUCHER               │
│                                  │
│ Expired on 15 Jan 2026          │
│                                  │
│ Customer: Priya Sharma          │
│ Prize: Free Dessert             │
│ Code: DEMO-XYZ789               │
│                                  │
│ [Close]                         │
└─────────────────────────────────┘
```

---

## Database Architecture

### New Tables

**Voucher** (Core table)
```
id              - Unique ID
code            - Voucher code (unique, indexed)
qrImageUrl      - URL to QR image (nullable)
spinId          - Link to spin record
prizeId         - Link to prize
userId          - Link to customer
tenantId        - Link to tenant
expiresAt       - Expiration date
isRedeemed      - Boolean flag
redeemedAt      - Timestamp (nullable)
redeemedBy      - Staff name (nullable)
redemptionLimit - How many times usable
redemptionCount - Current usage count
createdAt       - Creation timestamp
```

**Prize** (New fields added)
```
voucherValidityDays    - How many days valid (default: 30)
voucherRedemptionLimit - Max uses (default: 1)
sendQRCode             - Boolean: send QR image? (default: true)
```

### Relationships
```
Voucher ─belongs to→ Spin
Voucher ─belongs to→ Prize
Voucher ─belongs to→ EndUser (customer)
Voucher ─belongs to→ Tenant

Prize ─has many→ Vouchers
Spin ─has one→ Voucher
EndUser ─has many→ Vouchers
Tenant ─has many→ Vouchers
```

---

## API Endpoints (NEW)

### 1. POST `/api/vouchers/validate`
**Purpose:** Check if voucher is valid without redeeming

**Request:**
```json
{
  "code": "DEMO-ABC123",
  "tenantId": "tenant_xyz"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "voucher": {
    "code": "DEMO-ABC123",
    "prize": { "name": "50% OFF" },
    "user": { "name": "Rajesh", "phone": "+91-9876543210" },
    "expiresAt": "2026-02-28T23:59:59Z",
    "isRedeemed": false
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "reason": "expired",
  "message": "Expired on 15 Jan 2026",
  "voucher": { /* partial data */ }
}
```

### 2. POST `/api/vouchers/redeem`
**Purpose:** Mark voucher as redeemed

**Request:**
```json
{
  "code": "DEMO-ABC123",
  "tenantId": "tenant_xyz",
  "redeemedBy": "Staff Name"
}
```

**Response:**
```json
{
  "success": true,
  "voucher": { /* updated voucher data */ }
}
```

### 3. POST `/api/vouchers/lookup-phone`
**Purpose:** Find all vouchers for a phone number

**Request:**
```json
{
  "phone": "+91-9876543210",
  "tenantId": "tenant_xyz"
}
```

**Response:**
```json
{
  "found": true,
  "user": { "name": "Rajesh", "phone": "+91-9876543210" },
  "vouchers": [
    {
      "code": "DEMO-ABC123",
      "prize": { "name": "50% OFF" },
      "expiresAt": "2026-02-28",
      "isRedeemed": false
    },
    {
      "code": "DEMO-XYZ789",
      "prize": { "name": "Free Dessert" },
      "expiresAt": "2026-01-15",
      "isRedeemed": true,
      "redeemedAt": "2026-01-10"
    }
  ]
}
```

---

## Key Files & Their Roles

### Core Services

**`lib/voucherService.ts`** (NEW)
- `generateVoucherCode()` - Creates unique codes
- `generateQRImage()` - Creates QR code PNG
- `uploadQRImage()` - Uploads to storage
- `createVoucher()` - Main voucher creation
- `validateVoucher()` - Validation logic
- `redeemVoucher()` - Redemption logic
- `getVouchersByPhone()` - Phone lookup

**`lib/whatsapp.ts`** (MODIFIED)
- Add `sendVoucherNotification()` - Enhanced messages
- Add `sendWhatsAppMedia()` - Send images
- Keep existing functions unchanged

### Integration Points

**`app/api/spin/route.ts`** (MODIFIED)
- After creating spin record
- Call `voucherService.createVoucher()`
- Call `sendVoucherNotification()`

**`prisma/schema.prisma`** (MODIFIED)
- Add `Voucher` model
- Add fields to `Prize` model
- Add relations

### UI Components

**`app/admin/[tenantSlug]/scanner/page.tsx`** (NEW)
- QR scanner using html5-qrcode
- Phone number lookup form
- Validation result display
- Redeem button

---

## Security Considerations

### 1. Tenant Isolation
```typescript
// Always verify voucher belongs to requesting tenant
if (voucher.tenantId !== requestingTenantId) {
  return { valid: false, error: 'Unauthorized' };
}
```

### 2. Atomic Redemption
```typescript
// Use Prisma update to prevent race conditions
await prisma.voucher.update({
  where: { 
    code: voucherCode,
    redemptionCount: { lt: redemptionLimit } // Prevent over-redemption
  },
  data: {
    redemptionCount: { increment: 1 },
    isRedeemed: true,
    redeemedAt: new Date()
  }
});
```

### 3. Code Uniqueness
```typescript
// Check for collisions
let code = generateCode();
while (await prisma.voucher.findUnique({ where: { code } })) {
  code = generateCode(); // Regenerate if exists
}
```

### 4. Expiry Validation
```typescript
if (voucher.expiresAt < new Date()) {
  return { valid: false, reason: 'expired' };
}
```

---

## Testing Strategy

### Unit Tests
- Voucher code generation uniqueness
- QR code generation
- Validation logic (expired, used, not found)
- Redemption atomicity

### Integration Tests
1. Win prize → Voucher created
2. WhatsApp sent with code/QR
3. Scanner validates voucher
4. Redeem voucher
5. Try redeeming again (should fail)
6. Phone lookup finds vouchers

### Manual Tests
- Scan actual QR with phone camera
- Test expired voucher
- Test already-used voucher
- Test wrong tenant voucher
- Verify WhatsApp message formatting

---

## Rollout Plan

### Phase 1: Database & Core Logic (2-3 hours)
- Schema changes
- Voucher service implementation
- Basic tests

### Phase 2: WhatsApp Integration (1.5 hours)
- Enhanced message formatting
- QR image sending
- Campaign cross-promotion

### Phase 3: Spin Integration (0.5 hours)
- Connect voucher creation to wins
- Test end-to-end

### Phase 4: Validation APIs (1.5 hours)
- Build all 3 endpoints
- Test with Postman/curl

### Phase 5: Scanner UI (5 hours)
- QR scanner component
- Phone lookup
- Validation display
- Redemption flow

### Phase 6: Admin Config (1 hour)
- Prize form updates
- Voucher settings

### Phase 7: Testing & Polish (2 hours)
- Full end-to-end testing
- Edge case handling
- Error messages

---

## FAQ

**Q: What happens if QR upload fails?**
A: Voucher is still created with text code. Customer gets code via WhatsApp message.

**Q: Can vouchers be used multiple times?**
A: Admin decides per prize. Default is one-time use.

**Q: How long are vouchers valid?**
A: Admin configures per prize. Default is 30 days.

**Q: What if customer loses QR code?**
A: Merchant can look up by phone number.

**Q: Can admin manually invalidate vouchers?**
A: Not in v1. Can be added later if needed.

**Q: Do existing spins create vouchers retroactively?**
A: No. Only new wins after implementation.

---

Now proceed to **Step 1: Database Changes** to begin implementation.
