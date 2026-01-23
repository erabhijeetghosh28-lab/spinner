# Vercel Cron Usage Optimization - 100 Jobs/Hour Limit

## Your Limit: 100 Cron Jobs Per Hour ✅

This is **plenty** for the social task verification system!

---

## Usage Calculation

### Scenario 1: Every 5 Minutes (Recommended)
```
Executions per hour: 60 / 5 = 12 jobs/hour
Your limit: 100 jobs/hour
Usage: 12%
Remaining: 88 jobs/hour for other features
```
**Status:** ✅ **PERFECT** - Uses only 12% of your limit

---

### Scenario 2: Every 3 Minutes (Faster Verification)
```
Executions per hour: 60 / 3 = 20 jobs/hour
Your limit: 100 jobs/hour
Usage: 20%
Remaining: 80 jobs/hour
```
**Status:** ✅ **EXCELLENT** - Still plenty of headroom

---

### Scenario 3: Every 1 Minute (Fastest Possible)
```
Executions per hour: 60 / 1 = 60 jobs/hour
Your limit: 100 jobs/hour
Usage: 60%
Remaining: 40 jobs/hour
```
**Status:** ✅ **STILL GOOD** - Within limit but less headroom

---

## Recommended Setup

### Option A: Balanced (5 Minutes) ⭐ RECOMMENDED
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *",
    "description": "Verify pending social tasks every 5 minutes"
  }]
}
```

**Pros:**
- Only 12 jobs/hour (88 remaining for future)
- Fast enough for good UX (5-min delay acceptable)
- Leaves room for other cron jobs

**Cons:**
- Users wait up to 5 minutes for verification

**Best for:** Most use cases

---

### Option B: Faster (3 Minutes)
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/3 * * * *",
    "description": "Verify pending social tasks every 3 minutes"
  }]
}
```

**Pros:**
- Faster verification (3-min average wait)
- Still only 20 jobs/hour
- 80 jobs/hour remaining

**Best for:** Better UX, high-engagement campaigns

---

### Option C: Ultra-Fast (1 Minute) - Not Recommended
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "* * * * *",
    "description": "Verify pending social tasks every minute"
  }]
}
```

**Pros:**
- Near-instant verification

**Cons:**
- Uses 60% of cron limit
- Overkill for most cases
- Less headroom for future features

**Best for:** Premium campaigns only

---

## Adaptive Scheduling Strategy

**Smart approach:** Adjust frequency based on traffic!

### Low Traffic (< 100 tasks/day)
```json
"schedule": "*/10 * * * *"  // Every 10 minutes = 6 jobs/hour
```

### Medium Traffic (100-1000 tasks/day)
```json
"schedule": "*/5 * * * *"  // Every 5 minutes = 12 jobs/hour
```

### High Traffic (> 1000 tasks/day)
```json
"schedule": "*/3 * * * *"  // Every 3 minutes = 20 jobs/hour
```

---

## Additional Cron Jobs You Might Add (Future)

With 100 jobs/hour, you can add more features:

### Potential Future Crons
```json
{
  "crons": [
    {
      "path": "/api/cron/verify-social-tasks",
      "schedule": "*/5 * * * *"  // 12 jobs/hour
    },
    {
      "path": "/api/cron/cleanup-expired-otps",
      "schedule": "0 * * * *"     // 1 job/hour (every hour)
    },
    {
      "path": "/api/cron/send-queued-notifications",
      "schedule": "*/15 * * * *"  // 4 jobs/hour (every 15 min)
    },
    {
      "path": "/api/cron/update-leaderboard",
      "schedule": "*/30 * * * *"  // 2 jobs/hour (every 30 min)
    },
    {
      "path": "/api/cron/generate-analytics",
      "schedule": "0 */4 * * *"   // 0.25 jobs/hour (every 4 hours)
    }
  ]
}
```

**Total usage:** 12 + 1 + 4 + 2 + 0.25 = **19.25 jobs/hour**  
**Remaining:** 80.75 jobs/hour

**Still plenty of room!** ✅

---

## Cost Implications (Free Tier)

Vercel Free Tier includes:
- ✅ 100 cron jobs per hour
- ✅ Unlimited cron endpoints
- ✅ No additional cost

**Your setup costs:** ₹0/month

---

## Performance Optimization

### Batch Processing in Cron
Instead of processing all tasks, limit batch size:

```typescript
// app/api/cron/verify-social-tasks/route.ts
const pendingCompletions = await prisma.socialTaskCompletion.findMany({
  where: { status: 'PENDING' },
  take: 100  // Process max 100 per run
});
```

**Benefits:**
- Prevents timeout on large batches
- Each cron run completes quickly
- Can run more frequently without issues

---

## Real-World Example

**Campaign with 1000 users:**
- 500 complete social tasks in 1 hour
- Cron runs every 5 minutes = 12 times/hour
- Each run processes ~42 tasks (500/12)
- All verified within 5 minutes ✅

**With 3-minute cron:**
- Cron runs every 3 minutes = 20 times/hour
- Each run processes ~25 tasks (500/20)
- All verified within 3 minutes ✅

---

## Monitoring & Alerts

### Track Cron Usage
```typescript
// app/api/cron/verify-social-tasks/route.ts
console.log(`[CRON] Verified ${verifiedCount} tasks in ${duration}ms`);

if (verifiedCount > 100) {
  // Alert: High volume, consider increasing frequency
}
```

### Vercel Dashboard
- View cron execution logs
- Monitor execution time
- Track success/failure rate

---

## Recommended Configuration

### For Your Setup (100 jobs/hour limit)

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *"
  }]
}
```

**Why this works:**
- Uses only 12% of your limit (12/100)
- 5-minute verification delay is acceptable
- Leaves 88 jobs/hour for future features
- Can easily increase frequency if needed

---

## FAQ

**Q: What if I exceed 100 jobs/hour?**  
A: Vercel will queue excess jobs, but they might be delayed or skipped. With 12 jobs/hour, you're nowhere near this.

**Q: Can I run multiple cron jobs at once?**  
A: Yes! You can have multiple endpoints, and they all count toward the 100/hour limit.

**Q: What's the minimum interval?**  
A: 1 minute (`* * * * *`) - but you'd only use 60 jobs/hour.

**Q: Can I change frequency dynamically?**  
A: No - cron schedule is fixed in vercel.json. But you can deploy updates to change it.

---

## Decision Matrix

| Your Traffic | Recommended Schedule | Jobs/Hour | % Used |
|--------------|---------------------|-----------|--------|
| < 50 tasks/day | Every 10 min | 6 | 6% |
| 50-500 tasks/day | Every 5 min ⭐ | 12 | 12% |
| 500-2000 tasks/day | Every 3 min | 20 | 20% |
| > 2000 tasks/day | Every 2 min | 30 | 30% |

**All well within your 100 jobs/hour limit!**

---

## Final Recommendation

### Start with this:
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *"
  }]
}
```

### Monitor for 1 week:
- Check average tasks per hour
- Check verification delays
- Check user feedback

### Adjust if needed:
- High traffic? → Switch to `*/3 * * * *`
- Low traffic? → Switch to `*/10 * * * *`

**You have plenty of headroom to optimize!** 🚀

---

## Summary

✅ **100 jobs/hour is MORE than enough**  
✅ **Recommended: 5-minute interval (12 jobs/hour)**  
✅ **Can run up to 1-minute intervals if needed**  
✅ **Leaves 88% of quota for future features**  
✅ **Zero additional cost**

**You're all set!** 🎉
