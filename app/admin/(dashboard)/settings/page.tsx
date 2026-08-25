import React from 'react';
import { getSiteSettings } from '@/lib/settings';
import SettingsClient from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const settings = await getSiteSettings();
  return <SettingsClient initialSettings={settings} />;
}
