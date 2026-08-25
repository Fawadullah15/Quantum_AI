'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface TestimonialItem {
  id: string;
  name: string;
  company?: string | null;
  role?: string | null;
  content: string;
  rating?: number;
  photo?: string | null;
  published?: boolean;
  order?: number;
}

const FALLBACK_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    name: 'Muhammad Tariq',
    role: 'Director of Academic Operations',
    company: 'Eden School System',
    content: 'Quantum AI engineered our centralized school operations platform, eliminating manual attendance tracking and unifying our multi-branch administration into one real-time digital system.',
    rating: 5,
    photo: '',
    published: true,
    order: 1,
  },
  {
    id: 't-2',
    name: 'Saad Al-Mansoor',
    role: 'Head of Automation',
    company: 'Inventra Design & Automation',
    content: 'The workflow automation and telemetry pipeline deployed by Quantum AI eliminated recurring administrative bottlenecks and reduced operational cycle times across all production lines.',
    rating: 5,
    photo: '',
    published: true,
    order: 2,
  },
  {
    id: 't-3',
    name: 'Dr. Usman Farooq',
    role: 'VP of Systems Engineering',
    company: 'Emerge Technologies',
    content: 'Their deep technical understanding of semantic embeddings and PostgreSQL indexing allowed us to deploy an enterprise knowledge retrieval platform with sub-second response times.',
    rating: 5,
    photo: '',
    published: true,
    order: 3,
  },
  {
    id: 't-4',
    name: 'Bilal Hashmi',
    role: 'Operations Lead',
    company: 'Nexus Industrial Logistics',
    content: 'The custom dispatch and inventory synchronization software transformed our daily operations. Fast, reliable, and built precisely around our team’s actual warehouse workflows.',
    rating: 5,
    photo: '',
    published: true,
    order: 4,
  },
  {
    id: 't-5',
    name: 'Hamza Zubair',
    role: 'Founder & CTO',
    company: 'AeroDynamics Labs',
    content: 'Working with Quantum AI was seamless from system architecture to production rollout. The automated pipeline and telemetry systems they engineered exceeded our expectations.',
    rating: 5,
    photo: '',
    published: true,
    order: 5,
  },
  {
    id: 't-6',
    name: 'Rashid Kamal',
    role: 'Managing Director',
    company: 'Crescent Financial Systems',
    content: 'Quantum AI built a dependable, secure API bridge between our legacy database and modern web portal. Our reporting cycle went from hours of manual collation to instant automated summaries.',
    rating: 5,
    photo: '',
    published: true,
    order: 6,
  },
];

