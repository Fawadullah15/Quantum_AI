'use client';

import React, { useState, useEffect } from 'react';

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

export default function TestimonialsSection({
  initialTestimonials = [],
}: {
  initialTestimonials?: TestimonialItem[];
}) {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(initialTestimonials);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Fetch latest published testimonials from live API
    fetch('/api/testimonials')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data.filter((t) => t.published !== false));
        }
      })
      .catch(() => {});
  }, []);

  // Auto-advance carousel if more than 1 item and not hovered
  useEffect(() => {
    if (testimonials.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length, isPaused]);

  // Don't render anything if there are no published testimonials (no fake data)
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section
      style={{
        padding: 'clamp(5rem, 12vh, 10rem) clamp(1.25rem, 6vw, 6rem)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(6, 21, 43, 0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-label="Client Testimonials"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 'clamp(2.5rem, 5vh, 4rem)',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#1677FF',
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              SYS.08 / TESTIMONIALS
            </p>
            <h2
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#F8FAFF',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Partner perspectives.
            </h2>
            <p
              style={{
                fontSize: '1.1rem',
                color: '#94A3B8',
                lineHeight: 1.6,
                marginTop: '0.75rem',
                marginBottom: 0,
                maxWidth: 600,
                fontWeight: 300,
              }}
            >
              Direct feedback from technical leaders and operational teams building with Quantum AI.
            </p>
          </div>

          {/* Carousel Navigation Buttons (if more than 1 item) */}
          {testimonials.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={handlePrev}
                aria-label="Previous testimonial"
                data-trail="link"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(6, 21, 43, 0.8)',
                  border: '1px solid rgba(22, 119, 255, 0.3)',
                  color: '#F8FAFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#38BDF8';
                  e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.3)';
                  e.currentTarget.style.backgroundColor = 'rgba(6, 21, 43, 0.8)';
                }}
              >
                ←
              </button>
              <button
                onClick={handleNext}
                aria-label="Next testimonial"
                data-trail="link"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(6, 21, 43, 0.8)',
                  border: '1px solid rgba(22, 119, 255, 0.3)',
                  color: '#F8FAFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#38BDF8';
                  e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.3)';
                  e.currentTarget.style.backgroundColor = 'rgba(6, 21, 43, 0.8)';
                }}
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* Display Cards */}
        {testimonials.length <= 3 ? (
          /* Grid View for 1-3 testimonials */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(320px, 1fr))`,
              gap: '1.75rem',
            }}
          >
            {testimonials.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          /* Carousel View for >3 testimonials */
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.75rem',
              }}
            >
              {[0, 1].map((offset) => {
                const item = testimonials[(currentIndex + offset) % testimonials.length];
                return item ? <TestimonialCard key={item.id} item={item} /> : null;
              })}
            </div>

            {/* Pagination Dots */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '2.5rem',
              }}
            >
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  data-trail="link"
                  style={{
                    width: currentIndex === idx ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: currentIndex === idx ? '#38BDF8' : 'rgba(22, 119, 255, 0.25)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  const rating = item.rating || 5;

  return (
    <div
      style={{
        backgroundColor: 'rgba(6, 21, 43, 0.65)',
        border: '1px solid rgba(22, 119, 255, 0.18)',
        borderRadius: 14,
        padding: 'clamp(1.5rem, 3vw, 2.25rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.45)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.18)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top Meta: Rating & Watermark */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.2rem', color: '#38BDF8', fontSize: '0.9rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ opacity: i < rating ? 1 : 0.2 }}>
              ★
            </span>
          ))}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.62rem',
            color: '#1677FF',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          VERIFIED PARTNER
        </span>
      </div>

      {/* Quote Content */}
      <p
        style={{
          color: '#F1F5F9',
          fontSize: '1.05rem',
          lineHeight: 1.65,
          fontWeight: 300,
          marginBottom: '1.75rem',
          fontStyle: 'normal',
        }}
      >
        &ldquo;{item.content}&rdquo;
      </p>

      {/* Author Details */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(22, 119, 255, 0.1)',
        }}
      >
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.name}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
            }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #0284C7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F8FAFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              fontFamily: 'var(--font-mono, monospace)',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#F8FAFF',
              margin: '0 0 0.15rem 0',
              letterSpacing: '-0.01em',
            }}
          >
            {item.name}
          </h3>
          <div
            style={{
              fontSize: '0.78rem',
              color: '#94A3B8',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {item.role ? `${item.role}` : ''}
            {item.role && item.company ? ' · ' : ''}
            {item.company ? (
              <span style={{ color: '#55D6FF' }}>{item.company}</span>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
