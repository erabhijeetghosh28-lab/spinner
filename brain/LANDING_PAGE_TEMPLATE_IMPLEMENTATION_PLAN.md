# 🎯 PIXEL-PERFECT LANDING PAGE TEMPLATE IMPLEMENTATION PLAN
## With Anti-Hallucination Protocol

---

## ✅ VERIFICATION CHECKLIST (Pre-Implementation)

### 1. Template Files Verification
- [x] **Template 1:** `stitch_marketing_agency_landing_with_spin_wheel_v1/campaign_landing_with_social_proof_and_products_1/code.html` (290 lines)
- [x] **Template 2:** `stitch_marketing_agency_landing_with_spin_wheel_v1/campaign_landing_with_social_proof_and_products_2/code.html` (269 lines)
- [x] **Template 3:** `stitch_marketing_agency_landing_with_spin_wheel_v1/campaign_landing_with_social_proof_and_products_3/code.html` (260 lines - verified partial)
- [x] **Template 4:** `stitch_marketing_agency_landing_with_spin_wheel_v1/campaign_landing_with_social_proof_and_products_4/code.html` (exists)
- [x] **Template 5:** `stitch_marketing_agency_landing_with_spin_wheel_v1/campaign_landing_with_social_proof_and_products_5/code.html` (exists)

### 2. API Endpoints Verification
- [x] `/api/landing-page/[campaignId]` - **EXISTS** (`app/api/landing-page/[campaignId]/route.ts`)
- [x] `/api/user/status` - **EXISTS** (`app/api/user/status/route.ts`) - Returns: `{ totalAvailable, baseSpinsAvailable, bonusSpinsAvailable, referralsProgress, referralsRequired }`
- [x] `/api/admin/social-tasks` - **EXISTS** (`app/api/admin/social-tasks/route.ts`) - Requires `campaignId` and `tenantId` (admin only)
- [x] `/api/social-tasks/click` - **EXISTS** (`app/api/social-tasks/click/route.ts`)
- [x] `/api/social-tasks/complete` - **EXISTS** (`app/api/social-tasks/complete/route.ts`)
- [ ] `/api/social-tasks?campaignId=xxx` - **NEEDS VERIFICATION** (public endpoint for user-facing tasks)

### 3. Current Implementation Status
- [x] `components/landing/LandingPageRenderer.tsx` - **EXISTS** (126 lines) - Main renderer
- [x] `components/landing/sections/HeroSection.tsx` - **EXISTS** (243 lines) - Current implementation
- [x] `components/landing/templates/StitchTemplate.tsx` - **EXISTS** (partial implementation)
- [x] `tailwind.config.ts` - **EXISTS** - Basic config, needs template-specific extensions

---

## 📋 IMPLEMENTATION PLAN

### PHASE 1: Infrastructure Setup

#### Step 1.1: Create Template-Specific Tailwind Configs
**File:** `tailwind.config.ts`

**Action:** Extend Tailwind config with template-specific color schemes

**Verification:**
- Template 1 colors: `primary: "#f48c25"`, `background-light: "#f8f7f5"`, `background-dark: "#221910"`
- Template 2 colors: `primary: "#00f2ff"`, `accent: "#0072ff"`, `navy-dark: "#0a0f1d"`, `navy-muted: "#161e2e"`
- Template 3 colors: `primary: "#D4AF37"`, `gold-brushed: "#C5A028"`, `cream: "#FDFBF7"`
- Template 4 colors: `primary: "#2D5A47"`, `accent: "#CD7F63"`, `mint: "#F0F7F4"`
- Template 5 colors: `primary: "#FF0800"`, `background-light: "#F3F4F6"`, `background-dark: "#111111"`

**Checkpoint:** Run `npm run build` - should compile without errors

---

#### Step 1.2: Create Template Component Structure
**Files to Create:**
```
components/landing/templates/
├── Template1/
│   ├── index.tsx (main template wrapper)
│   ├── Hero.tsx
│   ├── SocialTasks.tsx
│   ├── Offers.tsx
│   ├── Newsletter.tsx
│   └── Footer.tsx
├── Template2/
│   └── (same structure)
├── Template3/
│   └── (same structure)
├── Template4/
│   └── (same structure)
└── Template5/
    └── (same structure)
```

**Verification:** Each template folder exists with all 6 component files

---

### PHASE 2: Template 1 Implementation (Classic Orange)

