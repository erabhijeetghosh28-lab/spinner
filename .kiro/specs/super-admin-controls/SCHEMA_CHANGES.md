# Database Schema Changes for Super Admin Controls

## Overview
This document summarizes the database schema changes implemented for the Super Admin Controls feature (Task 1).

## Modified Models

### 1. SubscriptionPlan
**Added Fields:**
- `spinsPerMonth` (Int, default: 5000) - Maximum spins allowed per month
- `vouchersPerMonth` (Int, default: 2000) - Maximum vouchers allowed per month

**Purpose:** Define monthly usage limits for each subscription tier.

**Requirements Validated:** 1.1, 1.2

---

### 2. Tenant
**Added Fields:**
- `isLocked` (Boolean, default: false) - Account lock status
- `lockedAt` (DateTime?, nullable) - Timestamp when account was locked
- `lockedBy` (String?, nullable) - Admin ID who locked the account
- `failedLoginCount` (Int, default: 0) - Counter for failed login attempts
- `lastFailedLogin` (DateTime?, nullable) - Timestamp of last failed login

**Added Relations:**
- `monthlyUsage` (MonthlyUsage[]) - Monthly usage tracking records
- `limitOverrides` (TenantLimitOverride[]) - Bonus limit grants
- `securityEvents` (SecurityEvent[]) - Security alerts and events

**Purpose:** Track security events and enable account locking functionality.

**Requirements Validated:** 2.1, 4.4, 9.7, 14.1, 14.5, 14.6

---

### 3. Admin
**Added Relations:**
- `auditLogs` (AuditLog[]) - Audit trail of admin actions
- `notifications` (Notification[]) - Notifications sent by admin
- `limitOverrides` (TenantLimitOverride[]) - Limit overrides granted by admin

**Purpose:** Track all administrative actions and maintain accountability.

**Requirements Validated:** 4.4, 9.7, 12.6

---

## New Models

### 4. MonthlyUsage
**Purpose:** Track monthly usage of spins and vouchers per tenant.

**Fields:**
- `id` (String, CUID) - Primary key
- `tenantId` (String) - Foreign key to Tenant
- `month` (Int) - Month number (1-12)
- `year` (Int) - Year (e.g., 2024, 2025)
- `spinsUsed` (Int, default: 0) - Number of spins used this month
- `vouchersUsed` (Int, default: 0) - Number of vouchers created this month
- `createdAt` (DateTime) - Record creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Constraints:**
- Unique constraint on `(tenantId, month, year)` - One record per tenant per month
- Index on `(tenantId, year, month)` - Efficient querying

**Relations:**
- `tenant` - Belongs to Tenant (cascade delete)

**Requirements Validated:** 2.1, 2.2, 2.3, 2.4, 2.5

---

### 5. TenantLimitOverride
**Purpose:** Store manual limit adjustments (bonus spins/vouchers) granted by Super Admins.

**Fields:**
- `id` (String, CUID) - Primary key
- `tenantId` (String) - Foreign key to Tenant
- `bonusSpins` (Int, default: 0) - Additional spins granted
- `bonusVouchers` (Int, default: 0) - Additional vouchers granted
- `reason` (String) - Explanation for the override
- `grantedBy` (String) - Foreign key to Admin
- `expiresAt` (DateTime?, nullable) - Expiration date (null = permanent)
- `isActive` (Boolean, default: true) - Whether override is currently active
- `createdAt` (DateTime) - Grant timestamp

**Indexes:**
- `(tenantId, isActive)` - Find active overrides for tenant
- `(expiresAt)` - Identify expired overrides

**Relations:**
- `tenant` - Belongs to Tenant (cascade delete)
- `grantedByAdmin` - Belongs to Admin

**Requirements Validated:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.7

---

### 6. AuditLog
**Purpose:** Maintain comprehensive audit trail of all Super Admin actions.

**Fields:**
- `id` (String, CUID) - Primary key
- `adminId` (String) - Foreign key to Admin
- `action` (String) - Action type (e.g., "EDIT_TENANT", "GRANT_OVERRIDE")
- `targetType` (String) - Entity type (e.g., "Tenant", "Campaign", "Voucher")
- `targetId` (String) - ID of affected entity
- `changes` (Json?, nullable) - Before/after values or action details
- `ipAddress` (String?, nullable) - IP address of admin
- `userAgent` (String?, nullable) - Browser/client information
- `createdAt` (DateTime) - Action timestamp

**Indexes:**
- `(adminId, createdAt)` - Find actions by admin
- `(targetType, targetId)` - Find actions on specific entity
- `(action, createdAt)` - Find actions by type
- `(createdAt)` - Chronological ordering

