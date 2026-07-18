import type { MetadataRoute } from 'next';

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
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date('2026-07-18'),
  }));
}
