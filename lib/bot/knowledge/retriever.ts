import { KnowledgeStoreOptions, searchKnowledgeBase } from './store';
import {
  KnowledgeCategory,
  KnowledgeDocument,
  KnowledgeRetrievalResult,
  QueryIntentClassification,
} from './types';

// Strong company-specific anchors (never match generic physics "quantum computing")
const COMPANY_ENTITY_PATTERNS: RegExp[] = [
  /\bquantum\s+ai\b/i,
  /\bquantumaitech(?:\.org)?\b/i,
  /\bquantumbot\b/i,
  /\bfawadullah(?:\s+imraj)?\b/i,
  /\bfahad\s+khan\b/i,
  /\babdullah\s+mahmood\b/i,
  /\bhafizah\s+anisa(?:\s+safdar)?\b/i,
  /\bwaqas\s+ali\s+khan\b/i,
  /\bmechanical\s+(?:engineering\s+)?(?:design\s+)?copilot\b/i,
  /\bschool\s+operations\s+manager\b/i,
  /\boffline\s+shop\s+management\s+system\b/i,
];

// Direct references to the host company behind QuantumBot
const FIRST_PERSON_COMPANY_PATTERNS: RegExp[] = [
  /\b(?:your|the)\s+(?:company|organization|agency|firm|studio|team|leadership|founders?|ceo|services|projects|portfolio|products?|pricing|rates|clients?|customers?|partnerships?|certifications?|office|location|headquarters|email|contact)\b/i,
  /\bwho\s+(?:built|created|made|founded|owns|runs|leads)\s+(?:you|quantumbot|quantum\s+ai|this\s+(?:site|website|assistant|company))\b/i,
  /\bwhere\s+(?:is|are)\s+(?:quantum\s+ai|you|the\s+company)\s+(?:based|located)\b/i,
  /\bhow\s+(?:can|do)\s+i\s+(?:contact|reach|hire|work\s+with|partner\s+with)\s+(?:quantum\s+ai|you|your\s+team)\b/i,
  /\bcan\s+(?:quantum\s+ai|your\s+team|you\s+guys)\s+(?:build|integrate|automate|develop|create)\b/i,
];

// Signals that the user is ALSO asking general-knowledge / comparative / technical questions
const GENERAL_KNOWLEDGE_SIGNALS: RegExp[] = [
  /\b(?:compare|comparison|versus|vs\.?|difference\s+between|trade-?offs?|pros\s+and\s+cons)\b/i,
  /\b(?:best\s+practices|architecture|design\s+pattern|algorithm|example|tutorial|explain\s+how)\b/i,
  /\b(?:suggest|recommend|strategy|strategies|should\s+i|how\s+would\s+i|roadmap|stack)\b/i,
  /\b(?:python|typescript|javascript|react|next\.?js|fastapi|postgresql|redis|docker|kubernetes|graphql|grpc|microservices?|oauth|transformer|bm25|embeddings?)\b/i,
];

// Topics where unverified/unpublished company facts must NEVER be fabricated
const SENSITIVE_MISSING_FACT_PROBES: Array<{ topic: string; pattern: RegExp; guidance: string }> = [
  {
    topic: 'pricing_and_quotes',
    pattern: /\b(?:price|pricing|cost|how\s+much|hourly\s+rate|package|packages|budget|quote|retainer|subscription\s+tier|fees?)\b/i,
    guidance:
      'Quantum AI does NOT publish fixed prices, hourly rates, or public pricing tiers. Explain that projects are scoped individually after reviewing requirements via /contact or support@quantumaitech.org.',
  },
  {
    topic: 'customers_and_client_list',
    pattern: /\b(?:customers?|clients?|client\s+list|who\s+uses|fortune\s+500|companies\s+(?:you|quantum\s+ai)\s+(?:worked|work)\s+with|testimonials?)\b/i,
    guidance:
      'Quantum AI does NOT publish a confidential commercial client roster or Fortune 500 claims. Only reference publicly documented initiatives (e.g. School Operations Manager, Youth Development Program Website, Offline Shop Management System, Sales Pipeline Automation System, Mechanical Engineering Design Copilot) without inventing client names.',
  },
  {
    topic: 'partnerships_and_investors',
    pattern: /\b(?:partnerships?|partnered\s+with|official\s+partner|investors?|funding|backed\s+by|venture\s+capital|sponsors?)\b/i,
    guidance:
      'Quantum AI has NOT published verified external investor details, funding amounts, or named corporate partner rosters (partnership inquiries are accepted at /careers-partnerships). Never invent partnerships or investors.',
  },
  {
    topic: 'certifications_and_compliance',
    pattern: /\b(?:soc\s*2|soc2|iso\s*27001|iso27001|hipaa|pci[\s-]?dss|fedramp|certifications?|certified|accredited)\b/i,
    guidance:
      'Quantum AI has NOT published verified third-party compliance certifications (such as SOC 2, ISO 27001, HIPAA, or PCI-DSS). State clearly that no third-party certification claims are published in verified records and invite direct security review via support@quantumaitech.org.',
  },
  {
    topic: 'awards_revenue_headcount',
    pattern: /\b(?:awards?|revenue|valuation|how\s+many\s+employees|headcount|team\s+size|ranked|market\s+share)\b/i,
    guidance:
      'Quantum AI does NOT publish revenue, valuation, award lists, or total employee headcount figures — only the leadership/team profiles listed on /leadership.',
  },
];

