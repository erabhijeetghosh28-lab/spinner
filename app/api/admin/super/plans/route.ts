import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
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
        const { 
            name, 
            price,
            interval,
            campaignsPerMonth,
            spinsPerCampaign,
            campaignDurationDays,
            spinsPerMonth,
            vouchersPerMonth,
            socialMediaEnabled,
            maxSocialTasks,
            customBranding,
            advancedAnalytics,
            allowQRCodeGenerator
        } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
        }

        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                price: price ?? 0,
                interval: interval ?? 'MONTHLY',
                campaignsPerMonth: campaignsPerMonth ?? 1,
                spinsPerCampaign: spinsPerCampaign ?? 1000,
                campaignDurationDays: campaignDurationDays ?? 30,
                spinsPerMonth: spinsPerMonth === '' || spinsPerMonth === null ? null : spinsPerMonth,
                vouchersPerMonth: vouchersPerMonth === '' || vouchersPerMonth === null ? null : vouchersPerMonth,
                socialMediaEnabled: socialMediaEnabled ?? false,
                maxSocialTasks: maxSocialTasks ?? 0,
                customBranding: customBranding ?? false,
                advancedAnalytics: advancedAnalytics ?? false,
                allowQRCodeGenerator: allowQRCodeGenerator ?? false,
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
        const { 
            id, 
            name, 
            price,
            interval,
            campaignsPerMonth,
            spinsPerCampaign,
            campaignDurationDays,
            spinsPerMonth,
            vouchersPerMonth,
            socialMediaEnabled,
            maxSocialTasks,
            customBranding,
            advancedAnalytics,
            allowQRCodeGenerator
        } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = price;
        if (interval !== undefined) updateData.interval = interval;
        if (campaignsPerMonth !== undefined) updateData.campaignsPerMonth = campaignsPerMonth;
        if (spinsPerCampaign !== undefined) updateData.spinsPerCampaign = spinsPerCampaign;
        if (campaignDurationDays !== undefined) updateData.campaignDurationDays = campaignDurationDays;
        if (spinsPerMonth !== undefined) updateData.spinsPerMonth = spinsPerMonth === '' || spinsPerMonth === null ? null : spinsPerMonth;
        if (vouchersPerMonth !== undefined) updateData.vouchersPerMonth = vouchersPerMonth === '' || vouchersPerMonth === null ? null : vouchersPerMonth;
        if (typeof socialMediaEnabled === 'boolean') updateData.socialMediaEnabled = socialMediaEnabled;
        if (maxSocialTasks !== undefined) updateData.maxSocialTasks = maxSocialTasks;
        if (typeof customBranding === 'boolean') updateData.customBranding = customBranding;
        if (typeof advancedAnalytics === 'boolean') updateData.advancedAnalytics = advancedAnalytics;
        if (typeof allowQRCodeGenerator === 'boolean') updateData.allowQRCodeGenerator = allowQRCodeGenerator;

        const plan = await prisma.subscriptionPlan.update({
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
