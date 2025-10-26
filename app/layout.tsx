import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JusBrowserless',
  description:
    'Plataforma open source de automação judicial brasileira. Navegadores headless (Browserless) + scripts especializados para o PJE (Processo Judicial Eletrônico). Suporte a todos os 24 TRTs.',
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
  creator: 'Browserless',
  publisher: 'Browserless',
  applicationName: 'JusBrowserless',
  generator: 'Next.js',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  ),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'JusBrowserless',
    title: 'JusBrowserless',
    description:
      'Plataforma open source de automação judicial brasileira. Navegadores headless + scripts especializados para PJE.',
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
    title: 'JusBrowserless',
    description:
      'Plataforma open source de automação judicial brasileira com suporte a todos os 24 TRTs.',
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
