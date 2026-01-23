# Facebook OAuth: Benefits & Requirements

## 1. The Benefits (Why do it?)

Implementing "Facebook Login" unlocks the "Premium" tier of your platform:

1.  **100% Verified Users:** You eliminate bots. Every user is a real person with a real Facebook account.
2.  **Fraud-Proof Data:** You get their real Name, Email, and internal Facebook ID. They cannot fake this.
3.  **Connection Checks:** It allows you to check if they truly follow a page (using the Tenant Token logic we discussed).
4.  **One-Click Signup:** Users don't need to type passwords or verify OTPs to signup. Frictionless onboarding.

## 2. The Requirements (The Hurdles)

To use Facebook Login in production, you must jump through Meta's hoops:

### A. Technical Setup
*   **Facebook Developer Account:** You need a verified account.
*   **App Creation:** Create an App in the Meta Developer Portal.
*   **Privacy Policy URL:** You must have a hosted privacy policy on your website.
*   **Terms of Service URL:** You must have a hosted TOS.
*   **Data Deletion Callback:** A URL endpoint that Facebook can ping to delete user data if they request it.

### B. "App Review" (The Big One)
To get access to user data (like "user_likes" or "email"), you must submit your app for review by a Meta employee.
*   **Screencast:** You must record a video showing *exactly* how you use the data.
*   **Justification:** Write a clear explanation of *why* you need this data.
*   **Review Time:** Takes 5-10 days.
*   **Risk:** If they think you are "incentivizing likes" (Policy 4.5), they will reject you here. This is why framing it as "Connect" or "Membership" is crucial.

### C. Business Verification
For advanced features, you may need to verify your business:
*   Submit legal business documents (LLC, Inc, etc.).
*   Verify your business phone number and address.

## 3. Recommendation for MVP

**Skip it for now.**

Why?
1.  **High Effort:** It takes weeks to get approved.
2.  **Policy Risk:** If you set it up wrong, you get flagged early.
3.  **Authentication is already solved:** You have OTP login. It works fine.

**Strategy:**
Launch with "Visit Page" (No OAuth needed).
Build the "Connect" feature in the background and submit for App Review later when you have traction.
