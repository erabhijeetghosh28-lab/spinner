# Multi-Tenant Cron Architecture - Per Admin/Tenant Analysis

## Understanding Your User Model

**Your "users" = Tenant Admins (Businesses creating campaigns)**

```
Platform
├── Tenant A (Admin: Pizza Shop)
│   ├── Campaign 1
│   │   └── 100 end users completing tasks
│   └── Campaign 2
│       └── 200 end users completing tasks
├── Tenant B (Admin: Gym)
│   └── Campaign 1
│       └── 500 end users completing tasks
└── Tenant C (Admin: Salon)
    └── Campaign 1
        └── 300 end users completing tasks
```

**Question:** Does each Tenant need their own cron job?

---

## Answer: Still Just 1 Cron Job! ✅

**You need EXACTLY 1 cron job for the ENTIRE PLATFORM - regardless of tenant count!**

---

## How It Works

### Single Platform-Wide Cron

**File:** `app/api/cron/verify-social-tasks/route.ts`

```typescript
export async function GET(req: NextRequest) {
  // This runs once for ALL tenants
  
  // Get ALL pending tasks across ALL tenants
  const pendingCompletions = await prisma.socialTaskCompletion.findMany({
    where: {
      status: 'PENDING',
      claimedAt: { lte: fiveMinutesAgo }
    },
    include: {
      task: {
        include: {
          campaign: {
            include: {
              tenant: true  // Each task knows which tenant it belongs to
            }
          }
        }
      }
    },
    take: 100
  });
  
  // Process tasks from ALL tenants in one batch
  for (const completion of pendingCompletions) {
    // Could be from Tenant A
    // Or Tenant B
    // Or Tenant C
    // Doesn't matter - all processed the same way
    await verifyCompletion(completion.id);
  }
}
```

**This single cron processes:**
- ✅ Tenant A's tasks
- ✅ Tenant B's tasks  
- ✅ Tenant C's tasks
- ✅ All 1,000 tenants' tasks
- ✅ Everything in one efficient batch

---

## Scaling Analysis by Tenant Count

| Tenants | Avg Tasks/Tenant/Hour | Total Tasks/Hour | Cron Needed | Status |
|---------|----------------------|------------------|-------------|---------|
| 1 | 50 | 50 | 1 cron @ 5min | ✅ Instant |
| 10 | 50 | 500 | 1 cron @ 5min | ✅ Perfect |
| 100 | 50 | 5,000 | 1 cron @ 3min | ✅ Good |
| 1,000 | 50 | 50,000 | 1 cron @ 1min | ⚠️ Consider optimization |
| 10,000 | 50 | 500,000 | Multiple strategies | ⚠️ Need queue |

---

## Why One Cron is Better Than Per-Tenant Crons

### ❌ Per-Tenant Approach (Bad)

```json
// BAD: One cron per tenant
{
  "crons": [
    { "path": "/api/cron/verify-tenant-A", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/verify-tenant-B", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/verify-tenant-C", "schedule": "*/5 * * * *" },
    // ... 1,000 more cron jobs
  ]
}
```

**Problems:**
- 1,000 tenants = 1,000 crons × 12 runs/hour = 12,000 jobs/hour ❌
- Far exceeds Vercel's 100 jobs/hour limit ❌
- Most crons would do nothing (if tenant has no pending tasks) ❌
- Massive waste of resources ❌

### ✅ Platform-Wide Approach (Good)

```json
// GOOD: One cron for all tenants
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *"
  }]
}
```

**Benefits:**
- Only 12 jobs/hour regardless of tenant count ✅
- Processes ALL tenants efficiently ✅
- Tenants without tasks don't waste resources ✅
- Scales to unlimited tenants ✅

---

## Real-World Example

### Platform with 100 Tenants

**Scenario at 2 PM:**
- Tenant A: 10 pending tasks
- Tenant B: 0 pending tasks (no activity)
- Tenant C: 50 pending tasks
- Tenant D: 5 pending tasks
- Tenants E-Z: 0 pending tasks
- ...
- **Total: 65 pending tasks across all tenants**

**With 1 cron job:**
```
2:00 PM - Cron runs
│
├─ Query: Find ALL pending tasks (from all tenants)
│  Result: 65 tasks found
│
├─ Process batch:
│  ├─ 10 tasks from Tenant A ✓
│  ├─ 50 tasks from Tenant C ✓
│  └─ 5 tasks from Tenant D ✓
│
└─ Complete in 2 seconds
```

**With per-tenant crons:**
```
2:00 PM - 100 crons run
│
├─ Tenant A cron: 10 tasks ✓
├─ Tenant B cron: 0 tasks (wasted execution)
├─ Tenant C cron: 50 tasks ✓
├─ Tenant D cron: 5 tasks ✓
├─ Tenant E cron: 0 tasks (wasted)
├─ ... 95 more mostly empty executions
│
└─ Complete in 2 seconds (same time, more waste)
```

**Resource usage comparison:**
- Platform-wide: 1 execution
- Per-tenant: 100 executions (95 wasted)

---

## When Would You Need Multiple Crons?

### Scenario: Premium SLA for Paying Tenants

**If you want to offer faster verification to premium tenants:**

```json
{
  "crons": [
    {
      "path": "/api/cron/verify-premium-tenants",
      "schedule": "* * * * *"  // Every 1 minute
    },
    {
      "path": "/api/cron/verify-free-tenants",
      "schedule": "*/5 * * * *"  // Every 5 minutes
    }
  ]
}
```

