# 🚀 SUPER ADMIN - MISSING CONTROLS CHECKLIST

## WHAT SUPER ADMIN ALREADY HAS ✅

### **Existing Features:**
- ✅ View all tenants
- ✅ Create new tenants
- ✅ Edit tenant (name, slug, plan, contact)
- ✅ Delete tenants (with cascade warnings)
- ✅ Assign subscription plans
- ✅ Configure WhatsApp per tenant (override)
- ✅ Reset tenant admin passwords
- ✅ Activate/deactivate tenants
- ✅ View platform stats dashboard
- ✅ Manage subscription plans (create/edit)
- ✅ Set plan features (maxSpins, maxCampaigns)
- ✅ Authentication & password management

---

## ❌ WHAT'S MISSING - CRITICAL CONTROLS

### **1. SUBSCRIPTION USAGE LIMITS** 🔴 **HIGH PRIORITY**

**What's Missing:**
- ❌ No `spinsPerMonth` field in SubscriptionPlan
- ❌ No `vouchersPerMonth` field in SubscriptionPlan  
- ❌ No MonthlyUsage tracking table
- ❌ Can't see tenant's current usage (Spins: 3,247/5,000)
- ❌ Can't see usage percentage/progress bars
- ❌ No alerts when tenant approaching limit

**What Super Admin Needs:**
```
Tenant Details Page:
├─ Current Plan: Starter (₹999/month)
├─ Spins Used: 3,247 / 5,000 (65%)
├─ Vouchers Created: 1,023 / 2,000 (51%)
├─ Days Until Reset: 14
└─ Usage Trend: ▲ 15% from last month
```

**APIs Needed:**
- `GET /api/admin/super/tenants/:id/usage` - Get usage for tenant
- `PUT /api/admin/super/tenants/:id/limits` - Override limits

---

### **2. MANUAL LIMIT OVERRIDES** 🔴 **HIGH PRIORITY**

**What's Missing:**
- ❌ Can't give bonus spins to tenant
- ❌ Can't temporarily increase limits
- ❌ Can't reset usage mid-month
- ❌ Can't set custom limits per tenant

**What Super Admin Needs:**
```
Bonus/Override Actions:
├─ Add Bonus Spins: [+1000 spins]
├─ Reset Monthly Usage: [Reset to 0]
├─ Custom Limit: Override to [__] spins
└─ Extend Validity: Add [7] days
```

**Use Case:**
```
Cafe Delight (tenant) complains about billing issue
↓
Super Admin gives +1,000 bonus spins
↓
Usage becomes: 3,247 / 6,000 (instead of 5,000)
↓
Problem solved, customer happy
```

---

### **3. VOUCHER OVERSIGHT** 🟡 **MEDIUM PRIORITY**

**What's Missing:**
- ❌ Can't view all vouchers across all tenants
- ❌ Can't search vouchers globally
- ❌ Can't see which tenant has most redemptions
- ❌ Can't manually void/cancel vouchers
- ❌ Can't see fraud patterns

**What Super Admin Needs:**
```
Global Voucher View:
├─ Search: By code, phone, tenant
├─ Filter: By status (active/redeemed/expired)
├─ Filter: By tenant
├─ Filter: By date range
└─ Bulk Actions: Export, void, extend expiry
```

**Example:**
```
Search: "CAFE-ABC123"
Result: 
  - Tenant: Cafe Delight
  - Customer: Rahul (+91 9876...)
  - Prize: Free Coffee
  - Status: Redeemed on 27 Jan 2026
  - Merchant: Staff #5
```

---

### **4. CAMPAIGN MANAGEMENT** 🟡 **MEDIUM PRIORITY**

**What's Missing:**
- ❌ Can't view all campaigns across tenants
- ❌ Can't pause tenant's campaign
- ❌ Can't clone campaigns between tenants
- ❌ Can't see campaign performance comparison

**What Super Admin Needs:**
```
Global Campaign View:
├─ All Active Campaigns: 127
├─ Search by tenant/name
├─ Quick Actions:
│   ├─ View campaign details
│   ├─ Pause/unpause
│   ├─ Clone to another tenant
│   └─ Delete
└─ Performance:
    - Top performing campaign
    - Lowest engagement
```

---

### **5. BILLING & REVENUE** 🔴 **HIGH PRIORITY**

**What's Missing:**
- ❌ No billing/payment integration
- ❌ Can't see revenue per tenant
- ❌ Can't see total MRR (Monthly Recurring Revenue)
- ❌ Can't track failed payments
- ❌ Can't see subscription renewal dates
- ❌ No invoice generation

**What Super Admin Needs:**
```
Revenue Dashboard:
├─ Total MRR: ₹3,92,000
├─ New Revenue This Month: ₹45,000
├─ Churned Revenue: ₹12,000
├─ Failed Payments: 3 tenants
└─ Upcoming Renewals:
    - Cafe Delight: 3 days
    - FitZone Gym: 7 days
```