#### Step 2.1: Convert Hero Section
**Source:** `stitch_marketing_agency_landing_with_spin_wheel_v1/campaign_landing_with_social_proof_and_products_1/code.html` (Lines 54-140)

**Target:** `components/landing/templates/Template1/Hero.tsx`

**Exact Requirements:**
1. **HTML Structure:** Copy lines 54-140 exactly
2. **Tailwind Classes:** Preserve all classes including arbitrary values:
   - `text-[10px]`, `w-[400px]`, `bg-[#1e293b]`, `shadow-[0_8px_30px_rgb(0,0,0,0.08)]`
3. **Custom CSS:** Extract `.spin-wheel-gradient` and `.no-scrollbar` classes
4. **Material Icons:** Use `material-symbols-outlined` with `fill-1` attribute
5. **Dynamic Data Mapping:**
   - Line 61: `"02"` → `userStatus.totalAvailable` (from `/api/user/status`)
   - Line 82: `"Spin to Win: Your Exclusive Brand Giveaway!"` → `section.content.headline`
   - Line 85: Subheadline → `section.content.subheadline`
   - Line 88: Button text → `section.content.buttonText`
   - Line 111: `"Follow @BrandWheel"` → `socialTask.title` (from API)
   - Line 114: `"+1 Spin"` → `socialTask.spinsReward` (from API)
   - Line 121: `"Invite 5 friends"` → `campaign.referralsForBonus` (from API)
   - Line 134: `"3/5 friends invited"` → `userStatus.referralsProgress / campaign.referralsForBonus`

**API Integration:**
```typescript
// Fetch user status
const [userStatus, setUserStatus] = useState(null);
useEffect(() => {
    if (userId && campaignId) {
        axios.get(`/api/user/status?userId=${userId}&campaignId=${campaignId}`)
            .then(res => setUserStatus(res.data));
    }
}, [userId, campaignId]);

// Fetch social tasks (NEED TO VERIFY PUBLIC ENDPOINT)
const [socialTasks, setSocialTasks] = useState([]);
useEffect(() => {
    axios.get(`/api/social-tasks?campaignId=${campaignId}`)
        .then(res => setSocialTasks(res.data.tasks || []));
}, [campaignId]);
```

**Verification Checkpoint:**
- [ ] Component renders without errors
- [ ] All Tailwind classes match exactly (compare with HTML)
- [ ] Dynamic data displays correctly
- [ ] Material icons render correctly
- [ ] Responsive breakpoints work (`md:`, `lg:`)

---

#### Step 2.2: Convert Offers Section
**Source:** Lines 141-260

**Target:** `components/landing/templates/Template1/Offers.tsx`

**Exact Requirements:**
1. **Carousel Structure:** Lines 147-258
2. **Navigation Buttons:** Lines 148-156 (hover opacity transitions)
3. **Carousel Items:** Lines 159-252 (3 items with snap scrolling)
4. **Dynamic Data:**
   - Line 162: Background image → `offer.imageUrl`
   - Line 165: Badge text → `offer.badge` or `offer.category`
   - Line 169: Title → `offer.title`
   - Line 170: Description → `offer.description`
   - Lines 174-186: Features → `offer.features` (array)

**API Integration:**
```typescript
// Offers come from landingPage.offers (already fetched in LandingPageRenderer)
const offers = landingPage.offers || [];
```

**Verification Checkpoint:**
- [ ] Carousel scrolls horizontally
- [ ] Navigation buttons appear on hover
- [ ] Snap scrolling works
- [ ] All 3 offer items render from API data
- [ ] Images load correctly

---

#### Step 2.3: Convert Newsletter Section
**Source:** Lines 261-272

**Target:** `components/landing/templates/Template1/Newsletter.tsx`

**Note:** Newsletter functionality may be deferred - just render the UI

**Verification Checkpoint:**
- [ ] Form renders correctly
- [ ] Styling matches exactly

---

#### Step 2.4: Convert Footer Section
**Source:** Lines 274-287

**Target:** `components/landing/templates/Template1/Footer.tsx`

**Dynamic Data Mapping:**
- Line 277: Logo/Initial → `footer.logoUrl` or campaign logo
- Line 278: Brand name → `footer.companyName` or `campaign.name`
- Lines 281-283: Links → `footer.privacyPolicyUrl`, `footer.termsOfServiceUrl`, `footer.rulesRegulationsUrl`
- Line 285: Copyright → `footer.companyName` + year

**Verification Checkpoint:**
- [ ] All footer links work
- [ ] Dynamic data displays correctly

