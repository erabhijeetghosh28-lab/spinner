# Step 1: Database Schema Changes

**Time Estimate:** 1 hour  
**Difficulty:** Easy  
**⚠️ Critical:** Run `npx prisma migrate dev` after making changes

---

## File to Modify

📁 **`prisma/schema.prisma`**

---

## Step 1.1: Add Voucher Model

Add this new model at the end of the schema file (before the last closing brace):

```prisma
// ============================================
// VOUCHER MANAGEMENT MODELS
// ============================================

model Voucher {
  id              String    @id @default(cuid())
  code            String    @unique
  qrImageUrl      String?   // URL to QR code image (nullable - only if prize has sendQRCode enabled)
  
  // Relations
  spinId          String    @unique
  spin            Spin      @relation(fields: [spinId], references: [id], onDelete: Cascade)
  prizeId         String
  prize           Prize     @relation(fields: [prizeId], references: [id])
  userId          String
  user            EndUser   @relation(fields: [userId], references: [id])
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  // Validity and usage
  expiresAt       DateTime  // Calculated from prize.voucherValidityDays
  isRedeemed      Boolean   @default(false)
  redeemedAt      DateTime?
  redeemedBy      String?   // Name/ID of staff who redeemed
  
  // Security
  redemptionLimit Int       @default(1)  // Usually 1, but configurable
  redemptionCount Int       @default(0)
  
  createdAt       DateTime  @default(now())
  
  // Indexes for performance
  @@index([code])
  @@index([tenantId, isRedeemed])
  @@index([userId])  // For phone number lookup
  @@index([expiresAt])
}
```

---

## Step 1.2: Update Prize Model

Find the `Prize` model and add these fields BEFORE the last line (`spins Spin[]`):

```prisma
model Prize {
  // ... existing fields (don't change them) ...
  
  // Voucher configuration (ADD THESE)
  voucherValidityDays    Int     @default(30)      // How many days voucher is valid
  voucherRedemptionLimit Int     @default(1)       // 1 = one-time use, N = multiple uses
  sendQRCode             Boolean @default(true)    // Should QR image be sent?
  
  vouchers               Voucher[]  // ADD THIS relation
  spins                  Spin[]      // This should already exist
}
```

**⚠️ IMPORTANT:** Don't remove any existing fields!

---

## Step 1.3: Update Spin Model

Find the `Spin` model and add this relation:

```prisma
model Spin {
  // ... existing fields ...
  
  voucher  Voucher?  // ADD THIS (one-to-one relation)
  
  // ... rest of fields ...
}
```

---

## Step 1.4: Update EndUser Model

Find the `EndUser` model and add this relation:

```prisma
model EndUser {
  // ... existing fields ...
  
  vouchers  Voucher[]  // ADD THIS
  
  // ... rest of fields ...
}
```

---

## Step 1.5: Update Tenant Model

Find the `Tenant` model and add this relation:

```prisma
model Tenant {
  // ... existing fields ...
  
  vouchers  Voucher[]  // ADD THIS
  
  // ... rest of fields ...
}
```

---

## Step 1.6: Run Migration

Open terminal in project root and run:

```bash
npx prisma migrate dev --name add_voucher_system
```

This will:
1. Create a new migration file
2. Apply changes to your database
3. Regenerate Prisma Client

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "..."

Applying migration `20260127_add_voucher_system`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260127_add_voucher_system/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

---

## Step 1.7: Verify Migration

Check that these files were created:

1. **Migration SQL file:**
   `prisma/migrations/YYYYMMDD_add_voucher_system/migration.sql`

2. **Prisma Client regenerated:**
   You should see `Voucher` type available in your code

---

## Testing

After migration, verify in your database tool (e.g., Prisma Studio):

```bash
npx prisma studio
```

You should see:
- ✅ New `Voucher` table
- ✅ `Prize` table has 3 new fields
- ✅ All relationships working

---

## Rollback (if something goes wrong)

If migration fails:

```bash
npx prisma migrate reset
```

⚠️ **WARNING:** This will delete all data! Only use in development.

---

## Common Issues & Solutions

**Issue 1: "Field ... conflicts with existing field"**
- **Cause:** You didn't add field in the right place
- **Fix:** Make sure you're adding fields inside the correct model

**Issue 2: "Relation ... is missing opposite relation field"**
- **Cause:** Forgot to add relation on both sides
- **Fix:** Check all 5 models (Voucher, Prize, Spin, EndUser, Tenant)

**Issue 3: "Migration failed"**
- **Cause:** Database connection issue
- **Fix:** Check `.env` file has correct `DATABASE_URL`

---

## ✅ Step 1 Complete!

You should now have:
- ✅ Voucher model in schema
- ✅ Prize model updated with voucher fields
- ✅ All relations connected
- ✅ Database migrated successfully

**Next:** Proceed to `STEP_2_VOUCHER_SERVICE.md`
