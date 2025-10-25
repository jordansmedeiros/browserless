# Landing Page Design

## Context

A landing page serve como ponto de entrada principal para visitantes do projeto, sejam desenvolvedores, advogados interessados em automação judicial, ou contribuidores open source. Deve comunicar de forma clara e atrativa:

1. **O que é o projeto** - Fork do Browserless com automação PJE
2. **Para quem serve** - Advogados, desenvolvedores, tribunais
3. **Funcionalidades principais** - Automação PJE + Plataforma Browserless
4. **Como começar** - Quick start e links para documentação
5. **Natureza open source** - Licença, comunidade, contribuições

**Stakeholders:**
- Visitantes novos (primeira impressão)
- Desenvolvedores avaliando a ferramenta
- Advogados buscando automação
- Contribuidores open source

**Constraints:**
- Deve ser estática (SSG) para máxima performance
- Mobile-first (maioria dos acessos mobile)
- SEO otimizado (metadata, structured data)
- Acessível (WCAG AA compliance via Shadcn/ui)

## Goals / Non-Goals

### Goals
- Comunicar claramente o propósito e valor do projeto
- Facilitar navegação para dashboard e documentação
- Demonstrar credibilidade via GitHub badges e estatísticas
- Fornecer quick start path claro
- Apresentar tecnologias de forma visual e organizada
- Design moderno e profissional alinhado com Shadcn/ui

### Non-Goals
- **NÃO** é uma página comercial/marketing (sem CTAs agressivos, pricing)
- **NÃO** precisa de analytics complexo ou tracking
- **NÃO** requer autenticação ou estado do usuário
- **NÃO** substitui a documentação completa (apenas overview)

## Decisions

### 1. Structure and Sections

A landing page será dividida em seções verticais (scrolling page):

```
┌─────────────────────────────────────┐
│ Header (Logo, Links, GitHub Button) │
├─────────────────────────────────────┤
│ HERO                                │
│ - Título impactante                 │
│ - Subtítulo explicativo             │
│ - Badges (stars, license, version)  │
│ - CTAs (Dashboard, Docs, GitHub)    │
├─────────────────────────────────────┤
│ ABOUT                               │
│ - O que é o projeto (2 parágrafos)  │
│ - Browserless + PJE visual split    │
├─────────────────────────────────────┤
│ FEATURES                            │
│ - 3 colunas: PJE, Browserless, Web  │
│ - Ícones + título + descrição       │
│ - Cards com hover effects           │
├─────────────────────────────────────┤
│ TECH STACK                          │
│ - Grid de tecnologias com logos     │
│ - Agrupado por categoria            │
├─────────────────────────────────────┤
│ QUICK START                         │
│ - Code snippet com instalação       │
│ - Passos numerados                  │
│ - Links para docs completa          │
├─────────────────────────────────────┤
│ OPEN SOURCE                         │
│ - Licença (SSPL-1.0)                │
│ - Como contribuir                   │
│ - Links para GitHub Issues/PRs      │
├─────────────────────────────────────┤
│ FOOTER                              │
│ - Links úteis                       │
│ - Créditos (Browserless original)   │
│ - GitHub, docs, contato             │
└─────────────────────────────────────┘
```

**Decision:** Estrutura de página única com scroll suave entre seções. Permite consumo linear de informação e facilita navegação mobile.

**Alternatives considered:**
- Multi-page approach - Rejeitado: aumenta complexidade e fragmenta informação
- Dashboard-first (redirect `/` → `/dashboard`) - Rejeitado: visitantes não autenticados precisam de contexto primeiro

### 2. Component Architecture

**Components to create:**
```
components/landing/
├── hero.tsx              - Seção principal com título, badges, CTAs
├── about.tsx             - Visão geral do projeto
├── features.tsx          - Grid de funcionalidades
├── tech-stack.tsx        - Tecnologias utilizadas
├── quick-start.tsx       - Código de instalação
├── open-source.tsx       - Informações de licença e contribuição
└── footer.tsx            - Rodapé com links
```

**Shadcn/ui components to use:**
- `Button` - CTAs e links
- `Card` - Feature cards, tech stack items
- `Badge` - Tags de tecnologias, status
- `Separator` - Divisão de seções
- Possivelmente: `Tabs`, `Accordion` (se necessário)

**Decision:** Componentes isolados por seção para facilitar manutenção e reutilização. Cada seção é independente e pode ser reorganizada.

### 3. GitHub Integration

**Dynamic badges to display:**
- Stars count
- Forks count
- Open issues
- License badge
- Latest release/version
- Node.js version requirement

**Implementation approaches:**
1. **Static at build time** (SSG with revalidation)
   - Fetch durante `npm run build`
   - Regenerar periodicamente (ISR - every 1 hour)
   - Fallback to static values se API falhar

2. **Client-side fetch** (runtime)
   - Fetch após load da página
   - Loading skeletons
   - Cache no browser

**Decision:** Usar **Static Site Generation (SSG)** com Incremental Static Regeneration (ISR) a cada 1 hora. Garante performance máxima sem sacrificar atualidade.

```typescript
// lib/github.ts
export async function getGitHubStats() {
  const res = await fetch('https://api.github.com/repos/{owner}/{repo}', {
    next: { revalidate: 3600 } // 1 hour
  });
  return res.json();
}
```

**Alternatives considered:**
- Client-side only - Rejeitado: CLS (layout shift), dependente de JavaScript
- No dynamic data - Rejeitado: badges estáticos ficam desatualizados rapidamente

