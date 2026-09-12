'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getRecentlyDeletedItems,
  restoreItem,
  permanentDeleteItem,
  emptyRecentlyDeleted,
  getRecoveryAuditLogs,
  GetDeletedItemsOptions,
} from '@/lib/recovery';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getRecentlyDeletedAction(options: GetDeletedItemsOptions = {}) {
  await checkAuth();
  return getRecentlyDeletedItems(options);
}

export async function restoreRecentlyDeletedAction(id: string) {
  const session = await checkAuth();
  const user = session.user as any;
  return restoreItem({
    id,
    adminUser: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
    },
  });
}

export async function permanentDeleteRecentlyDeletedAction(id: string) {
  const session = await checkAuth();
  const user = session.user as any;
  return permanentDeleteItem({
    id,
    adminUser: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
    },
  });
}

export async function emptyRecentlyDeletedAction() {
  const session = await checkAuth();
  const user = session.user as any;
  return emptyRecentlyDeleted({
    adminUser: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
    },
  });
}

export async function getRecoveryAuditLogsAction(limit = 25) {
  await checkAuth();
  return getRecoveryAuditLogs(limit);
}
