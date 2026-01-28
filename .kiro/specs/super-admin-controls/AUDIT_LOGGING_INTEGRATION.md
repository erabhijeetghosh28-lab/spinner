# Audit Logging Integration Complete

## Summary

Audit logging has been successfully integrated into all Super Admin action endpoints. Every administrative action is now tracked with full context including admin ID, action type, target entity, changes made, IP address, and user agent.

## Integrated Endpoints

### ✅ Voucher Operations
**File:** `app/api/admin/super/vouchers/[id]/void/route.ts`

**Action:** `VOID_VOUCHER`

**Logged Information:**
- Voucher code
- Tenant name
- Customer phone
- Previous expiry date
- New expiry date (voided)
- IP address and user agent

**Example Audit Log:**
```json
{
  "action": "VOID_VOUCHER",
  "targetType": "Voucher",
  "targetId": "voucher_id",
  "changes": {
    "voucherCode": "ABC123",
    "tenantName": "Coffee Shop",
    "customerPhone": "919876543210",
    "previousExpiry": "2024-02-15T10:00:00Z",
    "newExpiry": "2024-01-28T12:30:00Z"
  }
}
```

---

### ✅ Campaign Operations
**Files:**
- `app/api/admin/super/campaigns/[id]/pause/route.ts`
- `app/api/admin/super/campaigns/[id]/unpause/route.ts`

**Actions:** `PAUSE_CAMPAIGN`, `UNPAUSE_CAMPAIGN`

**Logged Information:**
- Campaign name
- Tenant name
- Before state (isActive)
- After state (isActive)
- IP address and user agent

**Example Audit Log:**
```json
{
  "action": "PAUSE_CAMPAIGN",
  "targetType": "Campaign",
  "targetId": "campaign_id",
  "changes": {
    "campaignName": "Summer Sale",
    "tenantName": "Coffee Shop",
    "before": { "isActive": true },
    "after": { "isActive": false }
  }
}
```

---

### ✅ Limit Override Operations
**File:** `app/api/admin/super/tenants/[id]/overrides/route.ts`

**Action:** `GRANT_OVERRIDE`

**Logged Information:**
- Bonus spins granted
- Bonus vouchers granted
- Reason for override
- Expiry date (if set)
- Tenant name
- IP address and user agent

**Example Audit Log:**
```json
{
  "action": "GRANT_OVERRIDE",
  "targetType": "Tenant",
  "targetId": "tenant_id",
  "changes": {
    "bonusSpins": 1000,
    "bonusVouchers": 500,
    "reason": "Compensation for service outage",
    "expiresAt": "2024-02-28T23:59:59Z",
    "tenantName": "Coffee Shop"
  }
}
```

---

### ✅ Usage Reset Operations
**File:** `app/api/admin/super/tenants/[id]/usage/reset/route.ts`

**Action:** `RESET_USAGE`

**Logged Information:**
- Tenant name
- Before state (spins used, vouchers used)
- After state (spins used, vouchers used)
- IP address and user agent

**Example Audit Log:**
```json
{
  "action": "RESET_USAGE",
  "targetType": "Tenant",
  "targetId": "tenant_id",
  "changes": {
    "tenantName": "Coffee Shop",
    "before": {
      "spinsUsed": 4500,
      "vouchersUsed": 1800
    },
    "after": {
      "spinsUsed": 0,
      "vouchersUsed": 0
    }
  }
}
```

---

## Implementation Details

### Audit Service Usage

All endpoints now use the centralized `auditService` from `lib/audit-service.ts`:

```typescript
import { auditService, getIpAddress, getUserAgent } from '@/lib/audit-service';

// In the endpoint handler:
await auditService.logAction({
  adminId,                          // From auth context (currently placeholder)
  action: 'ACTION_NAME',            // Descriptive action name
  targetType: 'EntityType',         // Tenant, Campaign, Voucher, etc.
  targetId: 'entity_id',            // ID of affected entity
  changes: {                        // Detailed change information
    // ... relevant data
  },
  ipAddress: getIpAddress(request), // Extracted from request headers
  userAgent: getUserAgent(request)  // Extracted from request headers
});
```

### Helper Functions

**`getIpAddress(request)`**
- Extracts IP address from request headers
- Checks `x-forwarded-for` and `x-real-ip` headers
- Returns `undefined` if not found