function extractRecentCompanyFollowupContext(history: Array<{ role: string; content: string }>): string {
  // Check up to the last 2 prior turns in case user asks a pronoun follow-up ("What are their services?", "How do I contact them?")
  const recent = history.slice(-4).slice(0, -1);
  return recent.map((m) => m.content).join(' ');
}

export function classifyQueryIntent(
  latestUserMessage: string,
  recentHistory: Array<{ role: string; content: string }> = []
): {
  intent: QueryIntentClassification;
  reason: string;
  missingFactTopics: string[];
  missingGuidanceLines: string[];
} {
  const query = latestUserMessage.trim();
  if (!query) {
    return {
      intent: 'general',
      reason: 'Empty query defaults to general conversation.',
      missingFactTopics: [],
      missingGuidanceLines: [],
    };
  }

  const hasExplicitCompanyEntity = COMPANY_ENTITY_PATTERNS.some((p) => p.test(query));
  const hasFirstPersonCompanyRef = FIRST_PERSON_COMPANY_PATTERNS.some((p) => p.test(query));

  // Pronoun follow-up check ("What services do they offer?", "Where are they located?")
  const hasPronounFollowup =
    !hasExplicitCompanyEntity &&
    !hasFirstPersonCompanyRef &&
    /\b(?:they|them|their|the\s+company|that\s+company|that\s+project|it)\b/i.test(query) &&
    COMPANY_ENTITY_PATTERNS.some((p) => p.test(extractRecentCompanyFollowupContext(recentHistory)));

  const isCompanyTargeted = hasExplicitCompanyEntity || hasFirstPersonCompanyRef || hasPronounFollowup;

  if (!isCompanyTargeted) {
    return {
      intent: 'general',
      reason: 'No Quantum AI company intent detected; handled directly by general AI model without forced RAG.',
      missingFactTopics: [],
      missingGuidanceLines: [],
    };
  }

  // Check if the query asks about potentially unpublished/sensitive company facts
  const missingMatches = SENSITIVE_MISSING_FACT_PROBES.filter((probe) => probe.pattern.test(query));
  const missingFactTopics = missingMatches.map((m) => m.topic);
  const missingGuidanceLines = missingMatches.map((m) => `- ${m.guidance}`);

  // Determine whether the query ALSO involves general-domain knowledge / architecture / comparison
  const hasGeneralAspect =
    GENERAL_KNOWLEDGE_SIGNALS.some((p) => p.test(query)) ||
    /\band\s+(?:also\s+)?(?:explain\s+(?:the\s+general|how\s+to\s+build)|write\s+(?:a|some)\s+code|compare\s+with)\b/i.test(
      query
    );

  if (hasGeneralAspect) {
    return {
      intent: 'mixed',
      reason: 'Query combines Quantum AI company context with general-domain or technical knowledge.',
      missingFactTopics,
      missingGuidanceLines,
    };
  }

  return {
    intent: 'company',
    reason: hasExplicitCompanyEntity
      ? 'Explicit Quantum AI entity reference detected.'
      : hasPronounFollowup
        ? 'Follow-up reference to Quantum AI conversation context.'
        : 'Direct inquiry regarding the host company.',
    missingFactTopics,
    missingGuidanceLines,
  };
}

