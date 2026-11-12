import { BotToolImplementation } from './types';

export const webSearchTool: BotToolImplementation = {
  declaration: {
    name: 'web_search',
    description: 'Perform a live web search for up-to-date facts, current events, technical documentation, or real-world information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms or question to look up online.',
        },
      },
      required: ['query'],
    },
  },
  execute: async (args: Record<string, any>) => {
    const query = args?.query?.trim();
    if (!query) {
      return { error: 'No search query provided.' };
    }

    // Check for configured external search APIs (Tavily, Perplexity, or SerpAPI)
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: 'basic',
            max_results: 5,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return {
            query,
            provider: 'tavily',
            results: (data.results || []).map((r: any) => ({
              title: r.title,
              url: r.url,
              snippet: r.content,
            })),
          };
        }
      } catch (err: any) {
        console.warn('[Web Search] Tavily error:', err?.message);
      }
    }

    // Native fallback via DuckDuckGo Instant Answer API (No API key required)
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(ddgUrl, {
        headers: { 'User-Agent': 'QuantumBot/1.0 (Quantum AI Research)' },
      });
      if (res.ok) {
        const ddgData = await res.json();
        const results = [];
        if (ddgData.AbstractText) {
          results.push({
            title: ddgData.Heading || query,
            snippet: ddgData.AbstractText,
            url: ddgData.AbstractURL || '',
          });
        }
        if (Array.isArray(ddgData.RelatedTopics)) {
          for (const item of ddgData.RelatedTopics.slice(0, 4)) {
            if (item.Text && item.FirstURL) {
              results.push({
                title: item.Text.split(' - ')[0] || query,
                snippet: item.Text,
                url: item.FirstURL,
              });
            }
          }
        }
        if (results.length > 0) {
          return {
            query,
            provider: 'duckduckgo',
            results,
          };
        }
      }
    } catch (ddgErr: any) {
      console.warn('[Web Search] DuckDuckGo fallback error:', ddgErr?.message);
    }

    return {
      query,
      note: 'Web search completed with no direct public summaries. Synthesizing answer based on extensive internal knowledge.',
      results: [],
    };
  },
};
