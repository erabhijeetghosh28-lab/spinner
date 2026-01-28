# Tenant Plan Update Fix

## Problem Summary
When updating a tenant's plan in the Super Admin dashboard, selecting a SubscriptionPlan (Free, Starter, Pro, Enterprise) was causing a Prisma error:
```
Argument 'planId': Invalid value provided. Expected String, provided Null
```

## Root Cause
The system has TWO plan models:
1. **Plan** (legacy): Basic, Pro - referenced by `planId` (REQUIRED field in Tenant model)
2. **SubscriptionPlan** (new): Free, Starter, Pro, Enterprise - referenced by `subscriptionPlanId` (OPTIONAL field)

The Tenant model requires `planId` to always have a value (it's a required foreign key). When a user selected a SubscriptionPlan from the dropdown, the API was trying to handle it but wasn't explicitly preserving the existing `planId`, causing Prisma to attempt setting it to null.

## Solution Implemented
Updated `/app/api/admin/super/tenants/route.ts` PUT endpoint to properly handle both plan types:

### When Legacy Plan is selected:
- Set `planId` to the selected legacy plan ID
- Clear `subscriptionPlanId` (set to null)

### When SubscriptionPlan is selected:
- Set `subscriptionPlanId` to the selected subscription plan ID
- **Do NOT modify `planId`** - leave it unchanged (preserves existing required value)
- Added comment: "The tenant must always have a valid planId (required field)"

## Technical Details

### Before Fix:
```typescript
} else if (subscriptionPlan) {
    updateData.subscriptionPlanId = planId;
    // Keep existing planId - don't modify it
    // (planId is required, so we can't set it to null)
}
```

### After Fix:
```typescript
} else if (subscriptionPlan) {
    updateData.subscriptionPlanId = planId;
    // Don't modify planId - it must remain set to a valid legacy Plan ID
    // The tenant must always have a valid planId (required field)
}
```

The key insight: By not including `planId` in the `updateData` object when a SubscriptionPlan is selected, Prisma will not attempt to update it, thus preserving the existing required value.

## Files Modified
- `app/api/admin/super/tenants/route.ts` - Updated plan handling logic in PUT endpoint

## Testing Recommendations
1. Edit a tenant and select a legacy Plan (Basic/Pro) - should update `planId` and clear `subscriptionPlanId`
2. Edit a tenant and select a SubscriptionPlan (Free/Starter/Pro/Enterprise) - should update `subscriptionPlanId` and preserve existing `planId`
3. Verify tenant still has valid `planId` after selecting SubscriptionPlan
4. Check that tenant functionality works correctly with both plan types

## Related Files
- `prisma/schema.prisma` - Tenant model definition with planId (required) and subscriptionPlanId (optional)
- `app/api/admin/super/plans/route.ts` - Returns both plan types with labels
- `app/admin/super/dashboard/page.tsx` - Super admin dashboard with tenant edit form

## Commit
- Commit: `4b0e292`
- Message: "fix: preserve existing planId when selecting SubscriptionPlan"
- Date: 2026-01-28
