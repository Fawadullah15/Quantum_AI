import {
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
  KnowledgeDocument,
  KnowledgeIndexStats,
  KnowledgeSearchHit,
} from './types';

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'of', 'to', 'in',
  'for', 'with', 'by', 'as', 'from', 'that', 'this', 'it', 'its', 'are', 'be',
  'was', 'were', 'can', 'do', 'does', 'did', 'has', 'have', 'had', 'what',
  'who', 'how', 'where', 'when', 'why', 'about', 'into', 'they', 'their',
  'your', 'you', 'our', 'we', 'us', 'me', 'my',
]);

export function tokenizeKnowledgeText(text: string): string[] {
  const rawParts = text
    .toLowerCase()
    .split(/[^a-z0-9@._-]+/)
    .map((t) => t.replace(/^[._-]+|[._-]+$/g, ''))
    .filter((t) => t.length >= 2);

  const tokens: string[] = [];
  for (const part of rawParts) {
    // Emit split sub-words around hyphens/dots so "co-founders" also matches "founder"
    const subParts = part.includes('-') || part.includes('.') ? part.split(/[.-]+/) : [part];
    for (const rawTok of [part, ...subParts]) {
      const tok = rawTok.trim();
      if (tok.length < 2 || STOP_WORDS.has(tok)) continue;
      tokens.push(tok);
      // Light plural singularization ("founders" -> "founder", "services" -> "service")
      if (tok.length >= 4 && tok.endsWith('s') && !tok.endsWith('ss')) {
        const singular = tok.slice(0, -1);
        if (!STOP_WORDS.has(singular)) tokens.push(singular);
      }
    }
  }
  return tokens;
}

interface IndexedPosting {
  docId: string;
  fieldBoost: number;
  termFreq: number;
}

export class KnowledgeSearchIndex {
  private docsById = new Map<string, KnowledgeDocument>();
  private inverted = new Map<string, IndexedPosting[]>();
  private docLengths = new Map<string, number>();
  private avgDocLength = 1;
  private version = 0;
  private indexedAt = new Date().toISOString();

  build(documents: KnowledgeDocument[], versionIncrement = 1): KnowledgeIndexStats {
    this.docsById.clear();
    this.inverted.clear();
    this.docLengths.clear();

    let totalLen = 0;

    for (const doc of documents) {
      this.docsById.set(doc.id, doc);

      const titleTokens = tokenizeKnowledgeText(doc.title);
      const tagTokens = tokenizeKnowledgeText((doc.tags || []).join(' '));
      const categoryTokens = tokenizeKnowledgeText(doc.category.replace(/_/g, ' '));
      const bodyTokens = tokenizeKnowledgeText(doc.content);

      const docLen = Math.max(1, bodyTokens.length + titleTokens.length);
      this.docLengths.set(doc.id, docLen);
      totalLen += docLen;

      // Aggregate per-doc weighted term frequencies across fields
      const termStats = new Map<string, { freq: number; boost: number }>();

      const accumulate = (tokens: string[], weight: number) => {
        for (const tok of tokens) {
          const prev = termStats.get(tok);
          if (prev) {
            prev.freq += 1;
            prev.boost = Math.max(prev.boost, weight);
          } else {
            termStats.set(tok, { freq: 1, boost: weight });
          }
        }
      };

      accumulate(titleTokens, 3.2);
      accumulate(tagTokens, 2.8);
      accumulate(categoryTokens, 2.4);
      accumulate(bodyTokens, 1.0);

      for (const [term, stat] of termStats.entries()) {
        const list = this.inverted.get(term) || [];
        list.push({
          docId: doc.id,
          fieldBoost: stat.boost,
          termFreq: stat.freq,
        });
        this.inverted.set(term, list);
      }
    }

    this.avgDocLength = documents.length > 0 ? totalLen / documents.length : 1;
    this.version += versionIncrement;
    this.indexedAt = new Date().toISOString();

    return this.getStats();
  }

