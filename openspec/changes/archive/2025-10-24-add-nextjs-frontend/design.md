# Design: Next.js Frontend Architecture

## Context

O projeto atual é um fork do Browserless (plataforma de automação de navegadores headless) com extensões customizadas para automação do PJE (Processo Judicial Eletrônico). Todo o sistema funciona via:
- Scripts Node.js executados por linha de comando
- Puppeteer/Playwright para automação de navegadores
- Armazenamento de resultados em arquivos JSON locais
- Sem interface gráfica ou API REST

**Necessidade**: Criar interface web para que usuários não-técnicos (advogados, paralegais) possam:
- Executar scripts de raspagem PJE via UI
- Visualizar processos judiciais em tabelas/dashboards
- Gerenciar credenciais PJE de forma segura
- Acompanhar status de execuções em tempo real

**Stakeholders**:
- Desenvolvedores (manutenção do código)
- Advogados/Paralegais (usuários finais da interface)
- Administradores (deploy e configuração)

**Constraints**:
- Node.js v24.x (não v25)
- TypeScript strict mode
- Manter compatibilidade com scripts CLI existentes
- Windows como ambiente de desenvolvimento primário
- Sem orçamento para serviços pagos (preferir soluções open-source)

## Goals / Non-Goals

### Goals
- ✅ Criar aplicação Next.js 15 moderna com App Router
- ✅ Integrar Shadcn/ui + Tailwind CSS para UI
- ✅ Reorganizar código em arquitetura cliente-servidor clara
- ✅ Expor APIs para executar scripts PJE existentes
- ✅ Manter backward compatibility com execução CLI
- ✅ Preparar base para features futuras (auth, dashboard, scheduling)

### Non-Goals
- ❌ Implementar UI completa de dashboard nesta fase (apenas estrutura)
- ❌ Adicionar autenticação de múltiplos usuários (apenas SSO PJE por ora)
- ❌ Reescrever lógica de raspagem PJE (reutilizar scripts existentes)
- ❌ Implementar banco de dados relacional (continuar com JSON por ora)
- ❌ Suporte a produção/Docker nesta fase (foco em desenvolvimento local)

## Decisions

### Decision 1: Monorepo vs Separação Física

**Escolha**: **Monorepo Integrado** (frontend e backend no mesmo repositório)

**Estrutura Proposta**:
```
browserless/
├── app/                    # Next.js App Router (frontend)
│   ├── api/                # Next.js API Routes
│   ├── (dashboard)/        # Route groups
│   ├── layout.tsx
│   └── page.tsx
├── components/             # React components (Shadcn/ui)
│   └── ui/                 # Shadcn base components
├── lib/                    # Código compartilhado
│   ├── types/              # TypeScript types compartilhados
│   ├── utils/              # Utilities compartilhadas
│   └── api-client.ts       # Cliente API para frontend
├── server/                 # Backend Browserless + PJE
│   ├── src/                # Código TypeScript Browserless (movido)
│   ├── scripts/            # Scripts PJE (movido)
│   ├── build/              # Compiled output
│   └── tsconfig.json       # TS config backend
├── public/                 # Static assets Next.js
├── styles/                 # Global CSS + Tailwind
├── package.json            # Monorepo dependencies
├── next.config.mjs         # Next.js config
├── tsconfig.json           # Root TS config
├── tailwind.config.ts      # Tailwind config
└── components.json         # Shadcn config
```

**Rationale**:
- **Compartilhamento de Tipos**: Frontend e backend compartilham interfaces TypeScript (`ProcessoPJE`, `LoginResult`, etc.)
- **Simplicidade de Deploy**: Um único build gera frontend estático + backend Node.js
- **Desenvolvimento Unificado**: Um `npm run dev` roda ambos servidores
- **Git History**: Mantém histórico do projeto Browserless intacto

**Alternatives Considered**:
- ❌ **Repos Separados**: Mais complexo para compartilhar tipos, duplicação de configuração
- ❌ **Turborepo/Nx**: Overhead desnecessário para projeto pequeno/médio
- ✅ **npm workspaces** (considerado para o futuro se crescer muito)

### Decision 2: Comunicação Frontend-Backend

**Escolha**: **Next.js Server Actions + API Routes**

