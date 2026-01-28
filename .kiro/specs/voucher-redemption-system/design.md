# Design Document: Voucher Redemption System

## Overview

The voucher redemption system extends the spin wheel platform with a complete voucher lifecycle: automatic generation upon prize wins, delivery via WhatsApp with QR codes, merchant validation/redemption using phone cameras, and comprehensive admin management. The system is built on the existing multi-tenant architecture and integrates seamlessly with current services (Spin API, WhatsApp Service, UploadThing).

### Key Design Principles

1. **Non-Breaking Integration**: All changes are additive - existing features continue to work unchanged
2. **Multi-Tenant Isolation**: Strict tenant boundaries prevent cross-tenant voucher access
3. **Mobile-First Scanning**: QR scanning uses phone cameras via browser APIs (no physical scanners)
4. **Graceful Degradation**: System continues operating even if QR generation or WhatsApp delivery fails
5. **Audit Trail**: Complete tracking of voucher lifecycle (creation, validation attempts, redemption)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Customer       │   Merchant      │      Admin              │
│  (WhatsApp)     │   (Scanner UI)  │   (Dashboard UI)        │
└────────┬────────┴────────┬────────┴──────────┬──────────────┘
         │                 │                   │
         │                 │                   │
┌────────▼─────────────────▼───────────────────▼──────────────┐
│                     API Layer                                │
├──────────────────────────────────────────────────────────────┤
│  POST /api/vouchers/validate                                 │
│  POST /api/vouchers/redeem                                   │
│  POST /api/vouchers/lookup-phone                             │
│  GET  /api/vouchers (admin)                                  │
│  POST /api/spin (modified to create vouchers)                │
└────────┬─────────────────────────────────────────────────────┘
         │
┌────────▼─────────────────────────────────────────────────────┐
│                   Service Layer                              │
├──────────────────┬───────────────────┬───────────────────────┤
│ Voucher Service  │  QR Generator     │  WhatsApp Service     │
│ - generate()     │  - createQR()     │  - sendVoucher()      │
│ - validate()     │  - uploadImage()  │  (existing)           │
│ - redeem()       │                   │                       │
│ - lookupByPhone()│                   │                       │
└────────┬─────────┴───────────────────┴───────────────────────┘
         │
┌────────▼─────────────────────────────────────────────────────┐
│                   Data Layer                                 │
├──────────────────────────────────────────────────────────────┤
│  Voucher Model (new)                                         │
│  Prize Model (extended)                                      │
│  Spin, EndUser, Tenant Models (relations added)              │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow: Prize Win to Redemption

1. **Prize Win**: Customer spins wheel → Spin API detects prize win
2. **Voucher Creation**: Spin API calls Voucher Service → generates unique code
3. **QR Generation**: If enabled, QR Generator creates 400x400 PNG → uploads to UploadThing
4. **Notification**: WhatsApp Service sends code + QR image to customer
5. **Validation**: Merchant scans QR or looks up by phone → Voucher Service validates
6. **Redemption**: Merchant confirms → Voucher Service marks as redeemed

## Components and Interfaces

### 1. Voucher Service

Core service handling all voucher operations.

**Interface:**

```typescript
interface VoucherService {
  // Generate unique voucher code with tenant prefix
  generateVoucherCode(tenantSlug: string): string
  
  // Create voucher after prize win
  createVoucher(params: CreateVoucherParams): Promise<Voucher>
  
  // Validate voucher before redemption
  validateVoucher(code: string, tenantId: string): Promise<ValidationResult>
  
  // Redeem a valid voucher
  redeemVoucher(code: string, merchantId: string, tenantId: string): Promise<RedemptionResult>
  
  // Look up vouchers by customer phone
  getVouchersByPhone(phone: string, tenantId: string): Promise<Voucher[]>
  
  // Admin: Get all vouchers with filters
  getVouchers(tenantId: string, filters: VoucherFilters): Promise<VoucherList>
  
  // Admin: Get voucher statistics
  getVoucherStats(tenantId: string): Promise<VoucherStats>
}

interface CreateVoucherParams {
  spinId: string
  prizeId: string
  userId: string
  tenantId: string
  validityDays: number
  redemptionLimit: number
  generateQR: boolean
}

interface ValidationResult {
  valid: boolean
  voucher?: Voucher
  reason?: string // "expired" | "redeemed" | "not_found" | "wrong_tenant" | "limit_reached"
  details?: {
    expiresAt?: Date
    redeemedAt?: Date
    redeemedBy?: string
  }
}

interface RedemptionResult {
  success: boolean
  voucher?: Voucher
  error?: string
}

interface VoucherFilters {
  status?: "all" | "active" | "redeemed" | "expired"
  search?: string // code or phone
  startDate?: Date
  endDate?: Date
}

interface VoucherStats {
  total: number
  active: number
  redeemed: number
  expired: number
}
```

