import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const userEmail = session.user?.email;
    const body = await request.json();
    const { action } = body;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && userEmail) {
      user = await prisma.user.findUnique({ where: { email: userEmail } });
    }
    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const activeUserId = user.id;

    // ─────────────────────────────────────────────────────────────
    // 1. UPDATE USERNAME / NAME / EMAIL
    // ─────────────────────────────────────────────────────────────
    if (action === 'UPDATE_PROFILE') {
      const { currentPassword, newName, newEmail } = body;

      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to update profile' }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 403 });
      }

      const updateData: any = {};
      if (newName && newName.trim()) updateData.name = newName.trim();
      if (newEmail && newEmail.trim()) {
        const cleanEmail = newEmail.trim().toLowerCase();
        const existing = await prisma.user.findFirst({
          where: { email: cleanEmail, NOT: { id: activeUserId } },
        });
        if (existing) {
          return NextResponse.json({ error: 'This email is already in use' }, { status: 400 });
        }
        updateData.email = cleanEmail;
      }

      const updated = await prisma.user.update({
        where: { id: activeUserId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: { name: updated.name, email: updated.email },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. CHANGE PASSWORD
    // ─────────────────────────────────────────────────────────────
    if (action === 'CHANGE_PASSWORD') {
      const { currentPassword, newPassword, confirmPassword } = body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json({ error: 'All password fields are required' }, { status: 400 });
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'New password and confirmation do not match' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 403 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: activeUserId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. LOG OUT ALL OTHER DEVICES
    // ─────────────────────────────────────────────────────────────
    if (action === 'LOGOUT_OTHER_DEVICES') {
      const { currentPassword } = body;
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to verify session security' }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 403 });
      }

      const updated = await prisma.user.update({
        where: { id: activeUserId },
        data: { tokenVersion: { increment: 1 } },
      });

      return NextResponse.json({
        success: true,
        newTokenVersion: updated.tokenVersion,
        message: 'All other active sessions have been invalidated.',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. LOG OUT OF ALL DEVICES (INCLUDING CURRENT)
    // ─────────────────────────────────────────────────────────────
    if (action === 'LOGOUT_ALL_DEVICES') {
      await prisma.user.update({
        where: { id: activeUserId },
        data: { tokenVersion: { increment: 1 } },
      });

      return NextResponse.json({
        success: true,
        message: 'All devices logged out. Redirecting to login...',
      });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (error: any) {
    console.error('[Account Security Error]:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
