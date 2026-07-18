import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'FAQ' };

export default function FaqPage() {
  return (
    <main className="page">
      <h1>FAQ</h1>
      <p>Common questions about recording, transcription modes, and privacy.</p>
    </main>
  );
}