### 4. Styling and Theme

**Design system:**
- Base: Shadcn/ui default theme (slate/neutral)
- Accent color: Blue (judicial/professional)
- Typography: System fonts (sans-serif stack)
- Spacing: Tailwind spacing scale (4px base)

**Dark mode:**
- Suporte completo via Shadcn/ui theme system
- Toggle no header (opcional, pode vir depois)
- Detecção automática de preferência do sistema

**Responsive breakpoints:**
```
sm:  640px   - Mobile landscape
md:  768px   - Tablet portrait
lg:  1024px  - Tablet landscape / Desktop
xl:  1280px  - Desktop large
2xl: 1536px  - Desktop extra large
```

**Decision:** Mobile-first design com breakpoints padrão do Tailwind. Hero e features adaptam de coluna única (mobile) para grid multi-coluna (desktop).

### 5. Content and Tone

**Language principles:**
- **Claro e direto** - Evitar jargão desnecessário
- **Tecnicamente preciso** - Termos técnicos quando necessário (mas explicados)
- **Bilíngue considerado** - PT-BR primário, inglês futuro
- **Profissional mas acessível** - Não corporativo, mas sério

**Example tone:**

✅ **Good:**
> "Plataforma open source de automação judicial que combina navegadores headless (Browserless) com scripts especializados para o PJE (Processo Judicial Eletrônico)."

❌ **Too technical:**
> "Sistema de orquestração de instâncias Chromium/Firefox via Puppeteer/Playwright com extensões de web scraping para sistemas judiciais brasileiros."

❌ **Too simple:**
> "Ferramenta que automatiza tarefas repetitivas de advogados."

**Content sources:**
- [README.md](e:\dev\browserless\README.md) - Seções About, Funcionalidades, Tech Stack
- [README-PJE.md](e:\dev\browserless\README-PJE.md) - Quick start PJE
- [docs/pje/APIs.md](e:\dev\browserless\docs\pje\APIs.md) - Detalhes técnicos

### 6. SEO and Metadata

**Page metadata:**
```typescript
export const metadata: Metadata = {
  title: 'Browserless + PJE | Automação Judicial Open Source',
  description: 'Plataforma open source de automação judicial brasileira. Navegadores headless (Browserless) + scripts especializados para PJE (Processo Judicial Eletrônico).',
  keywords: ['browserless', 'pje', 'automação judicial', 'puppeteer', 'playwright'],
  openGraph: { ... },
  twitter: { ... }
};
```

**Structured data:**
- Schema.org SoftwareApplication
- Organization (open source project)

**Decision:** Metadata completo com OpenGraph e Twitter Cards para compartilhamento em redes sociais.

### 7. Performance Targets

**Lighthouse scores (target):**
- Performance: 95+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

**Strategies:**
- Static generation (zero JS para conteúdo inicial)
- Image optimization (next/image)
- Font optimization (next/font)
- Code splitting automático (Next.js)

## Risks / Trade-offs

### Risk 1: GitHub API rate limiting
**Mitigation:**
- ISR com revalidation de 1 hora reduz chamadas
- Fallback para valores estáticos em caso de falha
- Considerar caching adicional se necessário

### Risk 2: Content maintenance drift
**Mitigation:**
- Documentar fonte de cada seção (link para README)
- Incluir comentário no código: "Sync with README.md section X"
- Considerar geração automática de conteúdo futura

### Risk 3: Over-engineering
**Mitigation:**
- Primeira versão simples (v1): conteúdo estático + badges dinâmicos
- Animações e interatividade apenas se melhorar UX claramente
- Evitar frameworks adicionais (Framer Motion, etc) na v1

## Migration Plan

**Phase 1: Setup (Prerequisites)**
1. ✅ Shadcn/ui já configurado
2. ✅ Tailwind CSS 4 já configurado
3. ✅ Next.js App Router já em uso
4. Adicionar apenas novos componentes necessários

**Phase 2: Implementation**
1. Criar utility `lib/github.ts` para fetch de dados
2. Criar componentes de seção em `components/landing/`
3. Substituir `app/page.tsx` com nova landing page
4. Adicionar metadata e SEO

**Phase 3: Testing**
1. Visual testing em múltiplos viewports
2. Lighthouse audit (performance, a11y, SEO)
3. Cross-browser testing (Chrome, Firefox, Safari)
4. Verificar badges dinâmicos funcionando

**Phase 4: Deployment**
1. Build production (`npm run build`)
2. Verificar SSG gerado corretamente
3. Deploy (mesmo processo atual)

**Rollback:** Simples - reverter `app/page.tsx` para versão anterior. Componentes em `components/landing/` podem permanecer sem impacto.

## Open Questions

1. **Incluir screenshots/demos visuais?**
   - Pros: Mostra produto funcionando
   - Cons: Aumenta manutenção (screenshots ficam desatualizados)
   - **Decision:** V1 sem screenshots. Avaliar feedback.

2. **Internacionalização (i18n)?**
   - Projeto é brasileiro, mas Browserless é internacional
   - **Decision:** V1 apenas PT-BR. Inglês pode ser adicionado depois se houver demanda.

3. **Animações/Motion?**
   - Framer Motion é comum em landing pages modernas
   - **Decision:** V1 sem animações complexas. CSS transitions básicas apenas. Pode adicionar depois.

4. **Newsletter/Contact form?**
   - Comum em projetos open source para engajamento
   - **Decision:** Não na V1. GitHub Issues é suficiente para contato inicial.
