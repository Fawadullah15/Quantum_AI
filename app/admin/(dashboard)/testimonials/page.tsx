import prisma from '@/lib/db';
import TestimonialsClient from './client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Testimonials Management | Quantum Admin',
};

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  }).catch(() => []);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.12)', paddingBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', letterSpacing: '0.2em', color: '#1677FF', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 600 }}>
          SOCIAL PROOF &amp; REVIEWS
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.35rem 0' }}>
          Client Testimonials &amp; Feedback
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 300 }}>
          Manage client quotes, approve user-submitted reviews, set star ratings, and configure display ordering in the continuous horizontal marquee on the homepage.
        </p>
      </div>

      <TestimonialsClient testimonials={testimonials} />
    </div>
  );
}
