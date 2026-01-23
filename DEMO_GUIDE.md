# 🎯 Complete Demo Guide

## ✅ Demo Setup Complete!

Your database has been seeded with a complete demo tenant ready for testing.

---

## 📋 Login Credentials

### Super Admin
- **Email:** `super@admin.com` (or check your `.env` for `ADMIN_EMAIL`)
- **Password:** `admin123` (or check your `.env` for `ADMIN_PASSWORD`)
- **Access:** `/admin/super/dashboard`

### Tenant Admin (Demo Business)
- **Email:** `admin@default.com`
- **Password:** `tenant123`
- **Access:** `/admin/dashboard`

---

## 🌐 Demo URLs

### User-Facing Pages
- **Campaign Page:** `http://localhost:3000/?tenant=default`
- **Landing Page:** `http://localhost:3000/landing/[campaignId]` (after publishing)

### Admin Pages
- **Tenant Dashboard:** `http://localhost:3000/admin/dashboard`
- **Super Admin Dashboard:** `http://localhost:3000/admin/super/dashboard`

---

## ✨ What's Included in the Demo

### 1. Demo Tenant: "Demo Business"
- **Slug:** `default`
- **Subscription:** Starter Plan (social tasks enabled)
- **Status:** Active

### 2. Active Campaign: "Spin & Win Campaign"
- **Template:** Classic
- **Status:** Active
- **Duration:** 90 days from seed date
- **Features:**
  - 5 Prizes configured
  - 3 Social Tasks (VISIT tasks - policy compliant)
  - Spin limit: 1 per user
  - Cooldown: 24 hours

### 3. Prizes (5 total)
1. **50% Off** - Coupon: `ZIGGY50`
2. **Free Shipping** - Coupon: `ZIGGYFREE`
3. **₹100 Off** - Coupon: `ZIGGY100`
4. **Buy 1 Get 1** - Coupon: `ZIGGY11`
5. **No Prize** - Try again

### 4. Social Tasks (3 VISIT tasks - Policy Compliant)
1. **Visit Our Facebook Page** - 2 spins reward
2. **Visit Our Instagram Profile** - 2 spins reward
3. **View Our Latest Post** - 1 spin reward

All tasks use **VISIT** language (not "Like") to comply with Meta Policy 4.5.

---

## 🧪 Testing the Demo

### Test User Flow

1. **Visit Campaign Page:**
   ```
   http://localhost:3000/?tenant=default
   ```

2. **Login/Register:**
   - Enter phone number
   - Receive OTP
   - Enter OTP to verify

3. **Spin the Wheel:**
   - Click "SPIN WHEEL NOW"
   - Watch animation
   - See prize result

4. **Complete Social Tasks:**
   - Scroll to "Earn Extra Spins" section
   - Click on a social task
   - Click "Visit Facebook" (or Instagram)
   - Wait 15 seconds (timer)
   - Click "Claim Reward"
   - Get instant verification and spins!

### Test Admin Flow

1. **Login to Admin Dashboard:**
   ```
   http://localhost:3000/admin/dashboard
   ```
   - Email: `admin@default.com`
   - Password: `tenant123`

2. **View Campaigns:**
   - Go to "Campaigns" tab
   - See "Spin & Win Campaign" listed
   - View usage stats (1/3 campaigns used)

3. **Manage Social Tasks:**
   - Click "Social" button next to campaign
   - See 3 demo tasks
   - Create new VISIT tasks
   - Edit/delete existing tasks

4. **Build Landing Page:**
   - Click "Landing" button next to campaign
   - Edit Hero section
   - Add Offers
   - Configure Footer
   - Click "Publish" to make it live

5. **View Analytics:**
   - Go to "Analytics" tab
   - See campaign statistics

---

## 🎨 Features to Test

### ✅ Policy-Compliant Social Tasks
- All tasks use "Visit" language (not "Like")
- Time-based verification (15s timer + 10s server check)
- Immediate verification (no 5-minute delay)
- Server-side timestamp tracking (prevents cheating)

### ✅ Landing Page Builder
- Create custom landing pages
- Add hero sections, offers, footer
- Publish/unpublish pages
- View live at `/landing/[campaignId]`

### ✅ Subscription System
- Usage stats dashboard
- Campaign limits enforcement
- Social task limits
- Upgrade prompts

### ✅ Multi-Tenant System
- Tenant isolation
- Per-tenant settings
- Tenant-specific campaigns

---

## 🔧 Quick Commands

### Reset Database (Re-seed)
```bash
npx prisma db push --force-reset
npx prisma db seed
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Check Database
```bash
npx prisma studio
```

---

## 📝 Notes

### Social Tasks
- **Policy Compliance:** All tasks use "Visit" language to comply with Meta Policy 4.5
- **Verification:** Time-based (user must wait 10+ seconds after clicking)
- **Immediate:** VISIT tasks verify instantly (no cron delay)
- **Legacy Support:** Old LIKE tasks still work but are hidden from UI

### Subscription Plans
- **Free:** 1 campaign/month, no social tasks
- **Starter:** 3 campaigns/month, 3 social tasks (demo tenant uses this)
- **Pro:** 10 campaigns/month, 10 social tasks
- **Enterprise:** Unlimited

### Rate Limits
- Meta API: 200 calls/hour per app
- System tracks per-tenant usage
- Hard limit at 190/hour (10 buffer)

---

## 🚀 Next Steps

1. **Test the User Flow:**
   - Register a user
   - Spin the wheel
   - Complete social tasks
   - Verify instant rewards

2. **Test Admin Features:**
   - Create new campaigns
   - Add social tasks
   - Build landing pages
   - View analytics

3. **Customize:**
   - Update tenant name
   - Add custom prizes
   - Configure WhatsApp notifications
   - Set up Meta API tokens (for Connect tasks)

---

## 🎉 Demo is Ready!

Everything is set up and ready for testing. The demo tenant has:
- ✅ Active campaign with prizes
- ✅ Policy-compliant social tasks
- ✅ Starter plan (social features enabled)
- ✅ Landing page builder ready
- ✅ All features functional

**Start testing at:** `http://localhost:3000/?tenant=default`
