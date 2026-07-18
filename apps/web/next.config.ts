import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@briefly/theme',
    '@briefly/ui',
    '@briefly/assets',
    '@briefly/types',
    '@briefly/api',
    '@briefly/auth',
    '@briefly/env',
    '@briefly/config',
  ],
};

export default nextConfig;
