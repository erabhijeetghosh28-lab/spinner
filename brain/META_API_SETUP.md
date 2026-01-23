# Meta API Setup - Who Configures What

## API Credentials Setup (One-Time, Super Admin)

### Who Enters: **Super Admin** (You or Platform Owner)
### When: **Once during initial setup**
### Where: **Environment variables or Super Admin dashboard**

---

## Setup Flow

### Step 1: Super Admin Gets API Credentials

**Facebook/Instagram API Setup:**
1. Super Admin goes to https://developers.facebook.com
2. Creates Facebook App (free)
3. Adds Instagram Graph API product
4. Gets credentials:
   - Facebook Page Access Token
   - Facebook Page ID
   - Instagram Business Account ID
   - Instagram Access Token

**This is PLATFORM-WIDE** - applies to all tenants/campaigns

---

### Step 2: Super Admin Enters in System

**Option A: Environment Variables** (Recommended)
```env
# .env (Super Admin configures on server)
FACEBOOK_PAGE_ID=123456789
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=987654321
INSTAGRAM_ACCESS_TOKEN=IGQVJxxxxxxxxxx
```

**Option B: Super Admin Dashboard** (Alternative)
```tsx
// Super Admin Settings Page
function SuperAdminSocialSettings() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Social Media API Settings</h1>
      
      <div className="space-y-8">
        {/* Facebook API */}
        <section className="bg-slate-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">📘 Facebook Graph API</h2>
          
          <div className="space-y-4">
            <div>
              <label>Facebook Page ID</label>
              <input 
                type="text" 
                placeholder="123456789"
                className="w-full px-4 py-2 bg-slate-800 rounded-lg"
              />
              <p className="text-xs text-slate-400 mt-1">
                Find at: Settings → About on your Facebook Page
              </p>
            </div>
            
            <div>
              <label>Page Access Token</label>
              <input 
                type="password" 
                placeholder="EAAxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 bg-slate-800 rounded-lg"
              />
              <p className="text-xs text-slate-400 mt-1">
                Generate at: developers.facebook.com
              </p>
            </div>
            
            <a 
              href="https://developers.facebook.com/docs/pages/access-tokens" 
              target="_blank"
              className="text-blue-400 text-sm"
            >
              📖 How to get Facebook API credentials →
            </a>
          </div>
        </section>
        
        {/* Instagram API */}
        <section className="bg-slate-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">📷 Instagram Graph API</h2>
          
          <div className="space-y-4">
            <div>
              <label>Instagram Business Account ID</label>
              <input 
                type="text" 
                placeholder="17841444444444444"
                className="w-full px-4 py-2 bg-slate-800 rounded-lg"
              />
            </div>
            
            <div>
              <label>Access Token</label>
              <input 
                type="password" 
                placeholder="IGQVJxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 bg-slate-800 rounded-lg"
              />
            </div>
            
            <p className="text-sm text-slate-400">
              ⚠️ Requires Instagram to be a Business Account linked to a Facebook Page
            </p>
          </div>
        </section>
        
        <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold">
          Save API Credentials
        </button>
      </div>
    </div>
  );
}
```

---

## What Each Role Does

### Super Admin (Platform Owner)
**Configures once:**
- ✅ Facebook API credentials (platform-wide)
- ✅ Instagram API credentials (platform-wide)
- ✅ These apply to ALL tenants

**Example:**
- Your platform's official Facebook page: facebook.com/OfferWheelPlatform
- Your platform's official Instagram: instagram.com/offerwheel

### Tenant Admin (Campaign Creator)
**For each task, configures:**
- ❌ NOT the API credentials (already done by Super Admin)
- ✅ Target URL (which post/page users should interact with)
- ✅ Spins reward
- ✅ Task title

**Example:**
Admin creates task:
- Title: "Follow our Instagram"
- Target URL: https://instagram.com/their_brand (can be different from platform's Instagram)
- Reward: 3 spins

---

## Important Clarification

### Follower Count Tracking
**Whose followers are counted?**

**Option 1: Platform-Wide Tracking** (Simpler)
```
Super Admin API = YOUR platform's Instagram
All tasks track YOUR platform's follower growth
Even if tenant creates task "Follow MyBrand", 
verification checks YOUR platform's followers
```

**Option 2: Per-Tenant Tracking** (Complex)
```
Each tenant enters their own Instagram credentials
Each tenant tracks their own follower growth
More accurate but requires each tenant to:
- Have Instagram Business Account
- Connect to Facebook
- Get API tokens (technical burden)
```

