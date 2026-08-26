import Link from 'next/link';
import { Text } from '@briefly/ui';

const faqs = [
  {
    question: 'Is Briefly free?',
    answer:
      'Yes. The app has no in-app subscription today. You can record, organize, and search locally for free. Cloud transcription and AI summarization may incur costs from third-party providers when you enable those features.',
  },
  {
    question: 'Where are my recordings stored?',
    answer:
      'By default, recordings stay on your device. If you sign in, library metadata syncs to Supabase (account_recordings, account_folders). Audio files remain local unless you explicitly enable cloud backup features.',
  },
  {
    question: 'What is BYOK?',
    answer:
      'Bring Your Own Key. You can connect your OpenRouter, OpenAI, or Gemini API key in Settings. Summarization requests go to your provider; keys are stored in the device secure enclave, not in synced settings payloads.',
  },
  {
    question: 'Can I use on-device transcription?',
    answer:
      'Yes, where your device supports it. On-device mode keeps audio and processing local. Cloud mode uses AssemblyAI for higher accuracy and broader language support.',
  },
  {
    question: 'Do you sell my data?',
    answer:
      'No. Briefly does not sell your recordings, transcripts, or personal information. Cloud providers process data only when you opt in to cloud features, under their respective privacy policies.',
  },
  {
    question: 'How does account sync work?',
    answer:
      'When signed in, your library state syncs to Supabase mirror tables. Conflicts resolve by updatedAt timestamp — the newest version wins. API keys are never synced.',
  },
  {
    question: 'Is there a web app?',
    answer:
      'Yes. apps/web provides a signed-in web library. This marketing site (apps/website) is static and does not require an account.',
  },
  {
    question: 'How do I get support?',
    answer:
      'Email us via the contact form or reach out at support@briefly.app. For bugs and feature requests, open an issue in the monorepo if you have access.',
  },
] as const;

export default function FaqPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        FAQ
      </Text>
      <p className="lead">
        Answers to common questions about transcription, privacy, billing, and how your data is
        stored.
      </p>

      <div className="faq-list">
        {faqs.map((faq) => (
          <article key={faq.question} className="faq-item">
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>

      <p className="content-prose" style={{ marginTop: '2rem' }}>
        Still have questions? <Link href="/contact">Contact us</Link> or read the{' '}
        <Link href="/docs">documentation</Link>.
      </p>
    </main>
  );
}
