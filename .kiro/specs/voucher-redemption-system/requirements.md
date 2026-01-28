# Requirements Document: Voucher Redemption System

## Introduction

This document specifies the requirements for a voucher/coupon redemption system integrated with the spin wheel platform. The system enables automatic voucher generation when customers win prizes, delivery via WhatsApp with QR codes, and merchant validation/redemption using phone cameras. The system supports multi-tenant architecture and provides comprehensive admin management capabilities.

## Glossary

- **Voucher**: A digital coupon with a unique code and optional QR image that represents a won prize
- **Voucher_Service**: The backend service responsible for voucher generation, validation, and redemption
- **QR_Generator**: The component that creates QR code images from voucher codes
- **Scanner_Interface**: The web-based UI that uses phone camera to scan QR codes
- **Merchant**: A user with permission to validate and redeem vouchers for their tenant
- **Customer**: An end user who wins prizes and receives vouchers
- **Admin**: A user with permission to view and manage all vouchers for their tenant
- **Tenant**: An isolated organization instance in the multi-tenant system
- **Redemption**: The act of marking a voucher as used when a customer claims their prize
- **Validation**: The process of checking if a voucher is legitimate and can be redeemed
- **WhatsApp_Service**: The existing service that sends messages to customers
- **Spin_API**: The existing API that handles spin wheel prize wins

## Requirements

### Requirement 1: Automatic Voucher Generation

**User Story:** As a customer, I want to automatically receive a voucher when I win a prize, so that I can claim my reward at the merchant's location.

#### Acceptance Criteria

1. WHEN a customer wins a prize on the spin wheel, THE Voucher_Service SHALL create a new voucher with a unique code
2. WHEN creating a voucher, THE Voucher_Service SHALL generate a code using the tenant prefix followed by a unique identifier
3. WHEN a prize is configured with QR enabled, THE QR_Generator SHALL create a 400x400 PNG QR code image
4. WHEN a QR image is generated, THE Voucher_Service SHALL upload it using the existing UploadThing integration
5. WHEN a voucher is created, THE Voucher_Service SHALL set the expiration date based on the prize's voucherValidityDays configuration
6. WHEN a voucher is created, THE Voucher_Service SHALL associate it with the spin, prize, user, and tenant
7. WHEN voucher creation completes, THE WhatsApp_Service SHALL send the voucher code and QR image to the customer's phone number

### Requirement 2: Voucher Code Uniqueness

**User Story:** As a system administrator, I want all voucher codes to be globally unique, so that there are no conflicts or fraud.

#### Acceptance Criteria

1. THE Voucher_Service SHALL ensure no two vouchers have the same code across all tenants
2. WHEN generating a voucher code, THE Voucher_Service SHALL use a cryptographically random unique identifier
3. WHEN a code generation collision is detected, THE Voucher_Service SHALL retry with a new identifier

### Requirement 3: QR Code Generation

**User Story:** As a customer, I want to receive a QR code with my voucher, so that merchants can quickly scan and validate it.

#### Acceptance Criteria

1. WHEN a prize has sendQRCode enabled, THE QR_Generator SHALL create a QR code containing the voucher code
2. THE QR_Generator SHALL produce images with dimensions of exactly 400x400 pixels
3. THE QR_Generator SHALL output PNG format images
4. WHEN QR generation fails, THE Voucher_Service SHALL log the error and continue without the QR image

### Requirement 4: Voucher Validation

**User Story:** As a merchant, I want to validate vouchers before redemption, so that I can verify they are legitimate and not expired or already used.

#### Acceptance Criteria

1. WHEN a merchant submits a voucher code, THE Voucher_Service SHALL verify the code exists in the database
2. WHEN validating a voucher, THE Voucher_Service SHALL check that the voucher belongs to the merchant's tenant
3. WHEN validating a voucher, THE Voucher_Service SHALL check that the current date is before the expiration date
4. WHEN validating a voucher, THE Voucher_Service SHALL check that isRedeemed is false
5. WHEN validating a voucher, THE Voucher_Service SHALL check that redemptionCount is less than redemptionLimit
6. WHEN a voucher fails any validation check, THE Voucher_Service SHALL return the specific reason for failure
7. WHEN a voucher passes all validation checks, THE Voucher_Service SHALL return the voucher details including customer information and prize details

