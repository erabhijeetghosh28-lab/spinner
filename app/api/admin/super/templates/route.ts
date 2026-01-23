import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const templates = await prisma.wheelTemplate.findMany({
            include: {
                _count: {
                    select: { campaigns: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ templates });
    } catch (error: any) {
        console.error('Error fetching templates:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch templates',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, componentKey, configSchema, isActive, thumbnail } = await req.json();

        if (!name || !componentKey) {
            return NextResponse.json({ error: 'Name and componentKey are required' }, { status: 400 });
        }

        const template = await prisma.wheelTemplate.create({
            data: {
                name,
                componentKey,
                configSchema: configSchema ? JSON.parse(JSON.stringify(configSchema)) : {},
                isActive: isActive ?? true,
                thumbnail: thumbnail || null,
            }
        });

        return NextResponse.json({ success: true, template });
    } catch (error: any) {
        console.error('Error creating template:', error);
        return NextResponse.json({ 
            error: 'Failed to create template',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { id, name, componentKey, configSchema, isActive, thumbnail } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (componentKey) updateData.componentKey = componentKey;
        if (configSchema) updateData.configSchema = JSON.parse(JSON.stringify(configSchema));
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

        const template = await prisma.wheelTemplate.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, template });
    } catch (error: any) {
        console.error('Error updating template:', error);
        return NextResponse.json({ 
            error: 'Failed to update template',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
