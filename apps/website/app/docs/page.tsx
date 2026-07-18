import Link from 'next/link';
import { Text } from '@briefly/ui';

export default function DocsPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Documentation
      </Text>
      <p className="lead">
        Getting started with Briefly — from first recording to cloud sync and monorepo development.
      </p>

      <div className="content-prose">
        <h2>Getting started</h2>
        <ol>
          <li>
            Download Briefly for iOS or Android from the <Link href="/download">download page</Link>
            .
          </li>
          <li>Grant microphone permission and record your first voice note.</li>
          <li>Choose transcription mode in Settings: on-device or cloud.</li>
          <li>Optionally sign in to sync your library across devices.</li>
        </ol>

        <h2>Processing modes</h2>
        <p>
          <strong>On-device</strong> keeps audio and models local when your hardware supports it.
          <strong> Cloud</strong> sends audio to AssemblyAI for transcription. Summarization can use
          shared cloud processing or your own API key (BYOK) for OpenRouter, OpenAI, or Gemini.
        </p>

        <h2>Monorepo layout</h2>
        <p>The Briefly codebase is a pnpm + Turborepo monorepo:</p>
        <ul>
          <li>
            <code>apps/mobile</code> — Expo React Native app
          </li>
          <li>
            <code>apps/web</code> — Next.js signed-in web library
          </li>
          <li>
            <code>apps/website</code> — static marketing site (this site)
          </li>
          <li>
            <code>apps/backend</code> — Supabase edge functions and shared API/services
          </li>
          <li>
            <code>packages/types</code> — shared TypeScript types
          </li>
          <li>
            <code>packages/ui</code> — shared UI primitives
          </li>
          <li>
            <code>packages/validation</code> — input validation schemas
          </li>
        </ul>

        <h2>Account library sync</h2>
        <p>
          When signed in, recordings and folders sync to Supabase tables{' '}
          <code>account_recordings</code>, <code>account_folders</code>, and{' '}
          <code>account_settings</code>. Conflicts merge by <code>updatedAt</code> timestamp.
        </p>

        <h2>Need help?</h2>
        <p>
          See the <Link href="/faq">FAQ</Link> or <Link href="/contact">contact support</Link>.
        </p>
      </div>
    </main>
  );
}
