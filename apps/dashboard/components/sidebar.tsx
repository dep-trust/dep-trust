'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions'

const NAV_ITEMS = [
  { href: '/scans', label: 'Scans' },
  { href: '/allowlist', label: 'Allowlist' },
  { href: '/github', label: 'GitHub' },
  { href: '/cli-auth', label: 'CLI Auth' },
  { href: '/settings', label: 'Settings' },
]

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <Link href="/scans" className="wordmark">dep-trust</Link>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link${pathname.startsWith(href) ? ' nav-link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="user-email" title={email}>{email}</span>
          <form action={logoutAction}>
            <button type="submit" className="btn btn--ghost" style={{ padding: '5px 10px', fontSize: '12px' }}>
              Log out
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
