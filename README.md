# 🏛️ Browserless + PJE - Automação Judicial

> **Fork customizado do [Browserless](https://github.com/browserless/browserless)** com extensões para automação do **PJE (Processo Judicial Eletrônico)** do sistema judiciário brasileiro.

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-v24-green" alt="Node.js v24" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Puppeteer-24.26-orange" alt="Puppeteer 24.26" />
  <img src="https://img.shields.io/badge/Playwright-1.56-purple" alt="Playwright 1.56" />
  <img src="https://img.shields.io/badge/License-SSPL--1.0-red" alt="License SSPL-1.0" />
</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
  - [Automação PJE](#-automação-pje-trt3)
  - [Plataforma Browserless](#-plataforma-browserless)
- [Início Rápido](#-início-rápido)
  - [PJE: Login Automatizado](#pje-login-automatizado)
  - [Browserless: Servidor Headless](#browserless-servidor-headless)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação](#-documentação)
- [Tecnologias](#-tecnologias)
- [Desenvolvimento](#-desenvolvimento)
- [Licenciamento](#-licenciamento)

---

## 🎯 Sobre o Projeto

Este projeto combina duas funcionalidades principais:

### 1. 🏛️ Automação PJE (Processo Judicial Eletrônico)

Sistema completo de automação para o **PJE TRT3** (Tribunal Regional do Trabalho da 3ª Região) com capacidades de:

- **Login automatizado** com bypass de detecção de bots (CloudFront WAF)
- **Raspagem de processos** via APIs REST descobertas e documentadas
- **Extração de dados** de processos judiciais (acervo geral, pendentes, arquivados)
- **Anti-detecção avançada** usando Puppeteer Stealth Plugin

**Status**: ✅ Funcionando e validado (24/10/2025)

### 2. 🌐 Plataforma Browserless

Infraestrutura de navegadores headless baseada no projeto [Browserless](https://github.com/browserless/browserless):

- Deploy de navegadores headless (Chromium, Firefox, WebKit, Edge) em Docker
- Suporte para Puppeteer e Playwright sem modificações
- REST APIs para tarefas comuns (PDF, screenshots, HTML)
- Debug viewer interativo para desenvolvimento
- Gerenciamento de sessões e paralelismo

---

## ⚡ Funcionalidades

### 🏛️ Automação PJE TRT3

#### ✅ Login Automatizado
- Acesso automático ao PJE via SSO (Single Sign-On)
- Clique automatizado no botão "Entrar com PDPJ"
- Preenchimento de CPF e senha com digitação humana
- Navegação até o painel do usuário

#### ✅ Anti-Detecção de Bots
- **Puppeteer-Extra Stealth Plugin** - Oculta marcadores de automação
- **Digitação realista** - Caractere por caractere com delays
- **Movimento gradual de mouse** - Simula comportamento humano
- **Headers realistas** - User-Agent do Chrome 131
- **Navigator.webdriver oculto** - Bypass de detecção comum

#### ✅ Raspagem de Processos
- **APIs REST descobertas e documentadas** ([ver docs/pje/APIs.md](docs/pje/APIs.md))
- **Paginação automática** - Extrai todas as páginas de dados
- **Múltiplas categorias**:
  - Acervo Geral (1279 processos)
  - Pendentes de Manifestação (107 processos)
  - Arquivados (8769 processos)
- **Dados estruturados** - Salvos em JSON para análise
- **Rate limiting inteligente** - Respeita limites da API

#### 📊 Dados Capturados por Processo
```json
{
  "numeroProcesso": "0010014-94.2025.5.03.0022",
  "classeJudicial": "ATOrd",
  "descricaoOrgaoJulgador": "22ª VARA DO TRABALHO DE BELO HORIZONTE",
  "codigoStatusProcesso": "DISTRIBUIDO",
  "nomeParteAutora": "NOME DO AUTOR",
  "nomeParteRe": "NOME DO RÉU",
  "dataAutuacao": "2025-01-10T13:03:15.862",
  "segredoDeJustica": false,
  "juizoDigital": true
}
```

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

### PJE: Configuração Inicial

Antes de usar os scripts PJE, configure suas credenciais:

```bash
# 1. Copie o arquivo de exemplo
cp .env.example .env

# 2. Edite o arquivo .env e preencha suas credenciais PJE:
#    - PJE_CPF: Seu CPF (apenas números)
#    - PJE_SENHA: Sua senha do PJE
#    - PJE_ID_ADVOGADO: Seu ID de advogado (obtido via API)
```

**Importante**:
- ⚠️ Nunca commite o arquivo `.env` no Git (já está no `.gitignore`)
- 🔒 As credenciais ficam apenas no seu ambiente local
- 📖 Para descobrir seu `PJE_ID_ADVOGADO`, consulte [scripts/pje-trt/README.md](scripts/pje-trt/README.md)

### PJE: Login Automatizado

```bash
# 1. Instalar dependências (se ainda não instalou)
npm install

# 2. Executar script de login (certifique-se de ter configurado o .env)
node scripts/pje-trt/common/login.js
```

O navegador abrirá automaticamente e você verá:
1. ✅ Página PJE carregada
2. ✅ Clique em "Entrar com PDPJ"
3. ✅ CPF e senha preenchidos automaticamente
4. ✅ Login realizado com sucesso
5. ✅ Painel do usuário carregado

**Resultado**: Screenshot salvo no diretório raiz

### PJE: Raspagem de Processos

```bash
# Raspagem do acervo geral
node scripts/pje-trt/trt3/1g/acervo/raspar-acervo-geral.js

# Raspagem de processos pendentes
node scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-sem-prazo.js

# Raspagem de processos arquivados
node scripts/pje-trt/trt3/1g/arquivados/raspar-arquivados.js

# Raspagem da pauta (audiências)
node scripts/pje-trt/trt3/1g/pauta/raspar-minha-pauta.js
```

**Resultado**: Arquivos JSON salvos em `data/pje/trt3/1g/`

**Troubleshooting**:
- Se receber erro de credenciais não configuradas, verifique se o arquivo `.env` existe e está preenchido
- Se não souber seu `PJE_ID_ADVOGADO`, consulte a documentação em [scripts/pje-trt/README.md](scripts/pje-trt/README.md)

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
├── 📄 README-PJE.md                      # Guia rápido PJE
├── 📄 package.json                       # Dependências e scripts
├── 📄 tsconfig.json                      # Configuração TypeScript
│
├── 📁 src/                               # Código-fonte TypeScript (Browserless)
│   └── ...
│
├── 📁 build/                             # JavaScript compilado
│   └── ...
│
├── 📁 scripts/                           # Scripts de automação
│   ├── 📁 pje/                           # ⭐ Scripts PJE
│   │   ├── login.js                      # Login automatizado (validado)
│   │   ├── capturar-api.js               # Captura de APIs
│   │   ├── raspar-processos.js           # Raspagem simples
│   │   ├── raspar-todos-processos.js     # Raspagem completa
│   │   ├── README.md                     # Documentação completa
│   │   ├── README-RASPAGEM.md            # Guia de raspagem
│   │   └── 📁 raspadores/                # Raspadores especializados
│   │       └── ...
│   └── ...                               # Scripts de build
│
├── 📁 docs/                              # Documentação técnica
│   └── 📁 pje/                           # ⭐ Documentação PJE
│       ├── APIs.md                       # Referência completa das APIs
│       ├── ANTI-BOT-DETECTION.md         # Técnicas de anti-detecção
│       └── ESTRUTURA.md                  # Estrutura do módulo
│
├── 📁 data/                              # Dados extraídos
│   └── 📁 pje/                           # ⭐ Dados PJE
│       └── 📁 processos/                 # Processos raspados (JSON)
│           ├── totalizadores.json
│           ├── acervo_geral.json
│           ├── pendentes_manifestacao.json
│           ├── arquivados.json
│           └── relatorio.json
│
├── 📁 screenshots/                       # Evidências visuais
│   └── pje-login-success.png             # Screenshot do login funcionando
│
└── 📁 openspec/                          # Especificações do projeto
    ├── project.md                        # Contexto completo do projeto
    └── AGENTS.md                         # Instruções para agentes AI
```

---

## 📚 Documentação

### 🏛️ Documentação PJE

| Arquivo | Descrição | Público-Alvo |
|---------|-----------|--------------|
| **[README-PJE.md](README-PJE.md)** | Guia de início rápido para automação PJE | Iniciantes |
| **[scripts/pje/README.md](scripts/pje/README.md)** | Documentação completa e detalhada do módulo | Desenvolvedores |
| **[scripts/pje/README-RASPAGEM.md](scripts/pje/README-RASPAGEM.md)** | Guia completo de raspagem de processos | Desenvolvedores |
| **[docs/pje/APIs.md](docs/pje/APIs.md)** | Referência completa das APIs do PJE descobertas | Avançado |
| **[docs/pje/ANTI-BOT-DETECTION.md](docs/pje/ANTI-BOT-DETECTION.md)** | Técnicas avançadas de anti-detecção | Avançado |
| **[docs/pje/ESTRUTURA.md](docs/pje/ESTRUTURA.md)** | Mapa da estrutura do módulo PJE | Contribuidores |
| **[ESTRUTURA-ORGANIZADA.md](ESTRUTURA-ORGANIZADA.md)** | Histórico de reorganização do projeto | Referência |

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
| **Puppeteer** | 24.26.1 | Automação Chrome/Chromium |
| **Playwright** | 1.56.1 | Automação multi-browser (+ versões 1.51-1.54) |
| **Docker** | Latest | Containerização e deploy |

### Automação e Anti-Detecção

- **puppeteer-extra** - Sistema de plugins para Puppeteer
- **puppeteer-extra-plugin-stealth** - Bypass de detecção de bots
- **lighthouse** - Métricas de performance e auditorias

### Backend

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
npm run build           # Build completo (clean + TS + schemas + devtools + OpenAPI)
npm run build:dev       # Build dev (inclui function + debugger)
npm run build:ts        # Compilar TypeScript apenas
npm run clean           # Limpar build/

npm run dev             # Build dev + iniciar com .env
npm start               # Iniciar aplicação (requer build prévio)
```

#### Testes e Qualidade

```bash
npm test                # Executar testes (Mocha)
npm run coverage        # Testes com cobertura (c8)
npm run lint            # ESLint (com auto-fix)
npm run prettier        # Formatar código
```

#### PJE Scripts

```bash
# Login
node scripts/pje/login.js

# Captura de APIs
node scripts/pje/capturar-api.js

# Raspagem
node scripts/pje/raspar-processos.js              # Simples (primeira página)
node scripts/pje/raspar-todos-processos.js        # Completa (todas as páginas)
```

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

### PJE Issues

Para problemas relacionados ao módulo PJE, consulte:
- [scripts/pje/README.md](scripts/pje/README.md) - Troubleshooting completo
- [docs/pje/APIs.md](docs/pje/APIs.md) - Referência de APIs

**Problemas comuns**:
- Erro 403: CloudFront bloqueou, aguarde 5-10 minutos
- Erro 401: Sessão expirou, faça login novamente
- 0 processos: Verifique ID do advogado nos logs

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

### PJE
- **PJE TRT3**: [pje.trt3.jus.br](https://pje.trt3.jus.br)
- **SSO PDPJ**: [sso.cloud.pje.jus.br](https://sso.cloud.pje.jus.br)

### Browserless
- **Site oficial**: [browserless.io](https://browserless.io)
- **Documentação**: [docs.browserless.io](https://docs.browserless.io)
- **Docker**: [GitHub Packages](https://github.com/browserless/browserless/pkgs/container/base)

---

<div align="center">
  <p><strong>Última atualização</strong>: Outubro 2025</p>
  <p>Feito com ❤️ para automação judicial brasileira</p>
  <p>Baseado em <a href="https://github.com/browserless/browserless">Browserless</a> por <a href="https://browserless.io">browserless.io</a></p>
</div>
