# Comprehensive Capacity Planning - 100 Cron Jobs/Hour Limit

## Scenario: 500 End Users Per Tenant Per Hour

**Given:**
- 100 cron jobs per hour (Vercel limit)
- Each tenant has ~500 end users active per hour
- Need to calculate maximum tenant capacity

---

## Part 1: Social Task Verification Capacity

### Baseline: Every 5 Minutes (Recommended)

**Cron frequency:** `*/5 * * * *`

**Calculations:**
```
Executions per hour: 60 / 5 = 12 jobs/hour
Tasks processed per execution: 100 (configurable batch size)
Total capacity: 12 × 100 = 1,200 tasks/hour
```

**Scenario Analysis:**

Assuming **20% of end users complete social tasks:**
```
Each tenant: 500 users × 20% = 100 tasks/hour
```

**Maximum tenants:**
```
1,200 tasks/hour ÷ 100 tasks/tenant/hour = 12 tenants ✅
```

---

### Optimized: Every 3 Minutes

**Cron frequency:** `*/3 * * * *`

**Calculations:**
```
Executions per hour: 60 / 3 = 20 jobs/hour
Tasks processed per execution: 100
Total capacity: 20 × 100 = 2,000 tasks/hour
```

**Maximum tenants:**
```
2,000 ÷ 100 = 20 tenants ✅
```

---

### Maximum: Every 1 Minute

**Cron frequency:** `* * * * *`

**Calculations:**
```
Executions per hour: 60 jobs/hour
Tasks processed per execution: 100
Total capacity: 60 × 100 = 6,000 tasks/hour
```

**Maximum tenants:**
```
6,000 ÷ 100 = 60 tenants ✅
```

---

### Ultra-Optimized: Larger Batch Size

**Cron frequency:** `* * * * *` (every minute)  
**Batch size:** 500 tasks (increased from 100)

**Calculations:**
```
Executions per hour: 60 jobs/hour
Tasks processed per execution: 500
Total capacity: 60 × 500 = 30,000 tasks/hour
```

**Maximum tenants:**
```
30,000 ÷ 100 = 300 tenants ✅
```

---

## Part 2: All Potential Cron Jobs Needed

### Essential Cron Jobs

#### 1. Social Task Verification ⭐ REQUIRED
**Purpose:** Verify pending social media task completions

```json
{
  "path": "/api/cron/verify-social-tasks",
  "schedule": "*/5 * * * *"
}
```

**Frequency options:**
- Development: `*/10 * * * *` (6/hour)
- Production: `*/5 * * * *` (12/hour) ⭐ Recommended
- High traffic: `*/3 * * * *` (20/hour)
- Maximum: `* * * * *` (60/hour)

**Usage:** 6-60 jobs/hour depending on traffic

---

#### 2. OTP Cleanup (Optional but Recommended)
**Purpose:** Delete expired OTP records

```json
{
  "path": "/api/cron/cleanup-expired-otps",
  "schedule": "0 * * * *"
}
```

**Frequency:** Every hour (1 job/hour)

**Code:**
```typescript
// app/api/cron/cleanup-expired-otps/route.ts
export async function GET(req: NextRequest) {
  const now = new Date();
  
  const deleted = await prisma.otp.deleteMany({
    where: {
      expiresAt: { lt: now }
    }
  });
  
  return NextResponse.json({ 
    success: true, 
    deleted: deleted.count 
  });
}
```

---

#### 3. Monthly Usage Reset (Not Needed - Event-Based)
**Status:** ❌ NOT NEEDED

**Why:** Already handled by `lib/monthly-reset.ts` (event-based)
- Automatically creates new month record on first use
- No cron required

---

#### 4. Send Queued Notifications (Optional)
**Purpose:** Send WhatsApp notifications that were queued due to time windows

```json
{
  "path": "/api/cron/send-queued-notifications",
  "schedule": "0 9 * * *"
}
```

**Frequency:** Once daily at 9 AM (0.04 jobs/hour)

**When needed:** Only if implementing notification queue for time window enforcement

---

#### 5. Update Leaderboard Cache (Optional)
**Purpose:** Pre-calculate leaderboard rankings

```json
{
  "path": "/api/cron/update-leaderboard",
  "schedule": "*/15 * * * *"
}
```

**Frequency:** Every 15 minutes (4 jobs/hour)

**When needed:** If you have a leaderboard feature with heavy queries

---

#### 6. Generate Analytics Summaries (Optional)
**Purpose:** Pre-calculate analytics for admin dashboard

```json
{
  "path": "/api/cron/generate-analytics",
  "schedule": "0 */4 * * *"
}
```

