import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { retryAdminNotificationEmail } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') || 'ALL').toUpperCase();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '40', 10), 1), 100);

    // Auto-backfill on initial run if Notification table is completely empty
    const totalExisting = await prisma.notification.count().catch(() => 0);
    if (totalExisting === 0) {
      try {
        const [contacts, careers, partnerships] = await Promise.all([
          prisma.contactSubmission.findMany({ take: 15, orderBy: { createdAt: 'desc' } }).catch(() => []),
          prisma.careerApplication.findMany({ take: 15, orderBy: { createdAt: 'desc' } }).catch(() => []),
          prisma.partnershipRequest.findMany({ take: 15, orderBy: { createdAt: 'desc' } }).catch(() => []),
        ]);

        const backfillItems: any[] = [];

        for (const c of contacts) {
          backfillItems.push({
            type: c.projectType ? 'PROJECT_INQUIRY' : 'CONTACT',
            title: c.projectType ? `New ${c.projectType} Inquiry` : `New Contact Message from ${c.name}`,
            subtitle: c.company ? `${c.company} • ${c.projectType || c.email}` : (c.projectType || c.email),
            senderName: c.name,
            senderEmail: c.email,
            preview: c.message.length > 120 ? c.message.slice(0, 120) + '...' : c.message,
            link: `/admin/messages/${c.id}`,
            details: JSON.stringify(c),
            read: c.status !== 'NEW',
            readAt: c.status !== 'NEW' ? c.updatedAt : null,
            emailStatus: 'SENT',
            emailRecipient: 'quantumai.cmp@gmail.com',
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          });
        }

        for (const a of careers) {
          backfillItems.push({
            type: 'CAREER',
            title: `New Career Application: ${a.fullName}`,
            subtitle: `${a.position} • ${a.experienceLevel} (${a.workType})`,
            senderName: a.fullName,
            senderEmail: a.email,
            preview: a.introduction.length > 120 ? a.introduction.slice(0, 120) + '...' : a.introduction,
            referenceId: a.referenceId,
            link: `/admin/careers-partnerships/career/${a.id}`,
            details: JSON.stringify(a),
            read: a.status !== 'NEW',
            readAt: a.status !== 'NEW' ? a.updatedAt : null,
            emailStatus: 'SENT',
            emailRecipient: 'quantumai.cmp@gmail.com',
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          });
        }

        for (const p of partnerships) {
          backfillItems.push({
            type: 'PARTNERSHIP',
            title: `New Partnership: ${p.subject}`,
            subtitle: `${p.fullName}${p.company ? ' • ' + p.company : ''} • ${p.partnershipType}`,
            senderName: p.fullName,
            senderEmail: p.email,
            preview: p.message.length > 120 ? p.message.slice(0, 120) + '...' : p.message,
            referenceId: p.referenceId,
            link: `/admin/careers-partnerships/partnership/${p.id}`,
            details: JSON.stringify(p),
            read: p.status !== 'NEW',
            readAt: p.status !== 'NEW' ? p.updatedAt : null,
            emailStatus: 'SENT',
            emailRecipient: 'quantumai.cmp@gmail.com',
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          });
        }

        if (backfillItems.length > 0) {
          for (const item of backfillItems) {
            await prisma.notification.create({ data: item }).catch(() => {});
          }
        }
      } catch (backfillErr) {
        console.warn('[Admin Notifications] Backfill error (non-fatal):', backfillErr);
      }
    }

    // Build filter condition
    let whereCondition: any = {};
    if (filter === 'UNREAD') {
      whereCondition = { read: false };
    } else if (filter === 'CONTACT') {
      whereCondition = { type: { in: ['CONTACT', 'PROJECT_INQUIRY'] } };
    } else if (filter === 'CAREER' || filter === 'CAREERS') {
      whereCondition = { type: 'CAREER' };
    } else if (filter === 'PARTNERSHIP' || filter === 'PARTNERSHIPS') {
      whereCondition = { type: 'PARTNERSHIP' };
    } else if (filter === 'TESTIMONIAL' || filter === 'TESTIMONIALS') {
      whereCondition = { type: 'TESTIMONIAL' };
    }

    const [unreadCount, totalCount, notifications] = await Promise.all([
      prisma.notification.count({ where: { read: false } }).catch(() => 0),
      prisma.notification.count({ where: whereCondition }).catch(() => 0),
      prisma.notification.findMany({
        where: whereCondition,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
    ]);

    return NextResponse.json({
      unreadCount,
      totalCount,
      notifications: notifications.map((n) => {
        let parsedDetails = null;
        if (n.details) {
          try {
            parsedDetails = JSON.parse(n.details);
          } catch {
            parsedDetails = { raw: n.details };
          }
        }

        return {
          id: n.id,
          type: n.type,
          title: n.title,
          subtitle: n.subtitle || '',
          senderName: n.senderName || '',
          senderEmail: n.senderEmail || '',
          preview: n.preview,
          details: parsedDetails,
          referenceId: n.referenceId || null,
          link: n.link || null,
          read: n.read,
          readAt: n.readAt,
          emailStatus: n.emailStatus || 'PENDING',
          emailError: n.emailError || null,
          emailSentAt: n.emailSentAt || null,
          emailFailedAt: n.emailFailedAt || null,
          emailRetryCount: n.emailRetryCount || 0,
          emailRecipient: n.emailRecipient || 'quantumai.cmp@gmail.com',
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        };
      }),
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ unreadCount: 0, totalCount: 0, notifications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, id } = body;

    if (action === 'retry_email') {
      if (!id) {
        return NextResponse.json({ error: 'Notification ID is required for email retry' }, { status: 400 });
      }

      const result = await retryAdminNotificationEmail(String(id));
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Email dispatched successfully to quantumai.cmp@gmail.com',
          notification: result.notification,
          provider: result.provider,
          messageId: result.messageId,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to dispatch email copy',
            notification: result.notification,
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Notification POST action error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, id, read } = body;

    // 1. Mark All As Read
    if (action === 'mark_all_read') {
      await prisma.notification.updateMany({
        where: { read: false },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      revalidatePath('/api/admin/notifications');
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    // 2. Toggle Individual Notification Read State
    if (id && typeof read === 'boolean') {
      const updated = await prisma.notification.update({
        where: { id: String(id) },
        data: {
          read,
          readAt: read ? new Date() : null,
        },
      });

      revalidatePath('/api/admin/notifications');
      return NextResponse.json({ success: true, notification: updated });
    }

    return NextResponse.json({ error: 'Invalid update parameters' }, { status: 400 });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const { softDelete } = await import('@/lib/recovery');
    await softDelete({
      entityType: 'NOTIFICATION',
      id,
      adminUser: {
        id: (session.user as any)?.id,
        name: session.user?.name || undefined,
        email: session.user?.email || undefined,
      },
    });

    revalidatePath('/api/admin/notifications');
    revalidatePath('/admin/recently-deleted');
    return NextResponse.json({ success: true, message: 'Notification moved to Recently Deleted' });
  } catch (error) {
    console.error('Notification delete error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
