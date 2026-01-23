# Link Display Locations in Customer UI

This document explains where links configured in the admin dashboard are displayed in the customer-facing UI.

## 1. Website URL (Campaign Settings)

**Admin Location:** Campaign Settings → Website URL field

**Customer UI Location:** 
- **File:** `app/page.tsx` (lines 939-951)
- **Section:** Contact Information Card (bottom of the page)
- **Display:** Shows as a clickable "Open" link next to "Website" label
- **Condition:** Only displays if `campaign.websiteUrl` is set

**Visual:**
```
Phone: [support mobile number]
Website: [Open] ← Clickable link
```

## 2. External Link (Offers)

**Admin Location:** Landing Page Builder → Offers → External Link field

**Customer UI Location:**
- **File:** `components/landing/sections/OfferDetailModal.tsx` (lines 98-111)
- **Section:** Offer Detail Modal (when user clicks "View Details" on an offer)
- **Display:** Shows as a prominent button labeled "Learn More →" at the bottom of the modal
- **Condition:** Only displays if `offer.externalLink` is set
- **Styling:** Uses the brand color as background gradient

**Visual:**
```
[Offer Details Modal]
...
[Learn More →] ← Large button with brand color
```

## 3. Logo URL (Campaign Settings)

**Admin Location:** Campaign Settings → Logo URL (Wheel Center)

**Customer UI Location:**
- **File:** `components/SpinWheel.tsx` and wheel template components
- **Section:** Center of the spin wheel
- **Display:** Image displayed in the center of the wheel
- **Condition:** Only displays if `campaign.logoUrl` is set, otherwise shows default

## Summary

- **Website URL:** Contact info section at bottom of customer page
- **External Link:** "Learn More" button in offer detail modal
- **Logo URL:** Center of the spin wheel

All links open in new tabs/windows (`target="_blank"` with appropriate `rel` attributes for security).
