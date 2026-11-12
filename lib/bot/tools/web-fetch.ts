import dns from 'node:dns/promises';
import net from 'node:net';
import { BotToolImplementation } from './types';

const MAX_RESPONSE_BYTES = 200 * 1024;
const MAX_EXTRACTED_CHARS = 8000;

function isPrivateOrBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8 ("this" network)
  if (a === 10) return true; // 10.0.0.0/8 (RFC1918)
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  if (a === 127) return true; // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local & cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (RFC1918)
  if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 (RFC1918)
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmark testing
  if (a >= 224) return true; // multicast & reserved
  return false;
}

function isPrivateOrBlockedIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (net.isIPv4(normalized)) {
    return isPrivateOrBlockedIpv4(normalized);
  }
  if (net.isIPv6(normalized)) {
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('::ffff:')) {
      return isPrivateOrBlockedIpv4(normalized.slice(7));
    }
    // Unique local (fc00::/7) and link-local (fe80::/10)
    if (
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }
    return false;
  }
  return true;
}

export async function validatePublicHttpsUrl(
  rawUrl: string
): Promise<{ safe: boolean; parsed?: URL; reason?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { safe: false, reason: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'https:') {
    return { safe: false, reason: 'Only HTTPS URLs are permitted for web fetching.' };
  }

  if (parsed.username || parsed.password) {
    return { safe: false, reason: 'Embedded credentials in URLs are not permitted.' };
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.arpa')
  ) {
    return { safe: false, reason: `Blocked internal or local hostname "${host}".` };
  }

  if (net.isIP(host)) {
    if (isPrivateOrBlockedIp(host)) {
      return { safe: false, reason: `Blocked private, loopback, or metadata IP "${host}".` };
    }
    return { safe: true, parsed };
  }

  try {
    const records = await dns.lookup(host, { all: true });
    if (!records || records.length === 0) {
      return { safe: false, reason: `DNS resolution returned no addresses for "${host}".` };
    }
    for (const rec of records) {
      if (isPrivateOrBlockedIp(rec.address)) {
        return {
          safe: false,
          reason: `DNS resolved "${host}" to a blocked internal/private IP address.`,
        };
      }
    }
    return { safe: true, parsed };
  } catch (err: any) {
    return {
      safe: false,
      reason: `DNS lookup failed for "${host}": ${err?.message || 'unknown host'}`,
    };
  }
}

function htmlToReadableText(html: string): { title?: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : undefined;

  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr|section|article|br)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return { title, text: cleaned };
}

export async function safeFetchWebPage(rawUrl: string) {
  let currentUrl = rawUrl.trim();

  // Follow up to 2 validated HTTPS redirects manually (prevents open-redirect SSRF)
  for (let hop = 0; hop <= 2; hop++) {
    const check = await validatePublicHttpsUrl(currentUrl);
    if (!check.safe || !check.parsed) {
      return {
        available: false,
        url: rawUrl,
        error: check.reason || 'Blocked unsafe URL.',
      };
    }

    const res = await fetch(check.parsed.toString(), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'QuantumBot/1.0 (+https://quantumaitech.org)',
        Accept: 'text/html, text/plain, application/json, text/markdown;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location || hop === 2) {
        return {
          available: false,
          url: currentUrl,
          error: `Too many redirects or missing redirect location (HTTP ${res.status}).`,
        };
      }
      currentUrl = new URL(location, check.parsed).toString();
      continue;
    }

    if (!res.ok) {
      return {
        available: false,
        url: currentUrl,
        error: `Page fetch failed with HTTP ${res.status} (${res.statusText}).`,
      };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isAllowedContentType =
      contentType.includes('text/') ||
      contentType.includes('application/json') ||
      contentType.includes('application/xml') ||
      contentType.includes('application/xhtml+xml');

    if (contentType && !isAllowedContentType) {
      return {
        available: false,
        url: currentUrl,
        error: `Unsupported non-text content type "${contentType}".`,
      };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return { available: false, url: currentUrl, error: 'Response body unavailable.' };
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const remaining = MAX_RESPONSE_BYTES - totalBytes;
          if (remaining <= 0) break;
          if (value.byteLength > remaining) {
            chunks.push(value.subarray(0, remaining));
            totalBytes += remaining;
            break;
          }
          chunks.push(value);
          totalBytes += value.byteLength;
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }

    const rawText = new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks));
    let title: string | undefined;
    let bodyText = rawText;

    if (contentType.includes('html') || rawText.trimStart().startsWith('<')) {
      const parsedHtml = htmlToReadableText(rawText);
      title = parsedHtml.title;
      bodyText = parsedHtml.text;
    }

    const truncated = bodyText.length > MAX_EXTRACTED_CHARS;
    const excerpt = truncated ? `${bodyText.slice(0, MAX_EXTRACTED_CHARS)}\n...[truncated]` : bodyText;

    return {
      available: true,
      url: check.parsed.toString(),
      domain: check.parsed.hostname.replace(/^www\./, ''),
      title: title || check.parsed.hostname,
      fetchedAt: new Date().toISOString(),
      truncated,
      content: excerpt,
    };
  }

  return {
    available: false,
    url: rawUrl,
    error: 'Exceeded maximum safe redirect hops.',
  };
}

export const webFetchTool: BotToolImplementation = {
  declaration: {
    name: 'web_fetch',
    description:
      'Retrieve and extract clean readable text from a specific public HTTPS webpage (for example, to read details from a URL returned by web_search). Only active when Web Search is enabled.',
    category: 'web',
    requiredPermissions: ['web_research'],
    timeoutMs: 10000,
    resultFormat: 'JSON object containing available flag, title, url, domain, fetchedAt, and extracted text content.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: {
          type: 'string',
          minLength: 10,
          maxLength: 500,
          pattern: '^https://',
          description: 'Public HTTPS URL to inspect.',
        },
      },
      required: ['url'],
    },
  },
  isEnabled: (context) => Boolean(context.enableWebSearch),
  execute: async (args: Record<string, any>) => {
    return safeFetchWebPage(String(args.url || ''));
  },
};
