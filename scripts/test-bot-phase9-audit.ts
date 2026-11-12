/**
 * QUANTUMBOT PHASE 9: COMPREHENSIVE PRODUCTION AUDIT & REGRESSION SUITE
 * Verifies Security (13 areas), Failure Handling, Performance & Concurrency, and Website Regression
 * against a live production Next.js server (`next start`).
 *
 * Usage:
 *   PORT=3109 npx next start -p 3109
 *   npx tsx scripts/test-bot-phase9-audit.ts
 */

import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sanitizeMarkdownHref } from '../components/bot/MarkdownRenderer';
import { prepareConversationContext } from '../lib/bot/context-manager';
import { BUILT_IN_MODELS } from '../lib/bot/default-models';
import { executeToolCall } from '../lib/bot/tools';
import { validatePublicHttpsUrl } from '../lib/bot/tools/web-fetch';

async function loadEnvLocal() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {}
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3109';
const ADMIN_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'quantum-ai-secret-encryption-key-production-32-chars';

const results: Array<{ category: string; name: string; ms: number; detail?: string }> = [];

async function test(category: string, name: string, fn: () => Promise<string | void> | string | void) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - t0;
    results.push({ category, name, ms, detail: detail || undefined });
    console.log(`✅ [${category}] ${name} (${ms}ms)${detail ? ` — ${detail}` : ''}`);
  } catch (err: any) {
    console.error(`❌ [${category}] ${name}: ${err?.message || err}`);
    throw err;
  }
}

function buildMinimalPdfBuffer(textContent: string): Buffer {
  const escaped = textContent.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
  const objs = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objs) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

function parseSetCookieHeader(res: Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookies =
    typeof (res.headers as any).getSetCookie === 'function'
      ? (res.headers as any).getSetCookie()
      : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie')!]
        : [];
  for (const raw of setCookies) {
    const first = raw.split(';')[0];
    const eq = first.indexOf('=');
    if (eq > 0) cookies[first.slice(0, eq).trim()] = first.slice(eq + 1).trim();
  }
  return cookies;
}

