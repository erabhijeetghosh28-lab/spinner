# Cron Job Dependency Analysis

## TL;DR: Only 1 Optional Cron Job Needed

**You only need ONE cron job, and it's optional!**

---

## What's ALREADY Event-Based (No Cron Needed) ✅

### 1. Monthly Usage Reset ✅ EVENT-BASED
**File:** `lib/monthly-reset.ts`

**How it works:**
```typescript
// Called EVERY TIME a campaign is created
export async function getOrCreateMonthlyUsage(tenantId: string) {
  const currentMonth = "2026-01";
  
  // If record for current month doesn't exist, create it
  if (!existingUsage) {
    // New month detected! Reset automatically happens here
    await create({ month: currentMonth, campaignsCreated: 0 });
  }
}
```

**Triggered by:** Campaign creation  
**When reset happens:** Automatically when first campaign is created in new month  
**Cron needed?** ❌ NO

**Example:**
- Feb 28: User creates campaign → `'2026-02'` record exists
- Mar 1: User creates campaign → `'2026-03'` record doesn't exist → Creates new record with 0 count
- **Reset happened automatically!**

---

### 2. Campaign Limit Enforcement ✅ EVENT-BASED
**File:** `app/api/admin/campaigns/route.ts`

**How it works:**
```typescript
// Checked EVERY TIME user tries to create campaign
const activeCount = await count({ where: { isActive: true, isArchived: false }});
if (activeCount >= limit) {
  return error;
}
```

**Triggered by:** Campaign creation attempt  
**Cron needed?** ❌ NO

---

### 3. Task Completion Tracking ✅ EVENT-BASED
**File:** `app/api/social-tasks/complete/route.ts`

**How it works:**
```typescript
// Runs WHEN user clicks "I Completed This"
await create({ status: 'PENDING', claimedAt: now });
```

**Triggered by:** User action  
**Cron needed?** ❌ NO

---

## What NEEDS Cron Job (Only 1 Thing)

### Social Task Verification ⚠️ NEEDS CRON

**Why a cron is needed:**
The original implementation used `setTimeout`:

```typescript
// lib/social-verification.ts - Line 48
setTimeout(async () => {
  await verifyCompletion(completionId);
}, 300000); // 5 minutes
```

**Problem:** This doesn't work in Vercel serverless functions because:
1. Function terminates after response is sent
2. setTimeout is cleared when function exits
3. Verification never happens

**Solution:** Cursor already created a backup cron endpoint!

---

## The ONLY Cron Job You Need

**File:** `app/api/cron/verify-social-tasks/route.ts`

**What it does:**
```typescript
// Runs every 5 minutes (or whatever interval you choose)
// Finds all PENDING tasks that are ready to verify
const pendingCompletions = await findMany({
  where: {
    status: 'PENDING',
    claimedAt: { lte: new Date(now - 5 minutes) }
  }
});

// Verify each one
for (const completion of pendingCompletions) {
  await verifyCompletion(completion.id);
}
```

**Frequency:** Every 5-10 minutes  
**Purpose:** Verify pending social tasks  
**Required?** ✅ YES (for verification to work)

---

## How to Set Up the Cron Job

### Option 1: Vercel Cron (Recommended) ✅

**File:** `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *"
  }]
}
```

**Cron schedule:**
- `*/5 * * * *` = Every 5 minutes
- `*/10 * * * *` = Every 10 minutes
- `0 * * * *` = Every hour

**Cost:** FREE on Vercel (included in all plans)

---

### Option 2: External Cron Service (Alternative)

If not using Vercel or want more control:

**Services:**
- Cron-job.org (free)
- EasyCron (free tier)
- QStash by Upstash (serverless)

**Setup:**
1. Create cron job pointing to your endpoint
2. URL: `https://yourapp.com/api/cron/verify-social-tasks`
3. Method: GET or POST
4. Schedule: Every 5 minutes
5. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

---

## Alternative: No Cron at All (Lazy Verification)

**You could even skip the cron job entirely!**

**How?** Verify tasks when users return to the page:

```typescript
// app/campaigns/[id]/page.tsx
useEffect(() => {
  // When user visits campaign page, verify their pending tasks
  fetch('/api/social-tasks/verify-mine', { method: 'POST' });
}, []);
```

**Pros:**
- No cron job needed
- No external dependencies
- Works in any hosting environment

**Cons:**
- Verification delayed until user returns
- WhatsApp notifications delayed
- Users might not come back

**Verdict:** Not recommended for good UX

---

## Summary Table

| Feature | Event-Based? | Cron Needed? | How It Works |
|---------|--------------|--------------|---------------|
| **Monthly reset** | ✅ Yes | ❌ No | Auto-detects new month on first use |
| **Campaign limits** | ✅ Yes | ❌ No | Checked when creating campaign |
| **Task completion** | ✅ Yes | ❌ No | Triggered by user action |
| **Task verification** | ❌ No | ✅ Yes | Needs scheduled job to verify pending tasks |
| **WhatsApp notifications** | ✅ Yes | ❌ No | Sent during verification |
| **Bonus spins award** | ✅ Yes | ❌ No | Awarded during verification |

---

## Recommended Setup

### Minimal (Production-Ready)
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *"
  }]
}
```

**That's it! Only 1 cron job.**

---

## How It All Works Together

### User Journey Without Cron:
```
1. User completes task → Status: PENDING
2. [Nothing happens - stuck in PENDING forever] ❌
```

### User Journey With Cron:
```
1. User completes task → Status: PENDING
2. [5 minutes pass]
3. Cron runs → Finds PENDING tasks
4. Verifies task → Status: VERIFIED
5. Awards bonus spins
6. Sends WhatsApp notification ✅
```

---

## Cost Analysis

| Cron Frequency | Vercel Executions/Month | Cost |
|----------------|-------------------------|------|
| Every 5 min | 8,640 | FREE |
| Every 10 min | 4,320 | FREE |
| Every 15 min | 2,880 | FREE |

**All included in Vercel Free tier!**

---

## Final Answer

### You Need:
✅ **1 cron job** - Social task verification (every 5 minutes)

### You Don't Need Cron For:
❌ Monthly usage reset (event-based)  
❌ Campaign limits (event-based)  
❌ Task completion (event-based)  
❌ WhatsApp notifications (triggered by verification)

### Setup Time:
⏱️ **2 minutes** - Just add vercel.json with cron config

**That's all you need!** 🎉
