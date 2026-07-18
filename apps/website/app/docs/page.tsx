import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Documentation' };

export default function DocsPage() {
  return (
    <main className="page">
      <h1>Documentation</h1>
      <p>Product documentation scaffold — independently deployable from the app monorepo.</p>
    </main>
  );
}
