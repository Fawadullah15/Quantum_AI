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
          setClients(data);
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

  // Construct deterministic permutations for 4 distinct rows
  const generateRowItems = (items: ClientItem[], shiftOffset: number) => {
    if (!items || items.length === 0) return [];
    // Ensure we have at least 8 items per row before duplicating to guarantee full viewport coverage
    let baseList = [...items];
    while (baseList.length < 8) {
      baseList = [...baseList, ...items];
    }
    // Shift elements deterministically so each row starts with a different sequence
    const len = baseList.length;
    const shifted = baseList.map((_, i) => baseList[(i + shiftOffset) % len]);
    // Duplicate exactly once for mathematically seamless -50% marquee loop
    return [...shifted, ...shifted];
  };

  const row1 = generateRowItems(clients, 0);
  const row2 = generateRowItems(clients, 3);
  const row3 = generateRowItems(clients, 6);
  const row4 = generateRowItems(clients, 9);

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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 3h6v4H9z" />
              </svg>
              <span>{client.name.slice(0, 10)}</span>
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
          padding: clamp(3.5rem, 6.5vh, 6rem) 0;
          background: radial-gradient(circle at 50% 50%, rgba(10, 32, 68, 0.3) 0%, rgba(3, 7, 18, 0.98) 80%);
          border-top: 1px solid rgba(22, 119, 255, 0.14);
          border-bottom: 1px solid rgba(22, 119, 255, 0.14);
          position: relative;
          overflow: hidden;
          color: #F8FAFC;
        }

        /* ─── Header ─── */
        .clients-marquee-header {
          text-align: center;
          margin-bottom: clamp(2rem, 4vw, 3.5rem);
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
          gap: clamp(0.85rem, 1.8vw, 1.35rem);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
        }

        /* ─── Infinite Marquee Rows ─── */
        .marquee-row {
          display: flex;
          width: max-content;
          will-change: transform;
          user-select: none;
        }

        .marquee-row:hover {
          animation-play-state: paused;
        }

        /* Continuous Left Movement */
        @keyframes scrollLeft {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* Continuous Right Movement */
        @keyframes scrollRight {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        /* Speed variations for natural rhythm */
        .row-left-1 {
          animation: scrollLeft 34s linear infinite;
        }
        .row-right-2 {
          animation: scrollRight 44s linear infinite;
        }
        .row-left-3 {
          animation: scrollLeft 38s linear infinite;
        }
        .row-right-4 {
          animation: scrollRight 48s linear infinite;
        }

        .marquee-track {
          display: flex;
          align-items: center;
          gap: clamp(0.85rem, 2vw, 1.35rem);
          padding: 0 0.5rem;
        }

        /* ─── Logo Pill Card ─── */
        .marquee-card {
          position: relative;
          background: rgba(6, 21, 43, 0.72);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(22, 119, 255, 0.16);
          border-radius: 12px;
          padding: 0.75rem clamp(1.25rem, 2.5vw, 1.85rem);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          min-width: 175px;
          max-width: 230px;
          height: 82px;
          flex-shrink: 0;
          box-sizing: border-box;
          box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.45);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.25s ease,
                      background-color 0.25s ease,
                      box-shadow 0.25s ease;
        }

        .marquee-card:hover {
          background-color: rgba(8, 28, 58, 0.95);
          border-color: rgba(56, 189, 248, 0.6);
          transform: scale(1.08) translateY(-3px);
          box-shadow: 0 16px 36px -8px rgba(22, 119, 255, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.4);
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
          max-width: 155px;
          max-height: 52px;
          object-fit: contain;
          transition: transform 0.25s ease, filter 0.25s ease;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
        }

        .marquee-card:hover .marquee-logo-img {
          transform: scale(1.04);
          filter: drop-shadow(0 4px 12px rgba(56, 189, 248, 0.35));
        }

        .marquee-placeholder {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          color: #38BDF8;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        /* ─── Hover Tooltip ─── */
        .marquee-tooltip {
          position: absolute;
          bottom: -32px;
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: rgba(3, 7, 18, 0.94);
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 6px;
          padding: 0.25rem 0.65rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          z-index: 100;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
        }

        .marquee-card:hover .marquee-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .marquee-tooltip-name {
          font-size: 0.68rem;
          font-weight: 600;
          color: #F8FAFC;
        }

        .marquee-tooltip-ind {
          font-family: var(--font-mono, monospace);
          font-size: 0.58rem;
          color: #38BDF8;
          text-transform: uppercase;
        }

        /* ─── Responsive Adjustments ─── */
        @media (max-width: 768px) {
          .marquee-card {
            min-width: 140px;
            max-width: 175px;
            height: 68px;
            padding: 0.5rem 0.85rem;
          }
          .marquee-logo-img {
            max-width: 120px;
            max-height: 40px;
          }
          .row-left-1 {
            animation-duration: 26s;
          }
          .row-right-2 {
            animation-duration: 32s;
          }
          .row-left-3 {
            animation-duration: 28s;
          }
          .row-right-4 {
            animation-duration: 36s;
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

      {/* Multi-Row Continuous Sliding Stage */}
      <div className="marquee-stage-wrapper">
        {/* ROW 1: Moves Left */}
        <div className={`marquee-row row-left-1 ${!isVisible ? 'paused' : ''}`}>
          <div className="marquee-track">
            {row1.map((client, idx) => renderLogoCard(client, `r1-${idx}`))}
          </div>
        </div>

        {/* ROW 2: Moves Right */}
        <div className={`marquee-row row-right-2 ${!isVisible ? 'paused' : ''}`}>
          <div className="marquee-track">
            {row2.map((client, idx) => renderLogoCard(client, `r2-${idx}`))}
          </div>
        </div>

        {/* ROW 3: Moves Left */}
        <div className={`marquee-row row-left-3 ${!isVisible ? 'paused' : ''}`}>
          <div className="marquee-track">
            {row3.map((client, idx) => renderLogoCard(client, `r3-${idx}`))}
          </div>
        </div>

        {/* ROW 4: Moves Right */}
        <div className={`marquee-row row-right-4 ${!isVisible ? 'paused' : ''}`}>
          <div className="marquee-track">
            {row4.map((client, idx) => renderLogoCard(client, `r4-${idx}`))}
          </div>
        </div>
      </div>
    </section>
  );
}
