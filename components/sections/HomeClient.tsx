'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalStore } from '@/components/layout/GlobalStore';
import { NovaButton } from '@/components/ui/Buttons';

import dynamic from 'next/dynamic';
export const ClientParticleText = dynamic(() => import('@/components/ui/ParticleText'), { ssr: false });
export const ClientGlobalMapSection = dynamic(() => import('@/components/sections/GlobalMapSection'), { ssr: false });


export function HomeContactForm() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    projectType: '',
    budget: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: ''
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formState.name.trim()) errors.name = 'Name is required';
    if (!formState.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formState.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formState.message.trim()) errors.message = 'Message is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      if (res.ok) {
        setSubmitStatus('success');
        setFormState({
          name: '',
          email: '',
          company: '',
          projectType: '',
          budget: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ color: '#FFFFFF', fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
        <h3 style={{ fontSize: '1.5rem', color: '#FFFFFF', marginBottom: '0.5rem', textTransform: 'none' }}>Project Inquiry Sent</h3>
        <p style={{ color: '#FFFFFF', fontSize: '0.95rem', marginBottom: '2rem', fontWeight: 300 }}>Thank you for reaching out. An engineer will review your inquiry and connect with you shortly.</p>
        <NovaButton onClick={() => setSubmitStatus('idle')}>SEND ANOTHER INQUIRY</NovaButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>NAME <span style={{ color: '#FFFFFF' }}>*</span></label>
        <input
          type="text"
          name="name"
          value={formState.name}
          onChange={handleFormChange}
          placeholder="Your full name"
          style={{
            backgroundColor: '#0A181B',
            border: `1px solid ${formErrors.name ? '#EF4444' : 'rgba(20, 184, 166, 0.2)'}`,
            borderRadius: 8,
            color: '#FFFFFF',
            padding: '0.85rem 1rem',
            outline: 'none',
            fontSize: '0.95rem',
            width: '100%',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#14B8A6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.2)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = formErrors.name ? '#EF4444' : 'rgba(20, 184, 166, 0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {formErrors.name && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.name}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>EMAIL <span style={{ color: '#FFFFFF' }}>*</span></label>
        <input
          type="email"
          name="email"
          value={formState.email}
          onChange={handleFormChange}
          placeholder="name@company.com"
          style={{
            backgroundColor: '#0A181B',
            border: `1px solid ${formErrors.email ? '#EF4444' : 'rgba(20, 184, 166, 0.2)'}`,
            borderRadius: 8,
            color: '#FFFFFF',
            padding: '0.85rem 1rem',
            outline: 'none',
            fontSize: '0.95rem',
            width: '100%',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#14B8A6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.2)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = formErrors.email ? '#EF4444' : 'rgba(20, 184, 166, 0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {formErrors.email && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.email}</span>}
      </div>

      <div className="form-selects-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>PROJECT TYPE (OPTIONAL)</label>
          <select
            name="projectType"
            value={formState.projectType}
            onChange={handleFormChange}
            style={{
              backgroundColor: '#0A181B',
              border: '1px solid rgba(20, 184, 166, 0.2)',
              borderRadius: 8,
              color: formState.projectType ? '#FFFFFF' : '#888',
              padding: '0.85rem 1rem',
              outline: 'none',
              fontSize: '0.95rem',
              width: '100%',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2314B8A6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem top 50%',
              backgroundSize: '0.65rem auto',
            }}
          >
            <option value="" disabled>Select...</option>
            <option value="ai-system" style={{ color: '#000' }}>AI System / Workflows</option>
            <option value="business-software" style={{ color: '#000' }}>Custom Business Software</option>
            <option value="automation" style={{ color: '#000' }}>Automation Pipeline</option>
            <option value="digital-product" style={{ color: '#000' }}>Digital Product / Platform</option>
            <option value="other" style={{ color: '#000' }}>Other / Consulting</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>BUDGET (OPTIONAL)</label>
          <select
            name="budget"
            value={formState.budget}
            onChange={handleFormChange}
            style={{
              backgroundColor: '#0A181B',
              border: '1px solid rgba(20, 184, 166, 0.2)',
              borderRadius: 8,
              color: formState.budget ? '#FFFFFF' : '#888',
              padding: '0.85rem 1rem',
              outline: 'none',
              fontSize: '0.95rem',
              width: '100%',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2314B8A6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem top 50%',
              backgroundSize: '0.65rem auto',
            }}
          >
            <option value="" disabled>Select...</option>
            <option value="under-10k" style={{ color: '#000' }}>Under $10,000</option>
            <option value="10k-25k" style={{ color: '#000' }}>$10,000 - $25,000</option>
            <option value="25k-50k" style={{ color: '#000' }}>$25,000 - $50,000</option>
            <option value="50k-plus" style={{ color: '#000' }}>$50,000+</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>PROJECT DETAILS <span style={{ color: '#FFFFFF' }}>*</span></label>
        <textarea
          name="message"
          value={formState.message}
          onChange={handleFormChange}
          placeholder="Tell us what you're trying to build..."
          rows={5}
          style={{
            backgroundColor: '#0A181B',
            border: `1px solid ${formErrors.message ? '#EF4444' : 'rgba(20, 184, 166, 0.2)'}`,
            borderRadius: 8,
            color: '#FFFFFF',
            padding: '1rem',
            outline: 'none',
            fontSize: '0.95rem',
            width: '100%',
            resize: 'vertical',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#14B8A6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.2)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = formErrors.message ? '#EF4444' : 'rgba(20, 184, 166, 0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {formErrors.message && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.message}</span>}
      </div>

      {submitStatus === 'error' && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '1rem', borderRadius: 8, fontSize: '0.9rem' }}>
          An error occurred while sending your inquiry. Please try again or email us directly at hello@quantumai.dev.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          marginTop: '0.5rem',
          padding: '1rem',
          backgroundColor: isSubmitting ? '#0F766E' : '#14B8A6',
          color: '#020708',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.95rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(20, 184, 166, 0.4)',
          opacity: isSubmitting ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.backgroundColor = '#0F766E';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(20, 184, 166, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.backgroundColor = '#14B8A6';
            e.currentTarget.style.color = '#020708';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(20, 184, 166, 0.4)';
          }
        }}
      >
        {isSubmitting ? 'SENDING INQUIRY...' : 'SUBMIT PROJECT INQUIRY'}
      </button>
    </form>
  );
}
