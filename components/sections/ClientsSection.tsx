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
    website: '/work/sales-pipeline-automation-system',
    order: 1,
  },
  {
    id: 'c-eden',
    name: 'Eden School System',
    industry: 'Education & Institutional Management',
    logo: '/uploads/clients/eden-school-logo.png',
    website: '/work/school-operations-manager',
    order: 2,
  },
  {
    id: 'c-emerge',
    name: 'Emerge Technologies',
    industry: 'Enterprise Software & Systems',
    logo: '/uploads/clients/emerge-tech-logo.png',
    website: '/work/vector-search-knowledge-base',
    order: 3,
  },
  {
    id: 'c-inventra-2',
    name: 'Inventra Robotics & AI',
    industry: 'Industrial Robotics',
    logo: '/uploads/clients/inventra-logo.png',
    website: '/work/sales-pipeline-automation-system',
    order: 4,
  },
  {
    id: 'c-eden-2',
    name: 'Eden Higher Secondary Academy',
    industry: 'Academic Administration',
    logo: '/uploads/clients/eden-school-logo.png',
    website: '/work/school-operations-manager',
    order: 5,
  },
  {
    id: 'c-emerge-2',
    name: 'Emerge Cloud Infrastructure',
    industry: 'Cloud Architecture',
    logo: '/uploads/clients/emerge-tech-logo.png',
    website: '/work/vector-search-knowledge-base',
    order: 6,
  },
];

