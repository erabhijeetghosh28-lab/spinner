import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const settings = await prisma.setting.findMany();
        // Convert array to key-value object
        const settingsObj = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return NextResponse.json({ settings: settingsObj });
    } catch (error: any) {
        return NextResponse.json({ 
            error: 'Failed to fetch settings',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { settings } = await req.json();

        if (typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
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
                        description: `Configuration for ${key}`
                    }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
