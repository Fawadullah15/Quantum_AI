/**
 * Phase 6 — Quantum AI Company Knowledge & Source Management Types
 */

export type KnowledgeCategory =
  | 'company_profile'
  | 'mission_vision'
  | 'services'
  | 'ai_capabilities'
  | 'software_development'
  | 'business_automation'
  | 'projects'
  | 'mechanical_copilot'
  | 'team'
  | 'contact'
  | 'faq';

export const KNOWLEDGE_CATEGORIES: readonly KnowledgeCategory[] = [
  'company_profile',
  'mission_vision',
  'services',
  'ai_capabilities',
  'software_development',
  'business_automation',
  'projects',
  'mechanical_copilot',
  'team',
  'contact',
  'faq',
] as const;

export type KnowledgeVerificationStatus = 'verified' | 'draft' | 'needs_review';

export type KnowledgeDocumentOrigin = 'builtin' | 'custom' | 'database';

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: KnowledgeCategory;
  source: string;
  content: string;
  verificationStatus: KnowledgeVerificationStatus;
  lastUpdated: string; // ISO-8601 timestamp
  tags?: string[];
  path?: string;
  url?: string;
  origin?: KnowledgeDocumentOrigin;
}

export interface KnowledgeIngestInput {
  id?: string;
  title: string;
  category: KnowledgeCategory;
  source: string;
  content: string;
  verificationStatus?: KnowledgeVerificationStatus;
  lastUpdated?: string;
  tags?: string[];
  path?: string;
  url?: string;
}

export interface KnowledgeUpdatePatch {
  title?: string;
  category?: KnowledgeCategory;
  source?: string;
  content?: string;
  verificationStatus?: KnowledgeVerificationStatus;
  lastUpdated?: string;
  tags?: string[];
  path?: string;
  url?: string;
}

export interface KnowledgeSearchHit {
  document: KnowledgeDocument;
  score: number;
  matchedTerms: string[];
}

export interface KnowledgeIndexStats {
  indexVersion: number;
  indexedAt: string;
  totalDocuments: number;
  verifiedDocuments: number;
  totalUniqueTokens: number;
  categoryCounts: Record<KnowledgeCategory, number>;
}

export type QueryIntentClassification = 'general' | 'company' | 'mixed';

export interface KnowledgeRetrievalResult {
  intent: QueryIntentClassification;
  shouldInjectContext: boolean;
  reason: string;
  hits: KnowledgeSearchHit[];
  missingFactTopics: string[];
  formattedContextBlock: string;
}