**Implementation Details:**

- **Code Generation**: Uses `nanoid` with custom alphabet (uppercase letters + numbers) for readability
- **Format**: `{TENANT_PREFIX}-{NANOID}` (e.g., "ACME-X7K9P2M4")
- **Collision Handling**: Retry up to 3 times if code exists (extremely unlikely with nanoid)
- **Tenant Prefix**: First 4 characters of tenant slug, uppercase
- **Validation Logic**: Check existence → tenant match → expiration → redemption status → limit

### 2. QR Generator

Generates QR code images and uploads them.

**Interface:**

```typescript
interface QRGenerator {
  // Generate QR code image from voucher code
  generateQRImage(voucherCode: string): Promise<Buffer>
  
  // Upload QR image to UploadThing
  uploadQRImage(imageBuffer: Buffer, voucherCode: string): Promise<string>
  
  // Combined: generate and upload
  createAndUploadQR(voucherCode: string): Promise<string | null>
}
```

**Implementation Details:**

- **Library**: `qrcode` npm package
- **Format**: PNG, 400x400 pixels
- **Error Correction**: Level M (15% recovery)
- **Margin**: 4 modules (standard)
- **Upload**: Uses existing UploadThing file router
- **Error Handling**: Returns null if generation/upload fails, logs error, continues without QR

### 3. Scanner Interface

Web-based QR scanner using phone camera.

**Interface:**

```typescript
interface ScannerInterface {
  // Initialize camera and start scanning
  startScanning(): Promise<void>
  
  // Stop camera and cleanup
  stopScanning(): void
  
  // Handle detected QR code
  onCodeDetected(code: string): void
  
  // Display validation result
  showValidationResult(result: ValidationResult): void
}
```

**Implementation Details:**

- **Library**: `html5-qrcode` for browser-based scanning
- **Camera**: Rear camera preferred on mobile devices
- **Permissions**: Request camera access on page load
- **Auto-validation**: Automatically calls validation API when QR detected
- **HTTPS Required**: Camera API only works on secure contexts
- **Fallback**: Manual code entry if camera unavailable

### 4. API Endpoints

**POST /api/vouchers/validate**

Validates a voucher code without redeeming it.

```typescript
// Request
{
  code: string
}

// Response
{
  valid: boolean
  voucher?: {
    code: string
    prize: { name: string, description: string }
    customer: { name: string, phone: string }
    expiresAt: string
    redemptionCount: number
    redemptionLimit: number
  }
  reason?: string
  details?: object
}
```

**POST /api/vouchers/redeem**

Redeems a valid voucher.

```typescript
// Request
{
  code: string
}

// Response
{
  success: boolean
  voucher?: Voucher
  error?: string
}
```

**POST /api/vouchers/lookup-phone**

Finds vouchers by customer phone number.

```typescript
// Request
{
  phone: string
}

// Response
{
  vouchers: Array<{
    code: string
    prize: { name: string }
    status: "active" | "redeemed" | "expired"
    expiresAt: string
    createdAt: string
  }>
}
```

**GET /api/vouchers**

Admin endpoint to list all vouchers with filters.

```typescript
// Query params
{
  status?: "all" | "active" | "redeemed" | "expired"
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

// Response
{
  vouchers: Voucher[]
  stats: VoucherStats
  pagination: { page: number, limit: number, total: number }
}
```

## Data Models

### Voucher Model (New)

