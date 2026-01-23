# 📋 Active Directives

This document tracks work to be executed by the **Senior Developer (Cursor)**.

# 🛠️ "Post-Migration Polish" Fix List (Priority: Critical) ✅ COMPLETED

## 1. 👑 Super Admin Dashboard Fixes ✅
- [x] **Plans UI**:
    - [x] **Add Edit Buttons**: The Plan cards show data but lack an "Edit" button. Add a pencil/edit icon to each card.
    - [x] **Remove "Custom Templates"**: Remove this checkbox from the "New/Edit Plan" modal (user strategy change).
- [x] **Tenant Modal**:
    - [x] **Add Mobile Number**: Add a `contactPhone` field to the Tenant form (Database + UI).
- [x] **Navigation**:
    - [x] **Remove Templates Tab**: Hide the "Templates" tab from the main navigation.
- [x] **Security / User Management**:
    - [x] **Super Admin Change Password**: Add "Change Password" option in header/profile menu.
    - [x] **Reset Tenant Password**: In "Edit Tenant", allow Super Admin to set a new password for the Tenant Admin.

## 2. 🏢 Tenant Admin Dashboard Fixes ✅
- [x] **Template Selector**:
    - [x] **Add Visual Preview**: When selecting a theme from the dropdown, show the corresponding `thumbnail` image so the admin knows what it looks like.
    - [x] **Dropdown**: Ensure it lists all active templates.
- [x] **Security**:
    - [x] **Change Password**: Add "Change Password" option in the Tenant Admin profile menu.

## 3. 🎡 Frontend (User App) Flow Refactor ✅
- [x] **Strict Gating**: Default view = **Login/OTP Form**. Hide Wheel completely until verified.
- [x] **Data Collection**:
    - [x] **Add Name Input**: The `OTPForm` must capture **Name** and **Phone**.
    - [x] **Backend Update**: Ensure `/api/otp/verify` saves the `name` to the Database during creation.
- [x] **Flow Update**:
    1.  User lands -> Sees Form (**Name** & Phone).
    2.  User submits -> Enters OTP.
    3.  Verified -> **Show Spin Wheel** (Header says: "Hello, [Name]").
    4.  User Spins -> **Show Result & Referral Link**.
- [x] **Visuals**: Render the `Campaign.logoUrl` in the center of the wheel if set.

## 4. Database Schema Updates ✅
- [x] Add `logoUrl` to `Campaign` model.
- [x] Add `contactPhone` to `Tenant` model.

## 5. Deployment Preparation ✅
- [x] **Git**: Initialized and pushed to `erabhijeetghosh28-lab/spinner`.
- [x] **Vercel Config**: Verified `package.json`, `next.config.ts`, and typescript build.
- [x] **Documentation**: Created `VERCEL_DEPLOYMENT.md`.
- [x] **Security Fix**: Upgraded Next.js to v16+ to resolve CVE-2025-66478.
- [x] (Optional) Ensure `waConfig` JSON structure is strict.

## 6. User Guides & Documentation ✅
- [x] **Super Admin Guide**: Created `brain/SUPER_ADMIN_GUIDE.md`.
- [x] **Tenant Admin Guide**: Created `brain/TENANT_ADMIN_GUIDE.md`.
- [x] **Process Overview**: Created `brain/PROCESS_OVERVIEW.md`.

## 🛠️ Instructions for Cursor
1.  **Strictly follow `brain/implementation_plan.md`**. ✅ **FOLLOWED**
2.  The database reset is authorized for this migration. ✅ **COMPLETED**
3.  Ensure `tenantId` is passed in all API calls once schema is updated. ✅ **VERIFIED**
4.  **⚠️ CRITICAL**: Always check TypeScript errors during development, NOT during deployment.
   - Run `npx tsc --noEmit` after code changes
   - Fix all TypeScript errors before committing
   - See `brain/DEVELOPMENT_GUIDELINES.md` for details

## 📝 Next Steps (Optional Enhancements)

1. **Subdomain Routing**: Implement subdomain-based tenant detection
2. **Multiple Campaigns & Scheduling**: ✅ **COMPLETED**
   - [x] **Backend**: Update `/api/campaigns` to filter by date range (`startDate <= now <= endDate`)
   - [x] **Frontend**: Auto-select active campaign based on current date
   - [x] **Admin UI**: Add "Campaigns" page to list/create/edit/schedule multiple campaigns
   - [x] **UI Components**: Date pickers for `startDate` and `endDate`
   - [x] **Validation**: Ensure Pro plan users can create up to `maxCampaigns` (Basic = 1, Pro = 5)
3. **Template Preview**: Add visual previews in Super Admin dashboard
4. **Custom Templates**: Allow tenants to create custom templates (if plan allows)
5. **Tenant Admin Dashboard**: Update existing dashboard to be fully tenant-scoped
    - [x] **Customer Link Visibility**: Display the unique `?tenant=slug` link in the dashboard for easy sharing.
    - [x] **Embed Code Generator**: Allow tenants to copy an iframe snippet. ✅ **IMPLEMENTED**
6. **Bonus Spin UI**: Add notifications for earned bonus spins
7. **White Labeling**:
    - [x] **Strategy**: Created `brain/DOMAIN_INTEGRATION.md`.
    - [x] **Middleware**: Implemented `middleware.ts` for Subdomain Rewriting (`slug.app.com` -> `?tenant=slug`).
    - [x] **Schema**: Added `customDomain` to `Tenant` model and `allowCustomDomain`/`allowEmbedding` to `Plan` model.
    - [x] **Embed Code UI**: Added iframe generator to Tenant Admin Dashboard.


## 🌟 Premium Features (Plan-Gated)

**Implementation Plan**: See `C:\Users\abhij\.gemini\antigravity\brain\5b5802d8-c0c9-4439-843e-234285282636\premium_features_plan.md`

3. **Analytics Dashboard** ✅ **COMPLETED**
   - [x] Schema: Add `allowAnalytics` to `Plan` model
   - [x] API: Create `/api/admin/analytics` endpoint
   - [x] UI: Add Analytics tab with KPIs, charts, date picker
   - [x] Gating: Show only if `plan.allowAnalytics === true`

4. **QR Code Generator** ✅ **COMPLETED**
   - [x] Dependencies: Install `qrcode` library
   - [x] API: Create `/api/admin/qr` endpoint (PNG/SVG export)
   - [x] UI: Add "Generate QR" button in Campaigns tab
   - [x] Gating: Show only if `plan.allowQRCodeGenerator === true`

5. **Prize Inventory Tracking** ✅ **COMPLETED**
   - [x] Schema: Add `currentStock` and `lowStockAlert` to `Prize` model
   - [x] Logic: Decrement stock in `/api/spin` after prize awarded
   - [x] UI: Add stock columns to Prize table, low-stock alerts
   - [x] API: Create `/api/admin/stock-alerts` for banner notifications
   - [x] Gating: Show only if `plan.allowInventoryTracking === true`

6. **Super Admin Controls** ✅ **COMPLETED**
   - [x] UI: Add 3 checkboxes to "Edit Plan" modal for feature flags

---

**Last Updated**: 2025-01-20
**Status**: ✅ **ALL CRITICAL TASKS COMPLETED** - Post-Migration Polish, Multiple Campaigns & Scheduling, and all core features fully implemented and verified. Premium features remain as optional enhancements for future development.
