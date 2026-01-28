# Implementation Plan: Super Admin Controls

## Overview

This implementation plan breaks down the Super Admin Controls feature into three phases, with each phase building on the previous one. The plan follows an incremental approach where core functionality is implemented first, followed by oversight capabilities, and finally advanced features. Each task includes property-based tests to validate correctness properties from the design document.

## Tasks

### Phase 1: Subscription Management & Billing (Must Have)

- [x] 1. Database schema updates for subscription limits and usage tracking
  - Add spinsPerMonth and vouchersPerMonth fields to SubscriptionPlan model (nullable for unlimited)
  - Add campaignDurationDays field to SubscriptionPlan model
  - Create MonthlyUsage model with composite unique key on (tenantId, month, year)
  - Create TenantLimitOverride model for bonus grants
  - Create AuditLog model for tracking admin actions
  - Add isLocked, failedLoginCount, and lastFailedLogin fields to Tenant model
  - Add relations to Admin model for audit logs and overrides
  - Generate and run Prisma migration
  - _Requirements: 1.1, 1.2, 2.1, 4.4, 9.7_
  - _Enhancement: Support unlimited limits (null = unlimited) and campaign duration setting_

- [x] 2. Implement UsageService for tracking and limit enforcement
  - [x] 2.1 Create UsageService class with core methods
    - Implement getCurrentMonthUsage() to get or create current month record
    - Implement incrementSpins() and incrementVouchers() methods
    - Implement getEffectiveLimits() to calculate base + override limits
    - Implement canSpin() and canCreateVoucher() limit check methods
    - Implement resetUsage() for mid-month resets
    - Implement getUsageWithTrend() for usage comparison
    - _Requirements: 2.1, 2.2, 2.3, 4.5, 4.6_
  
  - [x] 2.2 Write property test for counter increment invariant
    - **Property 3: Counter Increment Invariant**
    - **Validates: Requirements 2.2, 2.3**
  
  - [x] 2.3 Write property test for monthly reset
    - **Property 4: Monthly Reset Property**
    - **Validates: Requirements 2.4, 2.5**
  
  - [x] 2.4 Write property test for additive limit calculation
    - **Property 12: Additive Limit Calculation**
    - **Validates: Requirements 4.5**
  
  - [x] 2.5 Write property test for limit enforcement
    - **Property 1: Limit Enforcement**
    - **Validates: Requirements 1.3, 1.4**

- [x] 3. Integrate usage tracking into existing spin and voucher flows
  - [x] 3.1 Update spin API route to check limits and increment usage
    - Add canSpin() check before allowing spin
    - Call incrementSpins() after successful spin
    - Return appropriate error when limit exceeded
    - _Requirements: 1.3, 2.2_
  
  - [x] 3.2 Update voucher creation to check limits and increment usage
    - Add canCreateVoucher() check before creating voucher
    - Call incrementVouchers() after successful voucher creation
    - Return appropriate error when limit exceeded
    - _Requirements: 1.4, 2.3_
  
  - [x] 3.3 Write integration tests for limit enforcement in spin/voucher flows
    - Test spin rejection at limit
    - Test voucher creation rejection at limit
    - Test successful operations under limit
    - _Requirements: 1.3, 1.4_

- [ ] 4. Implement tenant usage API endpoints
  - [x] 4.1 Create GET /api/admin/super/usage/platform endpoint
    - Calculate platform-wide usage statistics
    - Return total spins, vouchers, active tenants, total tenants
    - _Requirements: 2.1, 5.7_
  
  - [x] 4.2 Create GET /api/admin/super/tenants/:id/usage endpoint
    - Get current month usage with limits and percentages
    - Get previous month usage for comparison
    - Calculate usage trend (percentage change)
    - Calculate days until monthly reset
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [~] 4.3 Write property test for usage display accuracy
    - **Property 5: Usage Display Accuracy**
    - **Validates: Requirements 3.1, 3.2**
  
  - [~] 4.4 Write property test for days until reset calculation
    - **Property 6: Days Until Reset Calculation**
    - **Validates: Requirements 3.3**
  
  - [~] 4.5 Write property test for usage trend calculation
    - **Property 7: Usage Trend Calculation**
    - **Validates: Requirements 3.4**

