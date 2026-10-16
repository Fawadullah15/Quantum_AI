import React from 'react';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';
import { getSiteSettings } from '@/lib/settings';

export const metadata = createPageMetadata({
  title: 'Terms & Conditions — Quantum AI Engineering Labs',
  description: 'Terms and conditions governing the use of the Quantum AI website, public technical materials, AI demonstrations, and our commercial engagement frameworks.',
  path: '/terms',
});

export const revalidate = 0;

export default async function TermsAndConditionsPage() {
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
        .highlight-box {
          background: rgba(20, 184, 166, 0.08);
          border-left: 3px solid #14B8A6;
          padding: 1.25rem 1.5rem;
          border-radius: 0 8px 8px 0;
          margin: 1.5rem 0;
        }
        .highlight-box p {
          color: #FFFFFF;
          font-size: 0.9375rem;
          line-height: 1.7;
          margin: 0;
        }
      `}</style>

      <div className="legal-container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontFamily: 'var(--font-d-din)', color: 'rgba(255, 255, 255, 0.6)' }}>
            <Link href="/" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#14B8A6' }}>Terms &amp; Conditions</span>
          </div>
        </nav>

        {/* Header */}
        <header className="legal-header">
          <div className="legal-eyebrow">Legal Framework & Terms of Service</div>
          <h1 className="legal-title">Terms &amp; Conditions</h1>
          <div className="legal-meta">
            <span><strong>Entity:</strong> {companyLegalName} ({companyName})</span>
            <span>•</span>
            <span><strong>Effective Date:</strong> {lastUpdated}</span>
            <span>•</span>
            <span><strong>Contact:</strong> <a href={`mailto:${routingEmail}`} style={{ color: '#14B8A6', textDecoration: 'none' }}>{routingEmail}</a></span>
          </div>
        </header>

        {/* Overview */}
        <div className="legal-section">
          <p>
            Welcome to the official web platform of <strong>{companyLegalName}</strong> (&ldquo;Quantum AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of our public website located at <strong>quantumai.dev</strong>, including all technical architectures, content, software showcases, public announcements, and digital services displayed on the site.
          </p>
          <p>
            By accessing or browsing this website, you acknowledge that you have read, understood, and agreed to be bound by these Terms. If you do not agree to these Terms, you must discontinue using our website.
          </p>
        </div>

        {/* Section 1: Commercial Engagements vs Website Terms */}
        <section className="legal-section" id="commercial-distinction">
          <h2><span className="section-num">01.</span> Public Website vs. Commercial Client Engagements</h2>
          <div className="highlight-box">
            <p>
              <strong>IMPORTANT NOTICE:</strong> This website document governs public website use only and is NOT a substitute for a signed client agreement. All engineering engagements, software development projects, technical consultations, pricing structures, milestones, warranties, and intellectual property transfers are governed exclusively by a separate, bilaterally executed Master Services Agreement (MSA), Statement of Work (SOW), or formal client proposal.
            </p>
          </div>
          <p>
            Nothing on this website shall be construed as a binding commercial offer, unilateral warranty, or formal engineering guarantee. Formal commitments regarding system delivery, code ownership, service-level agreements (SLAs), uptime metrics, and technical deliverables take effect only upon mutual execution of a formal written contract.
          </p>
        </section>

        {/* Section 2: Acceptable Use Policy */}
        <section className="legal-section" id="acceptable-use">
          <h2><span className="section-num">02.</span> Acceptable Website Use</h2>
          <p>
            You agree to use our website only for lawful purposes and in accordance with these Terms. You specifically agree not to:
          </p>
          <ul>
            <li><strong>Automated Scraping & Probing:</strong> Use automated bots, spiders, scrapers, or programmatic tools to harvest content, database entries, or API endpoints without prior written authorization.</li>
            <li><strong>Security Probing & Attacks:</strong> Probe, scan, or test the vulnerability of our application, server infrastructure, or private file storage, or attempt to circumvent authentication mechanisms.</li>
            <li><strong>Denial of Service:</strong> Engage in activities that degrade, disrupt, or impair server availability, network bandwidth, or website responsiveness for other visitors.</li>
            <li><strong>Malicious Code:</strong> Upload or transmit any files containing viruses, trojans, worms, logic bombs, or other malicious code.</li>
            <li><strong>Impersonation:</strong> Misrepresent your identity, affiliation, or authority when submitting inquiries through our contact, careers, or partnership portals.</li>
          </ul>
        </section>

        {/* Section 3: Intellectual Property & Permitted Use */}
        <section className="legal-section" id="intellectual-property">
          <h2><span className="section-num">03.</span> Intellectual Property & Ownership</h2>
          <p>
            All content, features, code, algorithms, visual designs, typography, 3D interactive graphics, audio tracks, brand identity, logos, and materials on this website are the proprietary property of <strong>{companyLegalName}</strong> or its licensors and are protected by applicable copyright, trademark, trade secret, and intellectual property laws.
          </p>
          <h3>Permitted Use</h3>
          <p>
            You are granted a limited, revocable, non-exclusive, non-transferable license to browse this website and review our engineering case studies and technical materials for internal evaluation and informational purposes. You may not reproduce, distribute, modify, create derivative works of, publicly display, or commercially exploit any material from this website without explicit prior written authorization from Quantum AI.
          </p>
        </section>

        {/* Section 4: AI Systems & Technical Demonstrations */}
        <section className="legal-section" id="ai-accuracy-disclaimer">
          <h2><span className="section-num">04.</span> AI Demonstrations & Technical Accuracy</h2>
          <p>
            Quantum AI designs and engineers advanced artificial intelligence models, autonomous workflows, and custom enterprise software. On this website, we present architectural designs, research overviews, and interactive demonstrations:
          </p>
          <div className="legal-card">
            <div className="legal-card-title">Requirement to Validate AI-Generated Outputs</div>
            <p>
              AI-generated code, architectural previews, natural language summaries, and automated responses provided through our public demonstrations are experimental and provided for conceptual illustration. <strong>You must independently review, test, validate, and audit all AI-generated technical work and outputs prior to relying on them or deploying them into commercial, mission-critical, or production environments.</strong>
            </p>
          </div>
          <p>
            While we strive for technical precision, we do not warrant that website demonstrations, architectural diagrams, or case study metrics represent guaranteed outcomes for every unique business environment or dataset.
          </p>
        </section>

        {/* Section 5: Third-Party Links & Resources */}
        <section className="legal-section" id="third-party-links">
          <h2><span className="section-num">05.</span> External Links & Third-Party Services</h2>
          <p>
            Our website may contain links to external third-party websites, research repositories, GitHub projects, or documentation portals. These links are provided solely for your convenience. We do not control, endorse, or assume responsibility for the content, security practices, privacy policies, or availability of third-party platforms. Accessing third-party resources is done entirely at your own risk.
          </p>
        </section>

        {/* Section 6: Disclaimer of Warranties */}
        <section className="legal-section" id="disclaimer-warranties">
          <h2><span className="section-num">06.</span> Disclaimer of Warranties</h2>
          <p>
            THIS WEBSITE, ITS CONTENTS, AND ALL TECHNICAL DEMONSTRATIONS ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, QUANTUM AI DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
          </p>
          <p>
            QUANTUM AI DOES NOT WARRANT THAT THE WEBSITE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, NOR THAT DEFECTS WILL BE IMMEDIATELY CORRECTED.
          </p>
        </section>

        {/* Section 7: Limitation of Liability */}
        <section className="legal-section" id="limitation-liability">
          <h2><span className="section-num">07.</span> Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL QUANTUM AI, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA LOSS, BUSINESS INTERRUPTION, LOSS OF GOODWILL, OR SYSTEM DOWNTIME ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THIS WEBSITE OR ITS TECHNICAL DEMONSTRATIONS.
          </p>
          <p>
            IN JURISDICTIONS THAT DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN WARRANTIES OR LIABILITIES, QUANTUM AI&rsquo;S AGGREGATE LIABILITY SHALL BE LIMITED TO THE GREATEST EXTENT PERMITTED BY LAW, NOT TO EXCEED ONE HUNDRED US DOLLARS ($100.00 USD).
          </p>
        </section>

        {/* Section 8: Indemnification */}
        <section className="legal-section" id="indemnification">
          <h2><span className="section-num">08.</span> Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Quantum AI, its officers, directors, contractors, and employees from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&rsquo; fees) arising out of or relating to your violation of these Terms or your unauthorized use of website resources.
          </p>
        </section>

        {/* Section 9: Governing Law & Modifications */}
        <section className="legal-section" id="governing-law">
          <h2><span className="section-num">09.</span> Governing Law & Modifications</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable general commercial principles and the laws of the jurisdiction in which Quantum AI maintains its principal operations, without regard to conflict of law provisions.
          </p>
          <p>
            We reserve the right to revise and update these Terms at any time. All revisions are effective immediately when posted. Your continued use of the website following the posting of revised Terms signifies your acceptance of the changes.
          </p>

          <div className="legal-card">
            <div className="legal-card-title">Questions &amp; Contact</div>
            <p>
              If you have any questions concerning these Terms &amp; Conditions or wish to discuss commercial software engineering engagements:
            </p>
            <p style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>{companyLegalName}</strong><br />
              Email: <a href={`mailto:${routingEmail}`} style={{ color: '#14B8A6' }}>{routingEmail}</a> / <a href={`mailto:${contactEmail}`} style={{ color: '#14B8A6' }}>{contactEmail}</a><br />
              Website: <Link href="/" style={{ color: '#14B8A6' }}>https://quantumai.dev</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
