# Project Context

## Purpose

This is a **fork of Browserless** - a headless browser platform - augmented with a Next.js dashboard and custom extensions for **PJE (Processo Judicial Eletronico)** automation. The project serves three main purposes:

1. **Core Browserless Platform**: Deploy and manage headless browsers (Chromium, Firefox, WebKit, Edge) in Docker for remote browser automation.
2. **PJE Legal Automation**: Automated login, data scraping, and process management for Brazil's electronic legal process system (PJE TRT3).
3. **Operations Dashboard**: Next.js 16 app for configuring credentials, monitoring scrapes, and launching workflows from a modern UI.


### Key Goals
- Provide a reliable, production-ready headless browser service
- Support both Puppeteer and Playwright libraries
- Implement sophisticated anti-bot detection mechanisms for PJE access
- Enable automated scraping of legal process data from PJE courts
- Maintain compatibility with upstream Browserless while adding custom legal automation features
- Provide a self-service UI tailored to TRT3 legal automation workflows

## Tech Stack

### Application Platform
- **Next.js** 16 (App Router + React Server Components) powers the dashboard in `app/` and surfaces server actions for PJE flows.
- **React** 19 with hooks, client components, and 'use server' actions for orchestration.
- **Tailwind CSS** 3.4 with Radix UI primitives, class-variance-authority, tailwind-merge, and shadcn-style component patterns.
- **Prisma** 6.18.0 with PostgreSQL (`DATABASE_URL`) for credential storage, scrape history, and tribunal metadata.
- **Zod** + `@hookform/resolvers` + React Hook Form for schema-backed forms.

### Automation Runtime
- **Node.js** v24 (exact range `>= 24 < 25`) running the Browserless fork and automation scripts.
- **TypeScript** 5.9 in strict mode across both the Next.js app and the `server/` service.
- **Puppeteer** 24.26.1 bundled with `puppeteer-extra` and the stealth plugin for Chromium hardening.
- **Playwright** 1.56.1 plus pinned compatibility builds (`playwright-1.51`–`1.54`) to support legacy court requirements.
- `lighthouse`, `systeminformation`, `tar-fs`, and `file-type` for audits, telemetry, and artifact handling.
- **Docker** images to package headless browser workloads for deployment.

### Backend & Services
- `http-proxy`, `queue`, and `get-port` coordinate browser sessions and request isolation.
- Custom TypeScript service under `server/` compiled with `tsc` and launched via env-cmd + Node.
- `@prisma/client`, `pg`, and `dotenv` handle database access and configuration management.
- `commander` CLIs for automation utilities and scaffolding.
- `debug` provides structured logging, with `gradient-string` for CLI UX.
- `patch-package` maintains local vendor fixes post-install.

### Build & Tooling
- **TypeScript Compiler** (tsc) + project references for `server/` builds.
- **esbuild** packaging for function builds and development helpers.
- **tsx** and `ts-node/esm` for executing TypeScript scripts during development.
- **ESLint** 9 with `@typescript-eslint` and enforced sorted imports.
- **Prettier** 3 configured for semicolons, single quotes, trailing commas, and 80 column width.
- **Mocha** 11 with `ts-node/esm` loader and **c8** for coverage reports.
- **Playwright CLI** (`npm run install:browsers`) to install Chromium, Firefox, WebKit, and Edge binaries.
## Project Conventions

### Code Style

**Formatting** (enforced by Prettier):
- Semicolons required
- Single quotes for strings
- Trailing commas in all multi-line structures
- 80 character line width
- 2 space indentation

**ESLint Rules**:
- Sorted imports (alphabetically, grouped by type)
- Strict TypeScript mode enabled
- No `any` types without explicit override
- All compiler errors must be fixed (strict null checks, unused vars, etc.)
- No async promise executors allowed

**Naming Conventions**:
- Files: kebab-case (e.g., `server/scripts/pje-trt/trt3/1g/raspar-acervo-geral.js`, `app/(dashboard)/pje/login/page.tsx`).
- Functions/variables: camelCase.
- Types/Interfaces: PascalCase.
- Constants: UPPER_SNAKE_CASE for config values.

