# Event-Based Implementation (No Multiple Cron Jobs)

## ✅ Refactored to Event-Based Triggers

Since you can only run **one cron job per day**, we've refactored the system to use **event-based triggers** instead of scheduled cron jobs.

## 🔄 How It Works Now

### 1. Monthly Limit Reset (Event-Based)

**Before:** Cron job ran on 1st of month  
**Now:** Automatically handled when:
- Checking campaign limits (`/api/admin/campaigns/check-limit`)
- Creating a new campaign (`/api/admin/campaigns` POST)

**How it works:**
- When checking limits or creating campaigns, the system checks if it's a new month
- If it's a new month, automatically creates a fresh usage record (counters reset to 0)
- If it's the same month, uses existing record
- **No cron job needed!**

**Code:** `lib/monthly-reset.ts`
- `ensureMonthlyUsage()` - Checks and creates monthly record if needed
- `getOrCreateMonthlyUsage()` - Gets or creates with auto-month detection

### 2. Social Task Verification (Event-Based + Single Daily Cron)

**Before:** Cron job ran every 5 minutes  
**Now:** 
- **Primary:** Verification scheduled when task is completed (3-minute delay)
- **Fallback:** Single daily cron checks for any missed verifications

**How it works:**
1. User completes task → Completion created with status `CLAIMED`
2. System schedules verification after 3 minutes (using `setTimeout`)
3. After 3 minutes, verification runs automatically
4. **Fallback:** Daily cron (once per day) checks for any pending verifications older than 3 minutes

**Code:** `lib/social-verification.ts`
- `verifySocialTaskCompletion()` - Verifies a specific completion
- `scheduleVerification()` - Schedules verification after delay

## 📋 Single Cron Job Configuration

You now only need **ONE cron job** in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/verify-social-tasks",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs **once per day at midnight** and:
- Verifies any completions that were missed by the event-based system
- Acts as a safety net for edge cases
- Processes up to 100 pending completions per run

## 🎯 Benefits

1. **No Multiple Cron Jobs** - Only one daily cron needed
2. **Immediate Response** - Monthly reset happens instantly when needed
3. **Efficient** - Only processes what's needed, when it's needed
4. **Reliable** - Daily cron acts as fallback for missed verifications
5. **Cost-Effective** - Fewer API calls, fewer cron executions

## 🔧 Implementation Details

### Monthly Reset Flow

```
User creates campaign
    ↓
Check monthly usage
    ↓
Is it a new month?
    ├─ Yes → Create fresh record (counters = 0)
    └─ No → Use existing record
    ↓
Increment counter
    ↓
Done!
```

### Social Verification Flow

```
User completes task
    ↓
Create completion (status: CLAIMED)
    ↓
Schedule verification (3 min delay)
    ↓
[3 minutes later]
    ↓
Check follower count increase
    ↓
Update status (VERIFIED or FLAGGED)
    ↓
Done!
```

## 🧪 Testing

### Test Monthly Reset
1. Create a campaign on the last day of the month
2. Create another campaign on the 1st of next month
3. Verify counters reset automatically

### Test Social Verification
1. Complete a social task
2. Wait 3+ minutes
3. Check completion status (should be VERIFIED or FLAGGED)
4. Or trigger manual verification: `GET /api/cron/verify-social-tasks`

## 📝 Notes

- Monthly reset is **completely event-based** - no cron needed
- Social verification is **primarily event-based** with daily cron as backup
- All functions are in `lib/monthly-reset.ts` and `lib/social-verification.ts`
- The old cron endpoints still exist but are now optional/fallback only

---

**Status:** ✅ Refactored to Event-Based  
**Cron Jobs Required:** 1 (daily verification fallback)  
**Event Triggers:** Campaign creation, limit checks, task completion
