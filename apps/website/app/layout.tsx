import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://briefly.app'),
  title: {
    default: 'Briefly',
    template: '%s · Briefly',
  },
  description:
    'Record meetings and voice notes. Get transcripts and summaries — on device or in the cloud.',
  openGraph: {
    title: 'Briefly',
    description: 'Voice recorder with AI transcription and summarization.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="site-header">
            <Link href="/" className="brand">
              Briefly
            </Link>
            <nav className="site-nav" aria-label="Marketing">
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/docs">Docs</Link>
              <Link href="/faq">FAQ</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </header>
          {children}
          <footer className="site-footer">
            <Link href="/privacy">Privacy</Link>
            {' · '}
            <Link href="/terms">Terms</Link>
            {' · '}
            <Link href="/careers">Careers</Link>
            {' · '}
            <Link href="/changelog">Changelog</Link>
            {' · '}
            <Link href="/blog">Blog</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