**TypeScript Configuration**:
- App `tsconfig.json`: target ES2022, module `esnext`, moduleResolution `bundler`, `noEmit`, and path aliases (`@/*`, `@/lib/*`, etc.) for Next.js compilation.
- Server `server/tsconfig.json`: outputs to `server/build/`, module `es2022`, strict null checks, declarations enabled, and enforces noUnused locals/parameters.
- All TypeScript builds run in strict mode with JSON module support and ESM-first modules.

## Architecture Patterns

**Core Architecture**:
- Next.js App Router in `app/` serves dashboard pages, server actions, and API routes.
- The `server/` package (TypeScript compiled to `server/build/`) hosts the Browserless engine and automation APIs consumed by the UI.
- Browser sessions are proxied through `http-proxy`; each request spawns an isolated Chromium/Firefox/WebKit/Edge instance and is torn down when complete.
- Queue orchestration via the `queue` library controls concurrency and protects system resources.

**PJE Automation Modules** (under `server/scripts/pje-trt/` and `server/scripts/pje-common/`):
- `common/login.js` automates TRT Single Sign-On with stealth hardening.
- `trt3/1g/*` directories hold acervo, pendentes, arquivados, and pauta scrapers.
- Shared utilities in `server/scripts/pje-trt/common/` centralize selectors, waits, and error handling.
- Results default to `data/pje/trt3/1g/` with one JSON file per scrape run.

**Dashboard Workflows**:
- Server actions in `app/(pje)/` call into automation services via `server/api` adapters.
- Credentials and scrape history persist through Prisma models defined in `prisma/`.
- UI components (shadcn style) live in `components/` with reusable hooks in `hooks/` and helper modules in `lib/`.

**File Organization**:
```
app/                         - Next.js routes, layouts, and server actions
components/                  - Shared UI components (shadcn + Radix)
config/                      - Zod schemas, feature flags, and runtime config
hooks/                       - React hooks for client/server interop
lib/                         - Shared utilities and service clients
server/src/                  - Browserless core service TypeScript source
server/scripts/pje-trt/      - TRT-specific automation scripts
server/scripts/pje-common/   - Shared PJE helpers reused across tribunals
server/build/                - Compiled JavaScript output for the service
data/pje/                    - Local storage for scraped artifacts
docs/pje/                    - PJE technical documentation
prisma/                      - Database schema and generated client config
public/                      - Static assets served by Next.js
extensions/                  - Browserless SDK extensions
```

**Extension System**:
- Browserless Node SDK extensions remain under `extensions/`.
- CLI scaffolding and documentation live in `bin/scaffold/README.md`.
### Testing Strategy

**Frameworks**:
- Mocha 11 for automation and service code, executed with `ts-node/esm`.
- React Testing Library + Happy DOM for dashboard components (via `npm run test:ux`).
- Playwright-powered smoke checks wrapped in custom `scripts/test-*.ts` utilities executed with `tsx`.

**Configuration**:
- Mocha specs compile to `build/**/*.spec.js` (generated from TypeScript sources under `server/src`).
- Default timeout 45s and slow threshold 5s as defined in `package.json`.
- UI tests rely on the `tsx` runner with `happy-dom` and Testing Library assertions.

**Running Tests**:
```bash
npm test                 # Build server bundles and run mocha suite
npm run coverage         # Mocha with c8 coverage output
npm run build:tests      # Prebuild TS + functions + debugger assets
npm run test:ux          # Accessibility + responsiveness checks (Testing Library + Happy DOM)
npm run test:accessibility
npm run test:responsiveness
```

**Testing Approach**:
- Build artifacts via `npm run build:tests` before executing integration suites.
- Mock external PJE endpoints where possible; leverage environment variables for credentialed runs.
- Browser automation regression steps run through `scripts/test-*-trt*.ts` (`tsx` runner) against sandboxed environments.
- Capture artifacts under `data/test-*` to analyze scraping regressions.

