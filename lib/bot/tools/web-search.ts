import { BotToolImplementation } from './types';

export interface NormalizedWebResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  sourceProvider: string;
  publishedDate?: string;
}

function extractDomain(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

function stripHtmlTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchWithTavily(
  query: string,
  maxResults: number,
  apiKey: string
): Promise<{ results: NormalizedWebResult[]; error?: string }> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: maxResults,
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) {
      return { results: [], error: `Tavily HTTP ${res.status}` };
    }
    const data = await res.json();
    const results: NormalizedWebResult[] = (data.results || [])
      .filter((r: any) => r?.url && /^https?:\/\//i.test(r.url))
      .slice(0, maxResults)
      .map((r: any) => ({
        title: String(r.title || query).trim(),
        url: String(r.url).trim(),
        snippet: String(r.content || '').trim(),
        domain: extractDomain(r.url),
        sourceProvider: 'Tavily Search',
        publishedDate: r.published_date || undefined,
      }));
    return { results };
  } catch (err: any) {
    return { results: [], error: err?.message || 'Tavily request failed' };
  }
}

async function searchWithBrave(
  query: string,
  maxResults: number,
  apiKey: string
): Promise<{ results: NormalizedWebResult[]; error?: string }> {
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': apiKey,
        },
        signal: AbortSignal.timeout(7000),
      }
    );
    if (!res.ok) {
      return { results: [], error: `Brave Search HTTP ${res.status}` };
    }
    const data = await res.json();
    const results: NormalizedWebResult[] = (data?.web?.results || [])
      .filter((r: any) => r?.url && /^https?:\/\//i.test(r.url))
      .slice(0, maxResults)
      .map((r: any) => ({
        title: String(r.title || query).trim(),
        url: String(r.url).trim(),
        snippet: stripHtmlTags(String(r.description || '')),
        domain: extractDomain(r.url),
        sourceProvider: 'Brave Search',
        publishedDate: r.age || undefined,
      }));
    return { results };
  } catch (err: any) {
    return { results: [], error: err?.message || 'Brave Search request failed' };
  }
}

async function searchWithDuckDuckGo(
  query: string,
  maxResults: number
): Promise<{ results: NormalizedWebResult[]; error?: string }> {
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgUrl, {
      headers: { 'User-Agent': 'QuantumBot/1.0 (+https://quantumaitech.org)' },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) {
      return { results: [], error: `DuckDuckGo HTTP ${res.status}` };
    }
    const ddgData = await res.json();
    const results: NormalizedWebResult[] = [];

    if (ddgData.AbstractText && ddgData.AbstractURL) {
      results.push({
        title: String(ddgData.Heading || query).trim(),
        url: String(ddgData.AbstractURL),
        snippet: String(ddgData.AbstractText),
        domain: extractDomain(ddgData.AbstractURL),
        sourceProvider: 'DuckDuckGo Instant Answer',
      });
    }

    if (Array.isArray(ddgData.Results)) {
      for (const item of ddgData.Results) {
        if (item?.Text && item?.FirstURL) {
          results.push({
            title: String(item.Text).split(' - ')[0] || query,
            url: String(item.FirstURL),
            snippet: String(item.Text),
            domain: extractDomain(item.FirstURL),
            sourceProvider: 'DuckDuckGo',
          });
        }
      }
    }

    if (Array.isArray(ddgData.RelatedTopics)) {
      for (const item of ddgData.RelatedTopics) {
        if (item?.Text && item?.FirstURL) {
          results.push({
            title: String(item.Text).split(' - ')[0] || query,
            url: String(item.FirstURL),
            snippet: String(item.Text),
            domain: extractDomain(item.FirstURL),
            sourceProvider: 'DuckDuckGo',
          });
        } else if (Array.isArray(item?.Topics)) {
          for (const sub of item.Topics) {
            if (sub?.Text && sub?.FirstURL) {
              results.push({
                title: String(sub.Text).split(' - ')[0] || query,
                url: String(sub.FirstURL),
                snippet: String(sub.Text),
                domain: extractDomain(sub.FirstURL),
                sourceProvider: 'DuckDuckGo',
              });
            }
          }
        }
        if (results.length >= maxResults) break;
      }
    }

    return { results: results.slice(0, maxResults) };
  } catch (err: any) {
    return { results: [], error: err?.message || 'DuckDuckGo request failed' };
  }
}

