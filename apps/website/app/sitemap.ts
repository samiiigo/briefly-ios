import type { MetadataRoute } from 'next';

const routes = [
  '',
  '/features',
  '/pricing',
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
  const base = 'https://briefly.app';
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }));
}
