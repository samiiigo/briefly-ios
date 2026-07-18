import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Recording, transcription, summarization, library, and search.',
};

export default function FeaturesPage() {
  return (
    <main className="page">
      <h1>Features</h1>
      <p>
        One-tap recording, live or on-device transcription, cloud or local summarization, folders,
        favorites, and full-text search across your library.
      </p>
    </main>
  );
}
