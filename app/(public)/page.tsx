'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGlobalStore } from '@/components/layout/GlobalStore';
import { NovaButton, GalaxyButton, ButtonStyles } from '@/components/ui/Buttons';
import { sampleProjects } from '@/lib/data/projects';
import { sampleServices } from '@/lib/data/services';
import { sampleTechnologies } from '@/lib/data/technologies';
import { sampleLeadership } from '@/lib/data/leadership';
import { sampleFaqs } from '@/lib/data/faqs';
import { companyData } from '@/lib/data/company';

// Dynamically imported components
const ParticleText = dynamic(() => import('@/components/ui/ParticleText'), { ssr: false });
import TestimonialsSection from '@/components/sections/TestimonialsSection';

export default function HomePage() {
  const { setScrollProgress } = useGlobalStore();
  const [isMounted, setIsMounted] = useState(false);

  // Dynamic API state with data fallback
  const [leaders, setLeaders] = useState<any[]>(sampleLeadership);
  const [caseStudies, setCaseStudies] = useState<any[]>(sampleProjects);
  const [services, setServices] = useState<any[]>(sampleServices);
  const [techList, setTechList] = useState<any[]>(sampleTechnologies);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact Form State
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    projectType: 'AI Systems',
    budget: '$10k - $25k',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync scroll progress
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

  // Fetch live database records with graceful local fallback
  useEffect(() => {
    fetch('/api/leadership')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLeaders(data.filter((m: any) => m.isActive !== false));
        }
      })
      .catch(() => {});

    fetch('/api/case-studies')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.filter((s: any) => s.published !== false).slice(0, 3);
          if (formatted.length > 0) setCaseStudies(formatted);
        }
      })
      .catch(() => {});

    fetch('/api/services')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const published = data.filter((s: any) => s.published !== false);
          if (published.length > 0) setServices(published);
        }
      })
      .catch(() => {});
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (formErrors[e.target.name]) {
      setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
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
        body: JSON.stringify(formState),
      });
      if (res.ok) {
        setSubmitStatus('success');
        setFormState({
          name: '',
          email: '',
          company: '',
          projectType: 'AI Systems',
          budget: '$10k - $25k',
          message: '',
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

  // Problems List
  const problems = [
    {
      num: '01',
      title: 'Manual Work',
      desc: 'Repetitive operational tasks consume valuable engineering and staff hours, creating friction and throttling growth.',
      solution: 'Automated agentic workflows that operate reliably 24/7.',
    },
    {
      num: '02',
      title: 'Disconnected Systems',
      desc: 'Critical enterprise data is fragmented across incompatible SaaS tools, legacy databases, and manual spreadsheets.',
      solution: 'Unified high-throughput data bridges and centralized portals.',
    },
    {
      num: '03',
      title: 'Outdated Software',
      desc: 'Off-the-shelf software forces rigid processes instead of adapting to your exact business logic and security needs.',
      solution: 'Custom business software built from first principles.',
    },
    {
      num: '04',
      title: 'AI Adoption Risk',
      desc: 'Organizations want to leverage modern AI models but face hallucination, data security, and latency challenges.',
      solution: 'Deterministic neural systems with zero data leakage.',
    },
  ];

  // How We Work Steps
  const processSteps = [
    {
      step: '01',
      title: 'Understand',
      desc: 'We analyze your core operational bottlenecks, workflows, and success metrics before writing a single line of code.',
    },
    {
      step: '02',
      title: 'Plan',
      desc: 'We architect the complete technical specification, data models, security perimeter, and milestone delivery roadmap.',
    },
    {
      step: '03',
      title: 'Build',
      desc: 'Focused agile engineering sprints with rigorous automated test suites and continuous progress transparency.',
    },
    {
      step: '04',
      title: 'Deploy',
      desc: 'Hardened production release with zero downtime, comprehensive documentation, and complete source code handover.',
    },
    {
      step: '05',
      title: 'Improve',
      desc: 'Real-time telemetry monitoring, automated scaling, and long-term architectural maintenance guarantees.',
    },
  ];

  return (
    <>
      <ButtonStyles />
      <div style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', overflowX: 'hidden' }}>

        {/* ─── 01. HERO SECTION ──────────────────────────────────────────────── */}
        <section
          style={{
            position: 'relative',
            minHeight: '92vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'calc(var(--nav-height) + 2.5rem) var(--container-px) 4rem',
            background: 'radial-gradient(ellipse at 50% 30%, rgba(10, 35, 71, 0.45) 0%, #030712 75%)',
          }}
        >
          {/* Subtle grid background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(30, 58, 138, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 58, 138, 0.1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
              pointerEvents: 'none',
            }}
          />

          <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 900 }}>
            {/* Small Label */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                color: 'var(--color-accent)',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '0.35rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                marginBottom: '1.75rem',
                textTransform: 'uppercase',
              }}
            >
              <span>AI</span>
              <span style={{ color: 'rgba(56, 189, 248, 0.4)' }}>•</span>
              <span>SOFTWARE</span>
              <span style={{ color: 'rgba(56, 189, 248, 0.4)' }}>•</span>
              <span>AUTOMATION</span>
            </div>

            {/* Particle Canvas / Main Heading */}
            {isMounted && (
              <div style={{ width: '100%', height: 'clamp(140px, 22vw, 220px)', margin: '0 auto 1.25rem' }}>
                <ParticleText
                  text="QUANTUM AI"
                  fontSize={85}
                  particleDensity={2}
                  particleSize={1.5}
                  textColor="#F8FAFC"
                />
              </div>
            )}

            <h1 className="hero-heading" style={{ marginBottom: '1.25rem', display: isMounted ? 'none' : 'block' }}>
              We build AI-powered software that helps businesses work smarter.
            </h1>

            <p
              className="body-large"
              style={{
                maxWidth: 680,
                margin: '0 auto 2.25rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.65,
              }}
            >
              We engineer custom AI systems, high-performance software, and intelligent automation for organizations ready to eliminate operational drag and scale with precision.
            </p>

            {/* Hero CTAs */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <NovaButton href="/contact">
                Book a Consultation →
              </NovaButton>
              <GalaxyButton href="/work">
                View Our Work
              </GalaxyButton>
            </div>
          </div>
        </section>

        {/* ─── 02. TRUST / CREDIBILITY SECTION ──────────────────────────────── */}
        <section
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-subtle)',
            padding: '2.5rem var(--container-px)',
          }}
        >
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.75rem',
                alignItems: 'center',
              }}
            >
              {companyData.stats.map((stat, idx) => (
                <div key={idx} style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: 'var(--color-text-primary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--color-accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.2rem',
                    }}
                  >
                    {stat.label}
                  </div>
                  {stat.description && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                      {stat.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 03. PROBLEMS WE SOLVE ────────────────────────────────────────── */}
        <section className="section" style={{ padding: 'var(--section-py) var(--container-px)' }}>
          <div className="container">
            <div style={{ maxWidth: 640, marginBottom: '2.5rem' }}>
              <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                [01 // CHALLENGES]
              </div>
              <h2 className="heading-2" style={{ marginBottom: '0.75rem' }}>
                Problems We Solve
              </h2>
              <p className="body-default">
                What operational bottlenecks are holding your organization back? We turn complex friction into clean software.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {problems.map((p) => (
                <div
                  key={p.num}
                  className="card card-interactive card-subtle"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1.2fr 1.5fr',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '1.25rem 1.75rem',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      color: 'var(--color-accent)',
                      fontWeight: 700,
                    }}
                  >
                    {p.num} //
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {p.desc}
                    </p>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--color-border-subtle)', paddingLeft: '1.25rem' }}>
                    <span className="mono-label" style={{ display: 'block', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                      ENGINEERED SOLUTION:
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {p.solution}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 04. CORE SERVICES ────────────────────────────────────────────── */}
        <section
          className="section"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderTop: '1px solid var(--color-border-subtle)',
            borderBottom: '1px solid var(--color-border-subtle)',
            padding: 'var(--section-py) var(--container-px)',
          }}
        >
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ maxWidth: 640 }}>
                <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                  [02 // SERVICES]
                </div>
                <h2 className="heading-2" style={{ marginBottom: '0.75rem' }}>
                  Core Engineering Services
                </h2>
                <p className="body-default">
                  Full-cycle software engineering from technical architecture to production deployment.
                </p>
              </div>
              <Link href="/services" className="btn btn-outline btn-sm">
                View All Services →
              </Link>
            </div>

            <div className="grid-3">
              {services.slice(0, 3).map((srv, idx) => (
                <Link
                  key={srv.id || idx}
                  href={`/services#${srv.category?.toLowerCase() || 'ai'}`}
                  className="card card-interactive"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="card-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-primary">{srv.category || 'AI'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        0{idx + 1}
                      </span>
                    </div>
                    <h3 className="card-title" style={{ marginTop: '0.75rem' }}>
                      {srv.name}
                    </h3>
                    <p className="card-description">
                      {srv.shortDescription || srv.description}
                    </p>
                  </div>

                  {srv.capabilities && srv.capabilities.length > 0 && (
                    <div className="card-body">
                      <div className="mono-label" style={{ fontSize: '0.68rem', marginBottom: '0.5rem' }}>
                        KEY CAPABILITIES
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {srv.capabilities.slice(0, 3).map((cap: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            <span style={{ color: 'var(--color-accent)' }}>•</span>
                            <span>{cap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="card-footer">
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      EXPLORE SERVICE →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 05. FEATURED CASE STUDIES ────────────────────────────────────── */}
        <section className="section" style={{ padding: 'var(--section-py) var(--container-px)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ maxWidth: 640 }}>
                <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                  [03 // CASE STUDIES]
                </div>
                <h2 className="heading-2" style={{ marginBottom: '0.75rem' }}>
                  Featured Deployments
                </h2>
                <p className="body-default">
                  Verified results and architectures delivered across enterprise logistics, healthcare, and finance.
                </p>
              </div>
              <Link href="/work" className="btn btn-outline btn-sm">
                View All Case Studies →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {caseStudies.slice(0, 3).map((cs, idx) => {
                const techArray = typeof cs.technologies === 'string'
                  ? cs.technologies.split(',').map((t: string) => t.trim())
                  : cs.technologies || [];

                return (
                  <div
                    key={cs.id || idx}
                    className="card card-interactive"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.5fr 1fr',
                      gap: '1.75rem',
                      alignItems: 'center',
                      padding: '1.5rem 1.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                          {cs.industry || 'Enterprise'}
                        </span>
                        {cs.year && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                            {cs.year}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                        {cs.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {cs.shortDescription || cs.problem}
                      </p>
                    </div>

                    <div>
                      <div className="mono-label" style={{ fontSize: '0.65rem', marginBottom: '0.4rem' }}>
                        TECHNOLOGY STACK
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {techArray.slice(0, 5).map((t: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      {cs.results && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: 500, maxWidth: 220 }}>
                          {cs.results}
                        </div>
                      )}
                      <Link
                        href={`/work`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: 'var(--color-accent)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        CASE STUDY ↗
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 06. HOW WE WORK ──────────────────────────────────────────────── */}
        <section
          className="section"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderTop: '1px solid var(--color-border-subtle)',
            borderBottom: '1px solid var(--color-border-subtle)',
            padding: 'var(--section-py) var(--container-px)',
          }}
        >
          <div className="container">
            <div style={{ maxWidth: 640, marginBottom: '2.5rem' }}>
              <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                [04 // PROCESS]
              </div>
              <h2 className="heading-2" style={{ marginBottom: '0.75rem' }}>
                A Clear, Structured Process
              </h2>
              <p className="body-default">
                From initial discovery to continuous production deployment, our process is disciplined, transparent, and outcome-oriented.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {processSteps.map((step) => (
                <div
                  key={step.step}
                  className="card"
                  style={{
                    padding: '1.5rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--color-accent)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {step.step}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 07. WHY CHOOSE US ────────────────────────────────────────────── */}
        <section className="section" style={{ padding: 'var(--section-py) var(--container-px)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '3rem', alignItems: 'center' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                  [05 // WHY QUANTUM AI]
                </div>
                <h2 className="heading-2" style={{ marginBottom: '1rem' }}>
                  We Turn Complex Problems into Intelligent, Useful Systems.
                </h2>
                <p className="body-large" style={{ marginBottom: '1.75rem' }}>
                  We combine AI, software, and thoughtful engineering to build technology that solves real business friction and creates lasting value.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <NovaButton href="/contact">
                    Start a Project →
                  </NovaButton>
                  <GalaxyButton href="/about">
                    About Our Philosophy
                  </GalaxyButton>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {companyData.principles.map((pr) => (
                  <div
                    key={pr.number}
                    className="card card-subtle"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '48px 1fr',
                      gap: '1rem',
                      padding: '1.1rem 1.25rem',
                      alignItems: 'start',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                      {pr.number}
                    </span>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>
                        {pr.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {pr.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 08. TECHNOLOGY STACK ─────────────────────────────────────────── */}
        <section
          className="section"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderTop: '1px solid var(--color-border-subtle)',
            borderBottom: '1px solid var(--color-border-subtle)',
            padding: 'var(--section-py) var(--container-px)',
          }}
        >
          <div className="container">
            <div style={{ maxWidth: 640, marginBottom: '2.5rem' }}>
              <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                [06 // CAPABILITIES]
              </div>
              <h2 className="heading-2" style={{ marginBottom: '0.75rem' }}>
                Our Technology Stack
              </h2>
              <p className="body-default">
                Hardened, production-tested technologies chosen for performance, reliability, and long-term maintainability.
              </p>
            </div>

            <div className="grid-2">
              {techList.map((t, idx) => (
                <div key={t.id || idx} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t.name}
                    </h3>
                    <span className="badge badge-default">{t.category}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.55 }}>
                    {t.shortDescription}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {t.tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.55rem',
                          backgroundColor: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#38BDF8',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 09. TESTIMONIALS ─────────────────────────────────────────────── */}
        <TestimonialsSection />

        {/* ─── 10. ABOUT / COMPANY PREVIEW ──────────────────────────────────── */}
        <section className="section" style={{ padding: 'var(--section-py) var(--container-px)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ maxWidth: 640 }}>
                <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                  [07 // LEADERSHIP]
                </div>
                <h2 className="heading-2" style={{ marginBottom: '0.75rem' }}>
                  The People Behind Quantum AI
                </h2>
                <p className="body-default">
                  Specialized systems architects and engineers committed to building software that solves concrete problems.
                </p>
              </div>
              <Link href="/leadership" className="btn btn-outline btn-sm">
                Meet Full Team →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
              {leaders.slice(0, 2).map((leader) => (
                <div key={leader.id} className="card card-interactive" style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--color-border-subtle)', background: 'rgba(3, 7, 18, 0.6)' }}>
                    <span className="mono-label" style={{ fontSize: '0.65rem' }}>QUANTUM AI</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-accent)' }}>{leader.publicId}</span>
                  </div>
                  {leader.photo && (
                    <div style={{ aspectRatio: '16/10', width: '100%', overflow: 'hidden', background: '#07152F' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={leader.photo} alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>
                      {leader.name}
                    </h3>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {leader.position}
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {leader.shortBio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 11. FAQ ACCORDION ────────────────────────────────────────────── */}
        <section
          className="section"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderTop: '1px solid var(--color-border-subtle)',
            borderBottom: '1px solid var(--color-border-subtle)',
            padding: 'var(--section-py) var(--container-px)',
          }}
        >
          <div className="container" style={{ maxWidth: 840 }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                [08 // FAQ]
              </div>
              <h2 className="heading-2" style={{ marginBottom: '0.75rem' }}>
                Frequently Asked Questions
              </h2>
              <p className="body-default">
                Everything you need to know about our engagement model, data privacy, and delivery standards.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sampleFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.id}
                    className="card"
                    style={{
                      padding: '1.1rem 1.25rem',
                      cursor: 'pointer',
                      borderColor: isOpen ? 'var(--color-border-hover)' : 'var(--color-border)',
                      transition: 'border-color 0.2s',
                    }}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                        {faq.question}
                      </h3>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1rem',
                          color: 'var(--color-accent)',
                          transition: 'transform 0.2s',
                          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        }}
                      >
                        +
                      </span>
                    </div>
                    {isOpen && (
                      <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0.75rem 0 0 0' }}>
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 12. FINAL CTA & INQUIRY FORM ─────────────────────────────────── */}
        <section className="section" style={{ padding: 'var(--section-py) var(--container-px)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '3.5rem', alignItems: 'start' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                  [09 // INITIATE]
                </div>
                <h2 className="heading-2" style={{ marginBottom: '1rem' }}>
                  Have a Business Problem Worth Solving?
                </h2>
                <p className="body-large" style={{ marginBottom: '2rem' }}>
                  Tell us what you are trying to improve. We can help determine whether custom software, AI, or automation is the right approach.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div className="mono-label" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                      DIRECT INQUIRIES
                    </div>
                    <a
                      href="mailto:fawadimraj@gmail.com"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1rem',
                        color: 'var(--color-accent)',
                        textDecoration: 'none',
                      }}
                    >
                      hello@quantumai.dev
                    </a>
                  </div>

                  <div>
                    <div className="mono-label" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                      RESPONSE TIME
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Initial technical evaluation within 24 business hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="card" style={{ padding: '2rem' }}>
                {submitStatus === 'success' ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ fontSize: '2.5rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>✓</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.5rem' }}>
                      Consultation Request Sent
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
                      Thank you. An engineering lead will review your project requirements and follow up within 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitStatus('idle')}
                      className="btn btn-outline btn-sm"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label className="mono-label" style={{ display: 'block', fontSize: '0.68rem', marginBottom: '0.35rem' }}>
                        YOUR NAME *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formState.name}
                        onChange={handleFormChange}
                        placeholder="e.g. Alex Morgan"
                        style={{
                          width: '100%',
                          padding: '0.7rem 0.9rem',
                          backgroundColor: 'rgba(3, 7, 18, 0.8)',
                          border: `1px solid ${formErrors.name ? 'var(--color-error)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          color: '#F8FAFC',
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                      {formErrors.name && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="mono-label" style={{ display: 'block', fontSize: '0.68rem', marginBottom: '0.35rem' }}>
                          WORK EMAIL *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formState.email}
                          onChange={handleFormChange}
                          placeholder="alex@company.com"
                          style={{
                            width: '100%',
                            padding: '0.7rem 0.9rem',
                            backgroundColor: 'rgba(3, 7, 18, 0.8)',
                            border: `1px solid ${formErrors.email ? 'var(--color-error)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)',
                            color: '#F8FAFC',
                            fontSize: '0.9rem',
                            outline: 'none',
                          }}
                        />
                        {formErrors.email && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{formErrors.email}</span>}
                      </div>

                      <div>
                        <label className="mono-label" style={{ display: 'block', fontSize: '0.68rem', marginBottom: '0.35rem' }}>
                          ORGANIZATION / COMPANY
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formState.company}
                          onChange={handleFormChange}
                          placeholder="e.g. Apex Corp"
                          style={{
                            width: '100%',
                            padding: '0.7rem 0.9rem',
                            backgroundColor: 'rgba(3, 7, 18, 0.8)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            color: '#F8FAFC',
                            fontSize: '0.9rem',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="mono-label" style={{ display: 'block', fontSize: '0.68rem', marginBottom: '0.35rem' }}>
                          PROJECT TYPE
                        </label>
                        <select
                          name="projectType"
                          value={formState.projectType}
                          onChange={handleFormChange}
                          style={{
                            width: '100%',
                            padding: '0.7rem 0.9rem',
                            backgroundColor: 'rgba(3, 7, 18, 0.8)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            color: '#F8FAFC',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        >
                          <option value="AI Systems">AI Systems & Neural Models</option>
                          <option value="Business Software">Custom Business Software</option>
                          <option value="Workflow Automation">Workflow Automation</option>
                          <option value="Digital Product">Digital Product / SaaS</option>
                          <option value="Other">Technical Advisory / Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="mono-label" style={{ display: 'block', fontSize: '0.68rem', marginBottom: '0.35rem' }}>
                          BUDGET RANGE
                        </label>
                        <select
                          name="budget"
                          value={formState.budget}
                          onChange={handleFormChange}
                          style={{
                            width: '100%',
                            padding: '0.7rem 0.9rem',
                            backgroundColor: 'rgba(3, 7, 18, 0.8)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            color: '#F8FAFC',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        >
                          <option value="< $10k">&lt; $10,000</option>
                          <option value="$10k - $25k">$10,000 – $25,000</option>
                          <option value="$25k - $50k">$25,000 – $50,000</option>
                          <option value="$50k+">$50,000+</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mono-label" style={{ display: 'block', fontSize: '0.68rem', marginBottom: '0.35rem' }}>
                        PROJECT DETAILS & BOTTLENECKS *
                      </label>
                      <textarea
                        name="message"
                        value={formState.message}
                        onChange={handleFormChange}
                        rows={3}
                        placeholder="Tell us what you are trying to improve or build..."
                        style={{
                          width: '100%',
                          padding: '0.7rem 0.9rem',
                          backgroundColor: 'rgba(3, 7, 18, 0.8)',
                          border: `1px solid ${formErrors.message ? 'var(--color-error)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          color: '#F8FAFC',
                          fontSize: '0.9rem',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                      {formErrors.message && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{formErrors.message}</span>}
                    </div>

                    {submitStatus === 'error' && (
                      <div style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>
                        Failed to submit inquiry. Please try again or email us directly at hello@quantumai.dev.
                      </div>
                    )}

                    <NovaButton type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: '0.5rem' }}>
                      {isSubmitting ? 'Transmitting...' : 'Submit Consultation Request →'}
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
