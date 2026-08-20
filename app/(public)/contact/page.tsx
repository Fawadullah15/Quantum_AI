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
        {/* Statement headline */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-32, 3.5rem)' }}>
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
              fontSize: 'clamp(2.75rem, 8vw, 6.5rem)',
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: 'var(--color-text-primary, #F8FAFC)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            LET'S BUILD<br />SOMETHING<br />USEFUL.
          </h1>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left: Info Card (Opaque & High Contrast) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              backgroundColor: '#040E24',
              border: '1px solid rgba(22, 119, 255, 0.25)',
              borderRadius: '16px',
              padding: 'clamp(1.75rem, 4vw, 2.5rem)',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 25px -5px rgba(22, 119, 255, 0.15)',
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
                  marginBottom: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Direct Contact
              </div>
              <a
                href="mailto:hello@quantumai.dev"
                style={{
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.65rem)',
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
                  marginBottom: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Response Time
              </div>
              <p style={{ fontSize: '1rem', color: '#94A3B8', margin: 0, lineHeight: 1.7, fontWeight: 300 }}>
                We review all technical inquiries within 24 hours and respond with architectural scope and feasibility analysis.
              </p>
            </div>

            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.15)' }}>
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
                Engineering Focus
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['AI Systems', 'Machine Learning', 'Cloud Infra', 'Data Architecture'].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.35rem 0.75rem',
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

          {/* Right: Application Form (100% Opaque & High-Visibility Card) */}
          <div
            style={{
              backgroundColor: '#040E24',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: 'clamp(1.75rem, 4vw, 2.5rem)',
              boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.85), 0 0 30px -5px rgba(22, 119, 255, 0.2)',
            }}
          >
            {status === 'success' ? (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.25em',
                    color: '#34D399',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  ✓ Transmission Received
                </div>
                <h3
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    color: '#F8FAFC',
                    margin: 0,
                  }}
                >
                  We'll Be In Touch.
                </h3>
                <p style={{ color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
                  Our engineering team will review your requirements and respond within 24 hours.
                </p>
                <div>
                  <button
                    onClick={() => setStatus('idle')}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#F8FAFC',
                      padding: '0.75rem 2rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.2em',
                      transition: 'border-color 0.2s, background 0.2s',
                      marginTop: '0.5rem',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38BDF8')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)')}
                  >
                    SEND ANOTHER MESSAGE
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.25em',
                    color: '#38BDF8',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                    fontWeight: 600,
                  }}
                >
                  PROJECT INQUIRY FORM
                </div>

                {status === 'error' && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #EF4444',
                    borderRadius: 8,
                    color: '#FCA5A5',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}>
                    {errorMessage || 'Failed to submit message. Please try again or email hello@quantumai.dev directly.'}
                  </div>
                )}

                <div
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.25rem' }}
                >
                  <Field label="Name" name="name" required placeholder="Your full name" />
                  <Field label="Company" name="company" placeholder="Organization name" />
                </div>

                <Field label="Email" name="email" type="email" required placeholder="name@company.com" />
                <Field
                  label="Project Type"
                  name="projectType"
                  placeholder="AI System, Automation, Web Platform…"
                />

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
                    Project Details <span style={{ color: '#38BDF8' }}>*</span>
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Describe your project, problems, and technical requirements..."
                    onFocus={() => setTextFocused(true)}
                    onBlur={() => setTextFocused(false)}
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
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    marginTop: '0.5rem',
                    padding: '1.15rem',
                    background: status === 'submitting' ? '#374151' : 'linear-gradient(135deg, #1677FF, #0050B3)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    cursor: status === 'submitting' ? 'wait' : 'pointer',
                    boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
                    transition: 'background 0.2s, transform 0.1s, box-shadow 0.2s',
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
                  {status === 'submitting' ? 'TRANSMITTING...' : 'START A PROJECT →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