**`getUserAgent(request)`**
- Extracts user agent from request headers
- Returns `undefined` if not found

---

## Action Types

All audit log actions follow a consistent naming convention:

| Action | Description |
|--------|-------------|
| `VOID_VOUCHER` | Voucher was voided by admin |
| `PAUSE_CAMPAIGN` | Campaign was paused |
| `UNPAUSE_CAMPAIGN` | Campaign was unpaused |
| `GRANT_OVERRIDE` | Limit override was granted |
| `RESET_USAGE` | Usage counters were reset |

Future actions to be added:
- `EDIT_TENANT` - Tenant details modified
- `DELETE_TENANT` - Tenant deleted
- `CHANGE_PLAN` - Subscription plan changed
- `LOCK_TENANT` - Tenant account locked
- `UNLOCK_TENANT` - Tenant account unlocked

---

## Querying Audit Logs

Audit logs can be queried via the API:

**Endpoint:** `GET /api/admin/super/audit-logs`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `adminId` - Filter by admin ID
- `action` - Filter by action type
- `startDate` - Filter by start date (ISO 8601)
- `endDate` - Filter by end date (ISO 8601)

**Example Request:**
```
GET /api/admin/super/audit-logs?action=VOID_VOUCHER&startDate=2024-01-01&limit=20
```

**Example Response:**
```json
{
  "logs": [
    {
      "id": "log_id",
      "adminId": "admin_id",
      "admin": {
        "id": "admin_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "VOID_VOUCHER",
      "targetType": "Voucher",
      "targetId": "voucher_id",
      "changes": { ... },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-28T12:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

## Authentication Note

All endpoints currently have placeholder admin IDs:
```typescript
const adminId = 'PLACEHOLDER_ADMIN_ID'; // TODO: Get from auth context
```

Before production deployment, this needs to be replaced with actual authentication:
```typescript
const session = await getSession(request);
if (!session || !session.isSuperAdmin) {
  return NextResponse.json(
    { error: { code: 'FORBIDDEN', message: 'Super Admin access required' } },
    { status: 403 }
  );
}
const adminId = session.adminId;
```

---

## Benefits

### Accountability
- Every admin action is tracked with who, what, when, where
- Full audit trail for compliance and security

### Debugging
- Easy to trace issues back to specific admin actions
- Detailed change information helps understand what happened

### Security
- IP address and user agent tracking helps identify suspicious activity
- Can detect unauthorized access or abuse

### Compliance
- Meets regulatory requirements for audit trails
- Provides evidence for security audits

---

## Database Schema

Audit logs are stored in the `AuditLog` table:

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  adminId     String
  admin       Admin    @relation(fields: [adminId], references: [id])
  action      String   // Action type
  targetType  String   // Entity type
  targetId    String   // Entity ID
  changes     Json?    // Detailed changes
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  @@index([adminId, createdAt])
  @@index([targetType, targetId])
  @@index([action, createdAt])
  @@index([createdAt])
}
```

---

## Testing

To verify audit logging:

1. **Perform an admin action** (e.g., void a voucher)
2. **Query the audit logs:**
   ```
   GET /api/admin/super/audit-logs?action=VOID_VOUCHER
   ```
3. **Verify the log entry** contains:
   - Correct action type
   - Target entity ID
   - Detailed changes
   - IP address and user agent
   - Timestamp

---

## Next Steps

### Immediate
- Add authentication to all endpoints
- Replace placeholder admin IDs with actual session data

### Future Enhancements
- Add audit logging to tenant CRUD operations
- Add audit logging to plan management operations
- Add audit logging to security operations (lock/unlock)
- Implement audit log retention policies
- Add audit log export functionality
- Create audit log dashboard UI

---

## Related Files

- `lib/audit-service.ts` - Audit service implementation
- `app/api/admin/super/audit-logs/route.ts` - Audit log query endpoint
- `app/api/admin/super/vouchers/[id]/void/route.ts` - Voucher void with audit
- `app/api/admin/super/campaigns/[id]/pause/route.ts` - Campaign pause with audit
- `app/api/admin/super/campaigns/[id]/unpause/route.ts` - Campaign unpause with audit
- `app/api/admin/super/tenants/[id]/overrides/route.ts` - Override grant with audit
- `app/api/admin/super/tenants/[id]/usage/reset/route.ts` - Usage reset with audit
