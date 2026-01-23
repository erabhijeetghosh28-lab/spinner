# 🏗️ System Architecture

## Core Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Postgres (Neon) with Prisma ORM
- **Communication**: WhatsApp (via CloudWAPI)
- **Styling**: Vanilla CSS / Tailwind (Custom Tokens)
- **Auth**: Admin Token based management

## SAAS Database Models (Multi-Tenancy)

### 👑 Super Admin Level
- `SuperAdmin`: The platform owner (You). Managed via generic Admin model.
- `Plan`: Subscription tiers (e.g., Basic, Pro).
    - Controls: `maxSpins`, `maxCampaigns`, `waIntegrationEnabled`, `canUseCustomTemplates`.
- `WheelTemplate`: Pre-designed wheel styles available to tenants.
    - Fields: `name`, `thumbnail`, `configSchema` (JSON), `componentKey`.

### 🏢 Tenant Level
- `Tenant`: Represents a client/business.
    - Fields: `name`, `slug` (subdomain/path), `planId`, `isActive`.
    - Has separate `waConfig` (if allowed by Super Admin).
- `TenantUser`: Admins for the tenant.

### 🎡 Campaign Level (Scoped to Tenant)
- `Campaign`: Now `tenantId` scoped. Links to `WheelTemplate`.
- `Prize`: Scoped to Campaign.
- `EndUser`: The participants. Scoped to Tenant (users can participate in multiple tenant campaigns independently).
- `Spin`: Record of engagement.

## Architecture Strategy
1.  **Isolation**: Logical separation via `tenantId` on all major models.
2.  **Auth**:
    - Super Admin: `/super-admin` route.
    - Tenant Admin: `/app/[tenant_id]/dashboard` or subdomain based.
3.  **WhatsApp**:
    - Centralized: Super Admin configures one Gateway.
    - Tenant-Owned: Tenants provide their own CloudWAPI keys (if Plan allows).
4.  **Templates**:
    - React Component Registry: Map `templateKey` from DB to actual React components (e.g., `ClassicWheel`, `NeonWheel`).

## Referral Engine
Refactored to be Tenant-aware. A referral code is unique *within* a campaign or tenant context.
