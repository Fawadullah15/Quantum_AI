import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import assert from 'node:assert/strict';
import {
  STANDARD_BOT_TOOLS,
  computeActionKey,
  executeToolCall,
  getAvailableToolsForContext,
} from '../lib/bot/tools';
import { evaluateSafeMathExpression } from '../lib/bot/tools/calculator';
import { validatePublicHttpsUrl } from '../lib/bot/tools/web-fetch';
import { runWebSearch } from '../lib/bot/tools/web-search';
import { BotToolImplementation } from '../lib/bot/tools/types';
import { executeQuantumBotChat } from '../lib/bot/engine';
import { StreamChunk } from '../lib/bot/types';

async function main() {
  console.log('\n=== QUANTUMBOT PHASE 5: AI TOOLS & WEB RESEARCH TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}: ${err?.message || err}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // 1. REGISTRY & SCHEMA METADATA
  // --------------------------------------------------------------------------
  await test('Registry defines permissions, timeouts, schemas, and resultFormat on all tools', () => {
    assert.ok(STANDARD_BOT_TOOLS.length >= 6);
    for (const tool of STANDARD_BOT_TOOLS) {
      assert.ok(tool.declaration.name);
      assert.ok(tool.declaration.description.length > 15);
      assert.ok(tool.declaration.parameters?.type === 'object');
      assert.ok(Array.isArray(tool.declaration.requiredPermissions) && tool.declaration.requiredPermissions.length > 0);
      assert.ok(typeof tool.declaration.timeoutMs === 'number' && tool.declaration.timeoutMs > 0);
      assert.ok(tool.declaration.resultFormat);
    }
  });

  await test('Unknown / unregistered tools return status "unavailable" cleanly', async () => {
    const res = await executeToolCall('arbitrary_shell_exec', { cmd: 'whoami' });
    assert.equal(res.isError, true);
    assert.equal(res.status, 'unavailable');
    assert.match(res.result.error, /not registered/i);
  });

  await test('Disabled feature gate hides web tools and blocks direct execution when Web Search is OFF', async () => {
    const exposedOff = getAvailableToolsForContext({
      permissions: ['public_read', 'compute', 'web_research'],
      enableWebSearch: false,
    }).map((t) => t.declaration.name);

    assert.ok(!exposedOff.includes('web_search'));
    assert.ok(!exposedOff.includes('web_fetch'));

    const res = await executeToolCall(
      'web_search',
      { query: 'Quantum AI' },
      { permissions: ['public_read', 'compute', 'web_research'], enableWebSearch: false }
    );
    assert.equal(res.isError, true);
    assert.equal(res.status, 'unavailable');
    assert.match(res.result.error, /disabled/i);
  });

  await test('Permission checks block unauthorized web_research and external_write tool calls', async () => {
    const webDenied = await executeToolCall(
      'web_search',
      { query: 'TypeScript 5.8' },
      { permissions: ['public_read', 'compute'], enableWebSearch: true }
    );
    assert.equal(webDenied.isError, true);
    assert.equal(webDenied.status, 'denied');
    assert.match(webDenied.result.error, /Permission denied/i);

    const writeDenied = await executeToolCall(
      'submit_quantum_ai_inquiry',
      { name: 'Alice', email: 'alice@example.com', message: 'Interested in enterprise AI build.' },
      { permissions: ['public_read', 'compute'] }
    );
    assert.equal(writeDenied.isError, true);
    assert.equal(writeDenied.status, 'denied');
  });

  await test('Schema validator rejects malformed, missing, wrong-type, or extraneous arguments', async () => {
    const missing = await executeToolCall('calculate', {}, { permissions: ['compute'] });
    assert.equal(missing.isError, true);
    assert.match(missing.result.error, /Missing required parameter "expression"/i);

    const wrongType = await executeToolCall(
      'web_search',
      { query: 'Next.js docs', maxResults: 'five' as any },
      { permissions: ['web_research'], enableWebSearch: true }
    );
    assert.equal(wrongType.isError, true);
    assert.match(wrongType.result.error, /must be a finite integer/i);

    const extraField = await executeToolCall(
      'calculate',
      { expression: '2 + 2', injectedPayload: 'evil' },
      { permissions: ['compute'] }
    );
    assert.equal(extraField.isError, true);
    assert.match(extraField.result.error, /Unexpected parameter/i);

    const badEmail = await executeToolCall(
      'submit_quantum_ai_inquiry',
      { name: 'Bob', email: 'not-an-email', message: 'Valid long inquiry message here.' },
      { permissions: ['external_write'] }
    );
    assert.equal(badEmail.isError, true);
    assert.match(badEmail.result.error, /does not match required format/i);
  });

  await test('Timeout enforcement aborts slow/hung tools deterministically', async () => {
    const slowTool: BotToolImplementation = {
      declaration: {
        name: 'slow_test_tool',
        description: 'Simulates a hanging backend call for timeout tests.',
        requiredPermissions: ['public_read'],
        timeoutMs: 120,
        parameters: { type: 'object', properties: {} },
      },
      execute: async () => {
        await new Promise((r) => setTimeout(r, 1500));
        return { ok: true };
      },
    };

    const res = await executeToolCall('slow_test_tool', {}, { permissions: ['public_read'] }, [
      slowTool,
    ]);
    assert.equal(res.isError, true);
    assert.equal(res.status, 'timeout');
    assert.match(res.result.error, /timed out/i);
  });

  // --------------------------------------------------------------------------
  // 2. CALCULATOR SECURITY (NO EVAL / NO FUNCTION)
  // --------------------------------------------------------------------------
  await test('Calculator evaluates pure math formulas accurately', async () => {
    assert.equal(evaluateSafeMathExpression('(1250 * 0.08) / 12'), (1250 * 0.08) / 12);
    assert.ok(Math.abs(evaluateSafeMathExpression('sqrt(144) * PI') - 12 * Math.PI) < 1e-12);
    assert.equal(evaluateSafeMathExpression('2 ^ 10 + max(3, 9, 4)'), 1033);
    assert.ok(Math.abs(evaluateSafeMathExpression('sin(PI / 2) + log10(1000)') - 4) < 1e-12);

    const toolRes = await executeToolCall(
      'calculate',
      { expression: '(245 * 18) + sqrt(1444)' },
      { permissions: ['compute'] }
    );
    assert.equal(toolRes.isError, false);
    assert.equal(toolRes.result.result, 4448);
  });

  await test('Calculator blocks arbitrary JS code injection and prototype-chain payloads', () => {
    const injectionPayloads = [
      'process.exit(1)',
      '[].constructor.constructor("return process")()',
      '(() => 1)()',
      'eval("2+2")',
      'require("fs")',
      'globalThis.fetch("http://127.0.0.1")',
      'Math["sqrt"](16)',
      '1+1; process.env',
    ];
    for (const payload of injectionPayloads) {
      assert.throws(() => evaluateSafeMathExpression(payload));
    }
  });

  // --------------------------------------------------------------------------
  // 3. WEB SEARCH & SSRF PROTECTION
  // --------------------------------------------------------------------------
  await test('web_fetch SSRF filter blocks http, localhost, metadata IPs, private RFC1918, and credentials', async () => {
    const blockedUrls = [
      'http://example.com',
      'https://localhost:3000/api/secret',
      'https://127.0.0.1/admin',
      'https://169.254.169.254/latest/meta-data/',
      'https://10.0.0.1/internal',
      'https://192.168.1.50/',
      'https://[::1]/secret',
      'https://user:pass@example.com/',
    ];

    for (const url of blockedUrls) {
      const check = await validatePublicHttpsUrl(url);
      assert.equal(check.safe, false, `Expected blocked SSRF URL: ${url}`);
    }
  });

  await test('Failed upstream search reports available:false honestly without fabricating links', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('ECONNREFUSED upstream mock');
    };
    try {
      const out = await runWebSearch('quantum computing news', 3, {
        tavilyApiKey: 'mock-key',
      });
      assert.equal(out.available, false);
      assert.equal(out.results.length, 0);
      assert.match(out.error || '', /Live web search failed/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('Live web_search returns real HTTPS results when Web Search is enabled', async () => {
    const res = await executeToolCall(
      'web_search',
      { query: 'TypeScript programming language', maxResults: 3 },
      { permissions: ['web_research'], enableWebSearch: true }
    );
    assert.equal(res.status, 'success');
    assert.equal(res.result.available, true);
    assert.ok(Array.isArray(res.result.results) && res.result.results.length > 0);
    assert.ok(res.result.results[0].url.startsWith('https://'));
  });

  // --------------------------------------------------------------------------
  // 4. COMPANY KNOWLEDGE TOOL
  // --------------------------------------------------------------------------
  await test('query_quantum_ai_knowledge returns verified founders, projects, services, and contact email', async () => {
    const teamRes = await executeToolCall(
      'query_quantum_ai_knowledge',
      { query: 'founders', category: 'team' },
      { permissions: ['public_read'] }
    );
    assert.equal(teamRes.isError, false);
    const serializedTeam = JSON.stringify(teamRes.result);
    assert.match(serializedTeam, /Fawadullah Imraj/);
    assert.match(serializedTeam, /Fahad Khan/);

    const copilotRes = await executeToolCall(
      'query_quantum_ai_knowledge',
      { query: 'Mechanical Engineering Design Copilot', category: 'projects' },
      { permissions: ['public_read'] }
    );
    assert.equal(copilotRes.isError, false);
    assert.match(JSON.stringify(copilotRes.result), /Mechanical Engineering Design Copilot/);

    const contactRes = await executeToolCall(
      'query_quantum_ai_knowledge',
      { query: 'email', category: 'contact' },
      { permissions: ['public_read'] }
    );
    assert.match(JSON.stringify(contactRes.result), /support@quantumaitech\.org/);
  });

  // --------------------------------------------------------------------------
  // 5. CONFIRMATION GATE FOR SENSITIVE / EXTERNAL ACTIONS
  // --------------------------------------------------------------------------
  await test('submit_quantum_ai_inquiry enforces user confirmation before execution and binds approval key', async () => {
    const args = {
      name: 'Test Engineer',
      email: 'engineer@example.com',
      message: 'We need an automated visual quality inspection pipeline on our assembly line.',
      projectType: 'AI System',
    };

    const unconfirmed = await executeToolCall('submit_quantum_ai_inquiry', args, {
      permissions: ['external_write'],
    });
    assert.equal(unconfirmed.status, 'confirmation_required');
    assert.equal(unconfirmed.confirmationRequired, true);
    assert.ok(unconfirmed.actionPreview?.actionKey);

    // Tampered arguments must NOT reuse the original key
    const tampered = await executeToolCall(
      'submit_quantum_ai_inquiry',
      { ...args, email: 'attacker@evil.example' },
      {
        permissions: ['external_write'],
        approvedActionKeys: [unconfirmed.actionPreview!.actionKey],
      }
    );
    assert.equal(tampered.status, 'confirmation_required');

    // Exact matching approval key executes cleanly
    const exactKey = computeActionKey('submit_quantum_ai_inquiry', args);
    const confirmed = await executeToolCall('submit_quantum_ai_inquiry', args, {
      permissions: ['external_write'],
      approvedActionKeys: [exactKey],
    });
    assert.notEqual(confirmed.status, 'confirmation_required');
  });

  // --------------------------------------------------------------------------
  // 6. LIVE GEMINI MULTI-ROUND TOOL CALLING E2E
  // --------------------------------------------------------------------------
  if (process.env.GEMINI_API_KEY) {
    const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const liveModelId = 'gemini-3.5-flash-lite';
    await test('Live Gemini handles general questions cleanly without forced RAG', async () => {
      const chunks: StreamChunk[] = [];
      const res = await executeQuantumBotChat({
        modelId: liveModelId,
        messages: [
          {
            id: 'u1',
            role: 'user',
            content: 'What is the capital of Japan? Reply in one short sentence.',
          },
        ],
        enableWebSearch: false,
        onChunk: (c) => chunks.push(c),
      });
      assert.match(res.content, /Tokyo/i);
      const calledCompanyTool = (res.toolCalls || []).some(
        (t) => t.name === 'query_quantum_ai_knowledge'
      );
      assert.equal(calledCompanyTool, false);
    });

    await pause(2500);
    await test('Live Gemini multi-round calculate tool execution synthesizes final answer', async () => {
      const chunks: StreamChunk[] = [];
      const res = await executeQuantumBotChat({
        modelId: liveModelId,
        messages: [
          {
            id: 'u2',
            role: 'user',
            content: 'Use the calculate tool to compute (245 * 18) + sqrt(1444) and state the exact numeric result.',
          },
        ],
        enableWebSearch: false,
        onChunk: (c) => chunks.push(c),
      });
      assert.ok(
        res.toolCalls?.some((tc) => tc.name === 'calculate'),
        'Expected Gemini to invoke calculate tool'
      );
      assert.ok(
        res.toolResults?.some((tr) => tr.toolName === 'calculate' && !tr.isError),
        'Expected successful tool_result'
      );
      assert.match(res.content.replace(/,/g, ''), /4448/);
    });

    await pause(2500);
    await test('Live Gemini invokes query_quantum_ai_knowledge or uses verified context for Quantum AI inquiries', async () => {
      const res = await executeQuantumBotChat({
        modelId: liveModelId,
        messages: [
          {
            id: 'u3',
            role: 'user',
            content:
              'Explicitly call the query_quantum_ai_knowledge tool with query "Quantum AI founders contact" and tell me who founded Quantum AI and their contact email.',
          },
        ],
        enableWebSearch: false,
        onChunk: () => {},
      });
      const usedToolOrVerifiedContext =
        Boolean(res.toolCalls?.some((tc) => tc.name === 'query_quantum_ai_knowledge')) ||
        (/Fawadullah Imraj/i.test(res.content) &&
          /Fahad Khan/i.test(res.content) &&
          /support@quantumaitech\.org/i.test(res.content));
      assert.ok(usedToolOrVerifiedContext, 'Expected verified Quantum AI answer via tool or injected KB context');
      assert.match(res.content, /Fawadullah Imraj/i);
      assert.match(res.content, /Fahad Khan/i);
      assert.match(res.content, /support@quantumaitech\.org/i);
    });

    await pause(2500);
    await test('Live Gemini executes web_search when enabled and returns cited findings', async () => {
      const res = await executeQuantumBotChat({
        modelId: liveModelId,
        messages: [
          {
            id: 'u4',
            role: 'user',
            content: 'Search the web using web_search for TypeScript programming language and provide clickable markdown links.',
          },
        ],
        enableWebSearch: true,
        onChunk: () => {},
      });
      assert.ok(
        res.toolCalls?.some((tc) => tc.name === 'web_search'),
        'Expected Gemini to invoke web_search when enabled'
      );
      const searchResult = res.toolResults?.find((tr) => tr.toolName === 'web_search');
      assert.ok(
        searchResult && typeof searchResult.result?.available === 'boolean',
        'Expected structured web_search tool result'
      );
      if (searchResult.result?.available) {
        assert.match(res.content, /https:\/\//);
      } else {
        assert.ok(res.content.length > 20, 'Expected honest fallback explanation if live search was unreachable');
      }
    });
  } else {
    console.log('  [SKIP] Live Gemini multi-round tests skipped (GEMINI_API_KEY not set)');
  }

  console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
