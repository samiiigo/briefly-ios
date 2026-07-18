import Link from 'next/link';
import { Button, Stack, Text } from '@briefly/ui';

export default function DownloadPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Download
      </Text>
      <p className="lead">
        Get Briefly for iOS and Android. Your recordings stay on your device with optional cloud
        backup, sync, and AI processing.
      </p>

      <div className="download-badges">
        <a
          href="https://apps.apple.com"
          className="store-badge"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span aria-hidden="true">🍎</span>
          App Store
        </a>
        <span className="store-badge store-badge--placeholder">
          <span aria-hidden="true">🤖</span>
          Google Play — coming soon
        </span>
      </div>

      <Stack gap="md" className="content-prose">
        <h2>iOS — TestFlight &amp; dev builds</h2>
        <p>
          Public App Store release is in progress. For early access, join the TestFlight beta or
          install a development build from the monorepo:
        </p>
        <ol>
          <li>
            Clone the <code>briefly</code> monorepo and open <code>apps/mobile</code>
          </li>
          <li>
            Run <code>pnpm install</code> and <code>pnpm --filter @briefly/mobile start</code>
          </li>
          <li>Use Expo Go or a dev client build with your Supabase project credentials</li>
        </ol>

        <h2>Android</h2>
        <p>
          Android builds follow the same Expo workflow. Production Play Store listing is not live
          yet — use internal testing tracks or local dev builds while we finalize store assets.
        </p>

        <h2>Web app</h2>
        <p>
          A companion web library is available in <code>apps/web</code> for signed-in users. The
          marketing site you are reading now is static and does not require an account.
        </p>

        <Link href="/docs">
          <Button variant="secondary">Read the docs</Button>
        </Link>
      </Stack>
    </main>
  );
}
