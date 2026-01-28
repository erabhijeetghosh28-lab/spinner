# End-to-End Test Suite for Voucher Redemption System

This directory contains comprehensive end-to-end tests for the voucher redemption system. These tests verify the complete system functionality from spin win to voucher redemption.

## Test Files

### 1. e2e-customer-flow.test.ts
**Purpose:** Tests the complete customer journey from prize win to voucher redemption.

**Test Cases:**
- Complete full customer journey: spin → voucher → validate → redeem
- Handle multiple vouchers for same customer
- Handle voucher with multiple redemption limit
- Handle voucher without QR code
- Track redemption history correctly

**Requirements Covered:** 1.1, 1.7, 4.1, 5.1

### 2. e2e-phone-lookup.test.ts
**Purpose:** Tests the phone lookup functionality for merchants.

**Test Cases:**
- Lookup vouchers by phone number and display correct status
- Show redeemed status after redemption
- Show expired status for expired vouchers
- Allow redemption of voucher found via phone lookup
- Return empty array for phone with no vouchers
- Handle multiple vouchers with mixed statuses
- Include prize details in lookup results
- Sort vouchers by creation date (newest first)

**Requirements Covered:** 6.1, 5.1

### 3. e2e-admin-dashboard.test.ts
**Purpose:** Tests the admin dashboard functionality.

**Test Cases:**
- Display accurate statistics for all voucher states
- Filter vouchers by status correctly
- Search vouchers by code
- Search vouchers by customer phone
- Include all required fields in voucher list
- Support pagination
- Filter by date range
- Export data matching filtered results

**Requirements Covered:** 8.1, 8.3, 8.6

### 4. e2e-multi-tenant-isolation.test.ts
**Purpose:** Tests strict tenant isolation across all voucher operations.

**Test Cases:**
- Prevent cross-tenant voucher validation
- Prevent cross-tenant voucher redemption
- Isolate phone lookup by tenant
- Isolate admin dashboard by tenant
- Isolate statistics by tenant
- Use tenant-specific code prefixes
- Prevent search across tenants
- Maintain isolation after redemption

**Requirements Covered:** 10.2, 10.3, 10.4, 10.5

### 5. e2e-edge-cases.test.ts
**Purpose:** Tests edge cases and error scenarios.

**Test Cases:**
- Reject expired voucher validation
- Reject already redeemed voucher
- Reject invalid voucher code
- Handle QR generation failure gracefully
- Handle WhatsApp delivery failure gracefully
- Prevent concurrent redemption (double redemption)
- Handle empty phone number in lookup
- Handle very long voucher code search
- Handle voucher at exact expiration moment
- Handle redemption at exact limit
- Handle special characters in customer name
- Handle zero validity days
- Handle missing tenant in validation

**Requirements Covered:** 12.1, 12.2, 12.3, 3.4, 11.6

## Running the Tests

### Run all E2E tests:
```bash
npm test -- app/api/__tests__/e2e-*.test.ts
```

### Run specific test file:
```bash
npm test -- app/api/__tests__/e2e-customer-flow.test.ts
```

### Run specific test case:
```bash
npm test -- app/api/__tests__/e2e-customer-flow.test.ts --testNamePattern="should complete full customer journey"
```

## Test Configuration

- **Timeout:** 30 seconds per test (configured via `jest.setTimeout(30000)`)
- **Mocks:** QR generator and WhatsApp service are mocked to avoid external API calls
- **Database:** Tests use the test database and clean up after each test

## Test Data Management

Each test file:
1. Creates test data in `beforeEach` hook
2. Runs test cases
3. Cleans up all test data in `afterEach` hook

Test data includes:
- Plans
- Tenants
- Campaigns
- Customers (EndUsers)
- Merchants (TenantAdmins)
- Prizes
- Spins
- Vouchers

## Mocking Strategy

### QR Generator
Mocked to return a test URL instead of actually uploading to UploadThing:
```typescript
jest.mock('@/lib/qr-generator', () => ({
  generateVoucherCode: jest.requireActual('@/lib/voucher-service').generateVoucherCode,
  createAndUploadQR: jest.fn().mockResolvedValue('https://example.com/qr/test.png'),
}));
```

### WhatsApp Service
Mocked to avoid sending actual WhatsApp messages:
```typescript
jest.mock('@/lib/whatsapp', () => ({
  sendPrizeNotification: jest.fn().mockResolvedValue(null),
  sendVoucherNotification: jest.fn().mockResolvedValue(null),
}));
```

## Coverage

These E2E tests provide comprehensive coverage of:
- ✅ Complete customer flow
- ✅ Phone lookup functionality
- ✅ Admin dashboard features
- ✅ Multi-tenant isolation
- ✅ Edge cases and error handling
- ✅ Backward compatibility (covered in separate test file)

## Notes

- Tests are designed to be independent and can run in any order
- Each test creates its own isolated test data
- Tests verify both happy paths and error scenarios
- All tests include proper cleanup to avoid test pollution
- Tests use realistic data and scenarios
