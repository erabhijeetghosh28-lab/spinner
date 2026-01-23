import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Simple rate limiting (in production, use Redis or similar)
const otpAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): boolean {
    const now = Date.now();
    const key = phone;
    const record = otpAttempts.get(key);

    if (!record || now > record.resetAt) {
        otpAttempts.set(key, { count: 1, resetAt: now + 60000 }); // 1 minute window
        return true;
    }

    if (record.count >= 3) { // Max 3 OTP requests per minute
        return false;
    }

    record.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const { phone, tenantId, tenantSlug } = await req.json();

        // Validate phone number format
        const phoneRegex = /^[0-9]{10,15}$/;
        const cleanPhone = phone?.replace(/\D/g, '');
        
        if (!cleanPhone || !phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
            return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
        }

        // Rate limiting
        if (!checkRateLimit(cleanPhone)) {
            return NextResponse.json({ 
                error: 'Too many OTP requests. Please try again in a minute.' 
            }, { status: 429 });
        }

        // Get tenant - either by ID or slug
        let tenant = null;
        if (tenantId) {
            tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        } else if (tenantSlug) {
            tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
        } else {
            // Default to 'default' tenant for backward compatibility
            tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
        }

        if (!tenant || !tenant.isActive) {
            return NextResponse.json({ error: 'Invalid or inactive tenant' }, { status: 400 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

        // Save to DB (no userId yet, will be linked after verification)
        await prisma.oTP.create({
            data: {
                phone: cleanPhone,
                otp,
                expiresAt,
            },
        });

        // REAL WhatsApp Send - use tenant's WhatsApp config if available
        const { sendWhatsAppOTP } = await import('@/lib/whatsapp');
        await sendWhatsAppOTP(cleanPhone, otp, tenant.id);

        return NextResponse.json({ success: true, message: 'OTP sent successfully via WhatsApp' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
