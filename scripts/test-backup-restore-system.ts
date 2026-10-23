import crypto from 'crypto';
import {
  calculateTablesChecksum,
  preflightValidateBackup,
  sanitizeTableData,
  getDatabaseEnvironmentInfo,
  BACKUP_FORMAT_VERSION,
} from '../lib/backup-engine';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    passedTests++;
  } else {
    console.error(`✗ FAILED: ${message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('QUANTUM AI: BACKUP & RESTORATION ENGINE TEST SUITE');
  console.log('====================================================\n');

  // ─── 1. TEST REPRESENTATIVE DATASET & CHECKSUM COMPUTATION ───
  console.log('--- 1. Testing Checksum Calculation & Determinism ---');
  const sampleTables = {
    SiteSettings: [
      { id: 'set_1', key: 'company_name', value: 'Quantum AI Systems', updatedAt: new Date().toISOString() },
      { id: 'set_2', key: 'brand_accent_color', value: '#1677FF', updatedAt: new Date().toISOString() },
    ],
    User: [
      {
        id: 'usr_admin',
        email: 'admin@quantumai.dev',
        name: 'System Admin',
        password: '$2a$10$hashedAdminPasswordSample',
        role: 'SUPER_ADMIN',
        tokenVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    Product: [
      {
        id: 'prod_101',
        name: 'Quantum Core',
        slug: 'quantum-core',
        description: 'Autonomous neural orchestration engine.',
        category: 'AI Systems',
        status: 'LIVE',
        technologies: '["PyTorch", "Rust", "Next.js"]',
        published: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    ProductFeature: [
      {
        id: 'feat_1',
        productId: 'prod_101',
        title: 'Zero Latency Inference',
        description: 'Sub-5ms distributed token pipeline.',
        order: 1,
      },
    ],
    CaseStudy: [
      {
        id: 'cs_201',
        title: 'Autonomous Logistics Pipeline',
        slug: 'autonomous-logistics',
        client: 'Global Cargo Corp',
        industry: 'Logistics',
        problem: 'Dispatch bottleneck',
        solution: 'Algorithmic routing',
        implementation: 'Event-driven graph',
        technologies: 'Next.js, Python, PostgreSQL',
        results: '48% cost reduction',
        year: 2026,
        services: 'AI Systems',
        published: true,
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    CaseStudyMetric: [
      {
        id: 'csm_1',
        caseStudyId: 'cs_201',
        label: 'Efficiency Gain',
        value: '+48%',
        description: 'Measured across 1.2M transactions',
      },
    ],
    CareerApplication: [
      {
        id: 'app_301',
        referenceId: 'QA-CAR-1001',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        position: 'AI Engineer',
        experienceLevel: 'Senior',
        skills: 'Python, TypeScript, PyTorch',
        introduction: 'Senior machine learning architect.',
        resumeUrl: 'https://blob.vercel-storage.com/resumes/jane.pdf',
        workType: 'Remote',
        status: 'REVIEWING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    SubmissionNote: [
      {
        id: 'note_1',
        careerApplicationId: 'app_301',
        authorName: 'HR Team',
        authorEmail: 'hr@quantumai.dev',
        content: 'Candidate has strong systems engineering background.',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const checksum1 = calculateTablesChecksum(sampleTables);
  const checksum2 = calculateTablesChecksum(sampleTables);
  assert(typeof checksum1 === 'string' && checksum1.length === 64, 'Checksum is valid 64-char SHA-256 hex string');
  assert(checksum1 === checksum2, 'Checksum computation is strictly deterministic across identical tables');

  // ─── 2. TEST PREFLIGHT VALIDATION: VALID PACKAGE ───
  console.log('\n--- 2. Testing Preflight Validation on Valid Package ---');
  const validPackage = {
    meta: {
      formatVersion: BACKUP_FORMAT_VERSION,
      generator: 'Quantum AI Systems Database Backup Engine',
      timestamp: new Date().toISOString(),
      environment: {
        target: 'production',
        provider: 'neon',
        host: 'ep-cool-pooler.us-east-2.aws.neon.tech',
      },
      checksum: checksum1,
      tableCounts: {
        SiteSettings: 2,
        User: 1,
        Product: 1,
        ProductFeature: 1,
        CaseStudy: 1,
        CaseStudyMetric: 1,
        CareerApplication: 1,
        SubmissionNote: 1,
      },
      totalRecords: 9,
    },
    tables: sampleTables,
  };

  const validPreflight = preflightValidateBackup(validPackage);
  assert(validPreflight.valid === true, 'Valid backup passes preflight check');
  assert(validPreflight.summary?.checksumVerified === true, 'Integrity checksum successfully verified');
  assert(validPreflight.summary?.totalRecords === 9, 'Total record count matches summary (9 records)');

  // ─── 3. TEST CORRUPTED / TAMPERED BACKUP DETECTION ───
  console.log('\n--- 3. Testing Tamper & Corruption Rejection ---');
  // Copy package and maliciously alter one property
  const tamperedPackage = JSON.parse(JSON.stringify(validPackage));
  tamperedPackage.tables.User[0].role = 'SUPER_ADMIN_ELEVATED'; // Tampered payload without updating checksum

  const tamperedPreflight = preflightValidateBackup(tamperedPackage);
  assert(tamperedPreflight.valid === false, 'Tampered backup payload is rejected');
  assert(
    tamperedPreflight.error?.includes('Integrity Checksum Mismatch') === true,
    'Rejection explicitly cites SHA-256 integrity mismatch'
  );

  // ─── 4. TEST BROKEN REFERENTIAL INTEGRITY PREFLIGHT REJECTION ───
  console.log('\n--- 4. Testing Foreign Key Referential Integrity Preflight ---');
  const brokenRelPackage = JSON.parse(JSON.stringify(validPackage));
  // Change child foreign key to a non-existent parent
  brokenRelPackage.tables.ProductFeature[0].productId = 'non_existent_prod_999';
  // Recompute checksum so checksum check passes, testing relational validator
  brokenRelPackage.meta.checksum = calculateTablesChecksum(brokenRelPackage.tables);

  const brokenRelPreflight = preflightValidateBackup(brokenRelPackage);
  assert(brokenRelPreflight.valid === false, 'Orphaned child record is rejected before touching DB');
  assert(
    brokenRelPreflight.error?.includes('Referential Integrity Error') === true,
    'Rejection explicitly cites foreign key mismatch for ProductFeature'
  );

  // ─── 5. TEST MALFORMED PAYLOADS ───
  console.log('\n--- 5. Testing Malformed & Unsupported Payloads ---');
  assert(preflightValidateBackup(null).valid === false, 'Null payload safely rejected');
  assert(preflightValidateBackup('string').valid === false, 'Primitive payload safely rejected');
  assert(preflightValidateBackup({ tables: 'not-an-object' }).valid === false, 'Non-object tables map safely rejected');
  assert(preflightValidateBackup({}).valid === false, 'Empty payload missing tables rejected');

  // ─── 6. TEST BACKWARD COMPATIBILITY (V1.0 FORMAT) ───
  console.log('\n--- 6. Testing Legacy V1.0 Format Backward Compatibility ---');
  const legacyV1Package = {
    timestamp: '2026-10-01T12:00:00.000Z',
    version: '1.0',
    tables: {
      SiteSettings: [{ id: '1', key: 'title', value: 'Quantum AI' }],
    },
  };
  const v1Preflight = preflightValidateBackup(legacyV1Package);
  assert(v1Preflight.valid === true, 'Legacy v1.0 backup passes backward-compatibility preflight');
  assert(v1Preflight.summary?.formatVersion === '1.0', 'Legacy version 1.0 correctly identified');

  // ─── 7. TEST DATE SANITIZATION FOR POSTGRESQL RESTORATION ───
  console.log('\n--- 7. Testing ISO Date Sanitization for PostgreSQL ---');
  const rawData = [
    { id: '1', createdAt: '2026-10-23T18:00:00.000Z', title: 'Test Post', views: 42 },
    { id: '2', createdAt: 'invalid-date', title: 'Bad Date' },
  ];
  const cleaned = sanitizeTableData(rawData);
  assert(cleaned[0].createdAt instanceof Date, 'ISO string date correctly converted to native Date');
  assert(cleaned[0].views === 42, 'Non-date primitive values preserved unchanged');

  // ─── 8. TEST ENVIRONMENT DETECTION & CREDENTIAL REDACTION ───
  console.log('\n--- 8. Testing Environment Transparency & Secret Masking ---');
  // Temporarily set a dummy Neon URL to verify detection
  const origEnv = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://admin_user:super_secret_pw@ep-shiny-pond-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

  const neonInfo = getDatabaseEnvironmentInfo();
  assert(neonInfo.provider === 'neon', 'Correctly identified Neon PostgreSQL provider');
  assert(neonInfo.isProduction === true, 'Correctly flagged as Production environment');
  assert(!neonInfo.label.includes('super_secret_pw'), 'Password strictly omitted from environment label');
  assert(!neonInfo.host.includes('super_secret_pw'), 'Password strictly omitted from host');

  // Test local detection
  process.env.DATABASE_URL = 'postgresql://postgres:localpass@localhost:5432/quantum_ai_dev';
  const localInfo = getDatabaseEnvironmentInfo();
  assert(localInfo.provider === 'local', 'Correctly identified Local PostgreSQL provider');
  assert(localInfo.isProduction === false, 'Correctly flagged as Development environment');

  // Restore original env
  if (origEnv !== undefined) {
    process.env.DATABASE_URL = origEnv;
  } else {
    delete process.env.DATABASE_URL;
  }

  // ─── SUMMARY ───
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test runner encountered an unhandled exception:', err);
  process.exit(1);
});
