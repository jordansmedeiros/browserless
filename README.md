# JusBro

> **Fork customizado do [Browserless](https://github.com/browserless/browserless)** com extensões para raspagem automatizadas de dados processuais. 
>
<div align="center">
  <img src="https://img.shields.io/badge/Node.js-v24-green" alt="Node.js v24" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue" alt="React 19" />
  <img src="https://img.shields.io/badge/Puppeteer-24.26-orange" alt="Puppeteer 24.26" />
  <img src="https://img.shields.io/badge/Playwright-1.56-purple" alt="Playwright 1.56" />
  <img src="https://img.shields.io/badge/License-SSPL--1.0-red" alt="License SSPL-1.0" />
</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
  - [Interface Web Next.js](#-interface-web-nextjs) ⭐ **NOVO**
  - [Automação de Sistemas Judiciais](#-automação-de-sistemas-judiciais)
  - [Plataforma Browserless](#-plataforma-browserless)
- [Início Rápido](#-início-rápido)
  - [Interface Web: Setup e Uso](#interface-web-setup-e-uso) ⭐ **NOVO**
  - [Sistemas Judiciais: Login Automatizado](#sistemas-judiciais-login-automatizado)
  - [Browserless: Servidor Headless](#browserless-servidor-headless)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação](#-documentação)
- [Tecnologias](#-tecnologias)
- [Desenvolvimento](#-desenvolvimento)
- [Licenciamento](#-licenciamento)

---

## 🎯 Sobre o Projeto

Este projeto combina duas funcionalidades principais:

### 1. 🏛️ Raspagem automatizada de dados processuais

Plataforma completa de automação para **sistemas judiciais eletrônicos brasileiros** com suporte a múltiplos sistemas e tribunais:

#### 🎯 Escopo do Projeto

**Sistemas Suportados**:
- **PJE** (Processo Judicial Eletrônico) - usado por TRTs e alguns TJs
- **ESAJ** (sistema unificado de alguns tribunais)
- **E-PROC** (sistema usado por TRFs e alguns tribunais)
- **PROJUDI** (sistema usado por alguns tribunais)

**Tribunais Suportados** (atual e planejado):
- ✅ **TRTs** (Tribunais Regionais do Trabalho) - 24 TRTs via PJE
- ✅ **TJs** (Tribunais de Justiça) - em implementação (TJMG, TJCE, TJDF, TJES já suportados)
- 🔜 **TRFs** (Tribunais Regionais Federais) - planejado
- 🔜 **Tribunais Superiores** (TST, STJ, STF) - planejado

#### ✨ Funcionalidades

- **🎯 Suporte Multi-Sistema**: Arquitetura preparada para múltiplos sistemas judiciais
- **Multi-Tribunal**: Suporte para diferentes tipos de tribunais (TRT, TJ, TRF, Superiores)
- **Login automatizado** com bypass de detecção de bots (CloudFront WAF, CAPTCHA, etc.)
- **Raspagem de processos** via APIs REST (quando disponíveis) ou parsing de HTML
- **Extração de dados** de processos judiciais (acervo geral, pendentes, arquivados, pauta)
- **Anti-detecção avançada** usando Puppeteer Stealth Plugin
- **Type-safe**: TypeScript com validação em tempo de compilação

**Status Atual**: 
- ✅ TRTs: Funcionando e validado com 24 TRTs (24/10/2025)
- ✅ TJs: TJMG, TJCE, TJDF, TJES implementados e testados
- 🔜 TRFs: Em planejamento
- 🔜 Tribunais Superiores: Em planejamento

📖 **[Documentação Completa Multi-TRT](docs/MULTI-TRT-SUPPORT.md)**

### 2. 🌐 Plataforma Browserless

Infraestrutura de navegadores headless baseada no projeto [Browserless](https://github.com/browserless/browserless):

- Deploy de navegadores headless (Chromium, Firefox, WebKit, Edge) em Docker
- Suporte para Puppeteer e Playwright sem modificações
- REST APIs para tarefas comuns (PDF, screenshots, HTML)
- Debug viewer interativo para desenvolvimento
- Gerenciamento de sessões e paralelismo

---

## ⚡ Funcionalidades

### 🌐 Interface Web Next.js

**Nova interface web moderna** para automação de sistemas judiciais com dashboard interativo:

#### ✨ Características Principais
- **Next.js 16** com App Router e React 19
- **Shadcn/ui** - Componentes modernos e acessíveis
- **Tailwind CSS 4** - Estilização utilitária e responsiva
- **Server Actions** - Integração type-safe com backend
- **Prisma ORM** - Persistência de dados em SQLite

#### 🎨 Funcionalidades da Interface
- ✅ **Dashboard interativo** com estatísticas e navegação
- ✅ **Gerenciamento de Credenciais** - Sistema completo de escritórios, advogados e credenciais
  - Suporte a escritórios com múltiplos advogados
  - Advogados autônomos (sem escritório)
  - Múltiplas senhas por advogado
  - Associação flexível de credenciais a tribunais e sistemas
  - Auto-detecção do ID do advogado (PJE e outros sistemas)
  - Teste de credenciais com rate limiting
- ✅ **Interface de Scraping Completa** - Sistema de raspagem com monitoramento em tempo real
  - Configuração visual de jobs de scraping
  - Seleção multi-tribunal com filtros
  - Monitoramento de jobs ativos com progresso em tempo real
  - Histórico completo de execuções com filtros
  - Visualização detalhada de resultados e logs
  - Exportação JSON de processos raspados
  - Retry automático e manual para falhas
  - Sistema de fila robusto com controle de concorrência
- ✅ **Sidebar de navegação** com rotas ativas destacadas
- ✅ **Páginas de processos** com placeholders para visualização
- ✅ **Estados de loading e error** para melhor experiência
- ✅ **Persistência automática** de dados com Prisma/SQLite
- ✅ **Exportação JSON** de resultados de scraping

#### 🏗️ Arquitetura
```
Frontend (Next.js)    ←→    Backend (Puppeteer)
├─ React 19                  ├─ Scripts Judiciais
├─ Server Actions            │  ├─ PJE (TRT, TJ)
├─ Prisma Client             │  ├─ ESAJ
└─ Shadcn/ui                 │  ├─ E-PROC
                             │  └─ PROJUDI
                             ├─ Anti-detecção
                             └─ Browserless Core
```

**Status**: ✅ Funcionando em desenvolvimento (http://localhost:3000)

#### ⚡ Otimizações de Performance

O sistema utiliza estratégias inteligentes de polling e caching para reduzir carga no servidor:

**Polling Adaptativo**
- **Job Status Polling**: Backoff exponencial (3s → 5s → 10s) quando sem mudanças detectadas
- **Endpoint Consolidado**: Requisição única para job status + estatísticas (reduz requests em 50%)
- **SSE para Logs**: Server-Sent Events para streaming instantâneo de logs

**Estratégia de Cache**
- **GitHub Stats**: ISR com revalidação de 1 hora (geração estática)
- **Dados de Tribunais**: Cache em memória com TTL de 5 minutos e invalidação reativa
- **Credenciais**: Cache de 5 minutos com capacidade de refresh manual

**Impacto**
- **70% de redução** em requests de polling durante períodos ociosos
- **50% de redução** em requests do monitor de terminal
- **Updates instantâneos** para logs via SSE
- **Carregamento rápido** da página inicial via ISR

#### ♿ Acessibilidade (WCAG 2.1 Level AA)

O JusBro foi desenvolvido seguindo as diretrizes WCAG 2.1 Level AA para garantir acessibilidade a todos os usuários.

**Recursos de Acessibilidade**
- **Navegação por Teclado**: Todos os componentes interativos são acessíveis via teclado (Tab, Enter, Space, Arrow keys)
- **Screen Reader Support**: Atributos ARIA completos em navegação, formulários e tabelas
- **Contraste de Cores**: Todas as combinações de cores passam WCAG AA (ratio mínimo 4.5:1 para texto normal)
- **Labels Explícitos**: Todos os controles de formulário têm labels associados via `htmlFor` ou `aria-label`
- **Estado de Navegação**: Links ativos indicados com `aria-current="page"` para orientação
- **Feedback de Ações**: Mudanças de estado anunciadas via `aria-live` para usuários de screen readers

**Virtualização de Tabelas**
- Tabelas grandes (>50 linhas) usam virtualização para manter performance
- Renderiza apenas linhas visíveis no viewport (+ overscan)
- Mantém acessibilidade completa mesmo com virtualização ativa

**Testes de Acessibilidade**

Execute os testes automatizados:
```bash
npm run test:accessibility
```

**Ferramentas recomendadas**:
- Lighthouse (Chrome DevTools) - Target: 100 score
- axe DevTools - Target: 0 violations
- NVDA/JAWS (Windows) ou VoiceOver (Mac) para testes manuais

**Conformidade**
- ✅ WCAG 2.1 Level AA
- ✅ Section 508
- ✅ EN 301 549

---

### 🌐 Plataforma Browserless

#### Navegadores Suportados
- **Chromium** - Via Puppeteer ou Playwright
- **Firefox** - Via Playwright
- **WebKit** - Via Playwright
- **Microsoft Edge** - Via Playwright

#### Funcionalidades Principais
- **WebSocket Endpoint** - Conexão remota via `ws://localhost:3000`
- **REST APIs** - Endpoints para PDF, screenshots, HTML, Lighthouse
- **Debugger Interativo** - Interface visual para desenvolvimento
- **Múltiplas Versões** - Suporte para Playwright 1.51-1.56
- **Gerenciamento de Sessões** - Timeouts e health checks automáticos
- **Queue System** - Controle de paralelismo e filas

---

## 🚀 Início Rápido

### Interface Web: Setup e Uso

A maneira mais fácil de usar o sistema é através da **interface web**:

```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco de dados
echo 'DATABASE_URL="file:./dev.db"' >> .env
npx prisma migrate dev

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

**Depois de iniciar:**
1. Acesse `http://localhost:3000/credentials`
2. Configure credenciais dos sistemas judiciais via interface web
3. Apenas para testes manuais: editar `.env` com credenciais

**Acesso**: [http://localhost:3000](http://localhost:3000)

#### 🎯 Usando a Interface

1. **Dashboard** (`/dashboard`) - Visão geral com estatísticas
2. **Credenciais** (`/credentials`) - Gerenciar credenciais de acesso
3. **Processos** (`/processos`) - Visualizar processos (em desenvolvimento)
4. **Raspagens** (`/scrapes`) - Gerenciar raspagens e histórico
5. **Agendamentos** (`/agendamentos`) - Agendar raspagens automáticas

#### 💡 Exemplo de Configuração

1. Acesse http://localhost:3000/credentials
2. Configure suas credenciais (escritório, advogado, senhas)
3. Associe credenciais aos tribunais e sistemas desejados
4. Teste as credenciais antes de usar em produção

**Vantagens**:
- ✅ Interface visual moderna
- ✅ Validação de formulários em tempo real
- ✅ Feedback de loading/erro
- ✅ Não precisa editar código
- ✅ 100% type-safe (TypeScript end-to-end)

---

### Sistemas Judiciais: Configuração de Credenciais

**🎯 Método Recomendado: Interface Web**

O sistema usa **gerenciamento de credenciais via interface web** para todos os sistemas (PJE, ESSAGE, E-PROC, PROJUDE):

1. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Acesse o gerenciamento de credenciais**:
   ```
   http://localhost:3000/credentials
   ```

3. **Configure suas credenciais**:
   - Crie um escritório (opcional) ou cadastre-se como advogado autônomo
   - Adicione seus dados (nome, OAB, CPF)
   - Cadastre suas senhas e associe aos tribunais e sistemas
   - Teste as credenciais antes de usar

**Vantagens**:
- ✅ Suporta múltiplos escritórios e advogados
- ✅ Múltiplas senhas por advogado
- ✅ Uma senha pode funcionar para vários tribunais
- ✅ Auto-detecta o ID do advogado no PJE
- ✅ Teste de credenciais integrado
- ✅ Não precisa editar arquivos `.env`

---

### Sistemas Judiciais: Interface de Scraping

**🎯 Método Recomendado: Interface Web de Scraping**

O sistema possui uma **interface completa de scraping** para todos os sistemas judiciais (PJE, ESSAGE, E-PROC, PROJUDE) com gerenciamento de jobs, monitoramento em tempo real e histórico:

1. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Acesse a interface de scraping**:
   ```
   http://localhost:3000/scrapes
   ```

#### ✨ Funcionalidades da Interface

**📋 Configuração de Jobs**
- Seletor de tribunais com agrupamento por tipo (TRT, TJ, TRF)
- Filtros por região e pesquisa
- Seleção de tipo de scraping:
  - **Acervo Geral** - Todos os processos do advogado
  - **Pendentes de Manifestação** - Processos com prazo ou sem prazo
  - **Arquivados** - Processos finalizados
  - **Minha Pauta** - Audiências e sessões
- Estimativa de tempo de execução
- Validação em tempo real

**⚡ Monitoramento em Tempo Real**
- Lista de jobs ativos com status (pending/running/completed/failed)
- Barras de progresso por job
- Visualização tribunal a tribunal
- Botão de cancelamento para jobs em execução
- Auto-refresh configurável (3 segundos)
- Notificações de conclusão

**📊 Histórico e Resultados**
- Tabela paginada de todos os jobs executados
- Filtros por status, tipo, tribunal e data
- Taxa de sucesso por job
- Visualização detalhada de execuções:
  - Logs completos da execução
  - Contagem de processos raspados
  - Tempo de execução e duração
  - Preview dos processos encontrados
  - Exportação em JSON
  - Botão de retry para execuções falhadas

**🔄 Gestão Avançada**
- Sistema de fila com controle de concorrência
- Execução sequencial por tribunal
- Retry automático com exponencial backoff
- Compressão de resultados (gzip)
- Logs estruturados com stderr/stdout separados

#### 💡 Como Usar

**Criar um Job de Scraping**:
1. Clique em "Nova Raspagem"
2. Selecione os tribunais desejados
3. Escolha o tipo de scraping
4. Revise o resumo (tribunais, tempo estimado)
5. Clique em "Iniciar Raspagem"

**Monitorar Execução**:
1. Acesse a aba "Jobs Ativos"
2. Acompanhe o progresso em tempo real
3. Expanda para ver detalhes por tribunal
4. Cancele se necessário

**Ver Resultados**:
1. Acesse a aba "Histórico"
2. Filtre por status, tipo ou data
3. Clique em um job para ver detalhes
4. Visualize logs e processos encontrados
5. Exporte resultados em JSON

**Reexecutar em Caso de Falha**:
1. Abra os detalhes de uma execução falhada
2. Clique em "Tentar Novamente"
3. O job será reenfileirado automaticamente

#### ⚙️ Configuração Avançada

Variáveis de ambiente disponíveis (opcionais):

```bash
# Concorrência de jobs
MAX_CONCURRENT_JOBS=3

# Concorrência de tribunais por job
MAX_CONCURRENT_TRIBUNALS_PER_JOB=1

# Timeout de execução (em ms)
SCRAPE_EXECUTION_TIMEOUT=600000  # 10 minutos

# Retry configuration
SCRAPE_MAX_RETRIES=3
SCRAPE_RETRY_DELAY=5000  # 5 segundos
```

**Vantagens**:
- ✅ Interface visual completa e moderna
- ✅ Monitoramento em tempo real
- ✅ Histórico persistente de todas as execuções
- ✅ Sistema de fila robusto
- ✅ Retry automático e manual
- ✅ Exportação de resultados
- ✅ Logs estruturados e detalhados
- ✅ Busca credenciais automaticamente do banco

---

**⚙️ Método Alternativo: Scripts Standalone (apenas para testes)**

Para scripts de teste manual, você ainda pode usar variáveis de ambiente:

```bash
# Executar script standalone com credenciais via linha de comando
node server/scripts/pje-trt/common/login.js <CPF> <SENHA>
```

**Importante**:
- ⚠️ O sistema principal **NÃO USA** variáveis de ambiente
- 🔒 Configure credenciais em `/credentials` para uso em produção

### Sistemas Judiciais: Login Automatizado

**Exemplos para diferentes sistemas:**

```bash
# 1. Instalar dependências (se ainda não instalou)
npm install

# 2. Login PJE (TRT)
node server/scripts/pje-trt/common/login.js

# 3. Login PJE (TJMG)
node server/scripts/pje-tj/tjmg/common/login.js

# Nota: Scripts para outros sistemas (ESSAGE, E-PROC, PROJUDE) estarão disponíveis conforme implementação
```

O navegador abrirá automaticamente e você verá:
1. ✅ Página PJE carregada
2. ✅ Clique em "Entrar com PDPJ"
3. ✅ CPF e senha preenchidos automaticamente
4. ✅ Login realizado com sucesso
5. ✅ Painel do usuário carregado

**Resultado**: Screenshot salvo no diretório raiz

### Sistemas Judiciais: Raspagem de Processos

**🎯 Método Recomendado: Interface Web**

Use a interface web para iniciar raspagens em todos os sistemas suportados:

```
http://localhost:3000/scrapes
```

O sistema busca automaticamente as credenciais do banco de dados para cada tribunal.

**Resultado**: Arquivos JSON salvos em `data/pje/trt3/1g/`

**Troubleshooting**:
- ⚠️ **Credenciais não encontradas**: Configure em http://localhost:3000/credentials
- 📖 Sistema busca credenciais do banco de dados automaticamente para cada tribunal/sistema
- 📋 Certifique-se de associar credenciais ao sistema correto (PJE, ESAJ, E-PROC, PROJUDI)

### Browserless: Servidor Headless

```bash
# 1. Build do projeto
npm run build

# 2. Instalar navegadores
npm run install:browsers

# 3. Iniciar servidor
npm start
```

**Acesso**:
- Documentação: `http://localhost:3000/docs`
- Debugger: `http://localhost:3000/debugger/`
- WebSocket: `ws://localhost:3000`

#### Exemplo Puppeteer

```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://localhost:3000',
});

const page = await browser.newPage();
await page.goto('https://example.com');
console.log(await page.title());
```

#### Exemplo Playwright

```javascript
import { chromium } from 'playwright-core';

const browser = await chromium.connect(
  'ws://localhost:3000/chromium/playwright'
);

const page = await browser.newPage();
await page.goto('https://example.com');
console.log(await page.title());
```

---

## 📁 Estrutura do Projeto

```
browserless/
│
├── 📄 README.md                          # Este arquivo
├── 📄 docs/pje/README-PJE.md             # Guia rápido PJE
├── 📄 docs/ESTRUTURA-ORGANIZADA.md        # Histórico de reorganização
├── 📄 package.json                       # Dependências e scripts
├── 📄 tsconfig.json                      # Configuração TypeScript (frontend)
├── 📄 next.config.mjs                    # ⭐ Configuração Next.js
├── 📄 tailwind.config.ts                 # ⭐ Configuração Tailwind CSS
├── 📄 components.json                    # ⭐ Configuração Shadcn/ui
│
├── 📁 app/                               # ⭐ Next.js App Router (frontend)
│   ├── layout.tsx                        # Layout raiz
│   ├── page.tsx                          # Landing page
│   ├── globals.css                       # Estilos globais
│   ├── actions/pje.ts                    # Server Actions
│   └── (dashboard)/                      # Grupo de rotas do dashboard
│       ├── layout.tsx                    # Layout com sidebar/header
│       ├── dashboard/page.tsx            # Dashboard principal
│       ├── credentials/page.tsx          # Gerenciamento de credenciais
│       ├── scrapes/page.tsx              # Interface de raspagens
│       ├── processos/page.tsx            # Consulta de processos
│       └── agendamentos/page.tsx         # Agendamentos de raspagens
│
├── 📁 components/                        # ⭐ Componentes React
│   ├── layout/
│   │   ├── sidebar.tsx                   # Sidebar de navegação
│   │   └── header.tsx                    # Header do dashboard
│   └── ui/                               # Componentes Shadcn
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
├── 📁 lib/                               # ⭐ Código compartilhado
│   ├── utils.ts                          # Utilitários (cn)
│   ├── prisma.ts                         # Prisma Client singleton
│   ├── api/pje-adapter.ts                # Adaptador PJE Scripts
│   └── types/                            # Tipos TypeScript compartilhados
│       ├── pje.ts
│       ├── api.ts
│       └── index.ts
│
├── 📁 server/                            # ⭐ Backend (Browserless + PJE Scripts)
│   ├── tsconfig.json                     # TypeScript config backend
│   ├── src/                              # Código-fonte Browserless
│   │   └── ...
│   ├── build/                            # JavaScript compilado
│   │   └── ...
│   └── scripts/                          # Scripts de automação de sistemas judiciais
│       ├── pje-trt/                      # Scripts PJE TRT (Tribunais Regionais do Trabalho)
│       │   ├── common/login.js           # Login automatizado (validado)
│       │   ├── acervo/                   # Scripts de acervo geral
│       │   ├── pendentes/                # Scripts de processos pendentes
│       │   ├── arquivados/               # Scripts de processos arquivados
│       │   └── pauta/                    # Scripts de pauta/audiências
│       ├── pje-tj/                       # Scripts PJE TJ (Tribunais de Justiça - sistema PJE)
│       │   ├── tjmg/                     # Tribunal de Justiça de Minas Gerais
│       │   ├── tjce/                     # Tribunal de Justiça do Ceará
│       │   ├── tjdf/                    # Tribunal de Justiça do DF
│       │   └── tjes/                     # Tribunal de Justiça do Espírito Santo
│       ├── eproc-trf/                    # 🔜 Scripts E-PROC TRF (em planejamento)
│       ├── essage-tj/                    # 🔜 Scripts ESSAGE TJ (em planejamento)
│       └── projude-tj/                   # 🔜 Scripts PROJUDE TJ (em planejamento)
│
├── 📁 prisma/                            # ⭐ Banco de dados
│   ├── schema.prisma                     # Schema do banco
│   └── migrations/                       # Migrations
│
├── 📁 docs/                              # Documentação técnica
│   └── 📁 pje/                           # Documentação PJE
│       ├── APIs.md                       # Referência completa das APIs
│       ├── ANTI-BOT-DETECTION.md         # Técnicas de anti-detecção
│       └── ESTRUTURA.md                  # Estrutura do módulo
│
├── 📁 data/                              # Dados extraídos (gitignored)
│   └── 📁 pje/                           # Dados PJE
│       └── 📁 trt3/1g/                   # Processos raspados (JSON)
│
├── 📁 screenshots/                       # Evidências visuais
│   └── pje-login-success.png             # Screenshot do login funcionando
│
└── 📁 openspec/                          # Especificações do projeto
    ├── project.md                        # Contexto completo do projeto
    ├── AGENTS.md                         # Instruções para agentes AI
    └── changes/archive/                  # Histórico de mudanças
        └── 2025-10-24-add-nextjs-frontend/
```

**Mudanças Arquiteturais**:
- ✅ **Monorepo** - Frontend (raiz) + Backend (server/)
- ✅ **Next.js App Router** - Arquitetura moderna React Server Components
- ✅ **Shadcn/ui** - Biblioteca de componentes copy-paste
- ✅ **Prisma ORM** - Persistência de dados SQLite
- ✅ **Backward Compatible** - Scripts CLI ainda funcionam em server/scripts/

---

## 📚 Documentação

### 🏛️ Documentação de Sistemas Judiciais

| Arquivo | Descrição | Público-Alvo |
|---------|-----------|--------------|
| **[docs/pje/README-PJE.md](docs/pje/README-PJE.md)** | Guia de início rápido para automação PJE | Iniciantes |
| **[server/scripts/pje-trt/README.md](server/scripts/pje-trt/README.md)** | Documentação completa do módulo TRT (PJE) | Desenvolvedores |
| **[server/scripts/pje-tj/README.md](server/scripts/pje-tj/README.md)** | Documentação do módulo TJ (PJE) | Desenvolvedores |
| **[docs/pje/APIs.md](docs/pje/APIs.md)** | Referência completa das APIs do PJE descobertas | Avançado |
| **[docs/pje/ANTI-BOT-DETECTION.md](docs/pje/ANTI-BOT-DETECTION.md)** | Técnicas avançadas de anti-detecção | Avançado |
| **[docs/pje/ESTRUTURA.md](docs/pje/ESTRUTURA.md)** | Mapa da estrutura do módulo PJE | Contribuidores |
| **[docs/ESTRUTURA-ORGANIZADA.md](docs/ESTRUTURA-ORGANIZADA.md)** | Histórico de reorganização do projeto | Referência |

**Nota Terminológica**: Este projeto suporta múltiplos sistemas judiciais brasileiros. O **PJE** é um dos sistemas suportados (usado por TRTs e alguns TJs). Outros sistemas como **ESAJ**, **E-PROC** e **PROJUDI** estão em planejamento ou implementação.

### 🌐 Documentação Browserless

| Recurso | Link |
|---------|------|
| **Documentação Oficial** | [docs.browserless.io](https://docs.browserless.io/) |
| **Live Debugger** | [chrome.browserless.io](https://chrome.browserless.io/) |
| **Docker Images** | [GitHub Packages](https://github.com/browserless/browserless/pkgs/container/base) |
| **Repositório Original** | [github.com/browserless/browserless](https://github.com/browserless/browserless) |

### 📖 Especificações do Projeto

| Arquivo | Descrição |
|---------|-----------|
| **[openspec/project.md](openspec/project.md)** | Contexto completo do projeto (tech stack, convenções, domínio) |
| **[openspec/AGENTS.md](openspec/AGENTS.md)** | Instruções para agentes AI trabalharem no projeto |

---

## 🛠️ Tecnologias

### Stack Principal

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | v24.x | Runtime (obrigatório v24, não v25) |
| **TypeScript** | 5.9.3 | Linguagem principal (modo strict) |
| **Next.js** | 16.0.0 | ⭐ Framework React (App Router) |
| **React** | 19.2.0 | ⭐ Biblioteca UI (Server Components) |
| **Puppeteer** | 24.26.1 | Automação Chrome/Chromium |
| **Playwright** | 1.56.1 | Automação multi-browser (+ versões 1.51-1.54) |
| **Docker** | Latest | Containerização e deploy |

### Frontend

- **Tailwind CSS 4** - Estilização utilitária com Turbopack
- **Shadcn/ui** - Biblioteca de componentes baseada em Radix UI
- **Zod** - Validação de schemas TypeScript-first
- **Zustand** - State management leve (instalado, em uso futuro)
- **Lucide React** - Ícones SVG modernos

### Automação e Anti-Detecção

- **puppeteer-extra** - Sistema de plugins para Puppeteer
- **puppeteer-extra-plugin-stealth** - Bypass de detecção de bots
- **lighthouse** - Métricas de performance e auditorias

### Backend

- **Prisma** - ⭐ ORM type-safe para Node.js (SQLite)
- **http-proxy** - Proxy de conexões WebSocket
- **joi** - Validação de requests
- **queue** - Sistema de filas e paralelismo
- **debug** - Logging estruturado
- **systeminformation** - Métricas do sistema

### Build e Qualidade

- **ESLint** - Linting (imports ordenados, strict TypeScript)
- **Prettier** - Formatação (semicolons, single quotes, 80 chars)
- **Mocha** - Framework de testes (timeout 45s)
- **c8** - Code coverage
- **esbuild** - Bundler rápido para functions
- **typescript-json-schema** - Geração de schemas

---

## 💻 Desenvolvimento

### Pré-requisitos

```bash
# Node.js v24 (obrigatório)
node --version  # Deve retornar v24.x.x

# NPM (vem com Node.js)
npm --version
```

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/browserless.git
cd browserless

# 2. Instalar dependências
npm install

# 3. Instalar navegadores (Playwright)
npm run install:browsers

# 4. Build completo
npm run build

# 5. (Opcional) Instalar debugger
npm run install:debugger
```

### Scripts NPM Disponíveis

#### Build e Desenvolvimento

```bash
# Frontend (Next.js)
npm run dev             # ⭐ Iniciar servidor Next.js dev (http://localhost:3000)
npm run build           # Build Next.js + backend
npm start               # Iniciar aplicação em produção

# Backend (Browserless)
npm run server:build    # Build apenas do backend (server/src → server/build)
npm run server:dev      # Build dev do servidor

# Outras builds
npm run clean           # Limpar build/
npm run build:ts        # Compilar TypeScript apenas
```

#### Testes e Qualidade

```bash
npm test                # Executar testes (Mocha)
npm run coverage        # Testes com cobertura (c8)
npm run lint            # ESLint (com auto-fix)
npm run prettier        # Formatar código
```

#### PJE Scripts (CLI)

```bash
# Login
node server/scripts/pje-trt/common/login.js

# Captura de APIs
node server/scripts/pje-trt/common/capturar-api.js

# Raspagem
node server/scripts/pje-trt/trt3/1g/acervo/raspar-acervo-geral.js       # Acervo geral
node server/scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes.js       # Pendentes
node server/scripts/pje-trt/trt3/1g/arquivados/raspar-arquivados.js     # Arquivados
node server/scripts/pje-trt/trt3/1g/pauta/raspar-minha-pauta.js         # Pauta
```

**Nota**: Os scripts foram movidos para `server/scripts/` mas continuam 100% funcionais!

### Estrutura de Código

**Convenções de Nomenclatura**:
- Arquivos: `kebab-case.ts` (ex: `login-pje.js`)
- Funções/variáveis: `camelCase`
- Tipos/Interfaces: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`

**Imports**: Ordenados alfabeticamente (enforced pelo ESLint)

```typescript
// ✅ Correto
import { Browser } from 'puppeteer';
import puppeteer from 'puppeteer';
import { delay } from './utils';

// ❌ Incorreto (ordem errada)
import { delay } from './utils';
import puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
```

**TypeScript**: Modo strict habilitado

```typescript
// ✅ Correto
function processData(data: string): number {
  return parseInt(data);
}

// ❌ Incorreto (implicit any)
function processData(data) {
  return parseInt(data);
}
```

### Extensões (NodeJS SDK)

O Browserless permite criar extensões customizadas:

```bash
# Criar nova extensão
npx @browserless.io/browserless create
```

Veja [bin/scaffold/README.md](bin/scaffold/README.md) para detalhes completos.

### Debugger Interativo

Instale o debugger para desenvolvimento visual:

```bash
npm run build
npm run install:debugger
npm start
```

Acesse: `http://localhost:3000/debugger/?token=YOUR_TOKEN`

**Funcionalidades**:
- Executar `debugger;` statements
- Console logs em tempo real
- Inspeção DOM completa
- Network requests
- Chrome DevTools completo

---

## 📦 Deploy

### Docker (Browserless Original)

```bash
# Chromium
docker run -p 3000:3000 ghcr.io/browserless/chromium

# Firefox
docker run -p 3000:3000 ghcr.io/browserless/firefox

# Multi-browser
docker run -p 3000:3000 ghcr.io/browserless/multi
```

Veja mais opções em [docs.browserless.io/baas/docker/quickstart](https://docs.browserless.io/baas/docker/quickstart).

### Local (com PJE)

```bash
# 1. Build
npm run build

# 2. Configurar ambiente (opcional)
cp .env.example .env
# Editar .env com suas configurações

# 3. Iniciar
npm start
```

---

## 📄 Licenciamento

### SSPL-1.0 OR Browserless Commercial License

Este projeto herda o licenciamento do [Browserless original](https://github.com/browserless/browserless):

**SPDX-License-Identifier**: SSPL-1.0 OR Browserless Commercial License

#### ✅ Uso Permitido (SSPL-1.0)

- Projetos open source compatíveis com SSPL
- Uso pessoal e educacional
- Pesquisa e desenvolvimento
- Automações jurídicas autorizadas (PJE)

#### 🔐 Uso Comercial

Para uso comercial, CI/CD proprietário ou SaaS, é necessária uma **licença comercial**:

- [Adquirir licença comercial](https://www.browserless.io/contact)
- Suporte prioritário
- On-premise + cloud
- Modificação do código-fonte
- Interface administrativa

#### ⚠️ Importante - PJE

As extensões PJE são para:
- ✅ Uso autorizado por advogados com credenciais válidas
- ✅ Automação de tarefas repetitivas legítimas
- ✅ Acesso a processos próprios ou representados

Não deve ser usado para:
- ❌ Scraping não autorizado
- ❌ Violação de termos de serviço
- ❌ Acesso a processos sem autorização
- ❌ Sobrecarga de sistemas judiciais

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para mudanças significativas:

1. Abra uma issue primeiro para discutir a mudança
2. Fork o projeto
3. Crie uma branch (`git checkout -b feature/MinhaFeature`)
4. Commit suas mudanças seguindo convenções
5. Push para a branch (`git push origin feature/MinhaFeature`)
6. Abra um Pull Request

**Commits**: Use conventional commits
```bash
feat(pje): adicionar extração de documentos
fix(pje): corrigir timeout na raspagem
docs(pje): atualizar README com novos endpoints
chore(deps): atualizar puppeteer para v24.26
```

---

## 📞 Suporte

### Sistemas Judiciais - Issues

Para problemas relacionados aos sistemas judiciais, consulte:
- [server/scripts/pje-trt/README.md](server/scripts/pje-trt/README.md) - Troubleshooting completo TRT (PJE)
- [server/scripts/pje-tj/README.md](server/scripts/pje-tj/README.md) - Troubleshooting completo TJ (PJE)
- [docs/pje/APIs.md](docs/pje/APIs.md) - Referência de APIs PJE

**Problemas comuns**:
- Erro 403: CloudFront bloqueou (PJE), aguarde 5-10 minutos
- Erro 401: Sessão expirou, faça login novamente
- 0 processos: Verifique ID do advogado nos logs
- Credenciais não funcionam: Certifique-se de usar o sistema correto (PJE vs ESSAGE vs E-PROC)

### Browserless Issues

Para problemas da plataforma Browserless:
- [Documentação oficial](https://docs.browserless.io/)
- [Issues no GitHub original](https://github.com/browserless/browserless/issues)

---

## 🔗 Links Úteis

### Projeto
- **Repositório**: Este repositório
- **Upstream**: [github.com/browserless/browserless](https://github.com/browserless/browserless)
- **Documentação**: Veja [seção Documentação](#-documentação) acima

### Sistemas Judiciais Brasileiros
- **PJE**: [pje.trt3.jus.br](https://pje.trt3.jus.br) (usado por TRTs e alguns TJs)
- **SSO PDPJ**: [sso.cloud.pje.jus.br](https://sso.cloud.pje.jus.br) (sistema de autenticação PJE)
- **ESSAGE**: Sistema usado por alguns tribunais de justiça
- **E-PROC**: Sistema usado por TRFs e alguns tribunais
- **PROJUDE**: Sistema usado por alguns tribunais

### Browserless
- **Site oficial**: [browserless.io](https://browserless.io)
- **Documentação**: [docs.browserless.io](https://docs.browserless.io)
- **Docker**: [GitHub Packages](https://github.com/browserless/browserless/pkgs/container/base)

---

<div align="center">
  <p><strong>Última atualização</strong>: Outubro 2025</p>
  <p>Feito com ❤️ pela Sinesys</p>
  <p>Baseado em <a href="https://github.com/browserless/browserless">Browserless</a> por <a href="https://browserless.io">browserless.io</a></p>
</div>
