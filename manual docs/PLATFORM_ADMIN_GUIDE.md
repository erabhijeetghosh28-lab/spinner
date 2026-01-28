# Platform Admin & Technical Guide

**Target Audience:** Super Admins, DevOps, & Technical Support
**Purpose:** Maintain, scale, and manage the Offer Wheel SaaS platform.

---

## 👑 1. Super Admin Dashboard

**URL:** `/admin/login`
**Default Credentials:** `offer@admin.com` (Check `.env` for `ADMIN_PASSWORD`)

### Managing Tenants (Businesses)
*   **Onboarding:** Create new tenants by assigning them a unique `slug` (e.g., `burger-king`).
*   **Plan Assignment:** Move tenants between Free, Basic, and Pro plans to control their limits.
    *   *Free:* 2 Offers, Basic Analytics.
    *   *Pro:* Unlimited Offers, Custom Branding, WhatsApp Integration.
*   **Access Control:** Reset passwords for tenant admins if they are locked out.

### Global Overview
*   **Health Check:** Monitor system status.
*   **Revenue:** Track monthly subscription growth.
*   **Platform Stats:** Total users across all tenants.

---

## ⚙️ 2. Global Configuration

### WhatsApp Integration (CloudWAPI)
The platform uses a centralized WhatsApp API for tenants who don't bring their own.
*   **Setup:**
    1.  Register at `cloudwapi.com` (or your chosen provider).
    2.  Get `INSTANCE_ID` and `ACCESS_TOKEN`.
    3.  Add to Environment Variables (see Section 3).
*   **Tenant Override:** Per-tenant configuration is possible in the Tenant Edit modal if a client wants to use their own number.

### Email/SMTP
Used for password resets and admin notifications.
*   **Provider:** Resend, SendGrid, or AWS SES.
*   **Config:** Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` in `.env`.

---

## 💻 3. Technical Setup & Deployment

### Environment Variables (.env)
Critical keys for the application to run.
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# UploadThing (Image Hosting)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."

# WhatsApp (Global Fallback)
WA_API_URL="https://api.cloudwapi.com"
WA_INSTANCE_ID="..."
WA_ACCESS_TOKEN="..."
```

### Deployment (Vercel Recommended)
1.  **repository:** Connect your GitHub repo to Vercel.
2.  **Build Command:** `next build`
3.  **Install Command:** `npm install`
4.  **Database Migration:** Ensure `prisma migrate deploy` runs during build or manually before promotion.
5.  **Cron Jobs:** Vercel Cron is configured in `vercel.json` to handle scheduled tasks (e.g., subscription expiry checks).

---

## 🔧 4. Troubleshooting & Maintenance

### Common Issues
*   **"Prisma Client Error":** Usually means schema changes haven't been applied. Run `npx prisma migrate deploy`.
*   **"Upload Failed":** Check `UPLOADTHING_SECRET` key validity.
*   **"WhatsApp Not Sending":** Verify the instance is "Connected" in the CloudWAPI dashboard.

### Database Maintenance
*   **Backups:** Schedule daily backups of your PostgreSQL database (e.g., via Supabase or Neon console).
*   **Pruning:** Periodically archive old lead data if storage limits are approached (though text data is small).

### Logs
*   Check Vercel "Runtime Logs" for backend errors.
*   Client-side errors will appear in the browser console.

---

## 🔒 5. Security Best Practices

1.  **Least Privilege:** Do not give Super Admin access to regular staff; create a "Support" role if needed (future feature).
2.  **Key Rotation:** Rotate `NEXTAUTH_SECRET` and API keys every 6 months.
3.  **HTTPS:** Always force HTTPS (handled automatically by Vercel).
4.  **Input Validation:** The system uses Zod for schema validation to prevent injection attacks.