- [ ] 5. Implement manual limit override functionality
  - [x] 5.1 Create POST /api/admin/super/tenants/:id/overrides endpoint
    - Validate bonus amounts (must be positive)
    - Validate reason (must be non-empty string)
    - Create TenantLimitOverride record
    - Create audit log entry
    - Return created override record
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Create PUT /api/admin/super/tenants/:id/usage/reset endpoint
    - Reset current month usage to zero
    - Create audit log entry
    - Return updated usage record
    - _Requirements: 4.6_
  
  - [~] 5.3 Write property test for override grant success
    - **Property 9: Override Grant Success**
    - **Validates: Requirements 4.1, 4.2**
  
  - [~] 5.4 Write property test for override reason requirement
    - **Property 10: Override Reason Requirement**
    - **Validates: Requirements 4.3**
  
  - [~] 5.5 Write property test for usage reset operation
    - **Property 13: Usage Reset Operation**
    - **Validates: Requirements 4.6**

- [ ] 6. Implement BillingService and revenue dashboard
  - [x] 6.1 Create BillingService class with revenue calculations
    - Implement calculateMRR() to sum active tenant subscription prices
    - Implement getRevenueMetrics() for new/churned revenue
    - Implement getUpcomingRenewals() with date filtering
    - Implement getFailedPayments() for payment issues
    - Implement getRevenueByPlan() for plan breakdown
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 6.2 Create GET /api/admin/super/billing/dashboard endpoint
    - Call BillingService methods to get all metrics
    - Return comprehensive revenue dashboard data
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_
  
  - [x] 6.3 Create GET /api/admin/super/billing/renewals endpoint
    - Accept days parameter (default 7)
    - Return tenants with upcoming renewals
    - _Requirements: 5.4_
  
  - [~] 6.4 Write property test for MRR calculation accuracy
    - **Property 15: MRR Calculation Accuracy**
    - **Validates: Requirements 5.1**
  
  - [~] 6.5 Write property test for new revenue tracking
    - **Property 16: New Revenue Tracking**
    - **Validates: Requirements 5.2**
  
  - [~] 6.6 Write property test for churned revenue tracking
    - **Property 17: Churned Revenue Tracking**
    - **Validates: Requirements 5.3**
  
  - [~] 6.7 Write property test for upcoming renewals filter
    - **Property 18: Upcoming Renewals Filter**
    - **Validates: Requirements 5.4**
  
  - [~] 6.8 Write property test for revenue by plan aggregation
    - **Property 20: Revenue by Plan Aggregation**
    - **Validates: Requirements 5.6**

- [x] 7. Build Super Admin UI for tenant usage and overrides
  - [x] 7.1 Create tenant usage display component
    - Display spins used vs limit with percentage and progress bar
    - Display vouchers used vs limit with percentage and progress bar
    - Display days until monthly reset
    - Display usage trend with up/down indicator
    - Show warning indicator when usage >= 80%
    - Display active overrides with bonus amounts and reasons
    - Support unlimited limits display (∞ Unlimited)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.7_
  
  - [x] 7.2 Create manual override form component
    - Input fields for bonus spins and bonus vouchers
    - Required text area for reason
    - Submit button to grant override
    - Display success/error messages
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 7.3 Create usage reset button with confirmation
    - Button to reset usage mid-month
    - Confirmation dialog before reset
    - Display success/error messages
    - _Requirements: 4.6_
  
  - [~]* 7.4 Write unit tests for UI components
    - Test usage display with various data
    - Test override form validation
    - Test reset confirmation flow
    - _Requirements: 3.1-3.5, 4.1-4.3, 4.6_