---

#### Step 2.5: Create Template 1 Wrapper
**Target:** `components/landing/templates/Template1/index.tsx`

**Structure:**
```typescript
export default function Template1({ landingPage, campaign, userId }: Props) {
    return (
        <div className="layout-container flex h-full grow flex-col">
            <main className="flex flex-1 flex-col items-center">
                <Template1Hero ... />
                <Template1Offers ... />
                <Template1Newsletter ... />
            </main>
            <Template1Footer ... />
        </div>
    );
}
```

**Verification Checkpoint:**
- [ ] All sections render in correct order
- [ ] Layout matches HTML structure exactly

---

### PHASE 3: Template 2 Implementation (Electric Cyan)

**Repeat Phase 2 steps for Template 2, using:**
- **Source:** `campaign_landing_with_social_proof_and_products_2/code.html`
- **Key Differences:**
  - Dark mode only (`class="dark"`)
  - Glass panel effects (`.glass-panel` class)
  - Gradient buttons (`bg-gradient-to-r from-primary to-accent`)
  - Different color scheme (cyan/navy)

**Verification:** Same checkpoints as Template 1

---

### PHASE 4: Template 3 Implementation (Luxury Gold)

**Repeat Phase 2 steps for Template 3, using:**
- **Source:** `campaign_landing_with_social_proof_and_products_3/code.html`
- **Key Differences:**
  - Serif fonts (Cinzel for headings)
  - Gold shimmer effects (`.gold-shimmer` class)
  - Different border radius (0.25rem default)
  - More elegant styling

**Verification:** Same checkpoints as Template 1

---

### PHASE 5: Templates 4 & 5 Implementation

**Repeat Phase 2 steps for Templates 4 & 5**

---

### PHASE 6: API Integration & Dynamic Data

#### Step 6.1: Verify/Create Public Social Tasks Endpoint
**Current Status:** `/api/admin/social-tasks` requires admin auth

**Action:** Create or verify public endpoint:
- **Option A:** Create `/api/social-tasks?campaignId=xxx` (public, no auth)
- **Option B:** Modify existing endpoint to allow public access

**Verification:**
```bash
# Test endpoint
curl http://localhost:3000/api/social-tasks?campaignId=xxx
# Should return: { tasks: [...] }
```

---

#### Step 6.2: Integrate User Status API
**File:** Each template's Hero component

**Implementation:**
```typescript
const [userStatus, setUserStatus] = useState<{
    totalAvailable: number;
    referralsProgress: number;
    referralsRequired: number;
} | null>(null);

useEffect(() => {
    if (userId && campaignId) {
        axios.get(`/api/user/status?userId=${userId}&campaignId=${campaignId}`)
            .then(res => setUserStatus(res.data))
            .catch(err => console.error('Failed to fetch user status:', err));
    }
}, [userId, campaignId]);
```

**Verification:**
- [ ] Spins count displays correctly
- [ ] Referral progress updates in real-time

---

#### Step 6.3: Integrate Social Tasks API
**File:** Each template's Hero component (Social Tasks section)

**Implementation:**
```typescript
const [socialTasks, setSocialTasks] = useState([]);

useEffect(() => {
    axios.get(`/api/social-tasks?campaignId=${campaignId}`)
        .then(res => setSocialTasks(res.data.tasks || []))
        .catch(err => console.error('Failed to fetch social tasks:', err));
}, [campaignId]);
```

**Verification:**
- [ ] Social tasks display from API
- [ ] Spin rewards show correctly
- [ ] Task buttons are clickable

---

#### Step 6.4: Connect Task Completion Flow
**Files:** Social Tasks components

**Implementation:**
```typescript
const handleTaskClick = async (taskId: string) => {
    // 1. Call /api/social-tasks/click
    const clickRes = await axios.post('/api/social-tasks/click', {
        taskId,
        userId,
        campaignId,
    });
    
    // 2. Open target URL
    window.open(task.targetUrl, '_blank');
    
    // 3. Start timer (15 seconds)
    // 4. After timer, call /api/social-tasks/complete
    const completeRes = await axios.post('/api/social-tasks/complete', {
        completionId: clickRes.data.completionId,
    });
};
```

**Verification:**
- [ ] Click endpoint called correctly
- [ ] Timer works (15 seconds)
- [ ] Complete endpoint called after timer
- [ ] Spins awarded and UI updates

---

### PHASE 7: Template Selection & Routing

