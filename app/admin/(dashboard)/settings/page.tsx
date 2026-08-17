import prisma from '@/lib/db'
import SettingsClient from './client'

export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findMany()
  return <SettingsClient initialData={settings} />
}
