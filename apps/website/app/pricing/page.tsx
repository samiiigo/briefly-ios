import Link from 'next/link';
import { Button, Stack, Text } from '@briefly/ui';

export default function PricingPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Pricing
      </Text>
      <p className="lead">
        Briefly does not charge an in-app subscription today. The app is free to download; you pay
        only for optional cloud services when you choose to use them.
      </p>

      <div className="pricing-grid">
        <article className="pricing-card">
          <h2>Free</h2>
          <p className="price">$0</p>
          <ul>
            <li>Unlimited local recordings on your device</li>
            <li>On-device transcription where supported</li>
            <li>Library organization, search, and folders</li>
            <li>Account sign-in and library sync (Supabase)</li>
            <li>No credit card required</li>
          </ul>
        </article>

        <article className="pricing-card pricing-card--highlight">
          <h2>Cloud &amp; BYOK</h2>
          <p className="price">Pay as you go</p>
          <ul>
            <li>Cloud transcription via AssemblyAI (usage-based)</li>
            <li>Shared cloud summarization through Briefly&apos;s edge functions</li>
            <li>Bring your own key (BYOK) for OpenRouter, OpenAI, or Gemini</li>
            <li>You control which provider and how much you spend</li>
            <li>No hidden Briefly subscription — honest usage pricing</li>
          </ul>
        </article>
      </div>

      <Stack gap="md" className="content-prose">
        <h2>How billing works today</h2>
        <p>
          The Briefly app itself has no monthly fee. When you enable cloud transcription or
          summarization, costs go to the underlying provider (AssemblyAI, OpenRouter, etc.) or to
          Briefly&apos;s shared cloud quota where offered. BYOK mode sends requests directly with
          your API key stored in the device secure enclave — Briefly never sells your data.
        </p>
        <p>
          We may introduce optional paid plans in the future for hosted storage or team features.
          Existing free functionality will remain clearly labeled.
        </p>
        <Link href="/download">
          <Button variant="primary">Download Briefly</Button>
        </Link>
      </Stack>
    </main>
  );
}
