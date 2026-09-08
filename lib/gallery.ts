/**
 * Safely normalizes raw gallery data from the database into a clean array of image URLs.
 * Handles JSON arrays, single strings, empty values, invalid JSON, and null/undefined.
 */
export function parseGallery(input: unknown): string[] {
  if (!input) return [];

  let rawList: unknown[] = [];

  if (Array.isArray(input)) {
    rawList = input;
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === '[]') return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
        rawList = [parsed];
      }
    } catch {
      // If not valid JSON, check if it's a direct URL string
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        rawList = [trimmed];
      }
    }
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of rawList) {
    if (typeof item === 'string') {
      const trimmedUrl = item.trim();
      if (trimmedUrl.length > 0 && !seen.has(trimmedUrl)) {
        seen.add(trimmedUrl);
        result.push(trimmedUrl);
      }
    }
  }

  return result;
}