- [x] 8. Build billing dashboard UI
  - [x] 8.1 Create revenue metrics dashboard component
    - Display MRR with currency formatting
    - Display new revenue and churned revenue
    - Display revenue breakdown by plan (chart or table)
    - Display active vs total tenant counts
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_
  
  - [x] 8.2 Create upcoming renewals list component
    - Display tenants with renewal dates
    - Show days until renewal
    - Show plan name and price
    - Sort by renewal date (soonest first)
    - _Requirements: 5.4_
  
  - [x] 8.3 Create failed payments list component
    - Display tenants with payment issues
    - Show subscription status
    - Highlight urgent issues
    - _Requirements: 5.5_
  
  - [~]* 8.4 Write unit tests for billing dashboard components
    - Test revenue display formatting
    - Test renewals list sorting
    - Test failed payments highlighting
    - _Requirements: 5.1-5.7_

- [~]* 9. Checkpoint - Ensure Phase 1 tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Oversight & Analytics (Should Have)

- [ ] 10. Implement global voucher oversight
  - [x] 10.1 Create GET /api/admin/super/vouchers endpoint
    - Support pagination (page, limit parameters)
    - Support search by voucher code
    - Support search by customer phone number
    - Support filter by tenant ID
    - Support filter by status (active, redeemed, expired)
    - Support filter by date range (startDate, endDate)
    - Include tenant and user details in response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 10.2 Create PUT /api/admin/super/vouchers/:id/void endpoint
    - Validate voucher is active (not already redeemed/voided)
    - Mark voucher as voided
    - Create audit log entry
    - _Requirements: 6.8_
  
  - [x] 10.3 Create GET /api/admin/super/vouchers/export endpoint
    - Accept same filters as voucher list endpoint
    - Generate CSV with all voucher fields
    - Return CSV file download
    - _Requirements: 6.9_
  
  - [~] 10.4 Write property test for global voucher visibility
    - **Property 22: Global Voucher Visibility**
    - **Validates: Requirements 6.1**
  
  - [~] 10.5 Write property test for voucher search correctness
    - **Property 23: Voucher Search Correctness**
    - **Validates: Requirements 6.2, 6.3**
  
  - [~] 10.6 Write property test for voucher filter correctness
    - **Property 24: Voucher Filter Correctness**
    - **Validates: Requirements 6.4, 6.5, 6.6**
  
  - [~] 10.7 Write property test for voucher void operation
    - **Property 26: Voucher Void Operation**
    - **Validates: Requirements 6.8**

- [ ] 11. Implement global campaign management
  - [x] 11.1 Create GET /api/admin/super/campaigns endpoint
    - Support pagination (page, limit parameters)
    - Support search by campaign name
    - Support filter by tenant ID
    - Support filter by status (active, inactive, archived)
    - Include tenant details and performance metrics
    - Calculate total spins and redemption rate per campaign
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8_
  
  - [x] 11.2 Create PUT /api/admin/super/campaigns/:id/pause endpoint
    - Validate campaign is active
    - Set isActive to false
    - Create audit log entry
    - _Requirements: 7.6_
  
  - [x] 11.3 Create PUT /api/admin/super/campaigns/:id/unpause endpoint
    - Validate campaign is paused
    - Set isActive to true
    - Create audit log entry
    - _Requirements: 7.7_
  
  - [~] 11.4 Write property test for global campaign visibility
    - **Property 28: Global Campaign Visibility**
    - **Validates: Requirements 7.1**
  
  - [~] 11.5 Write property test for campaign search and filter correctness
    - **Property 29: Campaign Search and Filter Correctness**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  
  - [~] 11.6 Write property test for campaign pause/unpause state transition
    - **Property 31: Campaign Pause/Unpause State Transition**
    - **Validates: Requirements 7.6, 7.7**

