'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { softDelete } from '@/lib/recovery';
import {
  sanitizeDestinationUrl,
  computeEffectiveStatus,
  type CampaignType,
  type CampaignStatus,
  type RepeatPolicy,
  type DisplayPosition,
} from '@/lib/campaigns';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized. Please sign in to the Quantum AI admin panel.');
  }
  return session;
}

export interface CampaignInput {
  name: string;
  headline?: string | null;
  description?: string | null;
  supportingText?: string | null;
  badge?: string | null;
  type?: CampaignType;
  imageUrl?: string | null;
  imageAlt?: string | null;
  mobileImageUrl?: string | null;
  ctaLabel?: string | null;
  destinationUrl?: string | null;
  openInNewTab?: boolean;
  status?: CampaignStatus;
  priority?: number;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  autoDismiss?: boolean;
  dismissDuration?: number;
  showProgress?: boolean;
  repeatPolicy?: RepeatPolicy;
  cooldownMinutes?: number;
  displayPosition?: DisplayPosition;
  allowClickEmptySpace?: boolean;
}

/**
 * Fetch all campaigns with optional filters
 */
export async function getCampaigns(filters?: {
  status?: string;
  type?: string;
  search?: string;
}) {
  await checkAuth();

  try {
    const where: any = {};

    if (filters?.type && filters.type !== 'ALL') {
      where.type = filters.type;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { headline: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { badge: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.campaign.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    // Compute effective real-time status for each item
    const withComputedStatus = items.map((item) => {
      const effectiveStatus = computeEffectiveStatus(item);
      return {
        ...item,
        effectiveStatus,
      };
    });

    // If filtering by status, apply against computed status
    if (filters?.status && filters.status !== 'ALL') {
      return withComputedStatus.filter(
        (c) => c.effectiveStatus === filters.status || c.status === filters.status
      );
    }

    return withComputedStatus;
  } catch (error: any) {
    console.error('[Campaigns Actions] getCampaigns error:', error);
    return [];
  }
}

/**
 * Fetch campaign statistics across all records
 */
export async function getCampaignStats() {
  await checkAuth();

  try {
    const all = await prisma.campaign.findMany();

    let published = 0;
    let scheduled = 0;
    let draft = 0;
    let disabled = 0;
    let expired = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    for (const c of all) {
      const eff = computeEffectiveStatus(c);
      if (eff === 'PUBLISHED') published++;
      else if (eff === 'SCHEDULED') scheduled++;
      else if (eff === 'DRAFT') draft++;
      else if (eff === 'DISABLED') disabled++;
      else if (eff === 'EXPIRED') expired++;

      totalImpressions += c.impressions || 0;
      totalClicks += c.clicks || 0;
    }

    const ctr = totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(1)
      : '0.0';

    return {
      total: all.length,
      published,
      scheduled,
      draft,
      disabled,
      expired,
      totalImpressions,
      totalClicks,
      ctr,
    };
  } catch (error) {
    console.error('[Campaigns Actions] getCampaignStats error:', error);
    return {
      total: 0,
      published: 0,
      scheduled: 0,
      draft: 0,
      disabled: 0,
      expired: 0,
      totalImpressions: 0,
      totalClicks: 0,
      ctr: '0.0',
    };
  }
}

/**
 * Fetch a single campaign by ID
 */
export async function getCampaignById(id: string) {
  await checkAuth();

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });
    if (!campaign) return null;

    return {
      ...campaign,
      effectiveStatus: computeEffectiveStatus(campaign),
    };
  } catch (error) {
    console.error(`[Campaigns Actions] getCampaignById (${id}) error:`, error);
    return null;
  }
}

