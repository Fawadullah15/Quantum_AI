import React from 'react';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';
import { getSiteSettings } from '@/lib/settings';

export const metadata = createPageMetadata({
  title: 'Privacy Policy — Quantum AI Engineering Labs',
  description: 'Learn how Quantum AI collects, protects, processes, and retains your data across our engineering website, contact forms, candidate applications, and announcement telemetry.',
  path: '/privacy',
});

export const revalidate = 0;

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const companyName = settings.company_name || 'Quantum AI';
  const companyLegalName = settings.company_legal_name || 'Quantum AI Engineering Labs';
  const contactEmail = settings.company_email || 'hello@quantumai.dev';
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
        .badge-notice {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.65rem;
          background: rgba(20, 184, 166, 0.12);
          border: 1px solid rgba(20, 184, 166, 0.3);
          border-radius: 4px;
          font-family: var(--font-d-din);
          font-size: 0.75rem;
          color: #2DD4BF;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
      `}</style>

      <div className="legal-container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontFamily: 'var(--font-d-din)', color: 'rgba(255, 255, 255, 0.6)' }}>
            <Link href="/" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#14B8A6' }}>Privacy Policy</span>
          </div>
        </nav>

        {/* Header */}
        <header className="legal-header">
          <div className="legal-eyebrow">Data Governance & Compliance</div>
          <h1 className="legal-title">Privacy Policy</h1>
          <div className="legal-meta">
            <span><strong>Entity:</strong> {companyLegalName} ({companyName})</span>
            <span>•</span>
            <span><strong>Last Updated:</strong> {lastUpdated}</span>
            <span>•</span>
            <span><strong>Contact:</strong> <a href={`mailto:${routingEmail}`} style={{ color: '#14B8A6', textDecoration: 'none' }}>{routingEmail}</a></span>
          </div>
        </header>

        {/* Overview */}
        <div className="legal-section">
          <p>
            At <strong>{companyLegalName}</strong> (&ldquo;Quantum AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), we engineer advanced artificial intelligence systems, custom enterprise software platforms, and mission-critical cloud workflows. We are committed to processing all data with rigorous security, strict transparency, and full adherence to global privacy principles.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, store, protect, and handle personal information when you visit our website (<strong>quantumai.dev</strong>), interact with our technical showcases, communicate through our contact, careers, or partnership forms, or interact with our public announcement system.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="legal-section" id="data-collection">
          <h2><span className="section-num">01.</span> Information We Collect</h2>
          <p>
            We only collect personal information that you intentionally provide to us through our interactive communication channels, alongside minimal strictly necessary operational data required to deliver our web services:
          </p>

          <h3>A. Contact & Project Inquiries</h3>
          <p>
            When you transmit a project inquiry through our <Link href="/contact" style={{ color: '#14B8A6' }}>Contact Form</Link>, we collect:
          </p>
          <ul>
            <li><strong>Identification:</strong> Your full name and organization / company name.</li>
            <li><strong>Contact Details:</strong> Your professional email address and telephone number (optional).</li>
            <li><strong>Project Scope:</strong> Target timelines, budget range, selected service categories (AI Systems, Business Software, Automation, Digital Products), and transmitted technical project specifications.</li>
          </ul>

          <h3>B. Career & Employment Applications</h3>
          <p>
            When applying for engineering, design, or operational positions through our <Link href="/careers-partnerships" style={{ color: '#14B8A6' }}>Careers & Partnerships Portal</Link>, we collect:
          </p>
          <ul>
            <li><strong>Personal Details:</strong> Full name, personal email address, phone number, and current location.</li>
            <li><strong>Professional Background:</strong> Desired engineering role, years of relevant experience, GitHub profile URL, LinkedIn profile URL, and personal portfolio links.</li>
            <li><strong>Application Materials:</strong> Resumes, CVs, cover letters, technical writing, and attached candidate documentation.</li>
          </ul>

          <h3>C. Strategic Partnership Proposals</h3>
          <p>
            When organizations submit collaboration or enterprise research briefs, we collect representative contact information, organization credentials, proposed collaboration frameworks, and attached partnership decks.
          </p>
        </section>

        {/* Section 2: Purpose and Legal Basis */}
        <section className="legal-section" id="purpose-processing">
          <h2><span className="section-num">02.</span> Why We Process Your Data</h2>
          <p>
            Every data field collected by Quantum AI serves a legitimate technical or operational purpose:
          </p>
          <ul>
            <li><strong>Project Evaluation & Technical Scoping:</strong> Reviewing incoming system requests to analyze architectural feasibility, prepare technical proposals, and respond to your direct queries.</li>
            <li><strong>Candidate Assessment & Recruitment:</strong> Evaluating applicant qualifications, assessing technical aptitude, conducting engineering interviews, and administering hiring workflows.</li>
            <li><strong>System Security & Abuse Prevention:</strong> Verifying submission legitimacy, preventing automated form spam, protecting against denial-of-service attempts, and maintaining server integrity.</li>
            <li><strong>Direct Communications:</strong> Transmitting project updates, responding to candidate inquiries, and delivering administrative notifications.</li>
          </ul>
          <p>
            We do not sell, rent, monetize, or trade your personal information. We never conduct third-party behavioral profiling or sell contact records to marketing brokers.
          </p>
        </section>

        {/* Section 3: Data Storage & Transmission Pipeline */}
        <section className="legal-section" id="storage-transmission">
          <h2><span className="section-num">03.</span> Storage, Notifications & Secure File Pipeline</h2>
          <p>
            When you submit information to Quantum AI, it is processed through a hardened backend architecture:
          </p>

          <div className="legal-card">
            <div className="legal-card-title">Database Storage & Prisma ORM</div>
            <p>
              Submission records are validated server-side using strict Zod schemas and persisted in an isolated Neon Serverless PostgreSQL database utilizing encrypted connections (TLS 1.3) and parameterized queries via Prisma ORM.
            </p>
          </div>

          <div className="legal-card">
            <div className="legal-card-title">Administrative Notifications</div>
            <p>
              Form submissions generate instant audit notification entries inside our password-protected administrative portal. Furthermore, automated dispatch triggers send transactional notification emails to authorized Quantum AI engineering staff via trusted enterprise mail relays (Resend / transactional SMTP).
            </p>
          </div>

          <div className="legal-card">
            <div className="legal-card-title">Candidate Attachment Security Pipeline</div>
            <p>
              Candidate resumes, portfolios, and partnership pitch decks are saved exclusively through our private storage pipeline (<code>savePrivateFile</code>). Files are isolated in private cloud bucket storage and restricted from public web indexing or directory listing. Candidate documents are served strictly through an authenticated proxy endpoint (<code>/api/admin/files/download</code>) that requires a verified Quantum AI administrative session.
            </p>
          </div>
        </section>

        {/* Section 4: Hosting & Infrastructure Providers */}
        <section className="legal-section" id="infrastructure-providers">
          <h2><span className="section-num">04.</span> Hosting, Database & Infrastructure Providers</h2>
          <p>
            To deliver global performance and resilience, Quantum AI utilizes vetted, enterprise-grade infrastructure providers:
          </p>
          <ul>
            <li><strong>Application Hosting & Edge Routing:</strong> Vercel Inc. (Global edge compute, serverless API execution, TLS termination).</li>
            <li><strong>Production Database:</strong> Neon Inc. (Serverless PostgreSQL with continuous encryption at rest and in transit).</li>
            <li><strong>File Storage Services:</strong> Vercel Blob / Cloud Storage (Private storage buckets for candidate resumes and private attachments; public buckets strictly for published announcement media creatives).</li>
            <li><strong>Static Asset Delivery:</strong> Static videos (such as the Mars hero background fallback) are served via Microsoft Azure Edge CDN (<code>https://sxcontent9668.azureedge.us</code>). No user cookies or tracking scripts are loaded through this static media delivery route.</li>
          </ul>
        </section>

        {/* Section 5: Browser Storage & Announcement Preferences */}
        <section className="legal-section" id="browser-storage">
          <h2><span className="section-num">05.</span> Browser Storage, Cookies & Telemetry</h2>
          <p>
            Our website utilizes minimal local storage keys and first-party cookies to operate functional components and respect your interaction choices:
          </p>
          <ul>
            <li><strong>Consent Record (<code>qa_cookie_consent</code>):</strong> Stores your chosen privacy preferences (Strictly Necessary, Analytics, Marketing) for 365 days in localStorage and a first-party cookie.</li>
            <li><strong>Announcement Delivery (<code>qa_cmp_*</code>, <code>qa_cmp_seen_*</code>):</strong> Remembers when you have dismissed or viewed a promotional announcement or campaign popup, enforcing cooldown periods and preventing intrusive repeat popups.</li>
            <li><strong>Interface Audio (<code>qa_sound_prompt_seen</code>):</strong> Records whether you have interacted with our ambient sound experience prompt.</li>
            <li><strong>Administrative Sessions (<code>next-auth.session-token</code>):</strong> Encrypted HTTP-only cookies utilized strictly by authorized Quantum AI staff to access the administrative dashboard.</li>
          </ul>

          <div className="legal-card">
            <div className="badge-notice">Privacy First Telemetry</div>
            <p>
              Our public announcement telemetry endpoint (<code>/api/campaigns/track</code>) measures aggregated, anonymous impression and click counts for published campaigns. <strong>This telemetry is strictly gated behind your consent for the &ldquo;Performance &amp; Analytics&rdquo; category.</strong> If you decline or have not granted analytics consent, no telemetry requests are transmitted.
            </p>
          </div>

          <p>
            For a comprehensive breakdown of all storage keys, lifetimes, and to adjust your preferences at any time, please visit our <Link href="/cookies" style={{ color: '#14B8A6' }}>Cookie Policy</Link>.
          </p>
        </section>

        {/* Section 6: Data Retention & User Rights */}
        <section className="legal-section" id="retention-rights">
          <h2><span className="section-num">06.</span> Data Retention & Your Rights</h2>
          <p>
            We retain personal information only for as long as necessary to fulfill the purposes for which it was collected:
          </p>
          <ul>
            <li><strong>Project Inquiries:</strong> Retained for the duration of the commercial engagement or up to 24 months after the last active communication for historical project context.</li>
            <li><strong>Career Applications:</strong> Retained during the hiring cycle and up to 12 months for prospective future engineering openings, unless you request earlier deletion.</li>
            <li><strong>Administrative Logs:</strong> Retained for up to 90 days for cybersecurity monitoring and system auditing.</li>
          </ul>

          <h3>Your Privacy Rights</h3>
          <p>
            Under applicable data protection laws (including GDPR, UK GDPR, and CCPA), you have the right to:
          </p>
          <ul>
            <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you.</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete personal data.</li>
            <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Request the permanent deletion of your contact records, applications, or resumes.</li>
            <li><strong>Right to Restrict Processing:</strong> Request that we limit the processing of your data under specific conditions.</li>
            <li><strong>Right to Data Portability:</strong> Request transmission of your data in a structured, machine-readable format.</li>
            <li><strong>Right to Withdraw Consent:</strong> Revoke any previously granted consent (such as analytics consent) at any time through our Cookie Settings.</li>
          </ul>
          <p>
            To exercise any of these rights, please email us directly at <a href={`mailto:${routingEmail}`} style={{ color: '#14B8A6' }}>{routingEmail}</a> or <a href={`mailto:${contactEmail}`} style={{ color: '#14B8A6' }}>{contactEmail}</a>. We respond to all verified requests within thirty (30) days without charge.
          </p>
        </section>

        {/* Section 7: International Data Transfers & Security */}
        <section className="legal-section" id="security-transfers">
          <h2><span className="section-num">07.</span> Data Security & International Transfers</h2>
          <p>
            We enforce multi-layered security controls to protect your data against unauthorized access, loss, or alteration:
          </p>
          <ul>
            <li><strong>Encryption:</strong> All website traffic is encrypted in transit using TLS 1.3. Databases and cloud file storage are encrypted at rest with industry-standard AES-256.</li>
            <li><strong>Access Controls:</strong> Administrative endpoints are protected with session tokens, strict role validation, and CSRF defense mechanisms.</li>
            <li><strong>Isolated Uploads:</strong> User-submitted attachments are validated for MIME type, file size (maximum 15MB), and stored in segregated private buckets.</li>
          </ul>
          <p>
            Because our cloud infrastructure providers maintain globally distributed networks, data may be hosted in and transferred between data centers in the United States and the European Union. We ensure that our infrastructure partners adhere to recognized international data transfer mechanisms, including Standard Contractual Clauses (SCCs).
          </p>
        </section>

        {/* Section 8: Policy Updates & Corporate Notices */}
        <section className="legal-section" id="policy-updates">
          <h2><span className="section-num">08.</span> Policy Updates & Contact Details</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect operational, technological, or legal developments. When changes are published, we will update the &ldquo;Last Updated&rdquo; date at the top of this document. For material modifications, we will post a prominent notification on our website.
          </p>

          <div className="legal-card">
            <div className="legal-card-title">Corporate Contact & Inquiries</div>
            <p>
              For privacy inquiries, data deletion requests, or questions regarding our data practices:
            </p>
            <p style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>{companyLegalName}</strong><br />
              Email: <a href={`mailto:${routingEmail}`} style={{ color: '#14B8A6' }}>{routingEmail}</a> / <a href={`mailto:${contactEmail}`} style={{ color: '#14B8A6' }}>{contactEmail}</a><br />
              Website: <Link href="/" style={{ color: '#14B8A6' }}>https://quantumai.dev</Link><br />
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '0.35rem', display: 'inline-block' }}>
                Note: Registered statutory corporate filing numbers and official registered agent records will be published upon conclusion of formal corporate filings by legal counsel.
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
