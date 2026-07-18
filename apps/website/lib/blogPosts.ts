export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'introducing-briefly',
    title: 'Introducing Briefly: voice notes that write themselves',
    excerpt:
      'Why we built Briefly — fast capture, thoughtful transcription, and summaries you can actually search later.',
    date: '2026-06-12',
    author: 'Briefly Team',
    readTime: '4 min read',
  },
  {
    slug: 'on-device-vs-cloud',
    title: 'On-device vs cloud: choosing the right processing mode',
    excerpt:
      'A practical guide to local transcription, BYOK cloud providers, and when to use shared cloud processing.',
    date: '2026-06-28',
    author: 'Briefly Team',
    readTime: '6 min read',
  },
  {
    slug: 'library-sync-monorepo',
    title: 'How account library sync works in the monorepo',
    excerpt:
      'Behind the scenes of account_recordings, account_folders, and merge-by-updatedAt reconciliation.',
    date: '2026-07-10',
    author: 'Engineering',
    readTime: '5 min read',
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
