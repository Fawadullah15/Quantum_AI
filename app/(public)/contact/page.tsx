'use client';

import React, { useState } from 'react';

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--color-border-2, rgba(255,255,255,0.15))',
  color: 'var(--color-text-primary, #F8FAFC)',
  padding: '1rem 0',
  fontFamily: 'var(--font-sans, inherit)',
  fontSize: '1.1rem',
  letterSpacing: '0',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s',
};

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          color: focused ? 'var(--color-text-secondary, #94A3B8)' : 'var(--color-text-tertiary, #64748B)',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
      >
        {label} {required && '*'}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          borderBottomColor: focused ? 'var(--color-text-secondary, #94A3B8)' : 'var(--color-border-2, rgba(255,255,255,0.15))',
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
        paddingTop: 'calc(var(--nav-height, 80px) * 2)',
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
        <div style={{ position: 'relative', marginBottom: 'var(--space-32, 4rem)' }}>
          {/* Subtle Indigo Glow */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 60%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0,
            transform: 'translate(-50%, -50%)'
          }} />
          <h1
            style={{
              fontSize: 'clamp(3rem, 10vw, 8rem)',
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: '-0.05em',
              color: 'var(--color-text-primary, #F8FAFC)',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-12, 1.5rem)',
            }}
          >
            LET'S BUILD<br />SOMETHING<br />USEFUL.
          </h1>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-32, 4rem)',
            borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))',
            paddingTop: 'var(--space-12, 1.5rem)',
          }}
        >
          {/* Left: info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12, 2rem)' }}>
            <div>
              <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Direct Contact</div>
              <a
                href="mailto:hello@quantumai.dev"
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--color-text-primary, #F8FAFC)',
                  borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))',
                  paddingBottom: '0.25rem',
                  transition: 'color 0.2s, border-color 0.2s',
                  display: 'inline-block',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1677FF';
                  e.currentTarget.style.borderColor = '#1677FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#F8FAFC';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                hello@quantumai.dev
              </a>
            </div>
            <div>
              <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Response Time</div>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary, #94A3B8)', margin: 0, lineHeight: 1.6 }}>
                We review all inquiries within 24 hours and respond with a structured proposal for your review.
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div>
            {status === 'success' ? (
              <div
                style={{
                  padding: 'var(--space-16, 2rem)',
                  border: '1px solid rgba(22, 119, 255, 0.3)',
                  backgroundColor: 'rgba(6, 21, 43, 0.5)',
                  borderRadius: 12,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.25em',
                    color: '#55D6FF',
                    textTransform: 'uppercase',
                  }}
                >
                  Message Received
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
                      border: '1px solid rgba(22, 119, 255, 0.4)',
                      color: '#F8FAFC',
                      padding: '0.75rem 2rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      transition: 'border-color 0.2s, background 0.2s',
                      marginTop: '0.5rem',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1677FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.4)')}
                  >
                    SEND ANOTHER MESSAGE
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                {status === 'error' && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: 8,
                    color: '#fca5a5',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}>
                    {errorMessage || 'Failed to submit message. Please try again or email hello@quantumai.dev directly.'}
                  </div>
                )}

                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}
                >
                  <Field label="Name" name="name" required />
                  <Field label="Company" name="company" />
                </div>
                <Field label="Email" name="email" type="email" required />
                <Field
                  label="Project Type"
                  name="projectType"
                  placeholder="AI Agent, RAG System, Web Platform…"
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.25em',
                      color: textFocused ? 'var(--color-text-secondary, #94A3B8)' : 'var(--color-text-tertiary, #64748B)',
                      textTransform: 'uppercase',
                      transition: 'color 0.2s',
                    }}
                  >
                    Project Details *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    onFocus={() => setTextFocused(true)}
                    onBlur={() => setTextFocused(false)}
                    style={{
                      ...inputStyle,
                      borderBottom: `1px solid ${textFocused ? 'var(--color-text-secondary, #94A3B8)' : 'var(--color-border-2, rgba(255,255,255,0.15))'}`,
                      resize: 'vertical',
                      lineHeight: 1.6,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    marginTop: '0.5rem',
                    padding: '1.25rem',
                    background: status === 'submitting' ? '#374151' : '#1677FF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    cursor: status === 'submitting' ? 'wait' : 'pointer',
                    transition: 'background 0.2s, transform 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (status !== 'submitting')
                      e.currentTarget.style.background = '#20A8FF';
                  }}
                  onMouseLeave={(e) => {
                    if (status !== 'submitting')
                      e.currentTarget.style.background = '#1677FF';
                  }}
                >
                  {status === 'submitting' ? 'SENDING...' : 'START A PROJECT →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