```typescript
model Voucher {
  id                String    @id @default(cuid())
  code              String    @unique
  qrImageUrl        String?
  
  // Relationships
  spinId            String
  spin              Spin      @relation(fields: [spinId], references: [id])
  
  prizeId           String
  prize             Prize     @relation(fields: [prizeId], references: [id])
  
  userId            String
  user              EndUser   @relation(fields: [userId], references: [id])
  
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  
  // Redemption tracking
  isRedeemed        Boolean   @default(false)
  redeemedAt        DateTime?
  redeemedBy        String?
  redeemedByUser    User?     @relation(fields: [redeemedBy], references: [id])
  
  // Configuration
  expiresAt         DateTime
  redemptionLimit   Int       @default(1)
  redemptionCount   Int       @default(0)
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Indexes for performance
  @@index([code])
  @@index([tenantId])
  @@index([userId])
  @@index([expiresAt])
  @@index([isRedeemed])
  @@index([tenantId, userId])
  @@index([tenantId, isRedeemed])
}
```

### Prize Model (Extended)

```typescript
model Prize {
  // ... existing fields ...
  
  // New voucher configuration fields
  voucherValidityDays    Int      @default(30)
  voucherRedemptionLimit Int      @default(1)
  sendQRCode             Boolean  @default(true)
  
  // New relation
  vouchers               Voucher[]
}
```

### Extended Relations

```typescript
// Spin model
model Spin {
  // ... existing fields ...
  vouchers  Voucher[]
}

// EndUser model
model EndUser {
  // ... existing fields ...
  vouchers  Voucher[]
}

// Tenant model
model Tenant {
  // ... existing fields ...
  vouchers  Voucher[]
}

// User model (merchant)
model User {
  // ... existing fields ...
  redeemedVouchers  Voucher[]
}
```

## Integration Points

### 1. Spin API Integration

**Modification**: Extend spin result handler to create vouchers.

```typescript
// In spin API handler, after prize win is determined
async function handlePrizeWin(spin: Spin, prize: Prize) {
  // Existing logic...
  
  // New: Create voucher if prize has voucher settings
  if (prize.voucherValidityDays > 0) {
    const voucher = await voucherService.createVoucher({
      spinId: spin.id,
      prizeId: prize.id,
      userId: spin.userId,
      tenantId: spin.tenantId,
      validityDays: prize.voucherValidityDays,
      redemptionLimit: prize.voucherRedemptionLimit,
      generateQR: prize.sendQRCode
    })
    
    // Send WhatsApp notification
    await whatsappService.sendVoucherNotification(voucher)
  }
  
  // Continue existing logic...
}
```

### 2. WhatsApp Service Extension

**Modification**: Add voucher notification method.

```typescript
// Extend existing WhatsApp service
async function sendVoucherNotification(voucher: Voucher) {
  const customer = await getCustomer(voucher.userId)
  const prize = await getPrize(voucher.prizeId)
  
  const message = `
🎉 Congratulations! You won: ${prize.name}

Your voucher code: ${voucher.code}
Valid until: ${formatDate(voucher.expiresAt)}

Show this code at the store to claim your prize!
  `.trim()
  
  // Use existing WhatsApp API
  if (voucher.qrImageUrl) {
    await sendWhatsAppImage(customer.phone, voucher.qrImageUrl, message)
  } else {
    await sendWhatsAppText(customer.phone, message)
  }
}
```

### 3. Prize Configuration Form

**Modification**: Add voucher settings fields to prize form.

```typescript
// Add to prize configuration form
<FormSection title="Voucher Settings">
  <NumberInput
    label="Validity (days)"
    name="voucherValidityDays"
    defaultValue={30}
    min={1}
    max={365}
  />
  
  <NumberInput
    label="Redemption Limit"
    name="voucherRedemptionLimit"
    defaultValue={1}
    min={1}
    max={10}
  />
  
  <Checkbox
    label="Generate QR Code"
    name="sendQRCode"
    defaultChecked={true}
  />
</FormSection>
```

## UI Components

### 1. Scanner Page (`/admin/[tenantSlug]/scanner`)

**Layout:**

