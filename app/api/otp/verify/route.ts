import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { phone, otp, name, referralCode, tenantId, tenantSlug } = await req.json();

        // Validate inputs
        const phoneRegex = /^[0-9]{10,15}$/;
        const cleanPhone = phone?.replace(/\D/g, '');
        const cleanOTP = otp?.toString().trim();

        if (!cleanPhone || !phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
            return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
        }

        if (!cleanOTP || cleanOTP.length !== 6 || !/^\d{6}$/.test(cleanOTP)) {
            return NextResponse.json({ error: 'Invalid OTP format. Must be 6 digits.' }, { status: 400 });
        }

        // Sanitize name if provided
        const sanitizedName = name ? name.trim().slice(0, 100) : null;

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

        // Find valid OTP
        const otpRecord = await prisma.oTP.findFirst({
            where: {
                phone: cleanPhone,
                otp: cleanOTP,
                verified: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Mark as verified
        await prisma.oTP.update({
            where: { id: otpRecord.id },
            data: { verified: true },
        });

        // Check if user exists in this tenant, if not create
        let user = await prisma.endUser.findUnique({
            where: {
                tenantId_phone: {
                    tenantId: tenant.id,
                    phone: cleanPhone
                }
            }
        });

        if (!user) {
            let referredById = null;
            if (referralCode) {
                // Find referrer within the same tenant
                const referrer = await prisma.endUser.findUnique({
                    where: {
                        tenantId_referralCode: {
                            tenantId: tenant.id,
                            referralCode: referralCode
                        }
                    }
                });
                if (referrer) {
                    referredById = referrer.id;
                }
            }

            user = await prisma.endUser.create({
                data: {
                    tenantId: tenant.id,
                    phone: cleanPhone,
                    name: sanitizedName,
                    referredById
                },
            });

            // Phase 3: If user was referred, increment successfulReferrals and check milestone
            if (referredById) {
                const referrer = await prisma.endUser.update({
                    where: { id: referredById },
                    data: { successfulReferrals: { increment: 1 } },
                });

                // Get active campaign for referral settings
                const activeCampaign = await prisma.campaign.findFirst({
                    where: {
                        tenantId: tenant.id,
                        isActive: true,
                        isArchived: false,
                        startDate: { lte: new Date() },
                        endDate: { gte: new Date() },
                    },
                });

                if (activeCampaign && activeCampaign.referralsForBonus > 0) {
                    // Check if milestone reached
                    const milestoneReached =
                        referrer.successfulReferrals % activeCampaign.referralsForBonus === 0;

                    if (milestoneReached) {
                        // Award bonus spins
                        await prisma.endUser.update({
                            where: { id: referredById },
                            data: {
                                bonusSpinsEarned: {
                                    increment: activeCampaign.referralBonusSpins,
                                },
                            },
                        });

                        // Send WhatsApp notification (Phase 3)
                        try {
                            const { sendReferralMilestoneNotification } = await import('@/lib/whatsapp-notifications');
                            await sendReferralMilestoneNotification(
                                referredById,
                                sanitizedName || 'A friend',
                                referrer.successfulReferrals,
                                activeCampaign.referralBonusSpins,
                                activeCampaign.id
                            );
                        } catch (notifError) {
                            console.error('Error sending referral milestone notification:', notifError);
                            // Don't fail registration if notification fails
                        }
                    }
                }
            }
        } else if (sanitizedName && user.name !== sanitizedName) {
            // Update name if provided and different
            user = await prisma.endUser.update({
                where: { id: user.id },
                data: { name: sanitizedName }
            });
        }

        // In a real app, you'd set a session cookie/JWT here
        // For prototype, we'll return user data
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                referralCode: user.referralCode,
                tenantId: user.tenantId
            },
            token: 'mock-session-token-' + user.id // Simple token for client side storage
        });
    } catch (error: any) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
