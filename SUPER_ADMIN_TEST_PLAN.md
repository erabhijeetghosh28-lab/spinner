# Super Admin Testing Plan

## Test Environment Setup
- [ ] Database seeded with test data
- [ ] Multiple tenants with different plans
- [ ] Super admin account created
- [ ] Test tenant admin accounts created

---

## 1. Authentication & Access Control

### Login
- [ ] Super admin can login at `/admin/super`
- [ ] Invalid credentials are rejected
- [ ] Regular tenant admins cannot access super admin routes
- [ ] Session persists across page refreshes
- [ ] Logout works correctly

### Route Protection
- [ ] All `/admin/super/*` routes require super admin authentication
- [ ] Unauthenticated users are redirected to login
- [ ] Regular admins are redirected if they try to access super admin routes

---

## 2. Dashboard - Overview Tab

### Stats Display
- [ ] Total tenants count is accurate
- [ ] Active tenants count is accurate
- [ ] Total revenue calculation is correct
- [ ] Monthly recurring revenue (MRR) is accurate
- [ ] Stats update when data changes

### Recent Activity
- [ ] Shows recent tenant signups
- [ ] Shows recent plan changes
- [ ] Activity list is sorted by date (newest first)
- [ ] Activity items have correct timestamps

---

## 3. Dashboard - Tenants Tab

### Tenant List
- [ ] All tenants are displayed
- [ ] Tenant name, slug, plan, status shown correctly
- [ ] Campaign count is accurate
- [ ] User count is accurate
- [ ] Created date is formatted correctly

### Create New Tenant
- [ ] "New Tenant" button opens modal
- [ ] All required fields are validated (name, slug, plan)
- [ ] Slug uniqueness is enforced
- [ ] Contact phone is optional
- [ ] WhatsApp config fields are optional
- [ ] Tenant is created successfully
- [ ] Default campaign is created for new tenant
- [ ] Default prizes are created for new tenant
- [ ] Success message is shown
- [ ] Tenant list refreshes after creation

### Edit Tenant
- [ ] Edit button opens modal with pre-filled data
- [ ] Name can be updated
- [ ] Slug can be updated (uniqueness checked)
- [ ] Plan can be changed
- [ ] Contact phone can be updated
- [ ] Active status can be toggled
- [ ] WhatsApp config can be updated
- [ ] Tenant admin password can be changed (optional)
- [ ] Password must be at least 6 characters
- [ ] Changes are saved successfully
- [ ] Tenant list refreshes after update

### Delete Tenant
- [ ] Delete button shows confirmation prompt
- [ ] Tenant is deleted successfully
- [ ] Associated data is cascaded (campaigns, users, etc.)
- [ ] Tenant list refreshes after deletion
- [ ] Error shown if deletion fails (foreign key constraints)

### WhatsApp Configuration
- [ ] API URL field works
- [ ] API Key field works
- [ ] Sender field works
- [ ] Media API URL field works
- [ ] Media API Key field works
- [ ] Media Sender field works
- [ ] Config is saved as JSON in database
- [ ] Empty config fields are handled correctly

---

## 4. Dashboard - Plans Tab

### Plan List
- [ ] All subscription plans are displayed
- [ ] Plan name, price, billing cycle shown
- [ ] Feature limits displayed correctly
- [ ] Active/inactive status shown

### Plan Features Display
- [ ] Monthly campaign limit shown
- [ ] Monthly spin limit shown
- [ ] Monthly voucher limit shown
- [ ] Monthly user limit shown
- [ ] Unlimited limits shown as "Unlimited"
- [ ] QR code generator feature shown

---

## 5. Analytics Page

### Platform-Wide Metrics
- [ ] Total spins across all tenants
- [ ] Total vouchers issued
- [ ] Total users registered
- [ ] Active campaigns count
- [ ] Metrics are accurate

### Tenant Comparison
- [ ] Top performing tenants shown
- [ ] Metrics per tenant are accurate
- [ ] Sorting works correctly
- [ ] Data refreshes properly

---

## 6. Campaigns Page

### Global Campaign List
- [ ] All campaigns from all tenants shown
- [ ] Tenant name displayed for each campaign
- [ ] Campaign name, status, dates shown
- [ ] Spin count is accurate
- [ ] User count is accurate

### Pause/Unpause Campaign
- [ ] Pause button works for active campaigns
- [ ] Unpause button works for paused campaigns
- [ ] Status updates immediately
- [ ] Confirmation prompt shown
- [ ] Success/error messages displayed

### Campaign Filtering
- [ ] Can filter by tenant
- [ ] Can filter by status (active/inactive)
- [ ] Filters work correctly together

---

## 7. Vouchers Page