**Arquitetura**:
```typescript
// app/actions/pje.ts (Server Actions)
'use server'
import { executarLogin } from '@/server/scripts/pje/login'

export async function loginPJE(cpf: string, senha: string) {
  return await executarLogin(cpf, senha)
}

// app/api/processos/route.ts (API Routes para external calls)
export async function GET(request: Request) {
  const processos = await rasparProcessos()
  return Response.json(processos)
}
```

**Rationale**:
- **Server Actions**: Para ações iniciadas por formulários (login, raspar dados)
  - Type-safe (sem necessidade de fetch manual)
  - Integração nativa com React Server Components
  - Streaming e Suspense support
- **API Routes**: Para chamadas externas ou webhooks futuros
  - RESTful endpoints para integração com ferramentas externas
  - Mais fácil de documentar com OpenAPI

**Alternatives Considered**:
- ❌ **tRPC**: Adiciona complexidade desnecessária para projeto pequeno
- ❌ **GraphQL**: Overhead excessivo, curva de aprendizado
- ❌ **Apenas API Routes**: Perde benefícios de Server Actions (type-safety, streaming)

### Decision 3: Framework de UI

**Escolha**: **Shadcn/ui + Tailwind CSS + Radix UI**

**Rationale**:
- **Shadcn/ui**:
  - Não é biblioteca NPM, são componentes copiados para o projeto (full control)
  - Baseado em Radix UI (acessibilidade de alto nível)
  - Altamente customizável (não há vendor lock-in)
  - Documentação excelente e comunidade ativa
  - Temas dark/light built-in
- **Tailwind CSS**:
  - Utility-first CSS (rapidez de desenvolvimento)
  - Padrão da indústria em 2025
  - Integração perfeita com Next.js
  - Purging automático (CSS otimizado)
- **Radix UI Primitives**:
  - Componentes acessíveis (WCAG 2.1 Level AA)
  - Unstyled por padrão (Shadcn adiciona estilos)
  - Keyboard navigation e screen reader support

**Alternatives Considered**:
- ❌ **Material UI**: Mais pesado, opiniões fortes de design
- ❌ **Ant Design**: Design chinês não se encaixa bem em contexto jurídico BR
- ❌ **Chakra UI**: Boa opção, mas menos momentum que Shadcn em 2025
- ❌ **CSS-in-JS (Emotion/Styled)**: Tailwind é mais performático e popular

### Decision 4: State Management

**Escolha**: **React Server Components + URL State + Zustand (quando necessário)**

**Rationale**:
- **React Server Components (RSC)**: Default do Next.js 15, minimiza JS client-side
- **URL State**: Para filtros, paginação, busca (compartilháveis via link)
- **Zustand**: Apenas para estado client-side complexo (ex: multi-step forms, UI transient state)
  - Lightweight (1KB)
  - Menos boilerplate que Redux
  - TypeScript-first

**Alternatives Considered**:
- ❌ **Redux Toolkit**: Overhead desnecessário para projeto inicial
- ❌ **Context API**: Suficiente para casos simples, mas Zustand é melhor para estado global
- ❌ **Jotai/Recoil**: Atomic state é overkill para este projeto

### Decision 5: Data Storage

**Escolha**: **Manter JSON Files + Preparar para Database no Futuro**

**Current State** (manter por ora):
```
data/pje/
├── processos/
│   ├── 2024-01-15_processos.json
│   └── 2024-01-16_processos.json
└── screenshots/
    └── login-success.png
```

**Future Migration Path** (não implementar agora):
```typescript
// Preparar abstrações para facilitar migração futura
interface DataStore {
  saveProcessos(data: Processo[]): Promise<void>
  loadProcessos(filters: Filters): Promise<Processo[]>
}

// Implementação atual: JSON files
// Implementação futura: Prisma + SQLite/PostgreSQL
```

**Rationale**:
- Manter JSON é mais simples para MVP
- Não há necessidade imediata de queries complexas
- Facilita debug e inspeção manual de dados
- Quando escalar, migrar para Prisma + PostgreSQL/SQLite

**Alternatives Considered**:
- ❌ **Implementar DB agora**: Premature optimization
- ❌ **MongoDB**: Overkill para volume de dados atual
- ✅ **SQLite**: Considerado para Fase 2 (ótimo para apps locais)

