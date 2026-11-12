import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Point DATABASE_URL at a guaranteed unreachable PostgreSQL endpoint BEFORE importing stores
process.env.DATABASE_URL = 'postgresql://invalid:invalid@127.0.0.1:59999/nonexistent?connect_timeout=1';

async function run() {
  const { resolveWritableStorageDirSync } = await import('../lib/bot/storage-dir');
  const { ensureAdminConfigLoaded, updateProviderConfig } = await import('../lib/bot/admin-config');
  const {
    assertConversationOwnership,
    upsertConversationForOwner,
    listConversationsForOwner,
    getUserPreferencesForOwner,
    updateUserPreferencesForOwner,
    deleteConversationForOwner,
    ConversationForbiddenError,
  } = await import('../lib/bot/conversation-store');
  const { checkChatUsageLimits, recordBotUsageEvent } = await import('../lib/bot/usage-tracker');
  const { BUILT_IN_MODELS } = await import('../lib/bot/default-models');
  const { findBotUserById, registerBotUser, loginBotUser, BotAuthError } = await import('../lib/bot/auth');

  let passed = 0;
  async function test(name: string, fn: () => Promise<void> | void) {
    await fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  }

  console.log('\n=== QuantumBot Vercel / Unreachable-DB Resilience Suite ===\n');

  await test('resolveWritableStorageDirSync resolves writable dir', () => {
    const dir = resolveWritableStorageDirSync('test_probe');
    assert.ok(fs.existsSync(dir));
    const p = path.join(dir, 'ok.txt');
    fs.writeFileSync(p, 'ok', 'utf8');
    fs.unlinkSync(p);
  });

  await test('ensureAdminConfigLoaded falls back gracefully when DB is unreachable', async () => {
    const snap = await ensureAdminConfigLoaded();
    assert.ok(snap.defaultModelId);
    assert.ok(snap.limits.anonMessagesPerDay > 0);
  });

  const ownerA = `anon:resilience-a-${Date.now()}`;
  const ownerB = `anon:resilience-b-${Date.now()}`;
  const convId = `conv_resil_${Date.now()}`;

  await test('getUserPreferencesForOwner returns defaults without 500 when DB is unreachable', async () => {
    const prefs = await getUserPreferencesForOwner(ownerA);
    assert.strictEqual(prefs.responseStyle, 'balanced');
    assert.strictEqual(prefs.language, 'English');
  });

  await test('updateUserPreferencesForOwner falls back to writable storage cleanly', async () => {
    const updated = await updateUserPreferencesForOwner(ownerA, {
      displayName: 'Resilient Visitor',
      responseStyle: 'technical',
    });
    assert.strictEqual(updated.displayName, 'Resilient Visitor');
    const reloaded = await getUserPreferencesForOwner(ownerA);
    assert.strictEqual(reloaded.responseStyle, 'technical');
  });

  await test('upsertConversationForOwner & listConversationsForOwner survive unreachable DB', async () => {
    const saved = await upsertConversationForOwner(
      {
        id: convId,
        modelId: 'gemini-3.5-flash',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Explain Quantum AI core services',
          },
        ],
      },
      ownerA
    );
    assert.strictEqual(saved.id, convId);
    const list = await listConversationsForOwner(ownerA);
    assert.ok(list.some((c) => c.id === convId));
  });

  await test('assertConversationOwnership still blocks cross-owner access (403) in fallback mode', async () => {
    let forbidden = false;
    try {
      await assertConversationOwnership(convId, ownerB);
    } catch (err) {
      if (err instanceof ConversationForbiddenError) {
        forbidden = true;
      }
    }
    assert.ok(forbidden, 'Expected ConversationForbiddenError for cross-owner access');
    await deleteConversationForOwner(convId, ownerA);
  });

  await test('checkChatUsageLimits & recordBotUsageEvent work cleanly under unreachable DB', async () => {
    const ev = await recordBotUsageEvent({
      eventType: 'chat_success',
      ownerId: ownerA,
      authType: 'anonymous',
      conversationId: convId,
      modelId: 'gemini-3.5-flash',
      provider: 'gemini',
      statusCode: 200,
    });
    assert.ok(ev.id);

    const check = await checkChatUsageLimits({
      actor: {
        isAuthenticated: false,
        authType: 'anonymous',
        ownerId: ownerA,
        user: null,
        preferences: await getUserPreferencesForOwner(ownerA),
      },
      messages: [{ id: 'm1', role: 'user', content: 'Hello' }],
      model: BUILT_IN_MODELS[0],
      conversationId: convId,
    });
    assert.strictEqual(check.allowed, true);
  });

  await test('findBotUserById returns null safely; auth/admin writes return structured 503 BotAuthError/AdminConfigError', async () => {
    const missing = await findBotUserById('qbu_missing');
    assert.strictEqual(missing, null);

    let authStatus = 0;
    try {
      await registerBotUser({
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!',
      });
    } catch (err) {
      if (err instanceof BotAuthError) authStatus = err.statusCode;
    }
    assert.strictEqual(authStatus, 503);

    let loginStatus = 0;
    try {
      await loginBotUser({ email: `test_${Date.now()}@example.com`, password: 'Password123!' });
    } catch (err) {
      if (err instanceof BotAuthError) loginStatus = err.statusCode;
    }
    assert.strictEqual(loginStatus, 503);

    let cfgErrStatus = 0;
    try {
      await updateProviderConfig('openai', { enabled: true });
    } catch (err: any) {
      cfgErrStatus = err?.statusCode || 0;
    }
    assert.strictEqual(cfgErrStatus, 503);
  });

  console.log(`\nPASSED: ${passed}/8 resilience tests!\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Resilience test failed:', err);
  process.exit(1);
});
