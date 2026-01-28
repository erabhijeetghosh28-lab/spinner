# Implementation Plan: Voucher Redemption System

## Overview

This implementation plan breaks down the voucher redemption system into discrete, incremental coding tasks. Each task builds on previous work, starting with database models and core services, then adding API endpoints, UI components, and finally integrating with existing systems. The plan includes property-based tests and unit tests as sub-tasks to validate correctness early.

## Tasks

- [x] 1. Set up database models and migrations
  - [x] 1.1 Create Voucher model with all fields and relationships
    - Define Voucher model in Prisma schema with fields: id, code, qrImageUrl, spinId, prizeId, userId, tenantId, isRedeemed, redeemedAt, redeemedBy, expiresAt, redemptionLimit, redemptionCount, createdAt, updatedAt
    - Add foreign key relationships to Spin, Prize, EndUser, Tenant, and User models
    - Create database indexes on code, tenantId, userId, expiresAt, isRedeemed for query performance
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.7_
  
  - [x] 1.2 Extend Prize model with voucher configuration fields
    - Add voucherValidityDays (Int, default 30), voucherRedemptionLimit (Int, default 1), sendQRCode (Boolean, default true) to Prize model
    - Add vouchers relation to Prize model
    - _Requirements: 9.4, 9.5, 9.6_
  
  - [x] 1.3 Add voucher relations to existing models
    - Add vouchers relation to Spin model
    - Add vouchers relation to EndUser model
    - Add vouchers relation to Tenant model
    - Add redeemedVouchers relation to User model
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [x] 1.4 Generate and run database migration
    - Run `npx prisma migrate dev` to create migration
    - Verify migration creates all tables, fields, and indexes correctly
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 2. Install required dependencies
  - Install nanoid, qrcode, html5-qrcode, date-fns packages
  - Install @types/qrcode for TypeScript support
  - Install fast-check for property-based testing
  - _Requirements: 2.2, 3.1_

- [x] 3. Implement voucher code generation
  - [x] 3.1 Create generateVoucherCode function
    - Implement function that takes tenantSlug and returns unique code in format {TENANT_PREFIX}-{NANOID}
    - Use first 4 characters of tenant slug (uppercase) as prefix
    - Use nanoid with custom alphabet (uppercase letters + numbers) for unique ID
    - _Requirements: 1.2, 2.2_
  
  - [x] 3.2 Write property test for code format
    - **Property 2: Voucher Code Format**
    - **Validates: Requirements 1.2**
  
  - [x] 3.3 Write property test for code uniqueness
    - **Property 3: Voucher Code Uniqueness**
    - **Validates: Requirements 2.1**
  
  - [x] 3.4 Write unit test for collision retry logic
    - Test that code generation retries on collision (up to 3 times)
    - _Requirements: 2.3_

- [x] 4. Implement QR code generation service
  - [x] 4.1 Create QR Generator service
    - Implement generateQRImage function that creates 400x400 PNG QR code from voucher code
    - Use qrcode library with error correction level M
    - Implement uploadQRImage function that uploads to UploadThing
    - Implement createAndUploadQR that combines generation and upload with error handling
    - _Requirements: 1.3, 1.4, 3.1_
  
  - [x] 4.2 Write property test for QR code properties
    - **Property 4: QR Code Properties**
    - **Validates: Requirements 1.3, 3.1**
  
  - [x] 4.3 Write property test for QR upload integration
    - **Property 5: QR Upload Integration**
    - **Validates: Requirements 1.4**
  
  - [x] 4.4 Write unit test for QR generation failure handling
    - Test that createAndUploadQR returns null on failure and logs error
    - _Requirements: 3.4, 12.5_

- [x] 5. Implement core Voucher Service
  - [x] 5.1 Create createVoucher function
    - Implement function that creates voucher with all required fields
    - Generate unique code using generateVoucherCode
    - Calculate expiration date based on validityDays
    - Conditionally generate QR code if generateQR is true
    - Associate voucher with spin, prize, user, and tenant
    - _Requirements: 1.1, 1.2, 1.5, 1.6_
  
  - [x] 5.2 Write property test for voucher creation
    - **Property 1: Voucher Creation on Prize Win**
    - **Validates: Requirements 1.1, 1.6**
  
  - [x] 5.3 Write property test for expiration date calculation
    - **Property 6: Expiration Date Calculation**
    - **Validates: Requirements 1.5**
  
  - [x] 5.4 Write unit tests for createVoucher edge cases
    - Test voucher creation without QR code
    - Test voucher creation with QR generation failure
    - _Requirements: 3.4_

