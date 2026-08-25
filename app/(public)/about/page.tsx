import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'About Quantum AI — Engineering Philosophy & Business Identity',
  description: 'Learn who Quantum AI is, what we build, the operational problems we solve, and our core principles for engineering reliable AI systems and custom business software.',
  path: '/about',
});

const principles = [
  {
    num: "01",
    title: ["Understand", "First."],
    body: "Study operational bottlenecks before writing code. By understanding how your business actually runs, we avoid unnecessary complexity and build direct, effective software solutions.",
  },
  {
    num: "02",
    title: ["Build", "Smarter."],
    body: "Choose architecture for business value, not hype. Every database model, API endpoint, and AI workflow is engineered with clear operational justification.",
  },
  {
    num: "03",
    title: ["Keep", "It Usable."],
    body: "Powerful backend systems must feel intuitive to everyday staff. Complex domain logic is packaged into clean, responsive, and frictionless digital interfaces.",
  },
  {
    num: "04",
    title: ["Create", "What Lasts."],
    body: "Engineer reliable digital foundations that scale with organizational growth — from offline point-of-sale systems to campus operations and multi-agent AI pipelines.",
  },
];

const capabilities = [
  {
    title: "AI Systems",
    desc: "AI assistants, agentic workflows, document intelligence, and semantic search pipelines.",
  },
  {
    title: "Business Software",
    desc: "Custom management portals, operations dashboards, inventory systems, and internal platforms.",
  },
  {
    title: "Automation",
    desc: "Event-driven data workflows, API integrations, and repetitive task elimination.",
  },
  {
    title: "Digital Products",
    desc: "Scalable SaaS platforms, web applications, and customer-facing software products.",
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
        .abt-eyebrow { font-family: var(--font-mono, monospace); font-size: 0.72rem; letter-spacing: 0.25em; color: #1677FF; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600; }
        .abt-h1 { font-size: clamp(2.5rem, 5vw, 4.25rem); font-weight: 700; line-height: 1.02; letter-spacing: -0.035em; color: #F8FAFC; text-transform: uppercase; margin-bottom: 0.75rem; }
        .abt-lead { font-size: clamp(0.95rem, 1.2vw, 1.125rem); color: #94A3B8; max-width: 680px; line-height: 1.65; margin-bottom: 2.5rem; font-weight: 300; }
        
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
          color: #F8FAFC;
          margin: 0 0 0.5rem 0;
        }
        .abt-card p {
          color: #94A3B8;
          font-size: 0.875rem;
          line-height: 1.6;
          margin: 0;
          font-weight: 300;
        }

        .abt-principles-header { font-family: var(--font-mono, monospace); font-size: 0.68rem; letter-spacing: 0.2em; color: #64748B; text-transform: uppercase; padding-bottom: 1.25rem; border-bottom: 1px solid rgba(30,58,138,0.22); margin-bottom: 0; }
        .principle { padding: 1.75rem 0; border-bottom: 1px solid rgba(30,58,138,0.22); display: grid; grid-template-columns: 60px 1fr 1.2fr; gap: 1.5rem; align-items: start; transition: border-bottom-color 0.3s; cursor: default; }
        .principle:hover { border-bottom-color: rgba(37,99,235,0.38); }
        @media (max-width: 640px) { .principle { grid-template-columns: 44px 1fr; } .principle-body { grid-column: 1 / -1; } }
        .principle-num { font-family: var(--font-mono, monospace); font-size: 0.75rem; color: #334155; letter-spacing: 0.08em; padding-top: 0.25rem; transition: color 0.3s; }
        .principle:hover .principle-num { color: #38BDF8; }
        .principle-title { font-size: clamp(1.2rem, 2vw, 1.55rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; color: #F8FAFC; }
        .principle-title span { display: block; }
        .principle-body { font-size: 0.875rem; color: #94A3B8; line-height: 1.65; max-width: 540px; padding-top: 0.25rem; transition: color 0.3s; font-weight: 300; }
        .principle:hover .principle-body { color: #CBD5E1; }
      `}</style>
      <div className="abt-page">
        <div className="abt-inner">
          <section style={{ marginBottom: '2.5rem' }}>
            <p className="abt-eyebrow">[00 — ABOUT QUANTUM AI]</p>
            <h1 className="abt-h1">Engineering Systems<br />That Run Businesses.</h1>
            <p className="abt-lead">
              Quantum AI is a technology company specializing in custom AI systems, enterprise software, workflow automation, and digital products. We build digital architectures that fit how organizations actually operate.
            </p>
          </section>

          {/* What We Build Section */}
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.85rem', fontWeight: 600 }}>
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
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.85rem', fontWeight: 600 }}>
              [02 — WHO WE SERVE]
            </div>
            <div className="abt-grid-2">
              <div className="abt-card">
                <h3>Education &amp; Schools</h3>
                <p>Campus management portals, student registries, automated fee tracking, and academic record systems.</p>
              </div>
              <div className="abt-card">
                <h3>Businesses &amp; Retailers</h3>
                <p>Offline-first POS engines, inventory management, supply tracking, and order fulfillment systems.</p>
              </div>
              <div className="abt-card">
                <h3>Startups &amp; Founders</h3>
                <p>AI-native MVPs, custom software architectures, and scalable full-stack web applications.</p>
              </div>
              <div className="abt-card">
                <h3>Enterprises &amp; Organizations</h3>
                <p>Document intelligence, automated customer support agents, and custom workflow pipelines.</p>
              </div>
            </div>
          </section>

          {/* Our Principles Section */}
          <section style={{ marginBottom: '3.5rem' }}>
            <p className="abt-principles-header">[03 — HOW WE APPROACH ENGINEERING]</p>
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
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
                  [04 — THE TEAM]
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0', textTransform: 'uppercase' }}>
                  Meet the People Building Quantum AI
                </h2>
                <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0, fontWeight: 300, maxWidth: '560px', lineHeight: 1.6 }}>
                  Our leadership team and software engineers bring together artificial intelligence, systems engineering, and business understanding.
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
                  color: '#38BDF8',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono, monospace)',
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
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Ready to build with Quantum AI?
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 1.75rem', lineHeight: 1.6, fontWeight: 300 }}>
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
                  fontFamily: 'var(--font-mono, monospace)',
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
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8125rem',
                  letterSpacing: '0.08em',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#38BDF8',
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