### Decision 6: Environment Variables

**Escolha**: **Separar Variáveis por Escopo (Client vs Server)**

**Estrutura**:
```bash
# .env.local (development)
# Public (acessíveis no browser)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Private (apenas server-side)
PJE_CPF=12345678900
PJE_SENHA=senha123
BROWSERLESS_TOKEN=secret

# Browserless Config
PORT=3000
MAX_CONCURRENT_SESSIONS=10
```

**Rationale**:
- Next.js diferencia `NEXT_PUBLIC_*` (client) de outras (server-only)
- Credenciais PJE **nunca** devem ser expostas ao browser
- Manter compatibilidade com `.env` existente do Browserless

**Alternatives Considered**:
- ❌ **Dois arquivos `.env`**: Mais complexo de gerenciar
- ❌ **Vault/Secrets Manager**: Overkill para desenvolvimento local

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Next.js Frontend (React)               │    │
│  │  - app/ (App Router)                           │    │
│  │  - components/ui/ (Shadcn)                     │    │
│  │  - Client Components (interactive)             │    │
│  │  - Server Components (static)                  │    │
│  └────────────────────────────────────────────────┘    │
│               │                       ▲                  │
│               │ Server Actions        │ RSC Payload      │
│               ▼                       │                  │
└─────────────────────────────────────────────────────────┘
                │                       │
                │  HTTP/WebSocket       │
                │                       │