- [x] 6. Implement voucher validation logic
  - [x] 6.1 Create validateVoucher function
    - Implement validation checks: code exists, tenant match, not expired, not fully redeemed, redemption count < limit
    - Return ValidationResult with voucher details if valid
    - Return specific error reasons if invalid: not_found, wrong_tenant, expired, redeemed, limit_reached
    - Include customer and prize details in successful validation response
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 6.2 Write property test for code existence validation
    - **Property 8: Validation - Code Existence**
    - **Validates: Requirements 4.1, 4.2**
  
  - [x] 6.3 Write property test for expiration check
    - **Property 9: Validation - Expiration Check**
    - **Validates: Requirements 4.3**
  
  - [x] 6.4 Write property test for redemption status check
    - **Property 10: Validation - Redemption Status Check**
    - **Validates: Requirements 4.4, 4.5**
  
  - [x] 6.5 Write property test for validation response structure
    - **Property 11: Validation - Complete Response**
    - **Validates: Requirements 4.7**
  
  - [x] 6.6 Write property test for error reasons
    - **Property 12: Validation - Error Reasons**
    - **Validates: Requirements 4.6**
  
  - [x] 6.7 Write unit tests for validation edge cases
    - Test validation with non-existent code
    - Test validation with expired voucher
    - Test validation with already redeemed voucher
    - Test validation with wrong tenant
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 7. Implement voucher redemption logic
  - [x] 7.1 Create redeemVoucher function
    - First call validateVoucher to check if voucher is valid
    - If valid, update voucher: set isRedeemed=true, redeemedAt=now, redeemedBy=merchantId, increment redemptionCount
    - Use database transaction with row-level locking to prevent double redemption
    - Return RedemptionResult with success status and voucher details
    - If validation fails, return error without modifying voucher
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_
  
  - [x] 7.2 Write property test for redemption validation requirement
    - **Property 13: Redemption Requires Validation**
    - **Validates: Requirements 5.1, 5.7**
  
  - [x] 7.3 Write property test for redemption state changes
    - **Property 14: Redemption State Changes**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
  
  - [x] 7.4 Write unit tests for redemption edge cases
    - Test redemption of invalid voucher doesn't modify state
    - Test concurrent redemption attempts (double redemption prevention)
    - _Requirements: 5.7_

- [x] 8. Checkpoint - Ensure core voucher service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement phone lookup functionality
  - [x] 9.1 Create getVouchersByPhone function
    - Query vouchers by customer phone number and tenant ID
    - Include voucher status calculation (active, expired, redeemed)
    - Include prize details for each voucher
    - Return empty array if no vouchers found
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 9.2 Write property test for phone lookup tenant scoping
    - **Property 15: Phone Lookup Returns Tenant-Scoped Vouchers**
    - **Validates: Requirements 6.1, 6.5**
  
  - [x] 9.3 Write property test for phone lookup response structure
    - **Property 16: Phone Lookup Response Structure**
    - **Validates: Requirements 6.2, 6.3**
  
  - [x] 9.4 Write unit test for phone lookup with no results
    - Test that empty array is returned when no vouchers exist for phone
    - _Requirements: 6.4_

- [x] 10. Implement admin voucher management functions
  - [x] 10.1 Create getVouchers function with filters
    - Implement filtering by status (all, active, redeemed, expired)
    - Implement search by voucher code or customer phone
    - Implement date range filtering
    - Always filter by tenant ID
    - Include pagination support
    - _Requirements: 8.3, 8.5, 8.7_
  
  - [x] 10.2 Create getVoucherStats function
    - Calculate total, active, redeemed, and expired voucher counts for tenant
    - Active = not redeemed AND not expired
    - Expired = expiresAt < current date AND not redeemed
    - Redeemed = isRedeemed = true
    - _Requirements: 8.1_
  
  - [x] 10.3 Write property test for admin statistics accuracy
    - **Property 17: Admin Statistics Accuracy**
    - **Validates: Requirements 8.1**
  
  - [x] 10.4 Write property test for admin dashboard response structure
    - **Property 18: Admin Dashboard Response Structure**
    - **Validates: Requirements 8.2**
  
  - [x] 10.5 Write property test for admin filter correctness
    - **Property 19: Admin Filter Correctness**
    - **Validates: Requirements 8.3, 8.5, 8.7**
  
  - [x] 10.6 Write property test for export data consistency
    - **Property 20: Export Data Consistency**
    - **Validates: Requirements 8.6**

