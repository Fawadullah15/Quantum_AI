/**
 * Database Diagnostic & Error Categorization Utility
 * Provides safe error reporting without leaking secrets or credentials,
 * and distinguishes between connection failures, schema errors, and empty tables.
 */

export interface DatabaseDiagnosticResult {
  isConnectionFailure: boolean;
  isSchemaError: boolean;
  errorCode?: string;
  sanitizedMessage: string;
}

/**
 * Strips sensitive credentials, passwords, and tokens from error messages and connection strings.
 */
export function sanitizeDatabaseMessage(message: string): string {
  if (!message) return '';
  return message
    // Mask postgresql://user:password@host
    .replace(/postgresql:\/\/[^:]+:([^@]+)@/gi, 'postgresql://***:***@')
    .replace(/postgres:\/\/[^:]+:([^@]+)@/gi, 'postgres://***:***@')
    // Mask tokens
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer ***')
    .replace(/token=[a-zA-Z0-9_\-\.]+/gi, 'token=***');
}

/**
 * Categorizes a database exception into connection failure vs schema/query error.
 */
export function categorizeDatabaseError(error: unknown): DatabaseDiagnosticResult {
  const err = error as any;
  const name = err?.name || '';
  const code = err?.code || '';
  const rawMsg = err?.message || String(error || '');
  const sanitizedMessage = sanitizeDatabaseMessage(rawMsg);

  const isConnectionFailure =
    name === 'PrismaClientInitializationError' ||
    code === 'P1000' || // Authentication failed
    code === 'P1001' || // Can't reach database server
    code === 'P1002' || // Database server reached but timed out
    code === 'P1003' || // Database does not exist
    code === 'P1017' || // Server has closed connection
    rawMsg.includes("Can't reach database") ||
    rawMsg.includes('connect ECONNREFUSED') ||
    rawMsg.includes('Connection terminated') ||
    rawMsg.includes('timeout');

  const isSchemaError =
    code === 'P1012' || // Schema validation error
    code === 'P2021' || // Table does not exist in current database
    code === 'P2022' || // Column does not exist
    rawMsg.includes('does not exist in the current database');

  return {
    isConnectionFailure,
    isSchemaError,
    errorCode: code || (name ? name : undefined),
    sanitizedMessage,
  };
}

/**
 * Server-side diagnostic logger.
 * Logs structured diagnostic information for debugging without exposing secrets.
 */
export function logDatabaseDiagnostic(context: string, error: unknown): void {
  const diag = categorizeDatabaseError(error);
  if (diag.isConnectionFailure) {
    console.error(
      `[Database Diagnostic: Connection Failure] [${context}] Code: ${diag.errorCode || 'UNKNOWN'} | ${diag.sanitizedMessage}`
    );
  } else if (diag.isSchemaError) {
    console.error(
      `[Database Diagnostic: Schema Error] [${context}] Code: ${diag.errorCode || 'UNKNOWN'} | ${diag.sanitizedMessage}`
    );
  } else {
    console.error(
      `[Database Diagnostic: Query Error] [${context}] Code: ${diag.errorCode || 'UNKNOWN'} | ${diag.sanitizedMessage}`
    );
  }
}

// In-memory circuit breaker cache for connection status
let connectionStatusCache: { isConnected: boolean; checkedAt: number; error?: string } | null = null;
const CACHE_TTL_MS = 5000; // 5-second cooldown

/**
 * Quickly checks if the database is reachable.
 * Results are cached for 5 seconds to prevent connection flooding when database is offline.
 */
export async function getDatabaseConnectionStatus(
  prismaClient: any
): Promise<{ isConnected: boolean; error?: string; cached: boolean }> {
  const now = Date.now();
  if (connectionStatusCache && now - connectionStatusCache.checkedAt < CACHE_TTL_MS) {
    return {
      isConnected: connectionStatusCache.isConnected,
      error: connectionStatusCache.error,
      cached: true,
    };
  }

  try {
    // Quick, lightweight query with timeout
    await Promise.race([
      prismaClient.$queryRawUnsafe('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database health check timed out (3s)')), 3000)
      ),
    ]);

    connectionStatusCache = { isConnected: true, checkedAt: now };
    return { isConnected: true, cached: false };
  } catch (err: any) {
    const diag = categorizeDatabaseError(err);
    connectionStatusCache = {
      isConnected: false,
      checkedAt: now,
      error: diag.sanitizedMessage,
    };
    return {
      isConnected: false,
      error: diag.sanitizedMessage,
      cached: false,
    };
  }
}
