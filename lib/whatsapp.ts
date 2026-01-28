import prisma from '@/lib/prisma';
import axios from 'axios';

interface WhatsAppConfig {
    apiUrl: string;
    apiKey: string | null;
    sender: string | null;
}

/**
 * Fetches WhatsApp configuration from database
 * Priority: 
 * 1. Specific API Type (TEXT/MEDIA) from Global Settings
 * 2. Tenant waConfig (Legacy/Specific)
 * 3. Environment Variables (Legacy)
 */
async function getWhatsAppConfig(type: 'TEXT' | 'MEDIA' = 'TEXT', tenantId?: string): Promise<WhatsAppConfig> {
    console.log(`🔍 Getting WhatsApp ${type} config`);
    
    // 1. Check Global Settings for the requested type first (New standard)
    const settings = await prisma.setting.findMany({
        where: {
            key: {
                in: [
                    `WHATSAPP_${type}_API_URL`, 
                    `WHATSAPP_${type}_API_KEY`, 
                    `WHATSAPP_${type}_SENDER`,
                    'WHATSAPP_API_URL', 
                    'WHATSAPP_API_KEY', 
                    'WHATSAPP_SENDER'
                ]
            }
        }
    });

    const config: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
        config[s.key] = s.value;
    });

    // Priority 1: Type-specific global settings
    let apiUrl: string | undefined = config[`WHATSAPP_${type}_API_URL`];
    let apiKey: string | undefined = config[`WHATSAPP_${type}_API_KEY`];
    let sender: string | undefined = config[`WHATSAPP_${type}_SENDER`];

    // Priority 2: Tenant-specific config (Overrides)
    if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { waConfig: true }
        });

        if (tenant?.waConfig) {
            const waConfig = tenant.waConfig as { 
                apiUrl?: string; 
                apiKey?: string; 
                sender?: string;
                mediaApiUrl?: string;
                mediaApiKey?: string;
                mediaSender?: string;
            };

            // If MEDIA requested, look for specific media fields first
            if (type === 'MEDIA') {
                if (waConfig.mediaApiKey && waConfig.mediaSender) {
                    apiUrl = waConfig.mediaApiUrl || apiUrl;
                    apiKey = waConfig.mediaApiKey;
                    sender = waConfig.mediaSender;
                } else if (waConfig.apiKey && waConfig.sender) {
                    // Fallback to tenant's basic config if media specific missing
                    apiUrl = waConfig.apiUrl || apiUrl;
                    apiKey = waConfig.apiKey;
                    sender = waConfig.sender;
                }
            } else {
                // For TEXT, use basic config
                if (waConfig.apiKey && waConfig.sender) {
                    apiUrl = waConfig.apiUrl || apiUrl;
                    apiKey = waConfig.apiKey;
                    sender = waConfig.sender;
                }
            }
        }
    }

    // Priority 3: Legacy global settings / Environment variables
    const finalConfig: WhatsAppConfig = {
        apiUrl: apiUrl || config['WHATSAPP_API_URL'] || process.env.WHATSAPP_API_URL || 
                (type === 'MEDIA' ? 'https://unofficial.cloudwapi.in/send-media' : 'https://unofficial.cloudwapi.in/send-message'),
        apiKey: apiKey || config['WHATSAPP_API_KEY'] || process.env.WHATSAPP_API_KEY || null,
        sender: sender || config['WHATSAPP_SENDER'] || process.env.WHATSAPP_SENDER || null
    };

    return finalConfig;
}

/**
 * Sends a WhatsApp message using the configured device and API
 */
