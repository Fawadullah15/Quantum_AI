import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import DetailClient from './DetailClient';

export const dynamic = 'force-dynamic';

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const { type, id } = await params;
  const upperType = type.toUpperCase() as 'PARTNERSHIP' | 'CAREER';

  if (upperType !== 'PARTNERSHIP' && upperType !== 'CAREER') {
    notFound();
  }

  let submission: any = null;
  if (upperType === 'PARTNERSHIP') {
    submission = await prisma.partnershipRequest.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: 'desc' } } },
    });
  } else {
    submission = await prisma.careerApplication.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: 'desc' } } },
    });
  }

  if (!submission) notFound();

  return <DetailClient type={upperType} submission={submission} />;
}
