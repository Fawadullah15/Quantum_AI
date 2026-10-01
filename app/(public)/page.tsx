
import React from 'react';
import prisma from '@/lib/db';
import { Leadership, CaseStudy, Service, Technology } from '@prisma/client';
import { HomeContactForm, ClientParticleText, ClientGlobalMapSection } from '@/components/sections/HomeClient';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { NovaButton, GalaxyButton, ButtonStyles } from '@/components/ui/Buttons';
import ChallengesSection from '@/components/sections/ChallengesSection';
import SolutionsSection from '@/components/sections/SolutionsSection';
import WhoWeHelpSection from '@/components/sections/WhoWeHelpSection';
import CaseStudiesSection from '@/components/sections/CaseStudiesSection';
import ProcessSection from '@/components/sections/ProcessSection';
import CapabilitiesSection from '@/components/sections/CapabilitiesSection';
const ClientsSection = dynamic(() => import('@/components/sections/ClientsSection'), { ssr: true });
import WhyQuantumSection from '@/components/sections/WhyQuantumSection';

const TestimonialsSection = dynamic(() => import('@/components/sections/TestimonialsSection'), { ssr: true });
import MarsHeroVideo from '@/components/ui/MarsHeroVideo';
import Image from 'next/image';

export default async function HomePage() {
  let dbLeaders: Leadership[] = [];
  try {
    dbLeaders = await prisma.leadership.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  } catch (e) {
    console.error('Failed to fetch leaders:', e);
  }

  let dbCaseStudies: CaseStudy[] = [];
  try {
    dbCaseStudies = await prisma.caseStudy.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
      take: 4,
    });
  } catch (e) {
    console.error('Failed to fetch case studies:', e);
  }

  let dbServices: Service[] = [];
  try {
    dbServices = await prisma.service.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
    });
  } catch (e) {
    console.error('Failed to fetch services:', e);
  }

  let dbTech: Technology[] = [];
  try {
    dbTech = await prisma.technology.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
    });
  } catch (e) {
    console.error('Failed to fetch technology:', e);
  }

  const caseStudies = dbCaseStudies.map((s, i) => ({
    step: String(i + 1).padStart(2, '0'),
    industry: s.industry ? s.industry.split('/')[0].trim() : 'Technology',
    year: String(s.year || new Date().getFullYear()),
    title: s.title,
    desc: s.problem || s.solution || '',
    technologies: s.technologies
      ? s.technologies.split(',').map((t) => t.trim()).filter(Boolean)
      : ['Next.js', 'TypeScript', 'Prisma'],
    slug: s.slug,
    image: s.heroImage || null,
    gradient: i % 2 === 0 ? 'linear-gradient(135deg, #050C0E 0%, #0A181B 100%)' : 'linear-gradient(135deg, #071214 0%, #0D2023 100%)',
    accentIcon: '✨',
  }));

  const solutions = dbServices.map((s, i) => ({
    step: String(i + 1).padStart(2, '0'),
    name: s.name,
    desc: s.description || '',
    href: `/services#${(s as any).slug || ''}`,
  }));

  const grouped: Record<string, string[]> = {};
  const descMap: Record<string, string> = {
    'AI & Machine Learning': 'Models, neural networks, retrieval platforms, and agentic workflows.',
    'Applications': 'Robust frontend rendering engines and high-throughput backend APIs.',
    'Data Systems': 'Transactional, document-store, cache, and vector memory instances.',
    'Infrastructure': 'Virtualization, cloud computation, secure configurations, and automation pipelines.'
  };
  dbTech.forEach((t) => {
    const cat = t.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t.name);
  });
  const techGroups = Object.keys(grouped).map((title, idx) => ({
    num: String(idx + 1).padStart(2, '0'),
    title: title.toUpperCase(),
    desc: descMap[title] || `Engineering capabilities and stack for ${title}.`,
    tags: grouped[title]
  }));

  const leaders = dbLeaders;

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
            HERO SECTION — MARS SPACE ARRIVAL
        ═══════════════════════════════════════════════════════════ */}
        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            padding: 'clamp(4.5rem, 8vh, 6.5rem) clamp(1.25rem, 5vw, 5rem) clamp(2.5rem, 5vh, 4rem)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ── Mars Video Background (Spacex-style revolving Mars with instant poster & mobile responsive framing) ── */}
          <MarsHeroVideo />

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
                color: '#FFFFFF',
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
              filter: 'drop-shadow(0 4px 24px rgba(2, 7, 8, 0.95))',
            }}>
              <ClientParticleText
                text={`WE BUILD\nINTELLIGENT\nSOFTWARE`}
                fontSize={95}
                particleDensity={3}
                particleSize={1.4}
                textColor="#FFFFFF"
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
              color: '#FFFFFF',
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
        <SolutionsSection solutions={solutions} />

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
        <CaseStudiesSection initialStudies={caseStudies} />

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
        <CapabilitiesSection techGroups={techGroups} />

        {/* ═══════════════════════════════════════════════════════════
            INTERACTIVE WORLD MAP
        ═══════════════════════════════════════════════════════════ */}
        <div style={{ pointerEvents: 'auto' }}>
          <ClientGlobalMapSection />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            LEADERSHIP SECTION
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(2.5rem, 5vh, 4rem) clamp(1rem, 5vw, 6rem)', pointerEvents: 'auto', backgroundColor: 'rgba(7, 18, 20, 0.4)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
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
                color: '#FFFFFF',
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
                color: '#FFFFFF',
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
                  href={`/leadership/${person.slug || 'muhammad-murtaza'}`}
                  style={{
                    backgroundColor: 'rgba(7, 18, 20, 0.7)',
                    border: '1px solid rgba(20, 184, 166, 0.15)',
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
                  
                  
                >
                  {/* Card Header Tag */}
                  <div style={{
                    padding: '0.5rem 0.85rem',
                    borderBottom: '1px solid rgba(20, 184, 166, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#FFFFFF', textTransform: 'uppercase' }}>
                      QUANTUM AI
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#FFFFFF' }}>
                      {person.publicId || 'QA-LEAD'}
                    </span>
                  </div>

                  {/* Photo Container */}
                  <div style={{
                    width: '100%',
                    position: 'relative', aspectRatio: '1/1', backgroundColor: '#020708',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {person.photo ? (
                      <Image src={person.photo} alt={person.name} fill sizes="(max-width: 768px) 50vw, 300px" style={{ objectFit: 'cover', objectPosition: 'center top' }} />
                    ) : (
                      <div style={{ color: '#FFFFFF', fontSize: '2rem' }}>👤</div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      margin: '0 0 0.2rem 0',
                      letterSpacing: '-0.01em',
                      textTransform: 'none',
                      lineHeight: 1.3,
                    }}>
                      {person.name}
                    </h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#FFFFFF', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                      {person.position}
                    </span>
                    <p style={{ color: '#FFFFFF', fontSize: '0.825rem', lineHeight: 1.45, margin: 0, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {person.shortBio}
                    </p>
                    <span style={{ marginTop: 'auto', paddingTop: '0.65rem', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
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
            SOLUTIONS DISCOVERY BANNER (Bottom Landing Page)
        ═══════════════════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(1.5rem, 3.5vh, 2.75rem) clamp(1rem, 5vw, 6rem)', pointerEvents: 'auto' }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(7, 18, 20, 0.85) 0%, rgba(10, 24, 27, 0.95) 100%)',
            border: '1px solid rgba(20, 184, 166, 0.22)',
            borderRadius: 14,
            padding: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.7), 0 0 24px -6px rgba(20, 184, 166, 0.18)',
          }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
                CUSTOM SOFTWARE ARCHITECTURES
              </div>
              <h3 style={{ fontSize: 'clamp(1.3rem, 2.4vw, 1.75rem)', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Tailored solutions engineered for your operations.
              </h3>
              <p style={{ color: '#FFFFFF', fontSize: '0.9rem', lineHeight: 1.55, margin: 0, fontWeight: 300 }}>
                From autonomous agentic workflows and automated pipelines to enterprise operations platforms, discover our complete software systems catalog.
              </p>
            </div>
            <Link
              href="/services"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.65rem',
                backgroundColor: '#0F766E',
                borderRadius: 8,
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(20, 184, 166, 0.3)',
                transition: 'all 0.2s ease',
              }}
              
              
            >
              <span>EXPLORE ALL SOLUTIONS</span>
              <span>→</span>
            </Link>
          </div>
        </section>

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
              color: '#FFFFFF',
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
                    color: '#FFFFFF',
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
                  style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)', color: '#FFFFFF', lineHeight: 1.6, marginBottom: '1.25rem', fontWeight: 300, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  Tell us what you are building, what problem you are solving, or what you want to improve.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(20, 184, 166, 0.1)', paddingTop: '1.25rem' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#FFFFFF', letterSpacing: '0.15em', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>EMAIL INQUIRIES</span>
                    <a href="mailto:hello@quantumai.dev" style={{ fontSize: '1rem', color: '#FFFFFF', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500, wordBreak: 'break-word' }} >
                      hello@quantumai.dev
                    </a>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#FFFFFF', letterSpacing: '0.15em', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase' }}>RESPONSE MATRIX</span>
                    <p style={{ color: '#FFFFFF', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>We review all incoming submissions and reply within 24 hours.</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div style={{
                backgroundColor: '#071214',
                border: '1px solid rgba(20, 184, 166, 0.20)',
                borderRadius: 12,
                padding: 'clamp(1.25rem, 3vw, 2.25rem)',
                boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 20px -5px rgba(20, 184, 166, 0.12)',
                minWidth: 0,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <HomeContactForm />
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
