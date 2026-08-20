'use client';

import React, { useState } from 'react';

function Field({
  label,
  name,
  type = 'text',
  required = false,
  placeholder = '',
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.6875rem',
          letterSpacing: '0.2em',
          color: focused ? '#38BDF8' : '#94A3B8',
          textTransform: 'uppercase',
          fontWeight: 600,
          transition: 'color 0.2s',
        }}
      >
        {label} {required && <span style={{ color: '#38BDF8' }}>*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        style={{
          backgroundColor: '#081735',
          border: `1px solid ${focused ? '#38BDF8' : 'rgba(56, 189, 248, 0.2)'}`,
          borderRadius: '8px',
          color: '#F8FAFC',
          padding: '0.85rem 1rem',
          fontFamily: 'var(--font-sans, inherit)',
          fontSize: '0.95rem',
          outline: 'none',
          width: '100%',
          boxShadow: focused ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [textFocused, setTextFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    const form = e.currentTarget;
    const data = {
      name:        (form.elements.namedItem('name') as HTMLInputElement).value,
      email:       (form.elements.namedItem('email') as HTMLInputElement).value,
      company:     (form.elements.namedItem('company') as HTMLInputElement).value,
      projectType: (form.elements.namedItem('projectType') as HTMLInputElement).value,
      message:     (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.error || 'Failed to submit message. Please try again or email us directly.');
        setStatus('error');
      }
    } catch {
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      setStatus('error');
    }
  };

  return (
    <div
      style={{
        paddingTop: 'calc(var(--nav-height, 80px) * 1.8)',
        paddingBottom: 'var(--space-48, 6rem)',
        paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        
        {/* ─── Top Section: Side-by-Side (Headline on Left, Info Card on Right) ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(1.5rem, 4vw, 3.5rem)',
            alignItems: 'center',
            marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
          }}
        >
          {/* Left Column: Statement headline */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                color: '#38BDF8',
                textTransform: 'uppercase',
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              SYS.CONTACT // INITIATE TRANSMISSION
            </div>
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
                color: '#F8FAFC',
                textTransform: 'uppercase',
                margin: '0 0 1.25rem 0',
              }}
            >
              LET'S BUILD<br />SOMETHING<br />USEFUL.
            </h1>
            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
                color: '#94A3B8',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: '520px',
              }}
            >
              Have an engineering challenge, intelligent software project, or enterprise partnership to explore? We architect and build systems that scale.
            </p>
          </div>

          {/* Right Column: Info Card (Side to the heading) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              backgroundColor: '#040E24',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.85), 0 0 25px -5px rgba(22, 119, 255, 0.15)',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.7rem',
                  color: '#38BDF8',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                DIRECT CONTACT
              </div>
              <a
                href="mailto:hello@quantumai.dev"
                style={{
                  fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)',
                  fontWeight: 600,
                  color: '#F8FAFC',
                  borderBottom: '1px solid rgba(56, 189, 248, 0.4)',
                  paddingBottom: '0.25rem',
                  transition: 'color 0.2s, border-color 0.2s',
                  display: 'inline-block',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#38BDF8';
                  e.currentTarget.style.borderColor = '#38BDF8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#F8FAFC';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                }}
              >
                hello@quantumai.dev
              </a>
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.7rem',
                  color: '#38BDF8',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                RESPONSE TIME
              </div>
              <p style={{ fontSize: '0.925rem', color: '#94A3B8', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
                We review all technical inquiries within 24 hours and respond with architectural scope and feasibility analysis.
              </p>
            </div>

            <div style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.7rem',
                  color: '#38BDF8',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                ENGINEERING FOCUS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['AI Systems', 'Machine Learning', 'Cloud Infra', 'Data Architecture'].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.3rem 0.7rem',
                      backgroundColor: '#081735',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '999px',
                      color: '#E2E8F0',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Section: Application / Project Form (100% Opaque & High-Visibility Card) ─── */}
        <div
          style={{
            backgroundColor: '#040E24',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: 'clamp(1.75rem, 5vw, 3rem)',
            boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.85), 0 0 30px -5px rgba(22, 119, 255, 0.2)',
          }}
        >
          {status === 'success' ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  margin: '0 auto 1.5rem',
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.2em',
                  color: '#38BDF8',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                TRANSMISSION RECEIVED
              </div>
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #F8FAFC)',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  marginBottom: '1rem',
                }}
              >
                MESSAGE LOGGED
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#94A3B8',
                  maxWidth: '440px',
                  margin: '0 auto 2rem',
                  lineHeight: 1.7,
                }}
              >
                We have received your message and will review your technical requirements within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                style={{
                  padding: '0.75rem 1.75rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#F8FAFC',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8125rem',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                SEND ANOTHER MESSAGE
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8125rem',
                  letterSpacing: '0.15em',
                  color: '#38BDF8',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>●</span> PROJECT INQUIRY & TRANSMISSION
              </div>

              {status === 'error' && (
                <div
                  style={{
                    padding: '0.875rem 1.25rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    color: '#FCA5A5',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                <Field label="YOUR NAME" name="name" required placeholder="Fawadullah" />
                <Field label="WORK EMAIL" name="email" type="email" required placeholder="fawad@company.com" />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                <Field label="ORGANIZATION / COMPANY" name="company" placeholder="Organization name" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.2em',
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    PROJECT TYPE
                  </label>
                  <select
                    name="projectType"
                    style={{
                      backgroundColor: '#081735',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      padding: '0.85rem 1rem',
                      fontFamily: 'var(--font-sans, inherit)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      width: '100%',
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#040E24', color: '#64748B' }}>Select project type...</option>
                    <option value="AI Systems Architecture" style={{ backgroundColor: '#040E24', color: '#F8FAFC' }}>AI Systems Architecture</option>
                    <option value="Machine Learning Engineering" style={{ backgroundColor: '#040E24', color: '#F8FAFC' }}>Machine Learning Engineering</option>
                    <option value="Custom Business Software" style={{ backgroundColor: '#040E24', color: '#F8FAFC' }}>Custom Business Software</option>
                    <option value="Automation Pipeline" style={{ backgroundColor: '#040E24', color: '#F8FAFC' }}>Automation Pipeline</option>
                    <option value="Enterprise Architecture Consulting" style={{ backgroundColor: '#040E24', color: '#F8FAFC' }}>Enterprise Architecture Consulting</option>
                    <option value="Other Technical Inquiry" style={{ backgroundColor: '#040E24', color: '#F8FAFC' }}>Other Technical Inquiry</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.2em',
                    color: textFocused ? '#38BDF8' : '#94A3B8',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    transition: 'color 0.2s',
                  }}
                >
                  PROJECT OVERVIEW & REQUIREMENTS <span style={{ color: '#38BDF8' }}>*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Describe your technical objectives, timeline, scope, or current operational bottleneck..."
                  style={{
                    backgroundColor: '#081735',
                    border: `1px solid ${textFocused ? '#38BDF8' : 'rgba(56, 189, 248, 0.2)'}`,
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    padding: '0.85rem 1rem',
                    fontFamily: 'var(--font-sans, inherit)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    width: '100%',
                    resize: 'vertical',
                    lineHeight: 1.6,
                    boxShadow: textFocused ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={() => setTextFocused(true)}
                  onBlur={() => setTextFocused(false)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    padding: '1rem 2.5rem',
                    background: 'linear-gradient(135deg, #1677FF, #0050B3)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: status === 'submitting' ? 'wait' : 'pointer',
                    boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
                    transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
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
                  {status === 'submitting' ? 'TRANSMITTING...' : 'TRANSMIT INQUIRY →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
