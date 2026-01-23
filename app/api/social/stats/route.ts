import { NextRequest, NextResponse } from 'next/server';
import { getSocialStats } from '@/lib/meta-api';
import prisma from '@/lib/prisma';

// GET: Get social media stats (Facebook & Instagram follower counts)
// Cache: 1 hour (revalidate = 3600)
export async function GET(req: NextRequest) {
    try {
        // Note: Database caching removed - relying on HTTP cache headers instead
        // Cache is handled by Next.js revalidate and HTTP headers (1 hour)

        // Fetch fresh data from Meta APIs
        const stats = await getSocialStats();

        // Note: Database caching removed - count field is Int, not suitable for JSON
        // Relying on HTTP cache headers instead (1 hour cache)

        return NextResponse.json({
            ...stats,
            cached: false,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error: any) {
        console.error('Error fetching social stats:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch social media stats',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