### Global Voucher List
- [ ] All vouchers from all tenants shown
- [ ] Tenant name displayed
- [ ] Customer name and phone shown
- [ ] Prize name shown
- [ ] Status (active/redeemed/expired) correct
- [ ] Expiry date shown
- [ ] Redemption count shown

### Void Voucher
- [ ] Void button works
- [ ] Confirmation prompt shown
- [ ] Voucher status updates to voided
- [ ] Cannot void already redeemed vouchers
- [ ] Success/error messages displayed

### Export Vouchers
- [ ] Export button works
- [ ] CSV file is generated
- [ ] All voucher data included
- [ ] File downloads correctly
- [ ] Filtering options work (by tenant, status, date range)

### Voucher Filtering
- [ ] Can filter by tenant
- [ ] Can filter by status
- [ ] Can filter by date range
- [ ] Search by code works
- [ ] Search by customer phone works

---

## 8. WhatsApp Monitoring Page

### Connection Status
- [ ] Shows WhatsApp API connection status per tenant
- [ ] Online/offline status accurate
- [ ] Last checked timestamp shown
- [ ] Refresh button works

### Message Statistics
- [ ] Total messages sent count
- [ ] Failed messages count
- [ ] Success rate percentage
- [ ] Stats per tenant shown

---

## 9. Security Page

### Security Dashboard
- [ ] Active alerts count shown
- [ ] Suspicious activity count shown
- [ ] Failed logins count shown
- [ ] Summary cards display correctly

### Security Alerts
- [ ] All security events shown
- [ ] Severity levels (HIGH, MEDIUM, LOW) displayed
- [ ] Color coding works (red, yellow, blue)
- [ ] Tenant name shown
- [ ] Activity type shown
- [ ] Description shown
- [ ] Timestamp shown

### Suspicious Activity Table
- [ ] All suspicious activities listed
- [ ] Tenant, activity type, description shown
- [ ] Severity shown
- [ ] Timestamp shown
- [ ] Sorted by date (newest first)

### Failed Login Attempts
- [ ] Failed login attempts listed
- [ ] Tenant email shown
- [ ] IP address shown
- [ ] Attempt count shown
- [ ] Last attempt timestamp shown
- [ ] Lock account button works

### Lock/Unlock Tenant
- [ ] Lock button locks tenant account
- [ ] Unlock button unlocks tenant account
- [ ] Confirmation prompts shown
- [ ] Status updates immediately
- [ ] Locked tenants cannot login
- [ ] Success/error messages displayed

---

## 10. Audit Logs Page

### Audit Log List
- [ ] All audit logs shown
- [ ] Timestamp shown
- [ ] Admin email shown
- [ ] Action type shown
- [ ] Target type and ID shown
- [ ] IP address shown
- [ ] User agent shown (in details)

### View Details
- [ ] View button expands details
- [ ] Change details shown as JSON
- [ ] User agent shown
- [ ] Details collapse when clicked again

### Filtering
- [ ] Can filter by admin
- [ ] Can filter by action type
- [ ] Can filter by date range (start date)
- [ ] Can filter by date range (end date)
- [ ] Filters work correctly together

### Pagination
- [ ] Shows correct page range
- [ ] Previous button works
- [ ] Next button works
- [ ] Buttons disabled appropriately
- [ ] Page count is accurate

---

## 11. Tenant Usage & Overrides

### View Tenant Usage
- [ ] Can view usage for any tenant
- [ ] Current usage shown for all limits
- [ ] Plan limits shown
- [ ] Percentage used calculated correctly
- [ ] Overrides shown if present

### Manual Overrides
- [ ] Can set override for campaign limit
- [ ] Can set override for spin limit
- [ ] Can set override for voucher limit
- [ ] Can set override for user limit
- [ ] Can set unlimited (-1) for any limit
- [ ] Overrides take precedence over plan limits
- [ ] Overrides are saved correctly
- [ ] Can remove overrides

### Reset Usage
- [ ] Reset button works
- [ ] Confirmation prompt shown
- [ ] All usage counters reset to 0
- [ ] Success message shown
- [ ] Usage display updates

---

## 12. Billing Features

### Revenue Dashboard
- [ ] Total revenue shown
- [ ] MRR (Monthly Recurring Revenue) shown
- [ ] Revenue by plan shown
- [ ] Charts display correctly

### Upcoming Renewals
- [ ] Shows tenants with upcoming renewals
- [ ] Renewal date shown
- [ ] Plan and amount shown
- [ ] Sorted by date (soonest first)

### Failed Payments
- [ ] Shows tenants with failed payments
- [ ] Failure reason shown
- [ ] Last attempt date shown
- [ ] Retry button works (if implemented)

---

## 13. Bulk Operations

