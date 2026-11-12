import assert from 'assert';
import fs from 'fs/promises';
import path from 'path';
import { encode } from 'next-auth/jwt';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3108';
const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'quantum-ai-secret-encryption-key-production-32-chars';

async function mintAdminCookie(role: 'SUPER_ADMIN' | 'EDITOR', id: string): Promise<string> {
  const token = await encode({
    token: {
      id,
      email: `${role.toLowerCase()}@quantumaitech.org`,
      name: `Test ${role}`,
      role,
      tokenVersion: 1,
    },
    secret: NEXTAUTH_SECRET,
    maxAge: 3600,
  });
  return `next-auth.session-token=${token}`;
}

async function runHttpTests() {
  console.log(`=== QUANTUMBOT PHASE 8 LIVE HTTP TEST SUITE (${BASE_URL}) ===\n`);

  let passed = 0;
  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      passed++;
      console.log(`✓ PASS: ${name}`);
    } catch (err) {
      console.error(`✕ FAIL: ${name}`);
      console.error(err);
      process.exitCode = 1;
      throw err;
    }
  }

  // Backup existing .private_storage/bot_admin if present so tests leave workspace clean
  const adminStorageDir = path.join(process.cwd(), '.private_storage', 'bot_admin');
  const backupDir = path.join(process.cwd(), '.private_storage', `bot_admin_bak_${Date.now()}`);
  let hadExistingAdminDir = false;
  try {
    await fs.access(adminStorageDir);
    hadExistingAdminDir = true;
    await fs.rename(adminStorageDir, backupDir);
  } catch {}

  let botCookie = '';
  let botUserId = '';
  const botEmail = `p8http_${Date.now()}@quantumbot.test`;
  const botPassword = 'TestPassword123!';

  try {
    // 1. Unauthenticated caller rejection
    await test('Unauthenticated callers receive 401 on all /api/admin/bot/* routes & redirect on /admin/quantumbot', async () => {
      const endpoints: Array<[string, string]> = [
        ['GET', '/api/admin/bot/config'],
        ['PATCH', '/api/admin/bot/config'],
        ['GET', '/api/admin/bot/models'],
        ['POST', '/api/admin/bot/models'],
        ['PATCH', '/api/admin/bot/models'],
        ['DELETE', '/api/admin/bot/models?id=x'],
        ['POST', '/api/admin/bot/models/test'],
        ['GET', '/api/admin/bot/limits'],
        ['PATCH', '/api/admin/bot/limits'],
        ['GET', '/api/admin/bot/analytics'],
        ['GET', '/api/admin/bot/users'],
        ['PATCH', '/api/admin/bot/users/user_1'],
      ];

      for (const [method, url] of endpoints) {
        const res = await fetch(`${BASE_URL}${url}`, {
          method,
          headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
          body: method !== 'GET' && method !== 'DELETE' ? '{}' : undefined,
        });
        assert.strictEqual(
          res.status,
          401,
          `Expected 401 for ${method} ${url}, got ${res.status}`
        );
      }

      const pageRes = await fetch(`${BASE_URL}/admin/quantumbot`, { redirect: 'manual' });
      assert.ok(
        pageRes.status >= 300 && pageRes.status < 400,
        `Expected redirect on /admin/quantumbot, got ${pageRes.status}`
      );
      assert.ok(
        pageRes.headers.get('location')?.includes('/admin/login'),
        `Expected /admin/login redirect, got ${pageRes.headers.get('location')}`
      );
    });

    // 2. Register public BotUser & confirm isolation from /api/admin/bot/*
    await test('Public BotUser account (qb_session) cannot access /api/admin/bot/* (401)', async () => {
      const regRes = await fetch(`${BASE_URL}/api/bot/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Phase8 HTTP Tester',
          email: botEmail,
          password: botPassword,
        }),
      });
      assert.strictEqual(regRes.status, 201);
      const regData = await regRes.json();
      botUserId = regData.user.id;
      const setCookie = regRes.headers.get('set-cookie') || '';
      const match = setCookie.match(/qb_session=([^;]+)/);
      assert.ok(match, 'Expected qb_session cookie');
      botCookie = `qb_session=${match[1]}`;

      const adminGet = await fetch(`${BASE_URL}/api/admin/bot/config`, {
        headers: { Cookie: botCookie },
      });
      assert.strictEqual(adminGet.status, 401);

      const adminUsers = await fetch(`${BASE_URL}/api/admin/bot/users`, {
        headers: { Cookie: botCookie },
      });
      assert.strictEqual(adminUsers.status, 401);
    });

    const superAdminCookie = await mintAdminCookie('SUPER_ADMIN', 'adm_super_1');
    const editorCookie = await mintAdminCookie('EDITOR', 'adm_editor_1');

    // 3. EDITOR RBAC over HTTP
    await test('EDITOR role can read analytics (200) but is blocked from mutations (403)', async () => {
      const readRes = await fetch(`${BASE_URL}/api/admin/bot/analytics`, {
        headers: { Cookie: editorCookie },
      });
      assert.strictEqual(readRes.status, 200);

      const writeRes = await fetch(`${BASE_URL}/api/admin/bot/limits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: editorCookie },
        body: JSON.stringify({ anonMessagesPerDay: 999 }),
      });
      assert.strictEqual(writeRes.status, 403);
    });

    // 4. API key masking & live provider connectivity check
    await test('Admin provider API key saving masks key permanently & Gemini live connectivity succeeds', async () => {
      const fakeOpenAiSecret = 'test-mock-openai-token-5544';
      const patchRes = await fetch(`${BASE_URL}/api/admin/bot/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ provider: 'openai', apiKey: fakeOpenAiSecret }),
      });
      assert.strictEqual(patchRes.status, 200);
      const patchText = await patchRes.text();
      assert.ok(!patchText.includes(fakeOpenAiSecret), 'PATCH response exposed plaintext API key!');
      assert.ok(patchText.includes('5544'), 'Masked hint missing last 4 characters');

      const getRes = await fetch(`${BASE_URL}/api/admin/bot/config`, {
        headers: { Cookie: superAdminCookie },
      });
      const getText = await getRes.text();
      assert.ok(!getText.includes(fakeOpenAiSecret), 'GET config exposed plaintext API key!');

      // Clear temporary OpenAI test key
      await fetch(`${BASE_URL}/api/admin/bot/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ provider: 'openai', clearApiKey: true }),
      });

      // Live connectivity check against real Gemini API
      const testRes = await fetch(`${BASE_URL}/api/admin/bot/models/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ provider: 'gemini' }),
      });
      assert.strictEqual(testRes.status, 200);
      const testJson = await testRes.json();
      assert.strictEqual(testJson.success, true, `Gemini check failed: ${testJson.error}`);
      assert.ok(typeof testJson.latencyMs === 'number' && testJson.latencyMs > 0);
    });

    // 5. Model enable/disable & custom model enforcement on public /api/bot/*
    await test('Disabling a model removes it from /api/bot/models and returns 403 on /api/bot/chat', async () => {
      const disableRes = await fetch(`${BASE_URL}/api/admin/bot/models`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ id: 'gemini-4-argon', enabled: false }),
      });
      assert.strictEqual(disableRes.status, 200);

      const publicModelsRes = await fetch(`${BASE_URL}/api/bot/models`);
      assert.strictEqual(publicModelsRes.status, 200);
      const publicModelsData = await publicModelsRes.json();
      assert.ok(
        !publicModelsData.models.some((m: any) => m.id === 'gemini-4-argon'),
        'Disabled model leaked into public /api/bot/models!'
      );

      const blockedChatRes = await fetch(`${BASE_URL}/api/bot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'gemini-4-argon',
          messages: [{ id: 'm1', role: 'user', content: 'Hello' }],
        }),
      });
      assert.strictEqual(blockedChatRes.status, 403);

      // Re-enable gemini-4-argon
      await fetch(`${BASE_URL}/api/admin/bot/models`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ id: 'gemini-4-argon', enabled: true }),
      });

      // Custom model create + delete
      const addCustomRes = await fetch(`${BASE_URL}/api/admin/bot/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({
          id: 'gemini-custom-http',
          name: 'Gemini Custom HTTP',
          provider: 'gemini',
          modelIdentifier: 'gemini-3.5-flash',
          capabilities: ['streaming', 'tools'],
          contextWindow: 128000,
          maxOutputTokens: 4096,
        }),
      });
      assert.strictEqual(addCustomRes.status, 201);

      const delCustomRes = await fetch(
        `${BASE_URL}/api/admin/bot/models?id=gemini-custom-http`,
        {
          method: 'DELETE',
          headers: { Cookie: superAdminCookie },
        }
      );
      assert.strictEqual(delCustomRes.status, 200);
    });

    // 6. Server-side limits & real analytics tracking over HTTP
    await test('Server-side limits block oversized prompts (413), live chat records usage & suspension blocks user (403)', async () => {
      // Set maxMessageChars = 250
      const limRes = await fetch(`${BASE_URL}/api/admin/bot/limits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ maxMessageChars: 250 }),
      });
      assert.strictEqual(limRes.status, 200);

      const oversizeChat = await fetch(`${BASE_URL}/api/bot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: botCookie },
        body: JSON.stringify({
          modelId: 'gemini-3.5-flash',
          messages: [{ id: 'm_big', role: 'user', content: 'a'.repeat(300) }],
        }),
      });
      assert.strictEqual(oversizeChat.status, 413);

      // Restore maxMessageChars = 16000
      await fetch(`${BASE_URL}/api/admin/bot/limits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ maxMessageChars: 16000 }),
      });

      // Execute one real short chat message with authenticated BotUser
      const liveChatRes = await fetch(`${BASE_URL}/api/bot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: botCookie },
        body: JSON.stringify({
          modelId: 'gemini-3.5-flash',
          enableTools: false,
          messages: [{ id: 'm_ok', role: 'user', content: 'Reply with exact word: PING_OK' }],
        }),
      });
      assert.strictEqual(liveChatRes.status, 200);
      const sseBody = await liveChatRes.text();
      assert.ok(sseBody.includes('"type":"done"') || sseBody.includes('PING_OK'), 'Live SSE did not finish');

      // Verify real analytics updated
      const analyticsRes = await fetch(`${BASE_URL}/api/admin/bot/analytics?days=7`, {
        headers: { Cookie: superAdminCookie },
      });
      assert.strictEqual(analyticsRes.status, 200);
      const { analytics } = await analyticsRes.json();
      assert.ok(analytics.messagesToday >= 1, 'Expected real recorded message count >= 1');
      assert.ok(analytics.rateLimitEventsInWindow >= 1, 'Expected recorded 413 limit event >= 1');
      assert.ok(analytics.dailyActiveUsersToday >= 1);

      // Suspend BotUser -> immediate 403 block on /api/bot/chat & privacy check on /api/admin/bot/users
      const suspendRes = await fetch(`${BASE_URL}/api/admin/bot/users/${botUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ status: 'SUSPENDED', suspendedReason: 'HTTP suspension test' }),
      });
      assert.strictEqual(suspendRes.status, 200);

      const suspendedChat = await fetch(`${BASE_URL}/api/bot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: botCookie },
        body: JSON.stringify({
          modelId: 'gemini-3.5-flash',
          messages: [{ id: 'm_susp', role: 'user', content: 'Hello?' }],
        }),
      });
      assert.strictEqual(suspendedChat.status, 403);

      // Verify /admin/quantumbot renders 200 SSR HTML with admin session cookie
      const adminPageRes = await fetch(`${BASE_URL}/admin/quantumbot`, {
        headers: { Cookie: superAdminCookie },
      });
      assert.strictEqual(adminPageRes.status, 200);
      const html = await adminPageRes.text();
      assert.ok(html.includes('QuantumBot Administration'), 'Admin page UI missing heading');

      // Restore user active so privacy cleanup can delete their account cleanly
      await fetch(`${BASE_URL}/api/admin/bot/users/${botUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
        body: JSON.stringify({ status: 'ACTIVE', suspendedReason: null }),
      });
    });

    console.log(`\nALL PHASE 8 LIVE HTTP TESTS PASSED: ${passed}/${passed}`);
  } finally {
    // Cleanup test BotUser account if still present
    if (botCookie) {
      await fetch(`${BASE_URL}/api/bot/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Cookie: botCookie },
        body: JSON.stringify({ password: botPassword }),
      }).catch(() => {});
    }

    // Cleanup temporary test admin state and restore any previous state
    await fs.rm(adminStorageDir, { recursive: true, force: true }).catch(() => {});
    if (hadExistingAdminDir) {
      await fs.rename(backupDir, adminStorageDir).catch(() => {});
    }
  }
}

runHttpTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
