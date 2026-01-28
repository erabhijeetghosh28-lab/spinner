# 🎫 VOUCHER SYSTEM - START HERE

**For: Kiro (Implementation Guide)**  
**Created: 27 Jan 2026**  
**Estimated Time: 14-16 hours**

---

## ⚠️ CRITICAL - READ FIRST

**DO NOT BREAK EXISTING FUNCTIONALITY**

This system adds NEW features. The existing spin wheel, campaigns, prizes, and WhatsApp notifications must continue working exactly as they do now.

### What's Already Working (DON'T TOUCH):
- ✅ Spin wheel mechanics
- ✅ Prize selection & probability
- ✅ OTP verification
- ✅ WhatsApp notifications (basic)
- ✅ Referral system
- ✅ Social media tasks
- ✅ Landing pages
- ✅ Admin dashboard

### What You're Adding (NEW):
- 🆕 Voucher code generation
- 🆕 QR code generation & WhatsApp delivery
- 🆕 Merchant scanner interface
- 🆕 Voucher validation & redemption
- 🆕 Phone number lookup
- 🆕 Enhanced WhatsApp messages

---

## 📋 Implementation Checklist

Follow these files in order:

1. **[READ FIRST]** `VOUCHER_OVERVIEW.md` - Understand the complete system
2. **[STEP 1]** `STEP_1_DATABASE.md` - Database schema changes
3. **[STEP 2]** `STEP_2_VOUCHER_SERVICE.md` - Core voucher logic
4. **[STEP 3]** `STEP_3_WHATSAPP.md` - Enhanced notifications
5. **[STEP 4]** `STEP_4_SPIN_INTEGRATION.md` - Connect to spin API
6. **[STEP 5]** `STEP_5_VALIDATION_APIS.md` - Validation endpoints
7. **[STEP 6]** `STEP_6_SCANNER_UI.md` - Merchant scanner interface
8. **[STEP 7]** `STEP_7_PRIZE_CONFIG.md` - Admin configuration UI
9. **[TEST]** `TESTING_GUIDE.md` - Complete testing checklist

---

## 📦 NPM Packages to Install

```bash
npm install nanoid qrcode html5-qrcode date-fns
```

**Already installed (no need to add):**
- `@prisma/client`
- `next`
- `react`

---

## 🔑 Key Concepts

### Voucher Flow
```
Customer Spins → Wins Prize → System Generates Voucher Code
                                         ↓
                    (If admin enabled "Send QR")
                                         ↓
                    Generate QR Image (PNG 400x400)
                                         ↓
                    Upload to UploadThing Storage
                                         ↓
            Send WhatsApp: Message + QR Image OR Text Code
                                         ↓
            Customer receives notification on phone
                                         ↓
            Customer visits store, shows code/QR
                                         ↓
            Merchant scans QR OR enters phone number
                                         ↓
            System validates voucher
                                         ↓
            Shows customer details + redemption button
                                         ↓
            Merchant clicks "Redeem"
                                         ↓
            Voucher marked as used in database
```

### Two Validation Methods

**Method 1: Scan QR Code**
- Merchant opens scanner page
- Uses phone/tablet camera
- Scans QR from customer's phone
- Shows validation result

**Method 2: Phone Lookup**
- Merchant enters customer phone number  
- System shows all vouchers for that customer
- Merchant selects voucher to redeem

---

## 🎯 Success Criteria

After implementation, you should be able to:

1. ✅ Customer wins prize → Receives WhatsApp with voucher
2. ✅ QR code image sent if prize has "Send QR" enabled
3. ✅ Message includes expiry, redemption steps, and campaign promotions
4. ✅ Merchant can scan QR or lookup by phone
5. ✅ Invalid vouchers show reason (expired/used/not found)
6. ✅ Valid vouchers can be redeemed
7. ✅ All existing features still work

---

## 📁 Files You'll Create

### New Files (Create these):
```
lib/voucherService.ts              - Core voucher logic
app/api/vouchers/validate/route.ts - Validation endpoint
app/api/vouchers/redeem/route.ts   - Redemption endpoint
app/api/vouchers/lookup-phone/route.ts - Phone lookup endpoint
app/admin/[tenantSlug]/scanner/page.tsx - Scanner interface
```

### Files You'll Modify (Carefully!):
```
prisma/schema.prisma               - Add Voucher model + Prize fields
lib/whatsapp.ts                    - Enhance notification function
app/api/spin/route.ts              - Add voucher creation after win
components/admin/PrizeForm.tsx     - Add voucher config fields (if exists)
```

---

## 🚨 Common Pitfalls to Avoid

1. **Don't break existing WhatsApp notifications**
   - Keep old `sendPrizeNotification` function signature
   - Add NEW function for voucher notifications
   
2. **Database migration**
   - Run `npx prisma migrate dev` after schema changes
   - Test on development database first
   
3. **QR Code Upload**
   - Use existing UploadThing setup
   - Don't create new upload service
   
4. **Tenant Isolation**
   - Always validate `tenantId` matches
   - Never show vouchers from other tenants
   
5. **Atomic Operations**
   - Use Prisma transactions for redemption
   - Prevent double redemption

---

## 💬 Questions? Check These First

**Q: What if WhatsApp API doesn't support media?**
A: Fall back to text code only. System still works.

**Q: What if QR upload fails?**
A: Voucher still created with text code. Log error and continue.

**Q: Can I change existing database fields?**
A: NO! Only ADD new fields/models. Don't modify existing ones.

**Q: Should I test on production?**
A: ABSOLUTELY NOT! Test locally, then staging, then production.

---

## 🎓 Learning Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **QRCode Package**: https://www.npmjs.com/package/qrcode
- **html5-qrcode**: https://github.com/mebjas/html5-qrcode
- **WhatsApp Business API**: Check existing `lib/whatsapp.ts` for examples

---

## 📞 Need Help?

If stuck:
1. Read the step guide again carefully
2. Check existing similar code in the project
3. Test each step before moving to next
4. Ask me (the one who created this guide) if really stuck

---

## ⏱️ Time Estimates per Step

- Step 1 (Database): 1 hour
- Step 2 (Voucher Service): 2 hours
- Step 3 (WhatsApp): 1.5 hours
- Step 4 (Spin Integration): 0.5 hours
- Step 5 (Validation APIs): 1.5 hours
- Step 6 (Scanner UI): 5 hours
- Step 7 (Prize Config): 1 hour
- Testing: 2 hours

**Total: ~14.5 hours**

---

**Ready? Start with `VOUCHER_OVERVIEW.md` to understand the big picture, then proceed to Step 1.**

Good luck! 🚀
