import { getKnowledgeIndexStats, searchKnowledgeBase } from '../knowledge/store';
import { KNOWLEDGE_CATEGORIES, KnowledgeCategory } from '../knowledge/types';
import { BotToolImplementation } from './types';

// Backward-compatible mapping so older tool calls using overview/capabilities still resolve cleanly
const CATEGORY_ALIAS_MAP: Record<string, KnowledgeCategory | 'all'> = {
  all: 'all',
  overview: 'company_profile',
  capabilities: 'ai_capabilities',
  company_profile: 'company_profile',
  mission_vision: 'mission_vision',
  services: 'services',
  ai_capabilities: 'ai_capabilities',
  software_development: 'software_development',
  business_automation: 'business_automation',
  projects: 'projects',
  mechanical_copilot: 'mechanical_copilot',
  team: 'team',
  contact: 'contact',
  faq: 'faq',
};

export async function queryCompanyKnowledge(
  query: string,
  category: string = 'all'
) {
  const mappedCategory = CATEGORY_ALIAS_MAP[category] || 'all';
  const cleanQuery = query.trim();

  const { hits, stats } = await searchKnowledgeBase(cleanQuery, {
    category: mappedCategory,
    limit: 5,
    includeUnverified: false,
    minScore: 0.4,
  });

  if (hits.length > 0) {
    return {
      query: cleanQuery,
      category: mappedCategory,
      verifiedOnly: true,
      indexVersion: stats.indexVersion,
      indexedAt: stats.indexedAt,
      count: hits.length,
      results: hits.map((h) => ({
        id: h.document.id,
        title: h.document.title,
        category: h.document.category,
        source: h.document.source,
        verificationStatus: h.document.verificationStatus,
        lastUpdated: h.document.lastUpdated,
        path: h.document.path,
        url: h.document.url,
        score: h.score,
        content: h.document.content,
      })),
    };
  }

  // Fallback: return matching category verified docs or core overview if no keyword matched
  const fallbackSearch = await searchKnowledgeBase('', {
    category: mappedCategory === 'all' ? 'company_profile' : mappedCategory,
    limit: 3,
    includeUnverified: false,
  });

  const indexStats = await getKnowledgeIndexStats();

  return {
    query: cleanQuery,
    category: mappedCategory,
    verifiedOnly: true,
    indexVersion: indexStats.indexVersion,
    indexedAt: indexStats.indexedAt,
    count: fallbackSearch.hits.length,
    noDirectKeywordMatch: true,
    note: 'No exact verified Quantum AI record matched all search terms. Do not fabricate unpublished prices, clients, partnerships, or certifications. Share only verified records below or invite direct contact at support@quantumaitech.org.',
    results: fallbackSearch.hits.map((h) => ({
      id: h.document.id,
      title: h.document.title,
      category: h.document.category,
      source: h.document.source,
      verificationStatus: h.document.verificationStatus,
      lastUpdated: h.document.lastUpdated,
      path: h.document.path,
      url: h.document.url,
      content: h.document.content,
    })),
  };
}

export const companyKnowledgeTool: BotToolImplementation = {
  declaration: {
    name: 'query_quantum_ai_knowledge',
    description:
      'Retrieve verified company information about Quantum AI (company profile, mission/vision, services, AI capabilities, software development, automation, Mechanical Engineering Design Copilot, portfolio projects, leadership/team, FAQs, or contact details at support@quantumaitech.org). Only invoke when the user asks about Quantum AI; do NOT call this for unrelated general knowledge, coding, or math questions.',
    category: 'knowledge',
    requiredPermissions: ['public_read'],
    timeoutMs: 5000,
    resultFormat:
      'JSON object with verified Quantum AI documents (title, category, source, verificationStatus, lastUpdated, path, url, content).',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: {
          type: 'string',
          minLength: 1,
          maxLength: 250,
          description:
            'Search query about Quantum AI (e.g. "services", "Mechanical Engineering Design Copilot", "team leadership", "Peshawar", "contact email").',
        },
        category: {
          type: 'string',
          enum: ['all', ...KNOWLEDGE_CATEGORIES, 'overview', 'capabilities'],
          description: 'Optional focus category to narrow retrieved Quantum AI records.',
        },
      },
      required: ['query'],
    },
  },
  execute: async (args: Record<string, any>) => {
    const query = String(args.query || '').trim();
    const category = typeof args.category === 'string' ? args.category : 'all';
    return queryCompanyKnowledge(query, category);
  },
};
