# How "Time-on-Site" Verification Actually Works

## The "Click & Wait" Mechanism

You are asking a great technical question. Since we cannot install spyware on the user's browser, we cannot literally "see" them viewing the Facebook page.

Instead, we use the **Industry Standard Workflow** for Paid-to-Click (PTC) systems.

### The Logic Flow

1.  **The Trigger:**
    *   User sees task: "Visit our Facebook Page for 15 seconds".
    *   User clicks **"VISIT"**.

2.  **The Action:**
    *   Your App: Opens `facebook.com/userpage` in a **New Tab**.
    *   Your App: Starts a **Countdown Timer** on the "Visit" button (e.g., "Verifying... 15s").

3.  **The Assumption (The "Honor System" of Traffic):**
    *   We assume that if the user clicked the link, they are currently looking at that new tab.
    *   We force them to wait 15 seconds before they can claim the reward.

4.  **The Claim:**
    *   After 15 seconds, the button in *Your App* changes to **"CLAIM REWARD"**.
    *   User closes Facebook, comes back to your tab, and clicks "Claim".

### Why This is "Real" Verification
*   **It proves Intent:** They clicked the link.
*   **It proves Opportunity:** We gave them 15 seconds to look at the content.
*   **It removes Bots:** A bot that just pings the API instantly will fail because the server checks: `ClaimTime - ClickTime >= 15 seconds`.

### Can they cheat?
*   *Can they open the tab and look at the ceiling?* Yes.
*   *Can they open the tab and close it instantly?* Yes, but they still have to wait 15 seconds to get the reward. Most users will just look at the page since they are waiting anyway.

**This is how 99% of "Visit to Earn" sites work.** It balances **User Experience** with **Ad Value** without violating privacy or browser security.
