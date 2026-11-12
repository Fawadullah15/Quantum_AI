import assert from 'assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { authorizeAdminSession, AdminAuthError } from '../lib/bot/admin-guard';
import {
  clearAdminConfigCache,
  deleteCustomAdminModel,
  ensureAdminConfigLoaded,
  getEffectiveModelsFromSnapshot,
  listSafeProviderConfigs,
  resolveProviderRuntimeConfig,
  setDefaultAdminModel,
  setModelEnabledStatus,
  updateProviderConfig,
  updateUsageLimitsConfig,
  upsertAdminModelConfig,
} from '../lib/bot/admin-config';
import {
  getAvailableModels,
  isModelExplicitlyDisabled,
  resolveActiveModel,
} from '../lib/bot/models';
import {
  BotAuthError,
  loginBotUser,
  registerBotUser,
  updateBotUserGovernance,
} from '../lib/bot/auth';
import { upsertConversationForOwner } from '../lib/bot/conversation-store';
import { validateFileUploadPolicy } from '../lib/bot/file-security';
import {
  checkChatUsageLimits,
  estimateModelCostUsd,
  getBotAdminAnalytics,
  listAdminUsersWithUsage,
  recordBotUsageEvent,
} from '../lib/bot/usage-tracker';
import type { AuthActor } from '../lib/bot/types';

