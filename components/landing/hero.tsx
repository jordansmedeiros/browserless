/**
 * Hero Section - Landing Page
 * Main section with title, badges, and CTAs
 * Syncs with README.md hero content
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitHubStats, formatNumber } from '@/lib/github';
import { Star, GitFork, Scale, FileCode } from 'lucide-react';

interface HeroProps {
  githubStats?: GitHubStats;
}

export function Hero({ githubStats }: HeroProps) {
  return (
    <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden border-b bg-gradient-to-b from-background to-muted/20 px-4 py-20 md:py-32">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          {/* Main Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            JusBro
          </h1>

          {/* Subheading */}
          <p className="mb-8 max-w-3xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
            Plataforma <span className="font-semibold">open source</span> de
            raspagem de dados processuais
          </p>

          {/* GitHub Badges */}
          {githubStats && (
            <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={githubStats.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary/80"
                >
                  <Star className="h-4 w-4" />
                  <span className="font-semibold">
                    {formatNumber(githubStats.stars)}
                  </span>
                  <span className="text-muted-foreground">stars</span>
                </Badge>
              </Link>

              <Link
                href={`${githubStats.htmlUrl}/fork`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary/80"
                >
                  <GitFork className="h-4 w-4" />
                  <span className="font-semibold">
                    {formatNumber(githubStats.forks)}
                  </span>
                  <span className="text-muted-foreground">forks</span>
                </Badge>
              </Link>

              {githubStats.license && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <Scale className="h-4 w-4" />
                  <span>{githubStats.license.spdxId}</span>
                </Badge>
              )}

              <Badge
                variant="outline"
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <FileCode className="h-4 w-4" />
                <span>Node.js v24</span>
              </Badge>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild className="min-w-[200px]">
              <Link href="/dashboard">Acessar Dashboard</Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="min-w-[200px]"
            >
              <Link href="https://github.com/browserless/browserless">
                Ver no GitHub
              </Link>
            </Button>

            <Button
              size="lg"
              variant="ghost"
              asChild
              className="min-w-[200px]"
            >
              <Link href="#quick-start">Quick Start →</Link>
            </Button>
          </div>

          {/* Secondary Info */}
          <p className="mt-10 text-sm text-muted-foreground">
            Fork do{' '}
            <Link
              href="https://github.com/browserless/browserless"
              className="underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Browserless
            </Link>{' '}
            com extensões para automação PJE
          </p>
        </div>
      </div>
    </section>
  );
}
