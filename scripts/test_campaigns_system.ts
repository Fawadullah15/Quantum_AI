import { sanitizeDestinationUrl, computeEffectiveStatus } from '../lib/campaigns';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- TESTING CAMPAIGN UTILITIES ---');

// 1. URL Sanitization Tests
assert(sanitizeDestinationUrl('javascript:alert(1)') === null, 'Rejects javascript: scheme');
assert(sanitizeDestinationUrl('JAVASCRIPT:alert(1)') === null, 'Rejects case-insensitive JAVASCRIPT: scheme');
assert(sanitizeDestinationUrl('data:text/html;base64,...') === null, 'Rejects data: scheme');
assert(sanitizeDestinationUrl('vbscript:msgbox(1)') === null, 'Rejects vbscript: scheme');
assert(sanitizeDestinationUrl('https://example.com') === 'https://example.com', 'Permits https:// URLs');
assert(sanitizeDestinationUrl('http://example.com') === 'http://example.com', 'Permits http:// URLs');
assert(sanitizeDestinationUrl('/work/case-study') === '/work/case-study', 'Permits relative paths');
assert(sanitizeDestinationUrl('work/case-study') === '/work/case-study', 'Prepends slash to relative route without leading slash');
assert(sanitizeDestinationUrl('mailto:contact@quantumai.com') === 'mailto:contact@quantumai.com', 'Permits mailto: links');
assert(sanitizeDestinationUrl('tel:+1234567890') === 'tel:+1234567890', 'Permits tel: links');
assert(sanitizeDestinationUrl('') === null, 'Handles empty string as null');
assert(sanitizeDestinationUrl(null) === null, 'Handles null as null');

// 2. computeEffectiveStatus Tests
const now = new Date();
const pastDate = new Date(now.getTime() - 3600 * 1000);
const futureDate = new Date(now.getTime() + 3600 * 1000);

assert(
  computeEffectiveStatus({ status: 'DISABLED' }) === 'DISABLED',
  'Disabled campaign remains DISABLED'
);

assert(
  computeEffectiveStatus({ status: 'DRAFT' }) === 'DRAFT',
  'Draft campaign remains DRAFT'
);

assert(
  computeEffectiveStatus({ status: 'PUBLISHED', endDate: pastDate }) === 'EXPIRED',
  'Published campaign past its endDate is effectively EXPIRED'
);

assert(
  computeEffectiveStatus({ status: 'SCHEDULED', startDate: futureDate }) === 'SCHEDULED',
  'Scheduled campaign with future startDate is effectively SCHEDULED'
);

assert(
  computeEffectiveStatus({ status: 'SCHEDULED', startDate: pastDate, endDate: futureDate }) === 'PUBLISHED',
  'Scheduled campaign with past startDate and future endDate is effectively PUBLISHED'
);

assert(
  computeEffectiveStatus({ status: 'PUBLISHED', startDate: pastDate, endDate: futureDate }) === 'PUBLISHED',
  'Active campaign within start/end dates is PUBLISHED'
);

// 3. Repeat Policy Logic Tests (LocalStorage & SessionStorage simulation)
const repeatMockStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

function isEligibleToDisplay(
  campaignId: string,
  updatedAt: string,
  repeatPolicy: string,
  cooldownMinutes: number = 1440
): boolean {
  if (repeatPolicy === 'EVERY_PAGE') return true;

  if (repeatPolicy === 'SESSION') {
    const sessionKey = `qai_campaign_seen_${campaignId}_${updatedAt}`;
    return !mockSessionStorage[sessionKey];
  }

  if (repeatPolicy === 'ONCE_PERSISTENT') {
    const persistentKey = `qai_campaign_dismissed_${campaignId}_${updatedAt}`;
    return !repeatMockStorage[persistentKey];
  }

  if (repeatPolicy === 'COOLDOWN') {
    const cooldownKey = `qai_campaign_cooldown_${campaignId}_${updatedAt}`;
    const dismissedAt = repeatMockStorage[cooldownKey];
    if (!dismissedAt) return true;
    const elapsedMinutes = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60);
    return elapsedMinutes >= cooldownMinutes;
  }

  return true;
}

const testId = 'camp-123';
const testVersion = '2026-10-15T12:00:00Z';

assert(isEligibleToDisplay(testId, testVersion, 'EVERY_PAGE') === true, 'EVERY_PAGE is always eligible');

assert(isEligibleToDisplay(testId, testVersion, 'SESSION') === true, 'SESSION is initially eligible');
mockSessionStorage[`qai_campaign_seen_${testId}_${testVersion}`] = 'true';
assert(isEligibleToDisplay(testId, testVersion, 'SESSION') === false, 'SESSION is blocked once seen in session');

assert(isEligibleToDisplay(testId, testVersion, 'ONCE_PERSISTENT') === true, 'ONCE_PERSISTENT is initially eligible');
repeatMockStorage[`qai_campaign_dismissed_${testId}_${testVersion}`] = 'true';
assert(isEligibleToDisplay(testId, testVersion, 'ONCE_PERSISTENT') === false, 'ONCE_PERSISTENT is blocked once dismissed');

// Cooldown test
repeatMockStorage[`qai_campaign_cooldown_${testId}_${testVersion}`] = (Date.now() - 30 * 60 * 1000).toString(); // 30 min ago
assert(isEligibleToDisplay(testId, testVersion, 'COOLDOWN', 60) === false, 'COOLDOWN blocks when within cooldown period (30min < 60min)');
repeatMockStorage[`qai_campaign_cooldown_${testId}_${testVersion}`] = (Date.now() - 90 * 60 * 1000).toString(); // 90 min ago
assert(isEligibleToDisplay(testId, testVersion, 'COOLDOWN', 60) === true, 'COOLDOWN unblocks once cooldown period expires (90min >= 60min)');

console.log('--- ALL CAMPAIGN SYSTEM UNIT TESTS PASSED ---');
