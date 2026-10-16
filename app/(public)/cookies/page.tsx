import React from 'react';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';
import { getSiteSettings } from '@/lib/settings';
import { CookieSettingsTrigger } from '@/components/public/CookieSettingsTrigger';

export const metadata = createPageMetadata({
  title: 'Cookie & Storage Policy — Quantum AI Engineering Labs',
  description: 'Detailed disclosure of cookies, local storage keys, session preferences, and anonymous announcement telemetry used on the Quantum AI website.',
  path: '/cookies',
});

export const revalidate = 0;

export default async function CookiePolicyPage() {
  const settings = await getSiteSettings();
  const companyName = settings.company_name || 'Quantum AI';
  const companyLegalName = settings.company_legal_name || 'Quantum AI Engineering Labs';
  const routingEmail = settings.company_routing_email || 'contact@quantumai.dev';
  const lastUpdated = 'October 16, 2026';

  return (
    <div className="legal-page">
      <style>{`
        .legal-page {
          padding-top: calc(var(--nav-height, 72px) + 2.5rem);
          padding-bottom: 5rem;
          padding-inline: clamp(1.25rem, 5vw, 4rem);
          min-height: 100vh;
          background: var(--color-void, #030712);
          position: relative;
          color: #FFFFFF;
        }
        .legal-page::before {
          content: "";
          position: fixed;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 80vw; height: 50vh;
          background: radial-gradient(ellipse at top, rgba(20, 184, 166, 0.07) 0%, rgba(15, 23, 42, 0.03) 50%, transparent 75%);
          pointer-events: none;
          z-index: 0;
        }
        .legal-container {
          max-width: 920px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .legal-header {
          margin-bottom: 3rem;
          border-bottom: 1px solid rgba(20, 184, 166, 0.15);
          padding-bottom: 2rem;
        }
        .legal-eyebrow {
          font-family: var(--font-d-din);
          font-size: 0.75rem;
          letter-spacing: 0.25em;
          color: #14B8A6;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .legal-title {
          font-family: var(--font-sans);
          font-size: clamp(2.25rem, 4.5vw, 3.5rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.1;
          color: #FFFFFF;
          margin: 0 0 1rem 0;
        }
        .legal-meta {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-family: var(--font-d-din);
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.7);
          flex-wrap: wrap;
        }
        .legal-section {
          margin-bottom: 2.75rem;
        }
        .legal-section h2 {
          font-family: var(--font-sans);
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.015em;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }
        .legal-section h2 span.section-num {
          font-family: var(--font-d-din);
          font-size: 0.9rem;
          color: #14B8A6;
          font-weight: 600;
          letter-spacing: 0.1em;
        }
        .legal-section h3 {
          font-family: var(--font-sans);
          font-size: 1.125rem;
          font-weight: 600;
          color: #FFFFFF;
          margin: 1.5rem 0 0.5rem 0;
        }
        .legal-section p {
          font-family: var(--font-sans);
          font-size: 0.9375rem;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.82);
          margin: 0 0 1rem 0;
        }
        .legal-section ul {
          margin: 0 0 1.25rem 0;
          padding-left: 1.5rem;
          color: rgba(255, 255, 255, 0.82);
          font-size: 0.9375rem;
          line-height: 1.75;
        }
        .legal-section li {
          margin-bottom: 0.5rem;
        }
        .legal-table-wrap {
          overflow-x: auto;
          margin: 1.5rem 0;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.4);
        }
        .legal-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          text-align: left;
        }
        .legal-table th {
          background: rgba(20, 184, 166, 0.08);
          color: #14B8A6;
          font-family: var(--font-d-din);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(20, 184, 166, 0.2);
        }
        .legal-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.85);
          vertical-align: top;
          line-height: 1.55;
        }
        .legal-table tr:last-child td {
          border-bottom: none;
        }
        .badge-cat {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-family: var(--font-d-din);
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .badge-necessary {
          background: rgba(20, 184, 166, 0.15);
          color: #14B8A6;
          border: 1px solid rgba(20, 184, 166, 0.3);
        }
        .badge-functional {
          background: rgba(59, 130, 246, 0.15);
          color: #60A5FA;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .badge-analytics {
          background: rgba(245, 158, 11, 0.15);
          color: #FBBF24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .legal-card {
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 1.25rem 1.5rem;
          margin: 1.25rem 0;
        }
        .legal-card-title {
          font-family: var(--font-sans);
          font-size: 0.9375rem;
          font-weight: 600;
          color: #14B8A6;
          margin-bottom: 0.4rem;
        }
        .legal-card p {
          margin-bottom: 0;
          font-size: 0.875rem;
        }
      `}</style>

      <div className="legal-container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontFamily: 'var(--font-d-din)', color: 'rgba(255, 255, 255, 0.6)' }}>
            <Link href="/" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#14B8A6' }}>Cookie Policy</span>
          </div>
        </nav>

        {/* Header */}
        <header className="legal-header">
          <div className="legal-eyebrow">Transparency & Browser Storage</div>
          <h1 className="legal-title">Cookie &amp; Storage Policy</h1>
          <div className="legal-meta">
            <span><strong>Entity:</strong> {companyLegalName} ({companyName})</span>
            <span>•</span>
            <span><strong>Last Updated:</strong> {lastUpdated}</span>
            <span>•</span>
            <span><strong>Contact:</strong> <a href={`mailto:${routingEmail}`} style={{ color: '#14B8A6', textDecoration: 'none' }}>{routingEmail}</a></span>
          </div>
        </header>

        {/* Overview & Quick Interactive Control */}
        <div className="legal-section">
          <p>
            This Cookie &amp; Storage Policy provides a transparent, code-verified audit of every cookie, web storage key (<code>localStorage</code>, <code>sessionStorage</code>), and telemetry transmission utilized on the <strong>{companyLegalName}</strong> website.
          </p>
          <p>
            Unlike typical consumer websites, Quantum AI does <strong>not</strong> install third-party tracking networks, social media surveillance pixels (such as Meta Pixel), cross-site advertising identifiers, or invasive session recording tools (such as Hotjar). Every technology we use is strictly necessary for web functionality, security, user preferences, or anonymous first-party announcement measurements.
          </p>

          <div className="legal-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'rgba(20, 184, 166, 0.05)', borderColor: 'rgba(20, 184, 166, 0.25)' }}>
            <div>
              <div className="legal-card-title">Manage Your Preferences</div>
              <p>You can review and adjust your cookie preferences at any time.</p>
            </div>
            <CookieSettingsTrigger label="Open Cookie Settings" />
          </div>
        </div>

        {/* Section 1: Categories of Storage */}
        <section className="legal-section" id="storage-categories">
          <h2><span className="section-num">01.</span> Storage Categories Explained</h2>
          <p>
            We organize our browser storage technologies into three distinct categories:
          </p>
          <ul>
            <li>
              <strong>1. Strictly Necessary Storage:</strong> Essential for cybersecurity, CSRF defense, administrative authentication, remembering your cookie consent selections, and basic website stability. These cannot be disabled.
            </li>
            <li>
              <strong>2. Functional Delivery Storage:</strong> First-party keys stored locally in your browser to remember dismissals of announcements (preventing annoying repeat popups), countdown timers, and ambient sound player states.
            </li>
            <li>
              <strong>3. Performance &amp; Analytics Telemetry:</strong> First-party anonymous metrics that count announcement impressions and clicks (<code>/api/campaigns/track</code>). This telemetry is strictly gated behind your consent and is disabled by default until you opt in.
            </li>
          </ul>
        </section>

        {/* Section 2: Complete Code-Verified Inventory */}
        <section className="legal-section" id="storage-inventory">
          <h2><span className="section-num">02.</span> Complete Verified Inventory</h2>
          <p>
            The table below documents every confirmed cookie and storage key currently implemented in the Quantum AI website codebase:
          </p>

          <div className="legal-table-wrap">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Identifier / Key</th>
                  <th>Technology</th>
                  <th>Category</th>
                  <th>Lifespan</th>
                  <th>Technical Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>qa_cookie_consent</code></td>
                  <td>localStorage &amp; 1st-party Cookie</td>
                  <td><span className="badge-cat badge-necessary">Necessary</span></td>
                  <td>365 Days</td>
                  <td>Records your categorized consent selections (Necessary, Analytics, Marketing) and selection timestamp.</td>
                </tr>
                <tr>
                  <td>
                    <code>next-auth.session-token</code><br />
                    <small style={{ color: 'rgba(255,255,255,0.5)' }}>__Secure-next-auth.session-token (prod)</small>
                  </td>
                  <td>HTTP-only Cookie</td>
                  <td><span className="badge-cat badge-necessary">Necessary</span></td>
                  <td>30 Days</td>
                  <td>Encrypted JSON Web Token (JWT) securing authenticated administrative sessions for the <code>/admin</code> panel.</td>
                </tr>
                <tr>
                  <td>
                    <code>next-auth.csrf-token</code><br />
                    <small style={{ color: 'rgba(255,255,255,0.5)' }}>__Host-next-auth.csrf-token (prod)</small>
                  </td>
                  <td>HTTP-only Cookie</td>
                  <td><span className="badge-cat badge-necessary">Necessary</span></td>
                  <td>Session</td>
                  <td>Cryptographic anti-forgery token protecting administrative login forms and API actions against Cross-Site Request Forgery (CSRF).</td>
                </tr>
                <tr>
                  <td><code>qa_cmp_{'{id}'}_{'{version}'}</code></td>
                  <td>sessionStorage or localStorage</td>
                  <td><span className="badge-cat badge-functional">Functional</span></td>
                  <td>Session or Version change</td>
                  <td>Remembers when an announcement or advertisement popup has been dismissed so it does not repeat intrusively.</td>
                </tr>
                <tr>
                  <td><code>qa_cmp_seen_{'{id}'}</code></td>
                  <td>localStorage</td>
                  <td><span className="badge-cat badge-functional">Functional</span></td>
                  <td>Cooldown window (e.g. 24h)</td>
                  <td>Enforces admin-configured cooldown intervals between announcement presentations.</td>
                </tr>
                <tr>
                  <td><code>qa_sound_prompt_seen</code></td>
                  <td>sessionStorage</td>
                  <td><span className="badge-cat badge-functional">Functional</span></td>
                  <td>Browser Session</td>
                  <td>Remembers if the visitor has already interacted with the ambient soundtrack toggle to avoid re-triggering prompt banners.</td>
                </tr>
                <tr>
                  <td><code>qa_welcome_seen</code> / <code>hasLoaded</code></td>
                  <td>sessionStorage</td>
                  <td><span className="badge-cat badge-functional">Functional</span></td>
                  <td>Browser Session</td>
                  <td>Ensures initial hero entrance animations only execute once per browser session.</td>
                </tr>
                <tr>
                  <td><code>/api/campaigns/track</code></td>
                  <td>First-Party Telemetry API</td>
                  <td><span className="badge-cat badge-analytics">Analytics (Gated)</span></td>
                  <td>Ephemeral transmission</td>
                  <td>Anonymous impression and interaction counter for engineering announcements. Gated behind visitor consent for Analytics.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Third-Party Resources & CDNs */}
        <section className="legal-section" id="external-resources">
          <h2><span className="section-num">03.</span> External Resources &amp; CDNs</h2>
          <p>
            We inspect every external resource to ensure no undisclosed trackers are loaded into your session:
          </p>
          <ul>
            <li>
              <strong>Static Video Delivery (Azure Edge CDN):</strong> The Mars planetary background video uses Microsoft Azure Edge CDN (<code>https://sxcontent9668.azureedge.us</code>) strictly as a high-bandwidth static media fallback. No cookies, trackers, or marketing pixels are placed or retrieved by this CDN.
            </li>
            <li>
              <strong>No Third-Party Analytics Trackers:</strong> Quantum AI does not embed Google Analytics (ga.js / gtag.js), Meta Pixel, TikTok Pixel, or Hotjar scripts anywhere in the application.
            </li>
            <li>
              <strong>No Advertising Networks:</strong> We do not participate in third-party advertising exchanges, programmatic bidding networks, or data broker sharing.
            </li>
          </ul>
        </section>

        {/* Section 4: How to Manage and Revoke Consent */}
        <section className="legal-section" id="manage-consent">
          <h2><span className="section-num">04.</span> How to Manage &amp; Revoke Choices</h2>
          <p>
            You have full control over your storage preferences:
          </p>
          <ul>
            <li>
              <strong>Via Quantum AI Cookie Settings:</strong> Click the &ldquo;Cookie Settings&rdquo; link in the website footer or the interactive button above at any time to open the preference dialog and enable or disable optional storage categories.
            </li>
            <li>
              <strong>Via Your Web Browser:</strong> Most modern browsers allow you to view, block, or delete cookies and web storage through their settings menu (Settings &rarr; Privacy &amp; Security &rarr; Cookies and site data). Please note that blocking strictly necessary cookies will prevent authorized administrative login.
            </li>
          </ul>
        </section>

        {/* Section 5: Inquiries & Contact */}
        <section className="legal-section" id="cookie-inquiries">
          <h2><span className="section-num">05.</span> Inquiries &amp; Legal Notices</h2>
          <div className="legal-card">
            <div className="legal-card-title">Questions Concerning Browser Storage</div>
            <p>
              If you have technical questions regarding our cookie implementation or wish to submit an inquiry:
            </p>
            <p style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>{companyLegalName}</strong><br />
              Email: <a href={`mailto:${routingEmail}`} style={{ color: '#14B8A6' }}>{routingEmail}</a><br />
              Website: <Link href="/" style={{ color: '#14B8A6' }}>https://quantumai.dev</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