### Git Workflow

**Branch Strategy**:
- `main` - Primary development branch
- Create feature branches for significant changes
- PRs should target `main` branch

**Commit Conventions**:
- Follow conventional commits style from repository history
- Examples from recent commits:
  - `chore(config): description` - Configuration changes
  - `chore(deps): description` - Dependency updates
  - `docs(deploy): description` - Documentation changes
  - `feat(pje): description` - New PJE features
  - `fix(pje): description` - Bug fixes

**Pre-commit**:
- Linting with ESLint (auto-fix enabled)
- Formatting with Prettier
- Build validation (ensure TypeScript compiles)

**Build Commands**:
```bash
npm run build        # Full production build
npm run build:dev    # Development build with function + debugger
npm run dev          # Build and start with .env
npm start            # Start built application
```

## Domain Context

### Browserless Platform

**What it does**: Provides headless browser infrastructure as a service
- Manages browser lifecycle (start, connect, close)
- Handles font and emoji rendering issues
- Provides REST APIs for common tasks (PDF generation, screenshots, HTML extraction)
- Includes interactive debugger for script development
- Supports parallel sessions with configurable limits

**Key Concepts**:
- **WebSocket Endpoint**: Libraries connect via `ws://host:port` or `ws://host:port/{browser}/playwright`
- **Browser Versions**: Supports multiple Playwright versions simultaneously
- **Debug Viewer**: Visual interface showing active sessions
- **Session Management**: Automatic timeouts and health checks

### PJE (Processo Judicial Eletronico) Automation

**Domain**: Brazilian electronic legal process system (TRT3 - Labor Court)

**Key Challenges**:
1. **Anti-Bot Detection**: CloudFront WAF detects and blocks automated access
2. **OAuth Flow**: Dynamic state tokens in SSO authentication
3. **Rate Limiting**: APIs throttle excessive requests
4. **Session Management**: 30-minute timeout on inactivity

**Anti-Detection Techniques** (documented in `docs/pje/ANTI-BOT-DETECTION.md`):
- Puppeteer Stealth Plugin to hide automation markers
- Human-like typing (character by character)
- Gradual mouse movement
- Realistic Chrome 131 headers
- Navigator.webdriver obfuscation

**PJE APIs** (documented in `docs/pje/APIs.md`):
- Authentication via SSO: `https://sso.cloud.pje.jus.br`
- Base URL: `https://pje.trt3.jus.br`
- Profile API: `/pje-seguranca/api/token/perfis`
- Process Lists: `/pje-comum-api/api/paineladvogado/{id}/processos`
- Totals: `/pje-comum-api/api/paineladvogado/{id}/totalizadores`

**Process Categories**:
- Acervo Geral (ID: 1) - All active processes
- Pendentes de Manifestação (ID: 2) - Awaiting response
- Arquivados (ID: 5) - Archived processes

**Data Handling**:
- Pagination: Max 100 records per page
- Rate limiting: 500ms delay between requests recommended
- Output: JSON files saved to `data/pje/processos/`

## Important Constraints

### Technical Constraints

1. **Node.js Version**: Must use Node v24.x (not v25)
   ```json
   "engines": { "node": ">= 24 < 25" }
   ```

2. **Browser Support**: Chromium, Firefox, WebKit, Edge via Playwright/Puppeteer

3. **Module System**: ES Modules (ESM) only - no CommonJS
   ```json
   "type": "module"
   ```

4. **TypeScript Strictness**: Full strict mode enabled
   - No implicit any
   - Strict null checks
   - No unused variables/parameters

5. **Platform**: Windows development environment (win32)

### Business Constraints

1. **Licensing**: SSPL-1.0 OR Browserless Commercial License
   - Open source use: Compatible with SSPL
   - Commercial/CI use: Requires commercial license
   - See LICENSE file for details

2. **PJE Usage**: Only for authorized legal purposes
   - Must have valid credentials
   - Respect rate limits
   - No credential commits to Git
   - Use environment variables in production

### Security Constraints