```
┌─────────────────────────────────────┐
│  [Back] Scan Voucher                │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │     Camera Feed / QR View     │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Start Camera] [Stop Camera]       │
│                                     │
│  ─────────── OR ───────────         │
│                                     │
│  Manual Entry:                      │
│  [________________] [Validate]      │
│                                     │
│  ─────────── OR ───────────         │
│                                     │
│  Phone Lookup:                      │
│  [________________] [Search]        │
│                                     │
├─────────────────────────────────────┤
│  Validation Result:                 │
│  [Result display area]              │
└─────────────────────────────────────┘
```

**Features:**
- Camera preview with QR detection overlay
- Auto-validation on QR detection
- Manual code entry fallback
- Phone number lookup
- Real-time validation feedback
- Customer and prize details display

### 2. Voucher Dashboard (`/admin/[tenantSlug]/vouchers`)

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Voucher Management                                 │
├─────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │Total │ │Active│ │Redeem│ │Expire│              │
│  │ 150  │ │  45  │ │  80  │ │  25  │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
├─────────────────────────────────────────────────────┤
│  Filters: [All ▼] Search: [_______] [Export CSV]   │
├─────────────────────────────────────────────────────┤
│  Code      │ Customer │ Prize  │ Status │ Expires  │
│  ──────────┼──────────┼────────┼────────┼──────────│
│  ACME-X7K9 │ John Doe │ 10% Off│ Active │ Dec 31   │
│  ACME-M4P2 │ Jane S.  │ Free   │Redeemed│ Dec 25   │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Statistics cards (total, active, redeemed, expired)
- Status filter dropdown
- Search by code or phone
- Date range filter
- Export to CSV
- Sortable columns
- Pagination


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 3.2 and 3.3 are subsumed by 1.3 (QR image format and dimensions)
- Property 5.6 is covered by the combination of 4.5 and 5.1 (limit enforcement through validation)
- Properties 6.5, 10.1, 10.2, 10.3, 10.4, 10.5 are all variations of tenant isolation, consolidated into comprehensive tenant isolation properties
- Properties 11.1, 12.5, 12.6 are duplicates of earlier properties
- Multiple message content properties (11.2-11.5) can be combined into a single comprehensive property

The following properties represent the unique, non-redundant correctness guarantees:

### Property 1: Voucher Creation on Prize Win

*For any* prize win event, when a customer wins a prize with voucher settings configured (voucherValidityDays > 0), the system should create exactly one voucher with a unique code associated with that spin, prize, user, and tenant.

**Validates: Requirements 1.1, 1.6**

### Property 2: Voucher Code Format

*For any* generated voucher code, the code should match the pattern `{TENANT_PREFIX}-{UNIQUE_ID}` where TENANT_PREFIX is the first 4 uppercase characters of the tenant slug and UNIQUE_ID is a unique identifier.

**Validates: Requirements 1.2**

### Property 3: Voucher Code Uniqueness

*For any* set of generated vouchers across all tenants, no two vouchers should have the same code.

**Validates: Requirements 2.1**

### Property 4: QR Code Properties

*For any* voucher created with sendQRCode enabled, the generated QR image should be a PNG file with dimensions of exactly 400x400 pixels, and scanning the QR code should return the original voucher code (round-trip property).

**Validates: Requirements 1.3, 3.1**

### Property 5: QR Upload Integration

*For any* voucher with a generated QR code, the QR image should be uploaded via UploadThing and the voucher's qrImageUrl field should contain a valid URL.

**Validates: Requirements 1.4**

### Property 6: Expiration Date Calculation

*For any* voucher created with a prize having voucherValidityDays = N, the voucher's expiresAt date should be exactly N days after the creation timestamp.

**Validates: Requirements 1.5**

### Property 7: WhatsApp Notification Content

*For any* voucher created, the WhatsApp notification should include the voucher code, prize name, expiration date, and (if present) the QR image URL.

**Validates: Requirements 1.7, 11.2, 11.3, 11.4, 11.5**

### Property 8: Validation - Code Existence

*For any* voucher code submitted for validation, if the code exists in the database and belongs to the requesting tenant, validation should return the voucher details; otherwise, it should return an error with reason "Voucher not found" or "Invalid voucher".

**Validates: Requirements 4.1, 4.2**

### Property 9: Validation - Expiration Check

*For any* voucher being validated, if the current date is after the voucher's expiresAt date, validation should fail with reason "expired" and include the expiration date in the details.