function parseDateSafely(val: any): Date | null {
  if (!val) return null;
  if (typeof val === 'string' && !val.trim()) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Create a new campaign
 */
export async function createCampaign(input: CampaignInput) {
  const session = await checkAuth();
  const user = session.user as any;

  if (!input.name || !input.name.trim()) {
    throw new Error('Internal campaign name is required.');
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
    throw new Error('End date must be scheduled after start date.');
  }

  const newCampaign = await prisma.campaign.create({
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

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user?.id || null,
      adminName: user?.name || 'Administrator',
      adminEmail: user?.email || null,
      action: 'CREATE',
      entity: 'CAMPAIGN',
      entityId: newCampaign.id,
      entityName: newCampaign.name,
      details: `Created campaign "${newCampaign.name}" (${newCampaign.type}, ${newCampaign.status})`,
    },
  }).catch(() => {});

  revalidatePath('/admin/campaigns');
  revalidatePath('/admin');
  revalidatePath('/');

  return newCampaign;
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(id: string, input: Partial<CampaignInput>) {
  const session = await checkAuth();
  const user = session.user as any;

  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Campaign not found.');
  }

  const dataToUpdate: any = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error('Internal campaign name cannot be empty.');
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

  if (input.type !== undefined) {
    dataToUpdate.type = input.type;
  }

  if (input.imageUrl !== undefined) {
    dataToUpdate.imageUrl = input.imageUrl?.trim() || null;
  }

  if (input.imageAlt !== undefined) {
    dataToUpdate.imageAlt = input.imageAlt?.trim() || null;
  }

  if (input.mobileImageUrl !== undefined) {
    dataToUpdate.mobileImageUrl = input.mobileImageUrl?.trim() || null;
  }

  if (input.ctaLabel !== undefined) {
    dataToUpdate.ctaLabel = input.ctaLabel?.trim() ? input.ctaLabel.trim().slice(0, 40) : null;
  }

  if (input.destinationUrl !== undefined) {
    dataToUpdate.destinationUrl = sanitizeDestinationUrl(input.destinationUrl);
  }

  if (input.openInNewTab !== undefined) {
    dataToUpdate.openInNewTab = Boolean(input.openInNewTab);
  }

  if (input.status !== undefined) {
    dataToUpdate.status = input.status;
  }

  if (input.priority !== undefined) {
    dataToUpdate.priority = Math.max(0, Math.min(100, Number(input.priority) || 0));
  }

  if (input.startDate !== undefined) {
    dataToUpdate.startDate = parseDateSafely(input.startDate);
  }

  if (input.endDate !== undefined) {
    dataToUpdate.endDate = parseDateSafely(input.endDate);
  }

  if (input.autoDismiss !== undefined) {
    dataToUpdate.autoDismiss = Boolean(input.autoDismiss);
  }

  if (input.dismissDuration !== undefined) {
    dataToUpdate.dismissDuration = Math.max(3, Math.min(15, Number(input.dismissDuration) || 5));
  }

  if (input.showProgress !== undefined) {
    dataToUpdate.showProgress = Boolean(input.showProgress);
  }

  if (input.repeatPolicy !== undefined) {
    dataToUpdate.repeatPolicy = input.repeatPolicy;
  }

  if (input.cooldownMinutes !== undefined) {
    dataToUpdate.cooldownMinutes = Math.max(1, Number(input.cooldownMinutes) || 1440);
  }

  if (input.displayPosition !== undefined) {
    dataToUpdate.displayPosition = input.displayPosition;
  }

  if (input.allowClickEmptySpace !== undefined) {
    dataToUpdate.allowClickEmptySpace = Boolean(input.allowClickEmptySpace);
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: dataToUpdate,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user?.id || null,
      adminName: user?.name || 'Administrator',
      adminEmail: user?.email || null,
      action: 'UPDATE',
      entity: 'CAMPAIGN',
      entityId: id,
      entityName: updated.name,
      details: `Updated campaign "${updated.name}" (${updated.status})`,
    },
  }).catch(() => {});

  revalidatePath('/admin/campaigns');
  revalidatePath('/admin');
  revalidatePath('/');

  return updated;
}

/**
 * Toggle publication status between PUBLISHED and DRAFT / DISABLED
 */
export async function togglePublishCampaign(id: string, forceStatus?: CampaignStatus) {
  const session = await checkAuth();
  const user = session.user as any;

  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Campaign not found.');
  }

  let nextStatus: CampaignStatus;
  if (forceStatus) {
    nextStatus = forceStatus;
  } else {
    nextStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: nextStatus },
  });

  await prisma.activityLog.create({
    data: {
      userId: user?.id || null,
      adminName: user?.name || 'Administrator',
      adminEmail: user?.email || null,
      action: nextStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
      entity: 'CAMPAIGN',
      entityId: id,
      entityName: updated.name,
      details: `Set campaign "${updated.name}" status to ${nextStatus}.`,
    },
  }).catch(() => {});

  revalidatePath('/admin/campaigns');
  revalidatePath('/admin');
  revalidatePath('/');

  return updated;
}

/**
 * Duplicate an existing campaign as a draft copy
 */
export async function duplicateCampaign(id: string) {
  const session = await checkAuth();
  const user = session.user as any;

  const original = await prisma.campaign.findUnique({ where: { id } });
  if (!original) {
    throw new Error('Campaign not found.');
  }

  const duplicated = await prisma.campaign.create({
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
  return duplicated;
}

/**
 * Soft delete a campaign (moves to Recently Deleted)
 */
export async function deleteCampaign(id: string) {
  const session = await checkAuth();
  const user = session.user as any;

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

  return { success: true };
}
