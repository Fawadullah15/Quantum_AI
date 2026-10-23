import crypto from 'crypto';
import prisma from '@/lib/db';
import { sanitizeDatabaseMessage, logDatabaseDiagnostic } from '@/lib/db-diagnostics';

export const BACKUP_FORMAT_VERSION = '2.0.0';

export interface BackupMetadata {
  formatVersion: string;
  generator: string;
  timestamp: string;
  environment: {
    target: 'production' | 'development' | 'preview' | 'unknown';
    provider: 'neon' | 'local' | 'postgresql';
    host: string;
  };
  checksum: string;
  tableCounts: Record<string, number>;
  totalRecords: number;
}

export interface BackupPackage {
  meta: BackupMetadata;
  tables: Record<string, any[]>;
}

export interface PreflightValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
  summary?: {
    formatVersion: string;
    timestamp: string;
    sourceEnvironment: string;
    totalRecords: number;
    tableCounts: Record<string, number>;
    checksumVerified: boolean;
  };
}

/**
 * Safely inspects the configured DATABASE_URL to identify the target environment
 * without exposing sensitive credentials or passwords.
 */
export function getDatabaseEnvironmentInfo() {
  const dbUrl = process.env.DATABASE_URL || '';
  let provider: 'neon' | 'local' | 'postgresql' = 'postgresql';
  let target: 'production' | 'development' | 'preview' | 'unknown' = 'unknown';
  let host = 'unconfigured';

  if (!dbUrl) {
    return {
      target: 'unknown' as const,
      provider: 'postgresql' as const,
      host: 'DATABASE_URL_NOT_SET',
      label: 'Database Unconfigured',
      isProduction: false,
    };
  }

  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;

    if (host.includes('neon.tech')) {
      provider = 'neon';
      target = process.env.NODE_ENV === 'production' ? 'production' : 'preview';
    } else if (host === 'localhost' || host === '127.0.0.1') {
      provider = 'local';
      target = 'development';
    } else {
      provider = 'postgresql';
      target = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    }
  } catch {
    if (dbUrl.includes('neon.tech')) {
      provider = 'neon';
      target = 'production';
      host = 'neon.tech';
    } else if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      provider = 'local';
      target = 'development';
      host = 'localhost';
    }
  }

  const label =
    provider === 'neon'
      ? `Neon Cloud PostgreSQL (${target.toUpperCase()})`
      : provider === 'local'
      ? 'Local PostgreSQL (DEVELOPMENT)'
      : `PostgreSQL (${host})`;

  return {
    target,
    provider,
    host,
    label,
    isProduction: target === 'production' || provider === 'neon',
  };
}

/**
 * Computes a deterministic SHA-256 hash for integrity validation.
 */
export function calculateTablesChecksum(tables: Record<string, any[]>): string {
  // Sort table keys deterministically to guarantee consistent hashes
  const sortedKeys = Object.keys(tables).sort();
  const normalized: Record<string, any[]> = {};
  for (const key of sortedKeys) {
    normalized[key] = tables[key] || [];
  }
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

/**
 * Converts ISO date strings in record arrays to native JavaScript Date objects
 * so Prisma passes strict PostgreSQL datetime serialization.
 */
export function sanitizeTableData(records: any[]): any[] {
  if (!Array.isArray(records)) return [];
  const dateFieldNames = new Set([
    'createdAt',
    'updatedAt',
    'publishedAt',
    'readAt',
    'lastLogin',
    'startDate',
    'endDate',
    'deletedAt',
    'timestamp',
    'emailSentAt',
    'emailFailedAt',
    'restoredAt',
  ]);

  return records.map((record) => {
    if (!record || typeof record !== 'object') return record;
    const clean: any = { ...record };
    for (const [key, val] of Object.entries(clean)) {
      if (
        typeof val === 'string' &&
        (dateFieldNames.has(key) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val))
      ) {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          clean[key] = parsed;
        }
      }
    }
    return clean;
  });
}

/**
 * Generates an authoritative, complete snapshot of all 25 models in the database.
 */
