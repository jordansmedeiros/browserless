# Add Landing Page

## Why

O projeto atualmente não possui uma página inicial moderna que apresente de forma clara e atrativa as funcionalidades do sistema para visitantes. A página raiz (`app/page.tsx`) existe mas não comunica efetivamente o propósito, funcionalidades e diferencial do projeto como plataforma open source de automação judicial brasileira baseada em Browserless.

Uma landing page moderna é essencial para:
- Comunicar claramente o valor e propósito do projeto
- Facilitar onboarding de novos usuários e desenvolvedores
- Demonstrar profissionalismo e maturidade do projeto open source
- Fornecer navegação intuitiva para documentação e recursos

## What Changes

- Criar landing page moderna na rota raiz (`/`) com Next.js App Router
- Implementar seções informativas: Hero, Funcionalidades, Tecnologias, Quick Start, Open Source
- Adicionar GitHub badges dinâmicos (estrelas, forks, licença, etc)
- Criar componentes reutilizáveis com Shadcn/ui e Tailwind CSS
- Implementar navegação para dashboard e documentação
- Garantir design responsivo (mobile-first)
- Adicionar animações sutis e interatividade moderna
- Manter linguagem acessível que equilibra simplicidade com termos técnicos necessários

## Impact

**Affected specs:**
- `landing-page` (new capability) - Página inicial pública do projeto

**Affected code:**
- `app/page.tsx` - Página raiz será substituída com nova landing page
- `components/landing/` - Novos componentes específicos da landing page (Hero, Features, Tech Stack, etc)
- `components/ui/` - Possível adição de novos componentes Shadcn/ui (badge, card, etc)
- `lib/github.ts` - Nova utility para buscar dados do GitHub (estrelas, forks)
- `app/layout.tsx` - Possível ajuste de metadata e SEO

**Impact on existing functionality:**
- NENHUM - Landing page é uma adição isolada
- Dashboard e outras rotas permanecem inalteradas
- Backward compatible - não quebra funcionalidade existente
