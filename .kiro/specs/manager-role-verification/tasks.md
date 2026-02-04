# Implementation Plan: Manager Role Verification

## Overview

This implementation plan breaks down the Manager Role Verification feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The implementation follows a bottom-up approach: database schema → services → API endpoints → UI components.

## Tasks

- [ ] 1. Database schema and migrations
  - [x] 1.1 Create Manager and ManagerAuditLog models in Prisma schema
    - Add Manager model with fields: id, email, name, passwordHash, tenantId, maxBonusSpinsPerApproval, isActive, createdAt, updatedAt
    - Add ManagerAuditLog model with fields: id, managerId, tenantId, action, taskCompletionId, comment, bonusSpinsGranted, createdAt
    - Add relationships: Manager belongs to Tenant, ManagerAuditLog belongs to Manager and Tenant
    - Add indexes for performance: tenantId, email, managerId, taskCompletionId, createdAt
    - _Requirements: 1.1, 1.2, 7.1, 7.2_
  
  - [x] 1.2 Update SocialTaskCompletion model with verification fields
    - Add optional fields: verifiedBy (String), verifiedAt (DateTime), verificationComment (String)
    - Add relation to ManagerAuditLog
    - _Requirements: 4.4, 4.5, 7.2_
  
  - [x] 1.3 Generate and run Prisma migration
    - Run `npx prisma migrate dev --name add-manager-role`
    - Verify migration creates tables and indexes correctly
    - _Requirements: 1.1_
  
  - [x] 1.4 Write property test for Manager model creation
    - **Property 1: Manager Creation with Tenant Association**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ] 2. Manager authentication service
  - [x] 2.1 Create manager authentication utilities
    - Implement password hashing using bcryptjs
    - Implement JWT token generation with manager role and tenantId
    - Implement token validation and decoding
    - _Requirements: 2.2, 8.4_
  
  - [x] 2.2 Create ManagerAuthService in lib/manager-auth-service.ts
    - Implement `login(email, password)` method
    - Implement `logout(token)` method
    - Implement `validateToken(token)` method
    - Handle inactive manager accounts
    - _Requirements: 2.2, 2.3, 2.5, 1.5_
  
  - [x] 2.3 Write property tests for authentication
    - **Property 28: Valid Credentials Authentication**
    - **Property 29: Invalid Credentials Rejection**
    - **Property 30: Logout Token Invalidation**
    - **Property 25: Manager Deactivation Effect**
    - **Validates: Requirements 2.2, 2.3, 2.5, 1.5**
  
  - [x] 2.4 Write unit tests for authentication edge cases
    - Test inactive manager login rejection
    - Test expired token handling
    - Test invalid token format
    - _Requirements: 2.2, 2.3, 2.5_

- [ ] 3. Bonus spin allocation service
  - [x] 3.1 Create BonusSpinService in lib/bonus-spin-service.ts
    - Implement `grantBonusSpins(customerId, amount, reason, grantedBy)` method
    - Use database transaction for atomicity
    - Implement customer eligibility check (has spun at least once)
    - Implement error logging and retry marking
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 3.2 Implement WhatsApp notification for bonus spins
    - Implement `notifyCustomer(customerId, message)` method in BonusSpinService
    - Add retry logic with exponential backoff (3 attempts)
    - Log notification delivery status
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 3.3 Write property tests for bonus spin service
    - **Property 10: Customer Eligibility Check**
    - **Property 11: Spin Count Increment**
    - **Property 32: Error Logging on Spin Allocation Failure**
    - **Validates: Requirements 5.1, 5.2, 5.5**
  
  - [x] 3.4 Write property tests for notification service
    - **Property 12: Approval Notification Delivery**
    - **Property 13: Rejection Notification Delivery**
    - **Property 14: Notification Retry Logic**
    - **Property 33: Notification Delivery Logging**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 4. Manager verification service
  - [x] 4.1 Create ManagerVerificationService in lib/manager-verification-service.ts
    - Implement `getPendingTasks(managerId, filters)` method
    - Filter by manager's tenantId
    - Filter to only show customers who have spun at least once
    - Return minimal customer data (ID, phone last 4 digits)
    - Implement status filtering
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [x] 4.2 Implement task approval logic
    - Implement `approveTask(managerId, taskCompletionId, comment)` method
    - Validate manager exists and is active
    - Validate task belongs to manager's tenant
    - Check task not already verified (idempotency)
    - Validate comment is not empty
    - Cap bonus spins at manager's maxBonusSpinsPerApproval
    - Update task status to VERIFIED
    - Create audit log entry
    - Call BonusSpinService to grant spins
    - _Requirements: 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 7.1, 7.2_
  
  - [x] 4.3 Implement task rejection logic
    - Implement `rejectTask(managerId, taskCompletionId, comment)` method
    - Similar validation as approval
    - Update task status to REJECTED
    - Create audit log entry with rejection comment
    - Send rejection notification
    - _Requirements: 4.2, 4.3, 4.5, 7.1, 7.2_
  
  - [x] 4.4 Implement task detail retrieval
    - Implement `getTaskDetail(managerId, taskCompletionId)` method
    - Validate manager access (tenant isolation)
    - Return complete task information with minimal customer data
    - _Requirements: 4.1, 8.2, 8.3_
  
  - [x] 4.5 Write property tests for verification service
    - **Property 2: Multi-Tenant Isolation for Task Visibility**
    - **Property 3: Data Minimization for Customer Information**
    - **Property 4: Task Status Filtering**
    - **Property 5: Mandatory Comment Validation**
    - **Property 6: Task Approval Status Update**
    - **Property 7: Task Rejection Status Update**
    - **Property 8: Bonus Spin Limit Enforcement**
    - **Property 9: Idempotent Task Verification**
    - **Property 19: Cross-Tenant Access Prevention**
    - **Property 31: Task Detail Information Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 8.2, 8.3**

