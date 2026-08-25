import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Trace files from the monorepo root so workspace packages are bundled.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  eslint: { ignoreDuringBuilds: true },
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
