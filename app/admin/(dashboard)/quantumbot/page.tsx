import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import {
  ensureAdminConfigLoaded,
  getEffectiveUsageLimits,
  listSafeProviderConfigs,
} from '@/lib/bot/admin-config';
import { getRegisteredModels } from '@/lib/bot/models';
import { getBotAdminAnalytics, listAdminUsersWithUsage } from '@/lib/bot/usage-tracker';
import { QuantumBotAdminClient } from '@/components/admin/QuantumBotAdminClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminQuantumBotPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !user?.id) {
    redirect('/admin/login');
  }

  const role = String(user.role || '').trim().toUpperCase();
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(role)) {
    redirect('/admin/login');
  }
  const canWrite = role === 'SUPER_ADMIN' || role === 'ADMIN';

  await ensureAdminConfigLoaded();

  const [providers, analytics, users] = await Promise.all([
    listSafeProviderConfigs(),
    getBotAdminAnalytics(14),
    listAdminUsersWithUsage(),
  ]);

  const models = getRegisteredModels();
  const limits = getEffectiveUsageLimits();

  return (
    <QuantumBotAdminClient
      initialProviders={providers}
      initialModels={models}
      initialLimits={limits}
      initialAnalytics={analytics}
      initialUsers={users}
      canWrite={canWrite}
    />
  );
}
