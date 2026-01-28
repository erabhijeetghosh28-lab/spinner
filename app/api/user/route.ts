import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
            include: { 
                prize: true,
                vouchers: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (latestSpin && latestSpin.prize) {
            const voucher = latestSpin.vouchers?.[0];
            
            if (voucher) {
                const { sendVoucherNotification } = await import('@/lib/whatsapp');
                await sendVoucherNotification(
                    {
                        code: voucher.code,
                        prize: { name: latestSpin.prize.name },
                        expiresAt: voucher.expiresAt,
                        qrImageUrl: voucher.qrImageUrl,
                        couponCode: latestSpin.prize.couponCode || undefined,
                    },
                    user.phone,
                    user.tenantId
                );
            } else {
                const { sendPrizeNotification } = await import('@/lib/whatsapp');
                await sendPrizeNotification(
                    user.phone, 
                    latestSpin.prize.name, 
                    latestSpin.prize.couponCode || undefined,
                    user.tenantId
                );
            }
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
