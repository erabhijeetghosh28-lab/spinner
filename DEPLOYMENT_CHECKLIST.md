# Deployment Readiness Checklist

## ✅ Completed Fixes

### 1. Performance Optimizations
- [x] Fixed N+1 query problem in `/api/spin` route (optimized with `groupBy`)
- [x] Added Prisma query logging configuration
- [x] Added production optimizations to `next.config.ts` (compression, security headers)

### 2. Security Improvements
- [x] Created authentication helper (`lib/auth.ts`)
- [x] Added authentication check to admin routes (starting with `/api/admin/stats`)
- [x] Added input validation and sanitization for phone numbers and OTP
- [x] Added rate limiting for OTP endpoints (3 requests per minute per phone)
- [x] Added security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)

### 3. Input Validation
- [x] Phone number validation (regex, length check)
- [x] OTP format validation (6 digits)
- [x] Name sanitization (trim, max length)

### 4. Environment Configuration
- [x] Created environment variable validation (`lib/env.ts`)
- [x] Added warnings for missing recommended env vars

## ⚠️ Critical Items for Production

### 1. Authentication System (HIGH PRIORITY)
**Current Status**: Using mock tokens (`mock-super-admin-token`, `mock-tenant-admin-token`)

**Action Required**:
- [ ] Implement proper JWT token generation in `/api/admin/login`
- [ ] Replace mock tokens with signed JWTs containing admin ID and tenant ID
- [ ] Update `lib/auth.ts` to verify JWT signatures
- [ ] Add token expiration (e.g., 24 hours)
- [ ] Add refresh token mechanism

**Recommended Library**: `jsonwebtoken` or `jose`

### 2. Admin Route Authentication (HIGH PRIORITY)
**Current Status**: Only `/api/admin/stats` has auth check

**Action Required**:
- [ ] Add `requireAdminAuth` to all admin routes:
  - `/api/admin/campaigns`
  - `/api/admin/campaign`
  - `/api/admin/prizes`
  - `/api/admin/analytics`
  - `/api/admin/qr`
  - `/api/admin/stock-alerts`
  - `/api/admin/export/users`
  - `/api/admin/profile/password`
  - `/api/admin/settings`
  - `/api/admin/super/*` routes

### 3. Rate Limiting (MEDIUM PRIORITY)
**Current Status**: Basic in-memory rate limiting for OTP (resets on server restart)

**Action Required**:
- [ ] Implement Redis-based rate limiting for production
- [ ] Add rate limiting to:
  - `/api/spin` (prevent abuse)
  - `/api/admin/*` (prevent brute force)
  - `/api/otp/verify` (prevent OTP brute force)

**Recommended**: Use `@upstash/ratelimit` or `rate-limiter-flexible`

### 4. Error Logging (MEDIUM PRIORITY)
**Current Status**: Using `console.error` throughout

**Action Required**:
- [ ] Integrate proper logging service (e.g., Sentry, LogRocket, or Winston)
- [ ] Replace `console.error` with structured logging
- [ ] Add error tracking and alerting

### 5. Database Connection Pooling (LOW PRIORITY)
**Current Status**: Using default Prisma connection pooling

**Action Required**:
- [ ] Configure connection pool size in `DATABASE_URL` or Prisma config
- [ ] Monitor connection pool usage
- [ ] Set appropriate pool limits for your database provider

### 6. CORS Configuration (LOW PRIORITY)
**Current Status**: No explicit CORS configuration

**Action Required**:
- [ ] Add CORS headers if API will be accessed from different domains
- [ ] Configure allowed origins in `next.config.ts` or middleware

### 7. Environment Variables
**Required**:
- `DATABASE_URL` - Database connection string

**Recommended**:
- `NEXT_PUBLIC_BASE_URL` - Public base URL for QR codes and links
- `WHATSAPP_API_URL` - WhatsApp API endpoint
- `WHATSAPP_API_KEY` - WhatsApp API key
- `WHATSAPP_SENDER` - WhatsApp sender number
- `JWT_SECRET` - Secret for signing JWT tokens (if implementing JWT)

### 8. Middleware Deprecation
**Current Status**: Next.js warns about middleware file convention

**Action Required**:
- [ ] Consider migrating to Next.js 16+ route handlers for complex routing
- [ ] Or keep middleware for simple routing (warning is non-blocking)

## Pre-Deployment Steps

1. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   # or
   npx prisma db push
   ```

2. **Seed Database** (if needed):
   ```bash
   npx prisma db seed
   ```

3. **Build Application**:
   ```bash
   npm run build
   ```

4. **Test Production Build Locally**:
   ```bash
   npm start
   ```

5. **Set Environment Variables** in your hosting platform (Vercel, etc.)

6. **Verify**:
   - [ ] All environment variables are set
   - [ ] Database connection works
   - [ ] Admin login works
   - [ ] OTP sending works
   - [ ] Spin wheel functionality works

## Post-Deployment Monitoring

- [ ] Monitor error logs
- [ ] Monitor database connection pool
- [ ] Monitor API response times
- [ ] Set up alerts for critical errors
- [ ] Monitor rate limiting effectiveness

## Notes

- The current implementation uses mock tokens for development convenience
- **DO NOT deploy to production without implementing proper JWT authentication**
- Rate limiting is in-memory and will reset on server restart (use Redis for production)
- All admin routes should verify authentication before processing requests
