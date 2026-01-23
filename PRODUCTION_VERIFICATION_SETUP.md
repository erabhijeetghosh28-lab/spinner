# Production Verification Setup - Vercel Serverless

## ⚠️ Critical Issue Fixed

**Problem:** `setTimeout` doesn't work in Vercel serverless functions because:
- Functions are stateless and terminate after response
- Timeouts don't persist across invocations
- Works in dev but fails in production

**Solution:** Database-backed scheduling with cron job

---

## ✅ Implementation

### How It Works Now

1. **User completes task** → Completion created with `status: PENDING`
2. **Schedule verification** → `verifiedAt` timestamp set to 5 minutes from now
3. **Cron job runs** → Checks for completions where `verifiedAt <= NOW()`
4. **Verification executes** → Updates status to VERIFIED or FAILED
5. **WhatsApp sent** → If verified (respecting time windows)

### Files Updated

- `lib/social-verification.ts` - Removed `setTimeout`, stores scheduled time in DB
- `app/api/social-tasks/verify/route.ts` - New endpoint for cron/external triggers
- `app/api/cron/verify-social-tasks/route.ts` - Updated to check scheduled times
- `vercel.json` - Cron runs every 5 minutes

---

## 🔧 Production Setup Options

### Option 1: Vercel Cron (Recommended - Already Configured)

**Current Setup:**
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

**How it works:**
- Vercel cron calls `/api/social-tasks/verify` every 5 minutes
- Endpoint checks for completions ready for verification
- Processes up to 50 completions per run

**Pros:**
- ✅ Built into Vercel
- ✅ No external services needed
- ✅ Automatic scaling

**Cons:**
- ⚠️ Minimum interval is 1 minute (we use 5 minutes)
- ⚠️ Limited to 1 cron per day on free tier (check your plan)

---

### Option 2: External Cron Service (If Vercel Cron Limited)

**Services:**
- [cron-job.org](https://cron-job.org) (free)
- [EasyCron](https://www.easycron.com) (free tier)
- [UptimeRobot](https://uptimerobot.com) (free)

**Setup:**
1. Create account on external service
2. Add cron job:
   - URL: `https://your-domain.com/api/social-tasks/verify`
   - Schedule: Every 5 minutes
   - Method: GET
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**Environment Variable:**
```env
CRON_SECRET=your-secret-key-here
```

---

### Option 3: Vercel Queue (If Available)

**If you have Vercel Queue access:**

```typescript
// lib/social-verification.ts
import { Queue } from '@vercel/queue';

export async function scheduleVerification(completionId: string) {
  const queue = new Queue();
  
  await queue.enqueue('verify-task', {
    completionId,
    verifyAt: Date.now() + 300000, // 5 minutes
  }, {
    delay: 300000, // 5 minutes delay
  });
}
```

**Then create queue handler:**
```typescript
// app/api/queue/verify-task/route.ts
export async function POST(req: Request) {
  const { completionId } = await req.json();
  await verifyCompletion(completionId);
  return Response.json({ success: true });
}
```

---

### Option 4: Manual Trigger (Testing/Development)

**For testing or manual processing:**

```bash
# Call the endpoint directly
curl -X GET https://your-domain.com/api/social-tasks/verify \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 Database Schema

The `verifiedAt` field is used to store the **scheduled verification time**:

```prisma
model SocialTaskCompletion {
  verifiedAt DateTime? // Stores scheduled time, then actual verification time
}
```

**Flow:**
1. `scheduleVerification()` sets `verifiedAt = now + 5 minutes`
2. Cron checks: `WHERE status='PENDING' AND verifiedAt <= NOW()`
3. After verification, `verifiedAt` is updated to actual verification time

---

## 🧪 Testing

### Test in Development

1. Complete a social task
2. Check database: `verifiedAt` should be 5 minutes in future
3. Wait 5 minutes OR manually call:
   ```bash
   curl http://localhost:3000/api/social-tasks/verify
   ```
4. Check completion status changed to VERIFIED or FAILED

### Test in Production

1. Complete a social task
2. Wait 5 minutes
3. Check completion status (should be verified)
4. Check WhatsApp notification sent (if verified)

---

## 🔍 Monitoring

### Check Pending Verifications

```sql
SELECT COUNT(*) 
FROM "SocialTaskCompletion" 
WHERE status = 'PENDING' 
AND "verifiedAt" <= NOW();
```

### Check Verification Rate

```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM ("verifiedAt" - "claimedAt"))) as avg_seconds
FROM "SocialTaskCompletion"
WHERE "verifiedAt" IS NOT NULL
GROUP BY status;
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Required for cron authentication
CRON_SECRET=your-secret-key-here

# Optional: Enable setTimeout in development (for testing)
USE_SETTIMEOUT=true
NODE_ENV=development
```

### Cron Schedule Options

```json
// Every 5 minutes (current)
"schedule": "*/5 * * * *"

// Every minute (more frequent, but uses more resources)
"schedule": "* * * * *"

// Every 10 minutes (less frequent, but may delay verifications)
"schedule": "*/10 * * * *"
```

---

## 🚨 Troubleshooting

### Verifications Not Running

1. **Check cron is enabled:**
   - Vercel Dashboard → Settings → Cron Jobs
   - Verify cron is active

2. **Check logs:**
   - Vercel Dashboard → Functions → `/api/social-tasks/verify`
   - Look for errors

3. **Manual trigger:**
   ```bash
   curl -X GET https://your-domain.com/api/social-tasks/verify \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Verifications Running But Not Completing

1. **Check database:**
   - Verify `verifiedAt` timestamps are set correctly
   - Check for database connection issues

2. **Check function timeout:**
   - Vercel free tier: 10 seconds
   - Vercel Pro: 60 seconds
   - May need to process in smaller batches

### WhatsApp Not Sending

1. **Check notification settings:**
   - Campaign `notificationEnabled` must be true
   - Time window must be valid (9 AM - 9 PM default)

2. **Check WhatsApp config:**
   - Verify API credentials in environment variables
   - Check tenant WhatsApp configuration

---

## 📝 Summary

✅ **Fixed:** Removed `setTimeout` from serverless functions  
✅ **Solution:** Database-backed scheduling with cron job  
✅ **Production Ready:** Works reliably in Vercel serverless environment  
✅ **Flexible:** Supports multiple trigger methods (cron, queue, manual)

**Status:** Production-ready ✅