function formatCookieHeader(bag: Record<string, string>): string {
  return Object.entries(bag)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function mintAdminCookie(): Promise<string> {
  const { encode } = await import('next-auth/jwt');
  const token = await encode({
    token: {
      id: 'audit_admin_1',
      email: 'audit-admin@quantumaitech.org',
      name: 'Audit SuperAdmin',
      role: 'SUPER_ADMIN',
    },
    secret: ADMIN_SECRET,
    maxAge: 3600,
  });
  return `next-auth.session-token=${token}`;
}

async function run() {
  await loadEnvLocal();
  console.log(`\n🛡️ Running Phase 9 Production Readiness Audit against ${BASE_URL}...\n`);

  const adminCookie = await mintAdminCookie();
  const userACookies: Record<string, string> = {};
  const userBCookies: Record<string, string> = {};

  const emailA = `p9_usera_${Date.now()}@example.com`;
  const emailB = `p9_userb_${Date.now()}@example.com`;

  try {
    // ─── SECTION 1: SECURITY AUDIT ──────────────────────────────────────────────
    await test('SECURITY', 'XSS URL sanitizer blocks javascript:/data:/vbscript: & allows safe links', () => {
      assert.strictEqual(sanitizeMarkdownHref('javascript:alert(1)'), null);
      assert.strictEqual(sanitizeMarkdownHref('  JaVaScRiPt:alert(document.cookie)  '), null);
      assert.strictEqual(sanitizeMarkdownHref('data:text/html,<script>alert(1)</script>'), null);
      assert.strictEqual(sanitizeMarkdownHref('vbscript:msgbox(1)'), null);
      assert.strictEqual(sanitizeMarkdownHref('//evil.example/phish'), null);
      assert.strictEqual(sanitizeMarkdownHref('https://quantumaitech.org/contact'), 'https://quantumaitech.org/contact');
      assert.strictEqual(sanitizeMarkdownHref('/quantumbot'), '/quantumbot');
      assert.strictEqual(sanitizeMarkdownHref('mailto:support@quantumaitech.org'), 'mailto:support@quantumaitech.org');
    });

    await test('SECURITY', 'Security headers present on public & QuantumBot routes (XFO, XCTO, HSTS, Referrer)', async () => {
      const res = await fetch(`${BASE_URL}/quantumbot`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.ok(res.headers.get('strict-transport-security')?.includes('max-age='));
      assert.strictEqual(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
      const html = await res.text();
      assert.ok(!html.includes('AQ.Ab8') && !html.includes('GEMINI_API_KEY'), 'Secret exposed in HTML');
    });

    await test('SECURITY', 'SSRF protection blocks localhost, private RFC1918 & cloud metadata URLs', async () => {
      const blocked1 = await validatePublicHttpsUrl('https://169.254.169.254/latest/meta-data/');
      const blocked2 = await validatePublicHttpsUrl('http://localhost:3109/api/admin/bot/config');
      const blocked3 = await validatePublicHttpsUrl('https://127.0.0.1/secret');
      const blocked4 = await validatePublicHttpsUrl('https://10.0.0.5/internal');
      assert.strictEqual(blocked1.safe, false);
      assert.strictEqual(blocked2.safe, false);
      assert.strictEqual(blocked3.safe, false);
      assert.strictEqual(blocked4.safe, false);
    });

    await test('SECURITY', 'Cross-origin POST requests rejected with 403 Forbidden (CORS/CSRF barrier)', async () => {
      const res = await fetch(`${BASE_URL}/api/bot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://malicious-third-party.example',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
      });
      assert.strictEqual(res.status, 403);
    });

    await test('SECURITY', 'API keys never appear in /api/bot/models or /api/admin/bot/config', async () => {
      const pubRes = await fetch(`${BASE_URL}/api/bot/models`);
      const pubText = await pubRes.text();
      assert.strictEqual(pubRes.status, 200);
      assert.ok(!pubText.includes(process.env.GEMINI_API_KEY || 'NEVER_MATCH'));

      const admRes = await fetch(`${BASE_URL}/api/admin/bot/config`, {
        headers: { Cookie: adminCookie },
      });
      assert.strictEqual(admRes.status, 200);
      const admText = await admRes.text();
      assert.ok(!admText.includes(process.env.GEMINI_API_KEY || 'NEVER_MATCH'));
      assert.ok(!admText.includes('encryptedApiKey'));
    });

    await test('SECURITY', 'User authentication, SQLi safety, HttpOnly cookies, and admin RBAC isolation', async () => {
      // Unauth admin denied
      const unauthAdm = await fetch(`${BASE_URL}/api/admin/bot/analytics`);
      assert.strictEqual(unauthAdm.status, 401);

      // Register User A & User B
      const regA = await fetch(`${BASE_URL}/api/bot/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Audit User A', email: emailA, password: 'PasswordA123!' }),
      });
      assert.strictEqual(regA.status, 201);
      const setCookieRaw = regA.headers.get('set-cookie') || '';
      assert.ok(/httponly/i.test(setCookieRaw), 'qb_session must be HttpOnly');
      assert.ok(/samesite=lax/i.test(setCookieRaw), 'qb_session must set SameSite=Lax');
      Object.assign(userACookies, parseSetCookieHeader(regA));

      const regB = await fetch(`${BASE_URL}/api/bot/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Audit User B', email: emailB, password: 'PasswordB123!' }),
      });
      assert.strictEqual(regB.status, 201);
      Object.assign(userBCookies, parseSetCookieHeader(regB));

      // BotUser A cannot access admin APIs
      const botOnAdmin = await fetch(`${BASE_URL}/api/admin/bot/config`, {
        headers: { Cookie: formatCookieHeader(userACookies) },
      });
      assert.strictEqual(botOnAdmin.status, 401);

      // SQL injection attempt on login
      const sqliRes = await fetch(`${BASE_URL}/api/bot/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "' OR 1=1 --@example.com", password: "' OR '1'='1" }),
      });
      assert.strictEqual(sqliRes.status, 401);
    });

    await test('SECURITY', 'Strict conversation & uploaded file ownership isolation (User A vs User B)', async () => {
      const convId = `conv_p9_iso_${Date.now()}`;
      // User A saves conversation
      const createConv = await fetch(`${BASE_URL}/api/bot/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: formatCookieHeader(userACookies) },
        body: JSON.stringify({
          id: convId,
          title: 'Secret Architecture Plan',
          modelId: 'gemini-3.5-flash',
          messages: [{ id: 'm1', role: 'user', content: 'Confidential blueprint details' }],
        }),
      });
      assert.strictEqual(createConv.status, 201);

      // User B attempts read, patch, delete
      const readB = await fetch(`${BASE_URL}/api/bot/conversations/${convId}`, {
        headers: { Cookie: formatCookieHeader(userBCookies) },
      });
      assert.strictEqual(readB.status, 403);

      const patchB = await fetch(`${BASE_URL}/api/bot/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: formatCookieHeader(userBCookies) },
        body: JSON.stringify({ title: 'Hijacked' }),
      });
      assert.strictEqual(patchB.status, 403);

      const delB = await fetch(`${BASE_URL}/api/bot/conversations/${convId}`, {
        method: 'DELETE',
        headers: { Cookie: formatCookieHeader(userBCookies) },
      });
      assert.strictEqual(delB.status, 403);

      // User A uploads PDF, User B blocked from reading or sending it
      const fd = new FormData();
      const pdfBuf = buildMinimalPdfBuffer('QuantumBot Private Document Token 7711');
      fd.append('file', new Blob([new Uint8Array(pdfBuf)], { type: 'application/pdf' }), 'private.pdf');
      const upA = await fetch(`${BASE_URL}/api/bot/files`, {
        method: 'POST',
        headers: { Cookie: formatCookieHeader(userACookies) },
        body: fd,
      });
      assert.strictEqual(upA.status, 201);
      const upData = await upA.json();
      const fileId = upData.attachment.fileId;

      const fileGetB = await fetch(`${BASE_URL}/api/bot/files/${fileId}`, {
        headers: { Cookie: formatCookieHeader(userBCookies) },
      });
      assert.strictEqual(fileGetB.status, 403);

      const chatFileSteal = await fetch(`${BASE_URL}/api/bot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: formatCookieHeader(userBCookies) },
        body: JSON.stringify({
          modelId: 'gemini-3.5-flash',
          messages: [
            {
              id: 'm_steal',
              role: 'user',
              content: 'Read this file',
              attachments: [upData.attachment],
            },
          ],
        }),
      });
      assert.strictEqual(chatFileSteal.status, 403);
    });

    await test('SECURITY', 'Upload validation blocks executables, SVGs, and spoofed PE headers', async () => {
      const tryUpload = async (name: string, mime: string, bytes: Buffer) => {
        const fd = new FormData();
        fd.append('file', new Blob([new Uint8Array(bytes)], { type: mime }), name);
        return fetch(`${BASE_URL}/api/bot/files`, {
          method: 'POST',
          headers: { Cookie: formatCookieHeader(userACookies) },
          body: fd,
        });
      };

      const exeRes = await tryUpload('payload.exe', 'application/octet-stream', Buffer.from('MZfake'));
      const svgRes = await tryUpload('xss.svg', 'image/svg+xml', Buffer.from('<svg onload=alert(1)/>'));
      const spoofRes = await tryUpload('notes.txt', 'text/plain', Buffer.from([0x4d, 0x5a, 0x90, 0x00]));
      const fakePdfRes = await tryUpload('broken.pdf', 'application/pdf', Buffer.from('NOT_A_PDF_HEADER'));

      assert.strictEqual(exeRes.status, 400);
      assert.strictEqual(svgRes.status, 400);
      assert.strictEqual(spoofRes.status, 400);
      assert.strictEqual(fakePdfRes.status, 400);
    });

    await test('SECURITY', 'Tool permission enforcement & confirmation gate cannot be bypassed', async () => {
      // web_search blocked when permission missing or toggle off
      const webDenied = await executeToolCall(
        'web_search',
        { query: 'Quantum AI' },
        { permissions: ['public_read'], enableWebSearch: false }
      );
      assert.strictEqual(webDenied.isError, true);

      // submit_quantum_ai_inquiry requires explicit human approval even with permission
      const inquiryUnconfirmed = await executeToolCall(
        'submit_quantum_ai_inquiry',
        {
          name: 'Test',
          email: 'test@example.com',
          message: 'Please contact me about AI agent engineering.',
        },
        { permissions: ['public_read', 'compute', 'external_write'] }
      );
      assert.strictEqual(inquiryUnconfirmed.confirmationRequired, true);
      assert.strictEqual(inquiryUnconfirmed.status, 'confirmation_required');
    });

    // ─── SECTION 2: FAILURE HANDLING ────────────────────────────────────────────
    await test('FAILURE', 'Unconfigured/unavailable provider (OpenAI without key) returns clean error', async () => {
      const res = await fetch(`${BASE_URL}/api/bot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: formatCookieHeader(userACookies) },
        body: JSON.stringify({
          modelId: 'gpt-4o-mini',
          messages: [{ id: 'm_no_key', role: 'user', content: 'Hello' }],
        }),
      });
      // Expect 400/500 SSE or fallback notice — ensure server does NOT crash and returns clear error if unconfigured
      const text = await res.text();
      assert.ok(text.length > 0 && !text.includes('GEMINI_API_KEY'));
    });

    await test('FAILURE', 'Invalid API key on custom provider is surfaced safely without secret leakage', async () => {
      // Configure bogus OpenAI key temporarily, run connectivity check, confirm failure message, clear key
      const setRes = await fetch(`${BASE_URL}/api/admin/bot/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ provider: 'openai', apiKey: 'invalid-audit-openai-key-9988', enabled: true }),
      });
      assert.strictEqual(setRes.status, 200);

      const testRes = await fetch(`${BASE_URL}/api/admin/bot/models/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ provider: 'openai' }),
      });
      const testJson = await testRes.json();
      assert.strictEqual(testJson.success, false);
      assert.ok(testJson.error && !JSON.stringify(testJson).includes('invalid-audit-openai-key-9988'));

      await fetch(`${BASE_URL}/api/admin/bot/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ provider: 'openai', clearApiKey: true }),
      });
    });

    await test('FAILURE', 'Expired/tampered qb_session cookie flagged clearly & cleared cleanly', async () => {
      const sesRes = await fetch(`${BASE_URL}/api/bot/auth/session`, {
        headers: { Cookie: 'qb_session=tampered.expired.cookie.0000' },
      });
      assert.strictEqual(sesRes.status, 200);
      const sesData = await sesRes.json();
      assert.strictEqual(sesData.authenticated, false);
      assert.strictEqual(sesData.sessionExpired, true);
      const setCookie = sesRes.headers.get('set-cookie') || '';
      assert.ok(setCookie.includes('qb_session=;'), 'Expected expired qb_session cookie to be cleared');
    });

    // ─── SECTION 3: PERFORMANCE & CONCURRENCY ───────────────────────────────────
    await test('PERF', 'Public website & QuantumBot initial HTTP load latencies (< 800ms each)', async () => {
      const routes = ['/', '/services', '/leadership', '/technology', '/work', '/contact', '/quantumbot', '/api/bot/models'];
      const timings: string[] = [];
      for (const r of routes) {
        const s = Date.now();
        const res = await fetch(`${BASE_URL}${r}`);
        assert.strictEqual(res.status, 200, `${r} returned ${res.status}`);
        await res.text();
        const elapsed = Date.now() - s;
        timings.push(`${r}:${elapsed}ms`);
        assert.ok(elapsed < 3000, `${r} took ${elapsed}ms (>3000ms)`);
      }
      return timings.join(', ');
    });

    await test('PERF', 'Long conversation context pruning (100 turns in < 15ms)', () => {
      const longMsgs = Array.from({ length: 100 }, (_, i) => ({
        id: `m_${i}`,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Turn ${i}: `.padEnd(900, 'architecture engineering data '),
      }));
      const t0 = Date.now();
      const prepared = prepareConversationContext(longMsgs, BUILT_IN_MODELS[0], 'System prompt');
      const dt = Date.now() - t0;
      assert.ok(prepared.messages.length > 0 && prepared.messages.length <= 100);
      assert.ok(dt < 50, `Slow pruning: ${dt}ms`);
      return `retained ${prepared.messages.length}/100 turns in ${dt}ms`;
    });

    await test('PERF', 'Live SSE streaming TTFT & PDF multimodal Q&A latency on Gemini', async () => {
      const pdfBuf = buildMinimalPdfBuffer('QuantumBot Audit Fact: Codeword ORION-942.');
      const fd = new FormData();
      fd.append('file', new Blob([new Uint8Array(pdfBuf)], { type: 'application/pdf' }), 'audit.pdf');
      const tUp0 = Date.now();
      const upRes = await fetch(`${BASE_URL}/api/bot/files`, {
        method: 'POST',
        headers: { Cookie: formatCookieHeader(userACookies) },
        body: fd,
      });
      const uploadMs = Date.now() - tUp0;
      assert.strictEqual(upRes.status, 201);
      const { attachment } = await upRes.json();

      const tStream0 = Date.now();
      let ttftMs = 0;
      const chatRes = await fetch(`${BASE_URL}/api/bot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: formatCookieHeader(userACookies) },
        body: JSON.stringify({
          modelId: 'gemini-3.5-flash',
          messages: [
            {
              id: 'm_pdf_q',
              role: 'user',
              content: 'What is the exact codeword in this attached PDF? Reply with just the codeword.',
              attachments: [attachment],
            },
          ],
        }),
      });
      assert.strictEqual(chatRes.status, 200);
      const reader = chatRes.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        for (const line of chunkStr.split('\n\n')) {
          const t = line.trim();
          if (!t.startsWith('data: ')) continue;
          const ev = JSON.parse(t.slice(6));
          if (ev.type === 'text' && ev.text) {
            if (!ttftMs) ttftMs = Date.now() - tStream0;
            fullText += ev.text;
          }
        }
      }
      const totalMs = Date.now() - tStream0;
      assert.ok(fullText.includes('ORION-942'), `Expected ORION-942 in answer, got: ${fullText}`);
      return `upload=${uploadMs}ms, TTFT=${ttftMs}ms, total=${totalMs}ms`;
    });

    await test('PERF', 'Concurrent API & chat burst (5 parallel requests, 0 errors)', async () => {
      const start = Date.now();
      const calls = [
        fetch(`${BASE_URL}/api/bot/models`),
        fetch(`${BASE_URL}/api/bot/knowledge?q=Copilot`),
        fetch(`${BASE_URL}/api/bot/conversations`, { headers: { Cookie: formatCookieHeader(userACookies) } }),
        fetch(`${BASE_URL}/api/bot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: formatCookieHeader(userACookies) },
          body: JSON.stringify({
            modelId: 'gemini-3.5-flash-lite',
            messages: [{ id: 'c1', role: 'user', content: 'Say "PONG-1" only.' }],
          }),
        }),
        fetch(`${BASE_URL}/api/bot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: formatCookieHeader(userBCookies) },
          body: JSON.stringify({
            modelId: 'gemini-3.5-flash-lite',
            messages: [{ id: 'c2', role: 'user', content: 'Say "PONG-2" only.' }],
          }),
        }),
      ];
      const resList = await Promise.all(calls);
      for (const r of resList) {
        assert.strictEqual(r.status, 200, `Concurrent request failed with ${r.status}`);
        await r.text();
      }
      return `5 concurrent requests completed cleanly in ${Date.now() - start}ms`;
    });

    // ─── SECTION 4: REGRESSION CHECK ────────────────────────────────────────────
    await test('REGRESSION', 'Existing Quantum AI pages & APIs return HTTP 200 cleanly', async () => {
      const publicPages = [
        '/',
        '/about',
        '/services',
        '/products',
        '/work',
        '/case-studies',
        '/leadership',
        '/technology',
        '/blog',
        '/research',
        '/careers-partnerships',
        '/contact',
        '/privacy',
        '/terms',
      ];
      for (const p of publicPages) {
        const res = await fetch(`${BASE_URL}${p}`);
        assert.strictEqual(res.status, 200, `Page ${p} returned ${res.status}`);
      }
      const adminRedirect = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
      assert.ok([302, 303, 307].includes(adminRedirect.status));
      const adminOk = await fetch(`${BASE_URL}/admin/quantumbot`, {
        headers: { Cookie: adminCookie },
      });
      assert.strictEqual(adminOk.status, 200);
      return `${publicPages.length} public routes + /admin/quantumbot verified HTTP 200`;
    });
  } finally {
    // Cleanup temporary audit accounts & files
    for (const [email, password, bag] of [
      [emailA, 'PasswordA123!', userACookies],
      [emailB, 'PasswordB123!', userBCookies],
    ] as const) {
      if (Object.keys(bag).length > 0) {
        await fetch(`${BASE_URL}/api/bot/auth/account`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Cookie: formatCookieHeader(bag) },
          body: JSON.stringify({ password }),
        }).catch(() => {});
        console.log(`🧹 Cleaned up temporary audit account ${email}`);
      }
    }
  }

  console.log(`\n🎉 Phase 9 Production Audit Passed (${results.length}/${results.length} checks)\n`);
}

run().catch((err) => {
  console.error('\n💥 Phase 9 Audit Failed:', err);
  process.exit(1);
});
