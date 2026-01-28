# Unlimited Limits & Campaign Duration Enhancement

## Overview

Added support for unlimited subscription limits and campaign duration settings to the Super Admin Controls feature.

## Changes Made

### 1. Database Schema Updates

**SubscriptionPlan Model:**
```prisma
model SubscriptionPlan {
  // Usage limits - null = unlimited
  spinsPerMonth    Int? @default(5000)    // null = unlimited spins
  vouchersPerMonth Int? @default(2000)    // null = unlimited vouchers
  
  // Campaign duration setting
  campaignDurationDays Int @default(30)   // How many days a campaign can run
}
```

**Key Changes:**
- `spinsPerMonth` and `vouchersPerMonth` are now nullable (`Int?`)
- `null` value = unlimited (no limits)
- Added `campaignDurationDays` field to control campaign duration
- Default values remain: 5000 spins, 2000 vouchers, 30 days

### 2. Usage Service Updates

**lib/usage-service.ts:**
- `getEffectiveLimits()`: Returns `Infinity` when plan limit is `null`
- Bonus overrides only apply to limited plans (not added to `Infinity`)
- `canSpin()` and `canCreateVoucher()`: Always return `true` for unlimited plans
- Percentage calculations: Return `0%` for unlimited plans (never reaches limit)

### 3. UI Component Updates

**components/admin/super/TenantUsageDisplay.tsx:**
- Displays "∞ Unlimited" instead of numeric limit for unlimited plans
- Hides progress bars for unlimited plans
- Hides trend indicators for unlimited plans
- No warning indicators for unlimited plans

### 4. Migration

**Migration:** `20260128030702_add_unlimited_limits_and_campaign_duration`
- Made `spinsPerMonth` and `vouchersPerMonth` nullable
- Added `campaignDurationDays` field with default value of 30

## Usage

### Creating Unlimited Plans

```typescript
// Create a plan with unlimited spins and vouchers
await prisma.subscriptionPlan.create({
  data: {
    name: "Enterprise Unlimited",
    price: 99900, // ₹999
    interval: "MONTHLY",
    spinsPerMonth: null,      // Unlimited spins
    vouchersPerMonth: null,   // Unlimited vouchers
    campaignDurationDays: 90, // 90-day campaigns
  }
});
```

### Creating Limited Plans

```typescript
// Create a plan with specific limits
await prisma.subscriptionPlan.create({
  data: {
    name: "Starter",
    price: 4999, // ₹49.99
    interval: "MONTHLY",
    spinsPerMonth: 5000,      // 5000 spins per month
    vouchersPerMonth: 2000,   // 2000 vouchers per month
    campaignDurationDays: 30, // 30-day campaigns
  }
});
```

## Behavior

### Unlimited Plans
- No limit enforcement on spins or vouchers
- Usage tracking still occurs (for analytics)
- UI shows "∞ Unlimited" instead of numbers
- No progress bars or warning indicators
- Bonus overrides have no effect (already unlimited)

### Limited Plans
- Existing behavior unchanged
- Limits enforced as before
- Progress bars and warnings shown
- Bonus overrides add to base limits

### Campaign Duration
- Defines how many days a campaign can run
- Can be set per subscription plan
- Default: 30 days
- Can be customized for different tiers (e.g., 7 days for Free, 90 days for Enterprise)

## Testing

All existing tests pass:
- ✅ 18 usage service unit tests
- ✅ 21 property-based tests (2,100 iterations)
- ✅ Limit enforcement tests
- ✅ Counter increment tests
- ✅ Trend calculation tests

## Backward Compatibility

✅ **Fully backward compatible:**
- Existing plans with numeric limits continue to work
- Default values (5000/2000) applied to new plans
- No breaking changes to API or UI
- Existing data unaffected

## Next Steps

1. Update Super Admin UI to allow setting unlimited limits
2. Add campaign duration validation in campaign creation
3. Add UI controls for campaign duration setting
4. Document unlimited plans in admin guide

## Files Modified

- `prisma/schema.prisma` - Schema changes
- `lib/usage-service.ts` - Unlimited limit handling
- `components/admin/super/TenantUsageDisplay.tsx` - UI for unlimited display
- `.kiro/specs/super-admin-controls/tasks.md` - Updated Task 1

## Migration Applied

```bash
npx prisma migrate dev --name add-unlimited-limits-and-campaign-duration
```

Migration file: `prisma/migrations/20260128030702_add_unlimited_limits_and_campaign_duration/migration.sql`
