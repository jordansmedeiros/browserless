import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JusBro',
  description:
    'Plataforma open source para raspagem automatizada de dados processuais.',
  keywords: [
    'browserless',
    'pje',
    'automação judicial',
    'processo judicial eletrônico',
    'puppeteer',
    'playwright',
    'headless browser',
    'web scraping',
    'trt',
    'tribunais',
    'advocacia',
    'jurídico',
  ],
  authors: [{ name: 'Browserless Contributors' }],
  creator: 'Sinesys',
  publisher: 'Sinesys',
  applicationName: 'JusBro',
  generator: 'Next.js',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  ),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'JusBro',
    title: 'JusBro',
    description:
      'Plataforma open source para raspagem automatizada de dados processuais.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JusBrowserless',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JusBro',
    description:
      'Plataforma open source para raspagem automatizada de dados processuais.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
