'use client';

import React, { useState, useRef } from 'react';
import styles from './ContactSection.module.css';

const ContactSection: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (formData: FormData) => {
    const newErrors: Record<string, string> = {};
    if (!formData.get('name')) newErrors.name = 'Name is required';
    const email = formData.get('email') as string;
    if (!email) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!formData.get('message')) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          company: formData.get('company') || undefined,
          phone: formData.get('phone') || undefined,
          projectType: formData.get('projectType') || undefined,
          budget: formData.get('budget') || undefined,
          message: formData.get('message'),
        }),
      })
      if (!res.ok) throw new Error('Submission failed')
      
      setSubmitStatus('success');
      formRef.current.reset();
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.leftCol}>
          <div className={styles.label}>[11 — CONTACT]</div>
          <h2 className={styles.heading}>
            LET'S BUILD<br />
            SOMETHING<br />
            INTELLIGENT.
          </h2>
          <div className={styles.contactInfo}>
            <a href="mailto:hello@quantumai.dev" className={styles.email}>hello@quantumai.dev</a>
            <p className={styles.note}>We respond to serious inquiries within 24 hours.</p>
          </div>
        </div>

        <div className={styles.rightCol}>
          {submitStatus === 'success' ? (
            <div className={styles.successMessage}>
              <h3>MESSAGE RECEIVED</h3>
              <p>We'll be in touch shortly to discuss your project.</p>
              <button onClick={() => setSubmitStatus('idle')} className={styles.resetBtn}>
                Send another message
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Name *" 
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                />
              </div>

              <div className={styles.inputGroup}>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email *" 
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <input 
                    type="text" 
                    name="company" 
                    placeholder="Company (Optional)" 
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input 
                    type="tel" 
                    name="phone" 
                    placeholder="Phone (Optional)" 
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <select name="projectType" className={styles.select}>
                    <option value="">Project Type...</option>
                    <option value="AI Systems">AI Systems</option>
                    <option value="AI Agents">AI Agents</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Custom Software">Custom Software</option>
                    <option value="SaaS Product">SaaS Product</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <select name="budget" className={styles.select}>
                    <option value="">Budget...</option>
                    <option value="< $5k">&lt; $5k</option>
                    <option value="$5k-$20k">$5k-$20k</option>
                    <option value="$20k-$50k">$20k-$50k</option>
                    <option value="$50k+">$50k+</option>
                    <option value="discuss">Let's discuss</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <textarea 
                  name="message" 
                  placeholder="Tell us about your project *" 
                  rows={4}
                  className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                ></textarea>
              </div>

              {submitStatus === 'error' && (
                <div className={styles.errorMessage}>
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={styles.submitBtn}
              >
                {isSubmitting ? 'SENDING...' : 'START THE CONVERSATION'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
