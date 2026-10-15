import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { createPageMetadata, getCaseStudySchema } from '@/lib/seo';
import { parseGallery } from '@/lib/gallery';
import { GalleryConfigurator } from '@/components/layout/GalleryConfigurator';
import { COPILOT_CASE_STUDY, ensureMechanicalCopilotInDb } from '@/lib/default-projects';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let caseStudy = await prisma.caseStudy.findUnique({ where: { slug } }).catch(() => null);
  if (!caseStudy && slug === 'mechanical-engineering-design-copilot') {
    caseStudy = COPILOT_CASE_STUDY as any;
  }
  if (!caseStudy) return { title: 'Case Study Not Found' };

  return createPageMetadata({
    title: (caseStudy as any).seoTitle || `${caseStudy.title} — Case Study | Quantum AI`,
    description:
      (caseStudy as any).seoDescription ||
      (caseStudy.problem
        ? caseStudy.problem.slice(0, 160)
        : `Detailed engineering case study for ${caseStudy.title} built by Quantum AI.`),
    path: `/work/${slug}`,
    image: caseStudy.heroImage || undefined,
  });
}

export async function generateStaticParams() {
  const studies = await prisma.caseStudy.findMany({ where: { published: true }, select: { slug: true } }).catch(() => []);
  const slugs = new Set(studies.map((study: { slug: string }) => study.slug));
  slugs.add('mechanical-engineering-design-copilot');
  return Array.from(slugs).map((slug) => ({ slug }));
}

