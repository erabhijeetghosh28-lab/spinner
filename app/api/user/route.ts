import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { userId, name, email } = await req.json();

        if (!userId || !name || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const user = await prisma.endUser.update({
            where: { id: userId },
            data: { name, email },
            include: { tenant: true }
        });

        // Send prize notification via WhatsApp if they won
        const latestSpin = await prisma.spin.findFirst({
            where: { userId, wonPrize: true },
            orderBy: { spinDate: 'desc' },
            include: { prize: true }
        });

        if (latestSpin && latestSpin.prize) {
            const { sendPrizeNotification } = await import('@/lib/whatsapp');
            await sendPrizeNotification(
                user.phone, 
                latestSpin.prize.name, 
                latestSpin.prize.couponCode || undefined,
                user.tenantId
            );
        }

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
