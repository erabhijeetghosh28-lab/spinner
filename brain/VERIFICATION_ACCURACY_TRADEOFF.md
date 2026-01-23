# Verification Accuracy: The Truth About Fraud Detection

## The Critical Question
**"If 500 people click, and the counter goes up by 400, how do we know who is lying?"**

You are 100% correct. **You cannot know with the Counter Method.**

---

## 1. The Counter Method (Platform Token)
*Used for Standard Tenants / High Traffic*

**How it works:**
1. Check follower count: 10,000
2. User clicks "Verify"
3. Wait 30 seconds
4. Check follower count: 10,005

**The Flaw:**
If 10 people clicked "Verify" in those 30 seconds, but only 5 people actually followed, **we don't know which 5 are lying.**

**Accuracy:**
- Low traffic (1 user at a time): **High**
- High traffic (100 users at a time): **Low / Impossible**

**Role:** This method is an *approximation* to catch lazy fraud, but it cannot catch sophisticated fraud in high traffic.

---

## 2. The Exact Match Method (Tenant Token)
*Used for Premium Tenants*

**How it works:**
1. User clicks "Verify"
2. System calls Meta API: `GET /me/followers` (using Tenant's Token)
3. API returns list of *specific user IDs*
4. System checks: **"Is User ID 123 in this list?"**

**The Result:**
- **YES:** The user definitely followed.
- **NO:** The user definitely did not.

**Accuracy:** **100%** (regardless of traffic)

---

## 3. The Trade-Off Matrix

| Feature | Counter Method (Platform Token) | Exact Match (Tenant Token) |
| :--- | :--- | :--- |
| **Accuracy** | Low (Approximate) | **100% (Exact)** |
| **Fraud Detection** | Weak (Easily tricked in crowds) | **Perfect (ID check)** |
| **Setup** | Easy (One token for everyone) | Hard (Every tenant needs token) |
| **API Limits** | 200/hour (Shared) | 200/hour (Per Tenant) |

---

## 4. How to Handle Fraud (Realistically)

Since you cannot force every tenant to give you a token, you must accept a **risk hierarchy**:

### Tier 1: Premium Verification (Fraud Proof)
**Requirement:** Tenant connects their own Facebook/Instagram account.
**Method:** We use their token to check Specific User IDs.
**Result:** 0% Fraud. We know exactly who is lying.

### Tier 2: Statistical Verification (Risk Accepted)
**Requirement:** Tenant uses platform default.
**Method:** We assume 85-90% of users are honest. We check the counter just to ensure the campaign is actually growing.
**Result:** Some fraud is possible (5-10%).
**Why this is okay:** 
- The cost of fraud (giving away a spin) is usually lower than the cost of complex verification setup.
- You can ban users who have high "claim" rates but generating zero referrals/conversions elsewhere.

---

## 5. Summary Recommendation

If you want **Fraud Identification**, you **MUST use Tenant Tokens**.

**My advice:**
1.  **Default:** Use Statistical/Honor system. Accept that 5-10% of spins might be "freebies." This is normal for growth marketing.
2.  **Upsell:** Offer "Verified Fraud Protection" as a Premium Feature. If a tenant wants 100% accuracy, they must connect their Meta Account.

**This turns a technical limitation into a business feature.**