- [ ] 12. Implement AnalyticsService and platform analytics
  - [x] 12.1 Create AnalyticsService class with platform-wide calculations
    - Implement getPlatformStats() for total spins, vouchers, redemption rate
    - Implement getTenantComparison() for ranking tenants
    - Implement calculateRedemptionRate() for average across tenants
    - Implement getGrowthTrends() for month-over-month comparison
    - Implement getChurnRiskTenants() for identifying inactive tenants
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_
  
  - [x] 12.2 Create GET /api/admin/super/analytics/platform endpoint
    - Call AnalyticsService methods to get all metrics
    - Return comprehensive platform analytics
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7, 8.8, 8.9_
  
  - [x] 12.3 Create GET /api/admin/super/analytics/tenants/comparison endpoint
    - Return tenant performance comparison table
    - Include rank, spins, vouchers, redemption rate
    - _Requirements: 8.4, 8.5_
  
  - [~] 12.4 Write property test for platform aggregation accuracy
    - **Property 32: Platform Aggregation Accuracy**
    - **Validates: Requirements 8.1, 8.2**
  
  - [~] 12.5 Write property test for average redemption rate calculation
    - **Property 33: Average Redemption Rate Calculation**
    - **Validates: Requirements 8.3**
  
  - [~] 12.6 Write property test for tenant ranking correctness
    - **Property 34: Tenant Ranking Correctness**
    - **Validates: Requirements 8.4, 8.5**
  
  - [~] 12.7 Write property test for growth trend calculation
    - **Property 37: Growth Trend Calculation**
    - **Validates: Requirements 8.9**

- [ ] 13. Implement audit log system
  - [x] 13.1 Create AuditService class for logging admin actions
    - Implement logAction() to create audit log records
    - Implement queryLogs() with filtering and pagination
    - Capture IP address and user agent from request
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [x] 13.2 Integrate audit logging into all admin action endpoints
    - Add audit logging to tenant edit/delete operations
    - Add audit logging to plan change operations
    - Add audit logging to override grant operations
    - Add audit logging to voucher void operations
    - Add audit logging to campaign pause/unpause operations
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 13.3 Create GET /api/admin/super/audit-logs endpoint
    - Support pagination (page, limit parameters)
    - Support filter by admin ID
    - Support filter by action type
    - Support filter by date range
    - Return audit logs with admin and target details
    - _Requirements: 9.8, 9.9, 9.10_
  
  - [~] 13.4 Write property test for audit log creation
    - **Property 38: Audit Log Creation for Admin Actions**
    - **Validates: Requirements 9.1-9.6**
  
  - [~] 13.5 Write property test for audit log completeness
    - **Property 39: Audit Log Completeness**
    - **Validates: Requirements 9.7**
  
  - [~] 13.6 Write property test for audit log search and filter correctness
    - **Property 40: Audit Log Search and Filter Correctness**
    - **Validates: Requirements 9.8, 9.9, 9.10**

- [ ] 14. Implement WhatsApp monitoring
  - [x] 14.1 Create GET /api/admin/super/whatsapp/status endpoint
    - Count tenants with waConfig configured vs not configured
    - List each tenant with configuration status
    - Note: Message delivery tracking requires WhatsApp webhook integration (future enhancement)
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [~] 14.2 Write property test for WhatsApp configuration count accuracy
    - **Property 41: WhatsApp Configuration Count Accuracy**
    - **Validates: Requirements 10.1, 10.2**
  
  - [~] 14.3 Write property test for WhatsApp status display completeness
    - **Property 42: WhatsApp Status Display Completeness**
    - **Validates: Requirements 10.5**

- [ ] 15. Build Super Admin UI for oversight features
  - [x] 15.1 Create global voucher view page
    - Search bar for code and phone number
    - Filter dropdowns for tenant, status, date range
    - Paginated voucher table with all details
    - Void button for active vouchers
    - Export to CSV button
    - _Requirements: 6.1-6.9_
  
  - [x] 15.2 Create global campaign view page
    - Search bar for campaign name
    - Filter dropdowns for tenant and status
    - Paginated campaign table with performance metrics
    - Pause/unpause buttons for campaigns
    - _Requirements: 7.1-7.8_
  
  - [x] 15.3 Create platform analytics dashboard page
    - Display total spins and vouchers
    - Display average redemption rate
    - Display top 10 and bottom 10 tenants tables
    - Display new and churned tenant counts
    - Display active percentage
    - Display growth trends with charts
    - _Requirements: 8.1-8.9_
  
  - [x] 15.4 Create audit log viewer page
    - Filter controls for admin, action type, date range
    - Paginated audit log table
    - Expandable rows for change details
    - _Requirements: 9.8, 9.9, 9.10_
  
  - [x] 15.5 Create WhatsApp monitoring page
    - Display configuration statistics
    - List tenants with configuration status
    - Highlight tenants without WhatsApp configured
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [~] 15.6 Write unit tests for oversight UI components
    - Test voucher table rendering and filtering
    - Test campaign table rendering and actions
    - Test analytics dashboard data display
    - Test audit log table and filtering
    - _Requirements: 6.1-10.5_

