# 🚀 Vercel Deployment Guide

Your project is **Vercel Ready**.
A type check was run (`tsc --noEmit`) and passed with **0 errors**.

## 1. Prerequisites
- A [Vercel Account](https://vercel.com).
- A [Neon Database](https://neon.tech) (Postgres).
- This project pushed to GitHub.

## 2. Environment Variables
You must set these in Vercel under **Settings > Environment Variables**:

| Variable | Description | Example Value | Required? |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Connection string from Neon | `postgres://...` | **YES** |
| `NEXTAUTH_SECRET` | Secret for session security | (Random String) | **YES** |
| `NEXTAUTH_URL` | Your production URL | `https://your-app.vercel.app` | **YES** |
| `ADMIN_EMAIL` | Override default admin email | `admin@example.com` | No (Default: `super@admin.com`) |
| `ADMIN_PASSWORD` | Override default password | `securepassword` | No (Default: `admin123`) |
| `WHATSAPP_API_KEY` | Override default API Key | `xyz...` | No (Uses code default) |

## 3. Build Settings (Default)
Vercel should auto-detect these, but if asked:
- **Framework Preset**: Next.js
- **Build Command**: `next build` (or `npm run build`)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

## 4. Post-Deployment Steps
Once deployed:
1.  **Database Migration**: The build script `postinstall` runs `prisma generate`, but you might need to push the schema if the DB is new.
    - Go to Vercel dashboard > Storage (or use Neon directly).
    - Or run locally: `npx prisma db push` (pointing to the production DB URL).
2.  **Seeding**: To create the initial Super Admin:
    ```bash
    # Run this locally pointing to your PROD database
    # (Update .env to prod URL temporarily, or utilize a rigorous pipeline)
    npx prisma db seed
    ```
    *Tip: You might not be able to run seed strictly on Vercel's serverless functions easily without a custom command. Running it locally once against the Prod DB is the easiest way.*