1. **Credential Management**:
   - Never commit credentials to Git
   - Use `.env` files (in `.gitignore`)
   - Environment variables for production
   - CPF/password in code only for development/testing

2. **Anti-Detection Ethics**:
   - Used only for authorized access
   - Personal lawyer account automation
   - Not for unauthorized data scraping
   - Respect court system resources

## External Dependencies

### PJE System APIs

**SSO Authentication**:
- URL: `https://sso.cloud.pje.jus.br/auth/realms/pje/`
- Type: OAuth 2.0 style flow with PDPJ integration
- Session: Cookie-based (~30 min timeout)

**PJE TRT3 APIs**:
- Base: `https://pje.trt3.jus.br`
- Version: PJE 2.15.2 - COPAÍBA
- Security: CloudFront WAF (anti-bot protection)

**Key Endpoints**:
```
GET /pje-seguranca/api/token/perfis
GET /pje-comum-api/api/paineladvogado/{id}/totalizadores
GET /pje-comum-api/api/paineladvogado/{id}/processos
```

### External Services

**CloudFront (AWS)**:
- Protects PJE from bot traffic
- Requires sophisticated anti-detection
- May temporarily block on suspicious patterns

**Browser Binaries**:
- Playwright browsers (installed via `npm run install:browsers`)
- Chromium, Firefox, WebKit, Edge
- Multiple Playwright versions supported (1.51-1.56)

### Development Tools

**Debugger** (optional):
- First-party interactive debugger
- Install: `npm run install:debugger`
- Access: `http://localhost:3000/debugger/?token=...`

**DevTools Protocol**:
- Chrome DevTools frontend
- Install: `npm run build:devtools`

## File References

### Key Documentation
- [README.md](README.md) - Main project documentation
- [README-PJE.md](README-PJE.md) - PJE automation quick start
- [server/scripts/pje-trt/README.md](server/scripts/pje-trt/README.md) - TRT automation overview
- [server/scripts/pje-trt/trt3/README.md](server/scripts/pje-trt/trt3/README.md) - TRT3-specific scraping flows
- [docs/pje/APIs.md](docs/pje/APIs.md) - PJE API reference
- [docs/pje/ANTI-BOT-DETECTION.md](docs/pje/ANTI-BOT-DETECTION.md) - Anti-detection techniques
- [docs/pje/ESTRUTURA.md](docs/pje/ESTRUTURA.md) - Module structure map
- [ESTRUTURA-ORGANIZADA.md](ESTRUTURA-ORGANIZADA.md) - Project reorganization history

### Configuration Files
- [package.json](package.json) - Dependencies, scripts, and Playwright version matrix
- [tsconfig.json](tsconfig.json) - Next.js app compiler settings and path aliases
- [server/tsconfig.json](server/tsconfig.json) - Browserless service build config (tsc -> server/build)
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema for tribunals, credentials, and scrape history
- [.env.example](.env.example) - Environment variable template (PJE credentials, database URL)
- [next.config.mjs](next.config.mjs) - Next.js runtime configuration
- [tailwind.config.ts](tailwind.config.ts) - Tailwind and design system configuration

### Key Scripts
- [server/scripts/pje-trt/common/login.js](server/scripts/pje-trt/common/login.js) - Validated TRT Single Sign-On automation
- [server/scripts/pje-trt/common/capturar-api.js](server/scripts/pje-trt/common/capturar-api.js) - API discovery and session capture tool
- [server/scripts/pje-trt/trt3/1g/acervo/raspar-acervo-geral.js](server/scripts/pje-trt/trt3/1g/acervo/raspar-acervo-geral.js) - Acervo Geral scraper
- [server/scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-no-prazo-dada-ciencia.js](server/scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-no-prazo-dada-ciencia.js) - Pendentes com prazo scraper
- [app/actions/pje.ts](app/actions/pje.ts) - Next.js server actions bridging UI and automation
- [scripts/test-all-trts-scraping.ts](scripts/test-all-trts-scraping.ts) - Multi-tribunal scraping smoke test
