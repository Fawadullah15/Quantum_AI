import prisma from '@/lib/db';

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

  // Contact
  company_email: string;
  company_routing_email: string;
  company_phone: string;
  company_location: string;
  response_time_text: string;

  // Social Links
  company_linkedin: string;
  company_twitter: string;
  company_github: string;
  company_instagram: string;
  company_youtube: string;
  company_facebook: string;

  // SEO & Metadata
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  robots_index: string;

  // Homepage / Hero
  hero_eyebrow: string;
  hero_headline: string;
  hero_description: string;
  hero_cta_primary_label: string;
  hero_cta_primary_link: string;
  hero_cta_secondary_label: string;
  hero_cta_secondary_link: string;

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
  company_legal_name: 'Quantum AI Engineering Labs',
  company_tagline: 'One intelligence core. Many systems. Real products. Real results.',
  company_description: 'Quantum AI builds AI systems, custom business software, and automation for organizations that need better ways to operate.',
  company_founded_year: '2023',

  // Branding
  site_logo: '/quantum-q-logo.png',
  site_favicon: '/favicon.ico',
  site_og_image: '/quantum-q-logo.png',
  brand_accent_color: '#1677FF',

  // Contact
  company_email: 'hello@quantumai.dev',
  company_routing_email: 'fawadimraj@gmail.com',
  company_phone: '',
  company_location: 'San Francisco & Islamabad',
  response_time_text: 'We review all technical inquiries within 24 hours and respond with architectural scope and feasibility analysis.',

  // Social Links
  company_linkedin: 'https://linkedin.com/company/quantumai',
  company_twitter: 'https://x.com/quantumai',
  company_github: 'https://github.com/Fawadullah15/Quantum_AI',
  company_instagram: '',
  company_youtube: '',
  company_facebook: '',

  // SEO & Metadata
  meta_title: 'Quantum AI | AI, Software & Automation Solutions',
  meta_description: 'Quantum AI builds AI systems, custom business software, and automation for organizations that need better ways to operate.',
  meta_keywords: 'Artificial Intelligence, Machine Learning, AI Agents, Custom Business Software, Systems Engineering, Next.js',
  robots_index: 'true',

  // Homepage / Hero
  hero_eyebrow: 'SYS.CORE // INTELLIGENCE ARCHITECTURE',
  hero_headline: 'WE BUILD\nINTELLIGENT\nSOFTWARE',
  hero_description: 'Quantum AI builds AI systems, custom business software, and automation for organizations that need better ways to operate.',
  hero_cta_primary_label: 'START A PROJECT',
  hero_cta_primary_link: '/contact',
  hero_cta_secondary_label: 'EXPLORE OUR WORK',
  hero_cta_secondary_link: '/work',

  // Navigation & Footer
  nav_cta_label: 'Start a Project',
  nav_cta_link: '/contact',
  footer_tagline: 'Intelligent software for a connected world.',
  footer_copyright: `© ${new Date().getFullYear()} Quantum AI. All rights reserved.`,
};

/**
 * Retrieves all site settings from the database merged with defaults.
 * Guaranteed to return full typed settings even if database is unavailable.
 */
export async function getSiteSettings(): Promise<SiteSettingsMap> {
  try {
    const dbSettings = await prisma.siteSettings.findMany();
    const result = { ...DEFAULT_SETTINGS };

    for (const item of dbSettings) {
      if (item.key && item.value !== null && item.value !== undefined) {
        (result as any)[item.key] = item.value;
      }
    }

    // Keep QUANTUM_AI and company_name synchronized
    if (result.QUANTUM_AI && (!result.company_name || result.company_name === DEFAULT_SETTINGS.company_name)) {
      result.company_name = result.QUANTUM_AI;
    } else if (result.company_name) {
      result.QUANTUM_AI = result.company_name;
    }

    return result;
  } catch (error) {
    console.error('[Settings] Error fetching site settings from DB:', error);
    return DEFAULT_SETTINGS;
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
  } catch {
    return fallback ?? DEFAULT_SETTINGS[key];
  }
}