- [~] 16. Checkpoint - Ensure Phase 2 tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Advanced Features (Nice to Have)

- [ ] 17. Implement tenant impersonation
  - [~] 17.1 Create impersonation session management
    - Create session token with tenant ID
    - Store impersonation state in session/cookie
    - Implement middleware to detect impersonation mode
    - Restrict data access to impersonated tenant scope
    - _Requirements: 11.1, 11.4_
  
  - [~] 17.2 Create POST /api/admin/super/impersonate endpoint
    - Validate tenant exists
    - Create impersonation session
    - Create audit log entry for impersonation start
    - Return session token
    - _Requirements: 11.1, 11.6_
  
  - [~] 17.3 Create DELETE /api/admin/super/impersonate endpoint
    - End impersonation session
    - Create audit log entry for impersonation end
    - Return success response
    - _Requirements: 11.5, 11.6_
  
  - [~] 17.4 Update UI to show impersonation banner and tenant dashboard
    - Display prominent banner when impersonation active
    - Show tenant's dashboard view
    - Add "Exit Impersonation" button
    - _Requirements: 11.2, 11.3_
  
  - [~] 17.5 Write property test for impersonation session creation
    - **Property 43: Impersonation Session Creation**
    - **Validates: Requirements 11.1, 11.4**
  
  - [~] 17.6 Write property test for impersonation audit trail
    - **Property 46: Impersonation Audit Trail**
    - **Validates: Requirements 11.6**

- [ ] 18. Implement notification management
  - [~] 18.1 Create Notification model in database schema
    - Add Notification table with subject, body, recipient fields
    - Add relation to Admin model
    - Generate and run Prisma migration
    - _Requirements: 12.7_
  
  - [~] 18.2 Create notification templates
    - Define template for price increase notification
    - Define template for new feature announcement
    - Define template for maintenance window notification
    - Store templates in database or configuration
    - _Requirements: 12.4, 12.5_
  
  - [~] 18.3 Create POST /api/admin/super/notifications endpoint
    - Accept subject, body, recipientType, recipientId, templateId
    - If templateId provided, populate from template
    - Send email to specified recipients (all tenants or specific tenant)
    - Create Notification record with recipient count
    - Create audit log entry
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_
  
  - [~] 18.4 Create GET /api/admin/super/notifications/history endpoint
    - Support pagination
    - Return notification history with recipient counts and timestamps
    - _Requirements: 12.7_
  
  - [~] 18.5 Write property test for notification composition and sending
    - **Property 47: Notification Composition and Sending**
    - **Validates: Requirements 12.1, 12.2, 12.3**
  
  - [~] 18.6 Write property test for notification audit trail
    - **Property 49: Notification Audit Trail**
    - **Validates: Requirements 12.6**

- [ ] 19. Implement bulk operations
  - [x] 19.1 Create POST /api/admin/super/bulk/plan-change endpoint
    - Accept array of tenant IDs and new plan ID
    - Update subscriptionPlanId for all selected tenants in transaction
    - Create audit log entry for each tenant
    - Return success/failure counts
    - _Requirements: 13.2, 13.6_
  
  - [x] 19.2 Create POST /api/admin/super/bulk/grant-bonus endpoint
    - Accept array of tenant IDs, bonus amounts, and reason
    - Create TenantLimitOverride for each tenant in transaction
    - Create audit log entry for each tenant
    - Return success/failure counts
    - _Requirements: 13.3, 13.4, 13.6_
  
  - [x] 19.3 Create POST /api/admin/super/bulk/export endpoint
    - Accept array of tenant IDs
    - Generate CSV with data for all selected tenants
    - Return CSV file download
    - _Requirements: 13.5_
  
  - [~] 19.4 Write property test for bulk plan change operation
    - **Property 52: Bulk Plan Change Operation**
    - **Validates: Requirements 13.2**
  
  - [~] 19.5 Write property test for bulk bonus grant operation
    - **Property 53: Bulk Bonus Grant Operation**
    - **Validates: Requirements 13.3, 13.4**
  
  - [~] 19.6 Write property test for bulk operation audit trail
    - **Property 55: Bulk Operation Audit Trail**
    - **Validates: Requirements 13.6**