function FormattedDescription({ content }: { content: string }) {
  if (!content) return null;

  // Split into paragraphs / blocks
  const blocks = content.split(/\n\s*\n/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#FFFFFF', lineHeight: 1.7, fontSize: '0.94rem', fontWeight: 300 }}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 2
        if (trimmed.startsWith('## ') || trimmed.startsWith('Overview') || trimmed.startsWith('The Problem') || trimmed.startsWith('Our Solution') || trimmed.startsWith('Planned Core Capabilities') || trimmed.startsWith('Example Engineering Use Case') || trimmed.startsWith('Development Approach') || trimmed.startsWith('Vision')) {
          const headingText = trimmed.replace(/^##\s*/, '');
          return (
            <div key={idx} style={{ marginTop: idx === 0 ? '0' : '1.5rem', marginBottom: '0.25rem' }}>
              <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
                // {headingText.toUpperCase()}
              </div>
              <h2 style={{ fontSize: 'clamp(1.2rem, 2.2vw, 1.55rem)', fontWeight: 700, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                {headingText}
              </h2>
            </div>
          );
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} style={{ fontSize: '1.1rem', fontWeight: 600, color: '#38BDF8', margin: '0.5rem 0 0 0', textTransform: 'uppercase' }}>
              {trimmed.replace(/^###\s*/, '')}
            </h3>
          );
        }

        // Numbered capability or item (e.g. "1. Engineering Calculations")
        if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
          const lines = trimmed.split('\n');
          const titleLine = lines[0];
          const rest = lines.slice(1).join(' ');
          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.55)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
              }}
            >
              <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.92rem', marginBottom: '0.35rem', fontFamily: 'var(--font-d-din)', letterSpacing: '0.04em' }}>
                {titleLine}
              </div>
              {rest && <p style={{ margin: 0, color: '#E2E8F0', fontSize: '0.88rem', lineHeight: 1.6 }}>{rest}</p>}
            </div>
          );
        }

        // Engineering parameters box (e.g. Applied torque: 500 N*m)
        if (trimmed.includes('Applied torque') || trimmed.includes('Rotational speed') || trimmed.includes('Shaft length')) {
          const paramLines = trimmed.split('\n');
          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'rgba(2, 6, 23, 0.85)',
                border: '1px solid rgba(167, 139, 250, 0.35)',
                borderRadius: '8px',
                padding: '1.25rem',
                margin: '0.5rem 0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#C4B5FD', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600 }}>
                ⚙ SPECIFICATION PARAMETERS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem' }}>
                {paramLines.map((line, pIdx) => (
                  <div key={pIdx} style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Bullet list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').map((l) => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
          return (
            <ul key={idx} style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#E2E8F0' }}>
              {items.map((item, i) => (
                <li key={i} style={{ lineHeight: 1.6 }}>{item}</li>
              ))}
            </ul>
          );
        }

        // Quote / Vision / Brand Statement
        if (trimmed.includes('Think. Calculate. Design. Verify.') || trimmed.startsWith('> ')) {
          return (
            <div
              key={idx}
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                borderLeft: '3px solid #38BDF8',
                borderRadius: '0 8px 8px 0',
                fontStyle: 'italic',
                color: '#FFFFFF',
                fontSize: '1rem',
                margin: '1rem 0',
              }}
            >
              {trimmed.replace(/^>\s*/, '')}
            </div>
          );
        }

        // Normal paragraph
        return (
          <p key={idx} style={{ margin: 0, color: '#E2E8F0', lineHeight: 1.7 }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  if (slug === 'mechanical-engineering-design-copilot') {
    await ensureMechanicalCopilotInDb();
  }
  let study = await prisma.caseStudy.findUnique({
    where: { slug },
    include: { metrics: true },
  }).catch(() => null);

  if (!study && slug === 'mechanical-engineering-design-copilot') {
    study = COPILOT_CASE_STUDY as any;
  }

  if (!study || !study.published) {
    notFound();
  }

  const relatedStudies = await prisma.caseStudy.findMany({
    where: {
      published: true,
      slug: { not: slug },
    },
    take: 3,
    orderBy: { order: 'asc' },
  }).catch(() => []);

  const technologies = typeof study.technologies === 'string'
    ? study.technologies.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const rawGallery = parseGallery(study.gallery);
  const galleryImages = study.heroImage
    ? [
        study.heroImage,
        ...rawGallery.filter((url) => url !== study.heroImage),
      ]
    : rawGallery;
  const schemaJson = getCaseStudySchema(study);

  const clientStr = (study.client || '').trim().toLowerCase();
  let originLabel = 'CLIENT PROJECT';
  let originColor = '#38BDF8';
  let originBg = 'rgba(56, 189, 248, 0.12)';
  let orgText = `CLIENT: ${study.client}`;

  if (clientStr.includes('internal / quantum ai') || study.title.includes('Intelligence') || study.title.includes('Automation Platform') || study.title.includes('Copilot')) {
    originLabel = 'R&D / CONCEPT';
    originColor = '#A78BFA';
    originBg = 'rgba(167, 139, 250, 0.12)';
    orgText = 'BUILT BY QUANTUM AI';
  } else if (clientStr.includes('quantum ai') || clientStr.includes('internal')) {
    originLabel = 'INTERNAL PRODUCT';
    originColor = '#34D399';
    originBg = 'rgba(52, 211, 153, 0.12)';
    orgText = 'BUILT BY QUANTUM AI';
  }

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4rem', paddingInline: 'clamp(1.25rem, 5vw, 4rem)', maxWidth: '1080px', margin: '0 auto', minHeight: '100vh' }}>
      {/* 3D Scene Gallery Bridge */}
      <GalleryConfigurator images={galleryImages} slug={study.slug} />

      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      
      {/* Breadcrumb back link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/work"
          style={{
            fontFamily: 'var(--font-d-din)',
            fontSize: '0.72rem',
            color: '#FFFFFF',
            textDecoration: 'none',
            letterSpacing: '0.1em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          ← Back to Selected Work
        </Link>
      </div>

      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', marginBottom: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span
            style={{
              color: originColor,
              backgroundColor: originBg,
              border: `1px solid ${originColor}33`,
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            {originLabel}
          </span>
          <span>{orgText}</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>CATEGORY: {study.industry}</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>YEAR: {study.year}</span>
          {(study as any).status && (
            <>
              <span style={{ opacity: 0.4 }}>/</span>
              <span
                style={{
                  color: '#C4B5FD',
                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                  border: '1px solid rgba(167, 139, 250, 0.35)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                STATUS: {String((study as any).status).toUpperCase()}
              </span>
            </>
          )}
          {(study as any).featured && (
            <>
              <span style={{ opacity: 0.4 }}>/</span>
              <span
                style={{
                  color: '#38BDF8',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}
              >
                ★ FEATURED
              </span>
            </>
          )}
        </div>

        <h1 style={{ fontSize: 'clamp(1.85rem, 4.5vw, 3rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.1, color: '#FFFFFF', margin: '0 0 1.25rem 0' }}>
          {study.title}
        </h1>

        {/* Action CTAs */}
        {((study as any).primaryCtaLabel || (study as any).primaryCtaUrl || study.externalUrl || (study as any).secondaryCtaLabel) && (
          <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {((study as any).primaryCtaLabel || (study as any).primaryCtaUrl || study.externalUrl) && (
              <a
                href={(study as any).primaryCtaUrl || study.externalUrl || `/work/${study.slug}`}
                target={(study as any).primaryCtaUrl?.startsWith('http') || study.externalUrl?.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#1677FF',
                  border: '1px solid #1677FF',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-d-din)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                {(study as any).primaryCtaLabel || 'VISIT LIVE PLATFORM ↗'}
              </a>
            )}
            {(study as any).secondaryCtaLabel && (
              <Link
                href={(study as any).secondaryCtaUrl || '/contact'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-d-din)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'background-color 0.2s',
                }}
              >
                {(study as any).secondaryCtaLabel}
              </Link>
            )}
          </div>
        )}
      </header>

      {study.heroImage && (
        <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#020714', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '2.5rem', overflow: 'hidden', boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={study.heroImage} alt={study.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Full Project Description Section if provided */}
          {(study as any).fullDescription && (
            <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.65)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', padding: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
              <FormattedDescription content={(study as any).fullDescription} />
            </section>
          )}

          {/* Section: Problem / Challenge (if not already fully covered in fullDescription or when provided) */}
          {study.problem && !(study as any).fullDescription && (
            <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
              <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                01 // THE CHALLENGE
              </div>
              <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Problem &amp; Operational Friction
              </h2>
              <p style={{ color: '#E2E8F0', lineHeight: 1.65, fontSize: '0.92rem', margin: 0, fontWeight: 300 }}>
                {study.problem}
              </p>
            </section>
          )}

          {/* Section: Solution / What We Built */}
          {study.solution && !(study as any).fullDescription && (
            <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
              <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                02 // WHAT WE BUILT
              </div>
              <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                System Architecture &amp; Solution
              </h2>
              <p style={{ color: '#E2E8F0', lineHeight: 1.65, fontSize: '0.92rem', margin: 0, fontWeight: 300 }}>
                {study.solution}
              </p>
            </section>
          )}

          {/* Section: Implementation / How It Works */}
          {study.implementation && !(study as any).fullDescription && (
            <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
              <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                03 // HOW IT WORKS
              </div>
              <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Engineering &amp; Workflow Integration
              </h2>
              <p style={{ color: '#E2E8F0', lineHeight: 1.65, fontSize: '0.92rem', margin: 0, fontWeight: 300 }}>
                {study.implementation}
              </p>
            </section>
          )}

          {/* Section: Results / Business Value */}
          {study.results && !(study as any).fullDescription && (
            <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
              <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                04 // RESULT &amp; IMPACT
              </div>
              <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Operational Outcomes
              </h2>
              <p style={{ color: '#E2E8F0', lineHeight: 1.65, fontSize: '0.92rem', margin: 0, fontWeight: 300 }}>
                {study.results}
              </p>
            </section>
          )}
        </div>

        {/* Technologies & Metrics Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#040E24', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '1.5rem' }}>
          {technologies.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-d-din)', fontSize: '0.75rem', textTransform: 'uppercase', color: '#FFFFFF', letterSpacing: '0.15em' }}>
                Technologies &amp; Tools Used
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {technologies.map((tech: string) => (
                  <span key={tech} style={{ padding: '0.25rem 0.65rem', background: 'rgba(22, 119, 255, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.75rem', fontFamily: 'var(--font-d-din)', borderRadius: '4px', color: '#FFFFFF' }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {study.metrics && study.metrics.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-d-din)', fontSize: '0.75rem', textTransform: 'uppercase', color: '#FFFFFF', letterSpacing: '0.15em' }}>
                Key Metrics &amp; Benchmarks
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {study.metrics.map((metric, i) => (
                  <div key={i} style={{ padding: '0.85rem', backgroundColor: 'rgba(6, 21, 43, 0.8)', borderRadius: '8px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-d-din)' }}>{metric.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#FFFFFF', marginTop: '0.2rem' }}>{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Case Studies */}
      {relatedStudies.length > 0 && (
        <section style={{ marginTop: '4rem', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.5rem' }}>
          <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>
            EXPLORE MORE
          </div>
          <h2 style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#FFFFFF', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Related Case Studies
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {relatedStudies.map((item) => (
              <Link
                key={item.id}
                href={`/work/${item.slug}`}
                style={{
                  backgroundColor: 'rgba(6, 21, 43, 0.65)',
                  border: '1px solid rgba(22, 119, 255, 0.16)',
                  borderRadius: '10px',
                  padding: '1.15rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s, border-color 0.2s, transform 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.65rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                    {item.industry ? item.industry.split('/')[0].trim() : 'Technology'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.68rem', color: '#FFFFFF' }}>
                    {item.year}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 600, margin: '0.2rem 0', lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ color: '#E2E8F0', fontSize: '0.8rem', lineHeight: 1.45, margin: 0, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.problem || item.solution}
                </p>
                <span style={{ marginTop: 'auto', paddingTop: '0.5rem', color: '#38BDF8', fontSize: '0.72rem', fontFamily: 'var(--font-d-din)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  VIEW PROJECT →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Box */}
      <section style={{ textAlign: 'center', paddingTop: '3.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.15)', marginTop: '3.5rem' }}>
        <div style={{ fontFamily: 'var(--font-d-din)', fontSize: '0.72rem', color: '#FFFFFF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 600 }}>
          [NEXT STEPS]
        </div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.35rem)', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Have a system like this in mind?
        </h2>
        <p style={{ color: '#FFFFFF', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: 1.6, fontWeight: 300 }}>
          Tell us what you are building, what problem you are solving, or what operational software your organization needs.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.8rem 2rem',
              background: 'linear-gradient(135deg, #1677FF, #0050B3)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontFamily: 'var(--font-d-din)',
              fontSize: '0.8125rem',
              letterSpacing: '0.1em',
              borderRadius: '8px',
              textDecoration: 'none',
              boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
              textTransform: 'uppercase',
            }}
          >
            START A PROJECT →
          </Link>
          <Link
            href="/work"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.8rem 1.75rem',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.08)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontFamily: 'var(--font-d-din)',
              fontSize: '0.8125rem',
              letterSpacing: '0.1em',
              borderRadius: '8px',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            VIEW MORE WORK
          </Link>
        </div>
      </section>
    </div>
  );
}
