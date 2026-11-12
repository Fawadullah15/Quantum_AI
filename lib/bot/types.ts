/**
 * QuantumBot AI Engine — Universal Type Definitions
 * Supports Google Gemini, OpenAI-compatible APIs, Anthropic Claude, and Open-Weight models.
 */

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'openweight';

export type BotRole = 'system' | 'user' | 'assistant' | 'tool';

export type ModelCapability =
  | 'vision'           // Multimodal image reasoning
  | 'tools'            // Function calling & tool execution
  | 'streaming'        // Real-time chunked/token generation
  | 'json'             // Structured JSON mode
  | 'code_execution'   // Built-in or sandboxed code evaluation
  | 'long_context';    // >= 128k context window

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export interface ModelDefinition {
  id: string;                     // e.g. 'gemini-3.5-flash', 'gpt-4o', 'claude-3-5-sonnet'
  name: string;                   // Display name e.g. 'Gemini 3.5 Flash'
  provider: AIProvider;           // Underlying provider adapter
  modelIdentifier: string;        // Exact provider API model string
  description: string;            // Short capability description
  capabilities: ModelCapability[];
  contextWindow: number;          // Total token context limit
  maxOutputTokens: number;        // Max generation tokens
  pricing: ModelPricing;          // USD per million tokens
  isDefault?: boolean;            // Whether this is the system default model
  enabled?: boolean;              // Admin governance: enabled/disabled toggle (default true)
  isCustom?: boolean;             // Whether added dynamically via Admin Panel
  recommendedFor?: string;        // e.g. 'Coding & Deep Reasoning', 'Fast General QA'
  family?: string;                // e.g. 'Google Gemini', 'OpenAI GPT', 'Anthropic Claude', 'Meta Llama'
  isAvailable?: boolean;          // Dynamically verified server provider configuration
  unavailabilityReason?: string;  // Clear reason if provider credentials are unconfigured
}

export type AttachmentKind = 'image' | 'pdf' | 'document' | 'spreadsheet' | 'code' | 'text';
export type AttachmentStatus = 'uploading' | 'processing' | 'ready' | 'expired' | 'error';

export interface AttachmentExtractionSummary {
  pageCount?: number;
  sheetNames?: string[];
  rowCount?: number;
  columnCount?: number;
  charCount?: number;
  lineCount?: number;
  truncated?: boolean;
  isScannedOrImageOnly?: boolean;
  imageDimensions?: { width: number; height: number };
  language?: string;
  note?: string;
}

export interface BotAttachment {
  id: string;
  fileId?: string;
  name: string;
  mimeType: string;
  extension?: string;
  size: number;
  kind?: AttachmentKind;
  status?: AttachmentStatus;
  progress?: number;
  url?: string;
  base64?: string;
  textContent?: string;
  textPreview?: string;
  extractedSummary?: AttachmentExtractionSummary;
  expiresAt?: string;
  errorMessage?: string;
  /** Internal server-only Gemini Files URI used when forwarding large PDFs across turns */
  geminiFileUri?: string;
}

export interface BotToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status?: 'pending' | 'running' | 'completed' | 'error' | 'confirmation_required' | 'denied' | 'timeout' | 'unavailable';
}

export type BotPermission =
  | 'public_read'
  | 'compute'
  | 'web_research'
  | 'external_write';

export type ToolCategory =
  | 'compute'
  | 'knowledge'
  | 'web'
  | 'utility'
  | 'action';

export type ToolExecutionStatus =
  | 'success'
  | 'error'
  | 'denied'
  | 'timeout'
  | 'confirmation_required'
  | 'unavailable';

export interface ToolActionPreview {
  toolCallId?: string;
  toolName: string;
  title: string;
  summary: string;
  actionKey: string;
  fields: Array<{ label: string; value: string }>;
  arguments: Record<string, any>;
  resolution?: 'approved' | 'rejected';
}

export interface BotToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
  isError?: boolean;
  status?: ToolExecutionStatus;
  durationMs?: number;
  confirmationRequired?: boolean;
  actionPreview?: ToolActionPreview;
}

