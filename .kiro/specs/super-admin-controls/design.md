# Design Document: Super Admin Controls

## Overview

The Super Admin Controls feature provides comprehensive management capabilities for platform administrators to oversee a multi-tenant spin-the-wheel SaaS platform. The system is organized into three phases:

- **Phase 1 (Must Have)**: Subscription limits, usage tracking, manual overrides, and billing dashboard
- **Phase 2 (Should Have)**: Global voucher oversight, campaign management, platform analytics, audit logs, and WhatsApp monitoring
- **Phase 3 (Nice to Have)**: Tenant impersonation, notification management, bulk operations, and advanced security

The design follows a RESTful API architecture with Next.js 14 App Router, Prisma ORM with PostgreSQL, and React with TypeScript for the frontend.

## Architecture

### System Components

1. **Database Layer**: PostgreSQL with Prisma ORM for data persistence
2. **API Layer**: RESTful endpoints under `/api/admin/super/` for Super Admin operations
3. **Service Layer**: Business logic for usage tracking, limit enforcement, and analytics
4. **UI Layer**: React components with Tailwind CSS for Super Admin dashboard
5. **Authentication Layer**: Role-based access control restricting endpoints to Super Admins

### Data Flow

```
Super Admin UI → API Endpoint → Service Layer → Prisma Client → PostgreSQL
                                      ↓
                                 Audit Logging
```

### Key Design Decisions

1. **Monthly Usage Tracking**: Use a separate `MonthlyUsage` table with composite unique key on `(tenantId, month, year)` to efficiently track and reset usage
2. **Limit Overrides**: Store overrides separately in `TenantLimitOverride` table to maintain audit trail and allow multiple active overrides
3. **Audit Logging**: Centralized `AuditLog` table captures all Super Admin actions with JSON payload for flexibility
4. **Computed Limits**: Effective limits = base plan limits + sum of active overrides, calculated at runtime
5. **Soft Deletes**: Use `isActive` flags rather than hard deletes to preserve data integrity
6. **Pagination**: All list endpoints support pagination with default page size of 50 items

## Components and Interfaces

### Database Schema Changes

#### New Tables

**MonthlyUsage**
```prisma
model MonthlyUsage {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  month         Int      // 1-12
  year          Int      // 2024, 2025, etc.
  spinsUsed     Int      @default(0)
  vouchersUsed  Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([tenantId, month, year])
  @@index([tenantId, year, month])
}
```

**TenantLimitOverride**
```prisma
model TenantLimitOverride {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  bonusSpins      Int      @default(0)
  bonusVouchers   Int      @default(0)
  reason          String
  grantedBy       String   // Admin ID
  grantedByAdmin  Admin    @relation(fields: [grantedBy], references: [id])
  expiresAt       DateTime? // Null = permanent, otherwise expires at date
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  @@index([tenantId, isActive])
  @@index([expiresAt])
}
```

