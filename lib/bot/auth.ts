import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import {
  BOT_SESSION_COOKIE_NAME,
  OWNER_COOKIE_NAME,
  ResolvedOwner,
  attachOwnerCookie,
  resolveOwnerIdentity,
  signBotSessionToken,
  verifyBotSessionToken,
  verifySignedOwnerToken,
} from './file-security';
import {
  ConversationStoreOptions,
  deleteAllConversationsForOwner,
  deletePreferencesForOwner,
  getUserPreferencesForOwner,
  migrateConversationsOwner,
  updateUserPreferencesForOwner,
} from './conversation-store';
import { deleteAllBotFilesForOwner, migrateBotFilesOwner } from './file-store';
import { AuthActor, PublicBotUser, UserPreferences } from './types';

const DEFAULT_USERS_FILE = path.join(process.cwd(), '.private_storage', 'bot_users', 'users.json');
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface BotAuthStoreOptions {
  storageDir?: string;
  skipDatabase?: boolean;
}

export interface StoredBotUserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'USER';
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
}

export class BotAuthError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'BotAuthError';
  }
}

let userMutationChain = Promise.resolve();
function enqueueUserWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = userMutationChain.then(fn, fn);
  userMutationChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function shouldUseDatabase(options?: BotAuthStoreOptions): boolean {
  return !options?.skipDatabase && !options?.storageDir && Boolean(process.env.DATABASE_URL);
}

function getUsersFilePath(options?: BotAuthStoreOptions): string {
  return options?.storageDir ? path.join(options.storageDir, 'users.json') : DEFAULT_USERS_FILE;
}

function toConvOpts(options?: BotAuthStoreOptions): ConversationStoreOptions | undefined {
  if (!options) return undefined;
  return {
    storageDir: options.storageDir ? path.join(options.storageDir, 'conversations') : undefined,
    skipDatabase: options.skipDatabase,
  };
}

