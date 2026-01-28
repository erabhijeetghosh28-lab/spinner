import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Note: Next.js 16+ recommends using route handlers instead of middleware for complex logic
// This middleware is kept for backward compatibility and simple routing
export function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // 1. Skip Middleware for Internal Routes & Static Files
    if (
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/admin') ||
        url.pathname.includes('.') // Skip files (images, css, etc)
    ) {
        return NextResponse.next();
    }

    // 2. Identify Current Domain (Localhost vs Production)
    // Adjust these to match your actual deployment domains
    const isMainDomain =
        hostname === 'localhost:3000' ||
        hostname.endsWith('.vercel.app') ||
        hostname === 'spinner.vercel.app';

    // 3. Handle Subdomains / Custom Domains
    if (!isMainDomain) {
        // SCENARIO: User visits "burgers.spinner.vercel.app" or "offer.pizzashop.com"
        // We rewrite this internally to "/?tenant=..." logic

        // Strategy A: Subdomain Extraction (e.g. burgers.myapp.com)
        // NOTE: This assumes the pattern "slug.maindomain.com"
        const currentHost = hostname.replace(`.spinner.vercel.app`, '');
        // If it's a Custom Domain (e.g. offer.shop.com), currentHost will be "offer.shop.com"

        // Rewrite the URL to the index page with a query param
        // The user sees "burgers.app.com", but Next.js renders "/?tenant=burgers"
        // For custom domains, we'd ideally pass ?customDomain=hostname and let the API resolve it.

        // For now, let's assume the subdomain IS the tenant slug for simplicity
        // or pass it as a special param
        const tenantSlug = currentHost.split('.')[0]; // simplistic check

        // Modify the URL to point to the dynamic route
        url.pathname = `/${tenantSlug}${url.pathname}`;

        // Rewrite: User sees "subdomain.com", Server renders "/[slug]" logic
        // This maps to app/[slug]/page.tsx automatically via Next.js routing
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