**AuditLog**
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  adminId     String
  admin       Admin    @relation(fields: [adminId], references: [id])
  action      String   // "EDIT_TENANT", "DELETE_TENANT", "GRANT_OVERRIDE", etc.
  targetType  String   // "Tenant", "Campaign", "Voucher", "SubscriptionPlan"
  targetId    String
  changes     Json?    // Stores before/after values or action details
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  @@index([adminId, createdAt])
  @@index([targetType, targetId])
  @@index([action, createdAt])
  @@index([createdAt])
}
```

**Notification**
```prisma
model Notification {
  id            String   @id @default(cuid())
  subject       String
  body          String   @db.Text
  recipientType String   // "ALL_TENANTS", "SPECIFIC_TENANT"
  recipientId   String?  // Tenant ID if specific
  sentBy        String   // Admin ID
  sentByAdmin   Admin    @relation(fields: [sentBy], references: [id])
  recipientCount Int     @default(0)
  sentAt        DateTime @default(now())
  
  @@index([sentBy, sentAt])
  @@index([recipientType, sentAt])
}
```

**SecurityEvent**
```prisma
model SecurityEvent {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventType   String   // "FAILED_LOGIN", "SUSPICIOUS_SPINS", "SUSPICIOUS_USERS"
  severity    String   // "LOW", "MEDIUM", "HIGH"
  description String
  metadata    Json?    // Additional event details
  resolved    Boolean  @default(false)
  resolvedBy  String?  // Admin ID
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  
  @@index([tenantId, resolved])
  @@index([severity, resolved])
  @@index([createdAt])
}
```

#### Modified Tables

**SubscriptionPlan** - Add usage limit fields
```prisma
model SubscriptionPlan {
  // ... existing fields ...
  spinsPerMonth    Int @default(5000)
  vouchersPerMonth Int @default(2000)
  // ... existing fields ...
}
```

**Tenant** - Add security tracking fields
```prisma
model Tenant {
  // ... existing fields ...
  isLocked          Boolean  @default(false)
  lockedAt          DateTime?
  lockedBy          String?  // Admin ID
  failedLoginCount  Int      @default(0)
  lastFailedLogin   DateTime?
  // ... existing fields ...
  
  monthlyUsage      MonthlyUsage[]
  limitOverrides    TenantLimitOverride[]
  securityEvents    SecurityEvent[]
}
```

**Admin** - Add relations
```prisma
model Admin {
  // ... existing fields ...
  auditLogs         AuditLog[]
  notifications     Notification[]
  limitOverrides    TenantLimitOverride[]
}
```

### API Endpoints

#### Phase 1: Subscription & Billing

**GET /api/admin/super/usage/platform**
- Returns: Platform-wide usage statistics
- Response: `{ totalSpins, totalVouchers, activeTenantsCount, totalTenantsCount }`

**GET /api/admin/super/tenants/:id/usage**
- Returns: Detailed usage for specific tenant
- Response: `{ currentMonth: { spinsUsed, spinsLimit, vouchersUsed, vouchersLimit, daysUntilReset }, previousMonth: { ... }, trend: { spinsChange, vouchersChange } }`

**POST /api/admin/super/tenants/:id/overrides**
- Body: `{ bonusSpins?, bonusVouchers?, reason, expiresAt? }`
- Returns: Created override record
- Side effect: Creates audit log entry

**PUT /api/admin/super/tenants/:id/usage/reset**
- Resets current month usage to zero
- Returns: Updated usage record
- Side effect: Creates audit log entry

**GET /api/admin/super/billing/dashboard**
- Returns: Revenue and billing metrics
- Response: `{ mrr, newRevenue, churnedRevenue, upcomingRenewals: [], failedPayments: [], revenueByPlan: {} }`

**GET /api/admin/super/billing/renewals**
- Query params: `?days=7` (upcoming within N days)
- Returns: List of tenants with upcoming renewals

#### Phase 2: Oversight & Analytics

**GET /api/admin/super/vouchers**
- Query params: `?page, ?limit, ?search, ?tenantId, ?status, ?startDate, ?endDate`
- Returns: Paginated voucher list with tenant and user details
- Response: `{ vouchers: [], total, page, limit }`

**PUT /api/admin/super/vouchers/:id/void**
- Body: `{ reason }`
- Marks voucher as voided
- Side effect: Creates audit log entry

**GET /api/admin/super/vouchers/export**
- Query params: Same as voucher list
- Returns: CSV file download

**GET /api/admin/super/campaigns**
- Query params: `?page, ?limit, ?search, ?tenantId, ?status`
- Returns: Paginated campaign list with performance metrics
- Response: `{ campaigns: [], total, page, limit }`

**PUT /api/admin/super/campaigns/:id/pause**
- Pauses active campaign
- Side effect: Creates audit log entry

**PUT /api/admin/super/campaigns/:id/unpause**
- Unpauses paused campaign
- Side effect: Creates audit log entry

**GET /api/admin/super/analytics/platform**
- Returns: Platform-wide analytics
- Response: `{ totalSpins, totalVouchers, avgRedemptionRate, topTenants: [], bottomTenants: [], newTenantsThisMonth, churnedTenantsThisMonth, activePercentage, growthTrends: {} }`

**GET /api/admin/super/analytics/tenants/comparison**
- Returns: Tenant performance comparison table
- Response: `{ tenants: [{ id, name, spins, vouchers, redemptionRate, rank }] }`

**GET /api/admin/super/audit-logs**
- Query params: `?page, ?limit, ?adminId, ?action, ?startDate, ?endDate`
- Returns: Paginated audit log entries
- Response: `{ logs: [], total, page, limit }`

**GET /api/admin/super/whatsapp/status**
- Returns: WhatsApp configuration and delivery status
- Response: `{ configuredCount, unconfiguredCount, messagesToday, failedToday, tenantStatus: [] }`

**GET /api/admin/super/whatsapp/failures**
- Query params: `?tenantId, ?startDate, ?endDate`
- Returns: Failed WhatsApp message details

#### Phase 3: Advanced Features

**POST /api/admin/super/impersonate**
- Body: `{ tenantId }`
- Returns: Impersonation session token
- Side effect: Creates audit log entry

**DELETE /api/admin/super/impersonate**
- Ends impersonation session
- Side effect: Creates audit log entry

**POST /api/admin/super/notifications**
- Body: `{ subject, body, recipientType, recipientId?, templateId? }`
- Sends notification to tenants
- Returns: Notification record with recipient count
- Side effect: Creates audit log entry

**GET /api/admin/super/notifications/history**
- Query params: `?page, ?limit`
- Returns: Paginated notification history

**POST /api/admin/super/bulk/plan-change**
- Body: `{ tenantIds: [], newPlanId }`
- Changes plan for multiple tenants
- Returns: `{ successCount, failureCount, errors: [] }`
- Side effect: Creates audit log entry for each tenant

**POST /api/admin/super/bulk/grant-bonus**
- Body: `{ tenantIds: [], bonusSpins?, bonusVouchers?, reason }`
- Grants bonus to multiple tenants
- Returns: `{ successCount, failureCount, errors: [] }`
- Side effect: Creates audit log entry for each tenant

**POST /api/admin/super/bulk/export**
- Body: `{ tenantIds: [] }`
- Returns: CSV file with tenant data

**GET /api/admin/super/security/dashboard**
- Returns: Security alerts and suspicious activity
- Response: `{ alerts: [], suspiciousActivity: [], failedLogins: [] }`

**PUT /api/admin/super/tenants/:id/lock**
- Body: `{ reason }`
- Locks tenant account
- Side effect: Creates audit log entry

**PUT /api/admin/super/tenants/:id/unlock**
- Unlocks tenant account
- Side effect: Creates audit log entry

### Service Layer

**UsageService**
```typescript
class UsageService {
  // Get or create current month usage record
  async getCurrentMonthUsage(tenantId: string): Promise<MonthlyUsage>
  
