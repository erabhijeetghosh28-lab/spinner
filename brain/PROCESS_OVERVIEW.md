# 🔄 Process Overview: End-to-End Flow

This document outlines the complete lifecycle of a user interaction with the Offer Wheel platform.

## 1. Discovery & Entry
1.  **QR Code / Link**: The end-user scans a QR code or clicks a link tailored to a specific tenant (e.g., `app.com?tenant=pizza-shop`).
2.  **Landing Page**: They see the campaign name and description. The Wheel is hidden.
3.  **Strict Gating**: To participate, the user **MUST** enter their phone number.

## 2. Authentication (OTP)
1.  **Request OTP**: User enters phone number -> System sends 6-digit OTP via WhatsApp.
2.  **Verify**: User enters OTP (+ optionally Name) -> System verifies.
3.  **Session Created**: User is now logged in. The Wheel is revealed.

## 3. Engagement (The Wheel)
1.  **Wheel View**: User sees the Spin Wheel and their personalized referral link.
2.  **Spinning**: User clicks "SPIN".
    *   *Check*: Is spin limit reached?
    *   *Check*: Are referrals required? (If yes, block spin until invite count met).
3.  **Result**: The wheel stops on a segment.
    *   **Winning**: "You won 50% Off!"
    *   **Losing**: "Better luck next time."

## 4. Fulfillment (WhatsApp)
1.  **Immediate Notification**: The moment a prize is won, the system sends an automated WhatsApp message to the user.
2.  **Content**: "Congratulations! You won [Prize Name]. Logic: [Coupon Code]."
3.  **Redemption**: User shows this WhatsApp message to the cashier to claim the offer.

## 5. Analytics & Re-Engagement
1.  **Data Capture**: The Tenant Admin dashboard records the spin, the winner, and their phone number.
2.  **Referral Loop**: The user shares their link -> New friends join at Step 1 -> The cycle continues.