function selectPreferredCategories(query: string): KnowledgeCategory[] {
  const lower = query.toLowerCase();
  const preferred: KnowledgeCategory[] = [];

  if (
    /\b(?:co-?founders?|founders?|founded|founding|started|owns|runs|leads|ceo|team|leadership|staff|executives?|engineer\w*|fawadullah|fahad|abdullah|anisa|waqas)\b/.test(
      lower
    )
  ) {
    preferred.push('team');
  }
  if (/\b(?:copilot|mechanical|shaft|sizing|material|safety\s+factor)\b/.test(lower)) {
    preferred.push('mechanical_copilot');
  }
  if (/\b(?:services?|offer|build|develop|help|industry|industries|process|lifecycle)\b/.test(lower)) {
    preferred.push('services');
  }
  if (/\b(?:ai|agents?|rag|vector|multimodal|hallucinations?|llms?|research)\b/.test(lower)) {
    preferred.push('ai_capabilities');
  }
  if (/\b(?:software|erp|crm|offline|pos|stack|tech|next\.?js|postgresql|code|ip|ownership)\b/.test(lower)) {
    preferred.push('software_development');
  }
  if (/\b(?:automat\w*|workflows?|pipelines?|sync\w*|legacy|integrat\w*|invoic\w*)\b/.test(lower)) {
    preferred.push('business_automation');
  }
  if (/\b(?:projects?|portfolio|case\s+stud\w*|school|shop|quantumbot|products?)\b/.test(lower)) {
    preferred.push('projects');
  }
  if (/\b(?:contact|email|support|reach|hire|careers?|partners\w*|location|where|pakistan|peshawar|office)\b/.test(lower)) {
    preferred.push('contact');
  }
  if (/\b(?:mission|vision|philosophy|principles?|values?)\b/.test(lower)) {
    preferred.push('mission_vision');
  }
  if (/\b(?:faqs?|questions?)\b/.test(lower)) {
    preferred.push('faq');
  }
  if (preferred.length === 0) {
    preferred.push('company_profile', 'services', 'projects');
  }
  return preferred;
}

export async function retrieveContextualCompanyKnowledge(
  messages: Array<{ role: string; content: string }>,
  storeOpts?: KnowledgeStoreOptions
): Promise<KnowledgeRetrievalResult> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const queryText = lastUserMsg?.content || '';

  const classification = classifyQueryIntent(queryText, messages);

  if (classification.intent === 'general') {
    return {
      intent: 'general',
      shouldInjectContext: false,
      reason: classification.reason,
      hits: [],
      missingFactTopics: [],
      formattedContextBlock: '',
    };
  }

  // Run indexed keyword search across verified documents
  const { hits: primaryHits } = await searchKnowledgeBase(
    queryText,
    { limit: 4, includeUnverified: false, minScore: 0.5 },
    storeOpts
  );

  // Ensure every explicitly matched intent category (e.g. team, mechanical_copilot, contact)
  // is represented cleanly in the retrieved context so broad terms ("Quantum AI") never drown them out.
  const preferredCategories = selectPreferredCategories(queryText);
  const seenIds = new Set<string>();
  const combinedHits: typeof primaryHits = [];

  for (const cat of preferredCategories) {
    if (combinedHits.length >= 4) break;
    const { hits: catHits } = await searchKnowledgeBase(
      queryText,
      { category: cat, limit: 1, includeUnverified: false, minScore: 0 },
      storeOpts
    );
    const chosen =
      catHits[0] ||
      (
        await searchKnowledgeBase(
          '',
          { category: cat, limit: 1, includeUnverified: false },
          storeOpts
        )
      ).hits[0];
    if (chosen && !seenIds.has(chosen.document.id)) {
      seenIds.add(chosen.document.id);
      combinedHits.push(chosen);
    }
  }

  for (const h of primaryHits) {
    if (combinedHits.length >= 5) break;
    if (!seenIds.has(h.document.id)) {
      seenIds.add(h.document.id);
      combinedHits.push(h);
    }
  }

  const formattedDocs = combinedHits
    .map(({ document: doc }: { document: KnowledgeDocument }, idx: number) => {
      return `[Doc ${idx + 1}] Title: ${doc.title}
Category: ${doc.category} | Status: ${doc.verificationStatus} | Source: ${doc.source} | Last Updated: ${doc.lastUpdated.slice(0, 10)}
${doc.content}`;
    })
    .join('\n\n---\n\n');

  const modeHeader =
    classification.intent === 'mixed'
      ? `CONTEXT MODE: MIXED QUERY (Quantum AI + General Knowledge)
Combine the verified Quantum AI records below with your general-purpose technical/domain expertise. Clearly distinguish verified Quantum AI company facts from general AI engineering recommendations.`
      : `CONTEXT MODE: QUANTUM AI COMPANY QUERY
Answer strictly using the verified Quantum AI records below (or call \`query_quantum_ai_knowledge\` if a more specific lookup helps).`;

  const missingSection =
    classification.missingGuidanceLines.length > 0
      ? `\n\nCRITICAL UNVERIFIED / UNPUBLISHED TOPIC GUARD:\n${classification.missingGuidanceLines.join('\n')}`
      : '';

  const formattedContextBlock = `### [VERIFIED QUANTUM AI KNOWLEDGE CONTEXT]
${modeHeader}${missingSection}

${formattedDocs}`;

  return {
    intent: classification.intent,
    shouldInjectContext: true,
    reason: classification.reason,
    hits: combinedHits,
    missingFactTopics: classification.missingFactTopics,
    formattedContextBlock,
  };
}