  // Increment spin counter
  async incrementSpins(tenantId: string): Promise<void>
  
  // Increment voucher counter
  async incrementVouchers(tenantId: string): Promise<void>
  
  // Calculate effective limits (base + overrides)
  async getEffectiveLimits(tenantId: string): Promise<{ spins: number, vouchers: number }>
  
  // Check if tenant can perform action
  async canSpin(tenantId: string): Promise<boolean>
  async canCreateVoucher(tenantId: string): Promise<boolean>
  
  // Reset usage for tenant
  async resetUsage(tenantId: string): Promise<void>
  
  // Get usage with trend comparison
  async getUsageWithTrend(tenantId: string): Promise<UsageWithTrend>
}
```

**BillingService**
```typescript
class BillingService {
  // Calculate MRR
  async calculateMRR(): Promise<number>
  
  // Get revenue metrics
  async getRevenueMetrics(): Promise<RevenueMetrics>
  
  // Get upcoming renewals
  async getUpcomingRenewals(days: number): Promise<Tenant[]>
  
  // Get failed payments
  async getFailedPayments(): Promise<Tenant[]>
  
  // Get revenue breakdown by plan
  async getRevenueByPlan(): Promise<Record<string, number>>
}
```

**AnalyticsService**
```typescript
class AnalyticsService {
  // Get platform-wide statistics
  async getPlatformStats(): Promise<PlatformStats>
  
  // Get tenant performance comparison
  async getTenantComparison(): Promise<TenantComparison[]>
  
  // Calculate redemption rate
  async calculateRedemptionRate(tenantId?: string): Promise<number>
  
  // Get growth trends
  async getGrowthTrends(): Promise<GrowthTrends>
  
  // Identify churn risk tenants
  async getChurnRiskTenants(): Promise<Tenant[]>
}
```

**AuditService**
```typescript
class AuditService {
  // Log admin action
  async logAction(params: {
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    changes?: any,
    ipAddress?: string,
    userAgent?: string
  }): Promise<void>
  
