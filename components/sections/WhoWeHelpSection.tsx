'use client';

import React from 'react';
import Link from 'next/link';

interface TargetAudience {
  code: string;
  category: string;
  subtitle: string;
  description: string;
  deliverables: string[];
  link: string;
}

const AUDIENCES: TargetAudience[] = [
  {
    code: '01',
    category: 'Businesses & Enterprises',
    subtitle: 'Streamline Operations',
    description: 'Companies that need custom internal software, central operations dashboards, inventory systems, or automated workflows to replace slow, manual spreadsheets.',
    deliverables: ['Custom Operations Software', 'Internal Management Portals', 'Automated Reporting Pipelines'],
    link: '/services#software',
  },
  {
    code: '02',
    category: 'Educational Institutions',
    subtitle: 'School & Campus Systems',
    description: 'Schools, colleges, and educational organizations seeking unified platforms for student records, attendance, fee collection, staff coordination, and academic reporting.',
    deliverables: ['School Operations Suites', 'Administrative Portals', 'Attendance & Fee Management'],
    link: '/work/school-operations-manager',
  },
  {
    code: '03',
    category: 'Startups & Tech Founders',
    subtitle: 'From Concept to Product',
    description: 'Early-stage and growing tech ventures that require reliable full-stack software architecture, AI agent integration, or MVP product development ready to scale.',
    deliverables: ['SaaS Product Engineering', 'AI & RAG Integrations', 'Scalable Cloud Architectures'],
    link: '/services#products',
  },
  {
    code: '04',
    category: 'Organizations & Nonprofits',
    subtitle: 'Digital Coordination',
    description: 'Structured organizations, member associations, and non-profits that need centralized digital hubs to manage chapters, public communications, and program activities.',
    deliverables: ['Centralized Web Portals', 'Member & Chapter Management', 'Public Content Hubs'],
    link: '/work/youth-development-program-website',
  },
];

export default function WhoWeHelpSection() {
  return (
    <section
      style={{
        padding: 'clamp(2.5rem, 5vh, 4rem) clamp(0.75rem, 4vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(4, 14, 36, 0.4)',
        borderTop: '1px solid rgba(22, 119, 255, 0.08)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.08)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#38BDF8',
            marginBottom: '0.5rem',
            fontWeight: 600,
          }}
        >
          [PARTNERSHIP] WHO WE HELP
        </p>

        <h2
          className="section-heading"
          style={{
            fontSize: 'clamp(2.25rem, 4.5vw, 3.65rem)',
            fontWeight: 700,
            lineHeight: 1.05,
            color: '#F8FAFF',
            marginBottom: '0.65rem',
            letterSpacing: '-0.035em',
            textTransform: 'uppercase',
          }}
        >
          Built for organizations that need to operate better.
        </h2>

        <p
          className="section-desc"
          style={{
            fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)',
            color: '#94A3B8',
            lineHeight: 1.6,
            marginBottom: 'clamp(1.75rem, 3.5vh, 2.75rem)',
            maxWidth: 680,
            fontWeight: 300,
          }}
        >
          We engineer software and AI systems for established businesses, educational institutions, tech startups, and organizations that have outgrown generic off-the-shelf tools.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '1.25rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {AUDIENCES.map((item) => (
            <Link
              key={item.code}
              href={item.link}
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.65)',
                border: '1px solid rgba(22, 119, 255, 0.16)',
                borderRadius: '12px',
                padding: '1.35rem',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s, background-color 0.25s',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(8, 28, 58, 0.85)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(6, 21, 43, 0.65)';
                e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.16)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.72rem',
                    color: '#38BDF8',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                >
                  {item.code}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.68rem',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {item.subtitle}
                </span>
              </div>

              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: '#F8FAFC',
                  letterSpacing: '-0.015em',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {item.category}
              </h3>

              <p
                style={{
                  color: '#94A3B8',
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 300,
                }}
              >
                {item.description}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(22, 119, 255, 0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {item.deliverables.map((del) => (
                    <div
                      key={del}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.76rem',
                        color: '#CBD5E1',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      <span style={{ color: '#38BDF8', fontSize: '0.7rem' }}>▹</span>
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
