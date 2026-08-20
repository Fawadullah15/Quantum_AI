'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CareersPartnershipsPage() {
  const [activeTab, setActiveTab] = useState<'PARTNERSHIP' | 'CAREER'>('PARTNERSHIP');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [positions, setPositions] = useState<any[]>([]);

  // Form states
  const [partnershipType, setPartnershipType] = useState('Technology Partnership');
  const [experienceLevel, setExperienceLevel] = useState('Mid Level');
  const [workType, setWorkType] = useState('Full Time');
  const [selectedPosition, setSelectedPosition] = useState('');

  useEffect(() => {
    fetch('/api/careers-partnerships/positions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPositions(data);
          setSelectedPosition(data[0].title);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('type', activeTab);

    try {
      const res = await fetch('/api/careers-partnerships', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setReferenceId(result.referenceId);
        setStatus('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(result.error || 'Submission failed. Please verify your entries.');
        setStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error occurred while submitting. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div
      style={{
        paddingTop: 'calc(var(--nav-height, 80px) * 1.8)',
        paddingBottom: '6rem',
        paddingInline: 'clamp(1.25rem, 5vw, 4rem)',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header Eyebrow & Headline */}
        <div style={{ marginBottom: '3.5rem', textAlign: 'left' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              color: '#38BDF8',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '999px',
            }}
          >
            <span>●</span> SYS.OPPORTUNITIES // COLLABORATION & TALENT
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.75rem, 7vw, 5.5rem)',
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: '#F8FAFC',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
            }}
          >
            CAREERS &<br />PARTNERSHIPS.
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
              color: '#94A3B8',
              lineHeight: 1.7,
              maxWidth: '780px',
              fontWeight: 300,
              margin: 0,
            }}
          >
            <strong>Let's Build Something Intelligent Together.</strong> Quantum AI welcomes business partnerships, enterprise alliances, talented engineers, researchers, interns, and freelancers interested in shaping high-impact AI systems.
          </p>
        </div>

        {/* ─── Success Experience Screen ─── */}
        {status === 'success' ? (
          <div
            style={{
              backgroundColor: '#040E24',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '20px',
              padding: 'clamp(2.5rem, 6vw, 4rem)',
              textAlign: 'center',
              boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.9), 0 0 35px -5px rgba(22, 119, 255, 0.25)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 1.5rem',
              }}
            >
              ✓
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8125rem',
                letterSpacing: '0.2em',
                color: '#38BDF8',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              TRANSMISSION CONFIRMED
            </div>

            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                fontWeight: 700,
                color: '#F8FAFC',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                marginBottom: '1rem',
              }}
            >
              Submission Received
            </h2>

            <p
              style={{
                fontSize: '1.1rem',
                color: '#94A3B8',
                maxWidth: '620px',
                margin: '0 auto 1.75rem',
                lineHeight: 1.7,
              }}
            >
              Thank you for reaching out to Quantum AI. Our team has received your information and will review it carefully. If there is a suitable opportunity or partnership fit, we will contact you.
            </p>

            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#081735',
                border: '1px solid #1677FF',
                padding: '0.875rem 1.75rem',
                borderRadius: '8px',
                marginBottom: '2.5rem',
              }}
            >
              <span style={{ color: '#64748B', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                REFERENCE ID
              </span>
              <span style={{ color: '#38BDF8', fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em' }}>
                {referenceId}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.875rem 2rem',
                  background: 'linear-gradient(135deg, #1677FF, #0050B3)',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8125rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
                }}
              >
                Return Home
              </Link>
              <button
                onClick={() => setStatus('idle')}
                style={{
                  padding: '0.875rem 1.75rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#F8FAFC',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8125rem',
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* ─── Two Clear Selectable Options ─── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem',
              }}
            >
              {/* Option A: Business Partnership */}
              <div
                onClick={() => setActiveTab('PARTNERSHIP')}
                style={{
                  padding: '2rem',
                  backgroundColor: activeTab === 'PARTNERSHIP' ? '#081735' : '#040E24',
                  border: activeTab === 'PARTNERSHIP' ? '2px solid #38BDF8' : '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'PARTNERSHIP' ? '0 12px 36px -6px rgba(22, 119, 255, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#38BDF8', letterSpacing: '0.15em', fontWeight: 600 }}>
                    OPTION 01 // ENTERPRISE
                  </span>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid #38BDF8',
                      backgroundColor: activeTab === 'PARTNERSHIP' ? '#38BDF8' : 'transparent',
                    }}
                  />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                  Business Partnership
                </h2>
                <p style={{ color: '#94A3B8', fontSize: '0.9375rem', lineHeight: 1.6, margin: '0 0 1.25rem 0', minHeight: '44px' }}>
                  For companies, organizations, investors, agencies, and enterprise clients seeking technical collaboration.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
                  Partner With Us →
                </div>
              </div>

              {/* Option B: Join Quantum AI */}
              <div
                onClick={() => setActiveTab('CAREER')}
                style={{
                  padding: '2rem',
                  backgroundColor: activeTab === 'CAREER' ? '#081735' : '#040E24',
                  border: activeTab === 'CAREER' ? '2px solid #38BDF8' : '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'CAREER' ? '0 12px 36px -6px rgba(22, 119, 255, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#38BDF8', letterSpacing: '0.15em', fontWeight: 600 }}>
                    OPTION 02 // CAREERS
                  </span>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid #38BDF8',
                      backgroundColor: activeTab === 'CAREER' ? '#38BDF8' : 'transparent',
                    }}
                  />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                  Join Quantum AI
                </h2>
                <p style={{ color: '#94A3B8', fontSize: '0.9375rem', lineHeight: 1.6, margin: '0 0 1.25rem 0', minHeight: '44px' }}>
                  For talented engineers, researchers, interns, and freelancers seeking full-time, contract, or future opportunities.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
                  Join Our Team →
                </div>
              </div>
            </div>

            {/* ─── Form Container (100% Opaque & High-Visibility) ─── */}
            <div
              style={{
                backgroundColor: '#040E24',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '16px',
                padding: 'clamp(1.75rem, 4vw, 3rem)',
                boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.85), 0 0 30px -5px rgba(22, 119, 255, 0.2)',
              }}
            >
              {errorMessage && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    color: '#FCA5A5',
                    fontSize: '0.875rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {activeTab === 'PARTNERSHIP' ? (
                  <>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
                      BUSINESS PARTNERSHIP APPLICATION
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Full Name <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <input required name="fullName" placeholder="Jane Doe" style={inputBoxStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Company / Organization
                        </label>
                        <input name="company" placeholder="Acme Corp" style={inputBoxStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Work Email <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <input required type="email" name="email" placeholder="jane@acme.com" style={inputBoxStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Phone / WhatsApp
                        </label>
                        <input name="phone" placeholder="+1 (555) 000-0000" style={inputBoxStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Website
                        </label>
                        <input name="website" placeholder="https://acme.com" style={inputBoxStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Country / Region
                        </label>
                        <input name="country" placeholder="United States / United Kingdom" style={inputBoxStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Partnership Type <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <select
                          name="partnershipType"
                          value={partnershipType}
                          onChange={(e) => setPartnershipType(e.target.value)}
                          style={inputBoxStyle}
                        >
                          <option value="Technology Partnership">Technology Partnership</option>
                          <option value="Business Partnership">Business Partnership</option>
                          <option value="Strategic Partnership">Strategic Partnership</option>
                          <option value="Marketing Partnership">Marketing Partnership</option>
                          <option value="Investment">Investment</option>
                          <option value="Outsourcing">Outsourcing</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Budget / Project Range
                        </label>
                        <select name="budgetRange" style={inputBoxStyle}>
                          <option value="Under $25,000">Under $25,000</option>
                          <option value="$25,000 - $75,000">$25,000 - $75,000</option>
                          <option value="$75,000 - $200,000">$75,000 - $200,000</option>
                          <option value="$200,000+">$200,000+</option>
                          <option value="Flexible / Strategic">Flexible / Strategic</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                        Subject <span style={{ color: '#38BDF8' }}>*</span>
                      </label>
                      <input required name="subject" placeholder="e.g. Strategic AI Integration Alliance" style={inputBoxStyle} />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                        Partnership Proposal / Message <span style={{ color: '#38BDF8' }}>*</span>
                      </label>
                      <textarea
                        required
                        name="message"
                        rows={4}
                        placeholder="Detail your partnership goals, technical scope, and expected timeline..."
                        style={inputBoxStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Preferred Contact Method
                        </label>
                        <select name="preferredContactMethod" style={inputBoxStyle}>
                          <option value="Email">Email</option>
                          <option value="Phone / WhatsApp">Phone / WhatsApp</option>
                          <option value="Video Call (Google Meet / Zoom)">Video Call (Google Meet / Zoom)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Company Profile / Deck (PDF/DOCX, Optional)
                        </label>
                        <input type="file" name="attachment" accept=".pdf,.doc,.docx,.zip,.png,.jpg" style={fileInputStyle} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
                      CAREER APPLICATION
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Full Name <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <input required name="fullName" placeholder="Alex Rivers" style={inputBoxStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Email <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <input required type="email" name="email" placeholder="alex@domain.com" style={inputBoxStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Phone / WhatsApp
                        </label>
                        <input name="phone" placeholder="+1 (555) 000-0000" style={inputBoxStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Current Location (City, Country)
                        </label>
                        <input name="currentLocation" placeholder="San Francisco, US / Remote" style={inputBoxStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Position Applying For <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        {positions.length > 0 ? (
                          <select
                            name="position"
                            value={selectedPosition}
                            onChange={(e) => setSelectedPosition(e.target.value)}
                            style={inputBoxStyle}
                          >
                            {positions.map((p) => (
                              <option key={p.id || p.title} value={p.title}>
                                {p.title} ({p.department})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input required name="position" defaultValue="AI / Machine Learning Engineer" style={inputBoxStyle} />
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Experience Level <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <select
                          name="experienceLevel"
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          style={inputBoxStyle}
                        >
                          <option value="Student">Student</option>
                          <option value="Entry Level">Entry Level</option>
                          <option value="Junior">Junior</option>
                          <option value="Mid Level">Mid Level</option>
                          <option value="Senior">Senior</option>
                          <option value="Lead">Lead</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Preferred Work Type <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <select
                          name="workType"
                          value={workType}
                          onChange={(e) => setWorkType(e.target.value)}
                          style={inputBoxStyle}
                        >
                          <option value="Full Time">Full Time</option>
                          <option value="Part Time">Part Time</option>
                          <option value="Internship">Internship</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Contract">Contract</option>
                          <option value="Remote">Remote</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Core Technical Skills <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <input required name="skills" placeholder="e.g. PyTorch, Next.js, CUDA, Vector DBs" style={inputBoxStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          LinkedIn URL
                        </label>
                        <input name="linkedinUrl" placeholder="https://linkedin.com/in/..." style={inputBoxStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          GitHub URL
                        </label>
                        <input name="githubUrl" placeholder="https://github.com/..." style={inputBoxStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Portfolio / Website
                        </label>
                        <input name="portfolioUrl" placeholder="https://..." style={inputBoxStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                        Short Introduction & Engineering Background <span style={{ color: '#38BDF8' }}>*</span>
                      </label>
                      <textarea
                        required
                        name="introduction"
                        rows={3}
                        placeholder="Summarize your past work, proudest engineering achievements, and technical strengths..."
                        style={inputBoxStyle}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                        Why do you want to work with Quantum AI?
                      </label>
                      <textarea
                        name="whyQuantumAI"
                        rows={2}
                        placeholder="What drives your interest in our neural architectures and team?"
                        style={inputBoxStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Upload Resume / CV (PDF, DOCX) <span style={{ color: '#38BDF8' }}>*</span>
                        </label>
                        <input required type="file" name="resume" accept=".pdf,.doc,.docx" style={fileInputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                          Additional Portfolio / Documents (Optional)
                        </label>
                        <input type="file" name="additionalDocs" accept=".pdf,.doc,.docx,.zip" style={fileInputStyle} />
                      </div>
                    </div>
                  </>
                )}

                {/* Consent Checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '0.5rem' }}>
                  <input
                    required
                    type="checkbox"
                    name="consent"
                    id="consent"
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <label htmlFor="consent" style={{ color: '#94A3B8', fontSize: '0.8125rem', lineHeight: 1.5, cursor: 'pointer' }}>
                    I agree to the processing of my submission and attached documents by Quantum AI in accordance with privacy and security policies. <span style={{ color: '#38BDF8' }}>*</span>
                  </label>
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    marginTop: '0.75rem',
                    padding: '1.2rem',
                    background: status === 'submitting' ? '#374151' : 'linear-gradient(135deg, #1677FF, #0050B3)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    cursor: status === 'submitting' ? 'wait' : 'pointer',
                    boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase',
                  }}
                  onMouseEnter={(e) => {
                    if (status !== 'submitting') {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #20A8FF, #1677FF)';
                      e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(32, 168, 255, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (status !== 'submitting') {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #1677FF, #0050B3)';
                      e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(22, 119, 255, 0.5)';
                    }
                  }}
                >
                  {status === 'submitting'
                    ? 'TRANSMITTING...'
                    : activeTab === 'PARTNERSHIP'
                    ? 'SUBMIT PARTNERSHIP PROPOSAL →'
                    : 'SUBMIT CAREER APPLICATION →'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputBoxStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  backgroundColor: '#081735',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  borderRadius: '8px',
  color: '#F8FAFC',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const fileInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 1rem',
  backgroundColor: '#081735',
  border: '1px dashed rgba(56, 189, 248, 0.35)',
  borderRadius: '8px',
  color: '#94A3B8',
  fontSize: '0.85rem',
  outline: 'none',
  cursor: 'pointer',
};