**Validates: Requirements 4.3**

### Property 10: Validation - Redemption Status Check

*For any* voucher being validated, if isRedeemed is true and redemptionCount >= redemptionLimit, validation should fail with reason "redeemed" or "limit_reached" and include redemption details.

**Validates: Requirements 4.4, 4.5**

### Property 11: Validation - Complete Response

*For any* voucher that passes all validation checks, the validation response should include the voucher code, customer information (name, phone), prize details (name, description), expiration date, redemption count, and redemption limit.

**Validates: Requirements 4.7**

### Property 12: Validation - Error Reasons

*For any* voucher that fails validation, the response should include a specific reason field indicating why validation failed (not_found, expired, redeemed, wrong_tenant, limit_reached).

**Validates: Requirements 4.6**

### Property 13: Redemption Requires Validation

*For any* redemption attempt, the voucher must first pass validation; if validation fails, redemption should be rejected without modifying the voucher state.

**Validates: Requirements 5.1, 5.7**

### Property 14: Redemption State Changes

*For any* successful voucher redemption, the voucher should have isRedeemed set to true, redeemedAt set to the current timestamp, redeemedBy set to the merchant's user ID, and redemptionCount incremented by exactly one.

**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 15: Phone Lookup Returns Tenant-Scoped Vouchers

*For any* phone number lookup request, the returned vouchers should only include vouchers where the customer's phone matches the query AND the voucher's tenantId matches the requesting merchant's tenantId.

**Validates: Requirements 6.1, 6.5**

### Property 16: Phone Lookup Response Structure

*For any* voucher returned by phone lookup, the response should include voucher status (active, expired, or redeemed) and prize details.

**Validates: Requirements 6.2, 6.3**

### Property 17: Admin Statistics Accuracy

*For any* tenant's voucher set, the statistics should accurately count total vouchers, active vouchers (not redeemed and not expired), redeemed vouchers (isRedeemed = true), and expired vouchers (expiresAt < current date and not redeemed).

**Validates: Requirements 8.1**

### Property 18: Admin Dashboard Response Structure

*For any* voucher displayed in the admin dashboard, the response should include voucher code, customer name, prize name, status, creation date, and expiration date.

**Validates: Requirements 8.2**

### Property 19: Admin Filter Correctness

*For any* filter criteria applied (status, search term, date range), the returned voucher list should only include vouchers that match all specified filter conditions and belong to the admin's tenant.

**Validates: Requirements 8.3, 8.5, 8.7**

### Property 20: Export Data Consistency

*For any* export request with filters applied, the exported data should contain exactly the same vouchers as displayed in the filtered dashboard view.

**Validates: Requirements 8.6**

### Property 21: Tenant Isolation

*For any* voucher operation (create, validate, redeem, lookup, list), the system should enforce strict tenant boundaries such that users can only access vouchers belonging to their own tenant, and cross-tenant access attempts should be rejected.

**Validates: Requirements 10.2, 10.3, 10.4, 10.5**

## Error Handling

### Error Categories

1. **Validation Errors**: User-facing errors with specific reasons
   - Voucher not found
   - Voucher expired
   - Voucher already redeemed
   - Redemption limit reached
   - Wrong tenant / Invalid voucher

2. **Integration Errors**: Graceful degradation
   - QR generation failure → Continue without QR, log error
   - WhatsApp delivery failure → Log error, don't fail voucher creation
   - Upload failure → Continue without QR, log error

3. **System Errors**: Transaction safety
   - Database failures → Rollback, return error
   - Concurrent redemption → Use database locks to prevent double-redemption

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: string // User-friendly message
  code: string // Machine-readable error code
  details?: object // Additional context
}
```

### Critical Error Scenarios

**Double Redemption Prevention:**
- Use database transaction with row-level locking
- Check redemption status within transaction
- Atomic increment of redemptionCount

**Expired Voucher Handling:**
- Calculate expiration at validation time (don't rely on cached status)
- Include expiration date in error response for customer service

**Tenant Isolation Enforcement:**
- Always include tenantId in WHERE clauses
- Validate tenant match before any state changes
- Log cross-tenant access attempts for security monitoring

## Testing Strategy

### Dual Testing Approach

The voucher system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of voucher creation, validation, and redemption
- Edge cases: expired vouchers, redeemed vouchers, invalid codes, wrong tenant
- Integration points: Spin API integration, WhatsApp service calls
- Error handling: QR generation failures, WhatsApp delivery failures
- Database relationships and queries

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs (see Correctness Properties above)
- Comprehensive input coverage through randomization
- Invariants: code uniqueness, tenant isolation, expiration calculation
- Round-trip properties: QR generation/scanning
- State transitions: voucher lifecycle from creation to redemption

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: voucher-redemption-system, Property {N}: {property_text}`
- Custom generators for: voucher codes, tenant IDs, phone numbers, dates

