'use client';

import React, { useState } from 'react';

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--color-border-2)',
  color: 'var(--color-text-primary)',
  padding: '1rem 0',
  fontFamily: 'var(--font-sans)',
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
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          color: focused ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
      >
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          borderBottomColor: focused ? 'var(--color-text-secondary)' : 'var(--color-border-2)',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [textFocused, setTextFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
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
      if (res.ok) setStatus('success');
      else setStatus('idle');
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div
      style={{
        paddingTop: 'calc(var(--nav-height) * 2)',
        paddingBottom: 'var(--space-48)',
        paddingInline: 'var(--container-px)',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        {/* Statement headline */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-32)' }}>
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
              color: 'var(--color-text-primary)',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-12)',
            }}
          >
            LET'S BUILD<br />SOMETHING<br />USEFUL.
          </h1>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-32)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-12)',
          }}
        >
          {/* Left: info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Direct Contact</div>
              <a
                href="mailto:hello@quantumai.dev"
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--color-text-primary)',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '0.25rem',
                  transition: 'color 0.2s, border-color 0.2s',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-core)';
                  e.currentTarget.style.borderColor = 'var(--color-core)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                hello@quantumai.dev
              </a>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Response Time</div>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                We review all inquiries within 24 hours and respond with a structured proposal for your review.
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div>
            {status === 'success' ? (
              <div
                style={{
                  padding: 'var(--space-16)',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-6)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.25em',
                    color: 'var(--color-core)',
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
                  }}
                >
                  We'll Be In Touch.
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Our engineering team will review your requirements and respond within 24 hours.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border-2)',
                    color: 'var(--color-text-primary)',
                    padding: '0.75rem 2rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    transition: 'border-color 0.2s',
                    marginTop: 'var(--space-4)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-2)')}
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}
              >
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }}
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
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.25em',
                      color: textFocused ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                      transition: 'color 0.2s',
                    }}
                  >
                    Project Details
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    onFocus={() => setTextFocused(true)}
                    onBlur={() => setTextFocused(false)}
                    style={{
                      ...inputStyle,
                      borderBottom: `1px solid ${textFocused ? 'var(--color-text-secondary)' : 'var(--color-border-2)'}`,
                      resize: 'vertical',
                      lineHeight: 1.6,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    marginTop: 'var(--space-4)',
                    padding: '1.25rem',
                    background: status === 'submitting' ? 'var(--color-border-2)' : 'var(--color-text-primary)',
                    color: 'var(--color-void)',
                    border: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    cursor: status === 'submitting' ? 'wait' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (status !== 'submitting')
                      e.currentTarget.style.background = 'var(--color-core)';
                  }}
                  onMouseLeave={(e) => {
                    if (status !== 'submitting')
                      e.currentTarget.style.background = 'var(--color-text-primary)';
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
