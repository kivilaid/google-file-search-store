import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/genai', 'mime-types'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