export default function TestimonialsSection({
  initialTestimonials = [],
}: {
  initialTestimonials?: TestimonialItem[];
}) {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(
    initialTestimonials.length > 0 ? initialTestimonials : FALLBACK_TESTIMONIALS
  );
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const activeList = data.filter((t: TestimonialItem) => t.published !== false);
          if (activeList.length > 0) {
            setTestimonials(activeList);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Viewport intersection observer for CPU-friendly animation activation
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
  const generateSingleRowItems = (items: TestimonialItem[]) => {
    if (!items || items.length === 0) return [];
    let baseList = [...items];
    while (baseList.length < 6) {
      baseList = [...baseList, ...items];
    }
    // Duplicate exactly once for mathematically seamless -50% marquee loop
    return [...baseList, ...baseList];
  };

  const rowItems = generateSingleRowItems(testimonials);

  const renderStars = (rating: number = 5) => {
    const clamped = Math.max(1, Math.min(5, Math.round(rating)));
    return (
      <div className="test-stars">
        {'★'.repeat(clamped)}
      </div>
    );
  };

  const renderCard = (t: TestimonialItem, keyIdx: string | number) => {
    const initials = t.name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'QA';

    return (
      <div key={keyIdx} className="test-square-card">
        {/* Top Header: Large Quote Mark & Star Rating */}
        <div className="test-card-top">
          <span className="test-quote-mark">“</span>
          {renderStars(t.rating || 5)}
        </div>

        {/* Middle: Testimonial Quote Text */}
        <div className="test-card-body">
          <p className="test-quote-text">{t.content}</p>
        </div>

        {/* Bottom: Author & Organization Info */}
        <div className="test-card-footer">
          <div className="test-avatar-box">
            {t.photo ? (
              <img
                src={t.photo}
                alt={t.name}
                className="test-avatar-img"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="test-avatar-initials">{initials}</div>
            )}
          </div>

          <div className="test-author-details">
            <h4 className="test-author-name">{t.name}</h4>
            {(t.role || t.company) && (
              <div className="test-author-role">
                {[t.role, t.company].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section ref={sectionRef} id="testimonials-section" className="test-marquee-section">
      <style>{`
        .test-marquee-section {
          padding: clamp(3.5rem, 6.5vh, 5.5rem) 0;
          background: radial-gradient(circle at 50% 50%, rgba(10, 32, 68, 0.28) 0%, rgba(3, 7, 18, 0.98) 85%);
          border-top: 1px solid rgba(22, 119, 255, 0.14);
          border-bottom: 1px solid rgba(22, 119, 255, 0.14);
          position: relative;
          overflow: hidden;
          color: #F8FAFC;
        }

        /* ─── Header ─── */
        .test-header {
          text-align: center;
          margin-bottom: clamp(2rem, 4vw, 3.25rem);
          padding: 0 clamp(1.25rem, 4vw, 3rem);
        }
        .test-tag {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #1677FF;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .test-title {
          font-size: clamp(1.6rem, 3.5vw, 2.5rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #F8FAFF;
          margin: 0 0 0.65rem 0;
          text-transform: uppercase;
        }
        .test-subtitle {
          font-size: clamp(0.88rem, 1.2vw, 1.05rem);
          color: #94A3B8;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.6;
          font-weight: 300;
        }

        /* ─── Edge Gradient Masking ─── */
        .test-stage-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
          padding: 0.75rem 0;
        }

        /* ─── 1 Single Continuous Horizontal Row ─── */
        .test-row {
          display: flex;
          width: max-content;
          will-change: transform;
          user-select: none;
          animation: singleTestScrollLeft 45s linear infinite;
        }

        .test-row:hover {
          animation-play-state: paused;
        }

        /* Continuous Left Movement */
        @keyframes singleTestScrollLeft {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .test-track {
          display: flex;
          align-items: center;
          gap: clamp(1.25rem, 2.5vw, 2rem);
          padding: 0 0.75rem;
        }

        /* ─── SQUARE TESTIMONIAL CARD ─── */
        .test-square-card {
          width: clamp(270px, 28vw, 320px);
          aspect-ratio: 1 / 1;
          background: rgba(6, 21, 43, 0.78);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(22, 119, 255, 0.18);
          border-radius: 18px;
          padding: clamp(1.25rem, 2.2vw, 1.65rem);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-shrink: 0;
          box-sizing: border-box;
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.25s ease,
                      background-color 0.25s ease,
                      box-shadow 0.25s ease;
          position: relative;
        }

        .test-square-card:hover {
          background-color: rgba(8, 28, 58, 0.95);
          border-color: rgba(56, 189, 248, 0.6);
          transform: scale(1.05) translateY(-4px);
          box-shadow: 0 20px 44px -10px rgba(22, 119, 255, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.4);
          z-index: 50;
        }

        /* Top Row */
        .test-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .test-quote-mark {
          font-family: serif;
          font-size: 2.25rem;
          line-height: 1;
          color: #1677FF;
          opacity: 0.6;
          user-select: none;
        }
        .test-stars {
          color: #F59E0B;
          font-size: 0.88rem;
          letter-spacing: 0.12em;
          line-height: 1;
        }

        /* Body Quote */
        .test-card-body {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 0.4rem 0;
        }
        .test-quote-text {
          font-size: clamp(0.82rem, 1.1vw, 0.88rem);
          color: #CBD5E1;
          line-height: 1.55;
          margin: 0;
          font-weight: 300;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Bottom Author Info */
        .test-card-footer {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-top: 1px solid rgba(22, 119, 255, 0.12);
          padding-top: 0.75rem;
        }
        .test-avatar-box {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(22, 119, 255, 0.18);
          border: 1px solid rgba(56, 189, 248, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .test-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .test-avatar-initials {
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          font-weight: 700;
          color: #38BDF8;
        }

        .test-author-details {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow: hidden;
        }
        .test-author-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: #F8FAFC;
          margin: 0;
          line-height: 1.25;
          white-space: normal;
        }
        .test-author-role {
          font-family: var(--font-mono, monospace);
          font-size: 0.62rem;
          color: #38BDF8;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          line-height: 1.3;
          white-space: normal;
        }

        /* Mobile View (< 768px) */
        @media (max-width: 768px) {
          .test-square-card {
            width: 240px;
            padding: 1.15rem;
            border-radius: 14px;
          }
          .test-quote-text {
            font-size: 0.78rem;
            -webkit-line-clamp: 4;
          }
          .test-author-name {
            font-size: 0.82rem;
          }
          .test-row {
            animation-duration: 32s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .test-row {
            animation: none !important;
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
          }
          .test-stage-wrapper {
            mask-image: none;
            -webkit-mask-image: none;
          }
        }
      `}</style>

      {/* Section Header */}
      <div className="test-header">
        <div className="test-tag">SYS.08 / TESTIMONIALS & REPUTATION</div>
        <h2 className="test-title">WHAT OUR CLIENTS SAY.</h2>
        <p className="test-subtitle">
          Real experiences from the people and organizations we&apos;ve worked with.
        </p>
      </div>

      {/* 1 Single Line Continuous Square Testimonial Marquee */}
      <div className="test-stage-wrapper">
        <div className={`test-row ${!isVisible ? 'paused' : ''}`}>
          <div className="test-track">
            {rowItems.map((t, idx) => renderCard(t, `single-test-${idx}`))}
          </div>
        </div>
      </div>
    </section>
  );
}
