import type { Metadata } from 'next';
import { generateThemeCss } from '@briefly/theme';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Briefly — Voice notes with AI transcription',
  description:
    'Capture voice notes on the go. Briefly transcribes and summarizes your recordings with AI so you can find what matters later.',
  metadataBase: new URL('https://briefly.app'),
  openGraph: {
    title: 'Briefly — Voice notes with AI transcription',
    description:
      'Capture voice notes on the go. Briefly transcribes and summarizes your recordings with AI.',
    type: 'website',
    siteName: 'Briefly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Briefly — Voice notes with AI transcription',
    description:
      'Capture voice notes on the go. Briefly transcribes and summarizes your recordings with AI.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: generateThemeCss() }} />
      </head>
      <body>
        <div className="site-shell">
          <SiteHeader />
          <div className="site-main">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
