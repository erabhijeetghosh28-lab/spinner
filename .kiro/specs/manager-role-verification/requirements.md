# Requirements Document

## Introduction

This document specifies the requirements for adding a Manager role to the multi-tenant spin-the-wheel campaign platform. The Manager role sits between Tenant Admin and End User (Customer) in the user hierarchy, with the primary responsibility of manually verifying social media task completions and granting bonus spins to customers.

## Glossary

- **Manager**: A user role with permissions to manually verify social media task completions for customers within their tenant
- **Tenant**: An organization that runs campaigns on the platform
- **Tenant_Admin**: A user who manages campaigns and settings for their tenant organization
- **Customer**: An end user who participates in campaigns and completes social media tasks
- **Social_Task_Completion**: A record of a customer's attempt to complete a social media task
- **Verification_System**: The system component responsible for validating social media task completions
- **Bonus_Spin**: Additional wheel spins granted to customers upon successful task completion
- **Audit_Trail**: A chronological record of manager actions for accountability and tracking
- **Task_Status**: The state of a social task completion (PENDING, VERIFIED, FAILED, REJECTED)

## Requirements

### Requirement 1: Manager Account Management

**User Story:** As a Tenant Admin, I want to create and manage manager accounts for my organization, so that I can delegate social media task verification responsibilities.

#### Acceptance Criteria

1. WHEN a Tenant Admin creates a manager account, THE System SHALL create a new Manager record associated with the tenant
2. WHEN creating a manager account, THE System SHALL require email, name, password, and maximum allowed bonus spins per approval fields
3. WHEN a Tenant Admin sets the maximum allowed bonus spins, THE System SHALL store this limit with the manager account
4. WHEN a Tenant Admin views manager accounts, THE System SHALL display only managers belonging to their tenant along with their spin limits
5. WHEN a Tenant Admin deactivates a manager account, THE System SHALL prevent that manager from logging in
6. WHEN a Tenant Admin updates manager information, THE System SHALL persist the changes and maintain the tenant association
7. WHEN a Tenant Admin updates a manager's maximum allowed bonus spins, THE System SHALL apply the new limit to all future approvals

### Requirement 2: Manager Authentication

**User Story:** As a Manager, I want to securely log in to my dedicated portal, so that I can access task verification features.

#### Acceptance Criteria

1. WHEN a manager navigates to the manager login page, THE System SHALL display a login form with email and password fields
2. WHEN a manager submits valid credentials, THE System SHALL authenticate the manager and create a session token
3. WHEN a manager submits invalid credentials, THE System SHALL reject the login attempt and display an error message
4. WHEN an authenticated manager's session expires, THE System SHALL redirect them to the login page
5. WHEN a manager logs out, THE System SHALL invalidate their session token immediately

### Requirement 3: Task Completion Visibility

**User Story:** As a Manager, I want to view pending social media task completions from customers in my tenant, so that I can verify their completion.

#### Acceptance Criteria

1. WHEN a manager accesses the dashboard, THE System SHALL display all pending social task completions for their tenant
2. WHEN displaying task completions, THE System SHALL show only minimal customer data (customer ID, phone number last 4 digits, task type, submission timestamp, and task target URL)
3. WHEN a manager views task completions, THE System SHALL exclude completions from other tenants
4. WHEN a manager views task completions, THE System SHALL only show completions from customers who have spun the wheel at least once
5. WHEN new task completions are submitted, THE System SHALL make them visible to managers within 5 seconds
6. WHEN a manager filters task completions by status, THE System SHALL display only completions matching the selected status

### Requirement 4: Manual Task Verification

**User Story:** As a Manager, I want to manually verify if a customer completed a social media task, so that I can approve or reject their submission accurately.

#### Acceptance Criteria

1. WHEN a manager clicks on a task completion, THE System SHALL display detailed information including minimal customer details, task requirements, and submission proof
2. WHEN a manager approves or rejects a task completion, THE System SHALL require a mandatory comment explaining the decision
3. WHEN a manager attempts to submit without a comment, THE System SHALL prevent submission and display a validation error
4. WHEN a manager approves a task completion with a valid comment, THE System SHALL update the completion status to VERIFIED
5. WHEN a manager rejects a task completion with a valid comment, THE System SHALL update the completion status to REJECTED
6. WHEN a manager approves a task completion, THE System SHALL grant bonus spins up to the manager's maximum allowed limit
7. IF a manager attempts to grant more bonus spins than their allowed limit, THEN THE System SHALL cap the bonus spins at the manager's maximum and log a warning
8. IF a manager attempts to verify an already-verified task, THEN THE System SHALL prevent duplicate verification and display a warning message

### Requirement 5: Bonus Spin Allocation

**User Story:** As a Customer, I want to receive bonus spins immediately after my social media task is approved by a manager, so that I can continue participating in the campaign.

#### Acceptance Criteria

