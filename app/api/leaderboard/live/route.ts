import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// Server-Sent Events endpoint for real-time leaderboard updates
export async function GET(req: NextRequest) {
    // Set up SSE headers
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

            let lastLeaderboardHash = '';
            let intervalId: NodeJS.Timeout;

            const sendUpdate = async () => {
                try {
                    // Get current leaderboard
                    const topUsers = await prisma.spin.groupBy({
                        by: ['userId'],
                        _count: { userId: true },
                        orderBy: { _count: { userId: 'desc' } },
                        take: 100,
                    });

                    if (topUsers.length === 0) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'update', leaders: [] })}\n\n`));
                        return;
                    }

                    const userIds = topUsers.map(u => u.userId);

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

                    const spinCountMap = new Map(topUsers.map(s => [s.userId, s._count.userId]));
                    const winCountMap = new Map(winCounts.map(w => [w.userId, w._count.userId]));

                    const leaders = users
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

                    // Create hash to detect changes
                    const currentHash = JSON.stringify(leaders.map(l => ({ id: l.id, wins: l.wins, spins: l.totalSpins })));

                    // Only send if leaderboard changed
                    if (currentHash !== lastLeaderboardHash) {
                        lastLeaderboardHash = currentHash;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'update', leaders })}\n\n`));
                    }
                } catch (error) {
                    console.error('[SSE Leaderboard] Error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch leaderboard' })}\n\n`));
                }
            };

            // Send initial update
            await sendUpdate();

            // Poll every 5 seconds for updates
            intervalId = setInterval(sendUpdate, 5000);

            // Cleanup on client disconnect
            req.signal.addEventListener('abort', () => {
                clearInterval(intervalId);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