- [ ] 5. Manager authentication API endpoints
  - [x] 5.1 Create POST /api/manager/auth/login endpoint
    - Accept email and password in request body
    - Call ManagerAuthService.login()
    - Return JWT token and manager info on success
    - Return appropriate error responses for invalid credentials or inactive accounts
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 5.2 Create POST /api/manager/auth/logout endpoint
    - Accept token in request body
    - Call ManagerAuthService.logout()
    - Return success response
    - _Requirements: 2.5_
  
  - [x] 5.3 Create authentication middleware for manager routes
    - Validate JWT token from Authorization header
    - Extract manager ID and tenant ID from token
    - Attach to request context
    - Return 401 for invalid/expired tokens
    - _Requirements: 2.4, 8.4_
  
  - [x] 5.4 Write integration tests for authentication endpoints
    - Test successful login flow
    - Test invalid credentials rejection
    - Test inactive manager rejection
    - Test logout flow
    - Test middleware token validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Manager verification API endpoints
  - [x] 6.1 Create GET /api/manager/tasks/pending endpoint
    - Accept query params: status, page, limit
    - Call ManagerVerificationService.getPendingTasks()
    - Return paginated task list with minimal customer data
    - Apply manager authentication middleware
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 6.2 Create GET /api/manager/tasks/:id endpoint
    - Call ManagerVerificationService.getTaskDetail()
    - Return detailed task information
    - Apply manager authentication middleware
    - Return 403 for cross-tenant access attempts
    - _Requirements: 4.1, 8.2_
  
  - [x] 6.3 Create POST /api/manager/tasks/:id/approve endpoint
    - Accept comment in request body
    - Validate comment is not empty
    - Call ManagerVerificationService.approveTask()
    - Return success response with bonus spins granted
    - Apply manager authentication middleware
    - _Requirements: 4.2, 4.3, 4.4, 4.6, 4.7, 4.8_
  
  - [x] 6.4 Create POST /api/manager/tasks/:id/reject endpoint
    - Accept comment in request body
    - Validate comment is not empty
    - Call ManagerVerificationService.rejectTask()
    - Return success response
    - Apply manager authentication middleware
    - _Requirements: 4.2, 4.3, 4.5_
  
  - [x] 6.5 Write integration tests for verification endpoints
    - Test pending tasks retrieval with filtering
    - Test task detail retrieval
    - Test task approval flow
    - Test task rejection flow
    - Test cross-tenant access prevention
    - Test comment validation
    - Test idempotency (duplicate approval prevention)
    - _Requirements: 3.1, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 8.2_

