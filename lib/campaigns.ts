import prisma from '@/lib/db';
import { logDatabaseDiagnostic } from '@/lib/db-diagnostics';

export type CampaignType =
  | 'IMAGE_POPUP'
  | 'ANNOUNCEMENT_POPUP'
  | 'COMPACT_NOTIFICATION'
  | 'PROMOTIONAL_BANNER'
  | 'IMAGE_ONLY';

export type CampaignStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'DISABLED' | 'EXPIRED';

export type RepeatPolicy = 'EVERY_PAGE' | 'SESSION' | 'ONCE_PERSISTENT' | 'COOLDOWN';

export type DisplayPosition = 'TOP_RIGHT' | 'TOP_CENTER' | 'TOP_BANNER' | 'BOTTOM_RIGHT';

export interface PublicCampaign {
  id: string;
  headline: string | null;
  description: string | null;
  supportingText: string | null;
  badge: string | null;
  type: CampaignType;
  imageUrl: string | null;
  imageAlt: string | null;
  mobileImageUrl: string | null;
  ctaLabel: string | null;
  destinationUrl: string | null;
  openInNewTab: boolean;
  autoDismiss: boolean;
  dismissDuration: number;
  showProgress: boolean;
  repeatPolicy: RepeatPolicy;
  cooldownMinutes: number;
  displayPosition: DisplayPosition;
  allowClickEmptySpace: boolean;
  updatedAt: string; // ISO string used as version key for repeat policy updates
}

/**
 * Validate and sanitize destination URLs against unsafe schemes.
 * Only allows relative routes (/...), https://, http://, mailto:, and tel:.
 */
export function sanitizeDestinationUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Disallow javascript:, data:, vbscript:
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return null;
  }

  // Allow internal relative paths
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Allow web links & protocols
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return trimmed;
  }

  // Default to relative if no scheme specified
  return `/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Computes the real-time operational status of a campaign.
 * Handles automatic expiration and scheduled release without manual admin intervention.
 */
export function computeEffectiveStatus(campaign: {
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
}): CampaignStatus {
  const now = new Date();

  if (campaign.status === 'DISABLED') {
    return 'DISABLED';
  }

  if (campaign.status === 'DRAFT') {
    return 'DRAFT';
  }

  // Check expiration first
  if (campaign.endDate && new Date(campaign.endDate) <= now) {
    return 'EXPIRED';
  }

  // Check scheduled start
  if (campaign.startDate && new Date(campaign.startDate) > now) {
    return 'SCHEDULED';
  }

  if (campaign.status === 'PUBLISHED' || campaign.status === 'SCHEDULED') {
    return 'PUBLISHED';
  }

  return (campaign.status as CampaignStatus) || 'DRAFT';
}

/**
 * Fetches the currently eligible active campaign for public visitors.
 * Returns null if no campaign is active or if database is unreachable.
 */
export async function getActiveCampaign(): Promise<PublicCampaign | null> {
  try {
    const now = new Date();

    const candidates = await prisma.campaign.findMany({
      where: {
        OR: [
          { status: 'PUBLISHED' },
          {
            status: 'SCHEDULED',
            startDate: { lte: now },
          },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gt: now } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: 1,
    });

    if (!candidates || candidates.length === 0) {
      return null;
    }

    const campaign = candidates[0];

    // Double check effective status
    const effective = computeEffectiveStatus(campaign);
    if (effective !== 'PUBLISHED') {
      return null;
    }

    return {
      id: campaign.id,
      headline: campaign.headline,
      description: campaign.description,
      supportingText: campaign.supportingText,
      badge: campaign.badge,
      type: campaign.type as CampaignType,
      imageUrl: campaign.imageUrl,
      imageAlt: campaign.imageAlt,
      mobileImageUrl: campaign.mobileImageUrl,
      ctaLabel: campaign.ctaLabel,
      destinationUrl: sanitizeDestinationUrl(campaign.destinationUrl),
      openInNewTab: campaign.openInNewTab,
      autoDismiss: campaign.autoDismiss,
      dismissDuration: Math.min(Math.max(campaign.dismissDuration || 5, 3), 15),
      showProgress: campaign.showProgress,
      repeatPolicy: (campaign.repeatPolicy as RepeatPolicy) || 'SESSION',
      cooldownMinutes: campaign.cooldownMinutes || 1440,
      displayPosition: (campaign.displayPosition as DisplayPosition) || 'TOP_RIGHT',
      allowClickEmptySpace: campaign.allowClickEmptySpace,
      updatedAt: campaign.updatedAt.toISOString(),
    };
    } catch (error: unknown) {
    logDatabaseDiagnostic('lib/campaigns.ts:getActiveCampaign', error);
    return null;
  }
}
