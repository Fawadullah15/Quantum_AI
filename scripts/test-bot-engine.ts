/**
 * QuantumBot Phase 2 Engine Verification Test Suite
 * Tests Model Registry, Context Manager, Tools, Adapters, and Engine Pipeline.
 */

import { getRegisteredModels, resolveActiveModel, getModelById } from '../lib/bot/models';
import { prepareConversationContext, estimateTokens } from '../lib/bot/context-manager';
import { buildSystemInstruction } from '../lib/bot/prompt';
import { executeToolCall } from '../lib/bot/tools';
import { getProviderAdapter } from '../lib/bot/providers';
import { BotMessage } from '../lib/bot/types';

async function runTests() {
  console.log('====================================================');
  console.log('🤖 QUANTUMBOT PHASE 2: AI ENGINE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // TEST SUITE 1: Model Registry
  console.log('--- 1. MODEL REGISTRY TESTS ---');
  const models = getRegisteredModels();
  assert(models.length >= 8, 'Model registry contains at least 8 models', `Found ${models.length}`);

  const geminiModels = models.filter((m) => m.provider === 'gemini');
  const openaiModels = models.filter((m) => m.provider === 'openai');
  const anthropicModels = models.filter((m) => m.provider === 'anthropic');
  const openweightModels = models.filter((m) => m.provider === 'openweight');

  assert(geminiModels.length > 0, 'Gemini models registered');
  assert(openaiModels.length > 0, 'OpenAI models registered');
  assert(anthropicModels.length > 0, 'Anthropic models registered');
  assert(openweightModels.length > 0, 'Open-weight models registered (Llama/Qwen/DeepSeek)');

  const gpt4o = getModelById('gpt-4o');
  assert(
    !!gpt4o && gpt4o.capabilities.includes('vision') && gpt4o.capabilities.includes('tools'),
    'GPT-4o has vision & tools capabilities'
  );

  const active = resolveActiveModel();
  assert(!!active.model, `Active model resolved: ${active.model.name} (${active.model.id})`);
  assert(typeof active.isFallback === 'boolean', 'Active model fallback flag present');

  // TEST SUITE 2: System Instructions & Persona
  console.log('\n--- 2. SYSTEM INSTRUCTIONS & PERSONA TESTS ---');
  const prompt = buildSystemInstruction('Always speak concisely.');
  assert(prompt.includes('QuantumBot'), 'Prompt includes QuantumBot persona');
  assert(prompt.includes('Quantum AI'), 'Prompt includes Quantum AI company context');
  assert(prompt.includes('LaTeX'), 'Prompt includes LaTeX math notation directives');
  assert(prompt.includes('Always speak concisely.'), 'Custom user instructions incorporated');

  // TEST SUITE 3: Context Manager & Long-Context Trimming
  console.log('\n--- 3. CONTEXT MANAGEMENT & TRIMMING TESTS ---');
  const shortText = 'Hello, QuantumBot!';
  const shortTokens = estimateTokens(shortText);
  assert(shortTokens > 0 && shortTokens < 10, 'Token estimation is reasonable', `Got ${shortTokens}`);

  // Create a simulated 30-message conversation
  const syntheticMessages: BotMessage[] = [];
  for (let i = 1; i <= 30; i++) {
    syntheticMessages.push({
      id: `msg-${i}`,
      role: i % 2 === 1 ? 'user' : 'assistant',
      content: `Message ${i}: ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(15)}`,
    });
  }

  // Test trimming with a restricted model
  const mockSmallModel = {
    ...models[0],
    contextWindow: 1000, // Small window to trigger trimming
  };

  const contextResult = prepareConversationContext(syntheticMessages, mockSmallModel, prompt);
  assert(
    contextResult.prunedCount > 0,
    'Context trimmer correctly prunes when exceeding limit',
    `Pruned ${contextResult.prunedCount} messages`
  );
  assert(contextResult.messages.length < syntheticMessages.length, 'Retained messages count is reduced');
  assert(
    contextResult.messages[contextResult.messages.length - 1].content.includes('Message 30'),
    'Latest message is strictly preserved'
  );

  // TEST SUITE 4: Built-in Tools
  console.log('\n--- 4. BUILT-IN TOOLS EXECUTION TESTS ---');

  // 4.1 System Time Tool
  const timeCall = await executeToolCall('get_current_time', {});
  assert(!timeCall.isError && typeof timeCall.result?.iso === 'string', 'get_current_time returns ISO timestamp');

  // 4.2 Safe Calculator Tool
  const calc1 = await executeToolCall('calculate', { expression: '25 * 4 + Math.sqrt(144)' });
  assert(!calc1.isError && calc1.result?.result === 112, 'Calculator evaluates valid arithmetic & math functions', `Result: ${calc1.result?.result}`);

  const calc2 = await executeToolCall('calculate', { expression: 'process.exit(1)' });
  assert(!calc2.isError && !!calc2.result?.error, 'Calculator blocks unauthorized JS identifiers (process/eval/window)');

  // 4.3 Quantum AI Knowledge Tool
  const know1 = await executeToolCall('query_quantum_ai_knowledge', { query: 'contact' });
  const hasSupportEmail = know1.result?.results?.some((r: any) => r.content.includes('support@quantumaitech.org'));
  assert(!know1.isError && hasSupportEmail, 'Company knowledge returns verified support@quantumaitech.org email');

  // 4.4 Web Search Tool (graceful fallback)
  const searchCall = await executeToolCall('web_search', { query: 'Next.js 16 release notes' });
  assert(!searchCall.isError && Array.isArray(searchCall.result?.results), 'Web search handles request safely');

  // 4.5 Unknown tool handling
  const unknownCall = await executeToolCall('non_existent_tool', {});
  assert(unknownCall.isError && unknownCall.result?.error?.includes('not registered'), 'Dispatcher safely catches unknown tools');

  // TEST SUITE 5: Provider Adapters & Credential Verification
  console.log('\n--- 5. PROVIDER ADAPTERS & CREDENTIAL VERIFICATION TESTS ---');
  for (const provider of ['gemini', 'openai', 'anthropic', 'openweight'] as const) {
    const adapter = getProviderAdapter(provider);
    assert(adapter.id === provider, `Adapter for "${provider}" initialized properly`);

    // Connection verification without keys should fail gracefully, NOT throw unhandled exceptions
    const verification = await adapter.verifyConnection();
    assert(
      typeof verification.success === 'boolean',
      `Adapter "${provider}" verifyConnection() returned clean status (configured: ${adapter.isConfigured()}, verified: ${verification.success})`
    );
  }

  // TEST SUITE 6: Engine Orchestrator
  console.log('\n--- 6. QUANTUMBOT ENGINE ORCHESTRATION TESTS ---');
  const chunksReceived: any[] = [];
  try {
    const { executeQuantumBotChat } = await import('../lib/bot/engine');
    await executeQuantumBotChat({
      messages: [{ id: '1', role: 'user', content: 'What is Quantum AI?' }],
      onChunk: (chunk) => {
        chunksReceived.push(chunk);
      },
    });
  } catch (engineErr: any) {
    // Should catch the unconfigured provider gracefully
    assert(
      chunksReceived.some((c) => c.type === 'error'),
      'Engine pipeline emits structured error chunk on missing provider key'
    );
    assert(
      engineErr.message.includes('not configured'),
      'Engine pipeline throws clear configuration guidance'
    );
  }

  // SUMMARY
  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
