/**
 * Environment variable validation
 * Call this at app startup to ensure all required env vars are present
 */

export function validateEnv() {
    const required = [
        'DATABASE_URL'
    ];

    const missing: string[] = [];

    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env file or environment configuration.'
        );
    }

    // Optional but recommended
    const recommended = [
        'NEXT_PUBLIC_BASE_URL',
        'WHATSAPP_API_URL',
        'WHATSAPP_API_KEY',
        'WHATSAPP_SENDER',
        'UPLOADTHING_SECRET',
        'UPLOADTHING_APP_ID'
    ];

    const missingRecommended = recommended.filter(key => !process.env[key]);
    
    if (missingRecommended.length > 0 && process.env.NODE_ENV === 'production') {
        console.warn(
            `⚠️  Warning: Missing recommended environment variables: ${missingRecommended.join(', ')}\n` +
            'Some features may not work correctly in production.'
        );
    }
}

// Validate on import in production
if (process.env.NODE_ENV === 'production') {
    try {
        validateEnv();
    } catch (error) {
        console.error('❌ Environment validation failed:', error);
        // Don't throw in production to allow graceful degradation
        // But log the error for visibility
    }
}
