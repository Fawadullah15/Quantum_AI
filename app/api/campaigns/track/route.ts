import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Basic IP or client identifier for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'anonymous-client';
    const rateLimit = checkRateLimit(`campaign:track:${ip}`, 120, 60 * 1000); // 120 events per minute

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // 2. Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { campaignId, event } = body;

    if (!campaignId || typeof campaignId !== 'string' || campaignId.trim().length === 0) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    if (event !== 'impression' && event !== 'click') {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // 3. Atomically update metric
    const cleanId = campaignId.trim();
    const updateData = event === 'click'
      ? { clicks: { increment: 1 } }
      : { impressions: { increment: 1 } };

    await prisma.campaign.update({
      where: { id: cleanId },
      data: updateData,
    }).catch((err) => {
      // If campaign record not found or DB offline, catch safely without crashing
      console.warn(`[Campaign Tracking] Failed to track ${event} for ${cleanId}:`, err?.message);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Campaign Tracking] Error:', error);
    return NextResponse.json({ error: 'Internal tracking error' }, { status: 500 });
  }
}