### Requirement 5: Voucher Redemption

**User Story:** As a merchant, I want to redeem valid vouchers, so that customers can claim their prizes and the voucher cannot be reused.

#### Acceptance Criteria

1. WHEN a merchant redeems a voucher, THE Voucher_Service SHALL first validate the voucher
2. WHEN a voucher is valid, THE Voucher_Service SHALL set isRedeemed to true
3. WHEN a voucher is redeemed, THE Voucher_Service SHALL set redeemedAt to the current timestamp
4. WHEN a voucher is redeemed, THE Voucher_Service SHALL set redeemedBy to the merchant's user ID
5. WHEN a voucher is redeemed, THE Voucher_Service SHALL increment redemptionCount by one
6. WHEN a voucher has already been redeemed and redemptionCount equals redemptionLimit, THE Voucher_Service SHALL reject the redemption
7. WHEN redemption fails validation, THE Voucher_Service SHALL return an error without modifying the voucher

### Requirement 6: Phone Number Lookup

**User Story:** As a merchant, I want to look up vouchers by customer phone number, so that I can help customers who cannot display their QR code.

#### Acceptance Criteria

1. WHEN a merchant submits a phone number, THE Voucher_Service SHALL return all vouchers associated with that phone number for the merchant's tenant
2. WHEN looking up vouchers, THE Voucher_Service SHALL include voucher status (valid, expired, redeemed)
3. WHEN looking up vouchers, THE Voucher_Service SHALL include prize details for each voucher
4. WHEN no vouchers exist for a phone number, THE Voucher_Service SHALL return an empty list
5. THE Voucher_Service SHALL only return vouchers belonging to the requesting merchant's tenant

### Requirement 7: QR Code Scanning Interface

**User Story:** As a merchant, I want to scan QR codes using my phone's camera, so that I can quickly validate vouchers without manual entry.

#### Acceptance Criteria

1. WHEN a merchant accesses the scanner page, THE Scanner_Interface SHALL request camera permissions
2. WHEN camera permissions are granted, THE Scanner_Interface SHALL display a live camera feed
3. WHEN a QR code is detected in the camera view, THE Scanner_Interface SHALL extract the voucher code
4. WHEN a voucher code is extracted, THE Scanner_Interface SHALL automatically call the validation API
5. WHEN validation completes, THE Scanner_Interface SHALL display the validation result
6. THE Scanner_Interface SHALL work on mobile devices using the device's rear camera
7. THE Scanner_Interface SHALL require HTTPS for camera access

### Requirement 8: Admin Voucher Dashboard

**User Story:** As an admin, I want to view all vouchers in a management dashboard, so that I can monitor voucher usage and status.

#### Acceptance Criteria

1. WHEN an admin accesses the voucher dashboard, THE System SHALL display statistics for total, active, redeemed, and expired vouchers
2. WHEN displaying vouchers, THE System SHALL show voucher code, customer name, prize name, status, creation date, and expiration date
3. WHEN an admin applies filters, THE System SHALL update the voucher list to match the filter criteria
4. THE System SHALL support filtering by status (all, active, redeemed, expired)
5. THE System SHALL support searching by voucher code or customer phone number
6. WHEN an admin requests export, THE System SHALL generate a downloadable file with all filtered voucher data
7. THE System SHALL only display vouchers belonging to the admin's tenant

### Requirement 9: Prize Configuration

**User Story:** As an admin, I want to configure voucher settings for each prize, so that I can control validity periods and redemption limits.

#### Acceptance Criteria

1. WHEN configuring a prize, THE System SHALL allow setting voucherValidityDays (number of days until expiration)
2. WHEN configuring a prize, THE System SHALL allow setting voucherRedemptionLimit (maximum number of redemptions)
3. WHEN configuring a prize, THE System SHALL allow enabling or disabling QR code generation via sendQRCode
4. WHEN voucherValidityDays is not set, THE System SHALL use a default value of 30 days
5. WHEN voucherRedemptionLimit is not set, THE System SHALL use a default value of 1
6. WHEN sendQRCode is not set, THE System SHALL default to true