**Relations:**
- `admin` - Belongs to Admin

**Requirements Validated:** 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10

---

### 7. Notification
**Purpose:** Track notifications sent to tenants by Super Admins.

**Fields:**
- `id` (String, CUID) - Primary key
- `subject` (String) - Notification subject
- `body` (String, Text) - Notification content
- `recipientType` (String) - "ALL_TENANTS" or "SPECIFIC_TENANT"
- `recipientId` (String?, nullable) - Tenant ID if specific recipient
- `sentBy` (String) - Foreign key to Admin
- `recipientCount` (Int, default: 0) - Number of recipients
- `sentAt` (DateTime) - Send timestamp

**Indexes:**
- `(sentBy, sentAt)` - Find notifications by admin
- `(recipientType, sentAt)` - Find notifications by type

**Relations:**
- `sentByAdmin` - Belongs to Admin

**Requirements Validated:** 12.1, 12.2, 12.3, 12.6, 12.7

---

### 8. SecurityEvent
**Purpose:** Track security alerts and suspicious activity across tenants.

**Fields:**
- `id` (String, CUID) - Primary key
- `tenantId` (String) - Foreign key to Tenant
- `eventType` (String) - Event type (e.g., "FAILED_LOGIN", "SUSPICIOUS_SPINS")
- `severity` (String) - "LOW", "MEDIUM", or "HIGH"
- `description` (String) - Event description
- `metadata` (Json?, nullable) - Additional event details
- `resolved` (Boolean, default: false) - Whether event has been addressed
- `resolvedBy` (String?, nullable) - Admin ID who resolved
- `resolvedAt` (DateTime?, nullable) - Resolution timestamp
- `createdAt` (DateTime) - Event timestamp

**Indexes:**
- `(tenantId, resolved)` - Find unresolved events for tenant
- `(severity, resolved)` - Find high-severity unresolved events
- `(createdAt)` - Chronological ordering

**Relations:**
- `tenant` - Belongs to Tenant (cascade delete)

**Requirements Validated:** 14.1, 14.2, 14.3, 14.4, 14.8

---

## Migration Strategy

### Approach Used
Used `prisma db push` to sync schema changes directly to the database without creating migration files. This approach was chosen because:
1. The database already had tables but no migration history
2. This is a development/staging environment
3. Simpler for rapid iteration during initial development

### For Production Deployment
When deploying to production, consider:
1. Creating proper migration files using `prisma migrate dev`
2. Reviewing generated SQL before applying
3. Backing up database before migration
4. Testing migration on staging environment first

### Default Values
All new fields have sensible defaults:
- `spinsPerMonth`: 5000 (generous default for existing plans)
- `vouchersPerMonth`: 2000 (generous default for existing plans)
- `isLocked`: false (all tenants start unlocked)
- `failedLoginCount`: 0 (no failed attempts initially)
- Counter fields: 0 (start from zero)
- Boolean flags: false (inactive by default)

### Backward Compatibility
All changes are backward compatible:
- New fields are nullable or have defaults
- No existing fields were removed or renamed
- Existing relations remain unchanged
- Cascade deletes ensure referential integrity

---

## Testing

### Schema Validation Tests
Created comprehensive test suite in `prisma/__tests__/schema-validation.test.ts`:

✅ **SubscriptionPlan Model** - Verified new limit fields
✅ **MonthlyUsage Model** - Verified creation and unique constraint
✅ **TenantLimitOverride Model** - Verified admin relation and fields
✅ **AuditLog Model** - Verified all required fields
✅ **Tenant Security Fields** - Verified security tracking fields
✅ **SecurityEvent Model** - Verified tenant relation
✅ **Notification Model** - Verified admin relation

**All 8 tests passed successfully.**

---

## Next Steps

With the database schema in place, the next tasks are:

1. **Task 2:** Implement UsageService for tracking and limit enforcement
2. **Task 3:** Integrate usage tracking into existing spin and voucher flows
3. **Task 4:** Implement tenant usage API endpoints
4. **Task 5:** Implement manual limit override functionality
5. **Task 6:** Implement BillingService and revenue dashboard

---

## References

- **Requirements:** `.kiro/specs/super-admin-controls/requirements.md`
- **Design:** `.kiro/specs/super-admin-controls/design.md`
- **Tasks:** `.kiro/specs/super-admin-controls/tasks.md`
- **Schema File:** `prisma/schema.prisma`
- **Tests:** `prisma/__tests__/schema-validation.test.ts`