async function readLocalUsers(options?: BotAuthStoreOptions): Promise<StoredBotUserRecord[]> {
  try {
    const raw = await fs.readFile(getUsersFilePath(options), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalUsers(
  users: StoredBotUserRecord[],
  options?: BotAuthStoreOptions
): Promise<void> {
  const filePath = getUsersFilePath(options);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(users, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

function normalizeEmail(rawEmail: string): string {
  return (rawEmail || '').trim().toLowerCase();
}

function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toPublicUser(record: {
  id: string;
  email: string;
  name: string;
  createdAt: string | Date;
}): PublicBotUser {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: 'USER',
    createdAt:
      record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : String(record.createdAt),
  };
}

export async function findBotUserById(
  id: string,
  options?: BotAuthStoreOptions
): Promise<StoredBotUserRecord | null> {
  if (!id) return null;

  if (shouldUseDatabase(options)) {
    const row = await prisma.botUser.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      role: 'USER',
      tokenVersion: row.tokenVersion,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  const users = await readLocalUsers(options);
  return users.find((u) => u.id === id) || null;
}

export async function registerBotUser(
  input: {
    name: string;
    email: string;
    password: string;
    guestOwnerId?: string | null;
    claimGuestData?: boolean;
  },
  options?: BotAuthStoreOptions
): Promise<{
  user: PublicBotUser;
  ownerId: string;
  sessionToken: string;
  preferences: UserPreferences;
  migratedConversations: number;
  migratedFiles: number;
}> {
  const cleanName = (input.name || '').trim();
  const cleanEmail = normalizeEmail(input.email);
  const password = String(input.password || '');

  if (cleanName.length < 2 || cleanName.length > 80) {
    throw new BotAuthError(400, 'Please enter a name between 2 and 80 characters.');
  }
  if (!validateEmailFormat(cleanEmail)) {
    throw new BotAuthError(400, 'Please enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    throw new BotAuthError(400, 'Password must be between 8 and 128 characters.');
  }

  return enqueueUserWrite(async () => {
    const convOpts = toConvOpts(options);
    const passwordHash = await bcrypt.hash(password, 10);

    let createdRecord: StoredBotUserRecord;

    if (shouldUseDatabase(options)) {
      const existing = await prisma.botUser.findUnique({ where: { email: cleanEmail } });
      if (existing) {
        throw new BotAuthError(409, 'An account with this email address already exists.');
      }
      const created = await prisma.botUser.create({
        data: {
          email: cleanEmail,
          name: cleanName,
          displayName: cleanName,
          passwordHash,
          role: 'USER',
        },
      });
      createdRecord = {
        id: created.id,
        email: created.email,
        name: created.name,
        passwordHash: created.passwordHash,
        role: 'USER',
        tokenVersion: created.tokenVersion,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } else {
      const users = await readLocalUsers(options);
      if (users.some((u) => u.email === cleanEmail)) {
        throw new BotAuthError(409, 'An account with this email address already exists.');
      }
      const nowIso = new Date().toISOString();
      createdRecord = {
        id: `qbu_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        email: cleanEmail,
        name: cleanName,
        passwordHash,
        role: 'USER',
        tokenVersion: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      users.push(createdRecord);
      await writeLocalUsers(users, options);
    }

    const ownerId = `qbuser:${createdRecord.id}`;
    const preferences = await updateUserPreferencesForOwner(
      ownerId,
      { displayName: cleanName },
      convOpts
    );

    let migratedConversations = 0;
    let migratedFiles = 0;
    if (input.claimGuestData && input.guestOwnerId && input.guestOwnerId.startsWith('anon:')) {
      migratedConversations = await migrateConversationsOwner(
        input.guestOwnerId,
        ownerId,
        convOpts
      );
      if (!options?.storageDir) {
        migratedFiles = await migrateBotFilesOwner(input.guestOwnerId, ownerId);
      }
    }

    const sessionToken = signBotSessionToken({
      uid: createdRecord.id,
      tv: createdRecord.tokenVersion,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    });

    return {
      user: toPublicUser(createdRecord),
      ownerId,
      sessionToken,
      preferences,
      migratedConversations,
      migratedFiles,
    };
  });
}

export async function loginBotUser(
  input: {
    email: string;
    password: string;
    guestOwnerId?: string | null;
    claimGuestData?: boolean;
    rateLimitKeyPrefix?: string;
  },
  options?: BotAuthStoreOptions
): Promise<{
  user: PublicBotUser;
  ownerId: string;
  sessionToken: string;
  preferences: UserPreferences;
  migratedConversations: number;
  migratedFiles: number;
}> {
  const cleanEmail = normalizeEmail(input.email);
  const password = String(input.password || '');

  if (!cleanEmail || !password) {
    throw new BotAuthError(400, 'Email and password are required.');
  }

  const rateKey = `${input.rateLimitKeyPrefix || 'bot:auth:login'}:${cleanEmail}`;
  const rl = checkRateLimit(rateKey, 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    throw new BotAuthError(
      429,
      `Too many sign-in attempts. Please wait ${rl.resetInSeconds} seconds before trying again.`
    );
  }

  let record: StoredBotUserRecord | null = null;
  if (shouldUseDatabase(options)) {
    const row = await prisma.botUser.findUnique({ where: { email: cleanEmail } });
    if (row) {
      record = {
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.passwordHash,
        role: 'USER',
        tokenVersion: row.tokenVersion,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }
  } else {
    const users = await readLocalUsers(options);
    record = users.find((u) => u.email === cleanEmail) || null;
  }

  if (!record) {
    throw new BotAuthError(401, 'Invalid email or password.');
  }

  const valid = await bcrypt.compare(password, record.passwordHash);
  if (!valid) {
    throw new BotAuthError(401, 'Invalid email or password.');
  }

  resetRateLimit(rateKey);

  const ownerId = `qbuser:${record.id}`;
  const convOpts = toConvOpts(options);
  const preferences = await getUserPreferencesForOwner(ownerId, convOpts);

  let migratedConversations = 0;
  let migratedFiles = 0;
  if (input.claimGuestData && input.guestOwnerId && input.guestOwnerId.startsWith('anon:')) {
    migratedConversations = await migrateConversationsOwner(
      input.guestOwnerId,
      ownerId,
      convOpts
    );
    if (!options?.storageDir) {
      migratedFiles = await migrateBotFilesOwner(input.guestOwnerId, ownerId);
    }
  }

  const sessionToken = signBotSessionToken({
    uid: record.id,
    tv: record.tokenVersion,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });

  return {
    user: toPublicUser(record),
    ownerId,
    sessionToken,
    preferences,
    migratedConversations,
    migratedFiles,
  };
}

export async function revokeAllBotUserSessions(
  userId: string,
  options?: BotAuthStoreOptions
): Promise<void> {
  if (!userId) return;
  await enqueueUserWrite(async () => {
    if (shouldUseDatabase(options)) {
      await prisma.botUser
        .update({
          where: { id: userId },
          data: { tokenVersion: { increment: 1 } },
        })
        .catch(() => {});
      return;
    }
    const users = await readLocalUsers(options);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx] = {
        ...users[idx],
        tokenVersion: users[idx].tokenVersion + 1,
        updatedAt: new Date().toISOString(),
      };
      await writeLocalUsers(users, options);
    }
  });
}

export async function deleteBotUserAccount(
  input: { userId: string; password: string },
  options?: BotAuthStoreOptions
): Promise<{ deletedConversations: number; deletedFiles: number }> {
  const record = await findBotUserById(input.userId, options);
  if (!record) {
    throw new BotAuthError(404, 'Account not found.');
  }

  const valid = await bcrypt.compare(String(input.password || ''), record.passwordHash);
  if (!valid) {
    throw new BotAuthError(403, 'Incorrect password. Account deletion cancelled.');
  }

  const ownerId = `qbuser:${record.id}`;
  const convOpts = toConvOpts(options);

  const deletedConversations = await deleteAllConversationsForOwner(ownerId, convOpts);
  await deletePreferencesForOwner(ownerId, convOpts);
  const deletedFiles = options?.storageDir ? 0 : await deleteAllBotFilesForOwner(ownerId);

  await enqueueUserWrite(async () => {
    if (shouldUseDatabase(options)) {
      await prisma.botUser.delete({ where: { id: record.id } }).catch(() => {});
      return;
    }
    const users = await readLocalUsers(options);
    const remaining = users.filter((u) => u.id !== record.id);
    await writeLocalUsers(remaining, options);
  });

  return { deletedConversations, deletedFiles };
}

/**
 * Verifies a signed qb_session cookie token and resolves the active BotUser if valid and unrevoked.
 */
export async function resolveBotAccountFromToken(
  token: string | undefined | null,
  options?: BotAuthStoreOptions
): Promise<PublicBotUser | null> {
  const payload = verifyBotSessionToken(token);
  if (!payload) return null;

  const user = await findBotUserById(payload.uid, options);
  if (!user || user.tokenVersion !== payload.tv) {
    return null;
  }

  return toPublicUser(user);
}

/**
 * Unified QuantumBot request identity resolver across all Phase 4-7 routes:
 * 1. QuantumBot account cookie (`qb_session`) -> `qbuser:<id>`
 * 2. Signed-in NextAuth Admin session -> `user:<adminId>`
 * 3. Signed anonymous session cookie (`qb_owner`) -> `anon:<uuid>` (minted when mintIfMissing=true)
 */
export async function resolveBotActor(
  req: NextRequest,
  mintAnonIfMissing = false,
  options?: BotAuthStoreOptions
): Promise<{ actor: AuthActor; anonCookieToAttach: ResolvedOwner | null }> {
  const convOpts = toConvOpts(options);

  // 1. Check QuantumBot signed account cookie (`qb_session`)
  const rawBotSession = req.cookies.get(BOT_SESSION_COOKIE_NAME)?.value;
  if (rawBotSession) {
    const acct = await resolveBotAccountFromToken(rawBotSession, options);
    if (acct) {
      const ownerId = `qbuser:${acct.id}`;
      const preferences = await getUserPreferencesForOwner(ownerId, convOpts);
      return {
        actor: {
          isAuthenticated: true,
          authType: 'bot_account',
          ownerId,
          user: acct,
          preferences,
        },
        anonCookieToAttach: null,
      };
    }
  }

  // 2. Check existing NextAuth Admin session (compatible reuse when admin visits /quantumbot)
  try {
    const adminSession = await getServerSession(authOptions);
    const adminUser = adminSession?.user as
      | { id?: string; email?: string; name?: string }
      | undefined;
    if (adminUser?.id) {
      const ownerId = `user:${adminUser.id}`;
      const preferences = await getUserPreferencesForOwner(ownerId, convOpts);
      return {
        actor: {
          isAuthenticated: true,
          authType: 'admin_session',
          ownerId,
          user: {
            id: adminUser.id,
            email: adminUser.email || '',
            name: adminUser.name || 'Admin',
            role: 'ADMIN',
            createdAt: new Date(0).toISOString(),
          },
          preferences,
        },
        anonCookieToAttach: null,
      };
    }
  } catch {
    // Ignore NextAuth error when falling back to anonymous visitor session
  }

  // 3. Anonymous visitor isolated by signed `qb_owner` cookie
  const existingAnon = verifySignedOwnerToken(req.cookies.get(OWNER_COOKIE_NAME)?.value);
  if (existingAnon && existingAnon.startsWith('anon:')) {
    const preferences = await getUserPreferencesForOwner(existingAnon, convOpts);
    return {
      actor: {
        isAuthenticated: false,
        authType: 'anonymous',
        ownerId: existingAnon,
        user: null,
        preferences,
      },
      anonCookieToAttach: null,
    };
  }

  const fallbackAnon = await resolveOwnerIdentity(req, mintAnonIfMissing);
  if (fallbackAnon) {
    const preferences = await getUserPreferencesForOwner(fallbackAnon.ownerId, convOpts);
    return {
      actor: {
        isAuthenticated: false,
        authType: 'anonymous',
        ownerId: fallbackAnon.ownerId,
        user: null,
        preferences,
      },
      anonCookieToAttach: fallbackAnon.isNewAnonCookie ? fallbackAnon : null,
    };
  }

  return {
    actor: {
      isAuthenticated: false,
      authType: 'anonymous',
      ownerId: '',
      user: null,
      preferences: await getUserPreferencesForOwner('', convOpts),
    },
    anonCookieToAttach: null,
  };
}

export function attachBotSessionCookie(
  res: NextResponse,
  sessionToken: string,
  req?: NextRequest
): void {
  const forwardedProto = req?.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const isHttps = req
    ? forwardedProto === 'https' || req.nextUrl.protocol === 'https:'
    : process.env.NODE_ENV === 'production';

  res.cookies.set(BOT_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearBotSessionCookie(res: NextResponse, req?: NextRequest): void {
  const forwardedProto = req?.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const isHttps = req
    ? forwardedProto === 'https' || req.nextUrl.protocol === 'https:'
    : process.env.NODE_ENV === 'production';

  res.cookies.set(BOT_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 0,
  });
}

export function attachActorCookies(
  res: NextResponse,
  anonCookieToAttach: ResolvedOwner | null,
  req?: NextRequest
): void {
  if (anonCookieToAttach) {
    attachOwnerCookie(res, anonCookieToAttach, req);
  }
}
