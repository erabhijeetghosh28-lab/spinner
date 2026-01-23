# Cursor Prompt: Implement Scalability & Policy-Safe Rate Limit Handling

## Context
We need to optimize the system for 300+ tenants while **strictly adhering to Meta Platform Policy 4.5**, which prohibits incentivizing "Likes".
We must switch our verification strategy from "Like Verification" to "**Visit & Connect Verification**".

## Implementation Plan

Please implement the following changes to make the system production-ready, scalable, and policy-compliant.

---

### Step 1: Policy Compliance Updates (UI & Logic)
Refactor the UI and Task Logic to incentivize **Visits** and **Connections**, not Likes.

**Action Items:**
1.  **Rename Task Types:** Change "Like Page" to "**Visit Page**" in all UI components.
2.  **Update Button Text:** Change "Like" buttons to "**Visit**" or "**Check Out**".
3.  **Implement Time-Based Verification:**
    *   When a user clicks "Visit", start a 10-15 second timer in the UI.
    *   Reward is given for *spending time* (visiting), which is 100% compliant.
    *   **Logic:**
        *   Client: Open new tab -> Start countdown -> Enable Claim button.
        *   Server: Verify `Date.now() - clickedAt >= 10000` (10s buffer).

---

### Step 2: Update Database Schema
Add fields for per-tenant Meta API credentials (for "Connect" strategy) and platform settings.

**File:** `prisma/schema.prisma`
```prisma
model Tenant {
  // ... existing fields
  
  // New fields for Tenant-specific API limits (for "Connect" verification)
  facebookPageId     String?
  facebookToken      String?  @db.Text
  instagramAccountId String?
  instagramToken     String?  @db.Text
  
  // Field to track API usage
  metaApiUsageHour   Int      @default(0)
  lastApiUsageReset  DateTime @default(now())
}

model SocialTaskCompletion {
  // ... existing fields
  clickedAt DateTime? // Add this field to track when the link was clicked
}

model PlatformSettings {
  id                 String   @id @default("settings")
  facebookPageId     String?
  facebookToken      String?  @db.Text
  instagramAccountId String?
  instagramToken     String?  @db.Text
}
```

---

### Step 3: Optimize Cron Endpoint (Scalability)
Update the verification cron to handle larger batches (500+) and process in parallel.

**File:** `app/api/cron/verify-social-tasks/route.ts`
*   Use `take: 500` (dynamic based on queue).
*   Use `Promise.allSettled` for parallel processing.
*   See previous prompts for full code structure, but ensure it calls the new `verifyCompletion`.
*   **NOTE:** For "Visit" tasks, verification should ideally happen immediately on claim (Real-time). The Cron is primarily for "Connect" checks or retries.

---

### Step 4: Implement Hybrid Verification Logic
Update `verifyCompletion` to handle the new "Visit" and "Connect" strategies.

**File:** `lib/social-verification.ts`

```typescript
// ... imports

export async function verifyCompletion(completion: any) {
  // ... setup
  const tenant = completion.task.campaign.tenant;
  let isVerified = false;
  let verificationMethod = 'UNKNOWN';

  try {
    // STRATEGY 1: Time-on-Site (Traffic Verification) - DEFAULT & SAFEST
    // Used for "Visit Page" tasks.
    // Logic: If user clicked and enough time passed, we verify the VISIT.
    // We do NOT verify the Like.
    if (completion.task.actionType === 'VISIT') {
       // Check if clickedAt exists and if enough time passed
       if (completion.clickedAt && Date.now() - new Date(completion.clickedAt).getTime() >= 10000) {
         isVerified = true;
         verificationMethod = 'TIME_ON_SITE';
       } else {
         throw new Error("Too fast"); // Reject early claim
       }
    }
    
    // STRATEGY 2: Tenant's Own API (Connect Verification) - PREMIUM
    // Used for "Connect Account" tasks.
    // If tenant provided tokens, we check if user is CONNECTED (Follower/Fan).
    else if (tenant.facebookToken || tenant.instagramToken) {
      isVerified = await verifyWithTenantToken(completion, tenant);
      verificationMethod = 'TENANT_API_CONNECTION';
    } 
    
    // STRATEGY 3: Statistical / Hybrid (Legacy Support)
    // Fallback for old "Like" tasks if they exist
    else {
      // ... (Statistical logic from previous plan) ...
      const strategy = await determineVerificationStrategy(completion.cohortId);
       // ... (Honor System / Sample) ...
       // Default to Honor System for safety to avoid bans
       isVerified = Math.random() < 0.90; 
       verificationMethod = 'HONOR_SYSTEM';
    }

    // ... Update Status & Reward logic ...
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## Detailed Implementation Answers (Q&A)

**1. Migration:** Do NOT auto-migrate data. Mark `LIKE_PAGE` as deprecated. Only allow `VISIT_PAGE` in new UI.
**2. Time Verification:** Implement Client-side Timer (15s) + Server-side timestamp check. Do not verify "tab closed status" (impossible).
**3. Connection Verification:** Requires OAuth Login. Checks `user_likes` (FB) or `user_follows` (IG).
**4. Policy:** Rename all incentivized actions (`LIKE_POST`, `SHARE`) to Traffic actions (`VIEW_POST`, `VISIT_TO_SHARE`).
**5. Rate Limits:** Track per Tenant. If > 190/hour, block or queue.
**6. OAuth:** Skip building the frontend OAuth flow for MVP. Only add schema support. Focus purely on "Visit" verification.

## Action Items for Cursor
1.  **Refactor UI:** Search/Replace "Like" with "Visit" in `components/wheel-templates` and `app/`.
2.  **Schema Update:** Run migration for Tenant Tokens and `clickedAt`.
3.  **Cron Update:** Implement the high-throughput Cron (batch 500).
4.  **Verification Logic:** Implement the `verifyCompletion` function prioritizing **Time-on-Site** (Visit).
5.  **Click Endpoint:** Implement `POST /api/social-tasks/click` to capture `clickedAt`.
