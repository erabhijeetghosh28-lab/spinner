# Requirements Document: Super Admin Controls

## Introduction

This specification defines comprehensive Super Admin Controls for a multi-tenant spin-the-wheel SaaS platform. The system enables Super Admins to manage tenant subscriptions, monitor usage, track revenue, oversee vouchers and campaigns, and maintain platform security across all tenants. The feature is organized into three phases: Phase 1 (Must Have) focuses on subscription management and billing, Phase 2 (Should Have) adds oversight and analytics capabilities, and Phase 3 (Nice to Have) provides advanced administrative features.

## Glossary

- **Super_Admin**: Platform administrator with full access to manage all tenants and platform settings
- **Tenant**: A business (cafe, gym, salon) that uses the platform to run spin-the-wheel campaigns
- **Subscription_Plan**: A pricing tier (Free, Starter, Pro, Enterprise) with defined limits and features
- **Monthly_Usage**: Tracking record of spins and vouchers used by a tenant in a calendar month
- **Limit_Override**: Temporary adjustment to tenant limits (bonus spins/vouchers) granted by Super Admin
- **MRR**: Monthly Recurring Revenue - total recurring subscription revenue per month
- **Voucher**: Digital coupon generated when a user wins a prize, redeemable at the tenant's business
- **Campaign**: A spin-the-wheel promotion created by a tenant with prizes and rules
- **Audit_Log**: Record of administrative actions performed by Super Admins
- **Redemption_Rate**: Percentage of vouchers that have been redeemed by customers
- **Churn**: When a tenant cancels their subscription or becomes inactive
- **Impersonation**: Super Admin ability to view the platform as a specific tenant would see it

## Requirements

### Requirement 1: Subscription Usage Limits

**User Story:** As a Super Admin, I want to define and enforce monthly usage limits for subscription plans, so that tenants are restricted based on their pricing tier.

#### Acceptance Criteria

1. THE Subscription_Plan SHALL include a spinsPerMonth field defining maximum spins allowed per month
2. THE Subscription_Plan SHALL include a vouchersPerMonth field defining maximum vouchers allowed per month
3. WHEN a tenant attempts to exceed their spinsPerMonth limit, THE System SHALL prevent the spin and return an error
4. WHEN a tenant attempts to exceed their vouchersPerMonth limit, THE System SHALL prevent voucher creation and return an error
5. THE System SHALL display subscription limits in the tenant details view

### Requirement 2: Monthly Usage Tracking

**User Story:** As a Super Admin, I want to track each tenant's monthly usage of spins and vouchers, so that I can monitor consumption against their plan limits.

#### Acceptance Criteria

1. THE System SHALL create a Monthly_Usage record for each tenant at the start of each calendar month
2. WHEN a spin occurs, THE System SHALL increment the spinsUsed counter in the current Monthly_Usage record
3. WHEN a voucher is created, THE System SHALL increment the vouchersUsed counter in the current Monthly_Usage record
4. THE System SHALL reset usage counters to zero at the beginning of each new calendar month
5. THE System SHALL maintain historical Monthly_Usage records for all previous months

### Requirement 3: Usage Display and Monitoring

**User Story:** As a Super Admin, I want to view detailed usage statistics for each tenant, so that I can understand their consumption patterns and identify issues.

#### Acceptance Criteria

1. WHEN viewing tenant details, THE System SHALL display current spins used versus limit with percentage
2. WHEN viewing tenant details, THE System SHALL display current vouchers used versus limit with percentage
3. WHEN viewing tenant details, THE System SHALL display days remaining until monthly reset
4. WHEN viewing tenant details, THE System SHALL display usage trend comparison to previous month
5. WHEN a tenant reaches 80% of any limit, THE System SHALL display a warning indicator

### Requirement 4: Manual Limit Overrides

**User Story:** As a Super Admin, I want to manually adjust tenant limits, so that I can provide bonus capacity or resolve billing issues.

#### Acceptance Criteria

