# 🏗️ Implementation Plan: Multi-Tenancy & Templates Migration

**Goal**: Transform the single-tenant app into a SaaS platform with Super Admin limits, Tenant isolation, and Wheel Templates.

## User Review Required
> [!WARNING]
> This migration requires a **Database Reset**. Existing data (spins, users) will be cleared because we are introducing a mandatory `tenantId` relation.

## Proposed Changes

### 1. Database Schema Overhaul
**New Models**:
- `Plan`: Defines limits (`maxSpins`, `features`).
- `Tenant`: The business entity.
- `WheelTemplate`: Visual configuration presets.

**Modified Models**:
- `Campaign`: Adds `tenantId` (Required), `templateId`.
- `User`: Adds `tenantId` (Required).
- `Spin`: Scoped to Tenant.

### 2. Multi-Level Authentication
- **Super Admin Login**: `/admin/super`
- **Tenant Login**: `/admin/login` (checks Tenant existence via email domain or manual assignment).

### 3. Wheel Templates System
- **Backend**: Store template meta-data (ID, Name, ConfigJSON).
- **Frontend**: Dynamic Component Loader in `SpinWheel.tsx`.
    - Template 1: `Classic` (Current SVGs).
    - Template 2: `Modern` (Gradient heavy).
    - Template 3: `Minimal` (Line art).

### 4. Advanced Referral Engine (New Request)
- **Logic**: "Invite X friends, get 1 free spin".
- **Database**:
    - `Campaign` Model: Add `referralsRequiredForSpin` (Int, Default: 0 = Disabled).
    - `User` Model: Add `successfulReferrals` (Int) - tracks invites who have verified & spun.
    - `Spin`: Add `isReferralBonus` (Boolean).
- **Flow**:
    1.  Referrer shares link.
    2.  Invitee clicks -> Enters Name/Phone -> Verifies OTP -> Spins.
    3.  Backend increments Referrer's `successfulReferrals`.
    4.  If `successfulReferrals % referralsRequiredForSpin == 0`, increment Referrer's available spins (ignore daily limit or add +1 override).

### 5. WhatsApp Integration Logic
- **Default**: Use Environment Variables (Super Admin's CloudWAPI).
- **Override**: If `Tenant.waConfig` exists, use that for `lib/whatsapp.ts`.

## Step-by-Step Execution
1.  **Schema Update**: Edit `prisma/schema.prisma` with new models.
2.  **Seed Update**: Create Default Plan, Default Tenant, Super Admin, and 2 Basic Templates.
3.  **Auth Update**: Refactor `/api/admin/login` to support Tenant lookup.
4.  **Frontend**: Build Super Admin Dashboard (`/admin/super/dashboard`).
5.  **Template Engine**: Refactor `SpinWheel` to accept `templateId`.

## Verification Plan
### Automated Tests
- [ ] Verify Tenant isolation (Tenant A cannot see Tenant B's campaigns).
- [ ] Test WA message sending with overridden credentials.

### Manual Verification
1.  Login as Super Admin -> Create "Pro Plan".
2.  Create new Tenant "Pizza Shop" on "Pro Plan".
3.  Login as "Pizza Shop" Admin.
4.  Select "Neon Template" for wheel.
5.  Verify Spin Wheel renders with Neon styles.
