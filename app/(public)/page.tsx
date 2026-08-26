'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGlobalStore } from '@/components/layout/GlobalStore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { NovaButton, GalaxyButton, ButtonStyles } from '@/components/ui/Buttons';
import ChallengesSection from '@/components/sections/ChallengesSection';
import SolutionsSection from '@/components/sections/SolutionsSection';
import WhoWeHelpSection from '@/components/sections/WhoWeHelpSection';
import CaseStudiesSection from '@/components/sections/CaseStudiesSection';
import ProcessSection from '@/components/sections/ProcessSection';
import CapabilitiesSection from '@/components/sections/CapabilitiesSection';
import ClientsSection from '@/components/sections/ClientsSection';
import WhyQuantumSection from '@/components/sections/WhyQuantumSection';

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
      id: '2',
      name: 'Fahad Khan',
      position: 'Co-Founder & Executive Chairman',
      shortBio: 'Co-Founder and Executive Chairman of Quantum AI, supporting strategic direction, technical vision, and long-term growth.',
      photo: 'https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787049467020-Screenshot_2026-08-18_153738.png',
      slug: 'fahad-khan',
      publicId: 'QA-001'
    },
    {
      id: '1',
      name: 'Fawadullah Imraj',
      position: 'Co-Founder & CEO',
      shortBio: 'Co-Founder and CEO of Quantum AI, building AI-powered software and digital solutions for schools, colleges, and businesses.',
      photo: 'https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787049252241-Screenshot_2025-02-11_170816.png',
      slug: 'fawadullah-imraj',
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
          const activeList = data.filter((m: any) => m.isActive !== false);
          const sorted = [...activeList].sort((a: any, b: any) => {
            const isChairmanA = (a.position && a.position.toLowerCase().includes('chairman')) || (a.slug && a.slug.includes('fahad'));
            const isChairmanB = (b.position && b.position.toLowerCase().includes('chairman')) || (b.slug && b.slug.includes('fahad'));
            if (isChairmanA && !isChairmanB) return -1;
            if (!isChairmanA && isChairmanB) return 1;

            const isCeoA = (a.position && (a.position.toLowerCase().includes('ceo') || a.position.toLowerCase().includes('chief executive'))) || (a.slug && a.slug.includes('fawad'));
            const isCeoB = (b.position && (b.position.toLowerCase().includes('ceo') || b.position.toLowerCase().includes('chief executive'))) || (b.slug && b.slug.includes('fawad'));
            if (isCeoA && !isCeoB) return -1;
            if (!isCeoA && isCeoB) return 1;

            return (a.displayOrder || 0) - (b.displayOrder || 0);
          });
          setLeaders(sorted);
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
        html, body { width: 100% !important; max-width: 100% !important; overflow-x: hidden !important; box-sizing: border-box !important; }
        * { box-sizing: border-box !important; }
        /* ── Mobile Responsive Overrides ── */
        @media (max-width: 640px) {
          /* Hero heading */
          .hero-eyebrow { letter-spacing: 0.15em !important; font-size: 0.7rem !important; }
          /* Section padding */
          section:not(.continuous-clients-section):not(.test-marquee-section) {
            padding-left: clamp(0.75rem, 4vw, 1.5rem) !important;
            padding-right: clamp(0.75rem, 4vw, 1.5rem) !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Contact form 2-column selects → 1-col on tiny screens */
          .form-selects-row { grid-template-columns: 1fr !important; }
          /* Leadership 2by2 on phone */
          .home-leadership-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.6rem !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .home-leadership-grid > a {
            border-radius: 8px !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .home-leadership-grid > a > div:first-child {
            padding: 0.4rem 0.5rem !important;
          }
          .home-leadership-grid > a > div:nth-child(2) {
            aspect-ratio: 1/1 !important;
            max-height: 150px !important;
          }
          .home-leadership-grid > a > div:last-child {
            padding: 0.65rem !important;
          }
          .home-leadership-grid h3 {
            font-size: 0.85rem !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
          .home-leadership-grid p {
            font-size: 0.72rem !important;
            line-height: 1.3 !important;
            -webkit-line-clamp: 2 !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
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
      <div style={{ position: 'relative', width: '100%', maxWidth: '100%', overflowX: 'hidden', pointerEvents: 'none' }}>

        {/* ═══════════════════════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section
          style={{
            minHeight: '85vh',
            display: 'flex',
            alignItems: 'center',
            padding: 'clamp(3.5rem, 7vh, 5.5rem) clamp(1.25rem, 5vw, 5rem) clamp(2rem, 4vh, 3rem)',
            position: 'relative',
          }}
        >
          {/* Semantic H1 for SEO & accessibility — visually hidden */}
          <h1 className="sr-only">We Build Intelligent Software — Quantum AI</h1>

          <div style={{ maxWidth: 860, pointerEvents: 'auto', position: 'relative', zIndex: 2 }}>
            <p
              className="hero-eyebrow"
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.72rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#38BDF8',
                marginBottom: '0.85rem',
                fontWeight: 600,
              }}
            >
              [SYS.01] AI SYSTEMS · BUSINESS SOFTWARE · AUTOMATION
            </p>

            {/* ParticleText visual headline */}
            <div style={{
              height: 'clamp(190px, 30vw, 300px)',
              width: 'clamp(280px, 90vw, 840px)',
              marginBottom: '1.25rem',
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
              fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
              maxWidth: 620,
              fontWeight: 300,
            }}>
              Quantum AI builds AI systems, custom business software, and automation designed around the way your organization actually works.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <NovaButton href="/contact">START A PROJECT</NovaButton>
              <GalaxyButton href="/work">EXPLORE OUR WORK</GalaxyButton>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            01 // WHAT WE BUILD (Solutions: AI Systems, Business Software, Automation, Digital Products)
        ═══════════════════════════════════════════════════════════ */}
        <SolutionsSection />

        {/* ═══════════════════════════════════════════════════════════
            02 // WHO WE HELP (Education, Businesses, Startups, Organizations)
        ═══════════════════════════════════════════════════════════ */}
        <WhoWeHelpSection />

        {/* ═══════════════════════════════════════════════════════════
            03 // PROBLEMS WE SOLVE (Manual Operations, Disconnected Data, Slow Workflows, Complex Processes)
        ═══════════════════════════════════════════════════════════ */}
        <ChallengesSection />

        {/* ═══════════════════════════════════════════════════════════
            04 // SELECTED WORK & DEPLOYMENTS
        ═══════════════════════════════════════════════════════════ */}
        <CaseStudiesSection />

        {/* ═══════════════════════════════════════════════════════════
            05 // HOW WE WORK / DELIVERY PROCESS
        ═══════════════════════════════════════════════════════════ */}
        <ProcessSection />

        {/* ═══════════════════════════════════════════════════════════
            06 // WHY QUANTUM AI
        ═══════════════════════════════════════════════════════════ */}
        <WhyQuantumSection />

        {/* ═══════════════════════════════════════════════════════════
            07 // CORE TECHNOLOGY CAPABILITIES
        ═══════════════════════════════════════════════════════════ */}
        <CapabilitiesSection />

        {/* ═══════════════════════════════════════════════════════════
            INTERACTIVE WORLD MAP
        ═══════════════════════════════════════════════════════════ */}
        <div style={{ pointerEvents: 'auto' }}>
          <GlobalMapSection />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            LEADERSHIP SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(2.5rem, 5vh, 4rem) clamp(1rem, 5vw, 6rem)', pointerEvents: 'auto', backgroundColor: 'rgba(6, 21, 43, 0.2)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}>
              LEADERSHIP
            </p>
            <h2
              className="section-heading"
              style={{
                fontSize: 'clamp(2.5rem, 4.8vw, 3.85rem)',
                fontWeight: 700,
                lineHeight: 1.02,
                color: '#F8FAFF',
                marginBottom: '0.65rem',
                letterSpacing: '-0.035em',
                textTransform: 'uppercase'
              }}
            >
              The people behind Quantum AI.
            </h2>
            <p
              className="section-desc"
              style={{
                fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)',
                color: '#94A3B8',
                lineHeight: 1.6,
                marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
                maxWidth: 560,
                fontWeight: 300
              }}
            >
              Engineers and architects building enterprise products.
            </p>

            <div
              className="home-leadership-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1.25rem',
                maxWidth: 960,
                width: '100%',
                margin: '0 auto',
                boxSizing: 'border-box',
              }}
            >
              {leaders.slice(0, 2).map((person) => (
                <Link
                  key={person.id || person.slug}
                  href={`/leadership/${person.slug || 'fawadullah-imraj'}`}
                  style={{
                    backgroundColor: 'rgba(6, 21, 43, 0.7)',
                    border: '1px solid rgba(22, 119, 255, 0.15)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    minWidth: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(22, 119, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.15)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Card Header Tag */}
                  <div style={{
                    padding: '0.5rem 0.85rem',
                    borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#1677FF', textTransform: 'uppercase' }}>
                      QUANTUM AI
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#64748B' }}>
                      {person.slug?.includes('fahad') || person.position?.toLowerCase().includes('chairman') ? 'QA-001' : person.slug?.includes('fawad') || person.position?.toLowerCase().includes('ceo') ? 'QA-002' : (person.publicId || 'QA-LEAD')}
                    </span>
                  </div>

                  {/* Photo Container */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '16/10',
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
                  <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: '#F8FAFF',
                      margin: '0 0 0.2rem 0',
                      letterSpacing: '-0.01em',
                      textTransform: 'none',
                      lineHeight: 1.3,
                    }}>
                      {person.name}
                    </h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#55D6FF', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                      {person.position}
                    </span>
                    <p style={{ color: '#94A3B8', fontSize: '0.825rem', lineHeight: 1.45, margin: 0, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {person.shortBio}
                    </p>
                    <span style={{ marginTop: 'auto', paddingTop: '0.65rem', color: '#38BDF8', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                      VIEW PROFILE →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Team Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.75rem' }}>
              <NovaButton href="/leadership">
                MEET THE FULL TEAM →
              </NovaButton>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            WITH WHOM WE HAVE WORKED WITH SECTION (Clients & Organizations)
        ═══════════════════════════════════════════════════════════ */}
        <ClientsSection />

        {/* ═══════════════════════════════════════════════════════════
            TESTIMONIALS SECTION (Directly connected to Admin / DB)
        ═══════════════════════════════════════════════════════════ */}
        <TestimonialsSection />

        {/* ═══════════════════════════════════════════════════════════
            CONTACT SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section id="contact-form" style={{ padding: 'clamp(2.5rem, 5vh, 4rem) clamp(1rem, 5vw, 6rem)', pointerEvents: 'auto' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}>
              CONTACT
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                <h2
                  className="section-heading"
                  style={{
                    fontSize: 'clamp(2.5rem, 4.8vw, 3.85rem)',
                    fontWeight: 700,
                    lineHeight: 1.02,
                    letterSpacing: '-0.035em',
                    color: '#F8FAFF',
                    marginBottom: '0.65rem',
                    textTransform: 'uppercase',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  Let's build something useful.
                </h2>
                <p
                  className="section-desc"
                  style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', color: '#94A3B8', lineHeight: 1.6, marginBottom: '1.25rem', fontWeight: 300, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  Tell us what you are building, what problem you are solving, or what you want to improve.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(22, 119, 255, 0.1)', paddingTop: '1.25rem' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>EMAIL INQUIRIES</span>
                    <a href="mailto:hello@quantumai.dev" style={{ fontSize: '1rem', color: '#F8FAFC', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500, wordBreak: 'break-word' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1677FF'} onMouseLeave={(e) => e.currentTarget.style.color = '#F8FAFC'}>
                      hello@quantumai.dev
                    </a>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.15em', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>RESPONSE MATRIX</span>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>We review all incoming submissions and reply within 24 hours.</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div style={{
                backgroundColor: '#040E24',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 12,
                padding: 'clamp(1.25rem, 3vw, 2.25rem)',
                boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 20px -5px rgba(22, 119, 255, 0.15)',
                minWidth: 0,
                width: '100%',
                boxSizing: 'border-box'
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
                          <option value="">Select project type...</option>
                          <option value="AI System">AI System</option>
                          <option value="Business Software">Business Software</option>
                          <option value="Automation">Automation</option>
                          <option value="Digital Product">Digital Product</option>
                          <option value="Website / Web Application">Website / Web Application</option>
                          <option value="Existing System Improvement">Existing System Improvement</option>
                          <option value="Other">Other</option>
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
                          <option value="< $5,000">&lt; $5,000</option>
                          <option value="$5,000 - $15,000">$5,000 - $15,000</option>
                          <option value="$15,000 - $50,000">$15,000 - $50,000</option>
                          <option value="$50,000+">$50,000+</option>
                          <option value="Undecided / Flexible">Undecided / Flexible</option>
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