async function searchWithWikipedia(
  query: string,
  maxResults: number
): Promise<{ results: NormalizedWebResult[]; error?: string }> {
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=${Math.min(maxResults, 5)}&utf8=1&format=json&origin=*`;
    const res = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'QuantumBot/1.0 (+https://quantumaitech.org)' },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) {
      return { results: [], error: `Wikipedia API HTTP ${res.status}` };
    }
    const data = await res.json();
    const hits = data?.query?.search;
    if (!Array.isArray(hits)) {
      return { results: [] };
    }

    const results: NormalizedWebResult[] = hits.map((item: any) => {
      const title = String(item.title || query);
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
      return {
        title,
        url,
        snippet: stripHtmlTags(String(item.snippet || '')),
        domain: 'en.wikipedia.org',
        sourceProvider: 'Wikipedia Search',
        publishedDate: item.timestamp ? String(item.timestamp).slice(0, 10) : undefined,
      };
    });
    return { results };
  } catch (err: any) {
    return { results: [], error: err?.message || 'Wikipedia API failed' };
  }
}

export async function runWebSearch(
  query: string,
  maxResults = 5,
  options?: { tavilyApiKey?: string; braveApiKey?: string; disableFallback?: boolean }
) {
  const searchedAt = new Date().toISOString();
  const errors: string[] = [];
  const combined: NormalizedWebResult[] = [];
  const seenUrls = new Set<string>();

  const pushUnique = (items: NormalizedWebResult[]) => {
    for (const item of items) {
      const key = item.url.replace(/\/+$/, '').toLowerCase();
      if (!seenUrls.has(key)) {
        seenUrls.add(key);
        combined.push(item);
      }
      if (combined.length >= maxResults) break;
    }
  };

  const tavilyKey = options?.tavilyApiKey ?? process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    const r = await searchWithTavily(query, maxResults, tavilyKey);
    if (r.error) errors.push(r.error);
    pushUnique(r.results);
  }

  const braveKey = options?.braveApiKey ?? process.env.BRAVE_SEARCH_API_KEY;
  if (combined.length < maxResults && braveKey) {
    const r = await searchWithBrave(query, maxResults, braveKey);
    if (r.error) errors.push(r.error);
    pushUnique(r.results);
  }

  if (combined.length === 0 && !options?.disableFallback) {
    const runPublicCascade = async () => {
      const [ddgRes, wikiRes] = await Promise.all([
        searchWithDuckDuckGo(query, maxResults),
        searchWithWikipedia(query, maxResults),
      ]);
      if (ddgRes.error) errors.push(ddgRes.error);
      if (wikiRes.error) errors.push(wikiRes.error);
      pushUnique(ddgRes.results);
      pushUnique(wikiRes.results);
    };

    await runPublicCascade();
    if (combined.length === 0 && errors.length > 0) {
      errors.length = 0;
      await new Promise((r) => setTimeout(r, 350));
      await runPublicCascade();
    }
  }

  // If every upstream provider errored and yielded zero results, report unavailability honestly
  if (combined.length === 0 && errors.length > 0) {
    return {
      query,
      available: false,
      searchedAt,
      providerErrors: errors,
      results: [],
      error: `Live web search failed: ${errors.join('; ')}. Do NOT claim to have browsed the live web; inform the user that live web search was unreachable.`,
    };
  }

  return {
    query,
    available: true,
    searchedAt,
    count: combined.length,
    results: combined,
    note:
      combined.length > 0
        ? 'Cite relevant findings using clickable Markdown links [Title](url) and distinguish these retrieved web sources from general model knowledge.'
        : 'Live search succeeded but returned no direct matching web results for this query. State clearly what was not found online rather than fabricating live search facts.',
  };
}

export const webSearchTool: BotToolImplementation = {
  declaration: {
    name: 'web_search',
    description:
      'Perform live web research using external search providers to retrieve verifiable public sources, URLs, and summaries. Only active when Web Search is enabled by the user.',
    category: 'web',
    requiredPermissions: ['web_research'],
    timeoutMs: 12000,
    resultFormat:
      'JSON object with available flag, searchedAt timestamp, and array of sources {title, url, snippet, domain}.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: {
          type: 'string',
          minLength: 2,
          maxLength: 300,
          description: 'Focused search query to look up on the public web.',
        },
        maxResults: {
          type: 'integer',
          minimum: 1,
          maximum: 8,
          description: 'Maximum number of source results to return (default 5).',
        },
      },
      required: ['query'],
    },
  },
  isEnabled: (context) => Boolean(context.enableWebSearch),
  execute: async (args: Record<string, any>) => {
    const query = String(args.query || '').trim();
    const maxResults = typeof args.maxResults === 'number' ? args.maxResults : 5;
    return runWebSearch(query, maxResults);
  },
};
