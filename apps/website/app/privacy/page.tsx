import Link from 'next/link';
import { Text } from '@briefly/ui';

export default function PrivacyPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Privacy Policy
      </Text>
      <p className="lead">
        How Briefly collects, uses, and protects your recordings, transcripts, and account
        information. Last updated: July 2026.
      </p>

      <div className="content-prose">
        <h2>Overview</h2>
        <p>
          Briefly is designed privacy-first. Recordings are stored on your device by default. Cloud
          features are opt-in. We do not sell your personal data.
        </p>

        <h2>Data on your device</h2>
        <p>
          Audio files, transcripts, and summaries are stored locally in app storage. API keys for
          BYOK providers are kept in the platform secure enclave (Keychain / Keystore) and are not
          included in cloud sync payloads.
        </p>

        <h2>Account &amp; sync (Supabase)</h2>
        <p>
          If you create an account, library metadata syncs to Supabase tables (account_recordings,
          account_folders, account_settings). This includes titles, transcript text, summaries, and
          preferences — not raw API keys. Authentication uses Supabase Auth; row-level security
          restricts data to your user id.
        </p>

        <h2>Cloud processing</h2>
        <p>
          When you enable cloud transcription or summarization, audio or transcript text may be sent
          to AssemblyAI, OpenRouter, OpenAI, Gemini, or other providers you configure. Processing
          occurs only for recordings you explicitly run through those pipelines.
        </p>

        <h2>BYOK (Bring Your Own Key)</h2>
        <p>
          In BYOK mode, requests go directly from your device to your chosen provider using your API
          key. Briefly does not store provider keys on our servers.
        </p>

        <h2>Analytics &amp; usage</h2>
        <p>
          We may log anonymized usage events (e.g. summarize calls) to operate shared cloud quotas.
          We do not use your transcript content for advertising or model training.
        </p>

        <h2>Data retention &amp; deletion</h2>
        <p>
          Deleted recordings move to Recently Deleted and can be purged per your retention settings.
          Account deletion requests remove synced metadata from Supabase; local data is cleared when
          you uninstall the app.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy questions: <a href="mailto:privacy@briefly.app">privacy@briefly.app</a>. See also
          our <Link href="/terms">Terms of Service</Link>.
        </p>
      </div>
    </main>
  );
}
