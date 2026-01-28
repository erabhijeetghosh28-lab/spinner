# Plan System Simplification

## Problem
The system had two plan models causing confusion:
1. **Plan** (legacy) - Basic, Pro with limited features
2. **SubscriptionPlan** (new) - Free, Starter, Pro, Enterprise with full features

This caused issues where:
- Enterprise users couldn't access QR Code Generator, Analytics, or Custom Branding
- The system was checking the wrong plan model for features
- Plans tab showed both plan types mixed together

## Solution Implemented

### 1. Plans API - Now Only Returns SubscriptionPlan
**File**: `app/api/admin/super/plans/route.ts`
- GET endpoint now only returns SubscriptionPlan records
- POST/PUT endpoints already only worked with SubscriptionPlan
- Removed legacy Plan from API responses

### 2. Feature Access Checks - Now Check SubscriptionPlan First
Updated all feature check endpoints to prioritize SubscriptionPlan:

**Files Updated**:
- `app/api/admin/qr/route.ts` - QR Code Generator access
- `app/api/admin/analytics/route.ts` - Analytics access
- `app/api/admin/stock-alerts/route.ts` - Inventory Tracking access
- `app/api/admin/campaigns/route.ts` - Campaign features display

**Logic**:
```typescript
// Check subscription plan first, fallback to legacy plan
const hasQRAccess = tenant.subscriptionPlan?.allowQRCodeGenerator || tenant.plan.allowQRCodeGenerator;
const hasAnalyticsAccess = tenant.subscriptionPlan?.advancedAnalytics || tenant.plan.allowAnalytics;
```

### 3. Tenant Update - Simplified Plan Handling
**File**: `app/api/admin/super/tenants/route.ts`
- Removed complex legacy/subscription plan detection
- Now directly sets `subscriptionPlanId` when plan is selected
- Legacy `planId` remains unchanged (required field for backward compatibility)

## Feature Mapping

### SubscriptionPlan Features:
- `allowQRCodeGenerator` - QR Code Generator
- `advancedAnalytics` - Advanced Analytics  
- `customBranding` - Custom Branding
- `socialMediaEnabled` - Social Media Tasks
- `spinsPerMonth` - Monthly spin limit
- `vouchersPerMonth` - Monthly voucher limit
- `campaignsPerMonth` - Campaign creation limit
- `campaignDurationDays` - Campaign duration

### Legacy Plan Features (Fallback):
- `allowQRCodeGenerator` - QR Code Generator
- `allowAnalytics` - Basic Analytics
- `allowInventoryTracking` - Inventory Tracking (only in legacy)
- `maxCampaigns` - Campaign limit

## Current Plan Structure

### Active Plans (SubscriptionPlan):
1. **Free** - Basic features, limited usage
2. **Starter** - More spins/vouchers, social media
3. **Pro** - Custom branding, advanced analytics
4. **Enterprise** - Unlimited usage, all features

### Legacy Plans (Plan) - Kept for Backward Compatibility:
1. **Basic** - Minimal features
2. **Pro** - Standard features

## Testing Recommendations

1. **Enterprise User Test**:
   - Login as Enterprise tenant
   - Verify QR Code Generator is accessible
   - Verify Analytics page loads
   - Verify Custom Branding options appear

2. **Plan Features Test**:
   - Check each plan type shows correct features
   - Verify feature access matches plan permissions
   - Test plan upgrades/downgrades

3. **Backward Compatibility Test**:
   - Existing tenants with legacy plans should still work
   - Features should fallback to legacy plan if no subscription plan

## Migration Path (Future)

To fully remove legacy Plan model:
1. Migrate all existing tenants to SubscriptionPlan
2. Update Tenant schema to make `planId` optional
3. Remove Plan model from schema
4. Remove fallback logic from feature checks

## Files Modified
- `app/api/admin/super/plans/route.ts` - Only return SubscriptionPlan
- `app/api/admin/qr/route.ts` - Check subscriptionPlan first
- `app/api/admin/analytics/route.ts` - Check subscriptionPlan first
- `app/api/admin/stock-alerts/route.ts` - Check subscriptionPlan first
- `app/api/admin/campaigns/route.ts` - Check subscriptionPlan first
- `app/api/admin/super/tenants/route.ts` - Simplified plan handling

## Commits
- `da70e14` - fix: include tenant count in plans API response
- `bc0c792` - fix: check subscriptionPlan features first, fallback to legacy plan

## Result
- Plans tab now only shows SubscriptionPlan records
- Enterprise users can access all features (QR, Analytics, Branding)
- System prioritizes SubscriptionPlan features over legacy Plan
- Backward compatibility maintained for existing tenants
