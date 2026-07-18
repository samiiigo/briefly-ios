import Link from 'next/link';
import { Button, Text } from '@briefly/ui';

export default function HomePage() {
  return (
    <div className="landing">
      <main className="landing-inner">
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
      </main>
    </div>
  );
}
