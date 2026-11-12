import crypto from 'node:crypto';
import {
  BotPermission,
  BotTool,
  BotToolContext,
  ToolActionPreview,
  ToolExecutionStatus,
} from '../types';
import { BotToolImplementation } from './types';
import { validateToolArguments } from './schema-validator';
import { systemTimeTool } from './system-time';
import { calculatorTool } from './calculator';
import { companyKnowledgeTool } from './company-knowledge';
import { webSearchTool } from './web-search';
import { webFetchTool } from './web-fetch';
import { contactInquiryTool } from './contact-inquiry';

const DEFAULT_TOOL_TIMEOUT_MS = 5000;

// Conservative fallback permissions for direct internal callers that omit permissions:
// external_write & web_research are NEVER granted silently without explicit opt-in.
const DEFAULT_CALLER_PERMISSIONS: BotPermission[] = ['public_read', 'compute'];

export const STANDARD_BOT_TOOLS: BotToolImplementation[] = [
  systemTimeTool,
  calculatorTool,
  companyKnowledgeTool,
  webSearchTool,
  webFetchTool,
  contactInquiryTool,
];

export interface ExecutedToolOutcome {
  result: any;
  isError: boolean;
  status: ToolExecutionStatus;
  durationMs: number;
  confirmationRequired?: boolean;
  actionPreview?: ToolActionPreview;
}

export function getToolByName(name: string): BotToolImplementation | undefined {
  return STANDARD_BOT_TOOLS.find((t) => t.declaration.name === name);
}

/**
 * Computes a stable canonical key for a confirmed sensitive tool invocation so
 * user approval binds strictly to exact (toolName, arguments) and cannot be replayed
 * with altered parameters.
 */
export function computeActionKey(toolName: string, args: Record<string, any>): string {
  const sortObjectKeys = (input: any): any => {
    if (Array.isArray(input)) return input.map(sortObjectKeys);
    if (input && typeof input === 'object') {
      const sorted: Record<string, any> = {};
      for (const k of Object.keys(input).sort()) {
        sorted[k] = sortObjectKeys(input[k]);
      }
      return sorted;
    }
    return input;
  };

  const canonical = JSON.stringify({ toolName, args: sortObjectKeys(args || {}) });
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 24);
}

/**
 * Returns only tools enabled for the active request context & permissions.
 * Ensures the AI model never sees `web_search` / `web_fetch` unless Web Search is enabled.
 */
export function getAvailableToolsForContext(
  context: BotToolContext = {},
  registry: BotToolImplementation[] = STANDARD_BOT_TOOLS
): BotTool[] {
  const callerPerms = new Set<BotPermission>(context.permissions ?? DEFAULT_CALLER_PERMISSIONS);

  return registry.filter((tool) => {
    const required = tool.declaration.requiredPermissions ?? [];
    for (const perm of required) {
      if (!callerPerms.has(perm)) return false;
    }
    if (tool.isEnabled && !tool.isEnabled(context)) {
      return false;
    }
    return true;
  });
}

/**
 * Central Secure Tool Executor:
 * 1. Verifies tool exists in registry
 * 2. Verifies feature/context availability (e.g. Web Research toggle)
 * 3. Verifies caller holds required permissions
 * 4. Strictly validates & sanitizes input arguments against schema
 * 5. Enforces confirmation gate on sensitive/external-write actions
 * 6. Executes within bounded timeout and returns structured audit outcome
 */
