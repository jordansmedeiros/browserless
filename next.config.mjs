/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Experimental features if needed
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Environment variables prefix for client-side
  env: {
    NEXT_PUBLIC_APP_NAME: 'Browserless PJE',
  },
};

export default nextConfig;
