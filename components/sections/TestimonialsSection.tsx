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

  // Review Modal State
  const [showModal, setShowModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFileError('Please upload a valid PNG or JPG image.');
      return;
    }

    // Validate size (max 2MB)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError('Image size exceeds 2MB limit. Please choose a smaller photo.');
      return;
    }

    // Read file as Data URL
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setReviewForm((prev) => ({ ...prev, photo: result }));
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setReviewForm((prev) => ({ ...prev, photo: '' }));
    setFileError('');
  };

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
    if (testimonials.length <= 1 || isPaused || showModal) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length, isPaused, showModal]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitSuccess(true);
      setReviewForm({ name: '', company: '', role: '', rating: 5, content: '', photo: '' });
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
              What Our Clients Say
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
              Feedback from people we have worked with.
            </p>
          </div>

          {/* Action Row: Leave Review & Nav Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setShowModal(true);
                setSubmitSuccess(false);
                setSubmitError('');
              }}
              data-trail="link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(22, 119, 255, 0.12)',
                border: '1px solid rgba(22, 119, 255, 0.35)',
                color: '#38BDF8',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.08em',
                fontWeight: 600,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.25)';
                e.currentTarget.style.borderColor = '#38BDF8';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(22, 119, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.35)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>+</span> Share Your Feedback
            </button>

            {/* Carousel Navigation Buttons (if more than 1 item) */}
            {testimonials.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handlePrev}
                  aria-label="Previous testimonial"
                  data-trail="link"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(6, 21, 43, 0.8)',
                    border: '1px solid rgba(22, 119, 255, 0.3)',
                    color: '#F8FAFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
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
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(6, 21, 43, 0.8)',
                    border: '1px solid rgba(22, 119, 255, 0.3)',
                    color: '#F8FAFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
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
        </div>

        {/* Display Cards */}
        {testimonials.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              borderRadius: 14,
              border: '1px dashed rgba(22, 119, 255, 0.2)',
              backgroundColor: 'rgba(6, 21, 43, 0.4)',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#94A3B8', fontSize: '1.05rem', margin: '0 0 1.25rem 0', fontWeight: 300 }}>
              Have you worked with Quantum AI? Be the first to share your experience.
            </p>
            <button
              onClick={() => setShowModal(true)}
              data-trail="link"
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                backgroundColor: '#1677FF',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                cursor: 'pointer',
                letterSpacing: '0.08em',
              }}
            >
              + SUBMIT A CLIENT REVIEW
            </button>
          </div>
        ) : testimonials.length <= 3 ? (
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

      {/* Review Submission Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#071224',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 16,
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(22, 119, 255, 0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '2.5rem', color: '#38BDF8', marginBottom: '1rem' }}>✓</div>
                <h3 style={{ fontSize: '1.5rem', color: '#F8FAFF', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Feedback Submitted
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                  Thank you for your review! It has been directly sent to our administration team for verification and will appear on the site once approved.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.65rem 1.75rem',
                    backgroundColor: '#1677FF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  CLOSE
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.65rem',
                      color: '#1677FF',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    PARTNER FEEDBACK
                  </span>
                  <h3 style={{ fontSize: '1.5rem', color: '#F8FAFF', fontWeight: 700, margin: 0 }}>
                    Share Your Experience
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '0.35rem', marginBottom: 0 }}>
                    Your testimonial will be reviewed by our team and published on the website.
                  </p>
                </div>

                {submitError && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#F87171',
                      fontSize: '0.85rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {/* Rating Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                      RATING *
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.6rem',
                            color: star <= reviewForm.rating ? '#38BDF8' : '#334155',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'transform 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Company */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                        YOUR NAME *
                      </label>
                      <input
                        required
                        type="text"
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                        placeholder="e.g. Sarah Jenkins"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          backgroundColor: '#040B17',
                          border: '1px solid rgba(30, 58, 138, 0.4)',
                          borderRadius: 8,
                          color: '#F8FAFF',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                        COMPANY / ORG
                      </label>
                      <input
                        type="text"
                        value={reviewForm.company}
                        onChange={(e) => setReviewForm({ ...reviewForm, company: e.target.value })}
                        placeholder="e.g. Nexus Tech"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          backgroundColor: '#040B17',
                          border: '1px solid rgba(30, 58, 138, 0.4)',
                          borderRadius: 8,
                          color: '#F8FAFF',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Role & Photo */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                        ROLE / TITLE
                      </label>
                      <input
                        type="text"
                        value={reviewForm.role}
                        onChange={(e) => setReviewForm({ ...reviewForm, role: e.target.value })}
                        placeholder="e.g. Chief Product Officer"
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          backgroundColor: '#040B17',
                          border: '1px solid rgba(30, 58, 138, 0.4)',
                          borderRadius: 8,
                          color: '#F8FAFF',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                        PHOTO (PNG / JPG, MAX 2MB)
                      </label>
                      {reviewForm.photo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.4rem 0.65rem', backgroundColor: '#040B17', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: 8, boxSizing: 'border-box' }}>
                          <img
                            src={reviewForm.photo}
                            alt="Preview"
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #38BDF8', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontFamily: 'var(--font-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            Photo selected
                          </span>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#F87171',
                              borderRadius: 4,
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-mono, monospace)'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id="testimonial-photo-input"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={handlePhotoUpload}
                            style={{ display: 'none' }}
                          />
                          <label
                            htmlFor="testimonial-photo-input"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              backgroundColor: '#040B17',
                              border: '1px dashed rgba(56, 189, 248, 0.4)',
                              borderRadius: 8,
                              color: '#38BDF8',
                              fontSize: '0.78rem',
                              fontFamily: 'var(--font-mono, monospace)',
                              cursor: 'pointer',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.2s',
                              textAlign: 'center'
                            }}
                          >
                            <span>📷</span> Upload Photo (PNG / JPG)
                          </label>
                        </div>
                      )}
                      {fileError && (
                        <p style={{ color: '#EF4444', fontSize: '0.7rem', marginTop: '0.35rem', margin: 0, fontFamily: 'var(--font-mono, monospace)' }}>
                          {fileError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Testimonial Content */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                      YOUR REVIEW / TESTIMONIAL *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                      placeholder="Share your experience working with Quantum AI, the systems built, and the outcomes delivered..."
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        backgroundColor: '#040B17',
                        border: '1px solid rgba(30, 58, 138, 0.4)',
                        borderRadius: 8,
                        color: '#F8FAFF',
                        fontSize: '0.9rem',
                        outline: 'none',
                        resize: 'vertical',
                        lineHeight: 1.5,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.85rem',
                      backgroundColor: '#1677FF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono, monospace)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {isSubmitting ? 'SUBMITTING REVIEW...' : 'SUBMIT REVIEW FOR APPROVAL'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
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
