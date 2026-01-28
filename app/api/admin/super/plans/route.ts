import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        // Get Plan model (legacy plans used by planId)
        const plans = await prisma.plan.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ plans });
    } catch (error: any) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch plans',
            details: error.message
        }, { status: 500 });
    }
}
