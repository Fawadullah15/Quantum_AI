'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [activeReadingItem, setActiveReadingItem] = useState<TestimonialItem | null>(null);
  const [mounted, setMounted] = useState(false);

  // Submit Testimonial Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    name: '',
    company: '',
    role: '',
    rating: 5,
    content: '',
    photo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fileError, setFileError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
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

  // Handle Photo Upload in Submit Modal
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFileError('Please upload a valid PNG, JPG, or WebP image.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError('Image size exceeds 2MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setSubmitForm((prev) => ({ ...prev, photo: result }));
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Submit Testimonial Handler (Sends directly to admin panel for review)
  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!submitForm.name.trim() || !submitForm.content.trim()) {
      setSubmitError('Please fill in your name and testimonial quote.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Submission failed');
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'An error occurred while submitting your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
    setSubmitSuccess(false);
    setSubmitError('');
    setFileError('');
    setSubmitForm({
      name: '',
      company: '',
      role: '',
      rating: 5,
      content: '',
      photo: '',
    });
  };

  // Construct deterministic sequence for 1 single continuous row
  const generateSingleRowItems = (items: TestimonialItem[]) => {
    if (!items || items.length === 0) return [];
    let baseList = [...items];
    while (baseList.length < 6) {
      baseList = [...baseList, ...items];
    }
    return [...baseList, ...baseList]; // Duplicate for seamless -50% loop
  };

  const rowItems = generateSingleRowItems(testimonials);

  const renderStars = (rating: number = 5) => {
    const clamped = Math.max(1, Math.min(5, Math.round(rating)));
    return <div className="test-stars">{'★'.repeat(clamped)}</div>;
  };

  const renderCard = (t: TestimonialItem, keyIdx: string | number) => {
    const initials =
      t.name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'QA';

    return (
      <div
        key={keyIdx}
        className="test-square-card"
        onClick={() => setActiveReadingItem(t)}
        onMouseEnter={() => setIsSlowMode(true)}
        onMouseLeave={() => setIsSlowMode(false)}
        role="button"
        tabIndex={0}
        title="Click to expand and read full testimonial"
      >
        {/* Top Header: Quote Mark & Star Rating */}
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

        <div className="test-card-hint">Click to read</div>
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
          position: relative;
          z-index: 2;
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
          margin: 0 auto 1.35rem auto;
          line-height: 1.6;
          font-weight: 300;
        }

        /* Action Buttons Bar */
        .test-header-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .test-submit-btn {
          background: #1677FF;
          color: #FFFFFF;
          border: none;
          padding: 0.65rem 1.45rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(22, 119, 255, 0.4);
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          position: relative;
          z-index: 5;
        }
        .test-submit-btn:hover {
          background: #2563EB;
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(22, 119, 255, 0.55);
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
          z-index: 1;
        }

        /* ─── 1 Single Continuous Horizontal Row ─── */
        .test-row {
          display: flex;
          width: max-content;
          will-change: transform;
          user-select: none;
          animation: singleTestScrollLeft 48s linear infinite;
        }

        /* Automatic Slow down on Hover / Press */
        .test-row.is-slow {
          animation-duration: 120s;
        }

        .test-row:hover {
          animation-duration: 120s;
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
          cursor: pointer;
        }

        .test-square-card:hover {
          background-color: rgba(8, 28, 58, 0.95);
          border-color: rgba(56, 189, 248, 0.6);
          transform: scale(1.05) translateY(-4px);
          box-shadow: 0 20px 44px -10px rgba(22, 119, 255, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.4);
          z-index: 50;
        }

        .test-card-hint {
          position: absolute;
          top: 12px;
          right: 12px;
          font-family: var(--font-mono, monospace);
          font-size: 0.58rem;
          color: rgba(56, 189, 248, 0.6);
          background: rgba(22, 119, 255, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .test-square-card:hover .test-card-hint {
          opacity: 1;
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

        /* Modal Overlay */
        .test-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(2, 6, 23, 0.88);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 1.5rem;
          box-sizing: border-box;
        }
        .test-modal-card {
          background: #070E1E;
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 16px;
          padding: clamp(1.5rem, 3vw, 2.25rem);
          max-width: 560px;
          width: 100%;
          position: relative;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px rgba(22, 119, 255, 0.25);
          box-sizing: border-box;
          max-height: 90vh;
          overflow-y: auto;
          color: #F8FAFC;
        }
        .test-modal-close {
          position: absolute;
          top: 16px;
          right: 18px;
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 1.35rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        .test-modal-close:hover {
          color: #F8FAFC;
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
            animation-duration: 34s;
          }
          .test-row.is-slow {
            animation-duration: 90s;
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

        <div className="test-header-actions">
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="test-submit-btn"
          >
            <span>+</span> SHARE YOUR TESTIMONAL
          </button>
        </div>
      </div>

      {/* 1 Single Line Continuous Square Testimonial Marquee */}
      <div className="test-stage-wrapper">
        <div className={`test-row ${!isVisible ? 'is-paused' : ''} ${isSlowMode ? 'is-slow' : ''}`}>
          <div className="test-track">
            {rowItems.map((t, idx) => renderCard(t, `single-test-${idx}`))}
          </div>
        </div>
      </div>

      {/* Full Testimonial Reader Modal (Portaled to body for zero clipping) */}
      {mounted && activeReadingItem && createPortal(
        <div className="test-modal-backdrop" onClick={() => setActiveReadingItem(null)}>
          <div className="test-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="test-modal-close" onClick={() => setActiveReadingItem(null)}>
              ✕
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '2.5rem', color: '#1677FF', opacity: 0.6, lineHeight: 1, fontFamily: 'serif' }}>“</span>
              {renderStars(activeReadingItem.rating || 5)}
            </div>

            <p style={{ fontSize: '1.05rem', color: '#E2E8F0', lineHeight: 1.7, margin: '0 0 1.5rem 0', fontWeight: 300, fontStyle: 'italic' }}>
              &quot;{activeReadingItem.content}&quot;
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderTop: '1px solid rgba(22, 119, 255, 0.18)', paddingTop: '1rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(22, 119, 255, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {activeReadingItem.photo ? (
                  <img src={activeReadingItem.photo} alt={activeReadingItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#38BDF8', fontSize: '0.85rem' }}>
                    {activeReadingItem.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', margin: 0 }}>
                  {activeReadingItem.name}
                </h3>
                {(activeReadingItem.role || activeReadingItem.company) && (
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', textTransform: 'uppercase' }}>
                    {[activeReadingItem.role, activeReadingItem.company].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Submit Testimonial Modal (Portaled to body for zero clipping) */}
      {mounted && showSubmitModal && createPortal(
        <div className="test-modal-backdrop" onClick={handleCloseSubmitModal}>
          <div className="test-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="test-modal-close" onClick={handleCloseSubmitModal}>
              ✕
            </button>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.5rem 0' }}>
                  Thank You for Your Feedback!
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                  Your testimonial has been successfully received and sent to our team for administrative review. It will appear on the live slider once approved.
                </p>
                <button
                  type="button"
                  onClick={handleCloseSubmitModal}
                  style={{
                    backgroundColor: '#1677FF',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#1677FF', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  CLIENT REVIEW
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.5rem 0' }}>
                  Share Your Testimonal
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                  Submissions are reviewed by our team before appearing on the public website.
                </p>

                {submitError && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '0.6rem 0.85rem', borderRadius: 6, fontSize: '0.82rem', marginBottom: '1rem' }}>
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmitTestimonial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Tariq"
                      value={submitForm.name}
                      onChange={(e) => setSubmitForm({ ...submitForm, name: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#030712', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, color: '#F8FAFC', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                        Position / Role
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Director of Operations"
                        value={submitForm.role}
                        onChange={(e) => setSubmitForm({ ...submitForm, role: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#030712', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, color: '#F8FAFC', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Eden School System"
                        value={submitForm.company}
                        onChange={(e) => setSubmitForm({ ...submitForm, company: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#030712', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, color: '#F8FAFC', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                      Rating
                    </label>
                    <select
                      value={submitForm.rating}
                      onChange={(e) => setSubmitForm({ ...submitForm, rating: Number(e.target.value) || 5 })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#030712', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, color: '#F8FAFC', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                      <option value={4}>★★★★☆ (4 Stars - Great)</option>
                      <option value={3}>★★★☆☆ (3 Stars - Good)</option>
                      <option value={2}>★★☆☆☆ (2 Stars - Fair)</option>
                      <option value={1}>★☆☆☆☆ (1 Star - Needs Improvement)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                      Your Review / Testimonial *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Share your experience working with Quantum AI, the systems engineered, and the results achieved..."
                      value={submitForm.content}
                      onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#030712', border: '1px solid rgba(22, 119, 255, 0.25)', borderRadius: 6, color: '#F8FAFC', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                      Your Photo / Avatar (Optional)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          backgroundColor: '#030712',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {submitForm.photo ? (
                          <img src={submitForm.photo} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: '#64748B' }}>NO PHOTO</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.35)',
                          color: '#38BDF8',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          cursor: 'pointer',
                        }}
                      >
                        📁 Choose Photo File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                    {fileError && <p style={{ color: '#F87171', fontSize: '0.75rem', margin: '0.35rem 0 0 0' }}>{fileError}</p>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.15)', paddingTop: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={handleCloseSubmitModal}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        color: '#94A3B8',
                        padding: '0.55rem 1.15rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: '#1677FF',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '0.55rem 1.35rem',
                        borderRadius: 6,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        opacity: isSubmitting ? 0.7 : 1,
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
