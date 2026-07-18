import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Careers' };

export default function CareersPage() {
  return (
    <main className="page">
      <h1>Careers</h1>
      <p>Open roles will be listed here.</p>
    </main>
  );
}
