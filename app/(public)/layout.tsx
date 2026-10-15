import React from 'react';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CustomCursor from '@/components/layout/CustomCursor';
import ClientLayout from '@/components/layout/ClientLayout';
import { AudioPlayer } from '@/components/layout/AudioPlayer';
import { SoundToggle } from '@/components/layout/SoundToggle';
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/seo';
import { getSiteSettings } from '@/lib/settings';
import { getActiveCampaign } from '@/lib/campaigns';
import { CampaignDisplay } from '@/components/public/CampaignDisplay';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const activeCampaign = await getActiveCampaign();
  const orgSchema = getOrganizationSchema(settings);
  const webSiteSchema = getWebSiteSchema(settings);

  return (
    <>
      <CustomCursor />
      {/* Global ambient music — invisible player + minimal fixed toggle */}
      <AudioPlayer />
      <SoundToggle />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <div className="public-layout">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ClientLayout>
          <Navigation
            companyName={settings.company_name}
            ctaLabel={settings.nav_cta_label}
            ctaLink={settings.nav_cta_link}
          />
          {/* Active Campaign Announcement / Popup */}
          <CampaignDisplay campaign={activeCampaign} />
          <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
            {children}
          </main>
          <Footer
            companyName={settings.company_name}
            tagline={settings.footer_tagline || settings.company_tagline}
            email={settings.company_email}
            socials={{
              linkedin: settings.company_linkedin,
              twitter: settings.company_twitter,
              github: settings.company_github,
              instagram: settings.company_instagram,
              youtube: settings.company_youtube,
              facebook: settings.company_facebook,
            }}
            copyright={settings.footer_copyright}
          />
        </ClientLayout>
      </div>
    </>
  );
}
