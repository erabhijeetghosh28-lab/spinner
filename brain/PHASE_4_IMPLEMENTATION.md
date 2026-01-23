# Phase 4: UX Enhancements & Viral Referral System

## 📋 Implementation Overview

This document contains ALL the instructions for implementing UX improvements and viral referral features while keeping **THE SPINNER WHEEL as the hero experience**.

---

## 🎯 High-Level Goals

1. **UX Enhancements**: Make the spinning experience more engaging and professional
2. **Viral Referral System**: Make customers bring more customers organically
3. **Data Collection**: Gather more user data progressively (without friction)

**CRITICAL**: The spinner wheel must ALWAYS be the focal point (60%+ of screen space)

---

## PART 1: UX Enhancements

### Feature 1: Loading Spinner (Initial Page Load)

**Goal**: Show loading state while campaign data fetches

**Files to Modify**: `app/page.tsx`

**Implementation**:
```tsx
// Add state
const [initialLoading, setInitialLoading] = useState(true);

// In fetchCampaign function
const fetchCampaign = async () => {
  try {
    setInitialLoading(true);
    // ... existing fetch logic
  } finally {
    setInitialLoading(false);
  }
};

// Render logic
if (initialLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Loading your prizes...</p>
      </div>
    </div>
  );
}

// ... rest of component
```

---

### Feature 2: Sound Effects & Haptic Feedback

**Goal**: Make spins feel more real and exciting

**Files to Create**: `public/sounds/` (add sound files)
**Files to Modify**: `app/page.tsx`

**Add to public folder**:
- `public/sounds/spin.mp3` - Wheel spinning sound
- `public/sounds/tick.mp3` - Quick tick sound
- `public/sounds/win.mp3` - Victory sound

**Implementation**:
```tsx
// At top of component
const spinSound = typeof Audio !== 'undefined' ? new Audio('/sounds/spin.mp3') : null;
const tickSound = typeof Audio !== 'undefined' ? new Audio('/sounds/tick.mp3') : null;
const winSound = typeof Audio !== 'undefined' ? new Audio('/sounds/win.mp3') : null;

// In handleSpin function
const handleSpin = () => {
  spinSound?.play();
  // ... existing spin logic
};

// On wheel deceleration (play tick on each segment pass)
// This will need to be added to your wheel animation logic

// On win
const showPrizeResult = (prize) => {
  winSound?.play();
  
  // Haptic feedback (mobile)
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200]);
  }
  
  // ... existing prize reveal logic
};
```

**Free Sound Resources**: freesound.org, mixkit.co

---

### Feature 3: Campaign Metadata (Support Contact)

**Goal**: Add support mobile number and website to campaigns

**Files to Modify**:
- `prisma/schema.prisma`
- `app/api/admin/campaigns/route.ts`
- `app/admin/dashboard/page.tsx`
- `app/page.tsx`

**Database Schema**:
```prisma
model Campaign {
  // ... existing fields
  supportMobile     String?  // Contact number for support
  websiteUrl        String?  // Campaign website
}
```

**After schema change, run**:
```bash
npx prisma generate
npx prisma db push
```

**API Update** (`app/api/admin/campaigns/route.ts`):
```tsx
// In POST handler
const { tenantId, name, supportMobile, websiteUrl, ... } = await req.json();

await tx.campaign.create({
  data: {
    // ... existing fields
    supportMobile: supportMobile || null,
    websiteUrl: websiteUrl || null,
  }
});

// In PUT handler - same pattern
```

**Admin Dashboard** (`app/admin/dashboard/page.tsx`):
```tsx
// In CampaignSettingsForm component, add:
<div>
  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
    Support Mobile Number *
  </label>
  <input
    type="tel"
    value={campaign.supportMobile || ''}
    onChange={(e) => setCampaign({ ...campaign, supportMobile: e.target.value })}
    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
    placeholder="919899011616"
    required
  />
  <p className="text-xs text-slate-500 mt-1">Shown to users for support</p>
</div>

<div>
  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
    Website URL
  </label>
  <input
    type="url"
    value={campaign.websiteUrl || ''}
    onChange={(e) => setCampaign({ ...campaign, websiteUrl: e.target.value })}
    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
    placeholder="https://mystore.com"
  />
</div>
```

**Customer Page** (`app/page.tsx`):
```tsx
// Add support banner at bottom
{campaign?.supportMobile && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
    <a 
      href={`https://wa.me/${campaign.supportMobile}`}
      target="_blank"
      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 transition-all"
    >
      <span>💬</span>
      <span>Contact Support</span>
    </a>
  </div>
)}
```

---

### Feature 4: Prize Images

**Goal**: Allow prize images on wheel segments

**Files to Modify**:
- `prisma/schema.prisma`
- `app/api/admin/prizes/route.ts`
- `app/admin/dashboard/page.tsx`

**Database Schema**:
```prisma
model Prize {
  // ... existing fields
  imageUrl        String?  // Prize image URL
}
```

**Run after schema change**:
```bash
npx prisma generate
npx prisma db push
```

**Admin Dashboard** - Add to PrizeTable:
```tsx
<div>
  <label className="text-xs text-slate-500 uppercase">Image URL (Optional)</label>
  <input
    type="url"
    value={prize.imageUrl || ''}
    onChange={(e) => onUpdate(idx, 'imageUrl', e.target.value)}
    placeholder="https://example.com/image.png"
    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm"
  />
