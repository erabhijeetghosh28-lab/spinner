# Subscription & Campaign Limits - Implementation Plan

## Database Schema Changes

### 1. Add SubscriptionPlan Model
```prisma
model SubscriptionPlan {
  id                String   @id @default(cuid())
  name              String   // "Free", "Starter", "Pro", "Enterprise"
  price             Int      // in paise (₹0, ₹999, ₹4999, etc.)
  interval          String   // "MONTHLY", "YEARLY"
  
  // Campaign limits
  campaignsPerMonth Int      @default(1)
  spinsPerCampaign  Int      @default(1000)
  
  // Social media features
  socialMediaEnabled Boolean  @default(false)
  maxSocialTasks     Int      @default(0)
  
  // Feature flags
  customBranding    Boolean  @default(false)
  advancedAnalytics Boolean  @default(false)
  
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  
  tenants           Tenant[]
}
```

### 2. Update Tenant Model
```prisma
model Tenant {
  id                  String   @id @default(cuid())
  
  // Add subscription fields
  subscriptionPlanId  String?
  subscriptionPlan    SubscriptionPlan? @relation(fields: [subscriptionPlanId], references: [id])
  subscriptionStatus  String   @default("TRIAL") // TRIAL, ACTIVE, CANCELED
  subscriptionStart   DateTime?
  subscriptionEnd     DateTime?
  
  // Existing fields...
}
```

### 3. Add TenantUsage Model
```prisma
model TenantUsage {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  month           String   // "2026-01" format
  campaignsCreated Int     @default(0)
  spinsUsed       Int      @default(0)
  
  createdAt       DateTime @default(now())
  
  @@unique([tenantId, month])
}
```

### 4. Update Campaign Model
```prisma
model Campaign {
  // Add soft delete fields
  isArchived  Boolean  @default(false)
  archivedAt  DateTime?
}
```

## Seed Default Plans
```typescript
// prisma/seed.ts
const plans = [
  {
    name: "Free",
    price: 0,
    interval: "MONTHLY",
    campaignsPerMonth: 1,
    spinsPerCampaign: 500,
    socialMediaEnabled: false,
    maxSocialTasks: 0,
  },
  {
    name: "Starter",
    price: 99900, // ₹999
    interval: "MONTHLY",
    campaignsPerMonth: 3,
    spinsPerCampaign: 5000,
    socialMediaEnabled: true,
    maxSocialTasks: 3,
  },
  {
    name: "Pro",
    price: 499900, // ₹4,999
    interval: "MONTHLY",
    campaignsPerMonth: 10,
    spinsPerCampaign: 25000,
    socialMediaEnabled: true,
    maxSocialTasks: 10,
  },
];
```

## API Endpoints

### Check Campaign Limit
```typescript
// app/api/admin/campaigns/check-limit/route.ts
POST /api/admin/campaigns/check-limit

Logic:
1. Get tenant's subscription plan
2. Count active campaigns (isActive=true, isArchived=false)
3. Get monthly usage for current month
4. Return: { canCreate, activeCount, activeLimit, monthlyCount, monthlyLimit }
```

### Create Campaign with Validation
```typescript
// app/api/admin/campaigns/route.ts
POST /api/admin/campaigns

Validation:
1. Check active campaign limit
2. Check monthly creation limit
3. If both pass → Create campaign
4. Increment TenantUsage.campaignsCreated
5. Return success
```

### Archive Campaign (Soft Delete)
```typescript
PATCH /api/admin/campaigns/{id}/archive

Logic:
1. Set isActive = false
2. Set isArchived = true
3. Set archivedAt = now()
4. DON'T delete from database
```

## Admin UI Changes

### Campaign Dashboard
Show campaign usage: "Your Campaigns (2/3 active)"
Disable create button when at limit
Show upgrade prompt when limit reached

### Upgrade Prompt Component
Display when campaign limit reached
Link to billing/upgrade page
Show plan comparison

## Monthly Reset (Event-Based - No Cron Needed)

**Trigger**: On every campaign creation API call

**Logic in campaign creation endpoint:**
```typescript
// app/api/admin/campaigns/route.ts
POST /api/admin/campaigns

async function checkAndResetMonthlyLimit(tenantId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-01"
  
  // Get or create usage record for current month
  const usage = await prisma.tenantUsage.upsert({
    where: { tenantId_month: { tenantId, month: currentMonth } },
    create: { tenantId, month: currentMonth, campaignsCreated: 0 },
    update: {} // No update needed if already exists
  });
  
  return usage;
}

// In campaign creation:
1. Call checkAndResetMonthlyLimit(tenantId)
2. This automatically creates new month record if needed
3. Old month records remain for history
4. No cron job required
```

**Benefits**:
- ✅ No scheduled jobs needed
- ✅ Resets happen automatically on first use of new month
- ✅ More reliable than cron timing
- ✅ Simpler architecture

## Migration Command
```bash
npx prisma migrate dev --name add_subscription_system
```

## Testing Checklist
- [ ] Free plan: Can create 1 campaign, blocked on 2nd
- [ ] Free plan: Can't recreate in same month after delete
- [ ] Starter plan: Can create 3 campaigns max
- [ ] Monthly counter resets on 1st of month
- [ ] Upgrade increases limits immediately
- [ ] Archive instead of delete works
