# Authentication Requirements: Simple vs Secure

## 1. For "Visit" Verification (The Default)
**Authentication Required:** **None (Social)** / **Internal Only**

*   **End User:** Does NOT need to log in with Facebook/Instagram. They just need to be logged into *your app* (via Phone OTP) so you know who to give the spins to.
*   **The Flow:**
    1.  User logs in to Your App (OTP).
    2.  User clicks "Visit".
    3.  User waits 15s.
    4.  User claims reward.
*   **Why this is great:** Zero friction. Users don't get scared by "Allow App to access your data" popups.

## 2. For "Connect" Verification (The Premium)
**Authentication Required:** **OAuth 2.0 (Facebook Login)**

*   **End User:** MUST log in with Facebook/Instagram to prove who they are.
*   **The Flow:**
    1.  User clicks "Connect Account".
    2.  **Popup:** "Allow [App Name] to view your profile and likes?"
    3.  User clicks "Allow".
    4.  You get an **User Access Token**.
    5.  You verify if this User ID is following the Page ID.
*   **Why this is "Premium":** It's harder. Users drop off at the popup. But it provides 100% verified data.

## 3. For the Tenant (The Admin)
**Authentication Required:** **Facebook Page Connection**

*   If a Tenant wants to use the "Connect" feature, THEY must authenticate their Facebook Page with your platform once.
*   **The Flow:**
    1.  Tenant Dashboard -> Settings.
    2.  Click "Connect Facebook Page".
    3.  **Popup:** "Allow [Platform] to manage your pages?"
    4.  Tenant clicks "Allow".
    5.  You get the **Page Access Token** (this is the "Tenant Token" we discussed).

---

## Summary Table

| Feature | End User Auth | Tenant Auth | Friction |
| :--- | :--- | :--- | :--- |
| **Visit Page** | None (Just App Login) | None (Just enter Value) | **Low** (Best for Growth) |
| **Connect Page** | Facebook Login | Connect Page (OAuth) | **High** (Best for Quality) |

**Recommendation:**
Start with **"Visit Page"**.
It requires **NO extra authentication work**. Your existing OTP login is enough.
