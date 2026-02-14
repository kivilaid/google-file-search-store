import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/genai', 'mime-types'],
};

export default nextConfig;