**Frequency:** Every 4 hours (0.25 jobs/hour)

**When needed:** For performance if analytics queries are slow

---

#### 7. Check Low Stock Alerts (Optional)
**Purpose:** Alert super admin of low prize inventory

```json
{
  "path": "/api/cron/check-stock-alerts",
  "schedule": "0 */6 * * *"
}
```

**Frequency:** Every 6 hours (0.17 jobs/hour)

**When needed:** If using prize inventory tracking

---

#### 8. Archive Old Campaigns (Optional)
**Purpose:** Auto-archive campaigns past end date

```json
{
  "path": "/api/cron/archive-old-campaigns",
  "schedule": "0 0 * * *"
}
```

**Frequency:** Once daily at midnight (0.04 jobs/hour)

**Code:**
```typescript
// app/api/cron/archive-old-campaigns/route.ts
export async function GET(req: NextRequest) {
  const now = new Date();
  
  const archived = await prisma.campaign.updateMany({
    where: {
      endDate: { lt: now },
      isArchived: false
    },
    data: {
      isActive: false,
      isArchived: true,
      archivedAt: now
    }
  });
  
  return NextResponse.json({ 
    success: true, 
    archived: archived.count 
  });
}
```

---

### Complete Cron Configuration Examples

#### Minimal Setup (12 jobs/hour)
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *"
  }]
}
```

**Usage:** 12/100 jobs (12%)  
**Remaining:** 88 jobs/hour

---

#### Recommended Setup (17 jobs/hour)
```json
{
  "crons": [
    {
      "path": "/api/cron/verify-social-tasks",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-expired-otps",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/update-leaderboard",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Usage:** 12 + 1 + 4 = 17/100 jobs (17%)  
**Remaining:** 83 jobs/hour

---

#### Complete Setup (37 jobs/hour)
```json
{
  "crons": [
    {
      "path": "/api/cron/verify-social-tasks",
      "schedule": "*/3 * * * *"
    },
    {
      "path": "/api/cron/cleanup-expired-otps",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/send-queued-notifications",
      "schedule": "0 9,12,15,18,21 * * *"
    },
    {
      "path": "/api/cron/update-leaderboard",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/generate-analytics",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/check-stock-alerts",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/archive-old-campaigns",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Usage:** 20 + 1 + 0.2 + 4 + 0.25 + 0.17 + 0.04 = 25.66/100 jobs (26%)  
**Remaining:** 74 jobs/hour

---

## Part 3: Capacity Matrix

### With Different Engagement Rates

| Social Task Participation | Tasks/Tenant/Hour | Max Tenants (5min) | Max Tenants (3min) | Max Tenants (1min) |
|---------------------------|-------------------|--------------------|--------------------|---------------------|
| 5% (25 tasks) | 25 | 48 | 80 | 240 |
| 10% (50 tasks) | 50 | 24 | 40 | 120 |
| 20% (100 tasks) | 100 | 12 | 20 | 60 |
| 30% (150 tasks) | 150 | 8 | 13 | 40 |
| 50% (250 tasks) | 250 | 5 | 8 | 24 |

**Your scenario: 500 users, 20% engagement = 100 tasks/hour**

---

## Part 4: Optimization Strategies

### Strategy 1: Dynamic Batch Sizing

```typescript
// Adjust batch size based on queue length
const queueSize = await prisma.socialTaskCompletion.count({
  where: { status: 'PENDING' }
});

const batchSize = queueSize > 1000 ? 500 : 
                 queueSize > 500 ? 200 : 
                 100;

const tasks = await prisma.socialTaskCompletion.findMany({
  where: { status: 'PENDING' },
  take: batchSize
});
```

**Result:** Process more when busy, save resources when quiet

---

### Strategy 2: Priority Queues

```typescript
// Process premium tenants first
const tasks = await prisma.socialTaskCompletion.findMany({
  where: { status: 'PENDING' },
  include: {
    task: {
      include: {
        campaign: {
          include: {
            tenant: {
              include: {
                subscriptionPlan: true
              }
            }
          }
        }
      }
    }
  },
  orderBy: [
    { 
      task: { 
        campaign: { 
          tenant: { 
            subscriptionPlan: { 
              name: 'desc'  // Enterprise first, then Pro, then Free
            }
          }
        }
      }
    },
    { claimedAt: 'asc' }  // Then FIFO
  ],
  take: 100
});
```

---

### Strategy 3: Per-Tier Crons

```json
{
  "crons": [
    {
      "path": "/api/cron/verify-premium",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/verify-standard",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Usage:** 60 + 12 = 72 jobs/hour (72%)  
**Premium capacity:** 6,000 tasks/hour (60 tenants @ 100 tasks/hour)  
**Standard capacity:** 1,200 tasks/hour (12 tenants @ 100 tasks/hour)  
**Total:** 72 tenants

---

## Part 5: Real-World Scenarios

### Scenario 1: Medium SaaS (20 Tenants)

**Setup:**
- 20 tenants
- 500 users per tenant
- 20% complete social tasks = 100 tasks/tenant/hour
- Total: 2,000 tasks/hour

**Cron config:**
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/3 * * * *"
  }]
}
```

**Capacity check:**
```
20 runs/hour × 100 tasks/run = 2,000 tasks/hour ✅ Perfect fit!
Usage: 20/100 cron jobs (20%)
```

---

### Scenario 2: Large SaaS (100 Tenants)

**Setup:**
- 100 tenants
- 500 users per tenant
- 10% complete social tasks = 50 tasks/tenant/hour
- Total: 5,000 tasks/hour

**Cron config:**
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "* * * * *"
  }]
}
```

**Capacity check:**
```
60 runs/hour × 100 tasks/run = 6,000 tasks/hour ✅ Within capacity!
Usage: 60/100 cron jobs (60%)
```

---

### Scenario 3: Enterprise SaaS (300 Tenants)

**Setup:**
- 300 tenants
- 500 users per tenant
- 10% complete social tasks = 50 tasks/tenant/hour
- Total: 15,000 tasks/hour

**Cron config (optimized):**
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "* * * * *"
  }]
}
```

**With increased batch size:**
```typescript
// In cron endpoint
const tasks = await findMany({
  where: { status: 'PENDING' },
  take: 500  // Increased from 100
});
```

**Capacity check:**
```
60 runs/hour × 500 tasks/run = 30,000 tasks/hour ✅ More than enough!
Usage: 60/100 cron jobs (60%)
```

---

## Part 6: Final Recommendations

### For Your Scenario (500 users/tenant, 20% engagement)

**Expected load:** 100 tasks/tenant/hour

| Tenant Count | Recommended Cron | Jobs/Hour | Status |
|--------------|------------------|-----------|--------|
| 1-12 | Every 5 minutes | 12 | ✅ Optimal |
| 13-20 | Every 3 minutes | 20 | ✅ Good |
| 21-60 | Every 1 minute | 60 | ✅ Works |
| 61-300 | Every 1 min + large batches | 60 | ✅ Requires optimization |
| 300+ | External queue needed | - | ⚠️ Consider Inngest/QStash |

---

### Complete Cron Job Summary

| Cron Job | Required? | Frequency | Jobs/Hour | Purpose |
|----------|-----------|-----------|-----------|---------|
| Social task verification | ✅ Yes | */5 or less | 12-60 | Verify task completions |
| OTP cleanup | ⚠️ Recommended | Hourly | 1 | Remove expired OTPs |
| Queued notifications | ❌ Optional | Daily | 0.04 | Send queued WhatsApp |
| Leaderboard update | ❌ Optional | */15 | 4 | Cache leaderboard |
| Analytics generation | ❌ Optional | */4 hours | 0.25 | Pre-calc analytics |
| Stock alerts | ❌ Optional | */6 hours | 0.17 | Low inventory alerts |
| Archive campaigns | ❌ Optional | Daily | 0.04 | Auto-archive old campaigns |

**Total usage (all optional included):** 17-65 jobs/hour  
**Remaining capacity:** 35-83 jobs/hour

---

## Bottom Line Answer

**Q:** "How many tenants with 500 users per hour?"

**A:** With 100 cron jobs/hour limit:

### Conservative (5-minute cron):
- **12 tenants** (if 20% task completion rate)
- **24 tenants** (if 10% task completion rate)
- **48 tenants** (if 5% task completion rate)

### Recommended (3-minute cron):
- **20 tenants** (if 20% task completion rate)
- **40 tenants** (if 10% task completion rate)
- **80 tenants** (if 5% task completion rate)

### Maximum (1-minute cron):
- **60 tenants** (if 20% task completion rate)
- **120 tenants** (if 10% task completion rate)
- **240 tenants** (if 5% task completion rate)

### Ultra-optimized (1-min + 500 batch):
- **300 tenants** (if 20% task completion rate)
- **600 tenants** (if 10% task completion rate)

**Most realistic:** 20-60 tenants with 500 active users each ✅

**All while leaving 40-88 jobs/hour for other cron tasks!** 🚀
