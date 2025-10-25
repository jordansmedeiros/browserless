/**
 * Tech Stack Section - Landing Page
 * Display technologies used in the project grouped by category
 * Syncs with README.md "Tecnologias"
 */

import { Badge } from '@/components/ui/badge';

interface Technology {
  name: string;
  version?: string;
  url: string;
  category: 'frontend' | 'backend' | 'automation' | 'database' | 'tooling';
}

const technologies: Technology[] = [
  // Frontend
  {
    name: 'Next.js',
    version: '16',
    url: 'https://nextjs.org',
    category: 'frontend',
  },
  {
    name: 'React',
    version: '19',
    url: 'https://react.dev',
    category: 'frontend',
  },
  {
    name: 'TypeScript',
    version: '5.9',
    url: 'https://www.typescriptlang.org',
    category: 'frontend',
  },
  {
    name: 'Tailwind CSS',
    version: '4',
    url: 'https://tailwindcss.com',
    category: 'frontend',
  },
  {
    name: 'Shadcn/ui',
    url: 'https://ui.shadcn.com',
    category: 'frontend',
  },
  // Backend
  {
    name: 'Node.js',
    version: 'v24',
    url: 'https://nodejs.org',
    category: 'backend',
  },
  {
    name: 'Zod',
    url: 'https://zod.dev',
    category: 'backend',
  },
  {
    name: 'Joi',
    url: 'https://joi.dev',
    category: 'backend',
  },
  // Automation
  {
    name: 'Puppeteer',
    version: '24.26',
    url: 'https://pptr.dev',
    category: 'automation',
  },
  {
    name: 'Playwright',
    version: '1.56',
    url: 'https://playwright.dev',
    category: 'automation',
  },
  {
    name: 'Puppeteer Stealth',
    url: 'https://github.com/berstend/puppeteer-extra',
    category: 'automation',
  },
  {
    name: 'Lighthouse',
    url: 'https://github.com/GoogleChrome/lighthouse',
    category: 'automation',
  },
  // Database
  {
    name: 'Prisma',
    url: 'https://www.prisma.io',
    category: 'database',
  },
  {
    name: 'SQLite',
    url: 'https://www.sqlite.org',
    category: 'database',
  },
  // Tooling
  {
    name: 'ESLint',
    url: 'https://eslint.org',
    category: 'tooling',
  },
  {
    name: 'Prettier',
    url: 'https://prettier.io',
    category: 'tooling',
  },
  {
    name: 'Docker',
    url: 'https://www.docker.com',
    category: 'tooling',
  },
];

const categoryNames = {
  frontend: 'Frontend',
  backend: 'Backend',
  automation: 'Automação',
  database: 'Database',
  tooling: 'Tooling',
};

export function TechStack() {
  const groupedTechs = technologies.reduce(
    (acc, tech) => {
      if (!acc[tech.category]) {
        acc[tech.category] = [];
      }
      acc[tech.category].push(tech);
      return acc;
    },
    {} as Record<string, Technology[]>,
  );

  return (
    <section id="tech-stack" className="border-b px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Stack Tecnológico
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Tecnologias modernas e confiáveis para performance e escalabilidade
          </p>
        </div>

        <div className="space-y-10">
          {Object.entries(groupedTechs).map(([category, techs]) => (
            <div key={category}>
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                {
                  categoryNames[
                    category as keyof typeof categoryNames
                  ]
                }
              </h3>
              <div className="flex flex-wrap gap-3">
                {techs.map((tech) => (
                  <a
                    key={tech.name}
                    href={tech.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-105"
                  >
                    <Badge
                      variant="secondary"
                      className="px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
                    >
                      {tech.name}
                      {tech.version && (
                        <span className="ml-1.5 text-muted-foreground">
                          {tech.version}
                        </span>
                      )}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Todas as tecnologias são open source ou possuem versões gratuitas
            para uso pessoal e educacional.
            <br />
            Veja o{' '}
            <a
              href="https://github.com/browserless/browserless"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              package.json
            </a>{' '}
            para versões exatas das dependências.
          </p>
        </div>
      </div>
    </section>
  );
}