**Payment Tracking:**
```
Tenant: Cafe Delight
├─ Plan: Starter Monthly (₹999)
├─ Status: Active
├─ Next Billing: 3 Feb 2026
├─ Payment Method: Razorpay
├─ Invoice History: [View 12 invoices]
└─ Actions: [Generate Invoice] [Cancel Subscription]
```

---

### **6. ANALYTICS & INSIGHTS** 🟡 **MEDIUM PRIORITY**

**What's Missing:**
- ❌ Can't see platform-wide redemption rate
- ❌ Can't compare tenant performance
- ❌ Can't see growth trends
- ❌ Can't identify power users vs inactive tenants
- ❌ No churn risk indicators

**What Super Admin Needs:**
```
Platform Analytics:
├─ Total Spins (All Time): 2.4M
├─ Average Redemption Rate: 62%
├─ Top 10 Tenants by Engagement
├─ Bottom 10 Tenants (Churn Risk)
└─ Growth Metrics:
    - New tenants this month: +12
    - Active tenants: 98 / 127 (77%)
    - Churned: 5 this month
```

**Tenant Comparison:**
```
Rank | Tenant      | Spins  | Vouchers | Redemption
─────┼─────────────┼────────┼──────────┼────────────
1    | FitZone     | 28K    | 8.4K     | 78%
2    | Cafe D      | 5K     | 2K       | 65%
3    | Salon       | 450    | 180      | 45%
```

---

### **7. TENANT IMPERSONATION** 🟢 **LOW PRIORITY (Nice-to-Have)**

**What's Missing:**
- ❌ Can't "login as tenant" to see their view
- ❌ Hard to debug tenant-reported issues
- ❌ Can't test features as tenant

**What Super Admin Needs:**
```
Tenant Actions:
├─ [View Dashboard As Tenant]
├─ [Login As Tenant Admin]
└─ [Preview Customer View]
```

**Use Case:**
```
Tenant reports: "Campaign not showing!"
↓
Super Admin clicks "Login As Tenant"
↓
Sees exact dashboard tenant sees
↓
Debugs issue directly
```

---

### **8. NOTIFICATION MANAGEMENT** 🟢 **LOW PRIORITY**

**What's Missing:**
- ❌ Can't send broadcast to all tenants
- ❌ Can't notify specific tenant
- ❌ No system-wide announcements
- ❌ Can't communicate plan changes

**What Super Admin Needs:**
```
Communications:
├─ Send Email to All Tenants
├─ Send Email to Specific Tenant
├─ System Announcements (in-app banner)
└─ Templates:
    - Price increase notification
    - New feature announcement
    - Maintenance window alert
```

---

### **9. AUDIT LOGS** 🟡 **MEDIUM PRIORITY**

**What's Missing:**
- ❌ No activity tracking for super admin actions
- ❌ Can't see who edited what tenant
- ❌ No history of plan changes
- ❌ Can't audit tenant deletions

**What Super Admin Needs:**
```
Audit Log:
Date       | Admin  | Action           | Target
───────────┼────────┼──────────────────┼─────────────────
27 Jan 10am| SA #1  | Edit Tenant      | Cafe Delight
27 Jan 9am | SA #1  | Add Bonus Spins  | FitZone (+1000)
26 Jan 5pm | SA #2  | Delete Tenant    | Old Cafe
26 Jan 3pm | SA #1  | Create Plan      | Enterprise
```

---

### **10. ADVANCED SECURITY** 🟡 **MEDIUM PRIORITY**

**What's Missing:**
- ❌ Can't see login attempts by tenant
- ❌ Can't detect suspicious activity
- ❌ No fraud alerts (too many spins)
- ❌ Can't temporarily lock tenant account
- ❌ No 2FA for super admin

**What Super Admin Needs:**
```
Security Dashboard:
├─ Failed Login Attempts: 3 today
├─ Suspicious Activity:
│   - Cafe Delight: 50K spins in 1 hour ⚠️
│   - Salon: 200 users created in 1 day ⚠️
└─ Actions:
    ├─ Lock Tenant Account
    ├─ Reset Tenant Password
    └─ Investigate Activity
```

---

### **11. BULK OPERATIONS** 🟢 **LOW PRIORITY**

**What's Missing:**
- ❌ Can't bulk update tenant plans
- ❌ Can't bulk grant bonus spins
- ❌ Can't export all tenant data
- ❌ Can't bulk send emails

**What Super Admin Needs:**
```
Bulk Actions:
├─ Select Multiple Tenants: [✓] [✓] [✓]
├─ Actions:
│   ├─ Change Plan: All → Pro
│   ├─ Add Bonus: +500 spins each
│   ├─ Send Email: Custom message
│   └─ Export: CSV/Excel
```

---

### **12. WHATSAPP MONITORING** 🟡 **MEDIUM PRIORITY**

