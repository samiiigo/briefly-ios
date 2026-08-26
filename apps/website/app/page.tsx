import Link from 'next/link';
import { Button, Stack, Text } from '@briefly/ui';

const previewFeatures = [
  {
    icon: '🎙️',
    title: 'Record anywhere',
    description:
      'Capture meetings, ideas, and voice memos with one tap. Pause, resume, and keep going.',
  },
  {
    icon: '📝',
    title: 'Transcribe & summarize',
    description:
      'Turn speech into searchable text and concise summaries with on-device or cloud AI.',
  },
  {
    icon: '🗂️',
    title: 'Organize your library',
    description: 'Folders, favorites, imports, and full-text search across every recording.',
  },
] as const;

export default function HomePage() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <p className="landing-brand">Briefly</p>

        <Text as="h1" variant="title" className="landing-headline">
          Voice notes that write themselves
        </Text>

        <Text as="p" variant="body" className="landing-support">
          Record on the go. Briefly transcribes and summarizes with AI so you can search, share, and
          act on what you said.
        </Text>

        <div className="landing-cta">
          <Link href="/download">
            <Button variant="primary">Download</Button>
          </Link>
          <Link href="/features">
            <Button variant="secondary">Learn more</Button>
          </Link>
        </div>
      </section>

      <section className="landing-features-preview">
        <h2>Everything you need after you stop talking</h2>
        <p>
          Briefly is built for people who think out loud — fast capture, thoughtful processing, and
          a library you can actually search.
        </p>
        <div className="feature-grid feature-grid--three">
          {previewFeatures.map((feature) => (
            <article key={feature.title} className="feature-card">
              <span className="feature-card__icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-bottom-cta">
        <Stack align="center" gap="md">
          <h2>Ready to try Briefly?</h2>
          <p>
            Download the mobile app for iOS or Android. Your recordings stay on your device — cloud
            sync and AI processing are optional.
          </p>
          <Link href="/download">
            <Button variant="primary">Get Briefly free</Button>
          </Link>
        </Stack>
      </section>
    </div>
  );
}
