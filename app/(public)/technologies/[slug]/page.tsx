import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tech = await prisma.technology.findUnique({ where: { slug } }).catch(() => null);
  if (!tech) return { title: 'Not Found' };
  
  return {
    title: `${tech.name} | Quantum AI`,
    description: tech.shortDescription,
  };
}

export default async function TechnologyDetailPage({ params }: Props) {
  const { slug } = await params;
  const tech = await prisma.technology.findUnique({ where: { slug } }).catch(() => null);
  
  if (!tech || !tech.published) {
    notFound();
  }

  const features = tech.features ? JSON.parse(tech.features) : [];
  const useCases = tech.useCases ? JSON.parse(tech.useCases) : [];

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)', paddingBottom: '6rem' }}>
      {/* Hero Section */}
      {tech.heroImage && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '400px',
          background: `linear-gradient(to bottom, rgba(3, 7, 18, 0.3), rgba(3, 7, 18, 0.9)), url(${tech.heroImage}) center/cover`,
          marginBottom: '4rem'
        }} />
      )}

      <div className="container section">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <Link href="/technology" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#64748B',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            marginBottom: '2rem',
          }}>
            ← Back to Technologies
          </Link>

          {/* Header */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              color: '#1677FF',
              textTransform: 'uppercase',
              marginBottom: '1rem'
            }}>
              {tech.category}
            </div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#F8FAFF',
              marginBottom: '1.5rem',
              textTransform: 'uppercase'
            }}>
              {tech.heroTitle || tech.name}
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#94A3B8',
              lineHeight: 1.7,
              maxWidth: '700px'
            }}>
              {tech.heroDescription || tech.shortDescription}
            </p>
          </div>

          {/* Content */}
          {tech.content && (
            <div style={{
              marginBottom: '4rem',
              fontSize: '1.125rem',
              lineHeight: 1.8,
              color: '#CBD5E1',
              maxWidth: '800px'
            }}>
              <div dangerouslySetInnerHTML={{ __html: tech.content }} />
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <section style={{ marginBottom: '4rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#F8FAFF',
                marginBottom: '2rem',
                textTransform: 'uppercase'
              }}>
                Key Capabilities
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {features.map((feature: any, index: number) => (
                  <div key={index} style={{
                    padding: '1.5rem',
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(22, 119, 255, 0.1)',
                    borderRadius: '12px'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#F8FAFF',
                      marginBottom: '0.5rem'
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{ fontSize: '0.9375rem', color: '#94A3B8', lineHeight: 1.6 }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Use Cases */}
          {useCases.length > 0 && (
            <section style={{ marginBottom: '4rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#F8FAFF',
                marginBottom: '2rem',
                textTransform: 'uppercase'
              }}>
                Use Cases
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {useCases.map((useCase: any, index: number) => (
                  <div key={index} style={{
                    padding: '1.5rem',
                    background: 'rgba(30, 41, 59, 0.3)',
                    borderLeft: '3px solid #1677FF',
                    borderRadius: '0 12px 12px 0'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#F8FAFF',
                      marginBottom: '0.5rem'
                    }}>
                      {useCase.title}
                    </h3>
                    <p style={{ fontSize: '0.9375rem', color: '#94A3B8', lineHeight: 1.6 }}>
                      {useCase.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          {(tech.ctaTitle || tech.ctaDescription) && (
            <section style={{
              padding: '3rem',
              background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.1), rgba(85, 214, 255, 0.05))',
              border: '1px solid rgba(22, 119, 255, 0.2)',
              borderRadius: '16px',
              textAlign: 'center',
              marginBottom: '4rem'
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#F8FAFF',
                marginBottom: '1rem'
              }}>
                {tech.ctaTitle || 'Ready to Get Started?'}
              </h2>
              <p style={{
                fontSize: '1.125rem',
                color: '#94A3B8',
                marginBottom: '2rem',
                maxWidth: '600px',
                margin: '0 auto 2rem'
              }}>
                {tech.ctaDescription || 'Let\'s discuss how this technology can transform your business.'}
              </p>
              <Link
                href={tech.ctaLink || '/contact'}
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  background: '#1677FF',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0D5FD6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1677FF'}
              >
                {tech.ctaText || 'Contact Us'}
              </Link>
            </section>
          )}

          {/* Related Technologies */}
          <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(22, 119, 255, 0.1)' }}>
            <Link href="/technology" style={{
              color: '#64748B',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem'
            }}>
              View All Technologies →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
