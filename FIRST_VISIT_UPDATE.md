# ⚠️ IMPORTANT: First Visit Flow Change

## User Requested Update
**Capture BOTH name and phone number on first visit (before OTP)**

### Updated User Flow:
1. User arrives → Sees wheel
2. User enters **Name + Phone** together
3. Click "Send OTP" → OTP sent to WhatsApp
4. User enters OTP → Verified
5. User can spin immediately

### Implementation Note:
In `app/page.tsx`, the initial form should collect:
- Name (text input, required)
- Phone (tel input, required)

Then send BOTH to `/api/otp/send` endpoint.

Update the OTP send API to store name immediately when creating the user record.

**Files to modify**:
- `app/page.tsx` - Add name input field before OTP
- `app/api/otp/send/route.ts` - Accept and store name parameter

---

_Continue with Feature 1 below_