- [~] 7. Checkpoint - Ensure manager verification flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Tenant Admin manager management API endpoints
  - [x] 8.1 Create GET /api/admin/managers endpoint
    - Call Prisma to fetch managers for authenticated tenant admin's tenant
    - Include manager stats (total approvals, rejections)
    - Apply tenant admin authentication middleware
    - _Requirements: 11.1, 11.5_
  
  - [x] 8.2 Create POST /api/admin/managers endpoint
    - Accept email, name, password, maxBonusSpinsPerApproval in request body
    - Validate email uniqueness
    - Hash password before storage
    - Create manager associated with tenant admin's tenant
    - Apply tenant admin authentication middleware
    - _Requirements: 1.1, 1.2, 1.3, 11.2, 11.3_
  
  - [x] 8.3 Create PUT /api/admin/managers/:id endpoint
    - Accept name, maxBonusSpinsPerApproval, isActive in request body
    - Validate tenant ownership
    - Update manager record
    - Preserve tenant association
    - Apply tenant admin authentication middleware
    - _Requirements: 1.6, 1.7, 11.4, 11.6_
  
  - [x] 8.4 Create GET /api/admin/managers/:id/audit-logs endpoint
    - Accept query params: startDate, endDate, action
    - Call Prisma to fetch audit logs for manager
    - Filter by tenant ownership
    - Apply tenant admin authentication middleware
    - _Requirements: 7.3, 7.4_
  
  - [~] 8.5 Write property tests for manager management
    - **Property 24: Tenant Admin Manager Listing**
    - **Property 26: Manager Limit Update Propagation**
    - **Property 27: Manager Tenant Association Preservation**
    - **Validates: Requirements 1.6, 1.7, 11.1, 11.4, 11.5**
  
  - [~] 8.6 Write integration tests for manager management endpoints
    - Test manager creation
    - Test manager listing with stats
    - Test manager update
    - Test manager deactivation
    - Test audit log retrieval with filtering
    - Test tenant isolation
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 7.3, 7.4, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 9. Role-based access control middleware
  - [x] 9.1 Create RBAC middleware for manager routes
    - Check user role is "manager"
    - Deny access to restricted routes (campaign creation, tenant settings, voucher management)
    - Allow access to manager-specific routes
    - Return 403 for unauthorized access attempts
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 9.2 Write property tests for RBAC
    - **Property 22: Role-Based Access Control for Restricted Routes**
    - **Property 23: Manager Route Access**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
  
  - [x] 9.3 Write unit tests for RBAC edge cases
    - Test manager accessing campaign routes (denied)
    - Test manager accessing tenant settings (denied)
    - Test manager accessing voucher management (denied)
    - Test manager accessing allowed routes (permitted)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [-] 10. Audit trail and immutability
  - [x] 10.1 Implement audit log creation in verification service
    - Create audit log entry on every approve/reject action
    - Record manager ID, action type, task completion ID, timestamp, comment
    - Store bonus spins granted (null for rejections)
    - _Requirements: 7.1, 7.2_
  
  - [x] 10.2 Implement audit log immutability
    - Remove update and delete operations from audit log API
    - Add database constraints to prevent modifications
    - _Requirements: 7.5_
  
  - [x] 10.3 Write property tests for audit trail
    - **Property 15: Audit Log Creation**
    - **Property 16: Multi-Tenant Isolation for Audit Logs**
    - **Property 17: Audit Log Filtering**
    - **Property 18: Audit Log Immutability**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 11. Manager portal UI - Authentication
  - [x] 11.1 Create manager login page at /manager/login
    - Create login form with email and password fields
    - Call POST /api/manager/auth/login on submit
    - Store JWT token in secure cookie or localStorage
    - Redirect to manager dashboard on success
    - Display error messages for invalid credentials
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 11.2 Create manager layout with navigation
    - Create layout component with logout button
    - Implement logout functionality calling POST /api/manager/auth/logout
    - Redirect to login page after logout
    - _Requirements: 2.5_
  
  - [x] 11.3 Implement session management
    - Check for valid token on protected routes
    - Redirect to login if token expired or invalid
    - Refresh token if needed
    - _Requirements: 2.4_

