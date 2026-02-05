import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * POST /api/auth/connect
 * Lead/contact form: send Business name, Contact person, Email, Phone to owner via global CloudWA.
 * No account creation.
 */
export async function POST(req: NextRequest) {
    try {
        const { name, contactPersonName, email, phone } = await req.json();

        if (!name || !contactPersonName || !email || !phone) {
            return NextResponse.json(
                { error: 'Business name, contact person name, email, and phone are required' },
                { status: 400 }
            );
        }

        const ownerPhoneSetting = await prisma.setting.findUnique({
            where: { key: 'SIGNUP_NOTIFICATION_PHONE' }
        });
        const ownerPhone = ownerPhoneSetting?.value?.trim();

        if (!ownerPhone) {
            return NextResponse.json(
                { error: 'Owner notification is not configured. Please try again later.' },
                { status: 503 }
            );
        }

        const message = [
            '🆕 New connect request – TheLeadSpin',
            '',
            `Business Name: ${String(name).trim()}`,
            `Contact Person: ${String(contactPersonName).trim()}`,
            `Email: ${String(email).trim()}`,
            `Phone: ${String(phone).trim()}`
        ].join('\n');

        await sendWhatsAppMessage(ownerPhone, message, undefined);

        return NextResponse.json({ success: true, message: 'Thank you! We will connect with you soon.' });
    } catch (error: any) {
        console.error('Connect/lead submission error:', error);
        return NextResponse.json(
            {
                error: 'Unable to send your request. Please try again or contact us directly.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