  search(
    query: string,
    options?: {
      category?: KnowledgeCategory | 'all';
      limit?: number;
      includeUnverified?: boolean;
      minScore?: number;
    }
  ): KnowledgeSearchHit[] {
    const cleanQuery = query.trim().toLowerCase();
    const limit = Math.max(1, Math.min(options?.limit ?? 5, 25));
    const includeUnverified = options?.includeUnverified === true;
    const minScore = options?.minScore ?? 0.4;

    const categoryFilter = options?.category && options.category !== 'all' ? options.category : null;
    const queryTerms = Array.from(new Set(tokenizeKnowledgeText(cleanQuery)));
    const totalDocs = Math.max(1, this.docsById.size);

    // If query has no tokenized keywords (e.g. category browse with punctuation), allow category listing
    if (queryTerms.length === 0 && cleanQuery.length === 0) {
      const list = Array.from(this.docsById.values())
        .filter((doc) => (includeUnverified ? true : doc.verificationStatus === 'verified'))
        .filter((doc) => (categoryFilter ? doc.category === categoryFilter : true))
        .slice(0, limit)
        .map((doc) => ({ document: doc, score: 1, matchedTerms: [] }));
      return list;
    }

    const scoreMap = new Map<string, { score: number; matched: Set<string> }>();

    // BM25-inspired inverted-index scoring
    const k1 = 1.2;
    const b = 0.65;

    for (const term of queryTerms) {
      // Match exact index token plus substring prefix matches on longer terms (>= 4 chars)
      const matchingTokens: Array<{ token: string; exact: boolean }> = [];
      if (this.inverted.has(term)) {
        matchingTokens.push({ token: term, exact: true });
      } else if (term.length >= 4) {
        for (const indexedTok of this.inverted.keys()) {
          if (indexedTok.startsWith(term) || indexedTok.includes(term)) {
            matchingTokens.push({ token: indexedTok, exact: false });
          }
        }
      }

      for (const { token, exact } of matchingTokens) {
        const postings = this.inverted.get(token);
        if (!postings || postings.length === 0) continue;

        const idf = Math.log(1 + (totalDocs - postings.length + 0.5) / (postings.length + 0.5));

        for (const p of postings) {
          const doc = this.docsById.get(p.docId);
          if (!doc) continue;
          if (!includeUnverified && doc.verificationStatus !== 'verified') continue;
          if (categoryFilter && doc.category !== categoryFilter) continue;

          const dl = this.docLengths.get(p.docId) || this.avgDocLength;
          const tfNorm = (p.termFreq * (k1 + 1)) / (p.termFreq + k1 * (1 - b + (b * dl) / this.avgDocLength));
          const partialPenalty = exact ? 1.0 : 0.65;
          const termScore = idf * tfNorm * p.fieldBoost * partialPenalty;

          const prev = scoreMap.get(p.docId) || { score: 0, matched: new Set<string>() };
          prev.score += termScore;
          prev.matched.add(term);
          scoreMap.set(p.docId, prev);
        }
      }
    }

    // Exact phrase, category & verification adjustments
    const hits: KnowledgeSearchHit[] = [];

    for (const [docId, entry] of scoreMap.entries()) {
      const doc = this.docsById.get(docId);
      if (!doc) continue;

      let finalScore = entry.score;
      const lowerTitle = doc.title.toLowerCase();
      const lowerBody = doc.content.toLowerCase();

      if (cleanQuery.length >= 4) {
        if (lowerTitle.includes(cleanQuery)) finalScore += 6.0;
        else if (lowerBody.includes(cleanQuery)) finalScore += 3.0;
      }

      // Bonus for covering multiple distinct query terms
      if (queryTerms.length > 1) {
        const coverage = entry.matched.size / queryTerms.length;
        finalScore += coverage * 2.5;
      }

      if (doc.verificationStatus === 'verified') {
        finalScore += 0.5;
      }

      if (finalScore >= minScore) {
        hits.push({
          document: doc,
          score: Number(finalScore.toFixed(3)),
          matchedTerms: Array.from(entry.matched),
        });
      }
    }

    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  getStats(): KnowledgeIndexStats {
    const categoryCounts = KNOWLEDGE_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat] = 0;
        return acc;
      },
      {} as Record<KnowledgeCategory, number>
    );

    let verifiedDocuments = 0;
    for (const doc of this.docsById.values()) {
      if (doc.verificationStatus === 'verified') verifiedDocuments += 1;
      categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
    }

    return {
      indexVersion: this.version,
      indexedAt: this.indexedAt,
      totalDocuments: this.docsById.size,
      verifiedDocuments,
      totalUniqueTokens: this.inverted.size,
      categoryCounts,
    };
  }
}
