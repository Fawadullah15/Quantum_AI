import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import '../admin-tailwind.css'
import { AdminShell } from './AdminShell'
import { QuantumLogo } from '@/components/ui/QuantumLogo'

const navSections = [
  {
    label: 'OVERVIEW',
    links: [
      { href: '/admin', label: 'Dashboard', icon: '📊' },
      { href: '/admin/messages', label: 'Contact Messages', icon: '💬' },
    ],
  },
  {
    label: 'CONTENT',
    links: [
      { href: '/admin/case-studies', label: 'Works & Case Studies', icon: '📁' },
      { href: '/admin/services', label: 'Services', icon: '⚡' },
      { href: '/admin/products', label: 'Products', icon: '📦' },
      { href: '/admin/technology', label: 'Technology Stack', icon: '💻' },
      { href: '/admin/blog', label: 'Blog Articles', icon: '📝' },
      { href: '/admin/testimonials', label: 'Testimonials', icon: '⭐' },
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
      { href: '/admin/settings', label: 'Website Settings', icon: '⚙️' },
    ],
  },
]

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Sidebar Header */}
      <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '1px solid rgba(31, 41, 55, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', textDecoration: 'none', letterSpacing: '0.05em' }}>
          <QuantumLogo width={26} height={26} style={{ filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))' }} />
          QUANTUM ADMIN
        </Link>
        <Link
          href="/"
          target="_blank"
          style={{ fontSize: '0.72rem', color: '#64748B', textDecoration: 'none', padding: '0.2rem 0.45rem', borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          ↗
        </Link>
      </div>

      {/* Vertical Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {navSections.map((section) => (
          <div key={section.label} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '3px' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#4B5563', padding: '0 0.5rem 0.35rem', textTransform: 'uppercase' }}>
              {section.label}
            </div>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="admin-nav-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.45rem 0.65rem',
                  color: '#94A3B8',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{link.icon}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid rgba(31, 41, 55, 0.8)', background: '#070B12' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #1E3A8A, #0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name ?? 'Admin'}</div>
            <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role ?? 'SUPER ADMIN'}</div>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.4rem 0',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            Sign Out
          </button>
        </form>
      </div>

      <style>{`
        .admin-nav-item:hover {
          color: #F8FAFC !important;
          background-color: rgba(255, 255, 255, 0.06) !important;
        }
      `}</style>
    </div>
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
