import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

// Global-only leaderboard (ignores tenant)
// Cached for 30 seconds to reduce database load
async function getLeaderboardData() {
    // Optimized: Use single query with aggregation instead of multiple queries
    // Get top 100 users by spin count first (to limit dataset)
    const topUsers = await prisma.spin.groupBy({
        by: ['userId'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 100,
    });

    if (topUsers.length === 0) {
        return [];
    }

    const userIds = topUsers.map(u => u.userId);

    // Fetch user details and win counts in parallel
    const [users, winCounts] = await Promise.all([
        prisma.endUser.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                phone: true,
                successfulReferrals: true,
            },
        }),
        prisma.spin.groupBy({
            by: ['userId'],
            _count: { userId: true },
            where: {
                userId: { in: userIds },
                wonPrize: true,
                prize: {
                    NOT: [
                        { name: { contains: 'No Prize', mode: 'insensitive' } },
                        { name: { contains: 'No Offer', mode: 'insensitive' } },
                    ],
                },
            },
        }),
    ]);

    // Create maps for O(1) lookup
    const spinCountMap = new Map(topUsers.map(s => [s.userId, s._count.userId]));
    const winCountMap = new Map(winCounts.map(w => [w.userId, w._count.userId]));

    // Merge and sort
    return users
        .map((user) => ({
            ...user,
            totalSpins: spinCountMap.get(user.id) || 0,
            wins: winCountMap.get(user.id) || 0,
        }))
        .sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.totalSpins !== a.totalSpins) return b.totalSpins - a.totalSpins;
            return (a.name || '').localeCompare(b.name || '');
        })
        .slice(0, 50);
}

// Cache the leaderboard for 30 seconds
const getCachedLeaderboard = unstable_cache(
    getLeaderboardData,
    ['leaderboard'],
    { revalidate: 30 }
);

export async function GET(_req: NextRequest) {
    try {
        const leaders = await getCachedLeaderboard();
        return NextResponse.json({ leaders: leaders || [] });
    } catch (error: any) {
        console.error('[Leaderboard] Error:', error);
        // Return empty array instead of error to prevent frontend crashes
        return NextResponse.json(
            {
                leaders: [],
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 200 }, // Return 200 with empty data instead of 500
        );
    }
}
