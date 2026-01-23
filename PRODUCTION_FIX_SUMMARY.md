# Production Fix: setTimeout in Serverless Functions

## ⚠️ Issue Fixed

**Problem:** `setTimeout` doesn't work in Vercel serverless functions
- Serverless functions are stateless
- Functions terminate after response
- Timeouts don't persist across invocations
- Works in dev but fails in production

**Solution:** Database-backed scheduling with cron job

---

## ✅ Changes Made

### 1. Updated `lib/social-verification.ts`

**Before:**
```typescript
export function scheduleVerification(completionId: string) {
  setTimeout(async () => {
    await verifyCompletion(completionId);
  }, 300000); // ❌ Won't work in production
}
```

**After:**
```typescript
export async function scheduleVerification(completionId: string) {
  // Store scheduled verification time in database
  const scheduledVerifyAt = new Date(Date.now() + 300000); // 5 minutes
  
  await prisma.socialTaskCompletion.update({
    where: { id: completionId },
    data: {
      verifiedAt: scheduledVerifyAt, // Cron will check this
    }
  });
  
  // Dev-only setTimeout for testing (optional)
  if (process.env.NODE_ENV === 'development' && process.env.USE_SETTIMEOUT === 'true') {
    setTimeout(async () => {
      await verifyCompletion(completionId);
    }, 300000);
  }
}
```

### 2. Created `app/api/social-tasks/verify/route.ts`

New endpoint that:
- GET: Processes all pending verifications ready to be verified
- POST: Verifies a specific completion by ID
- Can be called by cron, queue, or external service

### 3. Updated `app/api/cron/verify-social-tasks/route.ts`

Now checks for scheduled verifications:
```typescript
WHERE status='PENDING' 
AND verifiedAt <= NOW() // Scheduled time has passed
```

### 4. Updated `vercel.json`

Changed cron to run every 5 minutes:
```json
{
  "crons": [
    {
      "path": "/api/social-tasks/verify",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 🔄 How It Works Now

1. **User completes task** → `status: PENDING`, `verifiedAt: now + 5 minutes`
2. **Cron runs every 5 minutes** → Checks for `verifiedAt <= NOW()`
3. **Verification executes** → Updates status to VERIFIED or FAILED
4. **WhatsApp sent** → If verified (respecting time windows)

---

## 📋 Production Setup

### Option 1: Vercel Cron (Recommended)

Already configured in `vercel.json`:
- Runs every 5 minutes
- Calls `/api/social-tasks/verify`
- Processes up to 50 completions per run

**Note:** If you're on Vercel free tier with 1 cron/day limit, use Option 2.

### Option 2: External Cron Service

Use a free service like [cron-job.org](https://cron-job.org):

1. Create account
2. Add cron job:
   - URL: `https://your-domain.com/api/social-tasks/verify`
   - Schedule: Every 5 minutes
   - Method: GET
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

3. Set environment variable:
   ```env
   CRON_SECRET=your-secret-key-here
   ```

### Option 3: Vercel Queue (If Available)

If you have Vercel Queue access, you can use it instead of cron. See `PRODUCTION_VERIFICATION_SETUP.md` for details.

---

## 🧪 Testing

### Development

1. Complete a social task
2. Check database: `verifiedAt` should be 5 minutes in future
3. Wait 5 minutes OR call manually:
   ```bash
   curl http://localhost:3000/api/social-tasks/verify
   ```
4. Verify status changed to VERIFIED or FAILED

### Production

1. Complete a social task
2. Wait 5 minutes (cron will process)
3. Check completion status
4. Verify WhatsApp notification sent (if verified)

---

## ✅ Status

- ✅ Removed `setTimeout` from serverless functions
- ✅ Database-backed scheduling implemented
- ✅ Cron endpoint created and configured
- ✅ Production-ready for Vercel
- ✅ Works reliably in serverless environment

**All set for production deployment!** 🚀
