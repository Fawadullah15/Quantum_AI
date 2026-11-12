import { ModelDefinition } from './types';
import { getProviderAdapter } from './providers';
import { BUILT_IN_MODELS } from './default-models';
import {
  AdminConfigStoreOptions,
  getAdminConfigSnapshot,
  getEffectiveModelsFromSnapshot,
  resolveProviderRuntimeConfig,
} from './admin-config';

/**
 * Master Static Catalog of Built-In Frontier & Open-Weight Models
 * (Merged at runtime with dynamic Admin Panel overrides & custom models)
 */
export const MODEL_REGISTRY: ModelDefinition[] = BUILT_IN_MODELS;

export interface VerifiedModelEntry extends ModelDefinition {
  isAvailable: boolean;
  unavailabilityReason?: string;
}

/**
 * Returns all built-in + custom models accompanied by dynamic availability & admin governance status.
 */
export function getRegisteredModels(options?: AdminConfigStoreOptions): VerifiedModelEntry[] {
  const snap = getAdminConfigSnapshot(options);
  const effectiveModels = getEffectiveModelsFromSnapshot(snap);

  return effectiveModels.map((model) => {
    try {
      const adapter = getProviderAdapter(model.provider);
      const providerRuntime = resolveProviderRuntimeConfig(model.provider, options);

      if (!providerRuntime.enabled) {
        return {
          ...model,
          isAvailable: false,
          unavailabilityReason: `Provider "${adapter.name}" is disabled by administrator.`,
        };
      }

      if (model.enabled === false) {
        return {
          ...model,
          isAvailable: false,
          unavailabilityReason: `Model "${model.name}" is disabled by administrator.`,
        };
      }

      const isConfigured = options ? Boolean(providerRuntime.apiKey) : adapter.isConfigured();
      return {
        ...model,
        isAvailable: isConfigured,
        unavailabilityReason: isConfigured
          ? undefined
          : `Provider "${adapter.name}" credentials are not configured.`,
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
 * Returns ONLY enabled models whose provider credentials are configured and active.
 */
export function getAvailableModels(options?: AdminConfigStoreOptions): ModelDefinition[] {
  return getRegisteredModels(options).filter((m) => m.enabled !== false && m.isAvailable);
}

/**
 * Finds a model definition by ID across both built-in and admin custom models.
 */
export function getModelById(
  id: string,
  options?: AdminConfigStoreOptions
): ModelDefinition | undefined {
  const snap = getAdminConfigSnapshot(options);
  return getEffectiveModelsFromSnapshot(snap).find((m) => m.id === id);
}

/**
 * Checks whether a requested model ID (or its provider) was explicitly disabled by an administrator.
 */
export function isModelExplicitlyDisabled(
  requestedModelId?: string,
  options?: AdminConfigStoreOptions
): { disabled: boolean; reason?: string } {
  if (!requestedModelId) return { disabled: false };
  const snap = getAdminConfigSnapshot(options);
  const model = getEffectiveModelsFromSnapshot(snap).find((m) => m.id === requestedModelId);
  if (!model) return { disabled: false };

  const providerRuntime = resolveProviderRuntimeConfig(model.provider, options);
  if (!providerRuntime.enabled) {
    return {
      disabled: true,
      reason: `Provider "${model.provider}" is currently disabled by an administrator.`,
    };
  }
  if (model.enabled === false) {
    return {
      disabled: true,
      reason: `Model "${model.name}" is currently disabled by an administrator. Please choose another active model.`,
    };
  }
  return { disabled: false };
}

/**
 * Resolves the active model to execute against.
 * Respects admin-configured default, enabled flags, custom models, and provider credentials.
 */
export function resolveActiveModel(
  requestedModelId?: string,
  options?: AdminConfigStoreOptions
): {
  model: ModelDefinition;
  isFallback: boolean;
  fallbackReason?: string;
} {
  const registered = getRegisteredModels(options);
  const available = registered.filter((m) => m.enabled !== false && m.isAvailable);

  if (available.length === 0) {
    const enabledFallback = registered.find((m) => m.enabled !== false) || BUILT_IN_MODELS[0];
    return {
      model: enabledFallback,
      isFallback: true,
      fallbackReason:
        'No active AI provider credentials configured. Configure provider keys in Admin → QuantumBot or .env.local.',
    };
  }

  // 1. Try requested model if enabled and available
  if (requestedModelId) {
    const found = available.find((m) => m.id === requestedModelId);
    if (found) {
      return { model: found, isFallback: false };
    }
  }

  // 2. Respect admin-designated default model if available
  const defaultAvailable = available.find((m) => m.isDefault);
  if (defaultAvailable) {
    return {
      model: defaultAvailable,
      isFallback: requestedModelId !== undefined && requestedModelId !== defaultAvailable.id,
      fallbackReason: requestedModelId
        ? `Requested model "${requestedModelId}" is unavailable. Using default ${defaultAvailable.name}.`
        : undefined,
    };
  }

  // 3. Environment default override fallback
  const envDefaultId = process.env.BOT_DEFAULT_MODEL?.trim();
  if (envDefaultId) {
    const envFound = available.find((m) => m.id === envDefaultId);
    if (envFound) {
      return {
        model: envFound,
        isFallback: requestedModelId !== undefined && requestedModelId !== envFound.id,
        fallbackReason: requestedModelId
          ? `Requested model "${requestedModelId}" is unavailable. Using default ${envFound.name}.`
          : undefined,
      };
    }
  }

  // 4. First available active model
  return {
    model: available[0],
    isFallback: true,
    fallbackReason: requestedModelId
      ? `Requested model "${requestedModelId}" is unavailable. Falling back to ${available[0].name}.`
      : undefined,
  };
}
