import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3016';

class CookieJar {
  private cookies = new Map<string, string>();

  updateFromResponse(res: Response) {
    const getSetCookie = (res.headers as any).getSetCookie?.();
    const rawHeaders: string[] = Array.isArray(getSetCookie)
      ? getSetCookie
      : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie')!]
        : [];

    for (const header of rawHeaders) {
      const firstPart = header.split(';')[0] || '';
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx <= 0) continue;
      const name = firstPart.slice(0, eqIdx).trim();
      const val = firstPart.slice(eqIdx + 1).trim();
      const isExpired = /max-age=0\b/i.test(header);
      if (!val || isExpired) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, val);
      }
    }
  }

  header(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }
}

async function req(
  jar: CookieJar,
  pathname: string,
  init: RequestInit = {}
): Promise<{ status: number; data: any; rawText: string; res: Response }> {
  const headers = new Headers(init.headers);
  const cookieHeader = jar.header();
  if (cookieHeader) headers.set('Cookie', cookieHeader);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${pathname}`, {
    ...init,
    headers,
    redirect: 'manual',
  });
  jar.updateFromResponse(res);
  const rawText = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = null;
  }
  return { status: res.status, data, rawText, res };
}

async function runHttpTests() {
  let passed = 0;
  const pass = (label: string) => {
    passed += 1;
    console.log(`HTTP PASS [${passed}]: ${label}`);
  };

  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const guestJar = new CookieJar();
  const intruderJar = new CookieJar();
  const aliceJar = new CookieJar();
  const bobJar = new CookieJar();

  // 1. Initial anonymous session
  const sess0 = await req(guestJar, '/api/bot/auth/session');
  assert.equal(sess0.status, 200);
  assert.equal(sess0.data.authenticated, false);
  assert.equal(sess0.data.authType, 'anonymous');
  pass('Anonymous visitor session initialized without forced login');

  // 2. Guest creates conversation + saves personalization
  const guestConvId = `conv_guest_http_${suffix}`;
  const guestConvRes = await req(guestJar, '/api/bot/conversations', {
    method: 'POST',
    body: JSON.stringify({
      id: guestConvId,
      modelId: 'gemini-3.5-flash-lite',
      messages: [
        {
          id: 'gm1',
          role: 'user',
          content: 'Please explain Finite Element Analysis mesh convergence criteria',
        },
        {
          id: 'gm2',
          role: 'assistant',
          content: 'Mesh convergence tracks peak stress stabilization under h-refinement.',
        },
      ],
    }),
  });
  assert.ok(guestConvRes.status === 200 || guestConvRes.status === 201);
  assert.ok(guestJar.get('qb_owner'), 'Expected signed qb_owner cookie');
  assert.notEqual(guestConvRes.data.conversation.title, 'New Conversation');

  const guestPrefRes = await req(guestJar, '/api/bot/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ responseStyle: 'concise', language: 'English' }),
  });
  assert.equal(guestPrefRes.status, 200);
  assert.equal(guestPrefRes.data.preferences.responseStyle, 'concise');
  pass('Guest visitor saves conversation with smart auto-title & preferences');

  // 3. Another anonymous visitor cannot read Guest 1's conversation
  await req(intruderJar, '/api/bot/conversations'); // mint separate anon cookie
  const intruderRead = await req(intruderJar, `/api/bot/conversations/${guestConvId}`);
  assert.equal(intruderRead.status, 403);
  pass('Separate anonymous visitor blocked (403) from reading Guest 1 conversation');

  // 4. Register Alice claiming her guest data (reuse guestJar -> claims qb_owner)
  const aliceEmail = `alice_${suffix}@example.com`;
  const alicePassword = 'AliceStrongPassword!2026';
  const aliceReg = await req(guestJar, '/api/bot/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Alice Quantum',
      email: aliceEmail,
      password: alicePassword,
      claimGuestData: true,
    }),
  });
  assert.equal(aliceReg.status, 201);
  assert.equal(aliceReg.data.user.email, aliceEmail);
  assert.equal(aliceReg.data.migratedConversations, 1);
  assert.ok(guestJar.get('qb_session'), 'Expected HttpOnly qb_session cookie');

  // Copy Alice's qb_session cookie into clean aliceJar for clarity
  const aliceSessCheck = await req(guestJar, '/api/bot/auth/session');
  assert.equal(aliceSessCheck.data.authenticated, true);
  assert.equal(aliceSessCheck.data.authType, 'bot_account');
  pass('User registration sets qb_session & optionally imports guest history');

  // 5. CRITICAL SECURITY BOUNDARY: QuantumBot account MUST NOT authenticate /admin or /api/blog!
  const adminAccountRes = await req(guestJar, '/api/admin/account', {
    method: 'POST',
    body: JSON.stringify({ action: 'update_profile', name: 'Hijack' }),
  });
  assert.equal(
    adminAccountRes.status,
    401,
    `QuantumBot account MUST be rejected by /api/admin/account (got ${adminAccountRes.status})`
  );
  const adminBlogPostRes = await req(guestJar, '/api/blog', {
    method: 'POST',
    body: JSON.stringify({ title: 'Unauthorized', content: 'Test' }),
  });
  assert.equal(
    adminBlogPostRes.status,
    401,
    `QuantumBot account MUST be rejected by POST /api/blog (got ${adminBlogPostRes.status})`
  );
  pass('Security Boundary: QuantumBot public user cookie rejected (401) on /api/admin/account and POST /api/blog');

  // 6. Register Bob & verify full cross-user isolation (403 across all routes)
  const bobEmail = `bob_${suffix}@example.com`;
  const bobReg = await req(bobJar, '/api/bot/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bob Isolated',
      email: bobEmail,
      password: 'BobStrongPassword!2026',
    }),
  });
  assert.equal(bobReg.status, 201);

  assert.equal((await req(bobJar, `/api/bot/conversations/${guestConvId}`)).status, 403);
  assert.equal(
    (
      await req(bobJar, `/api/bot/conversations/${guestConvId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Hijack' }),
      })
    ).status,
    403
  );
  assert.equal((await req(bobJar, `/api/bot/conversations/${guestConvId}`, { method: 'DELETE' })).status, 403);
  assert.equal(
    (
      await req(bobJar, '/api/bot/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: guestConvId,
          modelId: 'gemini-3.5-flash-lite',
          messages: [{ id: 'x1', role: 'user', content: 'Hijack attempt' }],
        }),
      })
    ).status,
    403
  );
  pass('Cross-user HTTP isolation enforces 403 on GET, PATCH, DELETE, and POST /api/bot/chat');

  // 7. Full HTTP Conversation Lifecycle (Create, Rename, Pin, Archive, Search, Restore, Export)
  const aliceConv2 = `conv_alice_http_${suffix}`;
  const create2 = await req(guestJar, '/api/bot/conversations', {
    method: 'POST',
    body: JSON.stringify({
      id: aliceConv2,
      modelId: 'gemini-3.5-flash',
      messages: [
        { id: 'm1', role: 'user', content: 'Write a FastAPI Pydantic validator for telemetry frames' },
      ],
    }),
  });
  assert.ok(create2.status === 200 || create2.status === 201);

  const renamePin = await req(guestJar, `/api/bot/conversations/${aliceConv2}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: 'Telemetry Frame Validator', pinned: true }),
  });
  assert.equal(renamePin.status, 200);
  assert.equal(renamePin.data.conversation.title, 'Telemetry Frame Validator');
  assert.equal(renamePin.data.conversation.pinned, true);

  const archiveRes = await req(guestJar, `/api/bot/conversations/${aliceConv2}`, {
    method: 'PATCH',
    body: JSON.stringify({ archived: true }),
  });
  assert.equal(archiveRes.status, 200);

  const activeOnly = await req(guestJar, '/api/bot/conversations');
  assert.equal(
    activeOnly.data.conversations.some((c: any) => c.id === aliceConv2),
    false
  );

  const archivedList = await req(guestJar, '/api/bot/conversations?archived=true');
  assert.equal(
    archivedList.data.conversations.some((c: any) => c.id === aliceConv2),
    true
  );

  await req(guestJar, `/api/bot/conversations/${aliceConv2}`, {
    method: 'PATCH',
    body: JSON.stringify({ archived: false }),
  });

  const searchRes = await req(guestJar, '/api/bot/conversations?q=Telemetry');
  assert.equal(searchRes.data.conversations.length, 1);
  assert.equal(searchRes.data.conversations[0].id, aliceConv2);

  const exportRes = await req(guestJar, '/api/bot/privacy/export');
  assert.equal(exportRes.status, 200);
  assert.equal(exportRes.data.account.email, aliceEmail);
  assert.equal(exportRes.data.conversations.length, 2);
  pass('HTTP conversation lifecycle (create, rename, pin, archive, restore, search, export) verified');

  // 8. Logout (allDevices), Restore via Login, & Account Deletion
  const logoutRes = await req(guestJar, '/api/bot/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ allDevices: true }),
  });
  assert.equal(logoutRes.status, 200);
  const afterLogoutSess = await req(guestJar, '/api/bot/auth/session');
  assert.equal(afterLogoutSess.data.authenticated, false);

  const reloginRes = await req(aliceJar, '/api/bot/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: aliceEmail, password: alicePassword }),
  });
  assert.equal(reloginRes.status, 200);
  const restoredConvs = await req(aliceJar, '/api/bot/conversations');
  assert.equal(restoredConvs.data.conversations.length, 2);

  // Wrong password fails 403 on DELETE /api/bot/auth/account
  const wrongDel = await req(aliceJar, '/api/bot/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ password: 'WrongPassword999' }),
  });
  assert.equal(wrongDel.status, 403);

  // Correct password deletes Alice + Bob cleanup
  const okDel = await req(aliceJar, '/api/bot/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ password: alicePassword }),
  });
  assert.equal(okDel.status, 200);
  assert.equal((await req(aliceJar, '/api/bot/auth/session')).data.authenticated, false);

  const bobDel = await req(bobJar, '/api/bot/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ password: 'BobStrongPassword!2026' }),
  });
  assert.equal(bobDel.status, 200);
  pass('Logout, re-login session restoration, and password-verified account deletion verified');

  console.log(`\nALL PHASE 7 HTTP TESTS PASSED (${passed} checks).`);
}

runHttpTests().catch((err) => {
  console.error('\nPhase 7 HTTP test failure:', err);
  process.exit(1);
});
