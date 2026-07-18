import { Text } from '@briefly/ui';

const releases = [
  {
    version: '5.2.3',
    date: '2026-07-15',
    items: [
      'Account library sync: account_recordings, account_folders, account_settings tables',
      'Merge-by-updatedAt reconciliation on sign-in',
      'Backend API layer skeleton for health and library routes',
    ],
  },
  {
    version: '5.2.2',
    date: '2026-07-08',
    items: [
      'Summarize edge function with OpenRouter shared key support',
      'Key insights and main emoji in summary responses',
      'Usage events tracking for cloud summarize calls',
    ],
  },
  {
    version: '5.2.1',
    date: '2026-06-28',
    items: [
      'AssemblyAI transcription pipeline via edge functions',
      'Transcription job status polling improvements',
      'BYOK validation for OpenRouter, OpenAI, and Gemini keys',
    ],
  },
  {
    version: '5.2.0',
    date: '2026-06-15',
    items: [
      'Monorepo Phase 1: shared packages (types, ui, theme, validation)',
      'Expo mobile app with recording, library, and settings',
      'Static marketing website export',
    ],
  },
  {
    version: '5.1.4',
    date: '2026-05-30',
    items: [
      'On-device summarization with local Gemma model download',
      'Pinned folders (max 6) in library',
      'Recently Deleted retention and restore flow',
    ],
  },
] as const;

export default function ChangelogPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Changelog
      </Text>
      <p className="lead">
        Release notes and improvements across Briefly for mobile, web, and backend services.
      </p>

      <div>
        {releases.map((release) => (
          <article key={release.version} className="changelog-entry">
            <p className="version">
              v{release.version} · {release.date}
            </p>
            <h2>What&apos;s new</h2>
            <ul>
              {release.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
