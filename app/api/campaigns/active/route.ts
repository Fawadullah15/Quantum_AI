import { NextResponse } from 'next/server';
import { getActiveCampaign } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const campaign = await getActiveCampaign();
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('[API] Active campaign error:', error);
    return NextResponse.json({ campaign: null }, { status: 500 });
  }
}
