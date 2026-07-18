import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Changelog' };

export default function ChangelogPage() {
  return (
    <main className="page">
      <h1>Changelog</h1>
      <p>Release notes scaffold for the marketing website.</p>
    </main>
  );
}