export default function ClientsSection({ initialClients }: { initialClients?: ClientItem[] }) {
  const [clients, setClients] = useState<ClientItem[]>(
    initialClients && initialClients.length > 0 ? initialClients : FALLBACK_CLIENTS
  );
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const activeList = data.filter((c: ClientItem) => c.published !== false);
          if (activeList.length > 0) {
            setClients(activeList);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Intersection observer for performance (only animate when section is near viewport)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Construct deterministic sequence for 1 single continuous row
  const generateSingleRowItems = (items: ClientItem[]) => {
    if (!items || items.length === 0) return [];
    let baseList = [...items];
    while (baseList.length < 8) {
      baseList = [...baseList, ...items];
    }
    // Duplicate exactly once for mathematically seamless -50% marquee loop
    return [...baseList, ...baseList];
  };

  const rowItems = generateSingleRowItems(clients);

  const renderLogoCard = (client: ClientItem, keyIdx: string | number) => {
    const cardContent = (
      <>
        <div className="marquee-logo-box">
          {client.logo ? (
            <img
              src={client.logo}
              alt={`${client.name} logo`}
              className="marquee-logo-img"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="marquee-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 3h6v4H9z" />
              </svg>
              <span>{client.name.slice(0, 12)}</span>
            </div>
          )}
        </div>

        {/* Floating Tooltip Pill on Hover */}
        <div className="marquee-tooltip">
          <span className="marquee-tooltip-name">{client.name}</span>
          {client.industry && <span className="marquee-tooltip-ind">{client.industry}</span>}
        </div>
      </>
    );

    if (client.website) {
      if (client.website.startsWith('/')) {
        return (
          <Link key={keyIdx} href={client.website} className="marquee-card">
            {cardContent}
          </Link>
        );
      }
      return (
        <a
          key={keyIdx}
          href={client.website}
          target="_blank"
          rel="noopener noreferrer"
          className="marquee-card"
        >
          {cardContent}
        </a>
      );
    }

    return (
      <div key={keyIdx} className="marquee-card">
        {cardContent}
      </div>
    );
  };

  return (
    <section ref={sectionRef} id="clients-worked-with" className="continuous-clients-section">
      <style>{`
        .continuous-clients-section {
          padding: clamp(3.5rem, 6.5vh, 5.5rem) 0;
          background: radial-gradient(circle at 50% 50%, rgba(10, 32, 68, 0.28) 0%, rgba(3, 7, 18, 0.98) 80%);
          border-top: 1px solid rgba(22, 119, 255, 0.14);
          border-bottom: 1px solid rgba(22, 119, 255, 0.14);
          position: relative;
          overflow: hidden;
          color: #F8FAFC;
        }

        /* ─── Header ─── */
        .clients-marquee-header {
          text-align: center;
          margin-bottom: clamp(2rem, 4vw, 3.25rem);
          padding: 0 clamp(1.25rem, 4vw, 3rem);
        }
        .clients-marquee-tag {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #1677FF;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .clients-marquee-title {
          font-size: clamp(1.6rem, 3.5vw, 2.5rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #F8FAFF;
          margin: 0 0 0.65rem 0;
          text-transform: uppercase;
        }
        .clients-marquee-subtitle {
          font-size: clamp(0.88rem, 1.2vw, 1.05rem);
          color: #94A3B8;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.6;
          font-weight: 300;
        }

        /* ─── Smooth Side Edge Gradient Masking ─── */
        .marquee-stage-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
          padding: 0.75rem 0;
        }

        /* ─── 1 Single Infinite Marquee Row ─── */
        .marquee-row {
          display: flex;
          width: max-content;
          will-change: transform;
          user-select: none;
          animation: singleScrollLeft 38s linear infinite;
        }

        .marquee-row:hover {
          animation-play-state: paused;
        }

        /* Continuous Single Line Left Movement */
        @keyframes singleScrollLeft {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .marquee-track {
          display: flex;
          align-items: center;
          gap: clamp(1.25rem, 2.5vw, 2rem);
          padding: 0 0.75rem;
        }

        /* ─── Logo Card ─── */
        .marquee-card {
          position: relative;
          background: rgba(6, 21, 43, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(22, 119, 255, 0.18);
          border-radius: 14px;
          padding: 0.85rem clamp(1.5rem, 3vw, 2.25rem);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          min-width: 200px;
          max-width: 260px;
          height: 92px;
          flex-shrink: 0;
          box-sizing: border-box;
          box-shadow: 0 10px 28px -6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.25s ease,
                      background-color 0.25s ease,
                      box-shadow 0.25s ease;
        }

        .marquee-card:hover {
          background-color: rgba(8, 28, 58, 0.95);
          border-color: rgba(56, 189, 248, 0.6);
          transform: scale(1.06) translateY(-3px);
          box-shadow: 0 18px 40px -8px rgba(22, 119, 255, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.4);
          z-index: 50;
        }

        .marquee-logo-box {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .marquee-logo-img {
          max-width: 170px;
          max-height: 60px;
          object-fit: contain;
          transition: transform 0.25s ease, filter 0.25s ease;
          filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.35));
        }

        .marquee-card:hover .marquee-logo-img {
          transform: scale(1.04);
          filter: drop-shadow(0 4px 14px rgba(56, 189, 248, 0.35));
        }

        .marquee-placeholder {
          font-family: var(--font-mono, monospace);
          font-size: 0.76rem;
          color: #38BDF8;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        /* ─── Hover Tooltip ─── */
        .marquee-tooltip {
          position: absolute;
          bottom: -34px;
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: rgba(3, 7, 18, 0.95);
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 6px;
          padding: 0.25rem 0.7rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          z-index: 100;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.6);
        }

        .marquee-card:hover .marquee-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .marquee-tooltip-name {
          font-size: 0.72rem;
          font-weight: 600;
          color: #F8FAFC;
        }

        .marquee-tooltip-ind {
          font-family: var(--font-mono, monospace);
          font-size: 0.6rem;
          color: #38BDF8;
          text-transform: uppercase;
        }

        /* ─── Responsive Adjustments ─── */
        @media (max-width: 768px) {
          .marquee-card {
            min-width: 155px;
            max-width: 190px;
            height: 74px;
            padding: 0.6rem 1rem;
          }
          .marquee-logo-img {
            max-width: 130px;
            max-height: 46px;
          }
          .marquee-row {
            animation-duration: 28s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-row {
            animation: none !important;
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
          }
          .marquee-stage-wrapper {
            mask-image: none;
            -webkit-mask-image: none;
          }
        }
      `}</style>

      <div className="clients-marquee-header">
        <div className="clients-marquee-tag">SYS.07 / CLIENTS & COLLABORATIONS</div>
        <h2 className="clients-marquee-title">WITH WHOM WE HAVE WORKED.</h2>
        <p className="clients-marquee-subtitle">
          Trusted by organizations that believe in building what comes next. Real software systems, custom AI platforms, and operational engineering.
        </p>
      </div>

      {/* 1 Single Line Continuous Sliding Stage */}
      <div className="marquee-stage-wrapper">
        <div className={`marquee-row ${!isVisible ? 'paused' : ''}`}>
          <div className="marquee-track">
            {rowItems.map((client, idx) => renderLogoCard(client, `single-${idx}`))}
          </div>
        </div>
      </div>
    </section>
  );
}
