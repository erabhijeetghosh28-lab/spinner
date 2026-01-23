# Why We Discussed OAuth (But Are Not Building It Yet)

## You Are Right. We Are NOT Building Platform-Wide OAuth Now.

The confusion comes from the definition of "Connect" tasks.

### 1. The Distinction
*   **Platform OAuth (What we are skipping):**
    *   You (the Platform) registering an App with Facebook.
    *   You submitting for App Review.
    *   You verifying your Business.
    *   **Status: SKIPPED (Too hard for MVP).**

*   **Tenant Token OAuth (What we are preparing for):**
    *   A Premium Tenant (e.g., Nike) has their *own* Facebook App.
    *   They want to use *their* App to verify users on your platform.
    *   **Status: ARCHITECTED BUT OPTIONAL.**

### 2. The Implementation Plan (Simplified)
To be crystal clear: **We are focusing 100% on the "Traffic" (Visit) strategy.**

I included the "Connect" logic in the Cursor prompt *only* so the database schema would be ready for it later. **We do not need to build the OAuth flow today.**

### 3. Updated Cursor Instructions
I will instruct Cursor to:
1.  **Build the Schema:** Add the fields (so we don't need a migration later).
2.  **Hide the Feature:** Do not build the UI for "Connect".
3.  **Focus on Visit:** Make the "Visit Page" (Timer) feature perfect.

**This keeps your codebase clean and your MVP fast.**
