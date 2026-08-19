'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGlobalStore } from '@/components/layout/GlobalStore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { NovaButton, GalaxyButton, ButtonStyles } from '@/components/ui/Buttons';

const ParticleText = dynamic(() => import('@/components/ui/ParticleText'), { ssr: false });
const GlobalMapSection = dynamic(() => import('@/components/sections/GlobalMapSection'), { ssr: false });
import TestimonialsSection from '@/components/sections/TestimonialsSection';

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

  // Leadership state synced with database / admin panel
  const [leaders, setLeaders] = useState<any[]>([
    {
      id: '1',
      name: 'Fawadullah Imraj',
      position: 'Co-Founder & CEO',
      shortBio: 'Co Founder and CEO of Quantum AI, building AI powered software and digital solutions for schools, colleges, and businesses',
      photo: 'https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787049252241-Screenshot_2025-02-11_170816.png',
      slug: 'fawadullah-imraj',
      publicId: 'QA-001'
    },
    {
      id: '2',
      name: 'Fahad Khan',
      position: 'Co-Founder & Executive Chairman',
      shortBio: 'Co Founder and Executive Chairman of Quantum AI, supporting strategic direction, technical vision, and long term growth.',
      photo: 'https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787049467020-Screenshot_2026-08-18_153738.png',
      slug: 'fahad-khan',
      publicId: 'QA-002'
    }
  ]);

  // Dynamic Case Studies state synced with database / admin panel
  const [caseStudies, setCaseStudies] = useState<any[]>([
    {
      id: '1',
      title: 'Smart School Fee Management System',
      industry: 'Education',
      problem: 'A unified platform managing students, fee structures, parent communication, attendance, and multi-channel billing systems.',
      technologies: 'Next.js, React, FastAPI, PostgreSQL, Docker',
      results: 'Consolidated school administrative workflows into one platform, reducing processing delays by 50%.',
      slug: 'smart-school-fee-management-system',
    },
    {
      id: '2',
      title: 'Sales Pipeline Automation Engine',
      industry: 'Enterprise Automation',
      problem: 'Real-time sync pipeline linking CRM workflows, invoice state tracking, and external communication triggers.',
      technologies: 'Python, FastAPI, Redis, Webhooks, Slack APIs',
      results: 'Increased pipeline processing throughput and removed data duplication with zero staff overhead.',
      slug: 'sales-pipeline-automation-system',
    }
  ]);

  // Dynamic Services / Solutions state synced with database / admin panel
  const [services, setServices] = useState<any[]>([
    { id: '1', name: 'AI Systems', description: 'Custom AI systems for business workflows and intelligent decision making.', category: 'AI', order: 1 },
    { id: '2', name: 'Business Software', description: 'Web applications and internal systems designed around real business processes.', category: 'SOFTWARE', order: 2 },
    { id: '3', name: 'Automation', description: 'Automated workflows that reduce repetitive manual work.', category: 'AUTOMATION', order: 3 },
    { id: '4', name: 'Digital Products', description: 'Customer facing software products, platforms, and intelligent tools.', category: 'PRODUCT', order: 4 },
  ]);

  // Dynamic Technology Stack state synced with database / admin panel
  const [techGroups, setTechGroups] = useState<any[]>([
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
  ]);

  useEffect(() => {
    fetch('/api/leadership')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLeaders(data.filter((m: any) => m.isActive !== false));
        }
      })
      .catch(() => {});

    fetch('/api/case-studies')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCaseStudies(data.filter((s: any) => s.published !== false));
        }
      })
      .catch(() => {});

    fetch('/api/services')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setServices(data.filter((s: any) => s.published !== false));
        }
      })
      .catch(() => {});

    fetch('/api/technology')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const published = data.filter((t: any) => t.published !== false);
          const grouped: Record<string, string[]> = {};
          const descMap: Record<string, string> = {
            'AI & Machine Learning': 'Models, neural networks, retrieval platforms, and agentic workflows.',
            'Applications': 'Robust frontend rendering engines and high-throughput backend APIs.',
            'Data Systems': 'Transactional, document-store, cache, and vector memory instances.',
            'Infrastructure': 'Virtualization, cloud computation, secure configurations, and automation pipelines.'
          };
          published.forEach((t: any) => {
            const cat = t.category || 'General';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(t.name);
          });
          const list = Object.entries(grouped).map(([title, tags]) => ({
            title,
            desc: descMap[title] || `Engineering capabilities and stack for ${title}.`,
            tags
          }));
          if (list.length > 0) setTechGroups(list);
        }
      })
      .catch(() => {});
  }, []);

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
  };

  return (
    <>
      <ButtonStyles />
      <style>{`
        /* ── Prevent horizontal overflow on all screens ── */
        html, body { max-width: 100vw !important; overflow-x: hidden !important; }
        * { box-sizing: border-box !important; }
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
          /* Leadership 2by2 on phone */
          .home-leadership-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .home-leadership-grid > a {
            border-radius: 8px !important;
          }
          .home-leadership-grid > a > div:first-child {
            padding: 0.4rem 0.6rem !important;
          }
          .home-leadership-grid > a > div:nth-child(2) {
            aspect-ratio: 1/1 !important;
            max-height: 160px !important;
          }
          .home-leadership-grid > a > div:last-child {
            padding: 0.75rem !important;
          }
          .home-leadership-grid h3 {
            font-size: 0.95rem !important;
          }
          .home-leadership-grid p {
            font-size: 0.75rem !important;
            line-height: 1.35 !important;
            -webkit-line-clamp: 2 !important;
          }
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
      <div style={{ position: 'relative', width: '100%', maxWidth: '100vw', overflowX: 'hidden', pointerEvents: 'none' }}>

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
              {services.map((item, i) => (
                <Link
                  key={item.id || i}
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
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#1677FF', fontWeight: 600 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ color: '#55D6FF', opacity: 0.8 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="4" stroke="#1677FF" fill="rgba(22,119,255,0.1)" />
                        <line x1="12" y1="2" x2="12" y2="8" stroke="#55D6FF" />
                        <line x1="12" y1="16" x2="12" y2="22" stroke="#55D6FF" />
                        <line x1="2" y1="12" x2="8" y2="12" stroke="#55D6FF" />
                        <line x1="16" y1="12" x2="22" y2="12" stroke="#55D6FF" />
                      </svg>
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: '#F8FAFF',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    marginTop: '0.5rem'
                  }}>
                    {item.name || item.title}
                  </h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#94A3B8',
                    lineHeight: 1.6,
                    margin: 0,
                    fontWeight: 300,
                  }}>
                    {item.description || item.desc}
                  </p>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: '#1677FF',
                    letterSpacing: '0.1em',
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: 500
                  }}>
                    DISCOVER SOLUTION →
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
              {techGroups.map((group, idx) => (
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
                    {group.tags.map((t: string) => (
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
              {caseStudies.map((item, i) => {
                const techList = item.technologies ? (typeof item.technologies === 'string' ? item.technologies.split(',').map((t: string) => t.trim()) : item.technologies) : (item.tech || []);
                const slug = item.slug || 'smart-school-fee-management-system';

                return (
                  <div
                    key={item.id || i}
                    style={{
                      backgroundColor: 'rgba(6, 21, 43, 0.5)',
                      border: '1px solid rgba(22, 119, 255, 0.15)',
                      borderRadius: 16,
                      padding: 'clamp(1.75rem, 4vw, 3rem)',
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '1.5rem',
                      transition: 'border-color 0.3s, transform 0.3s',
                    }}
                    className="case-study-panel"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.35)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.15)';
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
                          {item.industry || item.category || 'BUSINESS SOFTWARE'}
                        </span>
                        {item.year && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748B' }}>
                            {item.year}
                          </span>
                        )}
                      </div>
                      
                      <Link href={`/work/${slug}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{
                          fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                          fontWeight: 700,
                          color: '#F8FAFF',
                          lineHeight: 1.15,
                          letterSpacing: '-0.02em',
                          textTransform: 'none',
                          margin: 0,
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#38BDF8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#F8FAFF'; }}
                        >
                          {item.title || item.name}
                        </h3>
                      </Link>
                      
                      <p style={{ color: '#94A3B8', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 800, fontWeight: 300, margin: 0 }}>
                        {item.problem || item.desc || item.solution}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.08)', paddingTop: '1.25rem' }}>
                        {techList.length > 0 && (
                          <div>
                            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>TECHNOLOGY</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {techList.map((t: string) => (
                                <span key={t} style={{ fontSize: '0.75rem', color: '#55D6FF', backgroundColor: 'rgba(22, 119, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(item.results || item.purpose) && (
                          <div>
                            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>RESULT & PURPOSE</h4>
                            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, fontWeight: 300 }}>{item.results || item.purpose}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                      <Link
                        href={`/work/${slug}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#1677FF',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.1em',
                          fontWeight: 600
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#55D6FF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#1677FF'; }}
                      >
                        VIEW CASE STUDY <span>→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
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

            <div
              className="home-leadership-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.75rem',
                maxWidth: 960,
                margin: '0 auto',
              }}
            >
              {leaders.slice(0, 2).map((person) => (
                <Link
                  key={person.id || person.slug}
                  href={`/leadership/${person.slug || 'fawadullah-imraj'}`}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.75)',
                    border: '1px solid rgba(22, 119, 255, 0.2)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.2)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Card Header Tag */}
                  <div style={{
                    padding: '0.65rem 1rem',
                    borderBottom: '1px solid rgba(22, 119, 255, 0.12)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#1677FF', textTransform: 'uppercase' }}>
                      QUANTUM AI
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#64748B' }}>
                      {person.publicId || 'QA-LEAD'}
                    </span>
                  </div>

                  {/* Photo Container */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    backgroundColor: '#030712',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={person.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
                      />
                    ) : (
                      <div style={{ color: '#64748B', fontSize: '2rem' }}>👤</div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{
                      fontSize: 'clamp(0.875rem, 2.5vw, 1.15rem)',
                      fontWeight: 600,
                      color: '#F8FAFF',
                      margin: '0 0 0.25rem 0',
                      letterSpacing: '-0.01em',
                      textTransform: 'none',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: 1.3,
                    }}>
                      {person.name}
                    </h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.55rem, 1.6vw, 0.68rem)', color: '#55D6FF', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.4, display: 'block' }}>
                      {person.position}
                    </span>
                    <p style={{ color: '#94A3B8', fontSize: 'clamp(0.72rem, 1.8vw, 0.85rem)', lineHeight: 1.5, margin: 0, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {person.shortBio}
                    </p>
                    <span style={{ marginTop: 'auto', paddingTop: '0.75rem', color: '#1677FF', fontSize: 'clamp(0.6rem, 1.6vw, 0.72rem)', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                      VIEW PROFILE →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TESTIMONIALS SECTION (Directly connected to Admin / DB)
        ═══════════════════════════════════════════════════════════ */}
        <TestimonialsSection />

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