1. THE Super_Admin SHALL be able to grant bonus spins to a specific tenant
2. THE Super_Admin SHALL be able to grant bonus vouchers to a specific tenant
3. WHEN granting an override, THE Super_Admin SHALL provide a reason for the adjustment
4. THE System SHALL track all limit overrides in a Limit_Override record with timestamp and admin identifier
5. THE System SHALL apply bonus limits additively to the base subscription plan limits
6. THE Super_Admin SHALL be able to reset a tenant's monthly usage to zero mid-month
7. THE System SHALL display active overrides in the tenant details view

### Requirement 5: Billing and Revenue Dashboard

**User Story:** As a Super Admin, I want to monitor platform revenue and billing status, so that I can track business performance and identify payment issues.

#### Acceptance Criteria

1. THE System SHALL calculate and display total Monthly Recurring Revenue across all active tenants
2. THE System SHALL display new revenue added in the current month from new subscriptions
3. THE System SHALL display churned revenue lost in the current month from cancellations
4. THE System SHALL display a list of tenants with upcoming subscription renewals within 7 days
5. THE System SHALL display a list of tenants with failed or overdue payments
6. WHEN viewing billing dashboard, THE System SHALL show revenue breakdown by subscription plan
7. THE System SHALL display total active tenants versus total registered tenants

### Requirement 6: Global Voucher Oversight

**User Story:** As a Super Admin, I want to view and manage all vouchers across all tenants, so that I can investigate issues and monitor platform activity.

#### Acceptance Criteria

1. THE System SHALL provide a global voucher view displaying vouchers from all tenants
2. THE Super_Admin SHALL be able to search vouchers by voucher code
3. THE Super_Admin SHALL be able to search vouchers by customer phone number
4. THE Super_Admin SHALL be able to filter vouchers by tenant
5. THE Super_Admin SHALL be able to filter vouchers by status (active, redeemed, expired)
6. THE Super_Admin SHALL be able to filter vouchers by date range
7. WHEN viewing a voucher, THE System SHALL display tenant name, customer details, prize name, status, and redemption information
8. THE Super_Admin SHALL be able to manually void an active voucher
9. THE Super_Admin SHALL be able to export voucher data to CSV format

### Requirement 7: Campaign Management Across Tenants

**User Story:** As a Super Admin, I want to view and manage campaigns across all tenants, so that I can monitor platform usage and assist tenants.

#### Acceptance Criteria

1. THE System SHALL provide a global campaign view displaying campaigns from all tenants
2. THE Super_Admin SHALL be able to search campaigns by campaign name
3. THE Super_Admin SHALL be able to filter campaigns by tenant
4. THE Super_Admin SHALL be able to filter campaigns by status (active, inactive, archived)
5. WHEN viewing a campaign, THE System SHALL display tenant name, campaign dates, spin count, and voucher count
6. THE Super_Admin SHALL be able to pause an active campaign
7. THE Super_Admin SHALL be able to unpause a paused campaign
8. THE System SHALL display campaign performance metrics including total spins and redemption rate

### Requirement 8: Platform Analytics and Insights

**User Story:** As a Super Admin, I want to view platform-wide analytics, so that I can understand overall performance and identify trends.

#### Acceptance Criteria

1. THE System SHALL display total spins across all tenants for all time
2. THE System SHALL display total vouchers created across all tenants for all time
3. THE System SHALL calculate and display average redemption rate across all tenants
4. THE System SHALL display a list of top 10 tenants ranked by total spins
5. THE System SHALL display a list of bottom 10 tenants ranked by activity level
6. THE System SHALL display count of new tenants added in the current month
7. THE System SHALL display count of churned tenants in the current month
8. THE System SHALL calculate and display percentage of active tenants versus total tenants
9. THE System SHALL display growth trends comparing current month to previous month

### Requirement 9: Audit Logs

**User Story:** As a Super Admin, I want to track all administrative actions, so that I can maintain accountability and investigate issues.

#### Acceptance Criteria

1. WHEN a Super_Admin edits a tenant, THE System SHALL create an Audit_Log record
2. WHEN a Super_Admin deletes a tenant, THE System SHALL create an Audit_Log record
3. WHEN a Super_Admin changes a tenant's subscription plan, THE System SHALL create an Audit_Log record
4. WHEN a Super_Admin grants a limit override, THE System SHALL create an Audit_Log record
5. WHEN a Super_Admin voids a voucher, THE System SHALL create an Audit_Log record
6. WHEN a Super_Admin pauses or unpauses a campaign, THE System SHALL create an Audit_Log record
7. THE Audit_Log SHALL include admin identifier, action type, target entity type, target entity ID, timestamp, and change details
8. THE Super_Admin SHALL be able to search audit logs by admin identifier
9. THE Super_Admin SHALL be able to filter audit logs by action type
10. THE Super_Admin SHALL be able to filter audit logs by date range

