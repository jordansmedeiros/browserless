# Next.js + Shadcn/ui Setup - Fase 1 Concluída ✅

## O que foi implementado

### 1. Instalação e Configuração
- ✅ **Next.js 16.0.0** (latest) instalado
- ✅ **React 19** instalado
- ✅ **Tailwind CSS 4** configurado
- ✅ **Shadcn/ui** configurado com componentes base
- ✅ **TypeScript** configurado para monorepo

### 2. Reestruturação do Projeto
```
browserless/
├── app/                     # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Tailwind CSS
├── components/              # React components
│   └── ui/                 # Shadcn components (Button, Card, Input, Label, Table, Dialog, Alert)
├── lib/                    # Código compartilhado
│   ├── types/              # TypeScript types (pje.ts, api.ts)
│   └── utils.ts            # Utilities (cn function)
├── server/                 # Backend Browserless + PJE
│   ├── src/                # Código Browserless (movido)
│   ├── scripts/            # Scripts PJE (movido)
│   ├── build/              # Compiled output
│   └── tsconfig.json       # Server TS config
├── public/                 # Static assets
├── styles/                 # Global CSS
├── next.config.mjs         # Next.js config
├── tailwind.config.ts      # Tailwind config
├── postcss.config.js       # PostCSS config
├── components.json         # Shadcn config
└── tsconfig.json          # Root TS config
```

### 3. Configurações TypeScript
- **Root `tsconfig.json`**: Configurado para Next.js com path aliases
- **Server `tsconfig.json`**: Configurado para backend Browserless
- **Path Aliases**:
  - `@/*` → Raiz do projeto
  - `@/lib/*` → Biblioteca compartilhada
  - `@/components/*` → Componentes React
  - `@/server/*` → Backend server

### 4. NPM Scripts Atualizados
```bash
# Frontend (Next.js)
npm run dev          # Roda Next.js dev server
npm run build        # Build Next.js + backend
npm start            # Roda Next.js em produção

# Backend (Browserless)
npm run server:build # Build apenas backend
npm run server:dev   # Roda apenas backend
npm run server:start # Roda backend em produção

# PJE Scripts (mantém backward compatibility)
npm run pje:login    # Executa login PJE via CLI
npm run pje:scrape   # Executa raspagem via CLI
```

### 5. Componentes Shadcn/ui Instalados
- ✅ Button
- ✅ Card
- ✅ Input
- ✅ Label
- ✅ Table
- ✅ Dialog
- ✅ Alert

### 6. Tipos TypeScript Compartilhados
Criados em `lib/types/`:
- **pje.ts**: `ProcessoPJE`, `Parte`, `Totalizador`, `PerfilPJE`, `LoginResult`, `ScrapeResult`
- **api.ts**: `ApiResponse`, `LoginRequest`, `ScrapeRequest`, `ErrorResponse`

### 7. Environment Variables
Arquivo `.env.example` criado com:
- `NEXT_PUBLIC_APP_URL`: URL pública do app
- `NEXT_PUBLIC_APP_NAME`: Nome do app
- `DATABASE_URL`: URL de conexão do banco (Prisma)
- `PORT`: Porta do servidor
- `BROWSERLESS_TOKEN`: Token Browserless

⚠️ **Nota**: `PJE_CPF` e `PJE_SENHA` são **apenas para testes manuais**. O sistema principal usa credenciais do banco de dados configuradas em `/pje/credentials`.

## Como Usar

### Desenvolvimento
```bash
# 1. Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env.local

# 2. Edite .env.local com suas credenciais
# (Adicione seu CPF e senha PJE)

# 3. Rode o servidor de desenvolvimento
npm run dev

# O Next.js estará disponível em http://localhost:3000
```

### Build de Produção
```bash
# Build completo (Next.js + Backend)
npm run build

# Start em produção
npm start
```

### Executar Scripts PJE via CLI (backward compatible)
```bash
# Login PJE
npm run pje:login

# Raspar processos
npm run pje:scrape
```

## Status do Teste

✅ **Servidor Next.js rodando com sucesso!**
- Porta: 3002 (3000 estava ocupada)
- Compilação: 1347ms com Turbopack
- Status: Ready ✓

## Próximos Passos (Não implementados nesta fase)

### Fase 2: Core Features
- [ ] Criar Server Actions para PJE (login, scrape)
- [ ] Adaptar scripts PJE para serem chamados via API
- [ ] Criar dashboard layout completo
- [ ] Criar PJE login form UI
- [ ] Criar página de processos

### Fase 3: Advanced Features
- [ ] Autenticação de usuários (NextAuth.js)
- [ ] Agendamento de raspagens
- [ ] Notificações em tempo real
- [ ] Gráficos e analytics

## Notas Importantes

1. **Backward Compatibility**: Scripts CLI continuam funcionando em `server/scripts/pje/`
2. **Segurança**: Credenciais PJE nunca são expostas ao client-side (apenas server-side)
3. **TypeScript Strict**: Modo strict ativado em todo o projeto
4. **Hot Reload**: Funciona perfeitamente para mudanças no frontend
5. **Shadcn/ui**: Componentes copiados para o projeto (full control, sem vendor lock-in)

## Troubleshooting

### Porta 3000 ocupada
O Next.js automaticamente usa a próxima porta disponível (3001, 3002, etc.)

### Lock file error
```bash
rm -rf .next
npm run dev
```

### TypeScript errors
```bash
# Recompilar backend
npm run server:build
```

## Arquitetura

```
┌─────────────────┐
│   Browser       │
│  (Next.js UI)   │
└────────┬────────┘
         │ Server Actions
         ▼
┌─────────────────┐
│  Next.js Server │
│  (App Router)   │
└────────┬────────┘
         │ Direct Import
         ▼
┌─────────────────┐
│ Browserless +   │
│  PJE Scripts    │
│   (server/)     │
└────────┬────────┘
         │ Puppeteer/Playwright
         ▼
┌─────────────────┐
│  PJE TRT3       │
│  (External API) │
└─────────────────┘
```

## Conclusão

A **Fase 1** foi concluída com sucesso! A estrutura base do Next.js está funcionando, o código foi reorganizado em arquitetura cliente-servidor, e todas as configurações necessárias foram criadas.

O projeto está pronto para a **Fase 2**, onde serão implementadas as Server Actions, APIs e UIs completas.

---

**Implementado por**: Claude Code
**Data**: 24 de Outubro de 2025
**Change Proposal**: `add-nextjs-frontend`
