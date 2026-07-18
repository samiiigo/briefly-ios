import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Text } from '@briefly/ui';
import { blogPosts, getBlogPost } from '../../../lib/blogPosts';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="content-page">
      <p className="blog-card__meta">
        {post.date} · {post.author} · {post.readTime}
      </p>
      <Text as="h1" variant="title">
        {post.title}
      </Text>

      <article className="content-prose">
        {slug === 'introducing-briefly' && (
          <>
            <p>
              Voice is the fastest way to capture an idea — but audio alone is hard to search,
              share, and act on. Briefly closes that gap with transcription, AI summaries, and a
              library designed for how people actually think out loud.
            </p>
            <h2>Why voice notes break down</h2>
            <p>
              Most voice memo apps stop at the recording. You end up with a growing pile of files
              you never revisit. Briefly treats every recording as structured data: audio,
              transcript, summary, and metadata you can filter and search.
            </p>
            <h2>What makes Briefly different</h2>
            <ul>
              <li>Processing modes you control — on-device, cloud, or BYOK</li>
              <li>Honest pricing with no in-app subscription today</li>
              <li>Open monorepo architecture for transparency and contribution</li>
            </ul>
            <p>
              <Link href="/download">Download Briefly</Link> and record something worth keeping.
            </p>
          </>
        )}

        {slug === 'on-device-vs-cloud' && (
          <>
            <p>
              Not every recording should leave your phone. Briefly supports on-device transcription
              and summarization where hardware allows, plus cloud options when you need higher
              accuracy or faster turnaround.
            </p>
            <h2>On-device processing</h2>
            <p>
              Audio stays local. Models run on your device. Best for sensitive conversations,
              offline capture, and users who want minimal cloud footprint.
            </p>
            <h2>Cloud transcription</h2>
            <p>
              AssemblyAI handles async transcription with speaker diarization and robust language
              support. Audio is uploaded through secured edge functions — never stored longer than
              needed for processing.
            </p>
            <h2>BYOK summarization</h2>
            <p>
              Connect your OpenRouter, OpenAI, or Gemini API key in Settings. Requests go directly
              to your provider; keys live in the device secure store, not in plaintext sync
              payloads.
            </p>
          </>
        )}

        {slug === 'library-sync-monorepo' && (
          <>
            <p>
              Signed-in users sync library state to Supabase. The mobile app, web app, and backend
              services share types from <code>@briefly/types</code> so payloads stay consistent.
            </p>
            <h2>Mirror tables</h2>
            <ul>
              <li>
                <code>account_recordings</code> — recording JSON payloads keyed by user
              </li>
              <li>
                <code>account_folders</code> — custom folder definitions
              </li>
              <li>
                <code>account_settings</code> — non-secret preferences (no API keys)
              </li>
            </ul>
            <h2>Merge strategy</h2>
            <p>
              Each entity carries an <code>updatedAt</code> timestamp. On sync, the newer version
              wins. The <code>LibrarySyncWorker</code> in <code>apps/backend</code> will handle
              batch reconciliation in future releases.
            </p>
            <p>
              Read more in the <Link href="/docs">docs</Link> or explore the repo on GitHub.
            </p>
          </>
        )}
      </article>

      <p style={{ marginTop: '2rem' }}>
        <Link href="/blog">← Back to blog</Link>
      </p>
    </main>
  );
}
