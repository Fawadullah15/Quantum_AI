import { ModelDefinition, AIProvider } from './types';
import { getProviderAdapter } from './providers';

/**
 * Master Registry of Supported Frontier & Open-Weight Models
 */
export const MODEL_REGISTRY: ModelDefinition[] = [
  // ─── Google Gemini ──────────────────────────────────────────
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'gemini',
    modelIdentifier: 'gemini-3.5-flash',
    description: 'High-speed multimodal frontier model with native PDF vision, image understanding, and 1M context.',
    capabilities: ['vision', 'tools', 'streaming', 'json', 'long_context'],
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
    isDefault: true,
    recommendedFor: 'Fast general-purpose QA, coding, document & image synthesis',
    family: 'Google Gemini',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    modelIdentifier: 'gemini-3.8-flash',
    description: 'Latest balanced Gemini Flash model engineered for agentic tool use and multimodal reasoning.',
    capabilities: ['vision', 'tools', 'streaming', 'json', 'long_context'],
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    pricing: { inputPerMillion: 0.2, outputPerMillion: 0.8 },
    recommendedFor: 'Balanced agentic workflows, coding, multimodal reasoning',
    family: 'Google Gemini',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    provider: 'gemini',
    modelIdentifier: 'gemini-3.5-flash-lite',
    description: 'Ultra-low-latency multimodal Gemini model optimized for rapid responses and high throughput.',
    capabilities: ['vision', 'tools', 'streaming', 'json', 'long_context'],
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    pricing: { inputPerMillion: 0.075, outputPerMillion: 0.3 },
    recommendedFor: 'High-speed document Q&A and lightweight tasks',
    family: 'Google Gemini',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    provider: 'gemini',
    modelIdentifier: 'gemini-4-argon',
    description: 'Flagship deep-reasoning Gemini model for complex software architecture, scientific math, and synthesis.',
    capabilities: ['vision', 'tools', 'streaming', 'json', 'long_context', 'code_execution'],
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    pricing: { inputPerMillion: 1.5, outputPerMillion: 6.0 },
    recommendedFor: 'Complex coding, mathematical proofs, deep research',
    family: 'Google Gemini',
  },

  // ─── OpenAI ────────────────────────────────────────────────
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    modelIdentifier: 'gpt-4o',
    description: 'Flagship versatile multimodal model with strong cross-domain reasoning and tool calling.',
    capabilities: ['vision', 'tools', 'streaming', 'json', 'long_context'],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    pricing: { inputPerMillion: 2.5, outputPerMillion: 10.0 },
    recommendedFor: 'Broad general reasoning, technical problem-solving, structured data',
    family: 'OpenAI GPT',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    modelIdentifier: 'gpt-4o-mini',
    description: 'Lightweight, rapid-response model designed for efficient multi-turn dialogue.',
    capabilities: ['vision', 'tools', 'streaming', 'json'],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
    recommendedFor: 'Cost-efficient rapid chat and everyday queries',
    family: 'OpenAI GPT',
  },

  // ─── Anthropic Claude ──────────────────────────────────────
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    modelIdentifier: 'claude-3-5-sonnet-20241022',
    description: 'State-of-the-art coding, nuanced writing, and visual chart/document interpretation.',
    capabilities: ['vision', 'tools', 'streaming', 'long_context'],
    contextWindow: 200000,
    maxOutputTokens: 8192,
    pricing: { inputPerMillion: 3.0, outputPerMillion: 15.0 },
    recommendedFor: 'Exceptional programming, nuanced prose, structural architectural planning',
    family: 'Anthropic Claude',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    modelIdentifier: 'claude-3-5-haiku-20241022',
    description: 'Fastest Anthropic model with blazing response generation for rapid interactions.',
    capabilities: ['tools', 'streaming'],
    contextWindow: 200000,
    maxOutputTokens: 4096,
    pricing: { inputPerMillion: 0.8, outputPerMillion: 4.0 },
    recommendedFor: 'Fast iterative writing and lightweight technical Q&A',
    family: 'Anthropic Claude',
  },

  // ─── Open-Weight Models (Groq / OpenRouter) ────────────────
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'openweight',
    modelIdentifier: 'llama-3.3-70b-versatile',
    description: 'Leading open-weight instruction model with competitive frontier reasoning and high speed.',
    capabilities: ['tools', 'streaming', 'long_context'],
    contextWindow: 128000,
    maxOutputTokens: 4096,
    pricing: { inputPerMillion: 0.59, outputPerMillion: 0.79 },
    recommendedFor: 'Open-source general intelligence and fast dialogue',
    family: 'Meta Llama',
  },
  {
    id: 'qwen-2.5-coder-32b',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'openweight',
    modelIdentifier: 'qwen/qwen-2.5-coder-32b-instruct',
    description: 'Specialized code generation, debugging, refactoring, and software system modeling.',
    capabilities: ['tools', 'streaming', 'long_context'],
    contextWindow: 131072,
    maxOutputTokens: 4096,
    pricing: { inputPerMillion: 0.35, outputPerMillion: 0.55 },
    recommendedFor: 'Code assistance, algorithm development, repository analysis',
    family: 'Alibaba Qwen',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'openweight',
    modelIdentifier: 'deepseek/deepseek-r1',
    description: 'Reinforcement-learning driven open reasoning model with explicit verification steps.',
    capabilities: ['streaming', 'long_context'],
    contextWindow: 65536,
    maxOutputTokens: 8192,
    pricing: { inputPerMillion: 0.55, outputPerMillion: 2.19 },
    recommendedFor: 'Deep step-by-step mathematical reasoning and logic proofs',
    family: 'DeepSeek',
  },
];

