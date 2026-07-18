import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Blog' };

export default function BlogPage() {
  return (
    <main className="page">
      <h1>Blog</h1>
      <p>Product updates and stories. Content lives with the marketing site.</p>
    </main>
  );
}
