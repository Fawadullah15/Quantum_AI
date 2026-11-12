import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export interface VerifiedAdminActor {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class AdminAuthError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AdminAuthError';
  }
}

export type AdminSessionLike = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string | null;
  } | null;
} | null;

const ALLOWED_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
const WRITE_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

/**
 * Pure session & RBAC checker (usable directly in unit tests as well as API routes).
 * Strictly rejects anonymous callers (401), public QuantumBot USER accounts (403),
 * and read-only EDITOR accounts when mutating sensitive configuration (403).
 */
export function authorizeAdminSession(
  session: AdminSessionLike,
  options?: { write?: boolean }
): VerifiedAdminActor {
  const user = session?.user;
  if (!user || !user.id) {
    throw new AdminAuthError(401, 'Unauthorized: Administrator sign-in required.');
  }

  const role = String(user.role || '').trim().toUpperCase();
  if (!ALLOWED_ADMIN_ROLES.has(role)) {
    throw new AdminAuthError(403, 'Forbidden: Administrator privileges required.');
  }

  if (options?.write && !WRITE_ADMIN_ROLES.has(role)) {
    throw new AdminAuthError(
      403,
      'Forbidden: Insufficient permissions. SUPER_ADMIN or ADMIN role required for configuration changes.'
    );
  }

  return {
    id: String(user.id),
    email: String(user.email || ''),
    name: String(user.name || 'Administrator'),
    role,
  };
}

/**
 * Resolves and authorizes the active NextAuth administrator session for QuantumBot Admin APIs.
 * Never accepts public `qb_session` cookies.
 */
export async function requireBotAdmin(options?: { write?: boolean }): Promise<VerifiedAdminActor> {
  const session = (await getServerSession(authOptions)) as AdminSessionLike;
  return authorizeAdminSession(session, options);
}

export async function logAdminBotActivity(params: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  details?: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.actorId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        entityName: params.entityName || null,
        details: params.details ? params.details.slice(0, 320) : null,
      },
    });
  } catch {
    // Non-blocking audit log
  }
}
