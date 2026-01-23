# 🌐 Domain Integration Strategy

The user wants tenants to run the Spin Wheel on their own domains (e.g., `www.pizzashop.com/offer`) instead of `spinner.vercel.app`.

Here are the 4 implementation levels, ranked from easiest to most advanced.

## 1. The "Widget" Method (Recommended for MVP)
**How it works**: We provide a small HTML snippet (like YouTube or Tawk.to) that the tenant copies into their website.
**Mechanism**: It loads our app inside an `<iframe>` or a floating modal.
**Pros**:
*   ✅ Easiest for tenants (just copy-paste).
*   ✅ Works on any platform (WordPress, Shopify, Wix, Custom HTML).
*   ✅ No DNS configuration required.
*   ✅ Secure (We handle all logic).
**Cons**:
*   URL is still technically ours (inside the frame), but user stays on their site.

## 2. Reverse Proxy / Rewrite (Intermediate)
**How it works**: The tenant sets up a rule on *their* server to show our content at a specific path.
**Mechanism**: Next.js Rewrite or Nginx Proxy.
*   User visits: `pizzashop.com/spin`
*   Server fetches: `spinner.vercel.app/?tenant=pizza` (hidden from user)
**Pros**:
*   ✅ True "White Label" URL.
**Cons**:
*   ❌ Hard for non-technical tenants (requires editing Nginx/Apache/Vercel config).
*   ❌ Potential cookie/CORS issues to debug.

## 3. Custom Domains via Vercel API (Advanced)
**How it works**: The tenant points a subdomain (e.g., `offer.pizzashop.com`) to our Vercel app via CNAME.
**Mechanism**: We use Vercel's API to add their domain to our project programmatically.
**Pros**:
*   ✅ The "Gold Standard" for SaaS.
*   ✅ Complete branding.
**Cons**:
*   ❌ Vercel restricts the number of custom domains on free/pro plans (limits apply).
*   ❌ Requires tenant to manage DNS records (complex for some).

## 4. Headless API (Not Recommended)
**How it works**: The tenant builds their *own* frontend and calls our API (`/api/spin`).
**Pros**:
*   ✅ Ultimate control.
**Cons**:
*   ❌ Tenant has to code the entire UI (Wheel, Forms, Logic).
*   ❌ We need to enable CORS for specific domains (security risk).
*   ❌ Defeats the purpose of a "No-Code" SaaS.

---

## ⭐️ Recommendation: Option 1 (Widget/Iframe)
We should build an **"Embed Code Generator"** on the Tenant Dashboard.
Admin clicks "Embed Campaign" -> Gets a code like:
```html
<iframe src="https://spinner.vercel.app/?tenant=my-shop" width="100%" height="800px" style="border:none;"></iframe>
```
This is instant, free, and meets the requirement "publish on his domain" effectively.
