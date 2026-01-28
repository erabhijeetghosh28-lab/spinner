import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        // Get only SubscriptionPlan (the active plan model)
        const subscriptionPlans = await prisma.subscriptionPlan.findMany({
            include: {
                _count: {
                    select: {
                        tenants: true
                    }
                }
            },
            orderBy: { price: 'asc' }
        });

        return NextResponse.json({ 
            plans: subscriptionPlans
        });
    } catch (error: any) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch plans',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        
        const plan = await prisma.subscriptionPlan.create({
            data: {
                name: data.name,
                price: data.price,
                interval: data.interval || 'MONTHLY',
                campaignsPerMonth: data.campaignsPerMonth || 1,
                spinsPerCampaign: data.spinsPerCampaign || 1000,
                campaignDurationDays: data.campaignDurationDays || 30,
                spinsPerMonth: data.spinsPerMonth,
                vouchersPerMonth: data.vouchersPerMonth,
                socialMediaEnabled: data.socialMediaEnabled || false,
                maxSocialTasks: data.maxSocialTasks || 0,
                customBranding: data.customBranding || false,
                advancedAnalytics: data.advancedAnalytics || false,
                allowQRCodeGenerator: data.allowQRCodeGenerator || false,
                isActive: true
            },
            include: {
                _count: {
                    select: {
                        tenants: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        console.error('Error creating plan:', error);
        return NextResponse.json({ 
            error: 'Failed to create plan',
            details: error.message
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const data = await req.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                name: updateData.name,
                price: updateData.price,
                interval: updateData.interval,
                campaignsPerMonth: updateData.campaignsPerMonth,
                spinsPerCampaign: updateData.spinsPerCampaign,
                campaignDurationDays: updateData.campaignDurationDays,
                spinsPerMonth: updateData.spinsPerMonth,
                vouchersPerMonth: updateData.vouchersPerMonth,
                socialMediaEnabled: updateData.socialMediaEnabled,
                maxSocialTasks: updateData.maxSocialTasks,
                customBranding: updateData.customBranding,
                advancedAnalytics: updateData.advancedAnalytics,
                allowQRCodeGenerator: updateData.allowQRCodeGenerator
            },
            include: {
                _count: {
                    select: {
                        tenants: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        console.error('Error updating plan:', error);
        return NextResponse.json({ 
            error: 'Failed to update plan',
            details: error.message
        }, { status: 500 });
    }
}
