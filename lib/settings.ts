import prisma from '@/lib/db';
import { logDatabaseDiagnostic } from '@/lib/db-diagnostics';

export interface SiteSettingsMap {
  // General
  QUANTUM_AI: string; // company_name alias
  company_name: string;
  company_legal_name: string;
  company_tagline: string;
  company_description: string;
  company_founded_year: string;

  // Branding
  site_logo: string;
  site_favicon: string;
  site_og_image: string;
  brand_accent_color: string;

  // Contact Information
  company_email: string;
  company_routing_email: string;
  company_phone: string;
  company_address: string;
  company_location: string;
  contact_form_recipient: string;
  response_time_text: string;

  // Social Links
  company_twitter: string;
  company_linkedin: string;
  company_github: string;
  company_instagram: string;
  company_youtube: string;
  company_facebook: string;

  // SEO & Verification
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  robots_index: string;
  google_site_verification: string;

  // Homepage / Hero
  hero_eyebrow: string;
  hero_headline: string;
  hero_description: string;
  hero_cta_primary_label: string;
  hero_cta_primary_link: string;
  hero_cta_secondary_label: string;
  hero_cta_secondary_link: string;

  // Analytics & Tracking
  google_analytics_id: string;

  // Compliance & Policy Settings
  privacy_email: string;
  dpo_contact: string;
  terms_effective_date: string;
  privacy_effective_date: string;
  cookie_effective_date: string;

  // Navigation & Footer
  nav_cta_label: string;
  nav_cta_link: string;
  footer_tagline: string;
  footer_copyright: string;
}

export const DEFAULT_SETTINGS: SiteSettingsMap = {
  // General
  QUANTUM_AI: 'Quantum AI',
  company_name: 'Quantum AI',
  company_legal_name: 'Quantum AI Systems',
  company_tagline: 'AI, software, and automation for industry and business.',
  company_description: 'Quantum AI is an AI and software engineering company that builds custom software, business automation, and AI systems for manufacturers, engineering firms, and businesses.',
  company_founded_year: '2024',

  // Branding
  site_logo: '/quantum-q-logo.png',
  site_favicon: '/quantum-q-logo.png',
  site_og_image: '/quantum-q-logo.png',
  brand_accent_color: '#1677FF',

  // Contact Information
  company_email: 'support@quantumaitech.org',
  company_routing_email: 'support@quantumaitech.org',
  company_phone: '',
  company_address: '',
  company_location: 'Global / Hybrid',
  contact_form_recipient: 'support@quantumaitech.org',
  response_time_text: 'We review all inquiries within 24 hours and reply with next steps and a feasibility assessment.',

  // Social Links
  company_twitter: 'https://twitter.com',
  company_linkedin: 'https://linkedin.com',
  company_github: 'https://github.com',
  company_instagram: '',
  company_youtube: '',
  company_facebook: '',

  // SEO & Verification
  meta_title: 'Quantum AI - AI, Custom Software & Automation for Industry and Business',
  meta_description: 'Custom software, business automation, and AI systems for manufacturers, engineering firms, and businesses.',
  meta_keywords: 'Artificial Intelligence, Machine Learning, AI Agents, Custom Business Software, Systems Engineering, Next.js',
  robots_index: 'true',
  google_site_verification: '',

  // Homepage / Hero
  hero_eyebrow: 'SYS.CORE // AI, SOFTWARE & AUTOMATION',
  hero_headline: 'WE BUILD\nINTELLIGENT\nSOFTWARE',
  hero_description: 'Quantum AI is an AI and software engineering company. We build custom software, business automation, and AI systems for manufacturers, engineering firms, and businesses with complex operations.',
  hero_cta_primary_label: 'START A PROJECT',
  hero_cta_primary_link: '/contact',
  hero_cta_secondary_label: 'EXPLORE OUR WORK',
  hero_cta_secondary_link: '/work',

  // Analytics & Tracking
  google_analytics_id: '',

  // Compliance & Policy Settings
  privacy_email: 'support@quantumaitech.org',
  dpo_contact: 'support@quantumaitech.org',
  terms_effective_date: 'October 2026',
  privacy_effective_date: 'October 2026',
  cookie_effective_date: 'October 2026',

  // Navigation & Footer
  nav_cta_label: 'Start a Project',
  nav_cta_link: '/contact',
  footer_tagline: 'AI, software, and automation for industry and business.',
  footer_copyright: `© ${new Date().getFullYear()} Quantum AI. All rights reserved.`,
};

let cachedSettings: { data: SiteSettingsMap; expires: number } | null = null;

export function clearSettingsCache() {
  cachedSettings = null;
}

/**
 * Retrieves all site settings from the database merged with defaults.
 * Distinguishes an empty database from a failed database connection.
 * Serves safe defaults if the database is offline so public layouts never crash.
 */
export async function getSiteSettings(): Promise<SiteSettingsMap> {
  const now = Date.now();
  if (cachedSettings && cachedSettings.expires > now) {
    return cachedSettings.data;
  }

  try {
    const dbSettings = await prisma.siteSettings.findMany({
      where: {
        NOT: {
          key: { startsWith: '__qb_restore_stage:' },
        },
      },
    });
    const result = { ...DEFAULT_SETTINGS };

    // Database is connected: process records if any exist (handles empty table gracefully)
    if (dbSettings && dbSettings.length > 0) {
      for (const item of dbSettings) {
        if (item.key && item.value !== null && item.value !== undefined) {
          (result as any)[item.key] = item.value;
        }
      }
    }

    // Keep QUANTUM_AI and company_name synchronized
    if (result.QUANTUM_AI && (!result.company_name || result.company_name === DEFAULT_SETTINGS.company_name)) {
      result.company_name = result.QUANTUM_AI;
    } else if (result.company_name) {
      result.QUANTUM_AI = result.company_name;
    }

    cachedSettings = { data: result, expires: now + 60000 };
    return result;
  } catch (error: unknown) {
    logDatabaseDiagnostic('lib/settings.ts:getSiteSettings', error);
    // Return resilient fallback settings so public pages render gracefully even during offline states
    return cachedSettings ? cachedSettings.data : DEFAULT_SETTINGS;
  }
}

/**
 * Retrieves a single setting by key with a fallback.
 */
export async function getSetting<K extends keyof SiteSettingsMap>(
  key: K,
  fallback?: SiteSettingsMap[K]
): Promise<SiteSettingsMap[K]> {
  try {
    const item = await prisma.siteSettings.findUnique({
      where: { key },
    });
    if (item && item.value !== null && item.value !== undefined) {
      return item.value as SiteSettingsMap[K];
    }
    return fallback ?? DEFAULT_SETTINGS[key];
  } catch (error: unknown) {
    logDatabaseDiagnostic(`lib/settings.ts:getSetting(${String(key)})`, error);
    return fallback ?? DEFAULT_SETTINGS[key];
  }
}
