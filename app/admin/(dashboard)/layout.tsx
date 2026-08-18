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
      { href: '/admin', label: 'Dashboard', icon: '📊' },
      { href: '/admin/messages', label: 'Messages', icon: '💬' },
    ],
  },
  {
    label: 'CONTENT',
    links: [
      { href: '/admin/case-studies', label: 'Case Studies', icon: '📁' },
      { href: '/admin/services', label: 'Services', icon: '⚡' },
      { href: '/admin/products', label: 'Products', icon: '📦' },
      { href: '/admin/technology', label: 'Technology', icon: '💻' },
      { href: '/admin/blog', label: 'Blog', icon: '📝' },
    ],
  },
  {
    label: 'PEOPLE',
    links: [
      { href: '/admin/leadership', label: 'Leadership & Team', icon: '👥' },
    ],
  },
  {
    label: 'SITE',
    links: [
      { href: '/admin/media', label: 'Media Library', icon: '🖼️' },
      { href: '/admin/settings', label: 'Site Settings', icon: '⚙️' },
    ],
  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (err) {
    console.error('Error fetching admin session:', err)
  }

  if (!session) {
    redirect('/admin/login')
  }

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

  const sidebarContent = (
    <>
      <div className={styles.sidebarHeader}>
        <Link href="/admin" className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          QUANTUM ADMIN
        </Link>
        <Link href="/" className={styles.viewSite} target="_blank">
          ↗
        </Link>
      </div>

      <nav className={styles.sidebarNav}>
        {navSections.map((section) => (
          <div key={section.label} className={styles.navSection}>
            <div className={styles.sectionLabel}>{section.label}</div>
            {section.links.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>
                <span>{link.label}</span>
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
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className={styles.userName}>{user?.name ?? 'Admin'}</div>
            <div className={styles.userRole}>{user?.role ?? 'SUPER ADMIN'}</div>
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
    <AdminShell
      sidebar={sidebarContent}
      userName={user?.name ?? 'Admin'}
      userRole={user?.role ?? 'ADMIN'}
    >
      {children}
    </AdminShell>
  )
}