  // Query audit logs
  async queryLogs(filters: AuditLogFilters): Promise<PaginatedResult<AuditLog>>
}
```

**SecurityService**
```typescript
class SecurityService {
  // Track failed login
  async trackFailedLogin(tenantId: string): Promise<void>
  
  // Check for suspicious activity
  async detectSuspiciousActivity(tenantId: string): Promise<SecurityEvent[]>
  
  // Lock/unlock tenant
  async lockTenant(tenantId: string, adminId: string, reason: string): Promise<void>
  async unlockTenant(tenantId: string, adminId: string): Promise<void>
  
  // Get security dashboard data
  async getSecurityDashboard(): Promise<SecurityDashboard>
}
```

## Data Models

### TypeScript Interfaces

```typescript
interface UsageWithTrend {
  currentMonth: {
    spinsUsed: number
    spinsLimit: number
    spinsPercentage: number
    vouchersUsed: number
    vouchersLimit: number
    vouchersPercentage: number
    daysUntilReset: number
  }
  previousMonth: {
    spinsUsed: number
    vouchersUsed: number
  }
  trend: {
    spinsChange: number // Percentage change
    vouchersChange: number // Percentage change
  }
}

interface RevenueMetrics {
  mrr: number
  newRevenue: number
  churnedRevenue: number
  upcomingRenewals: TenantWithRenewal[]
  failedPayments: TenantWithPaymentIssue[]
  revenueByPlan: Record<string, number>
  activeTenantsCount: number
  totalTenantsCount: number
}

interface TenantWithRenewal {
  id: string
  name: string
  subscriptionEnd: Date
  daysUntilRenewal: number
  planName: string
  planPrice: number
}

interface PlatformStats {
  totalSpins: number
  totalVouchers: number
  avgRedemptionRate: number
  topTenants: TenantPerformance[]
  bottomTenants: TenantPerformance[]
  newTenantsThisMonth: number
  churnedTenantsThisMonth: number
  activePercentage: number
  growthTrends: GrowthTrends
}

interface TenantPerformance {
  id: string
  name: string
  spins: number
  vouchers: number
  redemptionRate: number
  rank: number
}

interface GrowthTrends {
  spinsGrowth: number // Percentage
  vouchersGrowth: number // Percentage
  tenantsGrowth: number // Percentage
  revenueGrowth: number // Percentage
}

interface SecurityDashboard {
  alerts: SecurityEvent[]
  suspiciousActivity: SuspiciousActivity[]
  failedLogins: FailedLoginSummary[]
}

interface SuspiciousActivity {
  tenantId: string
  tenantName: string
  activityType: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  detectedAt: Date
}