---

## Recommended Approach

### Use Platform-Wide API (Option 1)

**Why:**
- ✅ Super Admin sets up once
- ✅ Tenants don't need technical knowledge
- ✅ No per-tenant API setup required
- ✅ Simpler to maintain

**How verification works:**
```
1. Tenant creates task: "Follow @their_brand"
2. Target URL: https://instagram.com/their_brand
3. User clicks → Goes to their_brand's Instagram
4. Verification checks: Did PLATFORM's followers increase?

Problem: This doesn't work correctly!
```

**Solution: Don't verify individual follows**
```
If tenant wants users to follow @their_brand:
- Use honor system for that task
- Only verify aggregate growth (analytics)
- Accept 30% fraud rate

If tenant wants users to follow YOUR platform:
- Use API verification (works correctly)
- Tracks YOUR platform's follower growth
```

---

## Alternative: Tenant Provides Their Own Credentials (If Needed)

### Add to Campaign Model
```prisma
model Campaign {
  id String @id @default(cuid())
  
  // Optional: Tenant's own social media credentials
  tenantFacebookPageId      String?
  tenantFacebookToken       String? @db.Text
  tenantInstagramAccountId  String?
  tenantInstagramToken      String? @db.Text
  
  // If provided, use these for verification
  // If not provided, use platform-wide credentials
}
```

### Tenant Social Media Settings Page
```tsx
function TenantSocialSettings({ campaignId }) {
  return (
    <div>
      <h2>Connect Your Social Media</h2>
      <p className="text-sm text-slate-400 mb-4">
        Optional: Connect your own Instagram/Facebook for accurate tracking
      </p>
      
      <button onClick={connectFacebook}>
        Connect Facebook Page
      </button>
      
      <button onClick={connectInstagram}>
        Connect Instagram Business Account
      </button>
      
      <p className="text-xs text-slate-500 mt-4">
        If not connected, platform-wide verification will be used
      </p>
    </div>
  );
}
```

---

## Simplified Recommendation

**For MVP:** 

1. **Super Admin** enters ONE set of credentials (platform's Facebook/Instagram)
2. **Use for:**
   - Displaying follower counts on spin pages
   - Analytics (aggregate tracking)
3. **Don't use for:**
   - Individual task verification (too complex)
   - Third-party brand verification (doesn't work)
4. **Verification:**
   - Use honor system with 30% fraud acceptance
   - Or statistical sampling
   - Or manual username submission

**Future Enhancement:**
- Let tenants connect their own accounts
- OAuth-based connection flow
- Per-tenant accurate verification

---

## Setup Checklist

### Super Admin One-Time Setup
- [ ] Create Facebook Developer account
- [ ] Create Facebook App
- [ ] Add Instagram Graph API product
- [ ] Get Page Access Token (Facebook)
- [ ] Get Instagram Business Account ID
- [ ] Get Instagram Access Token
- [ ] Enter credentials in platform (ENV or dashboard)
- [ ] Test: Fetch follower count from API
- [ ] Verify tokens don't expire (make long-lived)

### Tenant Per-Campaign
- [ ] Create social media tasks
- [ ] Enter target URLs
- [ ] Set spin rewards
- [ ] (Optional) Connect own social accounts for better tracking

---

## Database Storage

```prisma
// Platform-wide (Super Admin)
model PlatformSettings {
  id String @id @default(cuid())
  
  facebookPageId      String?
  facebookPageToken   String? @db.Text // Encrypted
  instagramAccountId  String?
  instagramToken      String? @db.Text // Encrypted
  
  updatedAt DateTime @updatedAt
  updatedBy String   // Super admin user ID
}

// Per-tenant (Optional)
model Campaign {
  // Optional tenant-specific credentials
  customFacebookPageId   String?
  customInstagramAccount String?
  // If null, use platform-wide credentials
}
```

---

## Summary

**Who enters Meta API credentials?**
→ **Super Admin** (you/platform owner)

**When?**
→ **Once during initial platform setup**

**Where?**
→ **Environment variables or Super Admin dashboard**

**What do Tenants enter?**
→ **Just target URLs** for tasks (which post/page users should visit)

**Verification accuracy:**
→ Best for platform's own social media
→ For tenant brands: Use honor system or manual verification

Make sense now?
