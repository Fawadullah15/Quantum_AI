'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';
import { AdminNotifications } from './AdminNotifications';
import { QuantumLogo } from '@/components/ui/QuantumLogo';
import { AdminToastProvider } from '@/components/admin/AdminToast';
import { AdminConfirmProvider } from '@/components/admin/ConfirmDialog';

export const navSections = [
  {
    label: 'OVERVIEW',
    links: [
      { href: '/admin', label: 'Dashboard', icon: '📊' },
      { href: '/admin/messages', label: 'Contact Messages', icon: '💬' },
      { href: '/admin/careers-partnerships', label: 'Careers & Partnerships', icon: '🤝' },
    ],
  },
  {
    label: 'CONTENT',
    links: [
      { href: '/admin/clients', label: 'Clients / Worked With', icon: '🏢' },
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
    label: 'SITE & SECURITY',
    links: [
      { href: '/admin/media', label: 'Media Library', icon: '🖼️' },
      { href: '/admin/settings', label: 'Website Settings', icon: '⚙️' },
      { href: '/admin/settings/account', label: 'Account Security', icon: '🔒' },
    ],
  },
];

export function AdminShell({
  children,
  userName = 'Admin',
  userRole = 'SUPER ADMIN',
}: {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on mobile whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Get current breadcrumb trail
  const getBreadcrumbs = () => {
    if (pathname === '/admin') return [{ label: 'Dashboard', href: '/admin' }];

    const parts = pathname.split('/').filter(Boolean);
    const crumbs = [];
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      currentPath += `/${parts[i]}`;
      const name = parts[i]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      crumbs.push({ label: name, href: currentPath });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const isLinkActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <AdminToastProvider>
      <AdminConfirmProvider>
        <div className={styles.adminLayout}>
          {/* Mobile Overlay Backdrop */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(2, 6, 23, 0.82)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 90,
              }}
            />
          )}

          {/* Sidebar Drawer */}
          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
              {/* Sidebar Header */}
              <div
                style={{
                  padding: '1.15rem 1rem',
                  borderBottom: '1px solid rgba(31, 41, 55, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Link
                  href="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    textDecoration: 'none',
                    letterSpacing: '0.04em',
                  }}
                >
                  <QuantumLogo width={24} height={24} style={{ filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))' }} />
                  <span>QUANTUM ADMIN</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Link
                    href="/"
                    target="_blank"
                    title="View public live website"
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748B',
                      textDecoration: 'none',
                      padding: '0.2rem 0.45rem',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    ↗
                  </Link>

                  {/* Mobile Close Button */}
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                    className="admin-sidebar-close"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      display: 'none',
                      padding: '0.2rem 0.4rem',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Vertical Navigation Links */}
              <nav
                style={{
                  flex: 1,
                  padding: '0.85rem 0.65rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.15rem',
                }}
              >
                {navSections.map((section) => (
                  <div key={section.label} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '2px' }}>
                    <div
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        color: '#4B5563',
                        padding: '0 0.5rem 0.35rem',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {section.label}
                    </div>

                    {section.links.map((link) => {
                      const active = isLinkActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.45rem 0.65rem',
                            color: active ? '#38BDF8' : '#94A3B8',
                            backgroundColor: active ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                            border: active ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                            textDecoration: 'none',
                            fontSize: '0.84rem',
                            fontWeight: active ? 600 : 500,
                            borderRadius: '6px',
                            width: '100%',
                            boxSizing: 'border-box',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{link.icon}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                            {link.label}
                          </span>
                          {active && (
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: '#38BDF8',
                                boxShadow: '0 0 6px rgba(56, 189, 248, 0.8)',
                              }}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid rgba(31, 41, 55, 0.8)', background: '#070B12' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, #1E3A8A, #0284C7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F1F5F9', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userName}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono, monospace)' }}>
                      {userRole}
                    </div>
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
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono, monospace)',
                      transition: 'all 0.15s',
                    }}
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className={styles.mainContent}>
            {/* Universal Top Bar for both PC and Mobile */}
            <header className={styles.topBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                {/* Mobile Hamburger Toggle */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle navigation"
                  className="admin-hamburger"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    borderRadius: 6,
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className={styles.breadcrumb} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.href}>
                      {idx > 0 && <span style={{ color: '#334155', margin: '0 0.2rem' }}>/</span>}
                      {idx === breadcrumbs.length - 1 ? (
                        <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{crumb.label}</span>
                      ) : (
                        <Link href={crumb.href} style={{ color: '#64748B', textDecoration: 'none' }}>
                          {crumb.label}
                        </Link>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </div>

              {/* Right Action Icons */}
              <div className={styles.topBarActions}>
                <Link
                  href="/"
                  target="_blank"
                  style={{
                    fontSize: '0.75rem',
                    color: '#94A3B8',
                    textDecoration: 'none',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>View Site</span>
                  <span style={{ fontSize: '0.85rem' }}>↗</span>
                </Link>

                {/* Notification Bell Component */}
                <AdminNotifications />

                {/* User Mini Indicator */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #1E3A8A, #0284C7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>

            {/* Page Content Area */}
            <main className={styles.contentArea}>
              {children}
            </main>
          </div>

          <style>{`
            @media (max-width: 768px) {
              .admin-hamburger {
                display: flex !important;
              }
              .admin-sidebar-close {
                display: block !important;
              }
            }
          `}</style>
        </div>
      </AdminConfirmProvider>
    </AdminToastProvider>
  );
}