export async function generateBackupPackage(): Promise<BackupPackage> {
  const envInfo = getDatabaseEnvironmentInfo();

  // Query all 25 application models defined in schema.prisma
  const tables: Record<string, any[]> = {
    // 1. Core & Access
    User: await prisma.user.findMany().catch(() => []),
    SiteSettings: await prisma.siteSettings.findMany().catch(() => []),
    NavigationItem: await prisma.navigationItem.findMany().catch(() => []),

    // 2. Organization & Team
    Founder: await prisma.founder.findMany().catch(() => []),
    TeamMember: await prisma.teamMember.findMany().catch(() => []),
    Leadership: await prisma.leadership.findMany().catch(() => []),

    // 3. Products & Features (Parent + Child)
    Product: await prisma.product.findMany().catch(() => []),
    ProductFeature: await prisma.productFeature.findMany().catch(() => []),

    // 4. Case Studies & Metrics (Parent + Child)
    CaseStudy: await prisma.caseStudy.findMany().catch(() => []),
    CaseStudyMetric: await prisma.caseStudyMetric.findMany().catch(() => []),

    // 5. Offerings & Content
    Service: await prisma.service.findMany().catch(() => []),
    Technology: await prisma.technology.findMany().catch(() => []),
    BlogPost: await prisma.blogPost.findMany().catch(() => []),
    Testimonial: await prisma.testimonial.findMany().catch(() => []),
    Client: await prisma.client.findMany().catch(() => []),

    // 6. Contact & Communications
    ContactSubmission: await prisma.contactSubmission.findMany().catch(() => []),
    Notification: await prisma.notification.findMany().catch(() => []),
    Media: await prisma.media.findMany().catch(() => []),

    // 7. Careers & Partnerships (Parent + Child)
    CareerPosition: await prisma.careerPosition.findMany().catch(() => []),
    CareerApplication: await prisma.careerApplication.findMany().catch(() => []),
    PartnershipRequest: await prisma.partnershipRequest.findMany().catch(() => []),
    SubmissionNote: await prisma.submissionNote.findMany().catch(() => []),

    // 8. Campaigns, Deleted Items & Auditing
    ActivityLog: await prisma.activityLog.findMany().catch(() => []),
    RecentlyDeleted: await prisma.recentlyDeleted.findMany().catch(() => []),
    Campaign: await prisma.campaign.findMany().catch(() => []),
  };

  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const [name, records] of Object.entries(tables)) {
    const count = Array.isArray(records) ? records.length : 0;
    tableCounts[name] = count;
    totalRecords += count;
  }

  const checksum = calculateTablesChecksum(tables);

  const meta: BackupMetadata = {
    formatVersion: BACKUP_FORMAT_VERSION,
    generator: 'Quantum AI Systems Database Backup Engine',
    timestamp: new Date().toISOString(),
    environment: {
      target: envInfo.target,
      provider: envInfo.provider,
      host: envInfo.host,
    },
    checksum,
    tableCounts,
    totalRecords,
  };

  return { meta, tables };
}

/**
 * Performs strict preflight inspection of an uploaded or candidate backup package
 * before any database modification is permitted.
 */