### Requirement 10: WhatsApp Monitoring

**User Story:** As a Super Admin, I want to monitor WhatsApp delivery status across all tenants, so that I can identify configuration issues and delivery failures.

#### Acceptance Criteria

1. THE System SHALL display count of tenants with WhatsApp configured
2. THE System SHALL display count of tenants without WhatsApp configured
3. THE System SHALL display total WhatsApp messages sent in the current day
4. THE System SHALL display count of failed WhatsApp deliveries in the current day
5. WHEN viewing WhatsApp status, THE System SHALL list each tenant with their configuration status
6. WHEN viewing a tenant's WhatsApp status, THE System SHALL display message count and failure count
7. THE Super_Admin SHALL be able to view failed message details including error reason

### Requirement 11: Tenant Impersonation

**User Story:** As a Super Admin, I want to view the platform as a specific tenant, so that I can debug issues and understand the tenant experience.

#### Acceptance Criteria

1. THE Super_Admin SHALL be able to initiate impersonation mode for a specific tenant
2. WHEN impersonation is active, THE System SHALL display the tenant's dashboard view
3. WHEN impersonation is active, THE System SHALL display a prominent banner indicating impersonation mode
4. WHEN impersonation is active, THE System SHALL restrict access to tenant-scoped data only
5. THE Super_Admin SHALL be able to exit impersonation mode and return to Super Admin view
6. THE System SHALL create an Audit_Log record when impersonation begins and ends

### Requirement 12: Notification Management

**User Story:** As a Super Admin, I want to send notifications to tenants, so that I can communicate platform updates and important information.

#### Acceptance Criteria

1. THE Super_Admin SHALL be able to compose an email notification
2. THE Super_Admin SHALL be able to send a notification to all active tenants
3. THE Super_Admin SHALL be able to send a notification to a specific tenant
4. THE Super_Admin SHALL be able to select from predefined notification templates
5. THE System SHALL provide templates for price increase, new feature announcement, and maintenance window notifications
6. WHEN sending a notification, THE System SHALL record the notification in an Audit_Log
7. THE System SHALL display a history of sent notifications with recipient count and timestamp

### Requirement 13: Bulk Operations

**User Story:** As a Super Admin, I want to perform actions on multiple tenants simultaneously, so that I can efficiently manage the platform.

#### Acceptance Criteria

1. THE Super_Admin SHALL be able to select multiple tenants from the tenant list
2. THE Super_Admin SHALL be able to change the subscription plan for all selected tenants
3. THE Super_Admin SHALL be able to grant bonus spins to all selected tenants
4. THE Super_Admin SHALL be able to grant bonus vouchers to all selected tenants
5. THE Super_Admin SHALL be able to export data for all selected tenants to CSV format
6. WHEN performing a bulk operation, THE System SHALL create an Audit_Log record for each affected tenant
7. THE System SHALL display a confirmation dialog before executing bulk operations

### Requirement 14: Advanced Security Monitoring

**User Story:** As a Super Admin, I want to detect and respond to suspicious activity, so that I can protect the platform from fraud and abuse.

#### Acceptance Criteria

1. THE System SHALL track failed login attempts for each tenant
2. WHEN a tenant has more than 10 failed login attempts in one hour, THE System SHALL display a security alert
3. WHEN a tenant generates more than 1000 spins in one hour, THE System SHALL display a suspicious activity alert
4. WHEN a tenant creates more than 500 users in one day, THE System SHALL display a suspicious activity alert
5. THE Super_Admin SHALL be able to temporarily lock a tenant account
6. THE Super_Admin SHALL be able to unlock a locked tenant account
7. WHEN locking or unlocking an account, THE System SHALL create an Audit_Log record
8. THE System SHALL display a security dashboard with all active alerts and suspicious activity
