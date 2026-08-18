import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import styles from './layout.module.css'
import '../admin-tailwind.css'
import { AdminShell } from './AdminShell'

const navSections = [
  {
    label: 'OVERVIEW',
    links: [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/messages', label: 'Messages' },
    ],
  },
  {
    label: 'CONTENT',
    links: [
      { href: '/admin/blog', label: 'Blog' },
      { href: '/admin/case-studies', label: 'Case Studies' },
      { href: '/admin/services', label: 'Services' },
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/technology', label: 'Technology' },
    ],
  },
  {
    label: 'PEOPLE',
    links: [
      { href: '/admin/leadership', label: 'Leadership' },
      { href: '/admin/team', label: 'Team' },
    ],
  },
  {
    label: 'SITE',
    links: [
      { href: '/admin/media', label: 'Media' },
      { href: '/admin/settings', label: 'Settings' },
    ],
  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const user = session.user as { name?: string; email?: string; role?: string }

  const sidebarContent = (
    <>
      <div className={styles.sidebarHeader}>
        <Link href="/admin" className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          ADMIN PANEL
        </Link>
        <Link href="/" className={styles.viewSite} target="_blank">
          ↗ View Site
        </Link>
      </div>

      <nav className={styles.sidebarNav}>
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#4B5563', padding: '0 0.75rem', marginBottom: '0.375rem' }}>
              {section.label}
            </div>
            {section.links.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <div className={styles.userName}>{user?.name ?? 'Admin'}</div>
            <div className={styles.userRole}>{user?.role ?? 'ADMIN'}</div>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className={styles.signOutBtn}>
            Sign Out
          </button>
        </form>
      </div>
    </>
  )

  return (
    <AdminShell sidebar={sidebarContent}>
      {children}
    </AdminShell>
  )
}
