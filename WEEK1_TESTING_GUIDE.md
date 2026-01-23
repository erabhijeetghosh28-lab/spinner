# Week 1 Testing Guide: Subscription System & Campaign Limits

## ✅ Automated Tests Completed

The automated test script has verified:
- ✅ 4 subscription plans exist (Free, Starter, Pro, Enterprise)
- ✅ Tenant has subscription plan assigned
- ✅ Campaign soft delete fields exist
- ✅ Limit calculation logic works

## 🧪 Manual Testing Steps

### Prerequisites
1. Start the dev server: `npm run dev`
2. Login as tenant admin at `/admin`
3. Note your tenant ID (check browser localStorage or database)

### Test 1: Check Campaign Limits API

**Endpoint:** `GET /api/admin/campaigns/check-limit?tenantId={tenantId}`

**Steps:**
1. Open browser DevTools → Network tab
2. Navigate to admin dashboard → Campaigns tab
3. Check the limit info request
4. Verify response shows:
   - `canCreate`: boolean
   - `activeCount`: number
   - `activeLimit`: number
   - `monthlyCount`: number
   - `monthlyLimit`: number
   - `subscriptionPlan`: object with plan name

**Expected Result:**
- Free plan: `activeLimit: 1`, `monthlyLimit: 1`
- Starter plan: `activeLimit: 3`, `monthlyLimit: 3`
- Pro plan: `activeLimit: 10`, `monthlyLimit: 10`

---

### Test 2: Campaign Creation with Limits

**Scenario A: Free Plan (1 campaign limit)**

1. Ensure you have 1 active campaign
2. Try to create a 2nd campaign
3. **Expected:** Should be blocked with error: "Active campaign limit reached"

**Scenario B: Monthly Limit**

1. Create a campaign (if under limit)
2. Archive it immediately
3. Try to create another campaign in the same month
4. **Expected:** Should be blocked with error: "Monthly campaign creation limit reached"

**Steps:**
1. Go to Campaigns tab
2. Click "+ New Campaign"
3. Fill in required fields:
   - Name: "Test Campaign 2"
   - Start Date: Today
   - End Date: 30 days from now
4. Click "Save"
5. **Expected:** If at limit, see error message; if not, campaign created

---

### Test 3: Soft Delete (Archive)

**Steps:**
1. Go to Campaigns tab
2. Find an active campaign
3. Click "Delete" (should say "Archive" in confirmation)
4. Confirm the archive action
5. **Expected:**
   - Campaign disappears from active list
   - Campaign is marked as `isArchived: true`
   - Campaign still exists in database (check with `includeArchived=true`)

**Verify in Database:**
```sql
SELECT id, name, "isActive", "isArchived", "archivedAt" 
FROM "Campaign" 
WHERE "tenantId" = 'your-tenant-id';
```

---

### Test 4: Monthly Usage Tracking

**Steps:**
1. Create a campaign (if under limit)
2. Check database for `TenantUsage` record:
   ```sql
   SELECT * FROM "TenantUsage" 
   WHERE "tenantId" = 'your-tenant-id' 
   AND month = '2026-01'; -- current month
   ```
3. **Expected:** `campaignsCreated` should increment by 1

**Test Monthly Reset:**
1. Manually call the reset endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/cron/reset-monthly-limits \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
2. **Expected:** On 1st of month, counters reset to 0

---

### Test 5: Admin UI Display

**Steps:**
1. Navigate to `/admin/dashboard` → Campaigns tab
2. **Verify:**
   - Shows "Active: X / Y campaigns"
   - Shows "This Month: X / Y created"
   - Shows current plan name
   - "+ New Campaign" button disabled when at limit
   - Upgrade prompt appears when limit reached

**Expected UI Elements:**
- ✅ Campaign count display
- ✅ Monthly usage display
- ✅ Plan name display
- ✅ Disabled button when at limit
- ✅ Upgrade prompt with specific limit message

---

### Test 6: Upgrade Prompt

**Steps:**
1. Reach your campaign limit (create max campaigns)
2. Try to create another campaign
3. **Expected:**
   - Button is disabled
   - Yellow warning box appears
   - Shows specific limit message
   - Has "Upgrade your plan" link

---

## 🐛 Common Issues & Fixes

### Issue: "No usage record found"
**Fix:** This is normal. Usage record is created automatically on first campaign creation.

### Issue: "Limit check returns wrong values"
**Fix:** 
1. Check tenant has `subscriptionPlanId` set
2. Verify subscription plan exists in database
3. Check `TenantUsage` record for current month

### Issue: "Can create more campaigns than limit"
**Fix:**
1. Verify both active AND monthly limits are checked
2. Check `isArchived: false` filter in count query
3. Verify `TenantUsage.campaignsCreated` is being incremented

### Issue: "Archive doesn't work"
**Fix:**
1. Check DELETE endpoint uses soft delete (not hard delete)
2. Verify `isArchived` and `archivedAt` are set
3. Check campaigns query excludes archived by default

---

## ✅ Testing Checklist

- [ ] Subscription plans exist in database
- [ ] Tenant has subscription plan assigned
- [ ] Check limit API returns correct values
- [ ] Campaign creation blocked when at active limit
- [ ] Campaign creation blocked when at monthly limit
- [ ] Soft delete (archive) works correctly
- [ ] Archived campaigns don't appear in active list
- [ ] Monthly usage counter increments on creation
- [ ] Admin UI shows limits correctly
- [ ] Upgrade prompt appears when limit reached
- [ ] Button disabled when at limit

---

## 📊 Test Results Template

```
Date: __________
Tester: __________

Test 1: Check Limit API
- Status: ✅ / ❌
- Notes: __________

Test 2: Campaign Creation Limits
- Status: ✅ / ❌
- Notes: __________

Test 3: Soft Delete
- Status: ✅ / ❌
- Notes: __________

Test 4: Monthly Usage
- Status: ✅ / ❌
- Notes: __________

Test 5: Admin UI
- Status: ✅ / ❌
- Notes: __________

Overall: ✅ PASS / ❌ FAIL
```

---

## 🚀 Quick Test Commands

```bash
# Run automated database tests
npx tsx scripts/test-week1.ts

# Check subscription plans
npx prisma studio
# Then navigate to SubscriptionPlan table

# Check tenant usage
npx prisma studio
# Then navigate to TenantUsage table

# Test API (requires server running)
# Set ADMIN_TOKEN and TENANT_ID in .env
npx tsx scripts/test-week1-api.ts
```

---

## 📝 Notes

- Monthly limits reset on the 1st of each month
- Archived campaigns are soft-deleted (not removed from database)
- Active limit = max active campaigns at once
- Monthly limit = max campaigns created per month
- Both limits must pass for campaign creation