export interface VerifiedModelEntry extends ModelDefinition {
  isAvailable: boolean;
  unavailabilityReason?: string;
}

/**
 * Returns all models accompanied by dynamic availability status based on configured credentials.
 */
export function getRegisteredModels(): VerifiedModelEntry[] {
  return MODEL_REGISTRY.map((model) => {
    try {
      const adapter = getProviderAdapter(model.provider);
      const isConfigured = adapter.isConfigured();
      return {
        ...model,
        isAvailable: isConfigured,
        unavailabilityReason: isConfigured
          ? undefined
          : `Provider "${adapter.name}" credentials are not configured in environment.`,
      };
    } catch (err: any) {
      return {
        ...model,
        isAvailable: false,
        unavailabilityReason: err?.message || 'Adapter error',
      };
    }
  });
}

/**
 * Returns ONLY models whose provider credentials have been verified and configured.
 * Strictly adheres to rule: "Never advertise a model as available unless its credentials and connection have been verified."
 */
export function getAvailableModels(): ModelDefinition[] {
  return getRegisteredModels().filter((m) => m.isAvailable);
}

/**
 * Finds a model definition by ID. Returns undefined if not recognized.
 */
export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}

/**
 * Resolves the active model to execute against.
 * If the requested model is configured and available, returns it.
 * Otherwise, falls back gracefully to the first available model.
 */
export function resolveActiveModel(requestedModelId?: string): {
  model: ModelDefinition;
  isFallback: boolean;
  fallbackReason?: string;
} {
  const available = getAvailableModels();

  if (available.length === 0) {
    // If no external providers have keys set, return default Gemini model definition
    // with a clear indicator so callers can handle or return instructional guidance.
    const defaultDef = MODEL_REGISTRY[0];
    return {
      model: defaultDef,
      isFallback: true,
      fallbackReason:
        'No AI provider API keys configured on server. Configure GEMINI_API_KEY or OPENAI_API_KEY in .env.local.',
    };
  }

  // 1. Try requested model if available
  if (requestedModelId) {
    const found = available.find((m) => m.id === requestedModelId);
    if (found) {
      return { model: found, isFallback: false };
    }
  }

  // 2. Try configured environment default override (BOT_DEFAULT_MODEL)
  const envDefaultId = process.env.BOT_DEFAULT_MODEL?.trim();
  if (envDefaultId) {
    const envFound = available.find((m) => m.id === envDefaultId);
    if (envFound) {
      return {
        model: envFound,
        isFallback: requestedModelId !== undefined && requestedModelId !== envFound.id,
        fallbackReason: requestedModelId
          ? `Requested model "${requestedModelId}" is not currently configured. Using default ${envFound.name}.`
          : undefined,
      };
    }
  }

  // 3. Try default marked model if available
  const defaultAvailable = available.find((m) => m.isDefault);
  if (defaultAvailable) {
    return {
      model: defaultAvailable,
      isFallback: requestedModelId !== undefined && requestedModelId !== defaultAvailable.id,
      fallbackReason: requestedModelId
        ? `Requested model "${requestedModelId}" is not currently configured. Using default ${defaultAvailable.name}.`
        : undefined,
    };
  }

  // 3. Fallback to first available model
  return {
    model: available[0],
    isFallback: true,
    fallbackReason: requestedModelId
      ? `Requested model "${requestedModelId}" is not configured. Falling back to ${available[0].name}.`
      : undefined,
  };
}
