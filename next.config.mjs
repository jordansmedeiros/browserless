/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Experimental features if needed
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Note: instrumentationHook is no longer needed in Next.js 16+
    // The instrumentation.ts file is executed automatically by default
  },
  // Environment variables prefix for client-side
  env: {
    NEXT_PUBLIC_APP_NAME: 'JusBro',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

export default nextConfig;
