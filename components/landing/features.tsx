/**
 * Features Section - Landing Page
 * Showcase main capabilities of the system
 * Syncs with README.md "Funcionalidades"
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Zap,
  Database,
  Globe,
  Terminal,
  Eye,
  Layout,
  Key,
  FileText,
} from 'lucide-react';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  category: 'pje' | 'browserless' | 'web';
}

const features: Feature[] = [
  // PJE Features
  {
    icon: Shield,
    title: 'Anti-Detecção de Bots',
    description:
      'Bypass de CloudFront WAF usando Puppeteer Stealth Plugin, digitação realista e movimento humano de mouse.',
    category: 'pje',
  },
  {
    icon: Zap,
    title: 'Login Automatizado',
    description:
      'Acesso automático ao PJE via SSO com suporte aos 24 TRTs brasileiros (1º e 2º grau).',
    category: 'pje',
  },
  {
    icon: Database,
    title: 'Raspagem de Processos',
    description:
      'Extração de dados via APIs REST descobertas com paginação automática e rate limiting inteligente.',
    category: 'pje',
  },
  // Browserless Features
  {
    icon: Globe,
    title: 'Multi-Browser',
    description:
      'Deploy de navegadores headless: Chromium, Firefox, WebKit e Microsoft Edge via Playwright.',
    category: 'browserless',
  },
  {
    icon: Terminal,
    title: 'REST APIs',
    description:
      'Endpoints prontos para PDF, screenshots, HTML extraction, Lighthouse audits e mais.',
    category: 'browserless',
  },
  {
    icon: Eye,
    title: 'Debug Interativo',
    description:
      'Interface visual com Chrome DevTools para desenvolvimento e troubleshooting em tempo real.',
    category: 'browserless',
  },
  // Web Interface Features
  {
    icon: Layout,
    title: 'Dashboard Next.js',
    description:
      'Interface web moderna com React 19, Shadcn/ui e Tailwind CSS para visualização de dados.',
    category: 'web',
  },
  {
    icon: Key,
    title: 'Gerenciamento de Credenciais',
    description:
      'Sistema completo de escritórios, advogados e credenciais com teste integrado e auto-detecção.',
    category: 'web',
  },
  {
    icon: FileText,
    title: 'Visualização de Processos',
    description:
      'Dashboard interativo para consulta, filtro e análise de processos judiciais raspados.',
    category: 'web',
  },
];

const categoryNames = {
  pje: 'Automação PJE',
  browserless: 'Plataforma Browserless',
  web: 'Interface Web',
};

const categoryColors = {
  pje: 'text-blue-500',
  browserless: 'text-purple-500',
  web: 'text-green-500',
};

export function Features() {
  return (
    <section id="features" className="border-b bg-muted/30 px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Funcionalidades
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Recursos poderosos para automação judicial e gerenciamento de
            navegadores headless
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            const categoryColor = categoryColors[feature.category];

            return (
              <Card
                key={feature.title}
                className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span
                      className={`text-xs font-medium ${categoryColor} uppercase tracking-wide`}
                    >
                      {categoryNames[feature.category]}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Categories Legend */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Automação PJE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">
              Plataforma Browserless
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Interface Web</span>
          </div>
        </div>
      </div>
    </section>
  );
}
