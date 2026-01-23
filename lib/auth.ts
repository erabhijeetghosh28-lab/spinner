import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Validates admin authentication token
 * For production, replace with proper JWT verification
 */
export async function validateAdminToken(req: NextRequest): Promise<{ isValid: boolean; adminId?: string; tenantId?: string; isSuperAdmin?: boolean }> {
    try {
        // Get token from Authorization header or cookie
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || req.cookies.get('admin-token')?.value;

        if (!token) {
            return { isValid: false };
        }

        // TODO: Replace with proper JWT verification in production
        // For now, check if token matches pattern and extract admin info
        if (token.startsWith('mock-super-admin-token')) {
            // In production, decode JWT and verify
            // For now, return valid for super admin
            return { isValid: true, isSuperAdmin: true };
        }

        if (token.startsWith('mock-tenant-admin-token')) {
            // In production, decode JWT and get tenantId from token
            // For now, we'll need tenantId from request
            const tenantId = req.nextUrl.searchParams.get('tenantId') || req.headers.get('x-tenant-id');
            if (tenantId) {
                return { isValid: true, tenantId, isSuperAdmin: false };
            }
        }

        // Check if it's a session token (end user)
        if (token.startsWith('mock-session-token-')) {
            const userId = token.replace('mock-session-token-', '');
            const user = await prisma.endUser.findUnique({
                where: { id: userId },
                select: { id: true, tenantId: true }
            });
            if (user) {
                return { isValid: true, adminId: user.id, tenantId: user.tenantId };
            }
        }

        return { isValid: false };
    } catch (error) {
        return { isValid: false };
    }
}

/**
 * Middleware helper to protect admin routes
 */
export async function requireAdminAuth(req: NextRequest): Promise<NextResponse | null> {
    const validation = await validateAdminToken(req);
    
    if (!validation.isValid) {
        return NextResponse.json(
            { error: 'Unauthorized: Authentication required' },
            { status: 401 }
        );
    }

    return null; // Auth passed
}
