'use server';

import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { DEFAULT_SETTINGS, SiteSettingsMap } from '@/lib/settings';

export async function updateSiteSettings(data: { key: string; value: string }[]) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized: You must be logged in as an administrator to update site settings.');
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid payload: expected non-empty array of settings.');
  }

  // Synchronize company_name and QUANTUM_AI if either is present
  const payload = [...data];
  const companyNameItem = payload.find((i) => i.key === 'company_name');
  const quantumAiItem = payload.find((i) => i.key === 'QUANTUM_AI');

  if (companyNameItem && !quantumAiItem) {
    payload.push({ key: 'QUANTUM_AI', value: companyNameItem.value });
  } else if (quantumAiItem && !companyNameItem) {
    payload.push({ key: 'company_name', value: quantumAiItem.value });
  }

  for (const item of payload) {
    if (!item.key) continue;
    await prisma.siteSettings.upsert({
      where: { key: item.key },
      update: { value: item.value ?? '' },
      create: { key: item.key, value: item.value ?? '' },
    });
  }

  // Revalidate relevant pages and layout
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/contact');
  revalidatePath('/about');
  revalidatePath('/work');

  return { success: true, count: payload.length };
}

export async function resetSiteSettingsToDefaults() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized: You must be logged in as an administrator to reset site settings.');
  }

  const defaultEntries = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  for (const item of defaultEntries) {
    await prisma.siteSettings.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: { key: item.key, value: item.value },
    });
  }

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/contact');
  revalidatePath('/about');
  revalidatePath('/work');

  return { success: true };
}
