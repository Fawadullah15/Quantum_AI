import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import {
  KNOWLEDGE_CATEGORIES,
  KnowledgeDocument,
} from '../lib/bot/knowledge/types';
import {
  getKnowledgeDocumentById,
  getKnowledgeIndexStats,
  ingestKnowledgeDocument,
  listKnowledgeDocuments,
  reindexKnowledgeBase,
  removeKnowledgeDocument,
  searchKnowledgeBase,
  updateKnowledgeDocument,
} from '../lib/bot/knowledge/store';
import {
  classifyQueryIntent,
  retrieveContextualCompanyKnowledge,
} from '../lib/bot/knowledge/retriever';
import {
  QUANTUMBOT_IDENTITY_STATEMENT,
  buildSystemInstruction,
} from '../lib/bot/prompt';
import { MODEL_REGISTRY } from '../lib/bot/models';
import { executeToolCall } from '../lib/bot/tools';
import { executeQuantumBotChat } from '../lib/bot/engine';

async function runPhase6Tests() {
  let passed = 0;
  const pass = (label: string) => {
    passed += 1;
    console.log(`PASS [${passed}]: ${label}`);
  };

  // Isolated temporary directory so tests do not mutate real storage or DB
  const tmpStoreDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbot-p6-test-'));
  const storeOpts = { storageDir: tmpStoreDir, skipDatabase: true };

  try {
    // ─── 1. Schema, Metadata & Category Coverage ───────────────────────────
    const baselineDocs = await listKnowledgeDocuments({ includeUnverified: true }, storeOpts);
    assert.ok(baselineDocs.length >= 11, 'Expected at least 11 verified company documents');

    const coveredCats = new Set(baselineDocs.map((d) => d.category));
    for (const reqCat of KNOWLEDGE_CATEGORIES) {
      assert.ok(
        coveredCats.has(reqCat),
        `Missing required KnowledgeCategory coverage: ${reqCat}`
      );
    }

    for (const doc of baselineDocs) {
      assert.ok(doc.title.trim().length > 0, `Missing title on ${doc.id}`);
      assert.ok(doc.source.trim().length > 0, `Missing source on ${doc.id}`);
      assert.ok(doc.content.trim().length > 20, `Content too short on ${doc.id}`);
      assert.equal(doc.verificationStatus, 'verified', `Baseline doc ${doc.id} must be verified`);
      assert.ok(!Number.isNaN(Date.parse(doc.lastUpdated)), `Invalid lastUpdated ISO date on ${doc.id}`);
    }
    pass('All 11 Company Knowledge categories covered with valid schema & metadata');

    // ─── 2. Verified Facts & Accuracy Audit ────────────────────────────────
    const allText = baselineDocs.map((d) => `${d.title}\n${d.content}`).join('\n');
    assert.ok(!/Murtaza/i.test(allText), 'Stale unverified name found in knowledge docs');
    assert.ok(allText.includes('Fawadullah Imraj'), 'Verified Co-Founder Fawadullah Imraj present');
    assert.ok(allText.includes('Fahad Khan'), 'Verified Co-Founder Fahad Khan present');
    assert.ok(allText.includes('Abdullah Mahmood'), 'Verified Lead Software Engineer present');
    assert.ok(allText.includes('Hafizah Anisa Safdar'), 'Verified Business Development Partner present');
    assert.ok(allText.includes('Waqas Ali Khan'), 'Verified Strategic Growth Partner present');
    assert.ok(allText.includes('support@quantumaitech.org'), 'Verified contact email present');
    assert.ok(allText.includes('Peshawar, Khyber Pakhtunkhwa, Pakistan'), 'Verified operating location present');
    assert.ok(
      allText.includes('Mechanical Engineering Design Copilot') &&
        allText.includes('Prototype in Development') &&
        allText.includes('AISI 1045'),
      'Verified Mechanical Engineering Design Copilot specs present'
    );
    pass('Verified company facts (team, location, email, Copilot specs) match public website');

    // ─── 3. Source Management CRUD: Ingest -> Index -> Edit -> Re-index -> Delete ──
    const initialStats = await getKnowledgeIndexStats(storeOpts);
    assert.ok(initialStats.totalUniqueTokens > 80, 'Expected rich inverted index vocabulary');

    // Ingest 1 verified doc + 1 draft doc
    const { document: ingestedDoc, stats: afterIngestStats } = await ingestKnowledgeDocument(
      {
        id: 'custom-p6-robotics-note',
        title: 'Quantum AI — Industrial Telemetry Verification Note',
        category: 'projects',
        source: 'admin:verified-release-notes',
        content:
          'Quantum AI maintains deterministic telemetry checksum validation across industrial sensor bridges.',
        verificationStatus: 'verified',
        tags: ['telemetry', 'checksum', 'industrial'],
      },
      storeOpts
    );
    assert.equal(ingestedDoc.verificationStatus, 'verified');
    assert.equal(afterIngestStats.totalDocuments, initialStats.totalDocuments + 1);

    const { document: draftDoc } = await ingestKnowledgeDocument(
      {
        id: 'custom-p6-unverified-draft',
        title: 'Internal Draft — Experimental Quantum Sensor Price',
        category: 'services',
        source: 'internal:draft',
        content: 'Internal unverified draft token XylophoneQuantumDraft999 should never leak publicly.',
        verificationStatus: 'draft',
      },
      storeOpts
    );
    assert.equal(draftDoc.verificationStatus, 'draft');

    // Public search finds verified ingested doc, EXCLUDES draft doc
    const hitVerified = await searchKnowledgeBase('telemetry checksum validation', { includeUnverified: false }, storeOpts);
    assert.ok(
      hitVerified.hits.some((h) => h.document.id === 'custom-p6-robotics-note'),
      'Ingested verified doc must be searchable immediately'
    );

    const hitDraftPublic = await searchKnowledgeBase(
      'XylophoneQuantumDraft999',
      { includeUnverified: false },
      storeOpts
    );
    assert.equal(hitDraftPublic.hits.length, 0, 'Unverified draft doc must NOT be returned in verified RAG search');

    const hitDraftAdmin = await searchKnowledgeBase(
      'XylophoneQuantumDraft999',
      { includeUnverified: true },
      storeOpts
    );
    assert.equal(hitDraftAdmin.hits.length, 1, 'Admin search with includeUnverified=true finds draft doc');
    pass('Document ingestion & verificationStatus gating (verified vs draft) enforced');

    // Edit & Re-index
    const prevTimestamp = ingestedDoc.lastUpdated;
    await new Promise((r) => setTimeout(r, 15));
    const { document: editedDoc } = await updateKnowledgeDocument(
      'custom-p6-robotics-note',
      {
        title: 'Quantum AI — Updated Telemetry Calibration Note',
        content: 'Updated industrial telemetry uses ZigguratChecksumV2 verification pipelines.',
      },
      storeOpts
    );
    assert.notEqual(editedDoc.lastUpdated, prevTimestamp, 'Editing doc must refresh lastUpdated');

    const hitEdited = await searchKnowledgeBase('ZigguratChecksumV2', {}, storeOpts);
    assert.equal(hitEdited.hits[0]?.document.id, 'custom-p6-robotics-note', 'Updated content re-indexed');
    pass('Document editing, lastUpdated update, and automatic re-indexing verified');

    // Explicit re-index & delete
    const reindexStats = await reindexKnowledgeBase(storeOpts);
    assert.ok(reindexStats.indexVersion > afterIngestStats.indexVersion, 'Re-index increments indexVersion');

    await removeKnowledgeDocument('custom-p6-robotics-note', storeOpts);
    await removeKnowledgeDocument('custom-p6-unverified-draft', storeOpts);

    const afterDeleteHit = await searchKnowledgeBase('ZigguratChecksumV2', {}, storeOpts);
    assert.equal(afterDeleteHit.hits.length, 0, 'Removed document must no longer appear in index');
    const removedLookup = await getKnowledgeDocumentById('custom-p6-robotics-note', storeOpts);
    assert.equal(removedLookup, null, 'Removed document lookup returns null');
    pass('Document deletion & explicit knowledge base re-indexing verified');

    // ─── 4. Contextual Retrieval Classifier (General vs Company vs Mixed vs Missing) ──
    const gen1 = await retrieveContextualCompanyKnowledge(
      [{ role: 'user', content: 'Write a TypeScript binary search function with generics.' }],
      storeOpts
    );
    assert.equal(gen1.intent, 'general');
    assert.equal(gen1.shouldInjectContext, false);

    // Subtle test: "quantum computing" MUST remain general, NOT trigger Quantum AI RAG!
    const genQuantumPhysics = await retrieveContextualCompanyKnowledge(
      [
        {
          role: 'user',
          content:
            'Explain the difference between quantum annealing and gate-based quantum computing for optimization software.',
        },
      ],
      storeOpts
    );
    assert.equal(genQuantumPhysics.intent, 'general');
    assert.equal(genQuantumPhysics.shouldInjectContext, false);
    pass('Pure general questions (including "quantum computing") skip forced RAG completely');

    // Company query
    const companyQuery = await retrieveContextualCompanyKnowledge(
      [
        {
          role: 'user',
          content: 'Who founded Quantum AI, where is it based, and what does the Mechanical Engineering Design Copilot do?',
        },
      ],
      storeOpts
    );
    assert.equal(companyQuery.intent, 'company');
    assert.equal(companyQuery.shouldInjectContext, true);
    assert.ok(companyQuery.hits.length >= 2);
    assert.ok(
      companyQuery.formattedContextBlock.includes('Fawadullah Imraj') ||
        companyQuery.formattedContextBlock.includes('Mechanical Engineering Design Copilot')
    );
    pass('Company query retrieves verified Quantum AI context docs accurately');

    // Pronoun follow-up in multi-turn chat
    const followupQuery = classifyQueryIntent('What services do they offer and what is their contact email?', [
      { role: 'user', content: 'Tell me about Quantum AI.' },
      { role: 'assistant', content: 'Quantum AI builds AI systems and custom business software.' },
      { role: 'user', content: 'What services do they offer and what is their contact email?' },
    ]);
    assert.equal(followupQuery.intent, 'company');
    pass('Multi-turn pronoun follow-up preserves Quantum AI contextual retrieval');

    // Mixed query
    const mixedQuery = await retrieveContextualCompanyKnowledge(
      [
        {
          role: 'user',
          content:
            'Explain microservices vs modular monolith best practices in Next.js and PostgreSQL, and tell me how Quantum AI builds custom business software.',
        },
      ],
      storeOpts
    );
    assert.equal(mixedQuery.intent, 'mixed');
    assert.equal(mixedQuery.shouldInjectContext, true);
    assert.ok(mixedQuery.formattedContextBlock.includes('MIXED QUERY'));
    pass('Mixed company + general question classified as mixed with blended context instructions');

    // Missing-company-info query (pricing, Fortune 500 customers, SOC 2 certification)
    const missingQuery = await retrieveContextualCompanyKnowledge(
      [
        {
          role: 'user',
          content:
            'What are Quantum AI hourly pricing packages, which Fortune 500 customers do you have, and is Quantum AI SOC 2 certified?',
        },
      ],
      storeOpts
    );
    assert.ok(missingQuery.missingFactTopics.includes('pricing_and_quotes'));
    assert.ok(missingQuery.missingFactTopics.includes('customers_and_client_list'));
    assert.ok(missingQuery.missingFactTopics.includes('certifications_and_compliance'));
    assert.ok(missingQuery.formattedContextBlock.includes('UNVERIFIED / UNPUBLISHED TOPIC GUARD'));
    pass('Missing-company-info probe triggers anti-fabrication guardrails cleanly');

    // ─── 5. Tool Integration (`query_quantum_ai_knowledge`) ─────────────────
    const toolRes = await executeToolCall(
      'query_quantum_ai_knowledge',
      { query: 'Peshawar services FAQ', category: 'faq' },
      { permissions: ['public_read', 'compute'] }
    );
    assert.equal(toolRes.status, 'success');
    assert.ok((toolRes.result?.results || []).length >= 1);
    pass('Backend tool `query_quantum_ai_knowledge` queries indexed knowledge store cleanly');

    // ─── 6. Identity & Accuracy System Prompt Enforcement ────────────────────
    const activeModel = MODEL_REGISTRY[0];
    const promptWithWebOff = buildSystemInstruction({
      activeModel,
      enableWebSearch: false,
      availableToolNames: ['calculate', 'query_quantum_ai_knowledge'],
    });
    assert.ok(promptWithWebOff.includes(QUANTUMBOT_IDENTITY_STATEMENT));
    assert.ok(promptWithWebOff.includes('NEVER claim to be ChatGPT, Gemini, or Claude'));
    assert.ok(promptWithWebOff.includes('capabilities depend on the currently selected AI model'));
    assert.ok(promptWithWebOff.includes('Live Web Research is currently DISABLED'));

    const promptTextOnly = buildSystemInstruction({
      activeModel: { ...activeModel, capabilities: ['tools', 'streaming'] },
      enableWebSearch: true,
      availableToolNames: ['calculate', 'query_quantum_ai_knowledge', 'web_search'],
    });
    assert.ok(promptTextOnly.includes('NOT supported by current model'));
    assert.ok(promptTextOnly.includes('Live Web Research is currently ENABLED'));
    pass('System prompt enforces QuantumBot identity, non-impersonation, and model/tool transparency');

    // ─── 7. Live LLM Check (All 4 Phase 6 Scenarios on Gemini 3.5 Flash-Lite) ─
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY
    );
    if (hasGeminiKey) {
      const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
      try {
        // 7a. Company Identity + Model/Tools Explanation + Non-impersonation
        let idOut = '';
        await executeQuantumBotChat({
          modelId: 'gemini-3.5-flash-lite',
          messages: [
            {
              id: 'p6-live-id',
              role: 'user',
              content:
                'Who are you, are you ChatGPT or Gemini or Claude, and how do your capabilities work?',
            },
          ],
          enableTools: false,
          onChunk: (c) => {
            if (c.type === 'text' && c.text) idOut += c.text;
          },
        });
        assert.ok(idOut.toLowerCase().includes('quantumbot'), `Expected QuantumBot self-id, got: ${idOut}`);
        assert.ok(idOut.toLowerCase().includes('quantum ai'), `Expected Quantum AI attribution, got: ${idOut}`);
        assert.ok(!/\bi am (?:chatgpt|gemini|claude)\b/i.test(idOut), `Must never claim to be ChatGPT/Gemini/Claude: ${idOut}`);
        assert.ok(
          /model|tool/i.test(idOut),
          `Expected explanation that capabilities depend on selected model/tools: ${idOut}`
        );
        pass(`Live LLM identity & model/tool disclosure passed`);

        // 7b. Pure General Question (no forced Quantum AI promotion)
        await pause(1200);
        let genOut = '';
        const genRes = await executeQuantumBotChat({
          modelId: 'gemini-3.5-flash-lite',
          messages: [
            {
              id: 'p6-live-gen',
              role: 'user',
              content: 'What is the time complexity of binary search on a sorted array of n items? Reply in 2 sentences.',
            },
          ],
          enableTools: true,
          onChunk: (c) => {
            if (c.type === 'text' && c.text) genOut += c.text;
          },
        });
        assert.match(genOut, /log/i);
        assert.equal(
          (genRes.toolCalls || []).some((tc) => tc.name === 'query_quantum_ai_knowledge'),
          false,
          'General CS question should not call company RAG tool'
        );
        pass('Live LLM answers general question directly without company RAG');

        // 7c. Mixed Question (General + Quantum AI)
        await pause(1200);
        let mixedOut = '';
        await executeQuantumBotChat({
          modelId: 'gemini-3.5-flash-lite',
          messages: [
            {
              id: 'p6-live-mixed',
              role: 'user',
              content:
                'How does offline-first software sync generally handle conflict resolution, and what offline system has Quantum AI built?',
            },
          ],
          enableTools: true,
          onChunk: (c) => {
            if (c.type === 'text' && c.text) mixedOut += c.text;
          },
        });
        assert.ok(
          /offline\s+shop|retail|pos/i.test(mixedOut),
          `Expected verified Offline Shop Management System in mixed response: ${mixedOut}`
        );
        assert.ok(
          /timestamp|conflict|sync|queue|version/i.test(mixedOut),
          `Expected general sync/conflict guidance in mixed response: ${mixedOut}`
        );
        pass('Live LLM blends verified Quantum AI project facts with general engineering guidance');

        // 7d. Missing-Company-Info Guardrail (No fabricated pricing or SOC 2 certification)
        await pause(1200);
        let missingOut = '';
        await executeQuantumBotChat({
          modelId: 'gemini-3.5-flash-lite',
          messages: [
            {
              id: 'p6-live-missing',
              role: 'user',
              content:
                'What are Quantum AI exact fixed pricing packages in USD and is Quantum AI officially SOC 2 Type II certified?',
            },
          ],
          enableTools: false,
          onChunk: (c) => {
            if (c.type === 'text' && c.text) missingOut += c.text;
          },
        });
        assert.ok(
          /not\s+publish|does\s+not\s+(?:publish|list|have)|no\s+(?:published|verified)|not\s+verified/i.test(
            missingOut
          ),
          `Expected honest statement that pricing & SOC 2 certification are unpublished: ${missingOut}`
        );
        assert.ok(!/\$\d{2,}/.test(missingOut), `Must not invent dollar pricing: ${missingOut}`);
        pass('Live LLM refuses to fabricate unpublished pricing or SOC 2 certification');
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (/quota|429|resource_exhausted/i.test(msg)) {
          console.log(
            `INFO: Live Gemini API probe skipped due to upstream free-tier quota limit (${msg.slice(0, 140)}...).`
          );
        } else {
          throw err;
        }
      }
    }

    console.log(`\nALL PHASE 6 ASSERTIONS PASSED (${passed} checks).`);
  } finally {
    fs.rmSync(tmpStoreDir, { recursive: true, force: true });
  }
}

runPhase6Tests().catch((err) => {
  console.error('\nPhase 6 test failure:', err);
  process.exit(1);
});
