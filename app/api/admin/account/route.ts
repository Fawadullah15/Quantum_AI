import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
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

    // Rate Limiting Check: 6 attempts per 5 minutes per user
    const rateLimitKey = `auth:account:${activeUserId}:${action}`;
    const rateLimit = checkRateLimit(rateLimitKey, 6, 5 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many attempts. For your security, this action has been temporarily locked. Please try again in ${rateLimit.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 1. UPDATE USERNAME / NAME / EMAIL
    // ─────────────────────────────────────────────────────────────
    if (action === 'UPDATE_PROFILE') {
      const { currentPassword, newName, newEmail } = body;

      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to authorize profile changes' }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password provided' }, { status: 403 });
      }

      resetRateLimit(rateLimitKey);

      const updateData: { name?: string; email?: string } = {};

      if (newName && typeof newName === 'string') {
        const trimmedName = newName.trim();
        if (!trimmedName) {
          return NextResponse.json({ error: 'Username / Name cannot be empty' }, { status: 400 });
        }
        updateData.name = trimmedName;
      }

      if (newEmail && typeof newEmail === 'string') {
        const cleanEmail = newEmail.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
        }

        const existing = await prisma.user.findFirst({
          where: { email: cleanEmail, NOT: { id: activeUserId } },
        });
        if (existing) {
          return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 400 });
        }
        updateData.email = cleanEmail;
      }

      const updated = await prisma.user.update({
        where: { id: activeUserId },
        data: updateData,
        select: { id: true, name: true, email: true, role: true, tokenVersion: true },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: activeUserId,
          action: 'UPDATE_PROFILE',
          entity: 'USER',
          entityId: activeUserId,
          details: `Admin profile updated: name="${updated.name}", email="${updated.email}"`,
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Account profile updated successfully.',
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
        return NextResponse.json({ error: 'New password and confirmation password do not match' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password provided' }, { status: 403 });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { error: 'New password cannot be identical to your current password. Please choose a new password.' },
          { status: 400 }
        );
      }

      resetRateLimit(rateLimitKey);

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: activeUserId },
        data: { password: hashedPassword },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: activeUserId,
          action: 'CHANGE_PASSWORD',
          entity: 'USER',
          entityId: activeUserId,
          details: 'Admin account password changed successfully.',
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully. Your account is secured.',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. LOG OUT ALL OTHER DEVICES (REVOKE OTHER SESSIONS)
    // ─────────────────────────────────────────────────────────────
    if (action === 'LOGOUT_OTHER_DEVICES') {
      const { currentPassword } = body;
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to authorize session revocation' }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password provided' }, { status: 403 });
      }

      resetRateLimit(rateLimitKey);

      const updated = await prisma.user.update({
        where: { id: activeUserId },
        data: { tokenVersion: { increment: 1 } },
        select: { tokenVersion: true },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: activeUserId,
          action: 'REVOKE_SESSIONS',
          entity: 'SESSION',
          entityId: activeUserId,
          details: `All other active sessions revoked (new tokenVersion: ${updated.tokenVersion}).`,
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        newTokenVersion: updated.tokenVersion,
        message: 'All other active sessions have been terminated.',
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

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: activeUserId,
          action: 'LOGOUT_ALL',
          entity: 'SESSION',
          entityId: activeUserId,
          details: 'Global logout triggered across all devices.',
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'All devices logged out. Redirecting to login...',
      });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (error: any) {
    console.error('[Account Security Error]:', error);
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
