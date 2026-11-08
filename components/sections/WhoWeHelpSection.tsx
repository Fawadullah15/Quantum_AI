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
    category: 'Manufacturing & Industrial Companies',
    subtitle: 'Factories & Production',
    description: 'Factories, manufacturers, production facilities, and industrial businesses.',
    deliverables: [
      'Manufacturing Management Software',
      'Production Monitoring Systems',
      'Inventory & Warehouse Management',
      'Quality Control Software',
      'Industrial Process Automation',
    ],
    link: '/services#software',
  },
  {
    code: '02',
    category: 'Engineering & Technical Companies',
    subtitle: 'Engineering Teams',
    description: 'Engineering firms, industrial consultancies, and technical product development teams.',
    deliverables: [
      'Engineering Software',
      'AI-Powered Engineering Tools',
      'Technical Data Management',
      'Engineering Workflow Automation',
      'Custom Engineering Applications',
    ],
    link: '/services#ai',
  },
  {
    code: '03',
    category: 'Business & Enterprise Operations',
    subtitle: 'Business Systems',
    description: 'Established businesses requiring custom digital systems to manage their operations.',
    deliverables: [
      'Enterprise Management Software',
      'ERP & CRM Systems',
      'Business Intelligence Dashboards',
      'Inventory Management',
      'Business Process Automation',
    ],
    link: '/services#software',
  },
  {
    code: '04',
    category: 'Technology & Software Companies',
    subtitle: 'Software Products',
    description: 'Companies developing software products or improving existing technology systems.',
    deliverables: [
      'SaaS Development',
      'AI Agent Integration',
      'Custom Application Development',
      'Cloud Software Systems',
      'API & Backend Development',
    ],
    link: '/services#product',
  },
];
export default function WhoWeHelpSection() {
  return (
    <section
      style={{
        padding: 'clamp(2.5rem, 5vh, 4rem) clamp(0.75rem, 4vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(5, 12, 14, 0.4)',
        borderTop: '1px solid rgba(20, 184, 166, 0.08)',
        borderBottom: '1px solid rgba(20, 184, 166, 0.08)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'var(--font-d-din)',
            fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
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
            color: '#FFFFFF',
            marginBottom: '0.65rem',
            letterSpacing: '-0.035em',
            textTransform: 'uppercase',
          }}
        >
          Software for factories, engineers, and growing businesses.
        </h2>

        <p
          className="section-desc"
          style={{
            fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)',
            color: '#FFFFFF',
            lineHeight: 1.6,
            marginBottom: 'clamp(1.75rem, 3.5vh, 2.75rem)',
            maxWidth: 680,
            fontWeight: 300,
          }}
        >
          We build custom software, automation, and AI systems for manufacturers, engineering firms, established businesses, and technology companies that need more than off-the-shelf tools.
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
                backgroundColor: 'rgba(7, 18, 20, 0.65)',
                border: '1px solid rgba(20, 184, 166, 0.16)',
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
                e.currentTarget.style.backgroundColor = 'rgba(10, 24, 27, 0.85)';
                e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.45)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(7, 18, 20, 0.65)';
                e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.16)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-d-din)',
                    fontSize: '0.72rem',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                >
                  {item.code}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-d-din)',
                    fontSize: '0.68rem',
                    color: '#FFFFFF',
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
                  color: '#FFFFFF',
                  letterSpacing: '-0.015em',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {item.category}
              </h3>

              <p
                style={{
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 300,
                }}
              >
                {item.description}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(20, 184, 166, 0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {item.deliverables.map((del) => (
                    <div
                      key={del}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.76rem',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-d-din)',
                      }}
                    >
                      <span style={{ color: '#FFFFFF', fontSize: '0.7rem' }} aria-hidden="true">▹</span>
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
