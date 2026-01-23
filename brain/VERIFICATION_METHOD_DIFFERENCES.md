# Verification Methods: The Differences Explained

## 1. Traffic Verification (Safe & Simple)
**"Visit to Earn"**

*   **Mechanism:** User clicks a link. A timer starts (e.g., 15 seconds). After the time is up, the reward is unlocked.
*   **What it Verifies:** That the user clicked the link and (presumably) looked at the page for 15 seconds.
*   **Accuracy:** It confirms *traffic*, not *engagement*. We don't know if they liked, commented, or even read it.
*   **Policy Risk:** **ZERO.** Driving traffic is perfectly legal and encouraged.
*   **Implementation:** Client-side timer + Server-side validation of time intervals.
*   **Best For:** Standard tenants, high-volume campaigns, standard "Like" replacement.

## 2. Connection Verification (Premium & Exact)
**"Connect to Unlock"**

*   **Mechanism:** User authorizes your app (OAuth) OR your system checks the Tenant's API Token to see if `User_ID_123` is a follower of `Page_ID_456`.
*   **What it Verifies:** That a specific user has established a persistent connection (Follow/Subscribe) with the brand.
*   **Accuracy:** **100%.** You know exactly who is connected.
*   **Policy Risk:** **Low (if framed correctly).** You are rewarding the *status of being a follower/member* (the connection), not the granular action of clicking a "Like" button on a specific post.
*   **Implementation:** Requires Tenant Meta Token (Premium Feature).
*   **Best For:** Premium tenants, high-value rewards, fraud prevention.

## Comparison Table

| Feature | Traffic Verification (Visit) | Connection Verification (Connect) |
| :--- | :--- | :--- |
| **User Action** | Click & Wait | Authorize / Connect |
| **Accuracy** | Low (Traffic only) | High (Exact Status) |
| **Fraud Proof?** | No | Yes |
| **Ban Risk** | None | Low (if careful) |
| **Cost to Run** | Free | Free (Tenant Token) |
| **Setup Difficulty** | Easy | Harder (Needs Token) |

## The Policy Nuance (Important)

**Why "Like to Earn" is banned:**
Meta bans "artificial" likes. Paying someone 10 cents to click "Like" creates a fake signal of popularity.

**Why "Connect to Unlock" is safer:**
It is framed as *membership*. "Join our VIP club (by connecting) to get spins." You are verifying membership status.

**Why "Visit to Earn" is safest:**
You are paying for *attention*, not signals. "Look at our page for 15 seconds." This is standard advertising.
