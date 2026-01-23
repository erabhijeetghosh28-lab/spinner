import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const plans = await prisma.plan.findMany({
            include: {
                _count: {
                    select: { tenants: true }
                }
            },
            orderBy: { price: 'asc' }
        });

        return NextResponse.json({ plans });
    } catch (error: any) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch plans',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, maxSpins, maxCampaigns, waIntegrationEnabled, canUseCustomTemplates, allowAnalytics, allowQRCodeGenerator, allowInventoryTracking, price } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
        }

        const plan = await prisma.plan.create({
            data: {
                name,
                maxSpins: maxSpins ?? 1000,
                maxCampaigns: maxCampaigns ?? 1,
                waIntegrationEnabled: waIntegrationEnabled ?? true,
                canUseCustomTemplates: canUseCustomTemplates ?? false,
                allowAnalytics: allowAnalytics ?? false,
                allowQRCodeGenerator: allowQRCodeGenerator ?? false,
                allowInventoryTracking: allowInventoryTracking ?? false,
                price: price ?? null,
            }
        });

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        console.error('Error creating plan:', error);
        return NextResponse.json({ 
            error: 'Failed to create plan',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { id, name, maxSpins, maxCampaigns, waIntegrationEnabled, canUseCustomTemplates, allowAnalytics, allowQRCodeGenerator, allowInventoryTracking, price } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (maxSpins !== undefined) updateData.maxSpins = maxSpins;
        if (maxCampaigns !== undefined) updateData.maxCampaigns = maxCampaigns;
        if (typeof waIntegrationEnabled === 'boolean') updateData.waIntegrationEnabled = waIntegrationEnabled;
        if (typeof canUseCustomTemplates === 'boolean') updateData.canUseCustomTemplates = canUseCustomTemplates;
        if (typeof allowAnalytics === 'boolean') updateData.allowAnalytics = allowAnalytics;
        if (typeof allowQRCodeGenerator === 'boolean') updateData.allowQRCodeGenerator = allowQRCodeGenerator;
        if (typeof allowInventoryTracking === 'boolean') updateData.allowInventoryTracking = allowInventoryTracking;
        if (price !== undefined) updateData.price = price;

        const plan = await prisma.plan.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        console.error('Error updating plan:', error);
        return NextResponse.json({ 
            error: 'Failed to update plan',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
