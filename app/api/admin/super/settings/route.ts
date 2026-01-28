import { validateAdminToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/super/settings
 * Fetch platform-wide settings for Super Admin
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await validateAdminToken(req);
        if (!auth.isValid || !auth.isSuperAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 401 });
        }

        const settings = await prisma.setting.findMany();
        const settingsObj = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return NextResponse.json({ settings: settingsObj });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch platform settings' }, { status: 500 });
    }
}

/**
 * POST /api/admin/super/settings
 * Update platform-wide settings (used for WhatsApp Text/Media keys)
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await validateAdminToken(req);
        if (!auth.isValid || !auth.isSuperAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 401 });
        }

        const { settings } = await req.json();

        if (typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
        }

        // Update settings in transaction
        await prisma.$transaction(
            Object.entries(settings).map(([key, value]) =>
                prisma.setting.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: {
                        key,
                        value: String(value),
                        description: `Platform setting for ${key}`
                    }
                })
            )
        );

        return NextResponse.json({ success: true, message: 'Platform settings updated successfully' });
    } catch (error: any) {
        console.error('Error updating platform settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
