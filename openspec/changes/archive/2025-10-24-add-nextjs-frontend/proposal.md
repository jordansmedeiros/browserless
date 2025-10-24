# Proposta: Adicionar Frontend Next.js com Shadcn/ui

## Why

Atualmente, o projeto Browserless + PJE funciona apenas como serviço de automação de navegadores e scripts de raspagem executados via linha de comando. Não existe interface gráfica para usuários não-técnicos executarem os scripts de automação PJE, visualizarem resultados, ou gerenciarem processos judiciais de forma amigável.

A transformação em aplicação Next.js com Shadcn/ui permitirá:
- **Interface web moderna** para executar scripts de raspagem PJE sem linha de comando
- **Visualização de dados** em tempo real dos processos judiciais coletados
- **Gestão centralizada** de todas as automações em um único painel
- **Acessibilidade** para usuários sem conhecimento técnico (advogados, paralegais)
- **Escalabilidade** para adicionar novas funcionalidades visuais no futuro

## What Changes

Esta é uma **mudança arquitetural significativa** que reestrutura o projeto em arquitetura cliente-servidor:

### Mudanças de Arquitetura

1. **Organização do Projeto**
   - Mover código Browserless/PJE para pasta `backend/` ou `server/`
   - Criar aplicação Next.js na raiz ou em `frontend/`
   - Separar claramente responsabilidades: UI (Next.js) vs Automação (Browserless)

2. **Next.js 15 App Router**
   - Instalar Next.js 15 com App Router (não Pages Router)
   - Configurar TypeScript compartilhado entre frontend e backend
   - Implementar Server Actions para comunicação backend

3. **Shadcn/ui Component Library**
   - Instalar e configurar Shadcn/ui com Tailwind CSS
   - Criar design system consistente (não implementar UI completa nesta fase)
   - Preparar componentes base (Button, Card, Table, Dialog, etc.)

4. **API Backend**
   - Expor APIs REST ou tRPC para executar scripts PJE
   - Endpoints para: login PJE, listar processos, raspar dados, visualizar resultados
   - Manter Browserless funcionando como serviço backend

5. **Estrutura de Dados**
   - Definir contratos de dados entre frontend/backend
   - Organizar tipos TypeScript compartilhados
   - Estruturar armazenamento de resultados (JSON/DB)

### Mudanças Não-Funcionais

- **BREAKING**: Scripts executados por CLI podem precisar de adaptação
- **BREAKING**: Variáveis de ambiente podem mudar (separar .env backend/frontend)
- Manter compatibilidade com execução standalone do backend Browserless
- Preservar toda funcionalidade existente de automação PJE

## Impact

### Affected Specs
- **NEW**: `nextjs-frontend` - Nova capability de interface web
- **MODIFIED**: Estrutura de projeto e build system
- **MODIFIED**: Configuração de variáveis de ambiente
- **MODIFIED**: Scripts de deploy e Docker (futuro)

### Affected Code

**Arquivos e Diretórios Principais:**
- `package.json` - Adicionar dependências Next.js, Shadcn/ui, Tailwind
- `tsconfig.json` - Configurar para monorepo ou workspace
- `scripts/pje/*` - Scripts PJE movidos/adaptados para serem chamados via API
- **NEW**: `app/` ou `frontend/` - Código Next.js completo
- **NEW**: `backend/` ou `server/` - Código Browserless reorganizado
- **NEW**: `lib/` ou `shared/` - Tipos TypeScript compartilhados

**Sistemas Afetados:**
- Sistema de build (tsc + Next.js build)
- Sistema de desenvolvimento (dev servers frontend + backend)
- Sistema de testes (testes backend + testes frontend futuros)
- Docker/Deploy (multi-stage build para frontend + backend)

### Migration Path

1. **Fase 1 (Esta Proposta)**: Estruturação e setup inicial
   - Instalar Next.js e Shadcn/ui
   - Reorganizar código em backend/frontend
   - Criar APIs básicas
   - Implementar componentes base (sem UI completa)

2. **Fase 2 (Futura)**: Implementação de UIs
   - Dashboard de processos
   - Formulários de execução de scripts
   - Visualizações de dados

3. **Fase 3 (Futura)**: Features avançadas
   - Autenticação de usuários
   - Agendamento de raspagens
   - Notificações em tempo real

### Backwards Compatibility

- Scripts CLI continuarão funcionando via `node scripts/pje/login.js`
- Backend Browserless pode rodar standalone (sem frontend)
- APIs serão adicionadas sem quebrar funcionalidade existente
- Variáveis de ambiente antigas serão mantidas com fallback

### Risks

- **Complexidade**: Projeto passa de monolito para arquitetura cliente-servidor
- **Manutenção**: Dois sistemas para manter (frontend + backend)
- **Performance**: Overhead de comunicação HTTP entre frontend/backend
- **Aprendizado**: Time precisa conhecer Next.js 15 e Shadcn/ui

### Benefits

- Interface moderna e profissional para usuários finais
- Base sólida para crescimento de features visuais
- Melhor separação de responsabilidades (UI vs automação)
- Ecossistema React + Next.js com vasta documentação
- Shadcn/ui oferece componentes acessíveis e customizáveis