- [x] 11. Implement tenant isolation property test
  - [x] 11.1 Write comprehensive property test for tenant isolation
    - **Property 21: Tenant Isolation**
    - Test that all voucher operations enforce tenant boundaries
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5**

- [x] 12. Create API endpoints
  - [x] 12.1 Create POST /api/vouchers/validate endpoint
    - Accept voucher code in request body
    - Get tenant ID from authenticated user session
    - Call validateVoucher service function
    - Return validation result with voucher details or error
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 12.2 Create POST /api/vouchers/redeem endpoint
    - Accept voucher code in request body
    - Get merchant ID and tenant ID from authenticated user session
    - Call redeemVoucher service function
    - Return redemption result
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_
  
  - [x] 12.3 Create POST /api/vouchers/lookup-phone endpoint
    - Accept phone number in request body
    - Get tenant ID from authenticated user session
    - Call getVouchersByPhone service function
    - Return list of vouchers with status and prize details
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 12.4 Create GET /api/vouchers endpoint (admin)
    - Accept query parameters: status, search, startDate, endDate, page, limit
    - Get tenant ID from authenticated user session
    - Call getVouchers and getVoucherStats service functions
    - Return vouchers list with statistics and pagination
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.7_
  
  - [x] 12.5 Write integration tests for API endpoints
    - Test validation endpoint with valid and invalid vouchers
    - Test redemption endpoint flow
    - Test phone lookup endpoint
    - Test admin endpoint with various filters
    - _Requirements: 4.1, 5.1, 6.1, 8.3_

- [x] 13. Extend WhatsApp service for voucher notifications
  - [x] 13.1 Create sendVoucherNotification function
    - Format message with voucher code, prize name, and expiration date
    - Include QR image URL if present
    - Call existing WhatsApp API (sendWhatsAppImage or sendWhatsAppText)
    - Log error if WhatsApp delivery fails but don't throw exception
    - _Requirements: 1.7, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [x] 13.2 Write property test for WhatsApp notification content
    - **Property 7: WhatsApp Notification Content**
    - **Validates: Requirements 1.7, 11.2, 11.3, 11.4, 11.5**
  
  - [x] 13.3 Write unit test for WhatsApp failure handling
    - Test that voucher creation succeeds even when WhatsApp fails
    - _Requirements: 11.6_

- [x] 14. Integrate voucher creation with Spin API
  - [x] 14.1 Modify spin result handler to create vouchers
    - After prize win is determined, check if prize has voucherValidityDays > 0
    - If yes, call voucherService.createVoucher with spin, prize, user, and tenant context
    - Call whatsappService.sendVoucherNotification with created voucher
    - Ensure existing spin functionality continues to work unchanged
    - _Requirements: 1.1, 1.7, 13.1, 13.2_
  
  - [x] 14.2 Write integration test for spin-to-voucher flow
    - Test complete flow: spin win → voucher created → WhatsApp sent
    - _Requirements: 1.1, 1.7_
  
  - [x] 14.3 Write unit test for backward compatibility
    - Test that spins without voucher settings don't create vouchers
    - Test that existing spin functionality works unchanged
    - _Requirements: 13.1, 13.2_

