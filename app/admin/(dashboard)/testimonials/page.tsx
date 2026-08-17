import prisma from '@/lib/db';
import TestimonialsClient from './client';

export const metadata = {
  title: 'Manage Testimonials | Admin Dashboard',
};

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Testimonials</h1>
        <p className="text-gray-400">Manage client reviews and testimonials displayed on the site.</p>
      </div>
      <TestimonialsClient testimonials={testimonials} />
    </div>
  );
}
