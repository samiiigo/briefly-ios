import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export so the repo-root Vercel project can deploy without changing
  // Root Directory in the dashboard (marketing site is independently deployable).
  output: 'export',
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  transpilePackages: ['@briefly/theme', '@briefly/ui', '@briefly/assets'],
};

export default nextConfig;
