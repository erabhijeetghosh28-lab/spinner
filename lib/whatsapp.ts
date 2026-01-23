import axios from 'axios';
import prisma from '@/lib/prisma';

interface WhatsAppConfig {
    apiUrl: string;
    apiKey: string | null;
    sender: string | null;
}

/**
 * Fetches WhatsApp configuration from database
 * Priority: Tenant waConfig > Global Settings > Environment Variables
 */
async function getWhatsAppConfig(tenantId?: string): Promise<WhatsAppConfig> {
    // If tenantId provided, check for tenant-specific config first
    if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { waConfig: true }
        });

        if (tenant?.waConfig) {
            const waConfig = tenant.waConfig as { apiUrl?: string; apiKey?: string; sender?: string };
            if (waConfig.apiUrl && waConfig.apiKey && waConfig.sender) {
                return {
                    apiUrl: waConfig.apiUrl,
                    apiKey: waConfig.apiKey,
                    sender: waConfig.sender
                };
            }
        }
    }

    // Fall back to global settings
    const settings = await prisma.setting.findMany({
        where: {
            key: {
                in: ['WHATSAPP_API_URL', 'WHATSAPP_API_KEY', 'WHATSAPP_SENDER']
            }
        }
    });

    const config: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
        config[s.key] = s.value;
    });

    return {
        apiUrl: config['WHATSAPP_API_URL'] || process.env.WHATSAPP_API_URL || 'https://unofficial.cloudwapi.in/send-message',
        apiKey: config['WHATSAPP_API_KEY'] || process.env.WHATSAPP_API_KEY || null,
        sender: config['WHATSAPP_SENDER'] || process.env.WHATSAPP_SENDER || null
    };
}

/**
 * Sends a WhatsApp message using the configured device and API
 * @param number - Phone number (with or without country code)
 * @param message - Message content
 * @param tenantId - Optional tenant ID for tenant-specific WhatsApp config
 */
export async function sendWhatsAppMessage(number: string, message: string, tenantId?: string) {
    const config = await getWhatsAppConfig(tenantId);

    if (!config.apiKey || !config.sender) {
        console.error('WhatsApp configuration missing: API Key or Sender ID');
        return null;
    }

    // Ensure number has 91 prefix if not present (assuming India)
    const formattedNumber = number.startsWith('91') || number.length > 10 ? number : `91${number}`;

    try {
        const response = await axios.post(config.apiUrl, {
            api_key: config.apiKey,
            sender: config.sender,
            number: formattedNumber,
            message: message
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`WhatsApp message sent to ${formattedNumber}:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Sends an OTP via WhatsApp
 * @param number - Phone number
 * @param otp - OTP code
 * @param tenantId - Optional tenant ID for tenant-specific WhatsApp config
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
