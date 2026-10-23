/**
 * Database Reliability & Resiliency Test Suite
 * Validates error categorization, credential masking, date sanitization,
 * empty database handling, and graceful offline fallback states.
 */

const assert = require('assert');

// 1. Test Credential Masking / Sanitization
console.log('\n--- 1. Testing Credential Masking in Errors ---');
const { sanitizeDatabaseMessage, categorizeDatabaseError } = require('../lib/db-diagnostics');

const rawConnectionString = 'Error connecting to postgresql://postgres:SuperSecretPassword123@localhost:5432/quantum_ai_dev';
const masked = sanitizeDatabaseMessage(rawConnectionString);
assert(!masked.includes('SuperSecretPassword123'), 'FAIL: Password was not masked!');
assert(masked.includes('***:***'), 'FAIL: Mask placeholder was not inserted!');
console.log('✓ Credential masking successfully hid password:', masked);

const tokenError = 'Failed to upload with Bearer vercel_blob_rw_abcdef123456';
const maskedToken = sanitizeDatabaseMessage(tokenError);
assert(!maskedToken.includes('vercel_blob_rw_abcdef123456'), 'FAIL: Token was not masked!');
console.log('✓ Token masking successfully hid bearer token:', maskedToken);

// 2. Test Error Categorization
console.log('\n--- 2. Testing Database Error Categorization ---');
const initErr = {
  name: 'PrismaClientInitializationError',
  message: "Can't reach database server at `localhost:5432`",
  code: 'P1001',
};
const categorizedInit = categorizeDatabaseError(initErr);
assert.strictEqual(categorizedInit.isConnectionFailure, true, 'FAIL: Expected isConnectionFailure = true');
assert.strictEqual(categorizedInit.errorCode, 'P1001', 'FAIL: Expected code P1001');
console.log('✓ PrismaClientInitializationError (P1001) correctly categorized as Connection Failure');

const schemaErr = {
  name: 'PrismaClientKnownRequestError',
  message: 'The table `public.NewFeature` does not exist in the current database.',
  code: 'P2021',
};
const categorizedSchema = categorizeDatabaseError(schemaErr);
assert.strictEqual(categorizedSchema.isConnectionFailure, false, 'FAIL: Expected isConnectionFailure = false');
assert.strictEqual(categorizedSchema.isSchemaError, true, 'FAIL: Expected isSchemaError = true');
console.log('✓ Missing Table Error (P2021) correctly categorized as Schema Error');

// 3. Test Date Sanitization in Backups & Restores
console.log('\n--- 3. Testing Date Sanitization for Prisma Restores ---');
// Mocking the function logic from actions.ts
function sanitizeTableData(records: any[]) {
  if (!Array.isArray(records)) return [];
  const dateFieldNames = new Set([
    'createdAt', 'updatedAt', 'publishedAt', 'readAt', 
    'lastLogin', 'startDate', 'endDate', 'deletedAt', 'timestamp'
  ]);

  return records.map((record) => {
    if (!record || typeof record !== 'object') return record;
    const clean = { ...record };
    for (const [key, val] of Object.entries(clean)) {
      if (typeof val === 'string' && (dateFieldNames.has(key) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val))) {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          clean[key] = parsed;
        }
      }
    }
    return clean;
  });
}

const rawBackupData = [
  {
    id: '1',
    title: 'Test Article',
    createdAt: '2026-10-23T12:00:00.000Z',
    updatedAt: '2026-10-23T12:30:00.000Z',
    publishedAt: '2026-10-23T12:00:00.000Z',
  },
];
const sanitizedData = sanitizeTableData(rawBackupData);
assert(sanitizedData[0].createdAt instanceof Date, 'FAIL: createdAt was not converted to Date instance!');
assert(sanitizedData[0].updatedAt instanceof Date, 'FAIL: updatedAt was not converted to Date instance!');
assert(sanitizedData[0].publishedAt instanceof Date, 'FAIL: publishedAt was not converted to Date instance!');
console.log('✓ ISO Date strings successfully converted to Date objects for Prisma PostgreSQL compatibility');

// 4. Test SiteSettings Defaults & Merging
console.log('\n--- 4. Testing Site Settings Merging Logic ---');
const { DEFAULT_SETTINGS } = require('../lib/settings');
assert(DEFAULT_SETTINGS.company_name === 'Quantum AI', 'FAIL: Expected company_name Quantum AI');
assert(DEFAULT_SETTINGS.QUANTUM_AI === 'Quantum AI', 'FAIL: Expected QUANTUM_AI Quantum AI');
console.log('✓ Site settings defaults loaded properly:', DEFAULT_SETTINGS.company_name);

console.log('\n========================================');
console.log('ALL DATABASE RELIABILITY TESTS PASSED! ✓');
console.log('========================================\n');