interface FailedLoginSummary {
  tenantId: string
  tenantName: string
  failedCount: number
  lastFailedAt: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Limit Enforcement
*For any* tenant at or exceeding their monthly limit (spins or vouchers), attempting to perform the limited action SHALL be rejected with an error, and the usage counter SHALL remain unchanged.
**Validates: Requirements 1.3, 1.4**

### Property 2: Usage Record Initialization
*For any* tenant and any calendar month, when usage data is requested, a MonthlyUsage record SHALL exist or be created with initial counters set to zero.
**Validates: Requirements 2.1**

### Property 3: Counter Increment Invariant
*For any* usage counter (spins or vouchers), after performing the corresponding action, the counter value SHALL be exactly one greater than before the action.
**Validates: Requirements 2.2, 2.3**

### Property 4: Monthly Reset Property
*For any* tenant, at the beginning of a new calendar month, the usage counters SHALL be reset to zero while preserving the previous month's historical record.
**Validates: Requirements 2.4, 2.5**

### Property 5: Usage Display Accuracy
*For any* tenant, the displayed usage information SHALL accurately reflect the current MonthlyUsage record values, calculated limits, and percentage utilization.
**Validates: Requirements 3.1, 3.2**

### Property 6: Days Until Reset Calculation
*For any* date within a month, the calculated days until monthly reset SHALL equal the number of days remaining until the first day of the next month.
**Validates: Requirements 3.3**

### Property 7: Usage Trend Calculation
*For any* tenant with historical usage data, the displayed trend SHALL equal ((current month usage - previous month usage) / previous month usage) * 100.
**Validates: Requirements 3.4**

### Property 8: Warning Threshold Display
*For any* tenant with usage at or above 80% of any limit, a warning indicator SHALL be displayed in the tenant details view.
**Validates: Requirements 3.5**

### Property 9: Override Grant Success
*For any* tenant and any positive bonus amount with a valid reason, granting a limit override SHALL create a TenantLimitOverride record and increase the effective limit.
**Validates: Requirements 4.1, 4.2**

### Property 10: Override Reason Requirement
*For any* override grant attempt without a reason string, the operation SHALL be rejected with a validation error.
**Validates: Requirements 4.3**

### Property 11: Override Audit Trail
*For any* created limit override, a corresponding TenantLimitOverride record SHALL exist containing adminId, timestamp, bonus amounts, and reason.
**Validates: Requirements 4.4**

### Property 12: Additive Limit Calculation
*For any* tenant with active overrides, the effective limit SHALL equal the base subscription plan limit plus the sum of all active bonus amounts.
**Validates: Requirements 4.5**

### Property 13: Usage Reset Operation
*For any* tenant, after a usage reset operation, both spinsUsed and vouchersUsed counters SHALL equal zero.
**Validates: Requirements 4.6**

### Property 14: Override Display Completeness
*For any* tenant with active overrides, the tenant details view SHALL display all active override records with their bonus amounts and reasons.
**Validates: Requirements 4.7**

### Property 15: MRR Calculation Accuracy
*For any* point in time, the calculated MRR SHALL equal the sum of subscription prices for all tenants with subscriptionStatus = "ACTIVE".
**Validates: Requirements 5.1**

### Property 16: New Revenue Tracking
*For any* calendar month, the new revenue SHALL equal the sum of subscription prices for all tenants with subscriptionStart within that month.
**Validates: Requirements 5.2**

### Property 17: Churned Revenue Tracking
*For any* calendar month, the churned revenue SHALL equal the sum of subscription prices for all tenants with subscriptionEnd within that month and subscriptionStatus != "ACTIVE".
**Validates: Requirements 5.3**

### Property 18: Upcoming Renewals Filter
*For any* date D and days parameter N, the upcoming renewals list SHALL contain exactly those tenants where subscriptionEnd is between D and D+N days.
**Validates: Requirements 5.4**

### Property 19: Failed Payments Filter
*For any* tenant with subscriptionStatus = "PAST_DUE" or payment failure flag, that tenant SHALL appear in the failed payments list.
**Validates: Requirements 5.5**

### Property 20: Revenue by Plan Aggregation
*For any* subscription plan, the revenue for that plan SHALL equal the sum of subscription prices for all active tenants on that plan.
**Validates: Requirements 5.6**

### Property 21: Tenant Count Accuracy
*For any* point in time, the active tenant count SHALL equal the count of tenants with isActive=true, and total count SHALL equal all tenant records.
**Validates: Requirements 5.7**

### Property 22: Global Voucher Visibility
*For any* voucher in the database, that voucher SHALL appear in the global voucher view regardless of which tenant it belongs to.
**Validates: Requirements 6.1**

### Property 23: Voucher Search Correctness
*For any* search query (code or phone), the search results SHALL contain all and only those vouchers matching the query criteria.
**Validates: Requirements 6.2, 6.3**

### Property 24: Voucher Filter Correctness
*For any* filter criteria (tenant, status, or date range), the filtered results SHALL contain all and only those vouchers matching all applied filters.
**Validates: Requirements 6.4, 6.5, 6.6**

### Property 25: Voucher Display Completeness
*For any* voucher in the detail view, all required fields (tenant name, customer details, prize name, status, redemption info) SHALL be present and non-null.
**Validates: Requirements 6.7**

### Property 26: Voucher Void Operation
*For any* active voucher, after a void operation, the voucher status SHALL indicate voided and the voucher SHALL not be redeemable.
**Validates: Requirements 6.8**

### Property 27: Voucher Export Completeness
*For any* set of vouchers matching current filters, the exported CSV SHALL contain exactly those vouchers with all required fields.
**Validates: Requirements 6.9**

### Property 28: Global Campaign Visibility
*For any* campaign in the database, that campaign SHALL appear in the global campaign view regardless of which tenant it belongs to.
**Validates: Requirements 7.1**

### Property 29: Campaign Search and Filter Correctness
*For any* search query or filter criteria, the results SHALL contain all and only those campaigns matching the criteria.
**Validates: Requirements 7.2, 7.3, 7.4**

### Property 30: Campaign Display Completeness
*For any* campaign in the detail view, all required fields (tenant name, dates, spin count, voucher count) SHALL be present and accurately calculated.
**Validates: Requirements 7.5, 7.8**

### Property 31: Campaign Pause/Unpause State Transition
*For any* active campaign, after pause operation, isActive SHALL be false; for any paused campaign, after unpause operation, isActive SHALL be true.
**Validates: Requirements 7.6, 7.7**

### Property 32: Platform Aggregation Accuracy
*For any* platform-wide metric (total spins, total vouchers), the value SHALL equal the sum of that metric across all tenants.
**Validates: Requirements 8.1, 8.2**

### Property 33: Average Redemption Rate Calculation
*For any* set of tenants, the average redemption rate SHALL equal the mean of individual tenant redemption rates.
**Validates: Requirements 8.3**

### Property 34: Tenant Ranking Correctness
*For any* ranking query (top N or bottom N), the results SHALL contain exactly N tenants ordered correctly by the ranking metric.
**Validates: Requirements 8.4, 8.5**

### Property 35: Tenant Count by Date Range
*For any* date range, the count of new or churned tenants SHALL equal the count of tenants with createdAt or status change within that range.
**Validates: Requirements 8.6, 8.7**

### Property 36: Active Percentage Calculation
*For any* point in time, the active percentage SHALL equal (count of active tenants / count of total tenants) * 100.
**Validates: Requirements 8.8**

### Property 37: Growth Trend Calculation
*For any* metric and two time periods, the growth trend SHALL equal ((current period value - previous period value) / previous period value) * 100.
**Validates: Requirements 8.9**

### Property 38: Audit Log Creation for Admin Actions
*For any* Super Admin action (edit tenant, delete tenant, change plan, grant override, void voucher, pause/unpause campaign, lock/unlock account), an AuditLog record SHALL be created.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 14.7**

### Property 39: Audit Log Completeness
*For any* AuditLog record, all required fields (adminId, action, targetType, targetId, timestamp) SHALL be present and non-null.
**Validates: Requirements 9.7**

### Property 40: Audit Log Search and Filter Correctness
*For any* search or filter criteria (adminId, action type, date range), the results SHALL contain all and only those audit logs matching the criteria.
**Validates: Requirements 9.8, 9.9, 9.10**

### Property 41: WhatsApp Configuration Count Accuracy
*For any* point in time, the count of tenants with WhatsApp configured plus the count without SHALL equal the total tenant count.
**Validates: Requirements 10.1, 10.2**

### Property 42: WhatsApp Status Display Completeness
*For any* tenant, the WhatsApp status view SHALL display that tenant with accurate configuration status (configured or not configured).
**Validates: Requirements 10.5**

### Property 43: Impersonation Session Creation
*For any* tenant, initiating impersonation SHALL create a valid session that restricts data access to that tenant's scope.
**Validates: Requirements 11.1, 11.4**

### Property 44: Impersonation UI Indicators
*For any* active impersonation session, the UI SHALL display the tenant's dashboard view and a prominent impersonation banner.
**Validates: Requirements 11.2, 11.3**

### Property 45: Impersonation Exit Operation
*For any* active impersonation session, the exit operation SHALL terminate the session and restore Super Admin view.
**Validates: Requirements 11.5**

### Property 46: Impersonation Audit Trail
*For any* impersonation session, exactly two AuditLog records SHALL be created (one for start, one for end).
**Validates: Requirements 11.6**

### Property 47: Notification Composition and Sending
*For any* valid notification content and recipient specification (all tenants or specific tenant), the send operation SHALL succeed and create a Notification record.
**Validates: Requirements 12.1, 12.2, 12.3**

### Property 48: Notification Template Selection
*For any* predefined template, selecting it SHALL populate the notification with the template content.
**Validates: Requirements 12.4**

### Property 49: Notification Audit Trail
*For any* sent notification, an AuditLog record SHALL be created with action type "SEND_NOTIFICATION".
**Validates: Requirements 12.6**

### Property 50: Notification History Completeness
*For any* sent notification, it SHALL appear in the notification history with accurate recipient count and timestamp.
**Validates: Requirements 12.7**

### Property 51: Bulk Operation Tenant Selection
*For any* set of tenants, the selection mechanism SHALL allow selecting all tenants in the set.
**Validates: Requirements 13.1**

### Property 52: Bulk Plan Change Operation
*For any* set of selected tenants and any target plan, the bulk plan change SHALL update subscriptionPlanId for all selected tenants.
**Validates: Requirements 13.2**

### Property 53: Bulk Bonus Grant Operation
*For any* set of selected tenants and any bonus amount, the bulk grant SHALL create a TenantLimitOverride for each selected tenant.
**Validates: Requirements 13.3, 13.4**

### Property 54: Bulk Export Completeness
*For any* set of selected tenants, the exported CSV SHALL contain data for all and only those selected tenants.
**Validates: Requirements 13.5**

### Property 55: Bulk Operation Audit Trail
*For any* bulk operation affecting N tenants, exactly N AuditLog records SHALL be created (one per affected tenant).
**Validates: Requirements 13.6**

### Property 56: Failed Login Tracking
*For any* failed login attempt for a tenant, the failedLoginCount SHALL increment by one and lastFailedLogin SHALL be updated to the current timestamp.
**Validates: Requirements 14.1**

### Property 57: Security Alert Generation
*For any* tenant exceeding a security threshold (>10 failed logins in 1 hour, >1000 spins in 1 hour, >500 users in 1 day), a SecurityEvent record SHALL be created.
**Validates: Requirements 14.2, 14.3, 14.4**

### Property 58: Account Lock State Transition
*For any* tenant, after lock operation, isLocked SHALL be true and access SHALL be denied; after unlock operation, isLocked SHALL be false and access SHALL be restored.
**Validates: Requirements 14.5, 14.6**

### Property 59: Security Dashboard Completeness
*For any* active SecurityEvent with resolved=false, that event SHALL appear in the security dashboard.
**Validates: Requirements 14.8**

## Error Handling

### Validation Errors

1. **Invalid Bonus Amount**: Reject override grants with negative or zero bonus amounts
2. **Missing Reason**: Reject override grants without a reason string
3. **Invalid Date Range**: Reject queries with endDate before startDate
4. **Invalid Tenant ID**: Return 404 for operations on non-existent tenants
5. **Invalid Pagination**: Reject page numbers < 1 or limit values < 1 or > 100

### Authorization Errors

1. **Non-Super Admin Access**: Return 403 for all Super Admin endpoints when user is not a Super Admin
2. **Impersonation Without Permission**: Return 403 if non-Super Admin attempts impersonation
3. **Locked Account Access**: Return 403 when locked tenant attempts to access system

### Business Logic Errors

1. **Limit Already Exceeded**: Return clear error message when tenant at limit attempts action
2. **Invalid Status Transition**: Reject pause on already paused campaign, unpause on active campaign
3. **Void Already Redeemed**: Reject void operation on already redeemed vouchers
4. **Unlock Non-Locked Account**: Return error when attempting to unlock account that isn't locked

### Database Errors

1. **Unique Constraint Violation**: Handle duplicate MonthlyUsage records gracefully
2. **Foreign Key Violation**: Prevent deletion of entities with dependent records
3. **Connection Timeout**: Retry database operations with exponential backoff
4. **Transaction Rollback**: Ensure all-or-nothing semantics for bulk operations

### Error Response Format

All API errors follow consistent format:
```typescript
{
  error: {
    code: string,        // Machine-readable error code
    message: string,     // Human-readable error message
    details?: any        // Optional additional context
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs using randomized testing

### Unit Testing Focus Areas

1. **API Endpoint Integration**: Test each endpoint with specific request/response examples
2. **Service Layer Logic**: Test business logic with concrete scenarios
3. **Database Operations**: Test CRUD operations with specific data
4. **Error Conditions**: Test validation errors, authorization failures, and edge cases
5. **Audit Logging**: Test that specific actions create expected audit log entries

### Property-Based Testing Configuration

- **Library**: Use `fast-check` for TypeScript property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Tagging**: Each property test references its design document property number
- **Tag Format**: `// Feature: super-admin-controls, Property N: [property text]`

### Property Testing Focus Areas

1. **Limit Enforcement** (Properties 1, 12): Generate random tenants with various usage levels and limits
2. **Counter Operations** (Properties 3, 4): Generate random sequences of spins/voucher creations
3. **Calculations** (Properties 7, 15-21, 33, 36, 37): Generate random data and verify mathematical correctness
4. **Search and Filtering** (Properties 23, 24, 29, 40): Generate random datasets and query criteria
5. **Aggregations** (Properties 32, 34, 35): Generate random tenant populations and verify sums/counts
6. **State Transitions** (Properties 31, 58): Generate random state sequences and verify transitions
7. **Audit Logging** (Properties 38, 46, 49, 55): Generate random admin actions and verify log creation

### Test Data Generation

Property tests should generate:
- Random tenant configurations with varying plans and usage levels
- Random date ranges spanning multiple months
- Random sets of vouchers, campaigns, and users
- Random admin actions and bulk operations
- Random security events and thresholds

### Integration Testing

1. **End-to-End Flows**: Test complete workflows (e.g., grant override → verify limit → perform action)
2. **Multi-Tenant Isolation**: Verify data isolation between tenants in global views
3. **Audit Trail Completeness**: Verify audit logs capture all required actions
4. **Performance**: Test pagination and filtering with large datasets (10,000+ records)

### Test Environment Setup

1. **Database**: Use separate test database with Prisma migrations
2. **Seed Data**: Create realistic test data with multiple tenants, plans, and usage patterns
3. **Authentication**: Mock Super Admin authentication for all tests
4. **Cleanup**: Reset database state between test suites

### Example Property Test Structure

```typescript
// Feature: super-admin-controls, Property 1: Limit Enforcement
describe('Limit Enforcement Property', () => {
  it('should reject actions when tenant at or exceeding limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenantId: fc.string(),
          currentUsage: fc.nat(),
          limit: fc.nat()
        }).filter(({ currentUsage, limit }) => currentUsage >= limit),
        async ({ tenantId, currentUsage, limit }) => {
          // Setup: Create tenant with usage at/exceeding limit
          await setupTenantWithUsage(tenantId, currentUsage, limit);
          
          // Action: Attempt to perform limited action
          const result = await attemptSpin(tenantId);
          
          // Assertion: Should be rejected
          expect(result.success).toBe(false);
          expect(result.error).toContain('limit exceeded');
          
          // Verify usage unchanged
          const usage = await getUsage(tenantId);
          expect(usage.spinsUsed).toBe(currentUsage);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Implementation Notes

### Phase 1 Priority

Focus on core subscription management and billing features first:
1. Database schema changes (MonthlyUsage, TenantLimitOverride)
2. Usage tracking service and API endpoints
3. Limit enforcement in existing spin/voucher creation flows
4. Billing dashboard with MRR calculation
5. Manual override functionality

### Phase 2 Dependencies

Phase 2 features depend on Phase 1 completion:
- Global voucher/campaign views require existing data structures
- Analytics require usage tracking to be operational
- Audit logs should be integrated throughout Phase 1

### Phase 3 Considerations

Phase 3 features are independent and can be implemented in any order:
- Impersonation requires session management
- Notifications may require email service integration
- Bulk operations build on single-tenant operations
- Security monitoring requires threshold configuration

### Performance Considerations

1. **Indexing**: Ensure all filter and search fields are indexed
2. **Pagination**: Always paginate large result sets
3. **Caching**: Consider caching MRR and platform stats (refresh every 5 minutes)
4. **Aggregation**: Use database aggregation functions rather than application-level calculations
5. **Batch Operations**: Use database transactions for bulk operations

### Security Considerations

1. **Authorization**: Verify Super Admin role on every endpoint
2. **Audit Logging**: Log all administrative actions with IP and user agent
3. **Rate Limiting**: Implement rate limiting on bulk operation endpoints
4. **Input Validation**: Validate and sanitize all user inputs
5. **SQL Injection**: Use Prisma parameterized queries (automatic protection)

### Migration Strategy

1. **Add New Fields**: Add spinsPerMonth and vouchersPerMonth to existing SubscriptionPlan records with sensible defaults
2. **Backfill Usage**: Create MonthlyUsage records for current month for all existing tenants
3. **Update Spin/Voucher Logic**: Integrate usage tracking into existing creation flows
4. **Deploy Incrementally**: Deploy Phase 1, then Phase 2, then Phase 3
5. **Monitor Performance**: Track query performance and optimize indexes as needed
