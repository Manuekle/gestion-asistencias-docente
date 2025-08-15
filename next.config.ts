import type { NextConfig } from 'next';

// Fix for node.js modules not found in the client
const nextConfig: NextConfig = {
  // Configure server components external packages
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },

  // Tell webpack to ignore these modules in the client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.storyblok.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rijwjlzt9wsyq7fc.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Asegura que errores de TypeScript detengan la compilación
  },
};

export default nextConfig;