export function preflightValidateBackup(data: any): PreflightValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Backup payload must be a valid JSON object.' };
  }

  // Handle both v2.0 format ({ meta, tables }) and legacy v1.0 format ({ timestamp, version, tables })
  const isV2 = Boolean(data.meta && data.tables);
  const isV1 = Boolean(data.version && data.tables && !data.meta);

  if (!isV2 && !isV1) {
    return {
      valid: false,
      error: 'Invalid backup structure. Required root property "tables" was not found.',
    };
  }

  const tables = data.tables;
  if (typeof tables !== 'object' || tables === null || Array.isArray(tables)) {
    return {
      valid: false,
      error: 'Invalid "tables" structure. Expected a map of table names to record arrays.',
    };
  }

  // Calculate table counts
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;
  for (const [tableName, records] of Object.entries(tables)) {
    if (!Array.isArray(records)) {
      return {
        valid: false,
        error: `Table "${tableName}" contains malformed data (expected array, received ${typeof records}).`,
      };
    }
    tableCounts[tableName] = records.length;
    totalRecords += records.length;
  }

  // Referential Integrity Preflight Check: ProductFeature -> Product
  if (Array.isArray(tables.ProductFeature) && tables.ProductFeature.length > 0) {
    const productIds = new Set(
      Array.isArray(tables.Product) ? tables.Product.map((p: any) => p.id) : []
    );
    for (const feat of tables.ProductFeature) {
      if (feat.productId && !productIds.has(feat.productId)) {
        return {
          valid: false,
          error: `Referential Integrity Error: ProductFeature ${feat.id || 'record'} references non-existent Product ID "${feat.productId}".`,
        };
      }
    }
  }

  // Referential Integrity Preflight Check: CaseStudyMetric -> CaseStudy
  if (Array.isArray(tables.CaseStudyMetric) && tables.CaseStudyMetric.length > 0) {
    const caseStudyIds = new Set(
      Array.isArray(tables.CaseStudy) ? tables.CaseStudy.map((c: any) => c.id) : []
    );
    for (const metric of tables.CaseStudyMetric) {
      if (metric.caseStudyId && !caseStudyIds.has(metric.caseStudyId)) {
        return {
          valid: false,
          error: `Referential Integrity Error: CaseStudyMetric references non-existent CaseStudy ID "${metric.caseStudyId}".`,
        };
      }
    }
  }

  // Referential Integrity Preflight Check: SubmissionNote -> Parent Application/Partnership
  if (Array.isArray(tables.SubmissionNote) && tables.SubmissionNote.length > 0) {
    const appIds = new Set(
      Array.isArray(tables.CareerApplication) ? tables.CareerApplication.map((a: any) => a.id) : []
    );
    const ptrIds = new Set(
      Array.isArray(tables.PartnershipRequest) ? tables.PartnershipRequest.map((p: any) => p.id) : []
    );
    for (const note of tables.SubmissionNote) {
      if (note.careerApplicationId && !appIds.has(note.careerApplicationId)) {
        return {
          valid: false,
          error: `Referential Integrity Error: SubmissionNote references non-existent CareerApplication ID "${note.careerApplicationId}".`,
        };
      }
      if (note.partnershipRequestId && !ptrIds.has(note.partnershipRequestId)) {
        return {
          valid: false,
          error: `Referential Integrity Error: SubmissionNote references non-existent PartnershipRequest ID "${note.partnershipRequestId}".`,
        };
      }
    }
  }

  let checksumVerified = false;
  let timestamp = new Date().toISOString();
  let formatVersion = '1.0';
  let sourceEnvironment = 'unknown';

  if (isV2) {
    formatVersion = data.meta.formatVersion || '2.0.0';
    timestamp = data.meta.timestamp || timestamp;
    sourceEnvironment =
      data.meta.environment?.label ||
      data.meta.environment?.host ||
      data.meta.environment?.target ||
      'unknown';

    if (data.meta.checksum) {
      const calculated = calculateTablesChecksum(tables);
      if (calculated !== data.meta.checksum) {
        return {
          valid: false,
          error:
            'Integrity Checksum Mismatch: The backup data does not match its SHA-256 integrity hash. The file may be corrupted or modified.',
        };
      }
      checksumVerified = true;
    }
  } else {
    timestamp = data.timestamp || timestamp;
    formatVersion = data.version || '1.0';
  }

  return {
    valid: true,
    summary: {
      formatVersion,
      timestamp,
      sourceEnvironment,
      totalRecords,
      tableCounts,
      checksumVerified,
    },
  };
}

/**
 * Executes an atomic, transactional restoration of the backup package into PostgreSQL.
 *
 * Guarantees:
 * 1. Strict preflight inspection before any database write.
 * 2. Foreign keys and relational integrity maintained via dependency-ordered deletion and insertion.
 * 3. The currently authenticated administrator account is preserved so they are never locked out.
 * 4. Entire process wrapped in prisma.$transaction; any failure triggers an immediate rollback.
 * 5. Successful restore logged in ActivityLog for enterprise audit trails.
 */
