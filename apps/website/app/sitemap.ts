import type { MetadataRoute } from 'next';
import { blogPosts } from '../lib/blogPosts';

export const dynamic = 'force-static';

const siteUrl = 'https://briefly.app';

const routes = [
  '',
  '/features',
  '/pricing',
  '/download',
  '/docs',
  '/blog',
  '/changelog',
  '/faq',
  '/contact',
  '/careers',
  '/privacy',
  '/terms',
  ...blogPosts.map((post) => `/blog/${post.slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date('2026-07-18'),
  }));
}
