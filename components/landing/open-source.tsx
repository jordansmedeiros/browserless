/**
 * Open Source Section - Landing Page
 * Licensing information and contribution guidelines
 * Syncs with README.md "Licenciamento" and "Contribuindo"
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  GitPullRequest,
  Users,
  Heart,
  Code,
  BookOpen,
} from 'lucide-react';

export function OpenSource() {
  return (
    <section id="open-source" className="border-b px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Open Source
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Um projeto livre e aberto para a comunidade jurídica brasileira
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* License Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Licenciamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  SSPL-1.0
                </Badge>
                <span className="text-sm text-muted-foreground">
                  OR Browserless Commercial License
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">
                    ✅ Uso Permitido (SSPL)
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Projetos open source compatíveis com SSPL</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Uso pessoal e educacional</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Pesquisa e desenvolvimento</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Automações jurídicas autorizadas</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-foreground">
                    🔐 Uso Comercial
                  </h4>
                  <p className="text-muted-foreground">
                    Para uso comercial, CI/CD proprietário ou SaaS, é
                    necessária uma{' '}
                    <a
                      href="https://www.browserless.io/contact"
                      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      licença comercial
                    </a>
                    .
                  </p>
                </div>
              </div>

              <Button variant="outline" asChild className="w-full">
                <Link
                  href="https://github.com/browserless/browserless/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Ler Licença Completa
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Contributing Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Como Contribuir</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Contribuições são bem-vindas! Para mudanças significativas,
                abra uma issue primeiro para discutir o que você gostaria de
                mudar.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-primary/10 p-2">
                    <GitPullRequest className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Pull Requests</h4>
                    <p className="text-sm text-muted-foreground">
                      Fork, branch, commit e abra PR seguindo conventional
                      commits
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-primary/10 p-2">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Code Review</h4>
                    <p className="text-sm text-muted-foreground">
                      PRs são revisados pela comunidade, mantenha código limpo
                      e documentado
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-primary/10 p-2">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Comunidade</h4>
                    <p className="text-sm text-muted-foreground">
                      Use GitHub Issues para bugs, GitHub Discussions para
                      perguntas
                    </p>
                  </div>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link
                  href="https://github.com/browserless/browserless/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  Ver Issues no GitHub
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Credits */}
        <div className="mt-12 rounded-lg border bg-gradient-to-r from-muted/30 to-muted/10 p-8 text-center">
          <p className="mb-2 text-lg font-semibold">
            Feito com{' '}
            <Heart className="inline h-5 w-5 text-red-500" fill="currentColor" />{' '}
            para a advocacia brasileira
          </p>
          <p className="text-sm text-muted-foreground">
            Baseado no projeto{' '}
            <a
              href="https://github.com/browserless/browserless"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              Browserless
            </a>{' '}
            por{' '}
            <a
              href="https://browserless.io"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              browserless.io
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
