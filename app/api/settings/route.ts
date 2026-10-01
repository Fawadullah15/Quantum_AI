import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSiteSettings();

    // Sanitize to only expose public-facing website settings
    const publicSettings = {
      company_name: settings.company_name,
      company_legal_name: settings.company_legal_name,
      company_tagline: settings.company_tagline,
      company_description: settings.company_description,
      company_founded_year: settings.company_founded_year,
      site_logo: settings.site_logo,
      site_favicon: settings.site_favicon,
      site_og_image: settings.site_og_image,
      brand_accent_color: settings.brand_accent_color,
      company_email: settings.company_email,
      company_phone: settings.company_phone,
      company_location: settings.company_location,
      response_time_text: settings.response_time_text,
      company_linkedin: settings.company_linkedin,
      company_twitter: settings.company_twitter,
      company_github: settings.company_github,
      company_instagram: settings.company_instagram,
      company_youtube: settings.company_youtube,
      company_facebook: settings.company_facebook,
      meta_title: settings.meta_title,
      meta_description: settings.meta_description,
      meta_keywords: settings.meta_keywords,
      hero_eyebrow: settings.hero_eyebrow,
      hero_headline: settings.hero_headline,
      hero_description: settings.hero_description,
      hero_cta_primary_label: settings.hero_cta_primary_label,
      hero_cta_primary_link: settings.hero_cta_primary_link,
      hero_cta_secondary_label: settings.hero_cta_secondary_label,
      hero_cta_secondary_link: settings.hero_cta_secondary_link,
      nav_cta_label: settings.nav_cta_label,
      nav_cta_link: settings.nav_cta_link,
      footer_tagline: settings.footer_tagline,
      footer_copyright: settings.footer_copyright,
    };

    return NextResponse.json(publicSettings, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[API] Error in public settings endpoint:', error);
    return NextResponse.json({ error: 'Failed to retrieve site settings' }, { status: 500 });
  }
}
