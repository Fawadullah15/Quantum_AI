import prisma from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Services & Capabilities — Quantum AI',
  description: 'AI systems, custom software platforms, intelligent automation, and digital products engineered for scale.',
};

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => []);

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 80px) * 2)', paddingBottom: 'var(--space-32, 6rem)', minHeight: '100vh', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))' }} className="container section">
      <div style={{ maxWidth: 'var(--max-width, 1200px)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-32, 4rem)' }}>
          <div className="tech-label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>SYS.08 / SERVICES</div>
          <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary, #F8FAFC)', textTransform: 'uppercase', margin: 0 }}>
            CAPABILITIES.
          </h1>
        </div>

        {services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, color: '#94A3B8' }}>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>SERVICES ARE BEING CONFIGURED</p>
            <Link href="/contact" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#1677FF', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>CONTACT US</Link>
          </div>
        ) : (
          <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-16, 2.5rem)', borderTop: '1px solid var(--color-border, rgba(255,255,255,0.1))', paddingTop: 'var(--space-16, 2.5rem)' }}>
            {services.map((service, idx) => {
              const anchorId = (service.category?.toLowerCase() || service.name.toLowerCase().replace(/\s+/g, '-'));
              return (
                <div key={service.id} id={anchorId} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6, 1rem)', scrollMarginTop: 'calc(var(--nav-height, 80px) + 2rem)' }}>
                  <div className="eyebrow" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', letterSpacing: '0.15em' }}>MODULE {String(idx + 1).padStart(2, '0')}{service.category ? ` · ${service.category}` : ''}</div>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, color: 'var(--color-text-primary, #F8FAFC)', margin: 0 }}>{service.name}</h2>
                  <p style={{ color: 'var(--color-text-secondary, #94A3B8)', lineHeight: 1.6, margin: 0 }}>
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#F8FAFC', marginBottom: '1rem', fontWeight: 700 }}>HAVE A SPECIFIC SYSTEM IN MIND?</h2>
          <p style={{ color: '#94A3B8', marginBottom: '2rem', maxWidth: 500, margin: '0 auto 2rem' }}>We design and deploy custom intelligent architectures tailored to your operational requirements.</p>
          <Link href="/contact" style={{ display: 'inline-block', padding: '1rem 2.5rem', backgroundColor: '#1677FF', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em' }}>
            START A PROJECT →
          </Link>
        </div>
      </div>

      <style>{`
        .services-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1024px) {
          .services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
