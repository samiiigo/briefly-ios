import Link from 'next/link';
import { Stack, Text } from '@briefly/ui';

const features = [
  {
    icon: '🎙️',
    title: 'Record',
    description:
      'High-quality voice capture with pause/resume, background recording support, and instant save. Import audio from other apps into your library.',
  },
  {
    icon: '📝',
    title: 'Transcribe',
    description:
      'Cloud transcription via AssemblyAI or on-device processing where supported. Speaker labels, timestamps, and live preview while recording.',
  },
  {
    icon: '✨',
    title: 'Summarize',
    description:
      'AI-generated summaries and key insights from your transcript. Use shared cloud processing or bring your own API key (BYOK).',
  },
  {
    icon: '🗂️',
    title: 'Organize',
    description:
      'System folders (Unlisted, Archived, Recently Deleted), custom user folders, favorites, and pinned folders in your library.',
  },
  {
    icon: '🔍',
    title: 'Search',
    description:
      'Full-text search across titles, transcripts, and summaries. Find the exact moment you need without scrubbing through audio.',
  },
  {
    icon: '🔒',
    title: 'Privacy',
    description:
      'On-device transcription and summarization options keep sensitive audio local. Cloud features are opt-in; API keys stay in secure storage.',
  },
] as const;

export default function FeaturesPage() {
  return (
    <main className="content-page content-page--wide">
      <Text as="h1" variant="title">
        Features
      </Text>
      <p className="lead">
        Briefly turns voice into structured, searchable knowledge — with processing modes you
        control.
      </p>

      <div className="feature-grid feature-grid--three">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <span className="feature-card__icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>

      <Stack gap="md" className="content-prose" style={{ marginTop: '3rem' }}>
        <h2>Built for real workflows</h2>
        <p>
          Whether you are capturing meeting notes, journaling, or interviewing, Briefly keeps the
          original audio, transcript, and summary together. Sync your library across devices with
          Supabase when you sign in — or stay fully local.
        </p>
        <p>
          <Link href="/pricing">See pricing and processing options →</Link>
        </p>
      </Stack>
    </main>
  );
}
