import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import CareersPartnershipsClient from './client';

export const dynamic = 'force-dynamic';

export default async function CareersPartnershipsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const [partnerships, applications] = await Promise.all([
    prisma.partnershipRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { notes: true },
    }).catch(() => []),
    prisma.careerApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { notes: true },
    }).catch(() => []),
  ]);

  // Compute Metrics
  const totalSubmissions = partnerships.length + applications.length;
  const newApplications = applications.filter((a) => a.status === 'NEW').length;
  const underReview = applications.filter((a) => a.status === 'REVIEWING' || a.status === 'INTERVIEW').length;
  const partnershipCount = partnerships.length;
  const recentlyContacted = [...partnerships, ...applications].filter((s) => s.status === 'CONTACTED').length;

  return (
    <CareersPartnershipsClient
      partnerships={partnerships}
      applications={applications}
      metrics={{
        totalSubmissions,
        newApplications,
        underReview,
        partnershipCount,
        recentlyContacted,
      }}
    />
  );
}
