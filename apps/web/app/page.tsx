import Link from 'next/link';
import { Button, Text } from '@briefly/ui';

const navLinks = [
  { href: '/library', label: 'Library' },
  { href: '/search', label: 'Search' },
  { href: '/settings', label: 'Settings' },
  { href: '/account', label: 'Account' },
];

export default function HomePage() {
  return (
    <main className="page">
      <nav className="page-nav" aria-label="Main">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>

      <header className="page-header">
        <Text as="h1" variant="title">
          Dashboard
        </Text>
        <Text as="p" variant="body">
          Your recordings, transcripts, and summaries will appear here once you sign in.
        </Text>
      </header>

      <div className="dashboard-actions">
        <Button variant="primary">Open library</Button>
        <Button variant="secondary">New recording</Button>
      </div>
    </main>
  );
}
