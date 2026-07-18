import Link from 'next/link';
import { Text } from '@briefly/ui';

export default function TermsPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Terms of Service
      </Text>
      <p className="lead">
        Terms governing your use of Briefly apps, website, and related services. Last updated: July
        2026.
      </p>

      <div className="content-prose">
        <h2>1. Acceptance</h2>
        <p>
          By downloading, accessing, or using Briefly, you agree to these terms. If you do not
          agree, do not use the service.
        </p>

        <h2>2. Service description</h2>
        <p>
          Briefly provides voice recording, transcription, summarization, and library management
          tools. Features may change as we improve the product. Cloud and AI features depend on
          third-party providers and your device capabilities.
        </p>

        <h2>3. Your content</h2>
        <p>
          You retain ownership of recordings and transcripts you create. You are responsible for
          ensuring you have the right to record and process any audio you capture, including consent
          from other participants where required by law.
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to use Briefly to:</p>
        <ul>
          <li>Violate applicable laws or third-party rights</li>
          <li>Upload malware or attempt to disrupt the service</li>
          <li>Abuse shared cloud quotas or API endpoints</li>
          <li>Reverse engineer the service except where permitted by law</li>
        </ul>

        <h2>5. Third-party services</h2>
        <p>
          Cloud transcription and summarization may use AssemblyAI, OpenRouter, OpenAI, Gemini, or
          other providers. Your use of those services is subject to their terms. BYOK mode connects
          directly to providers using keys you supply.
        </p>

        <h2>6. Disclaimers</h2>
        <p>
          Briefly is provided &quot;as is&quot; without warranties of accuracy for AI-generated
          transcripts or summaries. Verify important information independently.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Briefly is not liable for indirect, incidental, or
          consequential damages arising from your use of the service.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update these terms. Material changes will be posted on this page with an updated
          date. Continued use after changes constitutes acceptance.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions: <a href="mailto:legal@briefly.app">legal@briefly.app</a>. See our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
