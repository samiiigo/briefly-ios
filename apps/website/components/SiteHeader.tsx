import Link from 'next/link';

const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/download', label: 'Download' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          Briefly
        </Link>
        <nav className="site-header__nav" aria-label="Main">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="site-header__link">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/download" className="site-header__cta">
          Get the app
        </Link>
      </div>
    </header>
  );
}
