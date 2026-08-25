import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSiteSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[API Admin Settings GET error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected an array of { key, value }' }, { status: 400 });
    }

    const updates = body.map(async (item: { key: string; value: string }) => {
      if (!item.key) return null;
      return prisma.siteSettings.upsert({
        where: { key: item.key },
        update: { value: item.value ?? '' },
        create: { key: item.key, value: item.value ?? '' },
      });
    });

    await Promise.all(updates);

    revalidatePath('/', 'layout');
    revalidatePath('/admin/settings');
    revalidatePath('/');
    revalidatePath('/contact');

    return NextResponse.json({ success: true, count: body.length });
  } catch (error) {
    console.error('[API Admin Settings PATCH error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
