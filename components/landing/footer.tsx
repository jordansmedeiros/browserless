/**
 * Footer - Landing Page
 * Links, credits and copyright information
 */

import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Github, ExternalLink, Scale } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 px-4 py-12 md:py-16">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Project Info */}
          <div className="md:col-span-2">
            <h3 className="mb-4 text-lg font-bold">Browserless + PJE</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Plataforma open source de automação judicial brasileira combinando
              navegadores headless com scripts especializados para o PJE.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="h-4 w-4" />
              <span>Licenciado sob SSPL-1.0</span>
            </div>
          </div>

          {/* Documentation Links */}
          <div>
            <h4 className="mb-4 font-semibold">Documentação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://github.com/browserless/browserless#readme"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  README
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/browserless/browserless/blob/main/README-PJE.md"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Guia PJE
                </Link>
              </li>
              <li>
                <Link
                  href="https://docs.browserless.io"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Docs Browserless
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="mb-4 font-semibold">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://github.com/browserless/browserless"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                  <Github className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/browserless/browserless/issues"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Issues
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://pje.trt3.jus.br"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PJE TRT3
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.browserless.io"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Browserless.io
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>
            © {currentYear} Browserless Contributors. Todos os direitos
            reservados.
          </p>
          <p className="text-center md:text-right">
            Fork baseado em{' '}
            <Link
              href="https://github.com/browserless/browserless"
              className="font-medium underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Browserless
            </Link>{' '}
            por{' '}
            <Link
              href="https://browserless.io"
              className="font-medium underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              browserless.io
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
