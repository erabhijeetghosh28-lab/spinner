# Price Conversion Fix

## Issue
The subscription plan pricing had a conversion mismatch between the UI and database:
- **Database**: Stores prices in paise (smallest currency unit) - e.g., 499900 paise = ₹4,999
- **UI Form**: Was accepting and saving values directly without conversion
- **Result**: If admin entered 4999 (meaning ₹4,999), it saved 4999 paise (₹49.99)

## Root Cause
The form was not converting between rupees (user input) and paise (database storage).

## Solution
Fixed the conversion in three places in `app/admin/super/dashboard/page.tsx`:

### 1. When Opening Edit Modal (Line ~773)
**Before:**
```typescript
price: plan.price || 0
```

**After:**
```typescript
price: plan.price ? plan.price / 100 : 0  // Convert paise to rupees for display
```

### 2. When Submitting Form (Line ~815)
**Before:**
```typescript
await axios.post('/api/admin/super/plans', planFormData);
```

**After:**
```typescript
// Convert price from rupees to paise before sending to API
const priceInPaise = Math.round(planFormData.price * 100);

await axios.post('/api/admin/super/plans', {
    ...planFormData,
    price: priceInPaise
});
```

### 3. In Form Input Field (Line ~956)
**Added helpful labels and placeholder:**
```typescript
<label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
    Price (₹)
    <span className="text-slate-600 normal-case ml-1">(in rupees, e.g., 4999 for ₹4,999)</span>
</label>
<input
    type="number"
    step="0.01"
    value={planFormData.price}
    onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
    placeholder="e.g., 4999 for ₹4,999"
/>
<p className="text-xs text-slate-500 mt-1">
    Enter amount in rupees. Example: 4999 = ₹4,999/month
</p>
```

### 4. In Tenant Dropdown (Line ~636)
**Before:**
```typescript
{plan.name} - {plan.price ? `₹${plan.price}` : 'Free'}
```

**After:**
```typescript
{plan.name} - {plan.price ? `₹${(plan.price / 100).toFixed(0)}` : 'Free'}
```

## Verification
Now when a Super Admin:
1. **Enters 4999** in the price field → Sees "₹4,999" in the UI
2. **Saves the plan** → Stores 499900 paise in database
3. **Views the plan** → Displays "₹4,999" correctly
4. **Edits the plan** → Form shows 4999 (rupees) for editing

## Database Storage Convention
- **Storage**: Always in paise (Int)
- **Display**: Always in rupees (divided by 100)
- **Input**: Always in rupees (multiplied by 100 before saving)

## Examples
| User Input | Stored in DB | Displayed |
|------------|--------------|-----------|
| 0          | 0 paise      | Free      |
| 999        | 99900 paise  | ₹999      |
| 4999       | 499900 paise | ₹4,999    |
| 9999       | 999900 paise | ₹9,999    |

## Related Files
- `app/admin/super/dashboard/page.tsx` - UI form and display
- `app/api/admin/super/plans/route.ts` - API endpoint (no changes needed)
- `prisma/schema.prisma` - Database schema (price stored as Int in paise)
- `lib/billing-service.ts` - Revenue calculations (works with paise)
- `components/marketing/MarketingLandingPage.tsx` - Already had correct conversion

## Testing
To verify the fix:
1. Create a new plan with price 4999
2. Check database: `price` should be 499900
3. View plan in UI: Should display "₹4,999"
4. Edit plan: Form should show 4999
5. Check tenant dropdown: Should show "₹4,999"