### Bulk Export
- [ ] Can export all tenants
- [ ] CSV file generated correctly
- [ ] All tenant data included
- [ ] File downloads successfully

### Bulk Grant Bonus
- [ ] Can select multiple tenants
- [ ] Can grant bonus spins
- [ ] Can grant bonus vouchers
- [ ] Bonuses applied correctly
- [ ] Success message shown

### Bulk Plan Change
- [ ] Can select multiple tenants
- [ ] Can change plan for all selected
- [ ] Confirmation prompt shown
- [ ] Plans updated correctly
- [ ] Success message shown

---

## 14. Navigation & UI

### SuperAdminNav Component
- [ ] Logo and title shown
- [ ] All navigation links present
- [ ] Active page highlighted (amber background)
- [ ] Links navigate correctly
- [ ] Logout button works
- [ ] Mobile responsive (collapses on small screens)

### Consistent Across Pages
- [ ] Nav appears on all super admin pages
- [ ] Styling consistent
- [ ] Active state works on all pages

---

## 15. Error Handling

### API Errors
- [ ] Network errors shown to user
- [ ] Validation errors displayed
- [ ] 404 errors handled
- [ ] 500 errors handled
- [ ] Error messages are user-friendly

### Form Validation
- [ ] Required fields validated
- [ ] Email format validated
- [ ] Phone format validated
- [ ] Slug format validated (no spaces, special chars)
- [ ] Password length validated
- [ ] Validation messages shown

---

## 16. Performance

### Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Tenant list loads in < 2 seconds
- [ ] Campaign list loads in < 3 seconds
- [ ] Voucher list loads in < 3 seconds
- [ ] Audit logs load in < 2 seconds

### Data Refresh
- [ ] Lists refresh after create/update/delete
- [ ] Stats update after changes
- [ ] No unnecessary API calls
- [ ] Loading states shown during operations

---

## 17. Data Integrity

### Tenant Management
- [ ] Tenant creation doesn't break existing data
- [ ] Tenant update preserves relationships
- [ ] Tenant deletion cascades correctly
- [ ] No orphaned records after deletion

### Plan Changes
- [ ] Changing plan updates limits correctly
- [ ] Usage tracking continues after plan change
- [ ] Overrides persist after plan change

### Voucher Operations
- [ ] Voiding voucher doesn't affect other vouchers
- [ ] Export includes all data accurately
- [ ] Filtering doesn't lose data

---

## 18. Security

### Authentication
- [ ] Passwords are hashed
- [ ] Sessions are secure
- [ ] CSRF protection in place
- [ ] XSS protection in place

### Authorization
- [ ] Only super admins can access super admin routes
- [ ] API endpoints check authentication
- [ ] Tenant isolation maintained
- [ ] No data leakage between tenants

### Audit Trail
- [ ] All admin actions logged
- [ ] IP addresses captured
- [ ] User agents captured
- [ ] Timestamps accurate
- [ ] Logs cannot be tampered with

---

## 19. Edge Cases

### Empty States
- [ ] Empty tenant list handled
- [ ] No campaigns message shown
- [ ] No vouchers message shown
- [ ] No audit logs message shown
- [ ] No security alerts message shown

### Boundary Conditions
- [ ] Unlimited limits (-1) handled correctly
- [ ] Zero limits handled
- [ ] Very large numbers handled
- [ ] Very long text handled (truncation)

### Concurrent Operations
- [ ] Multiple admins can work simultaneously
- [ ] Race conditions handled
- [ ] Optimistic locking where needed

---

## 20. Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Responsive design works

---

## Test Execution Notes

### Priority Levels
- **P0 (Critical)**: Authentication, tenant CRUD, plan changes
- **P1 (High)**: Voucher management, campaigns, security
- **P2 (Medium)**: Analytics, audit logs, bulk operations
- **P3 (Low)**: UI polish, edge cases

### Test Data Requirements
- At least 3 tenants with different plans
- At least 10 campaigns across tenants
- At least 50 vouchers in various states
- At least 20 audit log entries
- At least 5 security events

### Known Issues to Verify
- [ ] Tenant update failing with "Failed to update tenant" error
- [ ] All super admin pages have SuperAdminNav import
- [ ] All tenant admin pages have AdminNav import

---

## Test Results Summary

**Date**: _____________
**Tester**: _____________
**Environment**: _____________

**Total Tests**: _____
**Passed**: _____
**Failed**: _____
**Blocked**: _____
**Not Tested**: _____

**Critical Issues Found**: _____
**High Priority Issues**: _____
**Medium Priority Issues**: _____
**Low Priority Issues**: _____

**Overall Status**: ☐ PASS ☐ FAIL ☐ BLOCKED

**Notes**:
