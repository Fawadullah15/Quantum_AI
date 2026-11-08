import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'About Quantum AI — AI, Software Engineering & Industrial Technology',
  description: 'Quantum AI is an AI and software engineering company. Learn what we build, who we serve, and the business and industrial problems we solve.',
  path: '/about',
});

const principles = [
  {
    num: "01",
    title: ["Understand", "First."],
    body: "Study how your operations work before writing any code. Understanding how your business actually runs lets us build direct, effective software without unnecessary complexity.",
  },
  {
    num: "02",
    title: ["Build", "Smarter."],
    body: "Choose technology for business value, not hype. Every database, integration, and AI workflow we build has a clear practical purpose.",
  },
  {
    num: "03",
    title: ["Keep", "It Usable."],
    body: "Powerful systems must be easy for everyday staff to use. We turn complex business and technical rules into clean, simple screens.",
  },
  {
    num: "04",
    title: ["Create", "What Lasts."],
    body: "Build reliable systems that grow with your organization, from engineering tools and offline point-of-sale systems to AI-driven workflows.",
  },
];

const capabilities = [
  {
    title: "AI Systems",
    desc: "AI assistants and agents, document search, and tools that support technical and business decisions.",
  },
  {
    title: "Business Software",
    desc: "Manufacturing, production, inventory, and business management software, including ERP and CRM systems.",
  },
  {
    title: "Automation",
    desc: "Automated workflows and system connections that replace repetitive manual work.",
  },
  {
    title: "Digital Products",
    desc: "SaaS platforms, web applications, and custom software products.",
  },
];

export default function AboutPage() {
  return (
    <>
      <style>{`
        .abt-page {
          padding-top: calc(var(--nav-height, 72px) + 2rem);
          padding-bottom: 4.5rem;
          padding-inline: clamp(1.25rem, 5vw, 4rem);
          min-height: 100vh;
          background: var(--color-void, #030712);
          position: relative;
          overflow-x: hidden;
        }
        .abt-page::before {
          content: "";
          position: fixed;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 80vw; height: 55vh;
          background: radial-gradient(ellipse at top, rgba(37,99,235,0.05) 0%, rgba(79,70,229,0.025) 45%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .abt-inner { max-width: 1000px; margin: 0 auto; position: relative; z-index: 1; }
        .abt-eyebrow { font-family: var(--font-d-din); font-size: 0.72rem; letter-spacing: 0.25em; color: #FFFFFF; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600; }
        .abt-h1 { font-size: clamp(2.5rem, 5vw, 4.25rem); font-weight: 700; line-height: 1.02; letter-spacing: -0.035em; color: #FFFFFF; text-transform: uppercase; margin-bottom: 0.75rem; }
        .abt-lead { font-size: clamp(0.95rem, 1.2vw, 1.125rem); color: #FFFFFF; max-width: 680px; line-height: 1.65; margin-bottom: 2.5rem; font-weight: 300; }
        
        .abt-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
          margin-bottom: 3.5rem;
        }
        .abt-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.16);
          border-radius: 10px;
          padding: 1.35rem;
        }
        .abt-card h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #FFFFFF;
          margin: 0 0 0.5rem 0;
        }
        .abt-card p {
          color: #FFFFFF;
          font-size: 0.875rem;
          line-height: 1.6;
          margin: 0;
          font-weight: 300;
        }

        .abt-principles-header { font-family: var(--font-d-din); font-size: 0.68rem; letter-spacing: 0.2em; color: #FFFFFF; text-transform: uppercase; padding-bottom: 1.25rem; border-bottom: 1px solid rgba(30,58,138,0.22); margin-bottom: 0; }
        .principle { padding: 1.75rem 0; border-bottom: 1px solid rgba(30,58,138,0.22); display: grid; grid-template-columns: 60px 1fr 1.2fr; gap: 1.5rem; align-items: start; transition: border-bottom-color 0.3s; cursor: default; }
        .principle:hover { border-bottom-color: rgba(37,99,235,0.38); }
        @media (max-width: 640px) { .principle { grid-template-columns: 44px 1fr; } .principle-body { grid-column: 1 / -1; } }
        .principle-num { font-family: var(--font-d-din); font-size: 0.75rem; color: #334155; letter-spacing: 0.08em; padding-top: 0.25rem; transition: color 0.3s; }
        .principle:hover .principle-num { color: #FFFFFF; }
        .principle-title { font-size: clamp(1.2rem, 2vw, 1.55rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; color: #FFFFFF; }
        .principle-title span { display: block; }
        .principle-body { font-size: 0.875rem; color: #FFFFFF; line-height: 1.65; max-width: 540px; padding-top: 0.25rem; transition: color 0.3s; font-weight: 300; }
        .principle:hover .principle-body { color: #FFFFFF; }
      `}</style>
      <div className="abt-page">
        <div className="abt-inner">
          <section style={{ marginBottom: '2.5rem' }}>
            <p className="abt-eyebrow">[00 — ABOUT QUANTUM AI]</p>
            <h1 className="abt-h1">AI &amp; Software<br />For Industry &amp; Business.</h1>
            <p className="abt-lead">
              Quantum AI is an AI and software engineering company. We build custom software, business automation, and AI systems for manufacturers, engineering firms, established businesses, and technology companies.
            </p>
          </section>

          {/* What We Build Section */}
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.85rem', fontWeight: 600 }}>
              [01 — WHAT WE BUILD]
            </div>
            <div className="abt-grid-2">
              {capabilities.map((cap) => (
                <div key={cap.title} className="abt-card">
                  <h3>{cap.title}</h3>
                  <p>{cap.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Who We Help Section */}
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.85rem', fontWeight: 600 }}>
              [02 — WHO WE SERVE]
            </div>
            <div className="abt-grid-2">
              <div className="abt-card">
                <h3>Manufacturing &amp; Industrial Companies</h3>
                <p>Manufacturing management, production monitoring, inventory and warehouse management, quality control, and industrial process automation.</p>
              </div>
              <div className="abt-card">
                <h3>Engineering &amp; Technical Companies</h3>
                <p>Engineering software, AI-powered engineering tools, technical data management, and engineering workflow automation.</p>
              </div>
              <div className="abt-card">
                <h3>Business &amp; Enterprise Operations</h3>
                <p>Enterprise management software, ERP and CRM systems, business intelligence dashboards, and business process automation.</p>
              </div>
              <div className="abt-card">
                <h3>Technology &amp; Software Companies</h3>
                <p>SaaS development, AI agent integration, custom application development, cloud software, and API and backend development.</p>
              </div>
            </div>
          </section>

          {/* Our Principles Section */}
          <section style={{ marginBottom: '3.5rem' }}>
            <p className="abt-principles-header">[03 — HOW WE WORK]</p>
            {principles.map((p) => (
              <div key={p.num} className="principle">
                <span className="principle-num">{p.num}</span>
                <h2 className="principle-title">
                  {p.title.map((line, i) => <span key={i}>{line}</span>)}
                </h2>
                <p className="principle-body">{p.body}</p>
              </div>
            ))}
          </section>

          {/* Leadership & Team Link Section */}
          <section style={{ marginBottom: '3.5rem', backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.16)', borderRadius: '12px', padding: 'clamp(1.5rem, 3vw, 2rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
                  [04 — THE TEAM]
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.35rem 0', textTransform: 'uppercase' }}>
                  Meet the People Building Quantum AI
                </h2>
                <p style={{ color: '#FFFFFF', fontSize: '0.88rem', margin: 0, fontWeight: 300, maxWidth: '560px', lineHeight: 1.6 }}>
                  Our team combines software engineering, artificial intelligence, and an understanding of how businesses operate.
                </p>
              </div>
              <Link
                href="/leadership"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.65rem 1.25rem',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-d-din)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                VIEW LEADERSHIP TEAM →
              </Link>
            </div>
          </section>

          {/* CTA Box */}
          <section style={{ textAlign: 'center', paddingTop: '2.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.15)' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Ready to build with Quantum AI?
            </h2>
            <p style={{ color: '#FFFFFF', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 1.75rem', lineHeight: 1.6, fontWeight: 300 }}>
              Tell us about your organization&apos;s operational challenges or software requirements.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.75rem',
                  background: 'linear-gradient(135deg, #1677FF, #0050B3)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontFamily: 'var(--font-d-din)',
                  fontSize: '0.8125rem',
                  letterSpacing: '0.08em',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 16px -2px rgba(22, 119, 255, 0.4)',
                }}
              >
                START A PROJECT →
              </Link>
              <Link
                href="/work"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.75rem',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-d-din)',
                  fontSize: '0.8125rem',
                  letterSpacing: '0.08em',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                }}
              >
                EXPLORE CASE STUDIES
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}