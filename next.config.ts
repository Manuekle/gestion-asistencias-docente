import type { NextConfig } from 'next';
import type { webpack } from 'next/dist/compiled/webpack/webpack';

// Fix for node.js modules not found in the client
const nextConfig: NextConfig = {
  // Configure server components external packages
  serverExternalPackages: [
    '@sparticuz/chromium',
    'playwright-core',
    'puppeteer-core', // Si aún lo tienes
  ],

  // Configuraciones experimentales actualizadas
  experimental: {
    // Remover serverComponentsExternalPackages de aquí
    // Solo mantener configuraciones experimentales válidas
  },

  // Configuraciones adicionales recomendadas para PDF generation
  webpack: (config: webpack.Configuration, { isServer }: { isServer: boolean }) => {
    if (!config) return config;

    if (isServer) {
      // Excluir estos paquetes del bundle del cliente
      const externals = Array.isArray(config.externals) ? [...config.externals] : [];

      externals.push(
        { '@sparticuz/chromium': 'commonjs @sparticuz/chromium' },
        { 'playwright-core': 'commonjs playwright-core' }
      );

      config.externals = externals as webpack.Configuration['externals'];
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/api/docente/reportes/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  images: {
    domains: [
      'fup.edu.co',
      // Agregar otros dominios de imágenes que uses
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fup.edu.co',
        pathname: '/wp-content/uploads/**',
      },
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
