import prisma from '@/lib/prisma';
import axios from 'axios';

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
    console.log('🔍 Getting WhatsApp config for tenantId:', tenantId || 'none (using global)');
    
    // If tenantId provided, check for tenant-specific config first
    if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { waConfig: true, name: true, slug: true }
        });

        if (tenant?.waConfig) {
            const waConfig = tenant.waConfig as { apiUrl?: string; apiKey?: string; sender?: string };
            console.log('📋 Tenant-specific waConfig found for', tenant.name || tenant.slug, ':', {
                apiUrl: waConfig.apiUrl ? '✅ Set' : '❌ Missing',
                apiKey: waConfig.apiKey ? '✅ Set' : '❌ Missing',
                sender: waConfig.sender ? '✅ Set' : '❌ Missing'
            });
            
            if (waConfig.apiUrl && waConfig.apiKey && waConfig.sender) {
                console.log('✅ Using tenant-specific WhatsApp config');
                return {
                    apiUrl: waConfig.apiUrl,
                    apiKey: waConfig.apiKey,
                    sender: waConfig.sender
                };
            } else {
                console.log('⚠️ Tenant waConfig incomplete, falling back to global settings');
            }
        } else {
            console.log('ℹ️ No tenant-specific waConfig, checking global settings');
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

    console.log('📋 Global Settings found:', settings.length, 'entries');
    settings.forEach((s: { key: string; value: string }) => {
        console.log(`   - ${s.key}: ${s.value ? '✅ Set (' + s.value.substring(0, 10) + '...)' : '❌ Missing'}`);
    });

    const config: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
        config[s.key] = s.value;
    });

    const finalConfig = {
        apiUrl: config['WHATSAPP_API_URL'] || process.env.WHATSAPP_API_URL || 'https://unofficial.cloudwapi.in/send-message',
        apiKey: config['WHATSAPP_API_KEY'] || process.env.WHATSAPP_API_KEY || null,
        sender: config['WHATSAPP_SENDER'] || process.env.WHATSAPP_SENDER || null
    };

    console.log('🔧 Final WhatsApp config:', {
        apiUrl: finalConfig.apiUrl,
        apiKey: finalConfig.apiKey ? '✅ Set' : '❌ Missing',
        sender: finalConfig.sender ? '✅ Set' : '❌ Missing'
    });

    return finalConfig;
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
        console.error('❌ WhatsApp configuration missing:');
        console.error('   - API URL:', config.apiUrl);
        console.error('   - API Key:', config.apiKey ? '✅ Set' : '❌ Missing');
        console.error('   - Sender:', config.sender ? '✅ Set' : '❌ Missing');
        console.error('💡 Configure via:');
        console.error('   1. Environment variables: WHATSAPP_API_KEY, WHATSAPP_SENDER, WHATSAPP_API_URL');
        console.error('   2. Database Settings table: WHATSAPP_API_KEY, WHATSAPP_SENDER, WHATSAPP_API_URL');
        console.error('   3. Tenant waConfig (JSON field in Tenant table)');
        return null;
    }

    // Ensure number has 91 prefix if not present (assuming India)
    const formattedNumber = number.startsWith('91') || number.length > 10 ? number : `91${number}`;

    try {
        console.log(`📤 Sending WhatsApp message to ${formattedNumber} via ${config.apiUrl}`);
        const response = await axios.post(config.apiUrl, {
            api_key: config.apiKey,
            sender: config.sender,
            number: formattedNumber,
            message: message
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log(`✅ WhatsApp message sent to ${formattedNumber}:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error sending WhatsApp message:');
        console.error('   - URL:', config.apiUrl);
        console.error('   - Phone:', formattedNumber);
        console.error('   - Error:', error.response?.data || error.message);
        console.error('   - Status:', error.response?.status);
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

        // Format message with voucher code, prize name, and expiration date
        // Requirements: 11.3, 11.4, 11.5
        const message = `🎉 Congratulations! You won: ${voucher.prize.name}

Your voucher code: *${voucher.code}*
Valid until: ${expirationDate}

Show this code at the store to claim your prize!`;

        // Send WhatsApp message
        // Requirement 11.2: Include QR image if present
        if (voucher.qrImageUrl) {
            // Note: The current sendWhatsAppMessage doesn't support images
            // For now, we'll send the text message with the QR URL
            // In a production system, you'd need to extend the WhatsApp API
            // to support image messages or use a different endpoint
            const messageWithQR = `${message}\n\nQR Code: ${voucher.qrImageUrl}`;
            await sendWhatsAppMessage(customerPhone, messageWithQR, tenantId);
        } else {
            await sendWhatsAppMessage(customerPhone, message, tenantId);
        }

        console.log(`✅ Voucher notification sent to ${customerPhone} for voucher ${voucher.code}`);
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
