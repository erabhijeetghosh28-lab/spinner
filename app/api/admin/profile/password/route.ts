import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAdminAuth } from '@/lib/auth';

export async function PUT(req: NextRequest) {
    try {
        // Verify authentication
        const authError = await requireAdminAuth(req);
        if (authError) return authError;

        const { currentPassword, newPassword, adminId, isSuperAdmin } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
        }

        // Get admin from token or ID
        // For now, we'll use adminId passed from frontend (in production, extract from JWT)
        let admin = null;
        let passwordHash = '';

        if (isSuperAdmin) {
            if (!adminId) {
                return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
            }
            admin = await prisma.admin.findUnique({
                where: { id: adminId }
            });
            if (!admin) {
                return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
            }
            passwordHash = admin.password;
        } else {
            if (!adminId) {
                return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
            }
            const tenantAdmin = await prisma.tenantAdmin.findUnique({
                where: { id: adminId }
            });
            if (!tenantAdmin) {
                return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
            }
            passwordHash = tenantAdmin.password;
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, passwordHash);
        if (!passwordMatch) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        if (isSuperAdmin) {
            await prisma.admin.update({
                where: { id: adminId },
                data: { password: hashedNewPassword }
            });
        } else {
            await prisma.tenantAdmin.update({
                where: { id: adminId },
                data: { password: hashedNewPassword }
            });
        }

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error updating password:', error);
        return NextResponse.json({ 
            error: 'Failed to update password',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
