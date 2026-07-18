import type { Metadata } from 'next';
import { generateThemeCss } from '@briefly/theme';
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
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: generateThemeCss() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
