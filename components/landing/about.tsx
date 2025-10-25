/**
 * About Section - Landing Page
 * Explains what the project is and its dual nature
 * Syncs with README.md "Sobre o Projeto"
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Scale } from 'lucide-react';

export function About() {
  return (
    <section id="about" className="border-b px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Sobre o Projeto
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Uma plataforma que une infraestrutura de navegadores headless com
            automação especializada para o sistema judiciário brasileiro
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Browserless Platform Card */}
          <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
            <CardHeader>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  Plataforma Browserless
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Infraestrutura completa de navegadores headless baseada no
                projeto open source{' '}
                <a
                  href="https://github.com/browserless/browserless"
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Browserless
                </a>
                .
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>
                    Deploy de navegadores headless (Chromium, Firefox, WebKit,
                    Edge)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>Suporte nativo para Puppeteer e Playwright</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>REST APIs para PDF, screenshots, HTML e Lighthouse</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>Debug viewer interativo para desenvolvimento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>Gerenciamento de sessões e paralelismo</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* PJE Automation Card */}
          <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
            <CardHeader>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Automação PJE</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Scripts especializados para automação do{' '}
                <span className="font-medium">
                  PJE (Processo Judicial Eletrônico)
                </span>{' '}
                do sistema judiciário brasileiro.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>
                    Suporte completo aos <strong>24 TRTs</strong> (Tribunais
                    Regionais do Trabalho)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>Login automatizado com bypass de detecção de bots</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>Raspagem de processos via APIs REST descobertas</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>
                    Interface web Next.js para gerenciamento de credenciais
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-primary">▪</span>
                  <span>Type-safe com TypeScript e validação em runtime</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Integration Description */}
        <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-center md:p-8">
          <p className="text-lg text-muted-foreground">
            A combinação dessas duas funcionalidades permite{' '}
            <span className="font-semibold text-foreground">
              automação profissional e confiável
            </span>{' '}
            de tarefas jurídicas repetitivas, respeitando limites de API e boas
            práticas de acesso aos sistemas judiciais.
          </p>
        </div>
      </div>
    </section>
  );
}
