import Link from 'next/link';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/download', label: 'Download' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href="/" className="site-footer__logo">
            Briefly
          </Link>
          <p className="site-footer__tagline">
            Voice notes with AI transcription, summaries, and search — on your device or in the
            cloud.
          </p>
        </div>
        <div className="site-footer__columns">
          {footerColumns.map((column) => (
            <div key={column.title} className="site-footer__column">
              <h3 className="site-footer__column-title">{column.title}</h3>
              <ul className="site-footer__links">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="site-footer__bottom">
        <p>© {year} Briefly. All rights reserved.</p>
        <p>
          <Link href="/docs">Documentation</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/contact">Support</Link>
        </p>
      </div>
    </footer>
  );
}