- [x] 12. Manager portal UI - Dashboard
  - [x] 12.1 Create manager dashboard page at /manager/dashboard
    - Display summary cards: pending, verified, rejected task counts
    - Fetch counts from GET /api/manager/tasks/pending with status filters
    - Apply manager authentication
    - _Requirements: 9.1_
  
  - [x] 12.2 Create task completion table component
    - Display task completions in sortable table
    - Show columns: customer ID, phone last 4, task type, submission time, status
    - Implement row hover highlighting
    - Add "View Details" button for each row
    - Implement pagination
    - _Requirements: 9.2, 9.3_
  
  - [x] 12.3 Implement task filtering
    - Add status filter dropdown (All, Pending, Verified, Rejected)
    - Update table when filter changes
    - _Requirements: 3.6_

- [x] 13. Manager portal UI - Task verification
  - [x] 13.1 Create task detail modal component
    - Display full task information: type, target URL, submission time
    - Display minimal customer data: ID, phone last 4 digits
    - Display task requirements and bonus spins
    - Show current status and verification history if available
    - _Requirements: 4.1, 9.4_
  
  - [x] 13.2 Implement approval/rejection form
    - Add comment textarea (required field)
    - Add "Approve" and "Reject" buttons
    - Validate comment is not empty before submission
    - Call POST /api/manager/tasks/:id/approve or /reject
    - Display success/error messages
    - Close modal and refresh table on success
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  
  - [x] 13.3 Add loading states and feedback
    - Show loading spinner during API calls
    - Display success toast on approval/rejection
    - Display error toast on failure
    - Disable buttons during submission
    - _Requirements: 9.5_

- [ ] 14. Tenant Admin UI - Manager management
  - [x] 14.1 Create manager management page at /admin/managers
    - Display list of managers for tenant
    - Show columns: name, email, status, max bonus spins, total approvals
    - Add "Add Manager" button
    - Fetch managers from GET /api/admin/managers
    - _Requirements: 11.1, 11.5_
  
  - [~] 14.2 Create manager creation form
    - Display form with fields: email, name, password, maxBonusSpinsPerApproval
    - Validate all required fields
    - Call POST /api/admin/managers on submit
    - Display success/error messages
    - Refresh manager list on success
    - _Requirements: 11.2, 11.3_
  
  - [~] 14.3 Create manager edit form
    - Display form with fields: name, maxBonusSpinsPerApproval, isActive
    - Pre-populate with current values
    - Call PUT /api/admin/managers/:id on submit
    - Display success/error messages
    - Refresh manager list on success
    - _Requirements: 11.4, 11.6_
  
  - [~] 14.4 Create audit log viewer
    - Display audit logs for selected manager
    - Show columns: timestamp, action, task ID, comment, bonus spins granted
    - Implement filtering by date range and action type
    - Fetch logs from GET /api/admin/managers/:id/audit-logs
    - _Requirements: 7.3, 7.4_

- [~] 15. Checkpoint - Ensure complete system works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Integration and end-to-end testing
  - [~] 16.1 Write end-to-end test for complete verification flow
    - Test: Tenant admin creates manager → Manager logs in → Manager views pending tasks → Manager approves task → Customer receives bonus spins and notification
    - Verify multi-tenant isolation throughout
    - Verify audit trail creation
    - _Requirements: All requirements_
  
  - [~] 16.2 Write end-to-end test for rejection flow
    - Test: Manager rejects task → Customer receives rejection notification → Audit log created
    - _Requirements: 4.5, 6.2, 7.1, 7.2_
  
  - [~] 16.3 Write security tests
    - Test cross-tenant access prevention
    - Test RBAC enforcement
    - Test password hashing
    - Test token validation
    - Test SQL injection prevention
    - _Requirements: 8.1, 8.2, 8.3, 10.1, 10.2, 10.3_

- [ ] 17. Error handling and edge cases
  - [~] 17.1 Implement comprehensive error handling
    - Add try-catch blocks in all service methods
    - Return appropriate HTTP status codes
    - Format error responses consistently
    - Log errors for debugging
    - _Requirements: All requirements_
  
  - [~] 17.2 Handle external service failures
    - Implement retry logic for WhatsApp service
    - Handle database connection errors
    - Handle transaction failures with rollback
    - _Requirements: 6.4, 6.5_
  
  - [~] 17.3 Write unit tests for error scenarios
    - Test database connection failures
    - Test WhatsApp service failures
    - Test transaction rollbacks
    - Test validation errors
    - Test authorization errors
    - _Requirements: All requirements_

- [~] 18. Final checkpoint and documentation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → services → API → UI
- Multi-tenant isolation is enforced at every layer
- Audit trail is immutable and comprehensive
