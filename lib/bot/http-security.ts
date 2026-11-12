import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates that browser-originated state-changing requests come from the same origin
 * (or configured public site origin). Requests without an Origin header (CLI, server-to-server,
 * automated tests) remain permitted since cookie/auth checks still apply independently.
 */
export function enforceSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  if (!origin) {
    return null;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return NextResponse.json(
      { error: 'Cross-origin request blocked: malformed Origin header.' },
      { status: 403 }
    );
  }

  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(',')[0]
    .trim()
    .toLowerCase();

  const originHost = parsedOrigin.host.toLowerCase();
  if (host && originHost === host) {
    return null;
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    try {
      const siteOrigin = new URL(configuredSiteUrl);
      if (parsedOrigin.origin.toLowerCase() === siteOrigin.origin.toLowerCase()) {
        return null;
      }
    } catch {
      // Ignore malformed env URL
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && parsedOrigin.hostname.toLowerCase() === vercelUrl.toLowerCase()) {
    return null;
  }

  // Allow explicit loopback dev pairs (localhost <-> 127.0.0.1 on the same port)
  const isLoopback = (h: string) =>
    h.startsWith('localhost:') || h.startsWith('127.0.0.1:') || h === 'localhost' || h === '127.0.0.1';
  if (host && isLoopback(originHost) && isLoopback(host)) {
    const oPort = originHost.split(':')[1] || '';
    const hPort = host.split(':')[1] || '';
    if (oPort === hPort) return null;
  }

  return NextResponse.json(
    {
      error: `Cross-origin request denied for origin "${parsedOrigin.origin}".`,
    },
    {
      status: 403,
      headers: {
        Vary: 'Origin',
      },
    }
  );
}
