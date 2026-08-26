'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Text } from '@briefly/ui';
import { useAuth } from '@/features/auth';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/library', label: 'Library' },
  { href: '/search', label: 'Search' },
  { href: '/settings', label: 'Settings' },
  { href: '/account', label: 'Account' },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, status } = useAuth();
  const hideChrome = pathname.startsWith('/sign-in') || pathname.startsWith('/auth');

  if (hideChrome) {
    return <div className="auth-shell">{children}</div>;
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Primary">
        <Link href="/" className="app-brand">
          Briefly
        </Link>
        <nav className="app-nav">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="app-sidebar__footer">
          <Text as="p" variant="caption">
            {status === 'loading' ? '…' : (user?.email ?? 'Signed out')}
          </Text>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
