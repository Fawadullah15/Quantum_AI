'use client';

import React, { useEffect, useState } from 'react';

interface ClientItem {
  id?: string;
  name: string;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  logo?: string | null;
  featured?: boolean;
}

const DEFAULT_CLIENTS: ClientItem[] = [
  {
    name: 'School Operations Manager',
    industry: 'Education / Institution',
    description: 'Centralized school management platform bringing academic, attendance, and administrative workflows into one digital system.',
    website: 'https://quantumai.dev/work/school-operations-manager',
  },
  {
    name: 'Sales Pipeline System',
    industry: 'Sales / Business Automation',
    description: 'Centralized CRM and opportunity tracking engine with automated lead routing and CRM synchronization pipelines.',
    website: 'https://quantumai.dev/work/sales-pipeline-automation-system',
  },
  {
    name: 'Vector Search Knowledge Base',
    industry: 'AI / Knowledge Management',
    description: 'Enterprise semantic search over knowledge sources and document archives powered by embeddings and vector indexing.',
    website: 'https://quantumai.dev/work/vector-search-knowledge-base',
  },
  {
    name: 'AI Support Assistant',
    industry: 'AI / Customer Support',
    description: 'Context-aware customer support system automating frequent inquiries and accelerating team response workflows.',
    website: 'https://quantumai.dev/work/ai-powered-customer-support-assistant',
  },
];

export default function ClientsSection() {
  const [clients, setClients] = useState<ClientItem[]>(DEFAULT_CLIENTS);

  useEffect(() => {
    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setClients(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      id="clients-worked-with"
      style={{
        padding: 'clamp(2.5rem, 5vh, 4rem) clamp(1rem, 5vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(4, 14, 36, 0.6)',
        borderTop: '1px solid rgba(22, 119, 255, 0.1)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
      }}
    >
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           DESKTOP VIEW (> 768px): Compact Grid Cards
        ═══════════════════════════════════════════════════════════ */
        .clients-desktop-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem;
          width: 100%;
        }

        .clients-mobile-grid {
          display: none;
        }

        .client-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.5rem;
          transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
          text-decoration: none;
          min-height: 110px;
        }

        .client-card:hover {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.25);
        }

        .client-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }

        .client-card-name {
          font-size: 1.05rem;
          font-weight: 600;
          color: #F8FAFF;
          margin: 0;
          letter-spacing: -0.01em;
          text-transform: none;
          line-height: 1.3;
        }

        .client-card-industry {
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          color: #38BDF8;
          letter-spacing: 0.1em;
          font-weight: 600;
          text-transform: uppercase;
          background: rgba(22, 119, 255, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          white-space: nowrap;
        }

        .client-card-desc {
          color: #94A3B8;
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0;
          font-weight: 300;
        }

        /* ═══════════════════════════════════════════════════════════
           MOBILE VIEW (<= 768px): Clean 2x2 Block Grid
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .clients-desktop-grid {
            display: none !important;
          }

          .clients-mobile-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.55rem;
            width: 100%;
          }

          .mobile-client-tile {
            background-color: rgba(6, 21, 43, 0.75);
            border: 1px solid rgba(22, 119, 255, 0.16);
            border-radius: 8px;
            padding: 0.75rem 0.8rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 0.35rem;
            min-height: 95px;
            box-sizing: border-box;
          }

          .mobile-client-name {
            font-size: 0.82rem;
            font-weight: 600;
            color: #F8FAFC;
            letter-spacing: -0.01em;
            margin: 0;
            line-height: 1.25;
          }

          .mobile-client-industry {
            font-family: var(--font-mono, monospace);
            font-size: 0.56rem;
            color: #38BDF8;
            letter-spacing: 0.08em;
            font-weight: 600;
            text-transform: uppercase;
            line-height: 1.2;
          }

          .mobile-client-desc {
            font-size: 0.72rem;
            color: #94A3B8;
            line-height: 1.35;
            margin: 0;
            font-weight: 300;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }

        @media (max-width: 380px) {
          .mobile-client-tile {
            padding: 0.65rem 0.7rem;
            min-height: 88px;
          }
          .mobile-client-name {
            font-size: 0.76rem;
          }
          .mobile-client-desc {
            font-size: 0.68rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Eyebrow & Title */}
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#1677FF',
            marginBottom: '0.4rem',
            fontWeight: 600,
          }}
        >
          SYS.07 / CLIENTS & COLLABORATIONS
        </p>
        <h2
          style={{
            fontSize: 'clamp(1.35rem, 2.5vw, 2.1rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: '#F8FAFF',
            marginBottom: '0.4rem',
            textTransform: 'uppercase',
          }}
        >
          With whom we have worked with.
        </h2>
        <p
          style={{
            fontSize: 'clamp(0.85rem, 1.2vw, 0.95rem)',
            color: '#94A3B8',
            lineHeight: 1.6,
            marginBottom: 'clamp(1.25rem, 2.5vh, 2rem)',
            maxWidth: 640,
            fontWeight: 300,
          }}
        >
          We construct reliable software architectures, custom AI systems, and automated platforms for educational institutions, businesses, and enterprises.
        </p>

        {/* ─── Desktop View: 2-Column Responsive Client Cards ─── */}
        <div className="clients-desktop-grid">
          {clients.map((c, idx) => {
            const cardContent = (
              <>
                <div className="client-card-top">
                  <h3 className="client-card-name">{c.name}</h3>
                  {c.industry && <span className="client-card-industry">{c.industry}</span>}
                </div>
                {c.description && <p className="client-card-desc">{c.description}</p>}
              </>
            );

            if (c.website) {
              return (
                <a
                  key={c.id || idx}
                  href={c.website}
                  target={c.website.startsWith('http') ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="client-card"
                >
                  {cardContent}
                </a>
              );
            }

            return (
              <div key={c.id || idx} className="client-card">
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* ─── Mobile View: Clean 2x2 Compact Block Grid ─── */}
        <div className="clients-mobile-grid">
          {clients.map((c, idx) => (
            <div key={c.id || idx} className="mobile-client-tile">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span className="mobile-client-industry">{c.industry || 'CLIENT'}</span>
                <h3 className="mobile-client-name">{c.name}</h3>
              </div>
              {c.description && <p className="mobile-client-desc">{c.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