1. WHEN a manager approves a task completion, THE System SHALL verify the customer has spun at least once before granting bonus spins
2. WHEN a manager approves a task completion for an eligible customer, THE System SHALL increment the customer's available spins by the task's bonus spin count
3. WHEN bonus spins are granted, THE System SHALL persist the updated spin count to the database immediately
4. WHEN bonus spins are granted, THE System SHALL send a WhatsApp notification to the customer within 30 seconds
5. IF bonus spin allocation fails, THEN THE System SHALL log the error and mark the task completion for retry
6. WHEN a customer views their spin count, THE System SHALL reflect bonus spins granted by managers

### Requirement 6: Customer Notification

**User Story:** As a Customer, I want to receive notifications when my social media tasks are verified, so that I know when I can use my bonus spins.

#### Acceptance Criteria

1. WHEN a manager approves a task completion, THE System SHALL send a WhatsApp notification to the customer
2. WHEN a manager rejects a task completion, THE System SHALL send a WhatsApp notification to the customer with rejection reason
3. WHEN sending notifications, THE System SHALL include the task type and number of bonus spins granted (if approved)
4. IF notification delivery fails, THEN THE System SHALL retry up to 3 times with exponential backoff
5. WHEN a notification is sent, THE System SHALL log the delivery status for audit purposes

### Requirement 7: Audit Trail and Accountability

**User Story:** As a Tenant Admin, I want to view an audit trail of manager verification actions, so that I can ensure accountability and review verification decisions.

#### Acceptance Criteria

1. WHEN a manager approves or rejects a task completion, THE System SHALL create an audit log entry
2. WHEN creating an audit log entry, THE System SHALL record manager ID, action type, task completion ID, timestamp, and the mandatory comment provided by the manager
3. WHEN a Tenant Admin views audit logs, THE System SHALL display all manager actions for their tenant including the comments
4. WHEN viewing audit logs, THE System SHALL allow filtering by manager, date range, and action type
5. WHEN audit logs are created, THE System SHALL ensure they are immutable and cannot be deleted or modified

### Requirement 8: Multi-Tenant Isolation

**User Story:** As a Platform Administrator, I want to ensure managers can only access data from their assigned tenant, so that tenant data remains isolated and secure.

#### Acceptance Criteria

1. WHEN a manager queries task completions, THE System SHALL filter results to only include their tenant's data from customers who have spun at least once
2. WHEN a manager attempts to access a task completion from another tenant, THE System SHALL reject the request with an authorization error
3. WHEN a manager views customer information, THE System SHALL only display minimal customer data (customer ID and phone number last 4 digits) for customers belonging to their tenant
4. WHEN authenticating a manager, THE System SHALL include tenant ID in the session token
5. WHEN processing manager requests, THE System SHALL validate tenant association before executing any data operations

### Requirement 9: Manager Dashboard Interface

**User Story:** As a Manager, I want an intuitive dashboard interface, so that I can efficiently verify task completions without confusion.

#### Acceptance Criteria

1. WHEN a manager accesses the dashboard, THE System SHALL display a summary of pending, verified, and rejected task counts
2. WHEN displaying task completions, THE System SHALL organize them in a table with sortable columns
3. WHEN a manager hovers over a task completion row, THE System SHALL highlight the row for better visibility
4. WHEN a manager clicks "View Details" on a task completion, THE System SHALL open a modal with full task information
5. WHEN a manager performs an action, THE System SHALL provide immediate visual feedback (loading states, success/error messages)

### Requirement 10: Role-Based Access Control

**User Story:** As a System Architect, I want managers to have limited permissions, so that they cannot access campaign settings or other administrative features.

#### Acceptance Criteria

1. WHEN a manager attempts to access campaign creation pages, THE System SHALL deny access and redirect to the manager dashboard
2. WHEN a manager attempts to access tenant settings, THE System SHALL deny access and return an authorization error
3. WHEN a manager attempts to access voucher management, THE System SHALL deny access and return an authorization error
4. WHEN a manager accesses allowed routes, THE System SHALL permit access without restriction
5. WHEN evaluating permissions, THE System SHALL use role-based access control middleware to enforce restrictions

### Requirement 11: Tenant Admin Manager Management Interface

**User Story:** As a Tenant Admin, I want a dedicated interface to manage managers and their permissions, so that I can control who can verify tasks and how many bonus spins they can grant.

#### Acceptance Criteria

1. WHEN a Tenant Admin navigates to the manager management page, THE System SHALL display a list of all managers for their tenant
2. WHEN a Tenant Admin clicks "Add Manager", THE System SHALL display a form to create a new manager account
3. WHEN creating a manager, THE System SHALL require the Tenant Admin to specify the maximum bonus spins the manager can grant per approval
4. WHEN a Tenant Admin edits a manager, THE System SHALL allow updating the manager's maximum bonus spin limit
5. WHEN displaying managers, THE System SHALL show each manager's name, email, status, maximum bonus spin limit, and total approvals count
6. WHEN a Tenant Admin deactivates a manager, THE System SHALL immediately revoke the manager's access to the verification portal