**Example Property Test Structure**:

```typescript
import fc from 'fast-check'

// Feature: voucher-redemption-system, Property 3: Voucher Code Uniqueness
test('all generated voucher codes are unique', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.record({
        tenantSlug: fc.string({ minLength: 4 }),
        prizeId: fc.uuid(),
        userId: fc.uuid()
      }), { minLength: 10, maxLength: 100 }),
      async (voucherParams) => {
        const codes = await Promise.all(
          voucherParams.map(p => voucherService.generateVoucherCode(p.tenantSlug))
        )
        const uniqueCodes = new Set(codes)
        return codes.length === uniqueCodes.size
      }
    ),
    { numRuns: 100 }
  )
})
```

### Test Data Generators

**Custom Generators Needed**:
- `arbVoucherCode()`: Generates valid voucher code format
- `arbTenantId()`: Generates valid tenant IDs
- `arbPhoneNumber()`: Generates valid phone numbers
- `arbFutureDate()`: Generates dates in the future (for expiration)
- `arbPastDate()`: Generates dates in the past (for expired vouchers)
- `arbVoucher()`: Generates complete voucher objects with all relationships

### Integration Testing

**Key Integration Scenarios**:
1. End-to-end flow: Prize win → Voucher creation → WhatsApp notification → Validation → Redemption
2. Phone lookup flow: Create vouchers → Lookup by phone → Verify results
3. Admin dashboard: Create vouchers with various states → Verify statistics and filters
4. Multi-tenant isolation: Create vouchers for multiple tenants → Verify isolation

### Test Coverage Goals

- **Unit Test Coverage**: 80%+ of service layer code
- **Property Test Coverage**: All 21 correctness properties implemented
- **Integration Test Coverage**: All critical user flows
- **Edge Case Coverage**: All error scenarios from Requirements 12

### Testing Dependencies

```json
{
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0"
  }
}
```

## Implementation Notes

### Dependencies to Install

```json
{
  "dependencies": {
    "nanoid": "^5.0.0",
    "qrcode": "^1.5.3",
    "html5-qrcode": "^2.3.8",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5",
    "fast-check": "^3.15.0"
  }
}
```

### Database Migration Considerations

1. **Add Voucher table** with all fields and indexes
2. **Extend Prize table** with voucher configuration fields (with defaults)
3. **Add relations** to Spin, EndUser, Tenant, User models
4. **Create indexes** for performance on frequently queried fields

### Security Considerations

1. **Tenant Isolation**: Always validate tenantId in all queries
2. **HTTPS Required**: Scanner page requires HTTPS for camera access
3. **Rate Limiting**: Apply rate limits to validation/redemption endpoints to prevent abuse
4. **Audit Logging**: Log all redemption attempts for security monitoring
5. **Code Entropy**: Use nanoid with sufficient length (12+ characters) for uniqueness

### Performance Considerations

1. **Database Indexes**: Create indexes on code, tenantId, userId, expiresAt, isRedeemed
2. **Eager Loading**: Use Prisma's `include` to fetch related data in single query
3. **Caching**: Consider caching tenant prefixes and prize configurations
4. **QR Generation**: Generate QR codes asynchronously to avoid blocking voucher creation
5. **Pagination**: Implement pagination for admin dashboard to handle large voucher sets

### Backward Compatibility

- All changes are additive (no breaking changes to existing APIs)
- Prizes without voucher settings continue to work as before
- Existing WhatsApp functionality remains unchanged
- Spin API continues to work for non-voucher prizes
