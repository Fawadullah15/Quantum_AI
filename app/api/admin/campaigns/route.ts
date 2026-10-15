import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { softDelete } from '@/lib/recovery';
import { sanitizeDestinationUrl, computeEffectiveStatus } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseDateSafely(val: any): Date | null {
  if (!val) return null;
  if (typeof val === 'string' && !val.trim()) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const item = await prisma.campaign.findUnique({ where: { id } });
      if (!item) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      return NextResponse.json({ campaign: { ...item, effectiveStatus: computeEffectiveStatus(item) } });
    }

    const items = await prisma.campaign.findMany({
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });

    const withStatus = items.map((c) => ({
      ...c,
      effectiveStatus: computeEffectiveStatus(c),
    }));

    return NextResponse.json({ campaigns: withStatus });
  } catch (err: any) {
    console.error('GET /api/admin/campaigns error:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    const user = session.user as any;

    const body = await request.json();
    const { action, id, ...input } = body;

    // Handle duplication
    if (action === 'duplicate' && id) {
      const original = await prisma.campaign.findUnique({ where: { id } });
      if (!original) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

      const copy = await prisma.campaign.create({
        data: {
          name: `${original.name} (Copy)`,
          headline: original.headline,
          description: original.description,
          supportingText: original.supportingText,
          badge: original.badge,
          type: original.type,
          imageUrl: original.imageUrl,
          imageAlt: original.imageAlt,
          mobileImageUrl: original.mobileImageUrl,
          ctaLabel: original.ctaLabel,
          destinationUrl: original.destinationUrl,
          openInNewTab: original.openInNewTab,
          status: 'DRAFT',
          priority: original.priority,
          startDate: null,
          endDate: null,
          autoDismiss: original.autoDismiss,
          dismissDuration: original.dismissDuration,
          showProgress: original.showProgress,
          repeatPolicy: original.repeatPolicy,
          cooldownMinutes: original.cooldownMinutes,
          displayPosition: original.displayPosition,
          allowClickEmptySpace: original.allowClickEmptySpace,
          creatorId: user?.id || null,
          creatorName: user?.name || null,
        },
      });

      revalidatePath('/admin/campaigns');
      return NextResponse.json({ campaign: copy }, { status: 201 });
    }

    // Validation
    if (!input.name || !input.name.trim()) {
      return NextResponse.json({ error: 'Internal campaign name is required.' }, { status: 400 });
    }

    const cleanName = input.name.trim().slice(0, 120);
    const cleanHeadline = input.headline?.trim() ? input.headline.trim().slice(0, 150) : null;
    const cleanDescription = input.description?.trim() ? input.description.trim().slice(0, 500) : null;
    const cleanSupportingText = input.supportingText?.trim() ? input.supportingText.trim().slice(0, 250) : null;
    const cleanBadge = input.badge?.trim() ? input.badge.trim().toUpperCase().slice(0, 30) : null;
    const cleanCtaLabel = input.ctaLabel?.trim() ? input.ctaLabel.trim().slice(0, 40) : null;
    const cleanDestUrl = sanitizeDestinationUrl(input.destinationUrl);

    const parsedStart = parseDateSafely(input.startDate);
    const parsedEnd = parseDateSafely(input.endDate);

    if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
      return NextResponse.json({ error: 'Scheduled end date must be after the start date.' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: cleanName,
        headline: cleanHeadline,
        description: cleanDescription,
        supportingText: cleanSupportingText,
        badge: cleanBadge,
        type: input.type || 'IMAGE_POPUP',
        imageUrl: input.imageUrl?.trim() || null,
        imageAlt: input.imageAlt?.trim() || cleanHeadline || cleanName,
        mobileImageUrl: input.mobileImageUrl?.trim() || null,
        ctaLabel: cleanCtaLabel,
        destinationUrl: cleanDestUrl,
        openInNewTab: Boolean(input.openInNewTab),
        status: input.status || 'DRAFT',
        priority: Math.max(0, Math.min(100, Number(input.priority) || 0)),
        startDate: parsedStart,
        endDate: parsedEnd,
        autoDismiss: input.autoDismiss !== undefined ? Boolean(input.autoDismiss) : true,
        dismissDuration: Math.max(3, Math.min(15, Number(input.dismissDuration) || 5)),
        showProgress: input.showProgress !== undefined ? Boolean(input.showProgress) : true,
        repeatPolicy: input.repeatPolicy || 'SESSION',
        cooldownMinutes: Math.max(1, Number(input.cooldownMinutes) || 1440),
        displayPosition: input.displayPosition || 'TOP_RIGHT',
        allowClickEmptySpace: Boolean(input.allowClickEmptySpace),
        creatorId: user?.id || null,
        creatorName: user?.name || null,
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user?.id || null,
        adminName: user?.name || 'Administrator',
        adminEmail: user?.email || null,
        action: 'CREATE',
        entity: 'CAMPAIGN',
        entityId: campaign.id,
        entityName: campaign.name,
        details: `Created campaign "${campaign.name}" (${campaign.type}, ${campaign.status})`,
      },
    }).catch(() => {});

    revalidatePath('/admin/campaigns');
    revalidatePath('/admin');
    revalidatePath('/');

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/campaigns error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create campaign' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    const user = session.user as any;

    const body = await request.json();
    const { id, ...input } = body;

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required for update.' }, { status: 400 });
    }

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }

    const dataToUpdate: any = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) return NextResponse.json({ error: 'Internal campaign name cannot be empty.' }, { status: 400 });
      dataToUpdate.name = input.name.trim().slice(0, 120);
    }

    if (input.headline !== undefined) {
      dataToUpdate.headline = input.headline?.trim() ? input.headline.trim().slice(0, 150) : null;
    }

    if (input.description !== undefined) {
      dataToUpdate.description = input.description?.trim() ? input.description.trim().slice(0, 500) : null;
    }

    if (input.supportingText !== undefined) {
      dataToUpdate.supportingText = input.supportingText?.trim() ? input.supportingText.trim().slice(0, 250) : null;
    }

    if (input.badge !== undefined) {
      dataToUpdate.badge = input.badge?.trim() ? input.badge.trim().toUpperCase().slice(0, 30) : null;
    }

    if (input.type !== undefined) dataToUpdate.type = input.type;
    if (input.imageUrl !== undefined) dataToUpdate.imageUrl = input.imageUrl?.trim() || null;
    if (input.imageAlt !== undefined) dataToUpdate.imageAlt = input.imageAlt?.trim() || null;
    if (input.mobileImageUrl !== undefined) dataToUpdate.mobileImageUrl = input.mobileImageUrl?.trim() || null;
    if (input.ctaLabel !== undefined) dataToUpdate.ctaLabel = input.ctaLabel?.trim() ? input.ctaLabel.trim().slice(0, 40) : null;
    if (input.destinationUrl !== undefined) dataToUpdate.destinationUrl = sanitizeDestinationUrl(input.destinationUrl);
    if (input.openInNewTab !== undefined) dataToUpdate.openInNewTab = Boolean(input.openInNewTab);
    if (input.status !== undefined) dataToUpdate.status = input.status;
    if (input.priority !== undefined) dataToUpdate.priority = Math.max(0, Math.min(100, Number(input.priority) || 0));

    if (input.startDate !== undefined) dataToUpdate.startDate = parseDateSafely(input.startDate);
    if (input.endDate !== undefined) dataToUpdate.endDate = parseDateSafely(input.endDate);

    const checkStart = dataToUpdate.startDate !== undefined ? dataToUpdate.startDate : existing.startDate;
    const checkEnd = dataToUpdate.endDate !== undefined ? dataToUpdate.endDate : existing.endDate;
    if (checkStart && checkEnd && checkEnd <= checkStart) {
      return NextResponse.json({ error: 'Scheduled end date must be after the start date.' }, { status: 400 });
    }

    if (input.autoDismiss !== undefined) dataToUpdate.autoDismiss = Boolean(input.autoDismiss);
    if (input.dismissDuration !== undefined) dataToUpdate.dismissDuration = Math.max(3, Math.min(15, Number(input.dismissDuration) || 5));
    if (input.showProgress !== undefined) dataToUpdate.showProgress = Boolean(input.showProgress);
    if (input.repeatPolicy !== undefined) dataToUpdate.repeatPolicy = input.repeatPolicy;
    if (input.cooldownMinutes !== undefined) dataToUpdate.cooldownMinutes = Math.max(1, Number(input.cooldownMinutes) || 1440);
    if (input.displayPosition !== undefined) dataToUpdate.displayPosition = input.displayPosition;
    if (input.allowClickEmptySpace !== undefined) dataToUpdate.allowClickEmptySpace = Boolean(input.allowClickEmptySpace);

    const updated = await prisma.campaign.update({
      where: { id },
      data: dataToUpdate,
    });

    await prisma.activityLog.create({
      data: {
        userId: user?.id || null,
        adminName: user?.name || 'Administrator',
        adminEmail: user?.email || null,
        action: 'UPDATE',
        entity: 'CAMPAIGN',
        entityId: id,
        entityName: updated.name,
        details: `Updated campaign "${updated.name}".`,
      },
    }).catch(() => {});

    revalidatePath('/admin/campaigns');
    revalidatePath('/admin');
    revalidatePath('/');

    return NextResponse.json({ campaign: updated });
  } catch (err: any) {
    console.error('PUT /api/admin/campaigns error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update campaign' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status },
    });

    await prisma.activityLog.create({
      data: {
        userId: user?.id || null,
        adminName: user?.name || 'Administrator',
        adminEmail: user?.email || null,
        action: status === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
        entity: 'CAMPAIGN',
        entityId: id,
        entityName: updated.name,
        details: `Changed campaign "${updated.name}" status to ${status}.`,
      },
    }).catch(() => {});

    revalidatePath('/admin/campaigns');
    revalidatePath('/admin');
    revalidatePath('/');

    return NextResponse.json({ campaign: updated });
  } catch (err: any) {
    console.error('PATCH /api/admin/campaigns error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to toggle status' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as any;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await softDelete({
      entityType: 'CAMPAIGN',
      id,
      adminUser: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
      },
    });

    revalidatePath('/admin/campaigns');
    revalidatePath('/admin');
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/admin/campaigns error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete campaign' }, { status: 500 });
  }
}
