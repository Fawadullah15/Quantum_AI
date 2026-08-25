'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export interface ClientItem {
  id?: string;
  name: string;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  logo?: string | null;
  featured?: boolean;
  published?: boolean;
  order?: number;
}

const FALLBACK_CLIENTS: ClientItem[] = [
  {
    id: 'c-inventra',
    name: 'Inventra Design & Automation',
    industry: 'Design & Automation',
    logo: '/uploads/clients/inventra-logo.png',
    description: 'Industrial design and process automation platforms engineered for scalable precision.',
    website: '/work/sales-pipeline-automation-system',
    order: 1,
  },
  {
    id: 'c-eden',
    name: 'Eden School System',
    industry: 'Education & Institutional Management',
    logo: '/uploads/clients/eden-school-logo.png',
    description: 'Centralized school operations manager bringing academic, attendance, and administrative workflows into one digital system.',
    website: '/work/school-operations-manager',
    order: 2,
  },
  {
    id: 'c-emerge',
    name: 'Emerge Technologies',
    industry: 'Enterprise Software & Systems',
    logo: '/uploads/clients/emerge-tech-logo.png',
    description: 'Scalable data architecture and modern operational platforms.',
    website: '/work/vector-search-knowledge-base',
    order: 3,
  },
];

export default function ClientsSection({ initialClients }: { initialClients?: ClientItem[] }) {
  const [clients, setClients] = useState<ClientItem[]>(
    initialClients && initialClients.length > 0 ? initialClients : FALLBACK_CLIENTS
  );
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement>(null);

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

  // Intersection observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Mouse parallax handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 15, y: y * 15 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <section
      ref={sectionRef}
      id="clients-worked-with"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="clients-animated-section"
    >
      <style>{`
        .clients-animated-section {
          padding: clamp(3rem, 6vh, 5.5rem) clamp(1rem, 5vw, 6rem);
          background: radial-gradient(circle at 50% 35%, rgba(14, 42, 85, 0.25) 0%, rgba(3, 7, 18, 0.98) 75%);
          border-top: 1px solid rgba(22, 119, 255, 0.14);
          border-bottom: 1px solid rgba(22, 119, 255, 0.14);
          position: relative;
          overflow: hidden;
          color: #F8FAFC;
        }

        /* ─── Background Watermark Typography ─── */
        .clients-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: var(--font-mono, monospace);
          font-size: clamp(3.5rem, 10vw, 9rem);
          font-weight: 900;
          color: rgba(22, 119, 255, 0.035);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
          z-index: 0;
        }

        .clients-container {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* ─── Header ─── */
        .clients-header {
          text-align: center;
          margin-bottom: clamp(2.5rem, 5vw, 4rem);
        }
        .clients-tag {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #1677FF;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .clients-title {
          font-size: clamp(1.6rem, 3.5vw, 2.5rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #F8FAFF;
          margin: 0 0 0.65rem 0;
          text-transform: uppercase;
        }
        .clients-subtitle {
          font-size: clamp(0.88rem, 1.25vw, 1.05rem);
          color: #94A3B8;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
          font-weight: 300;
        }

        /* ─── Desktop Artistic Constellation Wall ─── */
        .clients-constellation-stage {
          position: relative;
          min-height: 440px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clients-constellation-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: clamp(1.5rem, 3.5vw, 3rem);
          max-width: 1050px;
          margin: 0 auto;
        }

        /* ─── Dynamic Logo Item Card ─── */
        .logo-constellation-card {
          position: relative;
          background: rgba(6, 21, 43, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(22, 119, 255, 0.18);
          border-radius: 16px;
          padding: clamp(1.25rem, 2.5vw, 1.85rem) clamp(1.5rem, 3vw, 2.25rem);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.3s ease,
                      box-shadow 0.3s ease,
                      opacity 0.3s ease,
                      background-color 0.3s ease;
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          min-width: 190px;
          max-width: 260px;
          flex: 1 1 210px;
          height: 155px;
          box-sizing: border-box;
          opacity: 0;
          transform: translateY(30px) scale(0.92);
        }

        .logo-constellation-card.is-active {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* Floating Idle Breathing Animation */
        @keyframes floatBreathing {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        .logo-constellation-card.is-active.idle-float {
          animation: floatBreathing 5.5s ease-in-out infinite;
        }

        /* Hover Elevation & Focus */
        .logo-constellation-card:hover {
          background-color: rgba(8, 28, 58, 0.9);
          border-color: rgba(56, 189, 248, 0.6);
          transform: translateY(-8px) scale(1.04) !important;
          box-shadow: 0 20px 48px -10px rgba(22, 119, 255, 0.35),
                      0 0 0 1px rgba(56, 189, 248, 0.4),
                      inset 0 1px 1px rgba(255, 255, 255, 0.1);
          z-index: 10;
        }

        .clients-constellation-grid.has-hover .logo-constellation-card:not(:hover) {
          opacity: 0.55;
          filter: grayscale(20%);
        }

        /* Logo Image Container */
        .logo-img-wrapper {
          width: 100%;
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0.5rem;
          box-sizing: border-box;
        }

        .logo-img-element {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease, filter 0.3s ease;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
        }

        .logo-constellation-card:hover .logo-img-element {
          transform: scale(1.05);
          filter: drop-shadow(0 6px 16px rgba(56, 189, 248, 0.3));
        }

        /* Fallback Emblem */
        .logo-placeholder-box {
          font-family: var(--font-mono, monospace);
          font-size: 0.85rem;
          font-weight: 700;
          color: #38BDF8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
        }

        /* Hover Tooltip Details */
        .logo-info-bar {
          margin-top: 0.75rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          width: 100%;
        }

        .logo-org-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: #F8FAFC;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .logo-industry-tag {
          font-family: var(--font-mono, monospace);
          font-size: 0.62rem;
          color: #38BDF8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(22, 119, 255, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }

        /* Mobile View (< 768px) */
        @media (max-width: 768px) {
          .clients-constellation-grid {
            gap: 1rem;
          }
          .logo-constellation-card {
            min-width: 160px;
            height: 160px;
            padding: 1rem;
          }
          .logo-img-wrapper {
            height: 75px;
          }
          .logo-org-name {
            font-size: 0.78rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .logo-constellation-card {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Background Watermark */}
      <div className="clients-watermark">PARTNERSHIPS</div>

      <div className="clients-container">
        {/* Section Header */}
        <div className="clients-header">
          <div className="clients-tag">SYS.07 / CLIENTS & COLLABORATIONS</div>
          <h2 className="clients-title">WITH WHOM WE HAVE WORKED.</h2>
          <p className="clients-subtitle">
            Trusted by organizations that believe in building what comes next. Real software systems, custom AI platforms, and operational engineering.
          </p>
        </div>

        {/* Dynamic Logo Constellation Stage */}
        <div className="clients-constellation-stage">
          <div className={`clients-constellation-grid ${hoveredId ? 'has-hover' : ''}`}>
            {clients.map((client, index) => {
              const delaySec = index * 0.15;
              const floatDelay = `${(index * 1.2) % 4}s`;

              const cardMarkup = (
                <>
                  <div className="logo-img-wrapper">
                    {client.logo ? (
                      <img
                        src={client.logo}
                        alt={`${client.name} logo`}
                        className="logo-img-element"
                        onError={(e) => {
                          // Gracefully handle broken image by displaying styled monogram
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="logo-placeholder-box">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 3h6v4H9z" />
                        </svg>
                        <span>{client.name.slice(0, 12)}</span>
                      </div>
                    )}
                  </div>

                  <div className="logo-info-bar">
                    <div className="logo-org-name">{client.name}</div>
                    {client.industry && (
                      <div className="logo-industry-tag">{client.industry}</div>
                    )}
                  </div>
                </>
              );

              if (client.website) {
                if (client.website.startsWith('/')) {
                  return (
                    <Link
                      key={client.id || index}
                      href={client.website}
                      onMouseEnter={() => setHoveredId(client.id || String(index))}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`logo-constellation-card ${isVisible ? 'is-active idle-float' : ''}`}
                      style={{
                        transitionDelay: `${delaySec}s`,
                        animationDelay: floatDelay,
                      }}
                    >
                      {cardMarkup}
                    </Link>
                  );
                }

                return (
                  <a
                    key={client.id || index}
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setHoveredId(client.id || String(index))}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`logo-constellation-card ${isVisible ? 'is-active idle-float' : ''}`}
                    style={{
                      transitionDelay: `${delaySec}s`,
                      animationDelay: floatDelay,
                    }}
                  >
                    {cardMarkup}
                  </a>
                );
              }

              return (
                <div
                  key={client.id || index}
                  onMouseEnter={() => setHoveredId(client.id || String(index))}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`logo-constellation-card ${isVisible ? 'is-active idle-float' : ''}`}
                  style={{
                    transitionDelay: `${delaySec}s`,
                    animationDelay: floatDelay,
                  }}
                >
                  {cardMarkup}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
