/**
 * Meta (Facebook/Instagram) Graph API Integration
 * Uses FREE Meta APIs - no cost
 * 
 * Rate Limit: 200 calls/hour per app
 * This module tracks usage per tenant to stay within limits
 */

import prisma from '@/lib/prisma';

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const META_API_VERSION = 'v18.0';
const RATE_LIMIT_PER_HOUR = 190; // Buffer of 10 from 200 limit

export interface SocialStats {
    facebook?: {
        followers: number;
    };
    instagram?: {
        followers: number;
    };
    updatedAt: string;
}

/**
 * Check and update rate limit for tenant
 * Returns true if under limit, false if limit exceeded
 */
async function checkRateLimit(tenantId: string): Promise<boolean> {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaApiUsageHour: true, lastApiUsageReset: true },
        });

        if (!tenant) return false;

        const now = new Date();
        const lastReset = tenant.lastApiUsageReset || now;
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        // Reset if more than 1 hour has passed
        if (hoursSinceReset >= 1) {
            await prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    metaApiUsageHour: 0,
                    lastApiUsageReset: now,
                },
            });
            return true;
        }

        // Check if under limit
        if (tenant.metaApiUsageHour >= RATE_LIMIT_PER_HOUR) {
            return false; // Rate limit exceeded
        }

        // Increment usage
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                metaApiUsageHour: { increment: 1 },
            },
        });

        return true;
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return false; // Fail safe - don't allow if error
    }
}

/**
 * Get Facebook page follower count
 * Includes rate limit checking for tenant-specific tokens
 */
async function getFacebookFollowers(tenantId?: string, useTenantToken: boolean = false): Promise<number | null> {
    let pageId: string | undefined;
    let accessToken: string | undefined;

    if (useTenantToken && tenantId) {
        // Use tenant's own token
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { facebookPageId: true, facebookToken: true },
        });

        if (!tenant?.facebookPageId || !tenant?.facebookToken) {
            return null;
        }

        // Check rate limit
        if (!(await checkRateLimit(tenantId))) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        pageId = tenant.facebookPageId;
        accessToken = tenant.facebookToken;
    } else {
        // Use platform default token
        pageId = FACEBOOK_PAGE_ID;
        accessToken = FACEBOOK_PAGE_ACCESS_TOKEN;
    }

    if (!pageId || !accessToken) {
        return null;
    }

    try {
        const url = `https://graph.facebook.com/${META_API_VERSION}/${pageId}?fields=followers_count&access_token=${accessToken}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Facebook API error:', await response.text());
            return null;
        }

        const data = await response.json();
        return data.followers_count || null;
    } catch (error) {
        console.error('Error fetching Facebook followers:', error);
        return null;
    }
}

/**
 * Get Instagram business account follower count
 * Includes rate limit checking for tenant-specific tokens
 */
async function getInstagramFollowers(tenantId?: string, useTenantToken: boolean = false): Promise<number | null> {
    let accountId: string | undefined;
    let accessToken: string | undefined;

    if (useTenantToken && tenantId) {
        // Use tenant's own token
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { instagramAccountId: true, instagramToken: true },
        });

        if (!tenant?.instagramAccountId || !tenant?.instagramToken) {
            return null;
        }

        // Check rate limit
        if (!(await checkRateLimit(tenantId))) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        accountId = tenant.instagramAccountId;
        accessToken = tenant.instagramToken;
    } else {
        // Use platform default token
        accountId = INSTAGRAM_BUSINESS_ACCOUNT_ID;
        accessToken = INSTAGRAM_ACCESS_TOKEN;
    }

    if (!accountId || !accessToken) {
        return null;
    }

    try {
        const url = `https://graph.facebook.com/${META_API_VERSION}/${accountId}?fields=followers_count&access_token=${accessToken}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Instagram API error:', await response.text());
            return null;
        }

        const data = await response.json();
        return data.followers_count || null;
    } catch (error) {
        console.error('Error fetching Instagram followers:', error);
        return null;
    }
}

/**
 * Get social media stats (Facebook & Instagram follower counts)
 * Cached for 1 hour
 */
export async function getSocialStats(): Promise<SocialStats> {
    const [facebookFollowers, instagramFollowers] = await Promise.all([
        getFacebookFollowers(),
        getInstagramFollowers(),
    ]);

    const stats: SocialStats = {
        updatedAt: new Date().toISOString(),
    };

    if (facebookFollowers !== null) {
        stats.facebook = { followers: facebookFollowers };
    }

    if (instagramFollowers !== null) {
        stats.instagram = { followers: instagramFollowers };
    }

    return stats;
}