### Requirement 10: Multi-Tenant Isolation

**User Story:** As a system architect, I want strict tenant isolation for vouchers, so that merchants can only access vouchers from their own organization.

#### Acceptance Criteria

1. WHEN creating a voucher, THE Voucher_Service SHALL associate it with the tenant from the spin context
2. WHEN validating a voucher, THE Voucher_Service SHALL verify the voucher's tenantId matches the requesting user's tenantId
3. WHEN looking up vouchers by phone, THE Voucher_Service SHALL filter results to only include the requesting user's tenantId
4. WHEN displaying the admin dashboard, THE System SHALL filter vouchers to only show the admin's tenantId
5. WHEN a user attempts to access a voucher from a different tenant, THE System SHALL return an error

### Requirement 11: WhatsApp Notification

**User Story:** As a customer, I want to receive my voucher via WhatsApp, so that I have easy access to it on my phone.

#### Acceptance Criteria

1. WHEN a voucher is created, THE WhatsApp_Service SHALL send a message to the customer's phone number
2. WHEN a voucher has a QR code, THE WhatsApp_Service SHALL include the QR image in the message
3. THE WhatsApp_Service SHALL include the voucher code as text in the message
4. THE WhatsApp_Service SHALL include the prize name in the message
5. THE WhatsApp_Service SHALL include the expiration date in the message
6. WHEN WhatsApp delivery fails, THE System SHALL log the error but not fail the voucher creation

### Requirement 12: Error Handling and Edge Cases

**User Story:** As a developer, I want comprehensive error handling for edge cases, so that the system behaves predictably in all scenarios.

#### Acceptance Criteria

1. WHEN a voucher code does not exist, THE Voucher_Service SHALL return an error indicating "Voucher not found"
2. WHEN a voucher is expired, THE Voucher_Service SHALL return an error indicating "Voucher expired" with the expiration date
3. WHEN a voucher is already fully redeemed, THE Voucher_Service SHALL return an error indicating "Voucher already redeemed" with redemption details
4. WHEN a voucher belongs to a different tenant, THE Voucher_Service SHALL return an error indicating "Invalid voucher"
5. WHEN QR generation fails, THE System SHALL create the voucher without a QR code and log the error
6. WHEN WhatsApp delivery fails, THE System SHALL log the error and continue normal operation
7. WHEN database operations fail, THE System SHALL return appropriate error messages and not leave data in an inconsistent state

### Requirement 13: Backward Compatibility

**User Story:** As a system administrator, I want the voucher system to integrate seamlessly with existing features, so that current functionality is not disrupted.

#### Acceptance Criteria

1. WHEN the voucher system is deployed, THE Spin_API SHALL continue to function for spins that do not generate vouchers
2. WHEN a prize does not have voucher settings configured, THE System SHALL not create vouchers for that prize
3. THE System SHALL use the existing UploadThing integration without modifications
4. THE System SHALL use the existing WhatsApp_Service without breaking existing message functionality
5. THE System SHALL extend existing database models without removing or modifying existing fields

### Requirement 14: Data Persistence and Relationships

**User Story:** As a developer, I want proper data relationships and persistence, so that voucher data is consistent and queryable.

#### Acceptance Criteria

1. THE Voucher model SHALL have a foreign key relationship to Spin
2. THE Voucher model SHALL have a foreign key relationship to Prize
3. THE Voucher model SHALL have a foreign key relationship to EndUser (customer)
4. THE Voucher model SHALL have a foreign key relationship to Tenant
5. THE Voucher model SHALL optionally have a foreign key relationship to User (merchant who redeemed)
6. WHEN a voucher is queried, THE System SHALL be able to efficiently retrieve related spin, prize, user, and tenant data
7. THE System SHALL create database indexes on frequently queried fields (code, tenantId, userId, expiresAt, isRedeemed)
