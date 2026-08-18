'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGlobalStore } from '@/components/layout/GlobalStore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { NovaButton, GalaxyButton, ButtonStyles } from '@/components/ui/Buttons';

const ParticleText = dynamic(() => import('@/components/ui/ParticleText'), { ssr: false });
const GlobalMapSection = dynamic(() => import('@/components/sections/GlobalMapSection'), { ssr: false });

export default function HomePage() {
  const { setScrollProgress } = useGlobalStore();
  const [isMounted, setIsMounted] = useState(false);

  // Contact Form State
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

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      setScrollProgress(Math.max(0, Math.min(1, window.scrollY / maxScroll)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollProgress]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
    // Clear errors as user types
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: ''
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
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
  return (
    <>
      <ButtonStyles />
      <style>{`
        /* ── Mobile Responsive Grid Overrides ── */
        @media (max-width: 380px) {
          .solutions-grid { grid-template-columns: 1fr !important; }
          .tech-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 381px) and (max-width: 640px) {
          .solutions-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .solutions-grid > a { padding: 1.25rem !important; }
          .tech-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.875rem !important; }
          .tech-grid > div { padding: 1.25rem !important; }
        }
        @media (max-width: 640px) {
          /* Hero heading */
          .hero-eyebrow { letter-spacing: 0.15em !important; font-size: 0.7rem !important; }
          /* Section padding */
          section { padding-left: clamp(1rem, 4vw, 2rem) !important; padding-right: clamp(1rem, 4vw, 2rem) !important; }
          /* Contact form 2-column selects → 1-col on tiny screens */
          .form-selects-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          /* Tag overflow fix */
          .tech-grid > div [style*="whiteSpace: nowrap"] { white-space: normal !important; }
        }
        /* Reduced motion: skip particle canvas */
        @media (prefers-reduced-motion: reduce) {
          canvas { display: none !important; }
        }
      `}</style>
      <div style={{ position: 'relative', width: '100%', pointerEvents: 'none' }}>

        {/* ═══════════════════════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            padding: 'clamp(7rem, 12vh, 10rem) clamp(1.25rem, 6vw, 6rem) clamp(4rem, 8vh, 6rem)',
            position: 'relative',
          }}
        >
          {/* Semantic H1 for SEO & accessibility — visually hidden */}
          <h1 className="sr-only">We Build Intelligent Software — Quantum AI</h1>

          <div style={{ maxWidth: 860, pointerEvents: 'auto', position: 'relative', zIndex: 2 }}>
            {/* Small Eyebrow */}
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '1.25rem',
              fontWeight: 600,
            }}>
              QUANTUM AI
            </p>

            {/* ParticleText visual headline */}
            <div style={{
              height: 'clamp(220px, 35vw, 340px)',
              width: 'clamp(280px, 92vw, 860px)',
              marginBottom: '2rem',
            }}>
              <ParticleText
                text={`WE BUILD\nINTELLIGENT\nSOFTWARES`}
                fontSize={95}
                particleDensity={3}
                particleSize={1.4}
                textColor="#F8FAFF"
                friction={0.87}
                ease={0.06}
                mouseRadius={110}
                mouseRepelForce={12}
                fontFamily="'Space Grotesk', sans-serif"
              />
            </div>

            {/* Supporting copy */}
            <p style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.35rem)',
              color: '#94A3B8',
              lineHeight: 1.7,
              marginBottom: '3rem',
              maxWidth: 560,
              fontWeight: 300,
            }}>
              AI systems, software, automation, and digital products built to solve real business problems.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <NovaButton href="/contact">START A PROJECT</NovaButton>
              <GalaxyButton href="/work">EXPLORE OUR WORK</GalaxyButton>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SOLUTIONS SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(6rem, 14vh, 12rem) clamp(1.25rem, 6vw, 6rem)', pointerEvents: 'auto' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '1.5rem',
              maxWidth: 'none',
              fontWeight: 600,
            }}>
              SOLUTIONS
            </p>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 6vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#F8FAFF',
              marginBottom: '1rem',
              textTransform: 'uppercase',
            }}>
              Systems built to execute.
            </h2>
            <p style={{
              fontSize: '1.15rem',
              color: '#64748B',
              lineHeight: 1.7,
              marginBottom: 'clamp(3rem, 6vh, 5rem)',
              maxWidth: 560,
              fontWeight: 300,
            }}>
              We construct custom software architectures designed to fit directly into your business model and operational workflow.
            </p>

            <div
              className="solutions-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5px',
                background: 'rgba(22, 119, 255, 0.08)',
                border: '1px solid rgba(22, 119, 255, 0.08)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {[
                {
                  num: '01',
                  title: 'AI Systems',
                  desc: 'Custom AI systems for business workflows and intelligent decision making.',
                  visual: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="4" stroke="#1677FF" fill="rgba(22,119,255,0.1)" />
                      <line x1="12" y1="2" x2="12" y2="8" stroke="#55D6FF" />
                      <line x1="12" y1="16" x2="12" y2="22" stroke="#55D6FF" />
                      <line x1="2" y1="12" x2="8" y2="12" stroke="#55D6FF" />
                      <line x1="16" y1="12" x2="22" y2="12" stroke="#55D6FF" />
                    </svg>
                  )
                },
                {
                  num: '02',
                  title: 'Business Software',
                  desc: 'Web applications and internal systems designed around real business processes.',
                  visual: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#1677FF" />
                      <line x1="3" y1="9" x2="21" y2="9" stroke="#55D6FF" />
                      <line x1="9" y1="21" x2="9" y2="9" stroke="#55D6FF" />
                    </svg>
                  )
                },
                {
                  num: '03',
                  title: 'Automation',
                  desc: 'Automated workflows that reduce repetitive manual work.',
                  visual: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" stroke="#1677FF" strokeLinecap="round" />
                    </svg>
                  )
                },
                {
                  num: '04',
                  title: 'Digital Products',
                  desc: 'Customer facing software products, platforms, and intelligent tools.',
                  visual: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#1677FF" strokeLinejoin="round" />
                    </svg>
                  )
                }
              ].map((item, i) => (
                <Link
                  key={i}
                  href="/services"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    padding: 'clamp(1.75rem, 4vw, 2.75rem)',
                    backgroundColor: 'rgba(6, 21, 43, 0.7)',
                    textDecoration: 'none',
                    transition: 'background-color 0.25s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(10, 35, 71, 0.85)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(6, 21, 43, 0.7)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#1677FF', fontWeight: 600 }}>{item.num}</span>
                    <div style={{ color: '#55D6FF', opacity: 0.8 }}>{item.visual}</div>
                  </div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: '#F8FAFF',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    marginTop: '0.5rem'
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.975rem', maxWidth: 'none', fontWeight: 300 }}>{item.desc}</p>
                  <span style={{ color: '#1677FF', fontSize: '0.875rem', fontWeight: 600, marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    Learn more <span style={{ transition: 'transform 0.2s' }}>→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TECHNOLOGY SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(6rem, 14vh, 12rem) clamp(1.25rem, 6vw, 6rem)', pointerEvents: 'auto', backgroundColor: 'rgba(6, 21, 43, 0.3)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '1.5rem',
              maxWidth: 'none',
              fontWeight: 600
            }}>
              CAPABILITIES
            </p>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 6vw, 4rem)',
              fontWeight: 700,
              color: '#F8FAFF',
              marginBottom: '1rem',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase'
            }}>
              Our tech stack.
            </h2>
            <p style={{
              fontSize: '1.15rem',
              color: '#64748B',
              lineHeight: 1.7,
              marginBottom: 'clamp(3rem, 6vh, 5rem)',
              maxWidth: 560,
              fontWeight: 300
            }}>
              We construct systems using production-proven languages and platforms capable of scaling seamlessly.
            </p>

            <div
              className="tech-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem'
              }}
            >
              {[
                {
                  title: 'AI & Machine Learning',
                  desc: 'Models, neural networks, retrieval platforms, and agentic workflows.',
                  tags: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'RAG', 'AI Agents']
                },
                {
                  title: 'Applications',
                  desc: 'Robust frontend rendering engines and high-throughput backend APIs.',
                  tags: ['Next.js', 'React', 'TypeScript', 'Node.js', 'FastAPI']
                },
                {
                  title: 'Data Systems',
                  desc: 'Transactional, document-store, cache, and vector memory instances.',
                  tags: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis']
                },
                {
                  title: 'Infrastructure',
                  desc: 'Virtualization, cloud computation, secure configurations, and automation pipelines.',
                  tags: ['Docker', 'AWS', 'Linux', 'REST APIs', 'DevOps']
                }
              ].map((group, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.6)',
                    border: '1px solid rgba(22, 119, 255, 0.12)',
                    borderRadius: 12,
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    transition: 'border-color 0.25s, box-shadow 0.25s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.35)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.12)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#F8FAFF',
                    letterSpacing: '-0.01em',
                    textTransform: 'none'
                  }}>
                    {group.title}
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.925rem', lineHeight: 1.5, margin: 0, fontWeight: 300 }}>
                    {group.desc}
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: 'auto',
                    paddingTop: '1rem'
                  }}>
                    {group.tags.map(t => (
                      <span
                        key={t}
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.35rem 0.75rem',
                          backgroundColor: 'rgba(22, 119, 255, 0.08)',
                          border: '1px solid rgba(22, 119, 255, 0.15)',
                          borderRadius: 4,
                          color: '#55D6FF',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            WORK / CASE STUDIES
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(6rem, 14vh, 12rem) clamp(1.25rem, 6vw, 6rem)', pointerEvents: 'auto' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(3rem, 6vh, 5rem)', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#1677FF',
                  marginBottom: '1rem',
                  maxWidth: 'none',
                  fontWeight: 600
                }}>
                  CASE STUDIES
                </p>
                <h2 style={{
                  fontSize: 'clamp(2.25rem, 6vw, 4rem)',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: '#F8FAFF',
                  textTransform: 'uppercase'
                }}>
                  Selected deployments.
                </h2>
              </div>
              <Link href="/work" style={{ color: '#1677FF', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                View all case studies <span>→</span>
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {[
                {
                  name: 'School Operations Manager',
                  category: 'Business Software',
                  desc: 'A unified platform managing students, billing, attendance, staff, and multi-channel notification systems.',
                  tech: ['Next.js', 'React', 'FastAPI', 'PostgreSQL', 'Docker'],
                  purpose: 'Consolidated school admin processes into one portal, reducing manual overhead by 40%.'
                },
                {
                  name: 'Sales pipeline automation system',
                  category: 'Workflow Automation',
                  desc: 'Real-time sync pipeline linking CRM workflows, invoice state tracking, and external communication triggers.',
                  tech: ['Python', 'FastAPI', 'Redis', 'Webhooks', 'Slack APIs'],
                  purpose: 'Increased pipeline processing throughput and removed data duplication with zero staff overhead.'
                },
                {
                  name: 'Vector Search Knowledge Base',
                  category: 'AI Systems',
                  desc: 'RAG system enabling low-latency semantic queries across thousands of structural business documents.',
                  tech: ['Next.js', 'Vector DB', 'PyTorch', 'OpenAI API', 'FastAPI'],
                  purpose: 'Reduced support search lookup resolution from several minutes to sub-second responses.'
                }
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.5)',
                    border: '1px solid rgba(22, 119, 255, 0.1)',
                    borderRadius: 16,
                    padding: 'clamp(2rem, 5vw, 3.5rem)',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '2rem',
                    transition: 'border-color 0.3s, transform 0.3s',
                  }}
                  className="case-study-panel"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        letterSpacing: '0.2em',
                        color: '#1677FF',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}>
                        {item.category}
                      </span>
                    </div>
                    
                    <h3 style={{
                      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                      fontWeight: 700,
                      color: '#F8FAFF',
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em',
                      textTransform: 'none'
                    }}>
                      {item.name}
                    </h3>
                    
                    <p style={{ color: '#94A3B8', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 800, fontWeight: 300 }}>
                      {item.desc}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid rgba(22, 119, 255, 0.08)', paddingTop: '1.5rem' }}>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>TECHNOLOGY</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {item.tech.map(t => (
                            <span key={t} style={{ fontSize: '0.75rem', color: '#F8FAFF', backgroundColor: 'rgba(22, 119, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>RESULT & PURPOSE</h4>
                        <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, fontWeight: 300 }}>{item.purpose}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
                    <Link
                      href="/work"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#1677FF',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#55D6FF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#1677FF'; }}
                    >
                      VIEW CASE STUDY <span>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            INTERACTIVE WORLD MAP
        ═══════════════════════════════════════════════════════════ */}
        <div style={{ pointerEvents: 'auto' }}>
          <GlobalMapSection />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            ABOUT SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(6rem, 14vh, 12rem) clamp(1.25rem, 6vw, 6rem)', pointerEvents: 'auto' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(3rem, 6vw, 6rem)', alignItems: 'center' }}>
            {/* Left text */}
            <div>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#1677FF',
                marginBottom: '1.5rem',
                maxWidth: 'none',
                fontWeight: 600
              }}>
                WHY QUANTUM AI.
              </p>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#F8FAFF',
                marginBottom: '1.75rem',
                textTransform: 'uppercase'
              }}>
                We do not build technology for the sake of technology. We build systems that solve real problems.
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#94A3B8', lineHeight: 1.7, marginBottom: '2.5rem', fontWeight: 300 }}>
                We focus on understanding operational complexities before writing code, applying technical architectures built for utility and longevity.
              </p>
              <NovaButton href="/about">LEARN MORE ABOUT US</NovaButton>
            </div>

            {/* Right: principles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { title: 'Think Clearly', desc: 'Understand the problem before choosing the technology.' },
                { title: 'Build with Purpose', desc: 'Every system should have a measurable reason to exist.' },
                { title: 'Keep it Simple', desc: 'Complex technology should create simple experiences.' },
                { title: 'Design for the Real World', desc: 'Software must work for real people, teams, and businesses.' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '1.75rem 0',
                  borderTop: '1px solid rgba(22, 119, 255, 0.1)',
                  borderBottom: i === 3 ? '1px solid rgba(22, 119, 255, 0.1)' : 'none',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>0{i + 1}</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#F8FAFF', marginBottom: '0.35rem', letterSpacing: '-0.01em', textTransform: 'none' }}>{item.title}</h3>
                  <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: 'none', fontWeight: 300, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            LEADERSHIP SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(6rem, 14vh, 12rem) clamp(1.25rem, 6vw, 6rem)', pointerEvents: 'auto', backgroundColor: 'rgba(6, 21, 43, 0.2)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '1.5rem',
              maxWidth: 'none',
              fontWeight: 600
            }}>
              LEADERSHIP
            </p>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 6vw, 4rem)',
              fontWeight: 700,
              color: '#F8FAFF',
              marginBottom: '1rem',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase'
            }}>
              The people behind Quantum AI.
            </h2>
            <p style={{
              fontSize: '1.15rem',
              color: '#64748B',
              lineHeight: 1.7,
              marginBottom: 'clamp(3rem, 6vh, 5rem)',
              maxWidth: 560,
              fontWeight: 300
            }}>
              Engineers and architects building enterprise products.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {[
                {
                  name: 'Fawadullah Imraj',
                  role: 'Co-Founder & CEO',
                  bio: 'Directs company vision and strategic engineering execution, aligning AI technology with business goals.'
                },
                {
                  name: 'Fahad Khan',
                  role: 'Co-Founder & Executive chairman',
                  bio: 'Leads technical architecture, cloud engineering, database structure, and model deployment systems.'
                }
              ].map((person, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.6)',
                    border: '1px solid rgba(22, 119, 255, 0.12)',
                    borderRadius: 12,
                    padding: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'border-color 0.25s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.12)'; }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#F8FAFF', margin: '0 0 0.25rem 0', textTransform: 'none' }}>
                      {person.name}
                    </h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#1677FF', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {person.role}
                    </span>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.975rem', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                    {person.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CONTACT SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section id="contact-form" style={{ padding: 'clamp(6rem, 14vh, 12rem) clamp(1.25rem, 6vw, 6rem)', pointerEvents: 'auto' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '1.5rem',
              maxWidth: 'none',
              fontWeight: 600
            }}>
              CONTACT
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(3rem, 6vw, 6rem)', alignItems: 'start' }}>
              <div>
                <h2 style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  letterSpacing: '-0.04em',
                  color: '#F8FAFF',
                  marginBottom: '1.5rem',
                  textTransform: 'uppercase'
                }}>
                  Let's build something useful.
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '2.5rem', fontWeight: 300 }}>
                  Tell us what you are building, what problem you are solving, or what you want to improve.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.1)', paddingTop: '1.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.2em', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>EMAIL INQUIRIES</span>
                    <a href="mailto:hello@quantumai.dev" style={{ fontSize: '1.15rem', color: '#F8FAFF', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.color = '#1677FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#F8FAFF'}>
                      hello@quantumai.dev
                    </a>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.2em', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>RESPONSE MATRIX</span>
                    <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0, fontWeight: 300 }}>We review all incoming submissions and reply within 24 hours.</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div style={{ backgroundColor: 'rgba(6, 21, 43, 0.4)', border: '1px solid rgba(22, 119, 255, 0.1)', borderRadius: 16, padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
                {submitStatus === 'success' ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ color: '#55D6FF', fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
                    <h3 style={{ fontSize: '1.5rem', color: '#F8FAFF', marginBottom: '0.5rem', textTransform: 'none' }}>Project Inquiry Sent</h3>
                    <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginBottom: '2rem', fontWeight: 300 }}>Thank you for reaching out. An engineer will review your inquiry and connect with you shortly.</p>
                    <NovaButton onClick={() => setSubmitStatus('idle')}>SEND ANOTHER INQUIRY</NovaButton>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>NAME *</label>
                      <input
                        type="text"
                        name="name"
                        value={formState.name}
                        onChange={handleFormChange}
                        placeholder="Your full name"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: `1.5px solid ${formErrors.name ? '#EF4444' : 'rgba(22, 119, 255, 0.2)'}`,
                          color: '#F8FAFF',
                          padding: '0.625rem 0',
                          outline: 'none',
                          fontSize: '1rem',
                          width: '100%',
                          transition: 'border-color 0.25s'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#1677FF'; }}
                        onBlur={(e) => { e.currentTarget.style.borderBottomColor = formErrors.name ? '#EF4444' : 'rgba(22, 119, 255, 0.2)'; }}
                      />
                      {formErrors.name && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.name}</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>EMAIL *</label>
                      <input
                        type="email"
                        name="email"
                        value={formState.email}
                        onChange={handleFormChange}
                        placeholder="name@company.com"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: `1.5px solid ${formErrors.email ? '#EF4444' : 'rgba(22, 119, 255, 0.2)'}`,
                          color: '#F8FAFF',
                          padding: '0.625rem 0',
                          outline: 'none',
                          fontSize: '1rem',
                          width: '100%',
                          transition: 'border-color 0.25s'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#1677FF'; }}
                        onBlur={(e) => { e.currentTarget.style.borderBottomColor = formErrors.email ? '#EF4444' : 'rgba(22, 119, 255, 0.2)'; }}
                      />
                      {formErrors.email && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.email}</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>COMPANY</label>
                      <input
                        type="text"
                        name="company"
                        value={formState.company}
                        onChange={handleFormChange}
                        placeholder="Company name (optional)"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1.5px solid rgba(22, 119, 255, 0.2)',
                          color: '#F8FAFF',
                          padding: '0.625rem 0',
                          outline: 'none',
                          fontSize: '1rem',
                          width: '100%',
                          transition: 'border-color 0.25s'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#1677FF'; }}
                        onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(22, 119, 255, 0.2)'; }}
                      />
                    </div>

                    <div className="form-selects-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>PROJECT TYPE</label>
                        <select
                          name="projectType"
                          value={formState.projectType}
                          onChange={handleFormChange}
                          style={{
                            background: '#06152B',
                            border: '1px solid rgba(22, 119, 255, 0.2)',
                            borderRadius: 6,
                            color: '#F8FAFF',
                            padding: '0.625rem',
                            outline: 'none',
                            fontSize: '0.9rem',
                            width: '100%',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">Select type...</option>
                          <option value="AI Systems">AI Systems</option>
                          <option value="Business Software">Business Software</option>
                          <option value="Automation">Automation</option>
                          <option value="Digital Products">Digital Products</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>BUDGET RANGE</label>
                        <select
                          name="budget"
                          value={formState.budget}
                          onChange={handleFormChange}
                          style={{
                            background: '#06152B',
                            border: '1px solid rgba(22, 119, 255, 0.2)',
                            borderRadius: 6,
                            color: '#F8FAFF',
                            padding: '0.625rem',
                            outline: 'none',
                            fontSize: '0.9rem',
                            width: '100%',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">Select budget...</option>
                          <option value="< $10k">&lt; $10k</option>
                          <option value="$10k - $50k">$10k - $50k</option>
                          <option value="$50k - $100k">$50k - $100k</option>
                          <option value="$100k+">$100k+</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MESSAGE *</label>
                      <textarea
                        name="message"
                        value={formState.message}
                        onChange={handleFormChange}
                        placeholder="Describe your project, problems, and goals"
                        rows={4}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: `1.5px solid ${formErrors.message ? '#EF4444' : 'rgba(22, 119, 255, 0.2)'}`,
                          color: '#F8FAFF',
                          padding: '0.625rem 0',
                          outline: 'none',
                          fontSize: '1rem',
                          width: '100%',
                          resize: 'vertical',
                          lineHeight: 1.5,
                          transition: 'border-color 0.25s'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#1677FF'; }}
                        onBlur={(e) => { e.currentTarget.style.borderBottomColor = formErrors.message ? '#EF4444' : 'rgba(22, 119, 255, 0.2)'; }}
                      />
                      {formErrors.message && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.message}</span>}
                    </div>

                    {submitStatus === 'error' && (
                      <span style={{ color: '#EF4444', fontSize: '0.85rem' }}>Submission failed. Please check your network or try again.</span>
                    )}

                    <NovaButton
                      type="submit"
                      disabled={isSubmitting}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      {isSubmitting ? 'SENDING...' : 'SEND PROJECT INQUIRY'}
                    </NovaButton>

                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
