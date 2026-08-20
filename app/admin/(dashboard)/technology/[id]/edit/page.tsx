import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import EditTechnologyForm from './EditTechnologyForm';

export const dynamic = 'force-dynamic';

export default async function EditTechnologyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const { id } = await params;
  const technology = await prisma.technology.findUnique({ where: { id } });
  if (!technology) notFound();

  return <EditTechnologyForm technology={technology} />;
}
