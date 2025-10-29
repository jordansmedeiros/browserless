/**
 * Landing Page - Root Route
 * Main entry point for visitors
 * Composed of multiple landing page sections
 *
 * ISR Configuration:
 * - Static generation at build time
 * - Revalidates every 1 hour (3600s)
 * - GitHub stats are cached to avoid rate limiting
 */

import { getGitHubStats } from '@/lib/github';
import { Hero } from '@/components/landing/hero';
import { About } from '@/components/landing/about';
import { Features } from '@/components/landing/features';
import { TechStack } from '@/components/landing/tech-stack';
import { QuickStart } from '@/components/landing/quick-start';
import { OpenSource } from '@/components/landing/open-source';
import { Footer } from '@/components/landing/footer';

// ISR: Revalidate every 1 hour
export const revalidate = 3600;

export default async function Home() {
  // Fetch GitHub stats at build time (SSG with ISR)
  // Fallback to default values if API fails
  const githubStats = await getGitHubStats();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Hero githubStats={githubStats} />

      {/* About Section */}
      <About />

      {/* Features Section */}
      <Features />

      {/* Tech Stack Section */}
      <TechStack />

      {/* Quick Start Section */}
      <QuickStart />

      {/* Open Source Section */}
      <OpenSource />

      {/* Footer */}
      <Footer />
    </main>
  );
}
