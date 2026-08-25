import prisma from '@/lib/db';
import TestimonialsClient from './client';

export const metadata = {
  title: 'Client Testimonials Management | Admin Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  }).catch(() => []);

  return (
    <div style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
          CONTENT MANAGEMENT
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
          Client Testimonials & Reviews
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#94A3B8', maxWidth: '650px', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
          Manage client quotes, executive reviews, and star ratings displayed in the continuous horizontal marquee on the Quantum AI landing page.
        </p>
      </div>

      <TestimonialsClient testimonials={testimonials} />
    </div>
  );
}
