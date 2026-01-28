# 🚀 KIRO IMPLEMENTATION PLAN - SUBSCRIPTION LIMITS & SUPER ADMIN CONTROLS

**For:** Kiro (Developer)  
**Created:** 27 Jan 2026  
**Estimated Time:** 17-20 hours (Phase 1 only)  
**Priority:** HIGH - Revenue Protection & Tenant Management

---

## 📋 OVERVIEW

This plan adds **subscription-based usage limits** (spins & vouchers per month) and **Super Admin controls** to manage all tenants.

**What's Missing:**
1. ❌ Tenant can create unlimited spins/vouchers (no enforcement)
2. ❌ No usage tracking (can't see "Spins: 3,247/5,000")
3. ❌ Super Admin can't see usage across tenants
4. ❌ No billing/revenue dashboard
5. ❌ Can't give bonus spins to tenants

**What You'll Build:**
- ✅ Monthly usage limits (5,000 spins, 2,000 vouchers for Starter)
- ✅ Real-time usage tracking with progress bars
- ✅ Limit enforcement (block when quota exceeded)
- ✅ Super Admin can view all usage & override limits
- ✅ Billing dashboard (MRR tracking)

---

## 🗂️ PHASE 1: DATABASE SCHEMA CHANGES

### **Step 1.1: Update SubscriptionPlan Model**

**File:** `prisma/schema.prisma`

**Add these fields to `SubscriptionPlan` model (around line 44):**

```prisma
model SubscriptionPlan {
  id       String @id @default(cuid())
  name     String
  price    Int
  interval String
  
  // Existing fields
  campaignsPerMonth Int @default(1)
  spinsPerCampaign  Int @default(1000)
  
  // ⭐ ADD THESE NEW FIELDS:
  spinsPerMonth     Int @default(5000)    // Monthly spin quota
  vouchersPerMonth  Int @default(2000)    // Monthly voucher quota
  
  // Feature flags (existing)
  socialMediaEnabled Boolean @default(false)
  maxSocialTasks     Int     @default(0)
  customBranding    Boolean @default(false)
  advancedAnalytics Boolean @default(false)
  
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenants Tenant[]
}
```

---

### **Step 1.2: Create MonthlyUsage Table**

**Add this NEW model to `prisma/schema.prisma`:**

```prisma
model MonthlyUsage {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  month     Int      // 1-12
  year      Int      // 2026
  
  spinsUsed     Int @default(0)
  vouchersUsed  Int @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([tenantId, month, year])
  @@index([tenantId, year, month])
}
```

**Don't forget to add relation to Tenant model:**

```prisma
model Tenant {
  // ... existing fields ...
  
  monthlyUsage MonthlyUsage[]  // ⭐ ADD THIS
}
```

---

### **Step 1.3: Create TenantLimitOverride Table**

**For Super Admin to give bonus spins:**

```prisma
model TenantLimitOverride {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  bonusSpins    Int      @default(0)
  bonusVouchers Int      @default(0)
  reason        String?
  expiresAt     DateTime? // Optional expiry for bonus
  
  createdBy     String   // Super Admin ID
  createdAt     DateTime @default(now())
  
  @@index([tenantId])
}
```

**Add relation to Tenant:**

```prisma
model Tenant {
  // ... existing fields ...
  
  monthlyUsage     MonthlyUsage[]
  limitOverrides   TenantLimitOverride[]  // ⭐ ADD THIS
}
```

---

### **Step 1.4: Run Migration**

```bash
npx prisma db push
```

**Expected output:** New tables created: `MonthlyUsage`, `TenantLimitOverride`

---

## 💻 PHASE 2: USAGE TRACKING SERVICE

### **Step 2.1: Create Usage Limits Service**

**File:** `lib/usageLimits.ts` (NEW FILE)

```typescript
import { prisma } from './prisma';

/**
 * Get or create monthly usage record for a tenant
 */
export async function getMonthlyUsage(tenantId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  const usage = await prisma.monthlyUsage.upsert({
    where: {
      tenantId_month_year: {
        tenantId,
        month,
        year
      }
    },
    update: {},
    create: {
      tenantId,
      month,
      year,
      spinsUsed: 0,
      vouchersUsed: 0
    }
  });
  
  return usage;
}

/**
 * Get tenant with plan and usage limits
 */
export async function getTenantWithLimits(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscriptionPlan: true,
      limitOverrides: {
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  if (!tenant?.subscriptionPlan) {
    throw new Error('No subscription plan found for tenant');
  }
  
  return tenant;
}

/**
 * Calculate effective limits (plan + bonus)
 */
export function calculateEffectiveLimits(
  tenant: Awaited<ReturnType<typeof getTenantWithLimits>>
) {
  const plan = tenant.subscriptionPlan;
  const override = tenant.limitOverrides?.[0];
  
  return {
    spinsPerMonth: plan.spinsPerMonth + (override?.bonusSpins || 0),
    vouchersPerMonth: plan.vouchersPerMonth + (override?.bonusVouchers || 0)
  };
}

/**
 * Check if tenant can create a spin
 */
export async function canCreateSpin(tenantId: string): Promise<{
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}> {
  const tenant = await getTenantWithLimits(tenantId);
  const usage = await getMonthlyUsage(tenantId);
  const limits = calculateEffectiveLimits(tenant);
  
  if (usage.spinsUsed >= limits.spinsPerMonth) {
    return {
      allowed: false,
      reason: 'Monthly spin limit reached',
      current: usage.spinsUsed,
      limit: limits.spinsPerMonth
    };
  }
  
  return { allowed: true };
}

/**
 * Check if tenant can create a voucher
 */
export async function canCreateVoucher(tenantId: string): Promise<{
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}> {
  const tenant = await getTenantWithLimits(tenantId);
  const usage = await getMonthlyUsage(tenantId);
  const limits = calculateEffectiveLimits(tenant);
  
  if (usage.vouchersUsed >= limits.vouchersPerMonth) {
    return {
      allowed: false,
      reason: 'Monthly voucher limit reached',
      current: usage.vouchersUsed,
      limit: limits.vouchersPerMonth
    };
  }
  
  return { allowed: true };
}

/**
 * Increment spin usage
 */
export async function incrementSpinUsage(tenantId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  await prisma.monthlyUsage.upsert({
    where: {
      tenantId_month_year: {
        tenantId,
        month,
        year
      }
    },
    update: {
      spinsUsed: { increment: 1 }
    },
    create: {
      tenantId,
      month,
      year,
      spinsUsed: 1,
      vouchersUsed: 0
    }
  });
}

/**
 * Increment voucher usage
 */
export async function incrementVoucherUsage(tenantId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  await prisma.monthlyUsage.upsert({
    where: {
      tenantId_month_year: {
        tenantId,
        month,
        year
      }
    },
    update: {
      vouchersUsed: { increment: 1 }
    },
    create: {
      tenantId,
      month,
      year,
      spinsUsed: 0,
      vouchersUsed: 1
    }
  });
}
```

---

## 🔌 PHASE 3: INTEGRATE WITH EXISTING APIS

### **Step 3.1: Update Spin API**

**File:** `app/api/spin/route.ts`

**Add at the top:**
```typescript
import { canCreateSpin, incrementSpinUsage } from '@/lib/usageLimits';
```

**Add BEFORE processing the spin (around line 50, after getting tenant):**

```typescript
// Check tenant spin limit
const spinCheck = await canCreateSpin(user.tenantId);
if (!spinCheck.allowed) {
  return NextResponse.json({
    error: spinCheck.reason,
    details: {
      current: spinCheck.current,
      limit: spinCheck.limit,
      upgradeUrl: '/admin/billing'
    }
  }, { status: 403 });
}
```

**Add AFTER spin is created successfully:**

```typescript
// Increment spin usage
await incrementSpinUsage(user.tenantId);
```

---

### **Step 3.2: Update Voucher Creation**

**File:** `lib/voucher-service.ts`

**Add at the top:**
```typescript
import { canCreateVoucher, incrementVoucherUsage } from './usageLimits';
```

**In `createVoucher` function, add at the beginning:**

```typescript
export async function createVoucher(data: CreateVoucherInput) {
  // Check voucher limit
  const voucherCheck = await canCreateVoucher(data.tenantId);
  if (!voucherCheck.allowed) {
    throw new Error(
      `${voucherCheck.reason}. Current: ${voucherCheck.current}/${voucherCheck.limit}`
    );
  }
  
  // ... existing voucher creation code ...
  
  // After voucher is created successfully:
  await incrementVoucherUsage(data.tenantId);
  
  return voucher;
}
```

---

## 🎨 PHASE 4: TENANT ADMIN DASHBOARD

### **Step 4.1: Create Usage Widget Component**

**File:** `components/UsageWidget.tsx` (NEW FILE)

```typescript
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export function UsageWidget({ tenantId }: { tenantId: string }) {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUsage();
  }, []);
  
  const fetchUsage = async () => {
    try {
      const res = await axios.get(`/api/admin/usage?tenantId=${tenantId}`);
      setUsage(res.data);
    } catch (err) {
      console.error('Failed to fetch usage');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !usage) return <div>Loading usage...</div>;
  
  const spinPercent = (usage.spinsUsed / usage.spinsLimit) * 100;
  const voucherPercent = (usage.vouchersUsed / usage.vouchersLimit) * 100;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">Monthly Usage</h3>
      
      {/* Spins */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Spins</span>
          <span className="text-sm text-gray-600">
            {usage.spinsUsed.toLocaleString()} / {usage.spinsLimit.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              spinPercent >= 90 ? 'bg-red-500' : 
              spinPercent >= 70 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(spinPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {spinPercent.toFixed(1)}% used
        </p>
      </div>
      
      {/* Vouchers */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Vouchers</span>
          <span className="text-sm text-gray-600">
            {usage.vouchersUsed.toLocaleString()} / {usage.vouchersLimit.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              voucherPercent >= 90 ? 'bg-red-500' : 
              voucherPercent >= 70 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(voucherPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {voucherPercent.toFixed(1)}% used
        </p>
      </div>
      
      {/* Upgrade Alert */}
      {(spinPercent >= 80 || voucherPercent >= 80) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ You've used {Math.max(spinPercent, voucherPercent).toFixed(0)}% of your quota
          </p>
          <a href="/admin/billing" className="text-sm text-blue-600 hover:underline">
            Upgrade plan →
          </a>
        </div>
      )}
    </div>
  );
}
```

---

### **Step 4.2: Create Usage API**

**File:** `app/api/admin/usage/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyUsage, getTenantWithLimits, calculateEffectiveLimits } from '@/lib/usageLimits';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }
    
    const tenant = await getTenantWithLimits(tenantId);
    const usage = await getMonthlyUsage(tenantId);
    const limits = calculateEffectiveLimits(tenant);
    
    return NextResponse.json({
      spinsUsed: usage.spinsUsed,
      spinsLimit: limits.spinsPerMonth,
      vouchersUsed: usage.vouchersUsed,
      vouchersLimit: limits.vouchersPerMonth,
      planName: tenant.subscriptionPlan.name,
      hasBonus: tenant.limitOverrides.length > 0
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
```

---

### **Step 4.3: Add Widget to Tenant Dashboard**

**File:** `app/admin/[tenantSlug]/page.tsx`

**Import:**
```typescript
import { UsageWidget } from '@/components/UsageWidget';
```

**Add to dashboard JSX:**
```tsx
<div className="grid grid-cols-3 gap-6">
  {/* Existing stats cards */}
  
  {/* Add Usage Widget */}
  <div className="col-span-1">
    <UsageWidget tenantId={tenant.id} />
  </div>
</div>
```

---

## 👑 PHASE 5: SUPER ADMIN CONTROLS

### **Step 5.1: Add Bonus Spins API**

**File:** `app/api/admin/super/tenants/bonus/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, bonusSpins, bonusVouchers, reason } = await req.json();
    
    // Create limit override
    const override = await prisma.tenantLimitOverride.create({
      data: {
        tenantId,
        bonusSpins: bonusSpins || 0,
        bonusVouchers: bonusVouchers || 0,
        reason,
        createdBy: 'super-admin' // TODO: Get from auth
      }
    });
    
    return NextResponse.json({ success: true, override });
  } catch (error) {
    console.error('Error adding bonus:', error);
    return NextResponse.json({ error: 'Failed to add bonus' }, { status: 500 });
  }
}
```

---

### **Step 5.2: Add Usage Column to Tenants Table**

**File:** `app/admin/super/dashboard/page.tsx`

**In TenantsTab component, modify the table to show usage:**

```tsx
// Add state for usage data
const [tenantUsage, setTenantUsage] = useState<Record<string, any>>({});

// Fetch usage for all tenants
useEffect(() => {
  if (tenants.length > 0) {
    fetchAllUsage();
  }
}, [tenants]);

const fetchAllUsage = async () => {
  const usageMap: Record<string, any> = {};
  
  await Promise.all(
    tenants.map(async (tenant) => {
      try {
        const res = await axios.get(`/api/admin/usage?tenantId=${tenant.id}`);
        usageMap[tenant.id] = res.data;
      } catch (err) {
        usageMap[tenant.id] = null;
      }
    })
  );
  
  setTenantUsage(usageMap);
};

// In table headers, add:
<th className="pb-4 font-bold">Usage</th>

// In table rows, add:
<td className="py-4">
  {tenantUsage[tenant.id] ? (
    <div className="text-xs">
      <div>Spins: {tenantUsage[tenant.id].spinsUsed}/{tenantUsage[tenant.id].spinsLimit}</div>
      <div>Vouchers: {tenantUsage[tenant.id].vouchersUsed}/{tenantUsage[tenant.id].vouchersLimit}</div>
    </div>
  ) : (
    <span className="text-slate-500">Loading...</span>
  )}
</td>

// In actions column, add bonus button:
<button
  onClick={() => handleAddBonus(tenant)}
  className="text-green-500 hover:text-green-400 text-sm font-bold"
>
  Add Bonus
</button>
```

---

### **Step 5.3: Add Bonus Modal**

**Add to TenantsTab component:**

```tsx
const [showBonusModal, setShowBonusModal] = useState(false);
const [bonusTenant, setBonusTenant] = useState<any>(null);
const [bonusData, setBonusData] = useState({
  spins: 0,
  vouchers: 0,
  reason: ''
});

const handleAddBonus = (tenant: any) => {
  setBonusTenant(tenant);
  setShowBonusModal(true);
};

const submitBonus = async () => {
  try {
    await axios.post('/api/admin/super/tenants/bonus', {
      tenantId: bonusTenant.id,
      bonusSpins: bonusData.spins,
      bonusVouchers: bonusData.vouchers,
      reason: bonusData.reason
    });
    
    setShowBonusModal(false);
    setBonusData({ spins: 0, vouchers: 0, reason: '' });
    fetchAllUsage(); // Refresh
    alert('Bonus added successfully!');
  } catch (err) {
    alert('Failed to add bonus');
  }
};

// Add modal JSX:
{showBonusModal && bonusTenant && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold text-amber-500 mb-4">
        Add Bonus to {bonusTenant.name}
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bonus Spins</label>
          <input
            type="number"
            value={bonusData.spins}
            onChange={(e) => setBonusData({ ...bonusData, spins: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Bonus Vouchers</label>
          <input
            type="number"
            value={bonusData.vouchers}
            onChange={(e) => setBonusData({ ...bonusData, vouchers: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Reason</label>
          <input
            type="text"
            value={bonusData.reason}
            onChange={(e) => setBonusData({ ...bonusData, reason: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            placeholder="e.g., Billing issue compensation"
          />
        </div>
      </div>
      
      <div className="flex gap-3 mt-6">
        <button
          onClick={submitBonus}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 rounded-lg"
        >
          Add Bonus
        </button>
        <button
          onClick={() => setShowBonusModal(false)}
          className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 🌱 PHASE 6: SEED DEFAULT PLANS

### **Step 6.1: Update Subscription Plans**

**File:** `prisma/seed.ts` (or create if doesn't exist)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update existing subscription plans with new limits
  
  await prisma.subscriptionPlan.upsert({
    where: { name: 'Free Trial' },
    update: {
      spinsPerMonth: 500,
      vouchersPerMonth: 200
    },
    create: {
      name: 'Free Trial',
      price: 0,
      interval: 'MONTHLY',
      campaignsPerMonth: 1,
      spinsPerCampaign: 500,
      spinsPerMonth: 500,
      vouchersPerMonth: 200,
      socialMediaEnabled: false,
      customBranding: false,
      advancedAnalytics: false
    }
  });
  
  await prisma.subscriptionPlan.upsert({
    where: { name: 'Starter' },
    update: {
      spinsPerMonth: 5000,
      vouchersPerMonth: 2000
    },
    create: {
      name: 'Starter',
      price: 99900, // ₹999 in paise
      interval: 'MONTHLY',
      campaignsPerMonth: 3,
      spinsPerCampaign: 5000,
      spinsPerMonth: 5000,
      vouchersPerMonth: 2000,
      socialMediaEnabled: true,
      customBranding: false,
      advancedAnalytics: false
    }
  });
  
  await prisma.subscriptionPlan.upsert({
    where: { name: 'Pro' },
    update: {
      spinsPerMonth: 50000,
      vouchersPerMonth: 20000
    },
    create: {
      name: 'Pro',
      price: 499900, // ₹4,999 in paise
      interval: 'MONTHLY',
      campaignsPerMonth: 999,
      spinsPerCampaign: 50000,
      spinsPerMonth: 50000,
      vouchersPerMonth: 20000,
      socialMediaEnabled: true,
      customBranding: true,
      advancedAnalytics: true
    }
  });
  
  console.log('✅ Subscription plans seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run:**
```bash
npx tsx prisma/seed.ts
```

---

## ✅ TESTING CHECKLIST

### **Test 1: Spin Limit Enforcement**
1. ✅ Create test tenant with "Free Trial" plan (500 spins/month)
2. ✅ Create 500 spins via API
3. ✅ Attempt 501st spin → Should be blocked with error message
4. ✅ Check usage API shows 500/500

### **Test 2: Voucher Limit Enforcement**
1. ✅ Use same test tenant (200 vouchers/month)
2. ✅ Win prizes 200 times (creates 200 vouchers)
3. ✅ Attempt to win 201st prize → Voucher creation should fail
4. ✅ Check usage API shows 200/200

### **Test 3: Bonus Spins**
1. ✅ Login as Super Admin
2. ✅ Go to tenant management
3. ✅ Click "Add Bonus" for test tenant
4. ✅ Add 1000 bonus spins
5. ✅ Check usage shows 500/1500 (500 base + 1000 bonus)
6. ✅ Customer can now spin 1000 more times

### **Test 4: Usage Widget Display**
1. ✅ Login as tenant admin
2. ✅ See usage widget on dashboard
3. ✅ Progress bars show correct percentages
4. ✅ Warning appears when > 80% used

### **Test 5: Monthly Reset**
1. ✅ Manually change MonthlyUsage record to previous month
2. ✅ Make new spin
3. ✅ Should create new MonthlyUsage record for current month
4. ✅ Counter starts at 1/5000

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Database Migration**
```bash
npx prisma db push
```

### **Step 2: Seed Plans**
```bash
npx tsx prisma/seed.ts
```

### **Step 3: Test Locally**
```bash
npm run dev
```

### **Step 4: Deploy to Vercel**
```bash
git add .
git commit -m "feat: subscription limits and usage tracking"
git push origin main
```

---

## 📊 EXPECTED RESULTS AFTER IMPLEMENTATION

### **For Tenant Admin:**
- ✅ See usage widget: "Spins: 3,247 / 5,000 (65%)"
- ✅ Get warning at 80% usage
- ✅ See upgrade prompt when limit reached
- ✅ Can click upgrade link (future: billing integration)

### **For Super Admin:**
- ✅ See all tenants' usage in one table
- ✅ Identify tenants approaching limits
- ✅ Add bonus spins/vouchers to any tenant
- ✅ Track why bonuses were given (reason field)

### **For System:**
- ✅ Block spins when quota exceeded
- ✅ Block voucher creation when quota exceeded
- ✅ Auto-reset counters each month
- ✅ Track usage history

---

## 🎯 SUCCESS CRITERIA

- [x] Database schema updated without errors
- [x] Spin API blocks after limit reached
- [x] Voucher creation blocks after limit reached
- [x] Usage widget shows on tenant dashboard
- [x] Super Admin can view all usage
- [x] Super Admin can add bonus spins
- [x] Error messages are user-friendly
- [x] No breaking changes to existing features

---

## 🆘 TROUBLESHOOTING

### **Issue: Migration fails**
```bash
# Reset database (DEV ONLY)
npx prisma migrate reset
npx prisma db push
```

### **Issue: Usage not updating**
- Check `incrementSpinUsage()` is called AFTER spin creation
- Check `incrementVoucherUsage()` is called AFTER voucher creation
- Check MonthlyUsage record exists for current month

### **Issue: Limits not enforced**
- Check `canCreateSpin()` is called BEFORE spin creation
- Check `canCreateVoucher()` is called BEFORE voucher creation
- Check return value is checked properly

### **Issue: Bonus not applying**
- Check TenantLimitOverride record was created
- Check `calculateEffectiveLimits()` includes override
- Check override hasn't expired

---

## 📞 SUPPORT

**Questions? Issues?**
- Check existing implementations in `lib/usageLimits.ts`
- Review this plan step-by-step
- Test each phase independently
- Check Prisma logs for errors

**Estimated Time:** 17-20 hours total
**Priority Files:** 
1. `prisma/schema.prisma` (database)
2. `lib/usageLimits.ts` (core logic)
3. `app/api/spin/route.ts` (enforcement)
4. `lib/voucher-service.ts` (enforcement)
5. `app/admin/super/dashboard/page.tsx` (super admin UI)

---

**✨ Good luck, Kiro! This will be a game-changer for the platform! ✨**
