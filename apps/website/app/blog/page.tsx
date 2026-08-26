import Link from 'next/link';
import { Text } from '@briefly/ui';
import { blogPosts } from '../../lib/blogPosts';

export default function BlogPage() {
  return (
    <main className="content-page">
      <Text as="h1" variant="title">
        Blog
      </Text>
      <p className="lead">
        Product updates, tips for better voice notes, and stories from the Briefly community.
      </p>

      <div className="blog-grid">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
            <p className="blog-card__meta">
              {post.date} · {post.readTime}
            </p>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