export async function executeToolCall(
  name: string,
  args: Record<string, any>,
  context: BotToolContext = {},
  registry: BotToolImplementation[] = STANDARD_BOT_TOOLS
): Promise<ExecutedToolOutcome> {
  const t0 = Date.now();
  const tool = registry.find((t) => t.declaration.name === name);

  if (!tool) {
    return {
      result: {
        error: `Tool "${name}" is not registered or is unavailable in QuantumBot.`,
        availableTools: registry.map((t) => t.declaration.name),
      },
      isError: true,
      status: 'unavailable',
      durationMs: Date.now() - t0,
    };
  }

  // 1. Check availability toggle (e.g. Web Search off)
  if (tool.isEnabled && !tool.isEnabled(context)) {
    return {
      result: {
        error: `Tool "${name}" is currently disabled for this session.`,
        reason:
          tool.declaration.category === 'web'
            ? 'Web Search is currently turned OFF by the user. Answer from model knowledge or ask the user to enable Web Search.'
            : 'Tool is disabled in the active context.',
      },
      isError: true,
      status: 'unavailable',
      durationMs: Date.now() - t0,
    };
  }

  // 2. Permission check
  const callerPerms = new Set<BotPermission>(context.permissions ?? DEFAULT_CALLER_PERMISSIONS);
  const requiredPerms = tool.declaration.requiredPermissions ?? [];
  const missingPerms = requiredPerms.filter((p) => !callerPerms.has(p));

  if (missingPerms.length > 0) {
    return {
      result: {
        error: `Permission denied: tool "${name}" requires permission(s) [${missingPerms.join(', ')}].`,
        missingPermissions: missingPerms,
      },
      isError: true,
      status: 'denied',
      durationMs: Date.now() - t0,
    };
  }

  // 3. Schema validation & argument sanitization
  const validation = validateToolArguments(tool.declaration.parameters, args);
  if (!validation.valid) {
    return {
      result: {
        error: `Invalid arguments for tool "${name}": ${validation.errors.join(' ')}`,
        validationErrors: validation.errors,
      },
      isError: true,
      status: 'error',
      durationMs: Date.now() - t0,
    };
  }

  const sanitizedArgs = validation.sanitizedArgs;

  // 4. Explicit confirmation gate for sensitive / externally visible actions
  if (tool.declaration.requiresConfirmation) {
    const actionKey = computeActionKey(name, sanitizedArgs);
    const isApproved = Boolean(context.approvedActionKeys?.includes(actionKey));

    if (!isApproved) {
      const previewContent = tool.formatConfirmationPreview
        ? tool.formatConfirmationPreview(sanitizedArgs)
        : {
            title: `Confirm Action: ${name}`,
            summary: `QuantumBot wants to execute "${name}". Review the parameters before confirming.`,
            fields: Object.entries(sanitizedArgs).map(([k, v]) => ({
              label: k,
              value: typeof v === 'string' ? v : JSON.stringify(v),
            })),
          };

      const actionPreview: ToolActionPreview = {
        toolName: name,
        actionKey,
        title: previewContent.title,
        summary: previewContent.summary,
        fields: previewContent.fields,
        arguments: sanitizedArgs,
      };

      return {
        result: {
          status: 'confirmation_required',
          confirmationRequired: true,
          actionKey,
          message:
            'This action requires explicit user confirmation before executing. Wait for the user to approve or cancel.',
          actionPreview,
        },
        isError: false,
        status: 'confirmation_required',
        confirmationRequired: true,
        actionPreview,
        durationMs: Date.now() - t0,
      };
    }
  }

  // 5. Execute inside bounded timeout
  const timeoutMs = tool.declaration.timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const executionPromise = Promise.resolve().then(() => tool.execute(sanitizedArgs, context));
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Tool "${name}" timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    });

    const result = await Promise.race([executionPromise, timeoutPromise]);
    if (timer) clearTimeout(timer);

    const reportedFailure = Boolean(result && typeof result === 'object' && result.available === false);

    return {
      result,
      isError: reportedFailure,
      status: reportedFailure ? 'unavailable' : 'success',
      durationMs: Date.now() - t0,
    };
  } catch (err: any) {
    if (timer) clearTimeout(timer);
    const message = err?.message || 'Tool execution encountered an internal error.';
    const isTimeout = /timed out/i.test(message);

    return {
      result: { error: message },
      isError: true,
      status: isTimeout ? 'timeout' : 'error',
      durationMs: Date.now() - t0,
    };
  }
}
