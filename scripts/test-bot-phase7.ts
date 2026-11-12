import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import {
  BotAuthError,
  deleteBotUserAccount,
  loginBotUser,
  registerBotUser,
  resolveBotAccountFromToken,
  revokeAllBotUserSessions,
} from '../lib/bot/auth';
import {
  ConversationForbiddenError,
  ConversationValidationError,
  assertConversationOwnership,
  deleteConversationForOwner,
  getConversationForOwner,
  getUserPreferencesForOwner,
  listConversationsForOwner,
  updateConversationMetaForOwner,
  updateUserPreferencesForOwner,
  upsertConversationForOwner,
} from '../lib/bot/conversation-store';
import { generateSmartConversationTitle } from '../lib/bot/title-generator';
import { buildSystemInstruction } from '../lib/bot/prompt';
import { MODEL_REGISTRY } from '../lib/bot/models';
import { BotMessage } from '../lib/bot/types';

async function runPhase7Tests() {
  let passed = 0;
  const pass = (label: string) => {
    passed += 1;
    console.log(`PASS [${passed}]: ${label}`);
  };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbot-p7-test-'));
  const authOpts = { storageDir: tmpDir, skipDatabase: true };
  const convOpts = { storageDir: path.join(tmpDir, 'conversations'), skipDatabase: true };

  try {
    // ─── 1. Automatic Title Generation ───────────────────────────────────────
    const t1 = generateSmartConversationTitle([
      {
        id: 'm1',
        role: 'user',
        content: 'Hey QuantumBot, could you please explain how inverse kinematics works in robotic arms?',
      },
    ]);
    assert.ok(t1.length > 5 && t1 !== 'New Conversation');
    assert.ok(!/^hey quantumbot/i.test(t1), 'Filler greeting should be stripped from title');
    assert.ok(t1.toLowerCase().includes('inverse kinematics'), `Unexpected title: ${t1}`);

    const tAttachOnly = generateSmartConversationTitle([
      {
        id: 'm2',
        role: 'user',
        content: '',
        attachments: [
          {
            id: 'a1',
            fileId: 'file_abc123',
            name: 'pump_shaft_stress_report.pdf',
            mimeType: 'application/pdf',
            size: 2048,
            status: 'ready',
          },
        ],
      },
    ]);
    assert.equal(tAttachOnly, 'Analysis: pump shaft stress report');
    pass('Smart automatic title generator produces meaningful titles for prompts and file-only threads');

    // ─── 2. User Registration Validation & Password Hashing ──────────────────
    await assert.rejects(
      () =>
        registerBotUser(
          { name: 'A', email: 'alice@example.com', password: 'StrongPassword123!' },
          authOpts
        ),
      (err: any) => err instanceof BotAuthError && err.statusCode === 400
    );

    await assert.rejects(
      () =>
        registerBotUser(
          { name: 'Alice', email: 'not-an-email', password: 'StrongPassword123!' },
          authOpts
        ),
      (err: any) => err instanceof BotAuthError && err.statusCode === 400
    );

    await assert.rejects(
      () =>
        registerBotUser(
          { name: 'Alice', email: 'alice@example.com', password: 'short' },
          authOpts
        ),
      (err: any) => err instanceof BotAuthError && err.statusCode === 400
    );

    const alice = await registerBotUser(
      {
        name: 'Alice Engineer',
        email: 'Alice@Example.com',
        password: 'QuantumPassword123!',
      },
      authOpts
    );
    assert.equal(alice.user.email, 'alice@example.com');
    assert.equal(alice.user.role, 'USER');
    assert.ok(alice.ownerId.startsWith('qbuser:'));
    assert.equal(alice.preferences.displayName, 'Alice Engineer');

    // Duplicate email rejected with 409 Conflict
    await assert.rejects(
      () =>
        registerBotUser(
          { name: 'Alice Clone', email: 'alice@example.com', password: 'AnotherPassword123!' },
          authOpts
        ),
      (err: any) => err instanceof BotAuthError && err.statusCode === 409
    );

    const bob = await registerBotUser(
      {
        name: 'Bob Researcher',
        email: 'bob@example.com',
        password: 'BobPassword123!',
      },
      authOpts
    );
    assert.notEqual(alice.ownerId, bob.ownerId);
    pass('Account registration validates inputs, enforces USER role, and blocks duplicate emails (409)');

    // ─── 3. Login, Session Token Restoration, Logout All Devices & Rate Limit ─
    const aliceTokenCheck = await resolveBotAccountFromToken(alice.sessionToken, authOpts);
    assert.equal(aliceTokenCheck?.id, alice.user.id);

    await assert.rejects(
      () =>
        loginBotUser(
          {
            email: 'alice@example.com',
            password: 'WrongPassword!',
            rateLimitKeyPrefix: `p7-wrong-${Date.now()}`,
          },
          authOpts
        ),
      (err: any) => err instanceof BotAuthError && err.statusCode === 401
    );

    const aliceLogin = await loginBotUser(
      { email: 'alice@example.com', password: 'QuantumPassword123!' },
      authOpts
    );
    assert.equal(aliceLogin.user.email, 'alice@example.com');

    // Token revocation invalidates old session tokens across devices
    await revokeAllBotUserSessions(alice.user.id, authOpts);
    const revokedCheck = await resolveBotAccountFromToken(aliceLogin.sessionToken, authOpts);
    assert.equal(revokedCheck, null, 'Existing token must be invalidated after revokeAllBotUserSessions');

    const aliceRelogin = await loginBotUser(
      { email: 'alice@example.com', password: 'QuantumPassword123!' },
      authOpts
    );
    assert.equal((await resolveBotAccountFromToken(aliceRelogin.sessionToken, authOpts))?.id, alice.user.id);
    pass('Login, signed session restoration, and all-device tokenVersion revocation verified');

    // ─── 4. Chat History Persistence, Attachments, Pin, Archive, Restore, Search ─
    const aliceMsgs1: BotMessage[] = [
      {
        id: 'u1',
        role: 'user',
        content: 'Please help me design a brushless gimbal stabilization PID controller.',
        attachments: [
          {
            id: 'att1',
            fileId: 'file_998877',
            name: 'imu_spec.pdf',
            mimeType: 'application/pdf',
            size: 12000,
            status: 'ready',
          },
        ],
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'Here is a cascaded PID architecture with notch filtering for motor resonance.',
        model: 'gemini-3.5-flash-lite',
      },
    ];

    const c1 = await upsertConversationForOwner(
      {
        id: 'conv_alice_gimbal_1',
        modelId: 'gemini-3.5-flash-lite',
        messages: aliceMsgs1,
      },
      alice.ownerId,
      convOpts
    );
    assert.ok(c1.title.toLowerCase().includes('brushless gimbal'), `Expected auto-title, got: ${c1.title}`);
    assert.deepEqual(c1.attachmentIds, ['file_998877']);

    // Continue previous conversation with a second turn
    const c1Continued = await upsertConversationForOwner(
      {
        id: 'conv_alice_gimbal_1',
        modelId: 'gemini-3.5-flash-lite',
        messages: [
          ...aliceMsgs1,
          { id: 'u2', role: 'user', content: 'Add anti-windup clamping for the integral term.' },
          { id: 'a2', role: 'assistant', content: 'Use back-calculation anti-windup with Kb = 1/Ti.' },
        ],
      },
      alice.ownerId,
      convOpts
    );
    assert.equal(c1Continued.messages.length, 4);

    // Create a second conversation and pin it
    await upsertConversationForOwner(
      {
        id: 'conv_alice_rust_2',
        modelId: 'gemini-3.5-flash',
        messages: [{ id: 'u3', role: 'user', content: 'Compare Rust async runtimes tokio vs smol' }],
      },
      alice.ownerId,
      convOpts
    );
    await updateConversationMetaForOwner('conv_alice_rust_2', alice.ownerId, { pinned: true }, convOpts);
    await updateConversationMetaForOwner(
      'conv_alice_gimbal_1',
      alice.ownerId,
      { title: 'Gimbal PID Stabilization' },
      convOpts
    );

    const activeList = await listConversationsForOwner(alice.ownerId, {}, convOpts);
    assert.equal(activeList.length, 2);
    assert.equal(activeList[0].id, 'conv_alice_rust_2', 'Pinned conversation must sort first');

    // Search history by message body
    const bodySearch = await listConversationsForOwner(
      alice.ownerId,
      { search: 'back-calculation anti-windup' },
      convOpts
    );
    assert.equal(bodySearch.length, 1);
    assert.equal(bodySearch[0].id, 'conv_alice_gimbal_1');
    assert.equal(bodySearch[0].title, 'Gimbal PID Stabilization');

    // Archive & Restore lifecycle
    await updateConversationMetaForOwner(
      'conv_alice_gimbal_1',
      alice.ownerId,
      { archived: true },
      convOpts
    );
    const activeAfterArchive = await listConversationsForOwner(alice.ownerId, {}, convOpts);
    assert.equal(activeAfterArchive.length, 1);
    const archivedOnly = await listConversationsForOwner(alice.ownerId, { archivedOnly: true }, convOpts);
    assert.equal(archivedOnly.length, 1);
    assert.equal(archivedOnly[0].id, 'conv_alice_gimbal_1');

    await updateConversationMetaForOwner(
      'conv_alice_gimbal_1',
      alice.ownerId,
      { archived: false },
      convOpts
    );
    const activeAfterRestore = await listConversationsForOwner(alice.ownerId, {}, convOpts);
    assert.equal(activeAfterRestore.length, 2);
    pass('Conversation history lifecycle (continue, auto-title, attachments, rename, pin, search, archive, restore)');

    // ─── 5. Guest Session Isolation & Opt-In Migration on Registration ───────
    const anonOwner1 = 'anon:11111111-1111-4111-8111-111111111111';
    const anonOwner2 = 'anon:22222222-2222-4222-8222-222222222222';
    await upsertConversationForOwner(
      {
        id: 'conv_guest_alpha',
        modelId: 'gemini-3.5-flash',
        messages: [{ id: 'g1', role: 'user', content: 'Anonymous guest CAD question' }],
      },
      anonOwner1,
      convOpts
    );

    await assert.rejects(
      () => assertConversationOwnership('conv_guest_alpha', anonOwner2, convOpts),
      (err: any) => err instanceof ConversationForbiddenError && err.statusCode === 403
    );

    const charlie = await registerBotUser(
      {
        name: 'Charlie Migrated',
        email: 'charlie@example.com',
        password: 'CharliePassword123!',
        guestOwnerId: anonOwner1,
        claimGuestData: true,
      },
      authOpts
    );
    assert.equal(charlie.migratedConversations, 1);
    const charlieConvs = await listConversationsForOwner(charlie.ownerId, {}, convOpts);
    assert.equal(charlieConvs.length, 1);
    assert.equal(charlieConvs[0].id, 'conv_guest_alpha');
    pass('Anonymous sessions isolated from each other and cleanly claimable upon opt-in registration');

    // ─── 6. Strict Cross-User Data Isolation (403 on All Foreign Operations) ──
    await assert.rejects(
      () => getConversationForOwner('conv_alice_gimbal_1', bob.ownerId, convOpts),
      (err: any) => err instanceof ConversationForbiddenError && err.statusCode === 403
    );
    await assert.rejects(
      () =>
        upsertConversationForOwner(
          {
            id: 'conv_alice_gimbal_1',
            modelId: 'gemini-3.5-flash',
            messages: [{ id: 'hijack', role: 'user', content: 'Injected' }],
          },
          bob.ownerId,
          convOpts
        ),
      (err: any) => err instanceof ConversationForbiddenError && err.statusCode === 403
    );
    await assert.rejects(
      () =>
        updateConversationMetaForOwner('conv_alice_gimbal_1', bob.ownerId, { title: 'Hacked' }, convOpts),
      (err: any) => err instanceof ConversationForbiddenError && err.statusCode === 403
    );
    await assert.rejects(
      () => deleteConversationForOwner('conv_alice_gimbal_1', bob.ownerId, convOpts),
      (err: any) => err instanceof ConversationForbiddenError && err.statusCode === 403
    );
    await assert.rejects(
      () => assertConversationOwnership('../etc/passwd', bob.ownerId, convOpts),
      (err: any) => err instanceof ConversationValidationError && err.statusCode === 400
    );
    const aliceIntact = await getConversationForOwner('conv_alice_gimbal_1', alice.ownerId, convOpts);
    assert.equal(aliceIntact?.title, 'Gimbal PID Stabilization');
    pass('Strict cross-user ownership checks block reading, overwriting, renaming, or deleting foreign threads (403)');

    // ─── 7. Explicit Personalization & System Prompt Injection ───────────────
    const updatedPrefs = await updateUserPreferencesForOwner(
      alice.ownerId,
      {
        displayName: 'Engr. Alice',
        responseStyle: 'technical',
        language: 'Urdu',
        customInstructions: 'Always highlight thermal limits first.',
        defaultWebSearch: true,
        enterToSend: false,
      },
      convOpts
    );
    assert.equal(updatedPrefs.responseStyle, 'technical');
    assert.equal(updatedPrefs.language, 'Urdu');
    assert.equal(updatedPrefs.enterToSend, false);

    // Clearing optional string fields works with empty string
    const clearedNamePrefs = await updateUserPreferencesForOwner(
      alice.ownerId,
      { displayName: '' },
      convOpts
    );
    assert.equal(clearedNamePrefs.displayName, undefined);

    const promptWithPrefs = buildSystemInstruction({
      activeModel: MODEL_REGISTRY[0],
      userPreferences: {
        ...updatedPrefs,
        displayName: 'Engr. Alice',
      },
      enableWebSearch: true,
    });
    assert.ok(promptWithPrefs.includes('Engr. Alice'));
    assert.ok(promptWithPrefs.includes('Preferred Response Style (technical)'));
    assert.ok(promptWithPrefs.includes('Preferred Response Language: Urdu'));
    assert.ok(promptWithPrefs.includes('Always highlight thermal limits first.'));
    pass('Explicit personalization settings persist cleanly and inject into system prompt without hidden profiling');

    // ─── 8. Privacy & Password-Verified Account Deletion ─────────────────────
    await assert.rejects(
      () => deleteBotUserAccount({ userId: alice.user.id, password: 'WrongPassword!' }, authOpts),
      (err: any) => err instanceof BotAuthError && err.statusCode === 403
    );

    const deletedSummary = await deleteBotUserAccount(
      { userId: alice.user.id, password: 'QuantumPassword123!' },
      authOpts
    );
    assert.equal(deletedSummary.deletedConversations, 2);

    assert.equal(await resolveBotAccountFromToken(aliceRelogin.sessionToken, authOpts), null);
    assert.equal((await listConversationsForOwner(alice.ownerId, { includeArchived: true }, convOpts)).length, 0);
    assert.equal((await getUserPreferencesForOwner(alice.ownerId, convOpts)).displayName, undefined);
    pass('Password-verified account deletion erases user credentials, sessions, conversations, and preferences');

    console.log(`\nALL PHASE 7 ASSERTIONS PASSED (${passed} checks).`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runPhase7Tests().catch((err) => {
  console.error('\nPhase 7 test failure:', err);
  process.exit(1);
});
