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
      title: 'School Operations Manager',
      industry: 'Education / School Management',
      problem: 'A centralized school management platform designed to bring academic, administrative, student, staff, attendance, communication, and operational workflows into one digital system.',
      technologies: 'Next.js, React, TypeScript, Tailwind CSS, Node.js, Prisma, PostgreSQL',
      results: 'Provides a centralized digital foundation for managing school operations and reducing reliance on disconnected manual workflows.',
      slug: 'school-operations-manager',
    },
    {
      id: '2',
      title: 'Sales Pipeline Automation System',
      industry: 'Sales / Business Automation',
      problem: 'A sales workflow system designed to organize leads, opportunities, follow-ups, and customer interactions in one centralized platform.',
      technologies: 'Next.js, React, TypeScript, Node.js, FastAPI, PostgreSQL, REST APIs',
      results: 'Creates a centralized sales workflow that gives teams clearer visibility into leads, opportunities, and follow-up activities.',
      slug: 'sales-pipeline-automation-system',
    },
    {
      id: '3',
      title: 'Vector Search Knowledge Base',
      industry: 'Artificial Intelligence / Knowledge Management',
      problem: 'An AI-powered knowledge retrieval system designed to make large collections of information easier to search and use with vector-based semantic retrieval.',
      technologies: 'Python, LangChain, RAG, Vector Search, Embeddings, LLMs, FastAPI, PostgreSQL',
      results: 'Provides semantic search over knowledge sources and creates a foundation for retrieval-augmented AI applications.',
      slug: 'vector-search-knowledge-base',
    },
    {
      id: '4',
      title: 'AI-Powered Customer Support Assistant',
      industry: 'Artificial Intelligence / Customer Support',
      problem: 'An AI customer support system designed to handle common customer questions, provide contextual answers, and assist support teams with faster information retrieval.',
      technologies: 'Python, FastAPI, LangChain, LLMs, RAG, APIs',
      results: 'Creates an AI-assisted support workflow that can provide faster access to business information and reduce repetitive support work.',
      slug: 'ai-powered-customer-support-assistant',
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
          setCaseStudies(data.filter((s: any) => s.published !== false).slice(0, 4));
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

            {/* ParticleText visual headline */}
            <div style={{
              height: 'clamp(220px, 35vw, 340px)',
              width: 'clamp(280px, 92vw, 860px)',
              marginBottom: '2rem',
              filter: 'drop-shadow(0 4px 24px rgba(2, 8, 23, 0.95))',
            }}>
              <ParticleText
                text={`WE BUILD\nINTELLIGENT\nSOFTWARE`}
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
              maxWidth: 580,
              fontWeight: 300,
            }}>
              Quantum AI builds AI systems, custom business software, and automation for organizations that need better ways to operate.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <NovaButton href="/contact">START A PROJECT</NovaButton>
              <GalaxyButton href="/work">EXPLORE OUR WORK</GalaxyButton>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            BUSINESS PROBLEMS SECTION (CHALLENGES WE SOLVE)
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(3rem, 6vh, 4.5rem) clamp(1rem, 5vw, 6rem)', pointerEvents: 'auto', backgroundColor: 'rgba(4, 14, 36, 0.5)', borderTop: '1px solid rgba(22, 119, 255, 0.08)', borderBottom: '1px solid rgba(22, 119, 255, 0.08)' }}>
          <style>{`
            .problems-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 1rem;
              width: 100%;
              box-sizing: border-box;
            }
            .problem-compact-card {
              background-color: rgba(6, 21, 43, 0.65);
              border: 1px solid rgba(22, 119, 255, 0.15);
              border-radius: 10px;
              padding: clamp(1rem, 2vw, 1.35rem);
              display: flex;
              flex-direction: column;
              gap: 0.65rem;
              transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
              box-sizing: border-box;
            }
            .problem-compact-card:hover {
              border-color: rgba(56, 189, 248, 0.4);
              transform: translateY(-2px);
              box-shadow: 0 8px 24px -6px rgba(22, 119, 255, 0.25);
            }
            .problem-code-tag {
              font-family: var(--font-mono);
              font-size: 0.65rem;
              color: #38BDF8;
              letter-spacing: 0.12em;
              font-weight: 600;
              text-transform: uppercase;
            }
            .problem-title {
              font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: clamp(0.95rem, 1.25vw, 1.1rem);
              font-weight: 600;
              color: #F8FAFF;
              letter-spacing: -0.01em;
              text-transform: none !important;
              line-height: 1.25;
              margin: 0;
              word-break: normal !important;
              overflow-wrap: break-word;
              hyphens: none !important;
            }
            .problem-desc {
              color: #94A3B8;
              font-size: clamp(0.78rem, 1vw, 0.85rem);
              line-height: 1.55;
              margin: 0;
              font-weight: 300;
            }

            @media (max-width: 1024px) {
              .problems-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
              }
            }

            @media (max-width: 640px) {
              .problems-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: clamp(0.5rem, 2.5vw, 0.75rem) !important;
              }
              .problem-compact-card {
                padding: clamp(0.75rem, 2.5vw, 1rem) !important;
                gap: 0.45rem !important;
                border-radius: 8px !important;
              }
              .problem-code-tag {
                font-size: 0.58rem !important;
                letter-spacing: 0.08em !important;
              }
              .problem-title {
                font-size: clamp(0.8rem, 2.7vw, 0.92rem) !important;
                line-height: 1.2 !important;
              }
              .problem-desc {
                font-size: 0.7rem !important;
                line-height: 1.35 !important;
              }
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}>
              CHALLENGES WE SOLVE
            </p>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#F8FAFF',
              marginBottom: '0.65rem',
              textTransform: 'none'
            }}>
              What are you trying to improve?
            </h2>
            <p style={{
              fontSize: 'clamp(0.88rem, 1.3vw, 0.98rem)',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: 'clamp(1.75rem, 3.5vh, 2.5rem)',
              maxWidth: 620,
              fontWeight: 300
            }}>
              We engineer intelligent systems and automation to eliminate operational bottlenecks, reduce delays, and scale productivity.
            </p>

            <div className="problems-grid">
              {[
                {
                  code: '01 // OPERATIONS',
                  title: 'Manual Operations',
                  desc: 'Replace error-prone manual tasks with reliable automated software pipelines that run 24/7.'
                },
                {
                  code: '02 // INTEGRATION',
                  title: 'Disconnected Data',
                  desc: 'Unify scattered spreadsheets, tools, and databases into a single, cohesive source of truth.'
                },
                {
                  code: '03 // SPEED',
                  title: 'Slow Workflows',
                  desc: 'Build intuitive internal software that cuts operational delays and eliminates handoff friction.'
                },
                {
                  code: '04 // ARCHITECTURE',
                  title: 'Complex Processes',
                  desc: 'Transform intricate business rules and procedures into clear, structured digital systems.'
                },
              ].map((item, idx) => (
                <div key={idx} className="problem-compact-card">
                  <span className="problem-code-tag">
                    {item.code}
                  </span>
                  <h3 className="problem-title">
                    {item.title}
                  </h3>
                  <p className="problem-desc">
                    {item.desc}
                  </p>
                </div>
              ))}
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
            WORK / CASE STUDIES (Top 4 Case Studies)
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(4rem, 10vh, 10rem) clamp(1rem, 5vw, 6rem)', pointerEvents: 'auto' }}>
          <style>{`
            .home-work-container {
              display: flex;
              flex-direction: column;
              gap: 2.5rem;
              width: 100%;
            }
            .home-work-card {
              background-color: rgba(6, 21, 43, 0.5);
              border: 1px solid rgba(22, 119, 255, 0.15);
              border-radius: 16px;
              padding: clamp(1.75rem, 4vw, 3rem);
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              gap: 1.5rem;
              transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
              box-sizing: border-box;
              height: 100%;
            }
            .home-work-card:hover {
              border-color: rgba(56, 189, 248, 0.4);
              transform: translateY(-2px);
              box-shadow: 0 12px 30px -10px rgba(22, 119, 255, 0.2);
            }
            .home-work-title {
              font-size: clamp(1.5rem, 3vw, 2.25rem);
              font-weight: 700;
              color: #F8FAFF;
              line-height: 1.15;
              letter-spacing: -0.02em;
              text-transform: none;
              margin: 0;
              transition: color 0.2s;
            }
            .home-work-title:hover {
              color: #38BDF8;
            }
            .home-work-desc {
              color: #94A3B8;
              font-size: 1.05rem;
              line-height: 1.6;
              max-width: 800px;
              font-weight: 300;
              margin: 0;
            }
            .home-work-desktop-subgrid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              gap: 1.5rem;
              margin-top: 0.5rem;
              border-top: 1px solid rgba(22, 119, 255, 0.08);
              padding-top: 1.25rem;
            }

            /* ─── Mobile 2-Column Responsive Layout ─── */
            @media (max-width: 767px) {
              .home-work-container {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: clamp(0.5rem, 2.5vw, 0.85rem);
              }
              .home-work-card {
                padding: clamp(0.75rem, 3vw, 1.1rem);
                gap: 0.65rem;
                border-radius: 10px;
              }
              .home-work-badge {
                font-size: 0.625rem !important;
                padding: 0.15rem 0.4rem !important;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              .home-work-year {
                display: none !important;
              }
              .home-work-title {
                font-size: clamp(0.72rem, 2.7vw, 0.84rem) !important;
                line-height: 1.25 !important;
                letter-spacing: -0.01em !important;
                font-weight: 700 !important;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                word-break: normal;
                overflow-wrap: break-word;
                hyphens: auto;
              }
              .home-work-desc {
                font-size: 0.6875rem !important;
                line-height: 1.35 !important;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              .home-work-desktop-subgrid {
                display: none !important;
              }
              .home-work-action-link {
                font-size: 0.6875rem !important;
                padding-top: 0.25rem !important;
              }
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'clamp(2rem, 5vh, 4rem)', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#1677FF',
                  marginBottom: '0.75rem',
                  maxWidth: 'none',
                  fontWeight: 600
                }}>
                  CASE STUDIES
                </p>
                <h2 style={{
                  fontSize: 'clamp(2rem, 5.5vw, 3.75rem)',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: '#F8FAFF',
                  textTransform: 'uppercase',
                  margin: 0
                }}>
                  Selected deployments.
                </h2>
              </div>
              <Link href="/work" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                View all case studies <span>→</span>
              </Link>
            </div>

            <div className="home-work-container">
              {caseStudies.slice(0, 4).map((item, i) => {
                const techList = item.technologies ? (typeof item.technologies === 'string' ? item.technologies.split(',').map((t: string) => t.trim()) : item.technologies) : (item.tech || []);
                const slug = item.slug || 'school-operations-manager';

                return (
                  <div key={item.id || i} className="home-work-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <span
                          className="home-work-badge"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            letterSpacing: '0.15em',
                            color: '#38BDF8',
                            backgroundColor: 'rgba(22, 119, 255, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                            fontWeight: 600
                          }}
                        >
                          {item.industry ? item.industry.split('/')[0].trim() : (item.category || 'AI SYSTEMS')}
                        </span>
                        {item.year && (
                          <span className="home-work-year" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748B' }}>
                            {item.year}
                          </span>
                        )}
                      </div>
                      
                      <Link href={`/work/${slug}`} style={{ textDecoration: 'none' }}>
                        <h3 className="home-work-title">
                          {item.title || item.name}
                        </h3>
                      </Link>
                      
                      <p className="home-work-desc">
                        {item.problem || item.desc || item.solution}
                      </p>

                      <div className="home-work-desktop-subgrid">
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

                    <div className="home-work-action-link" style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                      <Link
                        href={`/work/${slug}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#38BDF8',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.1em',
                          fontWeight: 600
                        }}
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
            HOW WE WORK / DELIVERY PROCESS SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(4rem, 10vh, 8rem) clamp(1rem, 5vw, 6rem)', pointerEvents: 'auto', backgroundColor: 'rgba(6, 21, 43, 0.35)', borderTop: '1px solid rgba(22, 119, 255, 0.1)', borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
          <style>{`
            .process-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1.25rem;
            }
            .process-card {
              background-color: rgba(6, 21, 43, 0.65);
              border: 1px solid rgba(22, 119, 255, 0.15);
              border-radius: 12px;
              padding: 1.75rem 1.5rem;
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              transition: border-color 0.2s, transform 0.2s;
            }
            .process-card:hover {
              border-color: rgba(56, 189, 248, 0.4);
              transform: translateY(-2px);
            }
            .process-step-label {
              font-family: var(--font-mono);
              font-size: 0.75rem;
              color: #1677FF;
              letter-spacing: 0.15em;
              font-weight: 700;
            }
            .process-card-title {
              font-size: 1.15rem;
              font-weight: 700;
              color: #F8FAFF;
              letter-spacing: 0.02em;
              margin: 0;
              text-transform: uppercase;
            }
            .process-card-desc {
              color: #94A3B8;
              font-size: 0.875rem;
              line-height: 1.55;
              margin: 0;
              font-weight: 300;
            }

            @media (max-width: 767px) {
              .process-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: clamp(0.5rem, 2.5vw, 0.85rem) !important;
              }
              .process-card {
                padding: clamp(0.75rem, 3vw, 1.1rem) !important;
                gap: 0.4rem !important;
                border-radius: 10px !important;
              }
              .process-step-label {
                font-size: 0.58rem !important;
                letter-spacing: 0.1em !important;
              }
              .process-card-title {
                font-size: clamp(0.75rem, 2.7vw, 0.88rem) !important;
                line-height: 1.25 !important;
                letter-spacing: 0.01em !important;
              }
              .process-card-desc {
                font-size: 0.6875rem !important;
                line-height: 1.35 !important;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '1rem',
              fontWeight: 600
            }}>
              HOW WE WORK
            </p>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 6vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#F8FAFF',
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>
              A Clear, Structured Process.
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: '#94A3B8',
              lineHeight: 1.65,
              marginBottom: 'clamp(2.5rem, 5vh, 4rem)',
              maxWidth: 600,
              fontWeight: 300
            }}>
              We eliminate uncertainty from development through clear, iterative milestones from discovery to production launch.
            </p>

            <div className="process-grid">
              {[
                { step: '01', name: 'UNDERSTAND', desc: 'Study the business problem, operational context, and core requirements.' },
                { step: '02', name: 'DEFINE', desc: 'Scope the technical architecture, data workflows, user roles, and success milestones.' },
                { step: '03', name: 'DESIGN', desc: 'Plan the product interface, system data models, and API interfaces for maximum clarity.' },
                { step: '04', name: 'BUILD', desc: 'Develop, test, and refine the system using production-grade frameworks and rigorous validation.' },
                { step: '05', name: 'DEPLOY', desc: 'Launch, monitor, document, and support the solution in secure cloud environments.' },
              ].map((item, i) => (
                <div key={i} className="process-card">
                  <span className="process-step-label">
                    {item.step} // PHASE
                  </span>
                  <h3 className="process-card-title">
                    {item.name}
                  </h3>
                  <p className="process-card-desc">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            WHY QUANTUM AI / PRINCIPLES
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
                We turn complex problems into intelligent, useful systems.
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#94A3B8', lineHeight: 1.7, marginBottom: '2.5rem', fontWeight: 300 }}>
                We combine AI, software, and thoughtful engineering to build technology that solves real problems and creates lasting value.
              </p>
              <NovaButton href="/about">LEARN MORE ABOUT US</NovaButton>
            </div>

            {/* Right: principles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: '#38BDF8',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: '0.5rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid rgba(22, 119, 255, 0.15)'
              }}>
                THINK DEEPER
              </div>
              {[
                { title: 'Understand First', desc: 'Study the problem before building the solution.' },
                { title: 'Build Smarter', desc: 'Choose technology for value, not hype.' },
                { title: 'Keep it Human', desc: 'Powerful systems should feel simple to use.' },
                { title: 'Create What Matters', desc: 'Build technology with real purpose and value.' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '1.5rem 0',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(22, 119, 255, 0.1)',
                  borderBottom: i === 3 ? '1px solid rgba(22, 119, 255, 0.1)' : 'none',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>0{i + 1}</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#F8FAFF', marginBottom: '0.35rem', letterSpacing: '-0.01em', textTransform: 'none' }}>{item.title}</h3>
                  <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: 'none', fontWeight: 300, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TECHNOLOGY SECTION (Capabilities Supporting the Business)
        ═══════════════════════════════════════════════════════════ */}
        <section className="tech-stack-section" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(6, 21, 43, 0.3)' }}>
          <style>{`
            .tech-stack-section {
              padding: clamp(6rem, 14vh, 12rem) clamp(1.25rem, 6vw, 6rem);
              box-sizing: border-box;
              width: 100%;
            }
            .tech-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1.5rem;
              width: 100%;
              box-sizing: border-box;
            }
            .tech-card {
              background-color: rgba(6, 21, 43, 0.6);
              border: 1px solid rgba(22, 119, 255, 0.12);
              border-radius: 12px;
              padding: 2rem;
              display: flex;
              flex-direction: column;
              gap: 1.25rem;
              transition: border-color 0.25s, box-shadow 0.25s;
              box-sizing: border-box;
              width: 100%;
            }
            .tech-card:hover {
              border-color: rgba(22, 119, 255, 0.35);
              box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            }
            .tech-card-title {
              font-size: 1.25rem;
              font-weight: 600;
              color: #F8FAFF;
              letter-spacing: -0.01em;
              text-transform: none;
              margin: 0;
            }
            .tech-card-desc {
              color: #94A3B8;
              font-size: 0.925rem;
              line-height: 1.55;
              margin: 0;
              font-weight: 300;
            }
            .tech-tags-container {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              margin-top: auto;
              padding-top: 1rem;
            }
            .tech-tag-pill {
              font-size: 0.75rem;
              font-family: var(--font-mono);
              padding: 0.35rem 0.75rem;
              background-color: rgba(22, 119, 255, 0.08);
              border: 1px solid rgba(22, 119, 255, 0.15);
              border-radius: 4px;
              color: #55D6FF;
              white-space: nowrap;
            }

            @media (max-width: 767px) {
              .tech-stack-section {
                padding: clamp(3.5rem, 8vh, 5rem) clamp(1rem, 4vw, 2rem) !important;
              }
              .tech-grid {
                grid-template-columns: 1fr !important;
                gap: 1rem !important;
              }
              .tech-card {
                padding: clamp(1.2rem, 3.5vw, 1.5rem) !important;
                gap: 0.85rem !important;
              }
              .tech-card-title {
                font-size: 1.15rem !important;
              }
              .tech-card-desc {
                font-size: 0.85rem !important;
                line-height: 1.5 !important;
              }
              .tech-tags-container {
                gap: 0.4rem !important;
                padding-top: 0.65rem !important;
              }
              .tech-tag-pill {
                font-size: 0.72rem !important;
                padding: 0.25rem 0.6rem !important;
              }
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
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
              CAPABILITIES
            </p>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 6vw, 4rem)',
              fontWeight: 700,
              color: '#F8FAFF',
              marginBottom: '0.75rem',
              letterSpacing: '-0.03em',
              textTransform: 'uppercase'
            }}>
              Our tech stack.
            </h2>
            <p style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
              color: '#94A3B8',
              lineHeight: 1.65,
              marginBottom: 'clamp(2rem, 5vh, 4rem)',
              maxWidth: 560,
              fontWeight: 300
            }}>
              We construct systems using production-proven languages and platforms capable of scaling seamlessly.
            </p>

            <div className="tech-grid">
              {techGroups.map((group, idx) => (
                <div key={idx} className="tech-card">
                  <h3 className="tech-card-title">
                    {group.title}
                  </h3>
                  <p className="tech-card-desc">
                    {group.desc}
                  </p>
                  <div className="tech-tags-container">
                    {group.tags.map((t: string) => (
                      <span key={t} className="tech-tag-pill">
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
            INTERACTIVE WORLD MAP
        ═══════════════════════════════════════════════════════════ */}
        <div style={{ pointerEvents: 'auto' }}>
          <GlobalMapSection />
        </div>

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

            {/* Team Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3.5rem' }}>
              <NovaButton href="/leadership">
                MEET THE FULL TEAM →
              </NovaButton>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TRUST & SECURITY SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(4rem, 10vh, 8rem) clamp(1rem, 5vw, 6rem)', pointerEvents: 'auto', backgroundColor: 'rgba(4, 14, 36, 0.6)', borderTop: '1px solid rgba(22, 119, 255, 0.1)', borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
          <style>{`
            .trust-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1.5rem;
            }
            .trust-card {
              background-color: rgba(6, 21, 43, 0.75);
              border: 1px solid rgba(22, 119, 255, 0.15);
              border-radius: 14px;
              padding: clamp(1.5rem, 3vw, 2rem);
              display: flex;
              flex-direction: column;
              gap: 0.85rem;
              transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
            }
            .trust-card:hover {
              border-color: rgba(56, 189, 248, 0.4);
              transform: translateY(-2px);
              box-shadow: 0 12px 30px -8px rgba(22, 119, 255, 0.25);
            }
            .trust-card-code {
              font-family: var(--font-mono);
              font-size: 0.6875rem;
              color: #38BDF8;
              letter-spacing: 0.15em;
              font-weight: 600;
              text-transform: uppercase;
            }
            .trust-card-title {
              font-size: 1.2rem;
              font-weight: 700;
              color: #F8FAFF;
              margin: 0;
              letter-spacing: -0.01em;
              text-transform: none;
            }
            .trust-card-desc {
              color: #94A3B8;
              font-size: 0.9rem;
              line-height: 1.6;
              margin: 0;
              font-weight: 300;
            }

            @media (max-width: 767px) {
              .trust-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: clamp(0.5rem, 2.5vw, 0.85rem) !important;
              }
              .trust-card {
                padding: clamp(0.75rem, 3vw, 1.1rem) !important;
                gap: 0.5rem !important;
                border-radius: 10px !important;
              }
              .trust-card-code {
                font-size: 0.58rem !important;
                letter-spacing: 0.1em !important;
              }
              .trust-card-title {
                font-size: clamp(0.75rem, 2.7vw, 0.88rem) !important;
                line-height: 1.25 !important;
                letter-spacing: -0.01em !important;
              }
              .trust-card-desc {
                font-size: 0.6875rem !important;
                line-height: 1.35 !important;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
            }
          `}</style>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '1rem',
              fontWeight: 600
            }}>
              TRUST & SECURITY
            </p>
            <h2 style={{
              fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#F8FAFF',
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>
              Engineered for Reliability and Security.
            </h2>
            <p style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: '#94A3B8',
              lineHeight: 1.65,
              marginBottom: 'clamp(2.5rem, 5vh, 4rem)',
              maxWidth: 620,
              fontWeight: 300
            }}>
              We prioritize data privacy, strict access control, and dependable cloud infrastructure across every software solution we deploy.
            </p>

            <div className="trust-grid">
              {[
                {
                  code: '01 // PRIVACY',
                  title: 'Data Privacy & Ownership',
                  desc: 'Your proprietary data, intellectual property, and client records remain completely yours, isolated in private cloud containers.'
                },
                {
                  code: '02 // ACCESS',
                  title: 'Role-Based Access Control',
                  desc: 'Granular user permission models, session authentication, and audit logs built into all internal platforms and APIs.'
                },
                {
                  code: '03 // INFRASTRUCTURE',
                  title: 'Production Cloud Reliability',
                  desc: 'Modern containerized infrastructure with continuous health monitoring, automated backups, and high uptime resilience.'
                },
                {
                  code: '04 // CONTINUITY',
                  title: 'Long-Term Support & Evolution',
                  desc: 'Clean, documented codebases and ongoing engineering maintenance so your systems stay performant as your business grows.'
                },
              ].map((item, idx) => (
                <div key={idx} className="trust-card">
                  <span className="trust-card-code">
                    {item.code}
                  </span>
                  <h3 className="trust-card-title">
                    {item.title}
                  </h3>
                  <p className="trust-card-desc">
                    {item.desc}
                  </p>
                </div>
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
                    <a href="mailto:fawadimraj@gmail.com" style={{ fontSize: '1.15rem', color: '#F8FAFF', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.color = '#1677FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#F8FAFF'}>
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
              <div style={{
                backgroundColor: '#040E24',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 16,
                padding: 'clamp(1.75rem, 4vw, 3rem)',
                boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.85), 0 0 30px -5px rgba(22, 119, 255, 0.2)'
              }}>
                {submitStatus === 'success' ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ color: '#34D399', fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
                    <h3 style={{ fontSize: '1.5rem', color: '#F8FAFC', marginBottom: '0.5rem', textTransform: 'none' }}>Project Inquiry Sent</h3>
                    <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginBottom: '2rem', fontWeight: 300 }}>Thank you for reaching out. An engineer will review your inquiry and connect with you shortly.</p>
                    <NovaButton onClick={() => setSubmitStatus('idle')}>SEND ANOTHER INQUIRY</NovaButton>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#94A3B8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>NAME <span style={{ color: '#38BDF8' }}>*</span></label>
                      <input
                        type="text"
                        name="name"
                        value={formState.name}
                        onChange={handleFormChange}
                        placeholder="Your full name"
                        style={{
                          backgroundColor: '#081735',
                          border: `1px solid ${formErrors.name ? '#EF4444' : 'rgba(56, 189, 248, 0.2)'}`,
                          borderRadius: 8,
                          color: '#F8FAFC',
                          padding: '0.85rem 1rem',
                          outline: 'none',
                          fontSize: '0.95rem',
                          width: '100%',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.2)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = formErrors.name ? '#EF4444' : 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      {formErrors.name && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.name}</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#94A3B8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>EMAIL <span style={{ color: '#38BDF8' }}>*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={formState.email}
                        onChange={handleFormChange}
                        placeholder="name@company.com"
                        style={{
                          backgroundColor: '#081735',
                          border: `1px solid ${formErrors.email ? '#EF4444' : 'rgba(56, 189, 248, 0.2)'}`,
                          borderRadius: 8,
                          color: '#F8FAFC',
                          padding: '0.85rem 1rem',
                          outline: 'none',
                          fontSize: '0.95rem',
                          width: '100%',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.2)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = formErrors.email ? '#EF4444' : 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      {formErrors.email && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{formErrors.email}</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#94A3B8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>COMPANY</label>
                      <input
                        type="text"
                        name="company"
                        value={formState.company}
                        onChange={handleFormChange}
                        placeholder="Company name (optional)"
                        style={{
                          backgroundColor: '#081735',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          borderRadius: 8,
                          color: '#F8FAFC',
                          padding: '0.85rem 1rem',
                          outline: 'none',
                          fontSize: '0.95rem',
                          width: '100%',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.2)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>

                    <div className="form-selects-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#94A3B8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>PROJECT TYPE</label>
                        <select
                          name="projectType"
                          value={formState.projectType}
                          onChange={handleFormChange}
                          style={{
                            backgroundColor: '#081735',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            borderRadius: 8,
                            color: '#F8FAFC',
                            padding: '0.85rem 1rem',
                            outline: 'none',
                            fontSize: '0.95rem',
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

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#94A3B8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>BUDGET RANGE</label>
                        <select
                          name="budget"
                          value={formState.budget}
                          onChange={handleFormChange}
                          style={{
                            backgroundColor: '#081735',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            borderRadius: 8,
                            color: '#F8FAFC',
                            padding: '0.85rem 1rem',
                            outline: 'none',
                            fontSize: '0.95rem',
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#94A3B8', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>MESSAGE <span style={{ color: '#38BDF8' }}>*</span></label>
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

                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B', lineHeight: 1.5, margin: '0.5rem 0 0 0', textAlign: 'center' }}>
                      🔒 Your information is confidential and used solely to evaluate your project inquiry.
                    </p>

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
