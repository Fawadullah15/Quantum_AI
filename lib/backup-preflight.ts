export interface BackupPreflightSummary {
  formatVersion: string;
  timestamp: string;
  sourceEnvironment: string;
  totalRecords: number;
  tableCounts: Record<string, number>;
  checksumVerified: boolean;
}

export interface ClientPreflightValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
  summary?: BackupPreflightSummary;
}

export async function calculateTablesChecksumClient(
  tables: Record<string, any[]>
): Promise<string> {
  const sortedKeys = Object.keys(tables).sort();
  const normalized: Record<string, any[]> = {};
  for (const key of sortedKeys) {
    normalized[key] = tables[key] || [];
  }
  const encoded = new TextEncoder().encode(JSON.stringify(normalized));
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto SHA-256 is unavailable in this browser environment.');
  }
  const digest = await subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function preflightValidateBackupClient(
  data: any
): Promise<ClientPreflightValidationResult> {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Backup payload must be a valid JSON object.' };
  }

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

  if (Array.isArray(tables.SubmissionNote) && tables.SubmissionNote.length > 0) {
    const appIds = new Set(
      Array.isArray(tables.CareerApplication)
        ? tables.CareerApplication.map((a: any) => a.id)
        : []
    );
    const ptrIds = new Set(
      Array.isArray(tables.PartnershipRequest)
        ? tables.PartnershipRequest.map((p: any) => p.id)
        : []
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
      const calculated = await calculateTablesChecksumClient(tables);
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