export interface BotMessage {
  id: string;
  role: BotRole;
  content: string;
  attachments?: BotAttachment[];
  toolCalls?: BotToolCall[];
  toolResults?: BotToolResult[];
  createdAt?: string | Date;
  model?: string;
}

export interface BotToolSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: BotToolSchemaProperty;
}

export interface BotToolDeclaration {
  name: string;
  description: string;
  category?: ToolCategory;
  requiredPermissions?: BotPermission[];
  requiresConfirmation?: boolean;
  timeoutMs?: number;
  resultFormat?: string;
  parameters: {
    type: 'object';
    properties: Record<string, BotToolSchemaProperty>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface BotTool {
  declaration: BotToolDeclaration;
  isEnabled?: (context: BotToolContext) => boolean;
  formatConfirmationPreview?: (args: Record<string, any>) => {
    title: string;
    summary: string;
    fields: Array<{ label: string; value: string }>;
  };
  execute: (args: Record<string, any>, context: BotToolContext) => Promise<any>;
}

export interface BotToolContext {
  conversationId?: string;
  userId?: string;
  ownerId?: string;
  modelId?: string;
  permissions?: BotPermission[];
  enableWebSearch?: boolean;
  approvedActionKeys?: string[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type StreamChunkType =
  | 'start'
  | 'text'
  | 'thought'
  | 'tool_call'
  | 'tool_result'
  | 'usage'
  | 'error'
  | 'done';

export interface StreamChunk {
  type: StreamChunkType;
  text?: string;
  thought?: string;
  toolCall?: BotToolCall;
  toolResult?: BotToolResult;
  usage?: TokenUsage;
  error?: string;
  model?: string;
  finishReason?: string;
}

export interface ChatRequest {
  modelId: string;
  messages: BotMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: BotTool[];
  conversationId?: string;
  ownerId?: string;
  permissions?: BotPermission[];
  enableWebSearch?: boolean;
  approvedActionKeys?: string[];
}

export interface ChatResponse {
  content: string;
  model: string;
  toolCalls?: BotToolCall[];
  toolResults?: BotToolResult[];
  usage?: TokenUsage;
  finishReason?: string;
}

export interface ProviderConnectionStatus {
  provider: AIProvider;
  configured: boolean;
  verified: boolean;
  latencyMs?: number;
  error?: string;
  supportedModels: string[];
}

export interface ProviderAdapter {
  id: AIProvider;
  name: string;
  isConfigured: () => boolean;
  verifyConnection: () => Promise<{ success: boolean; latencyMs?: number; error?: string }>;
  streamChat: (
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ) => Promise<ChatResponse>;
  chat: (request: ChatRequest, signal?: AbortSignal) => Promise<ChatResponse>;
}

// ─── Phase 7: User Accounts, Personalization & Conversation Persistence ────────

export type ResponseStyle =
  | 'balanced'
  | 'concise'
  | 'detailed'
  | 'technical'
  | 'beginner_friendly';

export interface UserPreferences {
  displayName?: string;
  responseStyle: ResponseStyle;
  language: string;
  customInstructions?: string;
  defaultModelId?: string;
  defaultWebSearch: boolean;
  enterToSend: boolean;
  updatedAt?: string;
}

export type BotUserStatus = 'ACTIVE' | 'LIMITED' | 'SUSPENDED';

export interface PublicBotUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  status?: BotUserStatus;
  dailyMessageLimitOverride?: number | null;
  suspendedReason?: string | null;
  createdAt: string;
}

export interface AuthActor {
  isAuthenticated: boolean;
  authType: 'bot_account' | 'admin_session' | 'anonymous';
  ownerId: string;
  user: PublicBotUser | null;
  preferences: UserPreferences;
}

export interface ServerConversation {
  id: string;
  ownerId: string;
  title: string;
  modelId: string;
  pinned: boolean;
  archived: boolean;
  messages: BotMessage[];
  attachmentIds: string[];
  createdAt: number;
  updatedAt: number;
}

// ─── Phase 8: Admin Management, Usage Limits, Analytics & Governance ───────────

export type OpenWeightBackend = 'groq' | 'openrouter' | 'together' | 'ollama';

export interface SafeProviderConfig {
  provider: AIProvider;
  name: string;
  enabled: boolean;
  hasAdminKey: boolean;
  hasEnvKey: boolean;
  isConfigured: boolean;
  keySource: 'admin' | 'env' | 'none';
  maskedKeyHint: string | null;
  baseUrl?: string | null;
  openweightBackend?: OpenWeightBackend | null;
  monthlyBudgetUsd?: number | null;
  alertThresholdPct: number;
  lastCheckedAt?: string | null;
  lastStatusOk?: boolean | null;
  lastLatencyMs?: number | null;
  lastError?: string | null;
}

export interface BotUsageLimitsConfig {
  anonMessagesPerHour: number;
  anonMessagesPerDay: number;
  authMessagesPerHour: number;
  authMessagesPerDay: number;
  perUserRequestsPerMinute: number;
  maxMessageChars: number;
  maxMessagesPerRequest: number;
  maxAttachmentsPerMessage: number;
  maxDocImageBytes: number;
  maxTextCodeBytes: number;
  dailySpendingAlertUsd: number;
  monthlySpendingAlertUsd: number;
  enforceSpendingHardStop: boolean;
  updatedAt?: string;
}

export type BotUsageEventType =
  | 'chat_success'
  | 'chat_error'
  | 'rate_limit'
  | 'limit_exceeded'
  | 'file_upload'
  | 'file_rejected'
  | 'spending_alert';

export interface BotUsageEventRecord {
  id: string;
  createdAt: string;
  eventType: BotUsageEventType;
  actorHash: string;
  botUserId?: string | null;
  authType: 'anonymous' | 'bot_account' | 'admin_session';
  conversationId?: string | null;
  modelId?: string | null;
  provider?: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs?: number | null;
  statusCode?: number | null;
  errorMessage?: string | null;
}

export interface DailyAnalyticsPoint {
  date: string; // YYYY-MM-DD
  messages: number;
  activeUsers: number;
  tokens: number;
  estimatedCostUsd: number;
  errors: number;
  rateLimits: number;
}

export interface ModelUsageSummary {
  modelId: string;
  modelName: string;
  provider: string;
  requests: number;
  errors: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  avgLatencyMs: number | null;
}

export interface ProviderUsageSummary {
  provider: AIProvider;
  requests: number;
  errors: number;
  totalTokens: number;
  estimatedCostUsd: number;
  monthlyBudgetUsd: number | null;
  alertTriggered: boolean;
}

export interface SpendingAlertItem {
  scope: 'daily' | 'monthly' | 'provider';
  severity: 'warning' | 'critical';
  provider?: AIProvider;
  currentUsd: number;
  thresholdUsd: number;
  message: string;
}

export interface BotAdminAnalytics {
  windowDays: number;
  dailyActiveUsersToday: number;
  totalConversations: number;
  registeredUsersCount: number;
  suspendedUsersCount: number;
  messagesToday: number;
  messagesInWindow: number;
  totalTokensToday: number;
  totalTokensInWindow: number;
  estimatedCostTodayUsd: number;
  estimatedCostMonthUsd: number;
  estimatedCostWindowUsd: number;
  averageResponseTimeMs: number | null;
  failedRequestsInWindow: number;
  rateLimitEventsInWindow: number;
  dailySeries: DailyAnalyticsPoint[];
  mostUsedModels: ModelUsageSummary[];
  providerUsage: ProviderUsageSummary[];
  spendingAlerts: SpendingAlertItem[];
  recentErrors: BotUsageEventRecord[];
}

export interface AdminBotUserSummary {
  id: string;
  email: string;
  name: string;
  status: BotUserStatus;
  dailyMessageLimitOverride: number | null;
  suspendedReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** Strictly aggregate counts only; administrators cannot read private message transcripts. */
  conversationCount: number;
  messagesToday: number;
  messagesTotal: number;
  tokensTotal: number;
  estimatedCostUsd: number;
  lastActiveAt: string | null;
}
