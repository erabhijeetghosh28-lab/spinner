# Cursor Implementation Answers & Decisions (FINAL)

## 1. lastClickTime tracking mechanism
**Decision:** **Option A (New field `clickedAt`)**
*   **Schema:** Add `clickedAt DateTime?` to `SocialTaskCompletion`.
*   **Flow:**
    1.  User clicks "Visit" in UI.
    2.  Frontend calls `POST /api/social-tasks/click {taskId}`.
    3.  Server creates `SocialTaskCompletion` (status: STARTED) and sets `clickedAt = now()`.
    4.  Frontend starts timer.

## 2. Verification timing for VISIT tasks
**Decision:** **Verify Immediately on Claim**
*   **Logic:**
    1.  User clicks "Claim" (after timer).
    2.  Frontend calls `POST /api/social-tasks/complete {completionId}`.
    3.  Server checks: `Date.now() - completion.clickedAt >= 10000` (10s minimum).
    4.  **Action:** If < 10s difference -> **Reject** (Return error "Too fast").
    5.  If >= 10s difference -> **Approve Immediately** (Status: VERIFIED).
*   **Cron:** Not needed for VISIT tasks.

## 3. Action type mapping
**Decision:**
*   `LIKE_PAGE` → `VISIT_PAGE` (Traffic)
*   `LIKE_POST` → `VIEW_POST` (Traffic)
*   `SHARE` → `VISIT_TO_SHARE` (Traffic)
*   `COMMENT` → `VIEW_DISCUSSION` (Traffic)
*   `FOLLOW` → **`VISIT_PROFILE`** (Traffic / Time-based).
    *   *Reason:* "Follow" is an incentivized action (banned). "Visit Profile" is traffic (allowed).
*   **New Type:** `CONNECT_ACCOUNT` (Premium / OAuth).

## 4. CONNECT task flow
**Decision:**
*   **UI:** No timer. Show "Connect with Facebook" button.
*   **Flow:** Standard OAuth 2.0.
*   **Endpoints:**
    *   `/api/auth/facebook/login?tenantId=...` (Redirects to FB)
    *   `/api/auth/facebook/callback` (Handle code, exchange for token)
*   **Verification:** Verify **OAuth Success**.
    *   *Why?* Checking specific `user_likes` requires sensitive permissions (`user_likes`) which are hard to get approved.
    *   *Value:* Getting the user to auth your app is the "Connection".

## 5. PlatformSettings vs Tenant tokens
**Decision:** **Premium Only (Tenant Tokens)**
*   **Logic:** "Connect" tasks are dangerous to share globally. If one tenant spams, the Platform App gets banned for everyone.
*   **Restriction:** Users can only create `CONNECT_ACCOUNT` tasks if they have added their own Facebook App credentials in settings.

## 6. Rate limit tracking implementation
**Decision:** **Per Tenant**
*   **Track:** `metaApiUsageHour` on `Tenant` model.
*   **Reset:** Check `lastApiUsageReset`. If `now() - reset > 1 hour`, set `usage = 0` and update `reset = now()`.
*   **Limit:** Hard stop at 190.

## 7. Backward compatibility
**Decision:** **Legacy Support via ActionType**
*   Do NOT migrate data.
*   In `verifyCompletion`, strict check:
    *   IF `VISIT_*` → Check time buffer.
    *   IF `CONNECT_*` → Check OAuth status.
    *   IF `LIKE_*` (Old) → Use old "Honor System" (Random).

## 8. Implementation Sequence (Cursor Instructions)
1.  **Schema:** Add `clickedAt`, Tenant Tokens.
2.  **API:** Add `/click` endpoint, Update `/complete` for time-check.
3.  **UI:** Rename all buttons to "Visit", implement Timer + Click tracking hook.
4.  **Admin:** Enable "Connect" task creation only if tokens exist.

## Answer to Your Specific Questions
*   **FOLLOW?** → Rename to `VISIT_PROFILE` (Time-based).
*   **CONNECT Verify?** → Verify **OAuth Success** (Identity found). Don't check specific likes (too hard to get permission).
*   **CONNECT Access?** → **Premium Only**. (Platform token sharing is too risky).
*   **Early Claim?** → **Reject**. Server must enforce the 10s buffer using `clickedAt`.
*   **Legacy Flag?** → No, just infer from `actionType`. `LIKE_PAGE` = Legacy. `VISIT_PAGE` = New.