async function runTests() {
  console.log('=== QUANTUMBOT PHASE 8 ADMIN, USAGE & GOVERNANCE TEST SUITE ===\n');

  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'qb-phase8-test-'));
  const cfgOpts = { storageDir: tmpRoot, skipDatabase: true };
  const authOpts = { storageDir: path.join(tmpRoot, 'users'), skipDatabase: true };
  const convOpts = { storageDir: path.join(tmpRoot, 'conversations'), skipDatabase: true };

  let passed = 0;
  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      passed++;
      console.log(`✓ PASS: ${name}`);
    } catch (err: any) {
      console.error(`✕ FAIL: ${name}`);
      console.error(err);
      process.exitCode = 1;
      throw err;
    }
  }

  try {
    // 1. RBAC Permissions
    await test('RBAC: blocks anonymous callers (401) and public USER role (403)', () => {
      assert.throws(
        () => authorizeAdminSession(null),
        (err: any) => err instanceof AdminAuthError && err.statusCode === 401
      );
      assert.throws(
        () => authorizeAdminSession({ user: { id: 'qbu_1', role: 'USER', email: 'u@test.com' } }),
        (err: any) => err instanceof AdminAuthError && err.statusCode === 403
      );
    });

    await test('RBAC: allows EDITOR read-only, blocks EDITOR write (403), allows ADMIN/SUPER_ADMIN write', () => {
      const editorSession = { user: { id: 'adm_ed', role: 'EDITOR', email: 'ed@q.ai' } };
      const adminSession = { user: { id: 'adm_sa', role: 'SUPER_ADMIN', email: 'sa@q.ai' } };

      const readActor = authorizeAdminSession(editorSession, { write: false });
      assert.strictEqual(readActor.role, 'EDITOR');

      assert.throws(
        () => authorizeAdminSession(editorSession, { write: true }),
        (err: any) => err instanceof AdminAuthError && err.statusCode === 403
      );

      const writeActor = authorizeAdminSession(adminSession, { write: true });
      assert.strictEqual(writeActor.role, 'SUPER_ADMIN');
    });

    // 2. API Key Encryption & Never Readable After Saving
    await test('Provider Keys: encrypted at rest and never exposed in readable form after saving', async () => {
      const secretKey = 'sk-test-super-secret-value-9876';
      const saved = await updateProviderConfig(
        'openai',
        {
          enabled: true,
          apiKey: secretKey,
          baseUrl: 'https://api.openai.com/v1/',
          monthlyBudgetUsd: 50,
          alertThresholdPct: 80,
        },
        cfgOpts
      );

      assert.strictEqual(saved.hasAdminKey, true);
      assert.strictEqual(saved.keySource, 'admin');
      assert.ok(saved.maskedKeyHint?.includes('9876'));
      assert.ok(!JSON.stringify(saved).includes(secretKey), 'Safe response leaked API key!');

      const allSafe = await listSafeProviderConfigs(cfgOpts);
      assert.ok(!JSON.stringify(allSafe).includes(secretKey), 'List response leaked API key!');

      const rawDisk = await fs.readFile(path.join(tmpRoot, 'admin_config.json'), 'utf8');
      assert.ok(!rawDisk.includes(secretKey), 'Disk file stored plaintext API key!');

      const runtimeEnabled = resolveProviderRuntimeConfig('openai', cfgOpts);
      assert.strictEqual(runtimeEnabled.enabled, true);
      assert.strictEqual(runtimeEnabled.apiKey, secretKey);

      // Disabling provider stops runtime key availability
      await updateProviderConfig('openai', { enabled: false }, cfgOpts);
      const runtimeDisabled = resolveProviderRuntimeConfig('openai', cfgOpts);
      assert.strictEqual(runtimeDisabled.enabled, false);
      assert.strictEqual(runtimeDisabled.apiKey, null);

      // Re-enable then clear key
      await updateProviderConfig('openai', { enabled: true, clearApiKey: true }, cfgOpts);
      const safeAfterClear = (await listSafeProviderConfigs(cfgOpts)).find(
        (p) => p.provider === 'openai'
      )!;
      assert.strictEqual(safeAfterClear.hasAdminKey, false);
    });

    // 3. Model Management, Custom Models, Enable/Disable, Set Default & Capabilities
    await test('Model Management: add custom model, set default, prevent disabling default, disable alternative', async () => {
      await updateProviderConfig('gemini', { apiKey: 'AIza-dummy-test-key-123456' }, cfgOpts);
      await updateProviderConfig('openai', { apiKey: 'sk-dummy-openai-test-654321' }, cfgOpts);

      const customModel = await upsertAdminModelConfig(
        {
          id: 'gpt-custom-pro',
          name: 'GPT Custom Pro',
          provider: 'openai',
          modelIdentifier: 'gpt-4.1',
          description: 'Custom enterprise reasoning config',
          capabilities: ['vision', 'tools', 'streaming', 'json'],
          contextWindow: 256000,
          maxOutputTokens: 16384,
          pricing: { inputPerMillion: 2.0, outputPerMillion: 8.0 },
          enabled: true,
          isDefault: false,
        },
        cfgOpts
      );
      assert.strictEqual(customModel.isCustom, true);
      assert.ok(customModel.capabilities.includes('json'));

      const promoted = await setDefaultAdminModel('gpt-custom-pro', cfgOpts);
      assert.strictEqual(promoted.isDefault, true);

      // Cannot disable active default
      await assert.rejects(
        () => setModelEnabledStatus('gpt-custom-pro', false, cfgOpts),
        (err: any) => err?.statusCode === 400
      );

      // Switch default back to Gemini 3.5 Flash, then disable gpt-custom-pro
      await setDefaultAdminModel('gemini-3.5-flash', cfgOpts);
      await setModelEnabledStatus('gpt-custom-pro', false, cfgOpts);

      const disabledCheck = isModelExplicitlyDisabled('gpt-custom-pro', cfgOpts);
      assert.strictEqual(disabledCheck.disabled, true);

      const avail = getAvailableModels(cfgOpts);
      assert.ok(!avail.some((m) => m.id === 'gpt-custom-pro'));
      const resolved = resolveActiveModel(undefined, cfgOpts);
      assert.strictEqual(resolved.model.id, 'gemini-3.5-flash');

      // Built-in model cannot be deleted, custom model can
      await assert.rejects(
        () => deleteCustomAdminModel('gemini-3.5-flash', cfgOpts),
        (err: any) => err?.statusCode === 400
      );
      await deleteCustomAdminModel('gpt-custom-pro', cfgOpts);
      const afterDeleteSnap = await ensureAdminConfigLoaded(cfgOpts);
      assert.ok(!getEffectiveModelsFromSnapshot(afterDeleteSnap).some((m) => m.id === 'gpt-custom-pro'));
    });

    // 4. Server-Side Usage Limits, File Caps & User Governance
    await test('Usage Limits: enforces request size, attachments, and dynamic file byte limits', async () => {
      const limits = await updateUsageLimitsConfig(
        {
          anonMessagesPerHour: 2,
          anonMessagesPerDay: 3,
          authMessagesPerHour: 5,
          authMessagesPerDay: 10,
          perUserRequestsPerMinute: 3,
          maxMessageChars: 250,
          maxMessagesPerRequest: 4,
          maxAttachmentsPerMessage: 2,
          maxDocImageBytes: 512 * 1024,
          maxTextCodeBytes: 128 * 1024,
          dailySpendingAlertUsd: 0.05,
          monthlySpendingAlertUsd: 1.0,
          enforceSpendingHardStop: true,
        },
        cfgOpts
      );

      const model = getAvailableModels(cfgOpts)[0];
      const anonActor: AuthActor = {
        isAuthenticated: false,
        authType: 'anonymous',
        ownerId: 'anon:test-visitor-1',
        user: null,
        preferences: { responseStyle: 'balanced', language: 'English', defaultWebSearch: false, enterToSend: true },
      };

      // Exceeds maxMessageChars (250)
      const longCheck = await checkChatUsageLimits({
        actor: anonActor,
        messages: [{ id: 'm1', role: 'user', content: 'x'.repeat(260) }],
        model,
        limits,
        options: cfgOpts,
      });
      assert.strictEqual(longCheck.allowed, false);
      assert.strictEqual(longCheck.statusCode, 413);

      // Exceeds maxMessagesPerRequest (4)
      const countCheck = await checkChatUsageLimits({
        actor: anonActor,
        messages: Array.from({ length: 5 }, (_, i) => ({
          id: `m_${i}`,
          role: 'user' as const,
          content: 'hi',
        })),
        model,
        limits,
        options: cfgOpts,
      });
      assert.strictEqual(countCheck.allowed, false);
      assert.strictEqual(countCheck.statusCode, 413);

      // Exceeds maxAttachmentsPerMessage (2)
      const attCheck = await checkChatUsageLimits({
        actor: anonActor,
        messages: [
          {
            id: 'm_att',
            role: 'user',
            content: 'check files',
            attachments: [1, 2, 3].map((n) => ({
              id: `a_${n}`,
              name: `f${n}.txt`,
              mimeType: 'text/plain',
              size: 100,
            })),
          },
        ],
        model,
        limits,
        options: cfgOpts,
      });
      assert.strictEqual(attCheck.allowed, false);
      assert.strictEqual(attCheck.statusCode, 400);

      // Dynamic file upload size limit check
      assert.throws(
        () =>
          validateFileUploadPolicy('large_script.ts', 'text/plain', 200 * 1024, {
            maxDocImageBytes: limits.maxDocImageBytes,
            maxTextCodeBytes: limits.maxTextCodeBytes,
          }),
        /size limit/i
      );
    });

    await test('Quotas & User Governance: enforces anon hourly cap, user suspension & custom daily override', async () => {
      const model = getAvailableModels(cfgOpts)[0];
      const anonActor: AuthActor = {
        isAuthenticated: false,
        authType: 'anonymous',
        ownerId: 'anon:quota-guest',
        user: null,
        preferences: { responseStyle: 'balanced', language: 'English', defaultWebSearch: false, enterToSend: true },
      };

      // Record 2 successful chats for anon-quota-guest (hourly limit is 2)
      for (let i = 0; i < 2; i++) {
        await recordBotUsageEvent(
          {
            eventType: 'chat_success',
            ownerId: anonActor.ownerId,
            authType: 'anonymous',
            modelId: model.id,
            provider: model.provider,
            promptTokens: 500,
            completionTokens: 200,
            totalTokens: 700,
            estimatedCostUsd: estimateModelCostUsd(model, {
              promptTokens: 500,
              completionTokens: 200,
              totalTokens: 700,
            }),
            latencyMs: 320,
            statusCode: 200,
          },
          cfgOpts
        );
      }

      const blockedAnon = await checkChatUsageLimits({
        actor: anonActor,
        messages: [{ id: 'm3', role: 'user', content: 'hello again' }],
        model,
        options: cfgOpts,
      });
      assert.strictEqual(blockedAnon.allowed, false);
      assert.strictEqual(blockedAnon.statusCode, 429);

      // Register real QuantumBot users Alice & Bob
      const alice = await registerBotUser(
        { name: 'Alice Engineer', email: 'alice@quantumbot.test', password: 'Password123!' },
        authOpts
      );
      const bob = await registerBotUser(
        { name: 'Bob Analyst', email: 'bob@quantumbot.test', password: 'Password123!' },
        authOpts
      );

      // Suspend Alice and enforce on login + chat check
      await updateBotUserGovernance(
        alice.user.id,
        { status: 'SUSPENDED', suspendedReason: 'Abuse policy hold' },
        authOpts
      );

      await assert.rejects(
        () =>
          loginBotUser(
            { email: 'alice@quantumbot.test', password: 'Password123!' },
            authOpts
          ),
        (err: any) => err instanceof BotAuthError && err.statusCode === 403
      );

      const suspendedActor: AuthActor = {
        isAuthenticated: true,
        authType: 'bot_account',
        ownerId: alice.ownerId,
        user: { ...alice.user, status: 'SUSPENDED', suspendedReason: 'Abuse policy hold' },
        preferences: alice.preferences,
      };
      const aliceCheck = await checkChatUsageLimits({
        actor: suspendedActor,
        messages: [{ id: 'ma', role: 'user', content: 'can I chat?' }],
        model,
        options: cfgOpts,
      });
      assert.strictEqual(aliceCheck.allowed, false);
      assert.strictEqual(aliceCheck.statusCode, 403);

      // Set Bob custom daily limit = 1 and LIMITED
      const govBob = await updateBotUserGovernance(
        bob.user.id,
        { status: 'LIMITED', dailyMessageLimitOverride: 1 },
        authOpts
      );
      assert.strictEqual(govBob.dailyMessageLimitOverride, 1);

      const bobActor: AuthActor = {
        isAuthenticated: true,
        authType: 'bot_account',
        ownerId: bob.ownerId,
        user: {
          ...bob.user,
          status: 'LIMITED',
          dailyMessageLimitOverride: 1,
        },
        preferences: bob.preferences,
      };

      await recordBotUsageEvent(
        {
          eventType: 'chat_success',
          ownerId: bob.ownerId,
          botUserId: bob.user.id,
          authType: 'bot_account',
          modelId: model.id,
          provider: model.provider,
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
          estimatedCostUsd: 0.002,
          latencyMs: 480,
          statusCode: 200,
        },
        cfgOpts
      );

      const bobSecondCheck = await checkChatUsageLimits({
        actor: bobActor,
        messages: [{ id: 'mb2', role: 'user', content: 'second msg today' }],
        model,
        options: cfgOpts,
      });
      assert.strictEqual(bobSecondCheck.allowed, false);
      assert.strictEqual(bobSecondCheck.statusCode, 429);
    });

    // 5. Spending Alerts, Hard Stop, Real Analytics & User Privacy Isolation
    await test('Analytics & Privacy: computes exact metrics, triggers spending hard stop & never exposes private transcripts', async () => {
      const model = getAvailableModels(cfgOpts)[0];
      const secretPhrase = 'TOP_SECRET_PROPRIETARY_FORMULA_XYZ';

      const bobReg = await loginBotUser(
        { email: 'bob@quantumbot.test', password: 'Password123!' },
        authOpts
      );

      // Persist a private conversation for Bob containing confidential prompt text
      await upsertConversationForOwner(
        {
          id: 'conv_bob_private_1',
          modelId: model.id,
          messages: [
            { id: 'u1', role: 'user', content: `Keep this secret: ${secretPhrase}` },
            { id: 'a1', role: 'assistant', content: 'Understood.' },
          ],
        },
        bobReg.ownerId,
        convOpts
      );

      // Record one chat error + one higher-cost event breaching dailySpendingAlertUsd (0.05)
      await recordBotUsageEvent(
        {
          eventType: 'chat_error',
          ownerId: bobReg.ownerId,
          botUserId: bobReg.user.id,
          authType: 'bot_account',
          modelId: model.id,
          provider: model.provider,
          statusCode: 500,
          errorMessage: 'Simulated upstream timeout',
        },
        cfgOpts
      );

      await recordBotUsageEvent(
        {
          eventType: 'chat_success',
          ownerId: 'anon:big-spender',
          authType: 'anonymous',
          modelId: model.id,
          provider: model.provider,
          promptTokens: 20000,
          completionTokens: 10000,
          totalTokens: 30000,
          estimatedCostUsd: 0.065,
          latencyMs: 600,
          statusCode: 200,
        },
        cfgOpts
      );

      // Verify spending hard stop blocks a fresh user now that daily cost > $0.05
      const freshActor: AuthActor = {
        isAuthenticated: false,
        authType: 'anonymous',
        ownerId: 'anon:brand-new-visitor',
        user: null,
        preferences: { responseStyle: 'balanced', language: 'English', defaultWebSearch: false, enterToSend: true },
      };
      const hardStopCheck = await checkChatUsageLimits({
        actor: freshActor,
        messages: [{ id: 'mf', role: 'user', content: 'hello' }],
        model,
        options: cfgOpts,
      });
      assert.strictEqual(hardStopCheck.allowed, false);
      assert.strictEqual(hardStopCheck.statusCode, 429);
      assert.ok(hardStopCheck.reason?.toLowerCase().includes('spending'));

      // Check Real Analytics
      const analytics = await getBotAdminAnalytics(14, cfgOpts);
      assert.strictEqual(analytics.totalConversations, 1);
      assert.strictEqual(analytics.registeredUsersCount, 2);
      assert.strictEqual(analytics.suspendedUsersCount, 1);
      assert.strictEqual(analytics.messagesToday, 4); // 2 anon + 1 bob + 1 spender
      assert.strictEqual(analytics.failedRequestsInWindow, 1);
      assert.ok(analytics.rateLimitEventsInWindow >= 4); // blocks recorded
      assert.strictEqual(analytics.dailyActiveUsersToday, 3); // quota-guest, bob, big-spender
      assert.ok(analytics.estimatedCostTodayUsd > 0.065);
      assert.ok(analytics.spendingAlerts.some((a) => a.scope === 'daily' && a.severity === 'critical'));
      assert.strictEqual(analytics.mostUsedModels[0].requests, 4);
      assert.ok(analytics.averageResponseTimeMs !== null && analytics.averageResponseTimeMs > 0);

      // Check User Management Summary & Privacy Isolation
      const adminUsers = await listAdminUsersWithUsage(undefined, cfgOpts);
      assert.strictEqual(adminUsers.length, 2);
      const bobSummary = adminUsers.find((u) => u.email === 'bob@quantumbot.test')!;
      assert.strictEqual(bobSummary.conversationCount, 1);
      assert.strictEqual(bobSummary.messagesTotal, 1);

      const serializedAdminPayload = JSON.stringify({ analytics, adminUsers });
      assert.ok(
        !serializedAdminPayload.includes(secretPhrase),
        'PRIVACY BREACH: Admin analytics or user summary leaked private conversation text!'
      );
      assert.ok(
        !serializedAdminPayload.includes('passwordHash'),
        'SECURITY BREACH: Admin user payload exposed passwordHash!'
      );
    });

    console.log(`\nALL PHASE 8 TESTS PASSED: ${passed}/${passed}`);
  } finally {
    clearAdminConfigCache();
    await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