- [x] 15. Checkpoint - Ensure backend integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Create Scanner UI page
  - [x] 16.1 Create /admin/[tenantSlug]/scanner page component
    - Set up page layout with camera preview area, manual entry, and phone lookup sections
    - Add authentication check to ensure only merchants can access
    - _Requirements: 7.1_
  
  - [x] 16.2 Implement QR scanner functionality
    - Use html5-qrcode library to initialize camera scanner
    - Request camera permissions on page load
    - Display live camera feed with QR detection overlay
    - Extract voucher code when QR is detected
    - Automatically call validation API when code is extracted
    - Display validation result (success or error with details)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 16.3 Implement manual code entry fallback
    - Add text input for manual voucher code entry
    - Add validate button that calls validation API
    - Display validation result
    - _Requirements: 7.3, 7.4_
  
  - [x] 16.4 Implement phone lookup interface
    - Add phone number input field
    - Add search button that calls lookup-phone API
    - Display list of vouchers for that phone number with status
    - Allow selecting a voucher to validate/redeem
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 16.5 Implement redemption confirmation
    - After successful validation, show "Redeem" button
    - On click, call redemption API
    - Display redemption success or error
    - Show customer and prize details
    - _Requirements: 5.1, 5.2_
  
  - [x] 16.6 Write integration test for scanner UI flow
    - Test QR scan → validation → redemption flow
    - _Requirements: 7.4_

- [x] 17. Create Voucher Dashboard UI page
  - [x] 17.1 Create /admin/[tenantSlug]/vouchers page component
    - Set up page layout with statistics cards, filters, and voucher table
    - Add authentication check to ensure only admins can access
    - _Requirements: 8.1, 8.2_
  
  - [x] 17.2 Implement statistics cards
    - Fetch voucher statistics from API
    - Display total, active, redeemed, and expired counts in card components
    - _Requirements: 8.1_
  
  - [x] 17.3 Implement voucher table with filters
    - Display voucher list with columns: code, customer, prize, status, expires
    - Add status filter dropdown (all, active, redeemed, expired)
    - Add search input for code or phone number
    - Add date range filter
    - Update table when filters change
    - Implement pagination
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [x] 17.4 Implement export functionality
    - Add "Export CSV" button
    - Generate CSV file with all filtered voucher data
    - Trigger download
    - _Requirements: 8.6_
  
  - [x] 17.5 Write integration test for dashboard UI
    - Test statistics display
    - Test filtering and search
    - Test export functionality
    - _Requirements: 8.1, 8.3, 8.6_

- [x] 18. Extend Prize configuration form
  - [x] 18.1 Add voucher settings section to prize form
    - Add "Validity (days)" number input with default 30
    - Add "Redemption Limit" number input with default 1
    - Add "Generate QR Code" checkbox with default true
    - Ensure form saves these fields to Prize model
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 18.2 Write unit test for prize form with voucher settings
    - Test that form saves voucher settings correctly
    - Test default values are applied
    - _Requirements: 9.4, 9.5, 9.6_

- [x] 19. Add navigation links
  - Add "Scan Voucher" link to merchant navigation menu
  - Add "Voucher Management" link to admin navigation menu
  - _Requirements: 7.1, 8.1_

- [x] 20. Final checkpoint - End-to-end testing
  - [x] 20.1 Test complete customer flow
    - Create spin with prize win → verify voucher created → verify WhatsApp sent → scan QR → validate → redeem
    - _Requirements: 1.1, 1.7, 4.1, 5.1_
  
  - [x] 20.2 Test phone lookup flow
    - Create vouchers for customer → lookup by phone → verify results → redeem
    - _Requirements: 6.1, 5.1_
  
  - [x] 20.3 Test admin dashboard
    - Create vouchers with various states → verify statistics → test filters → export data
    - _Requirements: 8.1, 8.3, 8.6_
  
  - [x] 20.4 Test multi-tenant isolation
    - Create vouchers for multiple tenants → verify cross-tenant access is blocked
    - _Requirements: 10.2, 10.3, 10.4, 10.5_
  
  - [x] 20.5 Test edge cases
    - Test expired voucher validation
    - Test already redeemed voucher
    - Test invalid voucher code
    - Test QR generation failure
    - Test WhatsApp delivery failure
    - _Requirements: 12.1, 12.2, 12.3, 3.4, 11.6_
  
  - [x] 20.6 Test backward compatibility
    - Verify spins without voucher settings work unchanged
    - Verify existing WhatsApp functionality works
    - _Requirements: 13.1, 13.4_

- [x] 21. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Checkpoints ensure incremental validation at key milestones
- All voucher operations enforce strict tenant isolation
- System gracefully handles QR generation and WhatsApp delivery failures