**What's Missing:**
- ❌ Can't see WhatsApp delivery status globally
- ❌ Can't see which tenants have WA configured
- ❌ Can't test tenant's WhatsApp config
- ❌ No failed message tracking

**What Super Admin Needs:**
```
WhatsApp Status:
├─ Tenants with WA Configured: 87 / 127
├─ Messages Sent Today: 1,247
├─ Failed Deliveries: 12
└─ By Tenant:
    - Cafe Delight: ✅ Configured, 127 sent
    - FitZone: ❌ Not configured
    - Salon: ✅ Configured, 23 failed
```

---

## 📊 PRIORITY MATRIX

### **PHASE 1: MUST HAVE** (Week 1-2)
1. ✅ Subscription Usage Limits (spins/vouchers per month)
2. ✅ Monthly Usage Tracking
3. ✅ Usage Display in Tenant Details
4. ✅ Manual Limit Overrides (bonus spins)
5. ✅ Billing Dashboard (MRR, revenue)

### **PHASE 2: SHOULD HAVE** (Week 3-4)
6. ✅ Global Voucher View & Search
7. ✅ Campaign Management Across Tenants
8. ✅ Platform Analytics Dashboard
9. ✅ Audit Logs
10. ✅ WhatsApp Monitoring

### **PHASE 3: NICE TO HAVE** (Future)
11. ✅ Tenant Impersonation
12. ✅ Notification Management
13. ✅ Bulk Operations
14. ✅ Advanced Security (Fraud detection)

---

## 🎯 IMPLEMENTATION SUMMARY

### **Database Changes Needed:**
```prisma
// Add to SubscriptionPlan
model SubscriptionPlan {
  spinsPerMonth     Int @default(5000)    // ← NEW
  vouchersPerMonth  Int @default(2000)    // ← NEW
}

// Add new table
model MonthlyUsage {                      // ← NEW TABLE
  id        String   @id @default(cuid())
  tenantId  String
  month     Int
  year      Int
  spinsUsed     Int @default(0)
  vouchersUsed  Int @default(0)
  @@unique([tenantId, month, year])
}

// Add new table
model TenantLimitOverride {               // ← NEW TABLE
  id        String @id @default(cuid())
  tenantId  String
  bonusSpins    Int @default(0)
  bonusVouchers Int @default(0)
  reason    String?
  createdAt DateTime @default(now())
}

// Add new table
model AuditLog {                          // ← NEW TABLE
  id        String   @id @default(cuid())
  adminId   String
  action    String
  targetType String  // "Tenant", "Plan", "Campaign"
  targetId   String
  data      Json?
  createdAt DateTime @default(now())
}
```

### **New APIs Needed:**
```
GET    /api/admin/super/usage             - Platform usage
GET    /api/admin/super/tenants/:id/usage - Tenant usage
POST   /api/admin/super/tenants/:id/bonus - Add bonus spins
GET    /api/admin/super/vouchers          - All vouchers
GET    /api/admin/super/campaigns         - All campaigns
GET    /api/admin/super/analytics         - Platform analytics
GET    /api/admin/super/audit-logs        - Audit trail
GET    /api/admin/super/whatsapp-status   - WA monitoring
POST   /api/admin/super/impersonate       - Login as tenant
```

### **New UI Pages Needed:**
```
/admin/super/usage           - Platform usage dashboard
/admin/super/vouchers        - Global voucher view
/admin/super/campaigns       - All campaigns
/admin/super/analytics       - Analytics & insights
/admin/super/billing         - Revenue tracking
/admin/super/audit           - Audit logs
/admin/super/security        - Security dashboard
```

---

## ✅ ESTIMATED IMPLEMENTATION TIME

| Feature | Time |
|---------|------|
| Subscription Limits & Usage | 8 hours |
| Manual Overrides (Bonus Spins) | 3 hours |
| Global Voucher View | 4 hours |
| Billing & Revenue Dashboard | 6 hours |
| Platform Analytics | 5 hours |
| Campaign Management | 3 hours |
| Audit Logs | 4 hours |
| WhatsApp Monitoring | 3 hours |
| Tenant Impersonation | 2 hours |
| Bulk Operations | 3 hours |
| **TOTAL** | **41 hours** |

**Phased Approach:**
- Phase 1 (Must Have): 17 hours
- Phase 2 (Should Have): 16 hours
- Phase 3 (Nice to Have): 8 hours

---

## 🚀 NEXT STEPS

**Immediate Actions:**
1. Implement subscription limits (spinsPerMonth, vouchersPerMonth)
2. Create MonthlyUsage tracking
3. Add usage display to tenant details page
4. Build manual override system (bonus spins)
5. Create basic billing dashboard

**This gives Super Admin FULL CONTROL over:**
✅ Who can use what (subscription plans)  
✅ How much they've used (usage tracking)  
✅ Override when needed (bonus features)  
✅ Monitor everything (analytics)  
✅ Audit actions (audit logs)  
✅ Support tenants (impersonation, overrides)  

**Ready to implement Phase 1?** Let me know!
