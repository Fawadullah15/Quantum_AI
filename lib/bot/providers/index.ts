import {
  AIProvider,
  ProviderAdapter,
  ProviderConnectionStatus,
  ChatRequest,
  ChatResponse,
  StreamChunk,
} from '../types';
import { GeminiProviderAdapter } from './gemini';
import { OpenAIProviderAdapter } from './openai';
import { AnthropicProviderAdapter } from './anthropic';
import { OpenWeightProviderAdapter } from './openweight';

const adapters: Record<AIProvider, ProviderAdapter> = {
  gemini: new GeminiProviderAdapter(),
  openai: new OpenAIProviderAdapter(),
  anthropic: new AnthropicProviderAdapter(),
  openweight: new OpenWeightProviderAdapter(),
};

export function getProviderAdapter(provider: AIProvider): ProviderAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: "${provider}".`);
  }
  return adapter;
}

export function getAllAdapters(): ProviderAdapter[] {
  return Object.values(adapters);
}

export async function checkAllProviderStatuses(): Promise<ProviderConnectionStatus[]> {
  const statuses: ProviderConnectionStatus[] = [];

  for (const adapter of Object.values(adapters)) {
    const isConfigured = adapter.isConfigured();
    let verified = false;
    let latencyMs: number | undefined;
    let error: string | undefined;

    if (isConfigured) {
      const check = await adapter.verifyConnection();
      verified = check.success;
      latencyMs = check.latencyMs;
      error = check.error;
    } else {
      error = 'Credentials not configured';
    }

    statuses.push({
      provider: adapter.id,
      configured: isConfigured,
      verified,
      latencyMs,
      error,
      supportedModels: [],
    });
  }

  return statuses;
}
