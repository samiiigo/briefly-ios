import type { Metadata } from 'next';
import { generateThemeCss } from '@briefly/theme';
import { AppProviders } from '@/components/AppProviders';
import { AppShell } from '@/components/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Briefly',
  description: 'Voice notes with AI transcription',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <style dangerouslySetInnerHTML={{ __html: generateThemeCss() }} />
      </head>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