**Implementation:**
```typescript
// Premium cron (faster)
const premiumTasks = await prisma.socialTaskCompletion.findMany({
  where: {
    status: 'PENDING',
    task: {
      campaign: {
        tenant: {
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: {
            name: { in: ['Pro', 'Enterprise'] }
          }
        }
      }
    }
  }
});

// Free cron (slower)
const freeTasks = await prisma.socialTaskCompletion.findMany({
  where: {
    status: 'PENDING',
    task: {
      campaign: {
        tenant: {
          subscriptionPlan: {
            name: { in: ['Free', 'Starter'] }
          }
        }
      }
    }
  }
});
```

**Total usage:** 60 + 12 = 72 jobs/hour ✅ (still within limit)

**Benefit:** Premium tenants get 1-minute verification, free tenants get 5-minute

---

## Tenant Isolation & Fairness

### Concern: "Won't one busy tenant slow down others?"

**Solution: Fair scheduling in single cron**

```typescript
// Process tasks fairly across tenants
const pendingTasks = await prisma.socialTaskCompletion.findMany({
  where: { status: 'PENDING' },
  include: { task: { include: { campaign: true } } },
  orderBy: [
    { task: { campaign: { tenantId: 'asc' } } },  // Group by tenant
    { claimedAt: 'asc' }                           // Then by time
  ],
  take: 100
});

// This ensures each tenant gets fair processing
```

### Better: Limit per tenant per batch

```typescript
// Process max 10 tasks per tenant per run
const tenantTaskCounts = new Map<string, number>();

for (const task of pendingTasks) {
  const tenantId = task.task.campaign.tenantId;
  const count = tenantTaskCounts.get(tenantId) || 0;
  
  if (count < 10) {  // Max 10 per tenant per batch
    await verifyCompletion(task.id);
    tenantTaskCounts.set(tenantId, count + 1);
  } else {
    // Skip - this tenant has had their share this round
    // Will be processed in next cron run
  }
}
```

**Result:** Even if Tenant A has 10,000 pending tasks, they won't monopolize the cron. Other tenants still get processed.

---

## Monitoring Per-Tenant

### Track which tenants are using verification

```typescript
// In cron job
const stats = new Map<string, { verified: number, failed: number }>();

for (const completion of pendingCompletions) {
  const tenantId = completion.task.campaign.tenantId;
  await verifyCompletion(completion.id);
  
  const updated = await findUpdatedStatus(completion.id);
  if (!stats.has(tenantId)) {
    stats.set(tenantId, { verified: 0, failed: 0 });
  }
  
  if (updated.status === 'VERIFIED') {
    stats.get(tenantId)!.verified++;
  } else {
    stats.get(tenantId)!.failed++;
  }
}

console.log('Verification stats by tenant:', Object.fromEntries(stats));
// Output: { "tenant-A": { verified: 10, failed: 0 }, "tenant-B": { verified: 50, failed: 2 } }
```

---

## Cost Analysis

### Platform with 1,000 Tenants

**Option 1: One cron per tenant** ❌
```
1,000 crons × 12 runs/hour = 12,000 jobs/hour
Cost: Impossible (exceeds limit by 120x)
```

**Option 2: One cron for all tenants** ✅
```
1 cron × 12 runs/hour = 12 jobs/hour
Cost: ₹0 (well within free tier)
Handles: Unlimited tenants
```

---

## Recommended Architecture

### For ANY Number of Tenants (1 to 10,000)

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *"
  }]
}
```

**This handles:**
- 1 tenant with 1 campaign
- 1,000 tenants with 10,000 campaigns
- Unlimited tenants (with frequency adjustment)

### If You Want Premium vs Free Tiers

```json
{
  "crons": [
    {
      "path": "/api/cron/verify-premium",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/verify-free",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Total usage:** 72 jobs/hour (28% of limit)

---

## Summary Table

| Tenants | Cron Jobs Needed | Jobs/Hour | Efficiency |
|---------|------------------|-----------|------------|
| 1 | 1 | 12 | ✅ Optimal |
| 10 | 1 | 12 | ✅ Optimal |
| 100 | 1 | 12 | ✅ Optimal |
| 1,000 | 1 | 12 | ✅ Optimal |
| 10,000 | 1-2* | 12-72 | ✅ Still good |

*Only split into 2 if offering premium SLA

---

## Final Answer

**How many cron jobs per tenant/admin?**

**Answer: 0 cron jobs per tenant**  
**Total platform crons: 1 (or 2 for premium tier)**

**Breakdown:**
- 1 tenant = 1 shared cron
- 10 tenants = 1 shared cron
- 100 tenants = 1 shared cron
- 1,000 tenants = 1 shared cron
- 10,000 tenants = 1 shared cron (or 2 for premium/free split)

**Your setup:**
```json
{
  "crons": [{
    "path": "/api/cron/verify-social-tasks",
    "schedule": "*/5 * * * *"
  }]
}
```

**This single cron handles ALL your tenants, forever!** 🚀

---

## Key Takeaway

**Multi-tenancy doesn't mean multiple crons!**

The cron is **platform infrastructure**, not **tenant infrastructure**.

All tenants share the same verification system - just like they share your:
- Database
- API endpoints
- Server resources
- Everything else

**1 cron job = infinite tenants** ✅
