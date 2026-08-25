import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await prisma.caseStudy.findUnique({ where: { slug } }).catch(() => null);
  if (!caseStudy) return { title: 'Not Found' };
  
  return {
    title: caseStudy.title,
    description: caseStudy.problem.slice(0, 160),
    openGraph: {
      images: caseStudy.heroImage ? [caseStudy.heroImage] : [],
    },
  };
}

export async function generateStaticParams() {
  const studies = await prisma.caseStudy.findMany({ where: { published: true }, select: { slug: true } }).catch(() => []);
  return studies.map((study: { slug: string }) => ({ slug: study.slug }));
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = await prisma.caseStudy.findUnique({
    where: { slug },
    include: { metrics: true },
  }).catch(() => null);
  
  if (!study) {
    notFound();
  }

  const technologies = typeof study.technologies === 'string' ? study.technologies.split(',') : [];

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2.5rem)', paddingBottom: '5rem', paddingInline: 'clamp(1.25rem, 5vw, 4rem)', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Breadcrumb back link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/work"
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.72rem',
            color: '#38BDF8',
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', marginBottom: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {study.client && (
            <>
              <span>CLIENT: {study.client}</span>
              <span style={{ opacity: 0.4 }}>/</span>
            </>
          )}
          <span>INDUSTRY: {study.industry}</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>YEAR: {study.year}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.85rem, 4.5vw, 3rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.1, color: '#F8FAFC', margin: 0 }}>
          {study.title}
        </h1>
      </header>

      {study.heroImage && (
        <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#020714', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '2.5rem', overflow: 'hidden', boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={study.heroImage} alt={study.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Section: Problem / Challenge */}
          <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
              01 // THE CHALLENGE
            </div>
            <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              Problem &amp; Operational Friction
            </h2>
            <p style={{ color: '#94A3B8', lineHeight: 1.65, fontSize: '0.92rem', margin: 0, fontWeight: 300 }}>
              {study.problem}
            </p>
          </section>

          {/* Section: Solution / What We Built */}
          <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
              02 // WHAT WE BUILT
            </div>
            <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              System Architecture &amp; Solution
            </h2>
            <p style={{ color: '#94A3B8', lineHeight: 1.65, fontSize: '0.92rem', margin: 0, fontWeight: 300 }}>
              {study.solution}
            </p>
          </section>

          {/* Section: Implementation / How It Works */}
          {study.implementation && (
            <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                03 // HOW IT WORKS
              </div>
              <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Engineering &amp; Workflow Integration
              </h2>
              <p style={{ color: '#94A3B8', lineHeight: 1.65, fontSize: '0.92rem', margin: 0, fontWeight: 300 }}>
                {study.implementation}
              </p>
            </section>
          )}

          {/* Section: Results / Business Value */}
          {study.results && (
            <section style={{ backgroundColor: 'rgba(6, 21, 43, 0.6)', border: '1px solid rgba(22, 119, 255, 0.15)', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                04 // RESULT &amp; IMPACT
              </div>
              <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.45rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.75rem 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Operational Outcomes
              </h2>
              <p style={{ color: '#94A3B8', lineHeight: 1.65, fontSize: '0.92rem', margin: 0, fontWeight: 300 }}>
                {study.results}
              </p>
            </section>
          )}
        </div>

        {/* Technologies & Metrics Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#040E24', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '1.5rem' }}>
          {technologies.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', textTransform: 'uppercase', color: '#38BDF8', letterSpacing: '0.15em' }}>
                Technologies &amp; Tools Used
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {technologies.map((tech: string) => (
                  <span key={tech} style={{ padding: '0.25rem 0.65rem', background: 'rgba(22, 119, 255, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.75rem', fontFamily: 'var(--font-mono, monospace)', borderRadius: '4px', color: '#F8FAFC' }}>
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {study.metrics && study.metrics.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', textTransform: 'uppercase', color: '#38BDF8', letterSpacing: '0.15em' }}>
                Key Metrics &amp; Benchmarks
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {study.metrics.map((metric, i) => (
                  <div key={i} style={{ padding: '0.85rem', backgroundColor: 'rgba(6, 21, 43, 0.8)', borderRadius: '8px', border: '1px solid rgba(22, 119, 255, 0.15)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38BDF8', fontFamily: 'var(--font-mono, monospace)' }}>{metric.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Box */}
      <section style={{ textAlign: 'center', paddingTop: '3.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.15)', marginTop: '3.5rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', color: '#38BDF8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.65rem', fontWeight: 600 }}>
          START YOUR PROJECT
        </div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.35rem)', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Ready to Build Something Similar?
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: 1.6, fontWeight: 300 }}>
          Let&apos;s discuss your system requirements, operational friction, and architecture scope.
        </p>
        <Link
          href="/contact"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.8rem 2rem',
            background: 'linear-gradient(135deg, #1677FF, #0050B3)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8125rem',
            letterSpacing: '0.1em',
            borderRadius: '8px',
            textDecoration: 'none',
            boxShadow: '0 8px 24px -4px rgba(22, 119, 255, 0.5)',
            textTransform: 'uppercase',
          }}
        >
          START A SIMILAR PROJECT →
        </Link>
      </section>
    </div>
  );
}