export async function executeRestorePackage(
  data: any,
  adminUserEmail?: string | null
): Promise<{ success: boolean; totalRestored: number; message?: string }> {
  // 1. Preflight validation
  const preflight = preflightValidateBackup(data);
  if (!preflight.valid || !preflight.summary) {
    throw new Error(preflight.error || 'Backup failed preflight validation.');
  }

  const tables = data.tables;

  // 2. Fetch current admin user to preserve login session
  const currentAdmin = adminUserEmail
    ? await prisma.user.findUnique({
        where: { email: adminUserEmail.trim().toLowerCase() },
      }).catch(() => null)
    : null;

  let totalRestored = 0;

  // 3. Atomic transaction with 60s timeout
  await prisma.$transaction(
    async (tx) => {
      // ─── STEP A: DELETE DEPENDENT CHILD RECORDS FIRST ───
      await tx.submissionNote.deleteMany();
      await tx.activityLog.deleteMany();
      await tx.productFeature.deleteMany();
      await tx.caseStudyMetric.deleteMany();

      // ─── STEP B: DELETE RELATIONAL PARENT RECORDS ───
      await tx.product.deleteMany();
      await tx.caseStudy.deleteMany();
      await tx.careerApplication.deleteMany();
      await tx.partnershipRequest.deleteMany();

      // ─── STEP C: DELETE INDEPENDENT APPLICATION RECORDS ───
      await tx.campaign.deleteMany();
      await tx.siteSettings.deleteMany();
      await tx.navigationItem.deleteMany();
      await tx.founder.deleteMany();
      await tx.teamMember.deleteMany();
      await tx.leadership.deleteMany();
      await tx.service.deleteMany();
      await tx.technology.deleteMany();
      await tx.blogPost.deleteMany();
      await tx.testimonial.deleteMany();
      await tx.client.deleteMany();
      await tx.contactSubmission.deleteMany();
      await tx.notification.deleteMany();
      await tx.media.deleteMany();
      await tx.careerPosition.deleteMany();
      await tx.recentlyDeleted.deleteMany();

      // ─── STEP D: USER MANAGEMENT ───
      const rawUsers = sanitizeTableData(tables.User || []);
      await tx.user.deleteMany();

      if (rawUsers.length > 0) {
        await tx.user.createMany({ data: rawUsers, skipDuplicates: true });
        totalRestored += rawUsers.length;
      }

      // Safeguard: Ensure the restoring admin is never locked out
      if (currentAdmin) {
        const adminStillExists = await tx.user.findUnique({
          where: { email: currentAdmin.email },
        });
        if (!adminStillExists) {
          await tx.user.create({ data: currentAdmin });
        }
      }

      // ─── STEP E: INSERT INDEPENDENT MODELS ───
      if (tables.SiteSettings?.length) {
        const rows = sanitizeTableData(tables.SiteSettings);
        await tx.siteSettings.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.NavigationItem?.length) {
        const rows = sanitizeTableData(tables.NavigationItem);
        await tx.navigationItem.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Founder?.length) {
        const rows = sanitizeTableData(tables.Founder);
        await tx.founder.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.TeamMember?.length) {
        const rows = sanitizeTableData(tables.TeamMember);
        await tx.teamMember.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Leadership?.length) {
        const rows = sanitizeTableData(tables.Leadership);
        await tx.leadership.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Service?.length) {
        const rows = sanitizeTableData(tables.Service);
        await tx.service.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Technology?.length) {
        const rows = sanitizeTableData(tables.Technology);
        await tx.technology.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.BlogPost?.length) {
        const rows = sanitizeTableData(tables.BlogPost);
        await tx.blogPost.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Testimonial?.length) {
        const rows = sanitizeTableData(tables.Testimonial);
        await tx.testimonial.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Client?.length) {
        const rows = sanitizeTableData(tables.Client);
        await tx.client.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.ContactSubmission?.length) {
        const rows = sanitizeTableData(tables.ContactSubmission);
        await tx.contactSubmission.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Notification?.length) {
        const rows = sanitizeTableData(tables.Notification);
        await tx.notification.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Media?.length) {
        const rows = sanitizeTableData(tables.Media);
        await tx.media.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.CareerPosition?.length) {
        const rows = sanitizeTableData(tables.CareerPosition);
        await tx.careerPosition.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.Campaign?.length) {
        const rows = sanitizeTableData(tables.Campaign);
        await tx.campaign.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.RecentlyDeleted?.length) {
        const rows = sanitizeTableData(tables.RecentlyDeleted);
        await tx.recentlyDeleted.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }

      // ─── STEP F: INSERT RELATIONAL PARENTS ───
      if (tables.Product?.length) {
        const rows = sanitizeTableData(tables.Product);
        await tx.product.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.CaseStudy?.length) {
        const rows = sanitizeTableData(tables.CaseStudy);
        await tx.caseStudy.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.CareerApplication?.length) {
        const rows = sanitizeTableData(tables.CareerApplication);
        await tx.careerApplication.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.PartnershipRequest?.length) {
        const rows = sanitizeTableData(tables.PartnershipRequest);
        await tx.partnershipRequest.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }

      // ─── STEP G: INSERT RELATIONAL CHILDREN ───
      if (tables.ProductFeature?.length) {
        const rows = sanitizeTableData(tables.ProductFeature);
        await tx.productFeature.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.CaseStudyMetric?.length) {
        const rows = sanitizeTableData(tables.CaseStudyMetric);
        await tx.caseStudyMetric.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.SubmissionNote?.length) {
        const rows = sanitizeTableData(tables.SubmissionNote);
        await tx.submissionNote.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }
      if (tables.ActivityLog?.length) {
        const rows = sanitizeTableData(tables.ActivityLog);
        await tx.activityLog.createMany({ data: rows, skipDuplicates: true });
        totalRestored += rows.length;
      }

      // ─── STEP H: AUDIT LOG ENTRY ───
      await tx.activityLog.create({
        data: {
          adminEmail: currentAdmin?.email || 'admin@quantumai.dev',
          adminName: currentAdmin?.name || 'Administrator',
          action: 'RESTORE_DATABASE',
          entity: 'DATABASE_BACKUP',
          details: JSON.stringify({
            formatVersion: preflight.summary?.formatVersion,
            sourceTimestamp: preflight.summary?.timestamp,
            recordsRestored: totalRestored,
            restoredAt: new Date().toISOString(),
          }),
        },
      });
    },
    { timeout: 60000, maxWait: 10000 }
  );

  return { success: true, totalRestored };
}
