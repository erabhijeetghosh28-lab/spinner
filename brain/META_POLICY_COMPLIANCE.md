# Meta Policy 4.5 Compliance: How to Stay Safe

## ⚠️ The Danger Zone
You are absolutely correct. **Meta Platform Policy 4.5 prohibits incentivizing people to like a Page or post.**

**What is BANNED:**
> "Like this page to get 5 spins!"
> "Click here to Like and win!"
> Gating content strictly behind a "Like" action (Like-gating).
> Verifying a "Like" specifically to give a reward.

**Consequence:** App ban. API Revocation.

---

## ✅ The Compliant Strategy: "Visit & Engage"

You must reframe the action. You are not rewarding the *Like*. You are rewarding the *Visit* or the *Interaction*.

### 1. Reframing the Task
Instead of: **"Like our Page for Spins"** ❌
Use: **"Visit us on Facebook for Spins"** ✅

**Why this works:**
- You are driving traffic, which is allowed.
- Once they are there, if they choose to like, that's their choice.
- You verify they *visited* or *engaged* with your brand, not specifically that they pressed the "Like" button.

### 2. The Loophole in the API
The API lets you check if a user is a follower. It DOES NOT tell you *why* they followed.
- If you check user follows, you are technically checking "Connection".
- Meta allows checking for connection context to personalize experience.
- **Gray Area:** Using this check to trigger a reward is risky if explicitly stated.

### 3. The Safest Approach: "Action Verification" vs "Traffic Verification"

**Option A: Risk-Free (Traffic Only)**
- Task: "Check out our latest post"
- Action: User clicks link. Timer runs (10s).
- Reward: Given for spending time (visiting).
- **Compliance:** 100% Safe. Meta loves traffic.

**Option B: Low Risk (Follower Check)**
- Task: "Join our Community"
- Action: User connects account.
- Reward: Given for "Connecting" (not specifically liking).
- **Compliance:** Safer. You are incentivizing *connection/membership*, not a specific button click on a specific piece of content.

---

## 💡 How to Modify Your Implementation

I will update the Cursor prompt to enforce **Policy Safe Language**:

1.  **UI Changes:**
    *   Change button text from "Like Page" to **"Visit Page"**.
    *   Change task title from "Like for Spins" to **"Find us on Facebook"**.

2.  **Verification Logic:**
    *   **Tier 1 (Safe):** Verify they clicked the link and stayed for 10 seconds (Time-on-Site verification). This is what most "Earn" apps do.
    *   **Tier 2 (Connection):** Verify they have *connected* their account to your app. The reward is for the *connect action* (Oauth), not the Like.

## Recommendation for 300+ Tenants
To keep your platform entirely safe from a blanket ban:

1.  **Enforce "Visit" Language:** Hardcode task templates to use "Visit", "View", "Check out".
2.  **Use Time-Based Verification by default:** Reward users for clicking and waiting 15 seconds. This is unbannable.
3.  **Offer "Connection" as a Premium Feature:** "Connect your Facebook to unlock exclusive status." The reward is for the OAuth connection, which is allowed.

**Do not programmatically verify "Likes" for rewards. It is a trap.**