┌─────────────────────────────────────────────────────────┐
│              Node.js Server (Next.js)                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Next.js Server                         │    │
│  │  - API Routes (/api/*)                         │    │
│  │  - Server Actions                              │    │
│  │  - React Server Components                     │    │
│  └────────────────────────────────────────────────┘    │
│               │                                          │
│               │ Direct Import                            │
│               ▼                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │      Browserless + PJE Backend                 │    │
│  │  - server/src/ (Browserless core)              │    │
│  │  - server/scripts/pje/ (PJE automation)        │    │
│  │  - Puppeteer/Playwright instances              │    │
│  └────────────────────────────────────────────────┘    │
│               │                                          │
│               │ File System I/O                          │
│               ▼                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          Data Storage (JSON)                   │    │
│  │  - data/pje/processos/*.json                   │    │
│  │  - data/pje/screenshots/*.png                  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                │
                │ HTTP/HTTPS
                ▼
┌─────────────────────────────────────────────────────────┐
│               External Services                          │
│  - PJE TRT3 (https://pje.trt3.jus.br)                  │
│  - PJE SSO (https://sso.cloud.pje.jus.br)              │
│  - CloudFront (WAF/Anti-bot)                            │
└─────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

### Risk 1: Next.js Learning Curve
**Mitigation**:
- Documentação oficial excelente: https://nextjs.org/docs
- Seguir convenções do App Router (não misturar Pages Router)
- Usar templates oficiais: `npx create-next-app@latest`

### Risk 2: TypeScript Config Conflicts
**Mitigation**:
- Usar `tsconfig.json` estendível (root + server + app)
- Next.js gerencia automaticamente TS config para `app/`
- Testar build frequentemente: `npm run build`

### Risk 3: Perda de Performance (HTTP Overhead)
**Mitigation**:
- Server Actions são otimizados (não há serialização desnecessária)
- Usar React Server Components para reduzir JS client-side
- Implementar streaming para operações longas (raspagem)

### Risk 4: Complexidade de Deploy
**Mitigation**:
- Documentar processo de build: `next build` + backend build
- Considerar Vercel para frontend (futuro)
- Docker multi-stage build (Fase 2)

### Risk 5: Breaking Changes em Scripts CLI
**Mitigation**:
- Manter scripts originais funcionais em `server/scripts/pje/`
- Criar wrappers/adaptadores quando necessário
- Testes de integração para garantir compatibilidade

## Migration Plan

### Phase 1: Setup (Esta Change Proposal)
**Duration**: ~3-5 dias

1. ✅ Instalar Next.js 15 + Shadcn/ui + Tailwind
2. ✅ Reorganizar código: mover Browserless para `server/`
3. ✅ Configurar TypeScript para monorepo
4. ✅ Criar estrutura base de componentes Shadcn
5. ✅ Implementar primeira API/Server Action (ex: login PJE)
6. ✅ Validar build e dev servers

**Success Criteria**:
- `npm run dev` roda Next.js + backend simultaneamente
- Página inicial Next.js renderiza
- Server Action de login PJE funciona
- Scripts CLI continuam funcionando

### Phase 2: Core Features (Próxima Change)
**Duration**: ~1-2 semanas

1. Dashboard de processos (listagem)
2. Formulário de execução de scripts
3. Visualização de resultados JSON em tabelas
4. Loading states e error handling

### Phase 3: Advanced Features (Futuro)
**Duration**: ~2-4 semanas

1. Autenticação de usuários (NextAuth.js)
2. Agendamento de raspagens (cron jobs)
3. Notificações em tempo real (Server-Sent Events)
4. Gráficos e analytics de processos

### Rollback Plan
Se algo falhar criticamente:
1. **Reverter commit** da reorganização de arquivos
2. **Manter branch separada** para experimentos Next.js
3. **Scripts CLI** continuam funcionando independentemente

## Open Questions

1. **Hospedagem**: Vercel (frontend) + Railway/Render (backend) ou self-hosted?
   - **Resposta**: Decidir na Fase 2, após validar MVP local

2. **Banco de Dados**: Quando migrar de JSON para SQL?
   - **Resposta**: Quando volume de processos > 10.000 ou queries complexas

3. **Autenticação**: NextAuth.js ou Auth0 ou custom?
   - **Resposta**: NextAuth.js (open-source, integração perfeita)

4. **Testes**: Jest + React Testing Library ou Playwright E2E?
   - **Resposta**: Ambos (unit tests para componentes, E2E para fluxos críticos)

5. **Monitoramento**: Sentry para erros frontend/backend?
   - **Resposta**: Fase 3 (não prioritário para MVP)

## Dependencies

**New Dependencies**:
```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.1.0",
    "postcss": "^9.1.0",
    "autoprefixer": "^11.0.0",
    "@radix-ui/react-*": "^1.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0"
  }
}
```

**Estimated Bundle Size**:
- Next.js runtime: ~90KB gzipped
- React 19: ~45KB gzipped
- Shadcn/ui components: ~20KB (apenas os usados)
- Total inicial: ~155KB (aceitável para aplicação web moderna)

## Security Considerations

1. **Credenciais PJE**: Nunca expor no client-side
   - Usar `NEXT_PUBLIC_*` apenas para variáveis seguras
   - Validar no servidor antes de chamar scripts

2. **CORS**: Configurar para aceitar apenas origens confiáveis

3. **Rate Limiting**: Implementar throttling em API Routes
   - Evitar abuse de endpoints que chamam PJE

4. **Input Validation**: Zod para validar inputs de formulários
   ```typescript
   import { z } from 'zod'
   const loginSchema = z.object({
     cpf: z.string().regex(/^\d{11}$/),
     senha: z.string().min(6)
   })
   ```

5. **CSP (Content Security Policy)**: Configurar no `next.config.mjs`
   - Bloquear scripts inline maliciosos
   - Permitir apenas domínios confiáveis

## Performance Considerations

1. **Code Splitting**: Next.js faz automaticamente por rota
2. **Image Optimization**: Usar `next/image` para screenshots PJE
3. **Streaming**: Server Actions com Suspense para operações longas
4. **Caching**:
   - API Routes com `revalidate` para dados estáticos
   - SWR/React Query para client-side cache (opcional)

## Monitoring & Observability

**Fase Inicial (Logs básicos)**:
```typescript
// lib/logger.ts
export const logger = {
  info: (msg: string, meta?: object) => console.log('[INFO]', msg, meta),
  error: (msg: string, error?: Error) => console.error('[ERROR]', msg, error),
}
```

**Fase Futura** (considerar):
- Sentry para error tracking
- Vercel Analytics para Web Vitals
- Custom dashboard para métricas de raspagem PJE

## References

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React 19 Docs](https://react.dev)
- [TypeScript Monorepo Guide](https://www.typescriptlang.org/docs/handbook/project-references.html)
