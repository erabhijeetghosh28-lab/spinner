import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Verify user exists
        const user = await prisma.endUser.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Increment share count and bonus spins
        const updatedUser = await prisma.endUser.update({
            where: { id: userId },
            data: {
                sharedWins: { increment: 1 }
                // bonusSpinsEarned is no longer awarded for intent, only for registration
            }
        });

        return NextResponse.json({
            success: true,
            bonusSpin: true,
            totalBonusSpins: updatedUser.bonusSpinsEarned
        });
    } catch (error: any) {
        console.error('Error recording share action:', error);
        return NextResponse.json({
            error: 'Failed to record share action',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
