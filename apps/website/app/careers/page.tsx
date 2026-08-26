import Link from 'next/link';
import { Button, Text } from '@briefly/ui';

const roles = [
  {
    title: 'Software Engineer',
    location: 'Remote · Full-time',
    description:
      'Build the Briefly mobile and backend stack: React Native, TypeScript, Supabase edge functions, and on-device ML pipelines. You care about privacy, offline-first UX, and clean monorepo architecture.',
  },
  {
    title: 'Product Designer',
    location: 'Remote · Contract or Full-time',
    description:
      'Shape the voice-note experience from recording to library search. Strong systems thinking, accessibility, and mobile-native interaction design. Experience with AI-assisted products is a plus.',
  },
] as const;

export default function CareersPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Careers
      </Text>
      <p className="lead">
        Join us in building thoughtful tools for voice, memory, and AI-assisted productivity.
      </p>

      <div className="content-prose">
        <p>
          Briefly is a small team obsessed with making voice capture useful after you stop talking.
          We work async-friendly, open-source friendly, and privacy-first.
        </p>
      </div>

      <h2 style={{ marginTop: '2rem', fontSize: '1.25rem' }}>Open roles</h2>

      {roles.map((role) => (
        <article key={role.title} className="role-card">
          <h3>{role.title}</h3>
          <p className="role-meta">{role.location}</p>
          <p>{role.description}</p>
        </article>
      ))}

      <p className="content-prose" style={{ marginTop: '1.5rem' }}>
        Don&apos;t see a fit? Send your portfolio and a note about what you&apos;d build at Briefly
        to <a href="mailto:careers@briefly.app">careers@briefly.app</a>.
      </p>

      <Link href="/contact">
        <Button variant="secondary">Get in touch</Button>
      </Link>
    </main>
  );
}
