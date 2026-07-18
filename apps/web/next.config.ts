import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@briefly/theme', '@briefly/ui', '@briefly/types'],
};

export default nextConfig;
