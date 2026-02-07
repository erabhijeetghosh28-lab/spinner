# Campaign Deletion Fix

## Issue
Tenant admins were getting a 404 error when trying to delete campaigns. The system was implementing a "soft delete" (archiving) instead of permanent deletion.

## Changes Made

### 1. Backend API (`app/api/admin/campaigns/route.ts`)
Changed the DELETE endpoint from soft delete (archiving) to permanent deletion:

**Before:**
- Updated campaign with `isArchived: true` and `archivedAt: new Date()`
- Campaign remained in database

**After:**
- Permanently deletes campaign and all related data
- Handles cascading deletions in correct order:
  1. Landing page components (footer, offers, sections)
  2. Landing page
  3. Vouchers (linked to spins)
  4. Manager audit logs (linked to social task completions)
  5. Social task completions
  6. Social media tasks
  7. Spins
  8. Prizes
  9. Campaign itself

### 2. Frontend (`app/admin/dashboard/page.tsx`)
Updated the delete confirmation message and success message:

**Before:**
- Message: "Are you sure you want to archive this campaign?"
- Success: "Campaign archived successfully!"

**After:**
- Message: "Are you sure you want to permanently delete this campaign? This action cannot be undone..."
- Success: "Campaign deleted successfully!"

## Technical Details

### Database Relations Handled
The deletion properly handles all foreign key constraints by deleting in the correct order:

```typescript
// Order of deletion:
1. CampaignFooter (references LandingPage)
2. OfferShowcase (references LandingPage)
3. LandingPageSection (references LandingPage)
4. LandingPage (references Campaign)
5. Voucher (references Spin and Prize)
6. ManagerAuditLog (references SocialTaskCompletion)
7. SocialTaskCompletion (references SocialMediaTask)
8. SocialMediaTask (references Campaign)
9. Spin (references Campaign)
10. Prize (references Campaign)
11. Campaign
```

### Transaction Safety
All deletions are wrapped in a Prisma transaction to ensure data consistency. If any deletion fails, all changes are rolled back.

## Testing
Build completed successfully with no TypeScript errors or diagnostics.

## Impact
- Campaigns are now permanently deleted instead of archived
- All related data is properly cleaned up
- No orphaned records remain in the database
- Active campaign count is properly updated after deletion
