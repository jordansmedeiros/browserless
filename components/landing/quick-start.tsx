/**
 * Quick Start Section - Landing Page
 * Installation instructions and getting started guide
 * Syncs with README.md "Início Rápido"
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

export function QuickStart() {
  const [copyAll, isAllCopied] = useCopyToClipboard();
  const [copyInstall, isInstallCopied] = useCopyToClipboard();
  const [copyConfigure, isConfigureCopied] = useCopyToClipboard();
  const [copyRun, isRunCopied] = useCopyToClipboard();

  const codeSnippets = {
    install: `# 1. Clone o repositório
git clone https://github.com/browserless/browserless.git
cd browserless

# 2. Instale as dependências
npm install`,
    configure: `# 3. Configure o ambiente
cp .env.example .env
# Edite .env com suas configurações

# 4. Configure o banco de dados
echo 'DATABASE_URL="file:./dev.db"' >> .env
npx prisma migrate dev`,
    run: `# 5. Inicie o servidor de desenvolvimento
npm run dev

# Acesse: http://localhost:3000`,
  };

  return (
    <section
      id="quick-start"
      className="border-b bg-muted/30 px-4 py-16 md:py-24"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Quick Start
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Configure e execute o projeto em menos de 5 minutos
          </p>
        </div>

        <div className="space-y-6">
          {/* Installation Steps */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Instalação e Configuração
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyAll(
                      codeSnippets.install + '\n\n' + codeSnippets.configure
                    )
                  }
                >
                  {isAllCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Tudo
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-4">
                <div className="relative rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{codeSnippets.install}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-2"
                    onClick={() => copyInstall(codeSnippets.install)}
                  >
                    {isInstallCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="relative rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{codeSnippets.configure}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-2"
                    onClick={() => copyConfigure(codeSnippets.configure)}
                  >
                    {isConfigureCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="relative rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto text-sm">
                    <code>{codeSnippets.run}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-2"
                    onClick={() => copyRun(codeSnippets.run)}
                  >
                    {isRunCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-2 text-2xl font-bold text-primary">01</div>
                <h4 className="mb-2 font-semibold">Configurar Credenciais</h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  Acesse <code className="rounded bg-muted px-1 py-0.5">/pje/credentials</code> para cadastrar suas
                  credenciais PJE
                </p>
                <Button size="sm" variant="outline" asChild className="w-full">
                  <a href="/pje/credentials">
                    Gerenciar
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-2 text-2xl font-bold text-primary">02</div>
                <h4 className="mb-2 font-semibold">Explorar Dashboard</h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  Visualize processos, estatísticas e gerencie raspagens no
                  dashboard
                </p>
                <Button size="sm" variant="outline" asChild className="w-full">
                  <a href="/dashboard">
                    Acessar
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-2 text-2xl font-bold text-primary">03</div>
                <h4 className="mb-2 font-semibold">Ler Documentação</h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  Explore a documentação completa no README e guias específicos
                </p>
                <Button size="sm" variant="outline" asChild className="w-full">
                  <a
                    href="https://github.com/browserless/browserless#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver Docs
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Resources */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-6">
              <h4 className="mb-4 font-semibold">Recursos Adicionais</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">▪</span>
                  <span>
                    <strong>README-PJE.md</strong> - Guia específico para
                    automação PJE
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">▪</span>
                  <span>
                    <strong>docs/pje/APIs.md</strong> - Referência completa das
                    APIs descobertas
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">▪</span>
                  <span>
                    <strong>docs/MULTI-TRT-SUPPORT.md</strong> - Documentação
                    multi-TRT
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