</div>
```

**Customer Page** - Display on wheel (if using SVG):
```tsx
{prize.imageUrl && (
  <image 
    href={prize.imageUrl} 
    x="-30" 
    y="-80" 
    width="60" 
    height="60" 
  />
)}
```

---

### Feature 5: WhatsApp Multi-Select Share

**Goal**: After win, allow sharing to multiple WhatsApp contacts

**Files to Modify**: `app/page.tsx`

**Implementation**:
```tsx
// Add to prize reveal modal
const shareOnWhatsApp = () => {
  const message = encodeURIComponent(
    `🎉 I just won ${prizeName} on ${campaign.name}!\n\n` +
    `Try your luck! Use my referral code: ${user.referralCode}\n` +
    `${window.location.origin}/?ref=${user.referralCode}`
  );
  
  // Opens WhatsApp with multi-select interface
  window.open(`https://wa.me/?text=${message}`, '_blank');
};

// In prize modal, add button
<button
  onClick={shareOnWhatsApp}
  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold mt-4"
>
  📱 Share on WhatsApp
</button>
```

---

## PART 2: Viral Referral System

### Feature 6: Post-Win Share Bonus

**Goal**: Give +1 spin for sharing win

**Files to Modify**:
- `prisma/schema.prisma`
- `app/api/user/share-action/route.ts` (NEW)
- `app/page.tsx`

**Database Schema**:
```prisma
model EndUser {
  // ... existing fields
  sharedWins      Int      @default(0)
  bonusSpinsEarned Int     @default(0)
}
```

**API Route** - Create `app/api/user/share-action/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    await prisma.endUser.update({
      where: { id: userId },
      data: { 
        sharedWins: { increment: 1 },
        bonusSpinsEarned: { increment: 1 }
      }
    });
    
    return NextResponse.json({ success: true, bonusSpin: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Frontend** - Update share function:
```tsx
const shareOnWhatsApp = async () => {
  const message = encodeURIComponent(
    `🎉 I just won ${prizeName}!\n` +
    `${window.location.origin}/?ref=${user.referralCode}`
  );
  
  window.open(`https://wa.me/?text=${message}`, '_blank');
  
  // Award bonus spin
  await axios.post('/api/user/share-action', { userId: user.id });
  alert('Thanks for sharing! You earned +1 bonus spin! 🎁');
};
```

---

### Feature 7: Referral Leaderboard

**Goal**: Show top referrers to create competition

**Files to Create**: `app/api/leaderboard/route.ts` (NEW)
**Files to Modify**: `app/page.tsx`

**API Route**:
```ts
// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  
  const leaders = await prisma.endUser.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      successfulReferrals: true
    },
    orderBy: { successfulReferrals: 'desc' },
    take: 10
  });
  
  return NextResponse.json({ leaders });
}
```

**Frontend Component**:
```tsx
function Leaderboard({ tenantId, currentUserId }) {
  const [leaders, setLeaders] = useState([]);
  
  useEffect(() => {
    axios.get(`/api/leaderboard?tenantId=${tenantId}`)
      .then(res => setLeaders(res.data.leaders));
  }, []);
  
  return (
    <div className="bg-slate-900 rounded-xl p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4">🏆 Top Referrers</h2>
      {leaders.map((user, idx) => (
        <div key={user.id} className="flex justify-between py-2">
          <span>{idx + 1}. {user.name}</span>
          <span className="text-amber-500">{user.successfulReferrals} referrals</span>
        </div>
      ))}
    </div>
  );
}
```

---

## ⚠️ CRITICAL IMPLEMENTATION RULES

1. **Never interrupt the spin** - No popups during wheel animation
2. **Wheel stays visible** - Always 60%+ of screen
3. **Test before reporting** - Run `npm run build` to verify
4. **Database changes** - Always run `npx prisma generate && npx prisma db push`
5. **Follow existing patterns** - Match current code style exactly

---

## 📊 Implementation Priority

### Week 1: Core UX
- [ ] Loading spinner
- [ ] Sound effects
- [ ] Campaign support contact
- [ ] Prize images (URL paste only)

### Week 2: Sharing
- [ ] WhatsApp share button
- [ ] Share bonus (+1 spin)
- [ ] Referral tracking

### Week 3: Viral Features
- [ ] Leaderboard
- [ ] Social proof ticker
- [ ] Share graphics (optional)

---

## ✅ Testing Checklist

Before marking complete:
- [ ] `npm run build` succeeds
- [ ] Loading spinner appears on initial load
- [ ] Sound plays on spin (test on mobile too)
- [ ] Support banner shows at bottom
- [ ] WhatsApp share opens correctly
- [ ] Bonus spin awarded after share
- [ ] Leaderboard displays top 10

---

## 🚀 After Implementation

Report back with:
- ✅ Features completed
- ✅ Files modified
- ✅ Build status
- ✅ Any issues encountered

**The spinner must always be the hero!** 🎡