export async function sendWhatsAppMessage(number: string, message: string, tenantId?: string) {
    const config = await getWhatsAppConfig('TEXT', tenantId);

    if (!config.apiKey || !config.sender) {
        console.error('❌ WhatsApp TEXT configuration missing');
        return null;
    }

    const formattedNumber = number.startsWith('91') || number.length > 10 ? number : `91${number}`;

    try {
        const response = await axios.post(config.apiUrl, {
            api_key: config.apiKey,
            sender: config.sender,
            number: formattedNumber,
            message: message
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        return response.data;
    } catch (error: any) {
        console.error('❌ Error sending WhatsApp message:', error.message);
        return null;
    }
}

/**
 * Sends a WhatsApp Media message (Image/QR)
 */
export async function sendWhatsAppMedia(
    number: string, 
    mediaUrl: string, 
    caption: string, 
    mediaType: 'image' | 'video' | 'audio' | 'document' = 'image',
    tenantId?: string
) {
    const config = await getWhatsAppConfig('MEDIA', tenantId);

    if (!config.apiKey || !config.sender) {
        console.warn('⚠️ WhatsApp MEDIA configuration missing, falling back to TEXT');
        return sendWhatsAppMessage(number, `${caption}\n\nView QR Code: ${mediaUrl}`, tenantId);
    }

    const formattedNumber = number.startsWith('91') || number.length > 10 ? number : `91${number}`;

    try {
        console.log(`📤 Sending WhatsApp media to ${formattedNumber} via ${config.apiUrl}`);
        const response = await axios.post(config.apiUrl, {
            api_key: config.apiKey,
            sender: config.sender,
            number: formattedNumber,
            media_type: mediaType,
            caption: caption,
            url: mediaUrl
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000 // Media might take longer
        });

        console.log(`✅ WhatsApp media sent to ${formattedNumber}`);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error sending WhatsApp media:', error.message);
        // Fallback to text if media fails
        return sendWhatsAppMessage(number, `${caption}\n\nView QR Code: ${mediaUrl}`, tenantId);
    }
}

/**
 * Sends an OTP via WhatsApp
 */
export async function sendWhatsAppOTP(number: string, otp: string, tenantId?: string) {
    const message = `Your Spin & Win verification code is: ${otp}. Valid for 5 minutes. DO NOT share this code with anyone.`;
    return sendWhatsAppMessage(number, message, tenantId);
}

/**
 * Sends a Prize Winning confirmation via WhatsApp
 * @param number - Phone number
 * @param prizeName - Name of the prize won
 * @param couponCode - Optional coupon code
 * @param tenantId - Optional tenant ID for tenant-specific WhatsApp config
 */
export async function sendPrizeNotification(number: string, prizeName: string, couponCode?: string, tenantId?: string) {
    let message = `Congratulations! 🎉 You've won "${prizeName}" from our Spin & Win wheel.`;

    if (couponCode) {
        message += `\n\nYour Coupon Code: *${couponCode}*`;
    }

    message += `\n\nShow this message to claim your reward!`;

    return sendWhatsAppMessage(number, message, tenantId);
}

/**
 * Sends a voucher notification via WhatsApp
 * 
 * Formats a message with voucher code, prize name, and expiration date.
 * If a QR image URL is present, sends the image with the message.
 * Logs errors but doesn't throw exceptions to ensure voucher creation succeeds.
 * 
 * @param voucher - Voucher object with code, prize, expiration, and optional QR image
 * @param customerPhone - Customer's phone number
 * @param tenantId - Tenant ID for tenant-specific WhatsApp config
 * 
 * Requirements: 1.7, 11.2, 11.3, 11.4, 11.5, 11.6
 */
export async function sendVoucherNotification(
    voucher: {
        code: string;
        prize: { name: string };
        expiresAt: Date;
        qrImageUrl: string | null;
        couponCode?: string; // Add optional static coupon code
    },
    customerPhone: string,
    tenantId: string
) {
    try {
        // Format expiration date in a readable format
        const expirationDate = new Date(voucher.expiresAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Format message - consolidated into one clean message
        // Include static coupon code if present (e.g. ZIGGY50) + unique voucher code
        let message = `🎉 *Congratulations!* You won: *${voucher.prize.name}*\n\n`;
        
        if (voucher.couponCode) {
            message += `Coupon Code: *${voucher.couponCode}*\n`;
        }
        
        message += `Voucher Code: *${voucher.code}*\n`;
        message += `Valid until: ${expirationDate}\n\n`;
        message += `Show this code at the store to claim your prize!`;

        // Send WhatsApp message
        if (voucher.qrImageUrl) {
            // Use the new Media API for QR codes
            await sendWhatsAppMedia(customerPhone, voucher.qrImageUrl, message, 'image', tenantId);
        } else {
            await sendWhatsAppMessage(customerPhone, message, tenantId);
        }

        console.log(`✅ Consolidated voucher notification sent to ${customerPhone}`);
    } catch (error) {
        // Requirement 11.6: Log error but don't throw exception
        // This ensures voucher creation succeeds even if WhatsApp delivery fails
        console.error('❌ Failed to send voucher WhatsApp notification:', {
            voucherCode: voucher.code,
            customerPhone,
            error: error instanceof Error ? error.message : String(error)
        });
        // Don't throw - just log the error
    }
}
