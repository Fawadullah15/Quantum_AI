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
    <div style={{ paddingTop: '8rem', paddingBottom: '6rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '64rem', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-space-mono)', fontSize: '0.875rem', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
          <span>{study.client}</span>
          <span>/</span>
          <span>{study.industry}</span>
          <span>/</span>
          <span>{study.year}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.025em', lineHeight: 1.1 }}>{study.title}</h1>
      </header>

      {study.heroImage && (
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative', border: '1px solid var(--color-border)', marginBottom: '4rem', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={study.heroImage} alt={study.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
        <div>
          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--color-primary)' }}>The Challenge</h2>
            <p style={{ color: 'var(--color-muted)', lineHeight: 1.8, fontSize: '1.125rem' }}>{study.problem}</p>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--color-primary)' }}>The Solution</h2>
            <p style={{ color: 'var(--color-muted)', lineHeight: 1.8, fontSize: '1.125rem' }}>{study.solution}</p>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--color-primary)' }}>Implementation</h2>
            <p style={{ color: 'var(--color-muted)', lineHeight: 1.8, fontSize: '1.125rem' }}>{study.implementation}</p>
          </section>

          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--color-primary)' }}>Results</h2>
            <p style={{ color: 'var(--color-muted)', lineHeight: 1.8, fontSize: '1.125rem' }}>{study.results}</p>
          </section>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          {technologies.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontFamily: 'var(--font-space-mono)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Technologies</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {technologies.map((tech: string) => (
                  <span key={tech} style={{ padding: '0.25rem 0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.75rem', fontFamily: 'var(--font-space-mono)' }}>
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {study.metrics && study.metrics.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontFamily: 'var(--font-space-mono)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Impact</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                {study.metrics.map((metric, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{metric.value}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <section style={{ textAlign: 'center', paddingTop: '6rem', borderTop: '1px solid var(--color-border)', marginTop: '4rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Ready to transform your business?</h2>
        <Link href="/contact" style={{ display: 'inline-block', padding: '1rem 2rem', background: 'var(--color-primary)', color: 'var(--color-bg)', fontWeight: 700, textDecoration: 'none' }}>
          START A SIMILAR PROJECT
        </Link>
      </section>
    </div>
  );
}
