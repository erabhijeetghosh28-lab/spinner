# Step 4: Spin API Integration

**Time Estimate:** 30 minutes  
**Difficulty:** Easy  
**File to Modify:** `app/api/spin/route.ts`

---

## Step 4.1: Locate the Prize Win Section

Open `app/api/spin/route.ts` and find the section where prizes are awarded. Look for:

```typescript
// Send WhatsApp notification if prize won
if (wonPrize) {
    const { sendPrizeNotification } = await import('@/lib/whatsapp');
    await sendPrizeNotification(user.phone, selectedPrize.name, selectedPrize.couponCode || undefined, user.tenantId);
}
```

This should be around **line 240-244**.

---

## Step 4.2: Replace with Voucher Integration

**Replace the entire `if (wonPrize)` block with this:**

```typescript
// Send WhatsApp notification if prize won
if (wonPrize) {
    // Create voucher for the prize
    const voucherService = await import('@/lib/voucherService');
    const voucher = await voucherService.createVoucher(spin, selectedPrize, user);
    
    // Send enhanced WhatsApp notification with voucher
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
}
```

---

## Step 4.3: Verify Context Variables

Make sure these variables are available in the scope:
- ✅ `spin` - The spin record you just created
- ✅ `selectedPrize` - The prize that was won
- ✅ `user` - The user record (should include `tenant`)
- ✅ `campaignId` - The campaign ID

If `user` doesn't include `tenant`, update the user fetch query:

```typescript
// Find this line (around line 15-18):
const user = await prisma.endUser.findUnique({
    where: { id: userId },
    include: { tenant: true }  // ADD THIS if not present
});
```

---

## Step 4.4: Handle Errors Gracefully

The integration should NOT break the spin flow if voucher creation fails.

Wrap in try-catch if you want extra safety:

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
        console.error('Failed to create voucher or send notification:', error);
        // Don't throw - spin was successful even if voucher/WhatsApp fails
    }
}
```

---

## Step 4.5: Testing

### Test 1: Spin and Win
1. Open your dev environment
2. Spin the wheel
3. Win a prize
4. Check:
   - ✅ Spin recorded in database
   - ✅ Voucher created in database
   - ✅ WhatsApp message sent
   - ✅ QR code generated (if enabled on prize)

### Test 2: Check Database
```typescript
// In Prisma Studio or pgAdmin
SELECT 
    v.code, 
    v.expiresAt, 
    v.qrImageUrl,
    p.name as prize_name,
    u.phone
FROM "Voucher" v
JOIN "Prize" p ON v."prizeId" = p.id
JOIN "EndUser" u ON v."userId" = u.id
ORDER BY v."createdAt" DESC
LIMIT 5;
```

---

## Step 4.6: Backward Compatibility

**Old behavior (before vouchers):**
- Customer wins → WhatsApp sent with coupon code

**New behavior (after vouchers):**
- Customer wins → Voucher created → WhatsApp sent with voucher code + QR

**What about old prizes?**
- Old prizes without voucher fields will use defaults:
  - `voucherValidityDays`: 30
  - `voucherRedemptionLimit`: 1
  - `sendQRCode`: true

---

## ✅ Step 4 Complete!

You should now have:
- ✅ Voucher creation integrated into spin flow
- ✅ WhatsApp notification sent with voucher
- ✅ QR code generated and sent
- ✅ Error handling in place

**Next:** Proceed to `STEP_5_VALIDATION_APIS.md`