- [-] 20. Implement advanced security monitoring
  - [x] 20.1 Create SecurityEvent model in database schema
    - Add SecurityEvent table with tenant, event type, severity fields
    - Add relation to Tenant model
    - Generate and run Prisma migration
    - _Requirements: 14.2, 14.3, 14.4_
  
  - [x] 20.2 Create SecurityService class for threat detection
    - Implement trackFailedLogin() to increment counter
    - Implement detectSuspiciousActivity() to check thresholds
    - Implement lockTenant() and unlockTenant() methods
    - Implement getSecurityDashboard() to aggregate alerts
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.8_
  
  - [x] 20.3 Integrate security monitoring into authentication flow
    - Track failed login attempts
    - Generate security alerts when thresholds exceeded
    - Prevent access when tenant is locked
    - _Requirements: 14.1, 14.2_
  
  - [x] 20.4 Create PUT /api/admin/super/tenants/:id/lock endpoint
    - Validate tenant is not already locked
    - Set isLocked to true, record lockedBy and lockedAt
    - Create audit log entry
    - _Requirements: 14.5, 14.7_
  
  - [x] 20.5 Create PUT /api/admin/super/tenants/:id/unlock endpoint
    - Validate tenant is locked
    - Set isLocked to false, clear lock fields
    - Create audit log entry
    - _Requirements: 14.6, 14.7_
  
  - [x] 20.6 Create GET /api/admin/super/security/dashboard endpoint
    - Return all active security alerts
    - Return suspicious activity events
    - Return failed login summaries
    - _Requirements: 14.8_
  
  - [~] 20.7 Write property test for failed login tracking
    - **Property 56: Failed Login Tracking**
    - **Validates: Requirements 14.1**
  
  - [~] 20.8 Write property test for security alert generation
    - **Property 57: Security Alert Generation**
    - **Validates: Requirements 14.2, 14.3, 14.4**
  
  - [~] 20.9 Write property test for account lock state transition
    - **Property 58: Account Lock State Transition**
    - **Validates: Requirements 14.5, 14.6**

- [-] 21. Build Super Admin UI for advanced features
  - [~] 21.1 Create tenant impersonation UI
    - Add "Impersonate" button to tenant details page
    - Display impersonation banner when active
    - Show tenant dashboard view during impersonation
    - Add "Exit Impersonation" button in banner
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
  
  - [~] 21.2 Create notification management UI
    - Notification composition form with subject and body
    - Recipient selection (all tenants or specific tenant)
    - Template selection dropdown
    - Send button with confirmation
    - Notification history table
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.7_
  
  - [~] 21.3 Create bulk operations UI
    - Tenant selection checkboxes in tenant list
    - Bulk action dropdown (change plan, grant bonus, export)
    - Confirmation dialog for bulk operations
    - Progress indicator during bulk operations
    - Success/failure summary after completion
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [x] 21.4 Create security dashboard UI
    - Display active security alerts with severity indicators
    - Display suspicious activity events
    - Display failed login summaries
    - Lock/unlock buttons for tenant accounts
    - Alert resolution controls
    - _Requirements: 14.2, 14.3, 14.4, 14.5, 14.6, 14.8_
  
  - [~] 21.5 Write unit tests for advanced feature UI components
    - Test impersonation banner and exit flow
    - Test notification form and template selection
    - Test bulk operation selection and confirmation
    - Test security dashboard alert display
    - _Requirements: 11.1-14.8_

- [~] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests and unit tests are required for comprehensive quality
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each phase
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Phase 1 must be completed before Phase 2, and Phase 2 before Phase 3
- All API endpoints require Super Admin authentication
- All admin actions create audit log entries for accountability