#### Step 7.1: Update LandingPageRenderer
**File:** `components/landing/LandingPageRenderer.tsx`

**Current Code:** Lines 79-89 (switch statement for section types)

**Action:** Add template-based routing:
```typescript
const template = landingPage.template || 'template_1';

// Import all templates
import Template1 from './templates/Template1';
import Template2 from './templates/Template2';
// ... etc

// Render based on template
switch (template) {
    case 'template_1':
        return <Template1 landingPage={landingPage} campaign={campaign} userId={userId} />;
    case 'template_2':
        return <Template2 landingPage={landingPage} campaign={campaign} userId={userId} />;
    // ... etc
}
```

**Verification:**
- [ ] Template selection works
- [ ] Correct template renders based on `landingPage.template`

---

### PHASE 8: Testing & Quality Assurance

#### Step 8.1: Visual Comparison
**Tool:** Browser DevTools or screenshot comparison tool

**Process:**
1. Open original HTML in browser
2. Open React component in browser
3. Compare side-by-side
4. Check:
   - [ ] Colors match exactly (use color picker)
   - [ ] Font sizes match (use computed styles)
   - [ ] Spacing matches (use element inspector)
   - [ ] Layout matches (grid/flexbox)
   - [ ] Animations match

**Checkpoint:** 100% visual match

---

#### Step 8.2: Responsive Testing
**Breakpoints to Test:**
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

**Verification:**
- [ ] All breakpoints render correctly
- [ ] No layout breaks
- [ ] Text remains readable
- [ ] Images scale correctly

---

#### Step 8.3: API Integration Testing
**Test Cases:**
1. **User Status:**
   - [ ] Spins count displays
   - [ ] Updates after spin
   - [ ] Referral progress updates

2. **Social Tasks:**
   - [ ] Tasks load from API
   - [ ] Task completion flow works
   - [ ] Spins awarded correctly

3. **Offers:**
   - [ ] Offers load from API
   - [ ] Carousel navigation works
   - [ ] Images load correctly

---

#### Step 8.4: Performance Testing
**Metrics:**
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shift (CLS = 0)
- [ ] Bundle size < 500KB (per template)

---

## 🛡️ ANTI-HALLUCINATION PROTOCOL

### Verification Rules:
1. **File Existence:** Always verify file exists before referencing
2. **Line Numbers:** Reference exact line numbers from source files
3. **API Endpoints:** Test endpoints before using in code
4. **Data Structures:** Match API response structure exactly
5. **Class Names:** Copy Tailwind classes exactly, no approximations
6. **Color Values:** Use exact hex codes from templates
7. **Font Families:** Verify font imports match templates

### Checkpoint System:
- **Before Each Phase:** Verify prerequisites
- **During Implementation:** Test each component individually
- **After Each Phase:** Full visual comparison
- **Before Final:** Complete API integration test

### Error Prevention:
1. **No Assumptions:** Always verify, never assume
2. **Exact Copying:** Copy HTML structure exactly
3. **API Testing:** Test all API calls before integration
4. **Type Safety:** Use TypeScript types for all props
5. **Error Handling:** Add try-catch for all API calls

---

## ✅ SUCCESS CRITERIA

### Visual:
- [ ] 100% pixel-perfect match with original HTML
- [ ] All colors match exactly (verified with color picker)
- [ ] All fonts match exactly (verified with computed styles)
- [ ] All spacing matches exactly (verified with element inspector)

### Functional:
- [ ] All APIs connected and working
- [ ] Dynamic data displays correctly
- [ ] Interactive elements work (buttons, carousels, forms)
- [ ] Responsive design works at all breakpoints

### Technical:
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Performance metrics met

---

## 📝 IMPLEMENTATION ORDER

1. **Phase 1:** Infrastructure (Tailwind configs, folder structure)
2. **Phase 2:** Template 1 (complete implementation)
3. **Phase 3:** Template 2 (complete implementation)
4. **Phase 4:** Template 3 (complete implementation)
5. **Phase 5:** Templates 4 & 5 (complete implementation)
6. **Phase 6:** API Integration (all templates)
7. **Phase 7:** Template Selection (routing)
8. **Phase 8:** Testing & QA

---

## 🚀 NEXT STEPS

1. **Verify Public Social Tasks Endpoint:** Check if `/api/social-tasks?campaignId=xxx` exists or needs creation
2. **Start with Template 1:** Complete Phase 2 before moving to other templates
3. **Test Each Component:** Test individually before integration
4. **Visual Comparison:** Compare after each phase
