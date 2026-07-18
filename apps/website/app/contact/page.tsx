import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <main className="page">
      <h1>Contact</h1>
      <p>Reach the Briefly team. Form wiring comes later.</p>
    </main>
  );
}
