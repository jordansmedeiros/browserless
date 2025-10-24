# Project Context

## Purpose

This is a **fork of Browserless** - a headless browser platform - with custom extensions for **PJE (Processo Judicial Eletrônico)** automation. The project serves two main purposes:

1. **Core Browserless Platform**: Deploy and manage headless browsers (Chromium, Firefox, WebKit, Edge) in Docker for remote browser automation
2. **PJE Legal Automation**: Automated login, data scraping, and process management for Brazil's electronic legal process system (PJE TRT3)

### Key Goals
- Provide a reliable, production-ready headless browser service
- Support both Puppeteer and Playwright libraries
- Implement sophisticated anti-bot detection mechanisms for PJE access
- Enable automated scraping of legal process data from PJE courts
- Maintain compatibility with upstream Browserless while adding custom legal automation features

## Tech Stack

### Core Technologies
- **TypeScript** (ES2022) - Primary language with strict mode enabled
- **Node.js** v24 - Runtime environment (exactly v24, not v25)
- **Puppeteer** v24.26.1 - Chrome automation (with puppeteer-extra for stealth)
- **Playwright** v1.56.1 (+ versioned: 1.51-1.54) - Multi-browser automation
- **Docker** - Deployment and containerization

### Web Automation & Anti-Detection
- `puppeteer-extra` - Plugin system for Puppeteer
- `puppeteer-extra-plugin-stealth` - Anti-bot detection bypass
- `lighthouse` - Performance metrics and auditing

### Backend & APIs
- `http-proxy` - Proxying browser connections
- `joi` - Request validation
- `debug` - Logging and debugging
- `get-port` - Dynamic port allocation
- `queue` - Request queueing and parallelism

### Build & Development
- **TypeScript Compiler** - Build system
- **esbuild** - Fast bundler for function builds
- **ESLint** + TypeScript plugin - Linting with sorted imports
- **Prettier** - Code formatting (semi, trailing commas, single quotes, 80 width)
- **Mocha** - Testing framework with 45s timeout
- **c8** - Code coverage
- **ts-node** - Development execution

### Utilities
- `typescript-json-schema` - JSON schema generation from types
- `systeminformation` - System metrics
- `tar-fs` - Archive handling
- `file-type` - File type detection

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
- Files: kebab-case (e.g., `login-pje.js`, `raspar-processos.js`)
- Functions/variables: camelCase
- Types/Interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE for config values

**TypeScript Configuration**:
- Target: ES2022
- Module: ES2022 (ESM modules throughout)
- Strict mode enabled
- Declaration files generated
- No implicit returns
- No unused locals or parameters

### Architecture Patterns

**Core Architecture**:
- Browser service listens for WebSocket connections and REST API requests
- Each connection spawns a browser instance
- Connection proxied into Chrome/Firefox/WebKit
- Browsers closed after session completion
- Queue management for parallelism control

**PJE Extensions** (located in `scripts/pje/`):
- Login automation with anti-detection measures
- API discovery and documentation (`docs/pje/APIs.md`)
- Data scrapers organized in `scripts/pje/raspadores/`
- Results saved to `data/pje/` directory

**File Organization**:
```
src/           - Core TypeScript source code
build/         - Compiled JavaScript output
scripts/       - Build and automation scripts
  pje/         - PJE-specific automation scripts
docs/pje/      - PJE technical documentation
data/pje/      - Scraped data output
functions/     - Custom function extensions
external/      - External dependencies
static/        - Static assets
```

**Extension System**:
- NodeJS SDK allows extending routes and functionality
- Custom functions can be added to `functions/` directory
- See `bin/scaffold/README.md` for SDK documentation

### Testing Strategy

**Framework**: Mocha with TypeScript support via ts-node/esm

**Configuration**:
- Test files: `build/**/*.spec.js` (compiled from `.spec.ts`)
- Timeout: 45 seconds per test
- Slow threshold: 5 seconds
- Coverage: c8 with text/html/lcov reporters

**Running Tests**:
```bash
npm test              # Run tests
npm run coverage      # Run with coverage report
npm run build:tests   # Build TypeScript + functions + debugger
```

**Testing Approach**:
- Tests written in TypeScript alongside source files
- Build required before running tests
- Integration tests for browser automation
- Mock external services where appropriate

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

### PJE (Processo Judicial Eletrônico) Automation

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
- [scripts/pje/README.md](scripts/pje/README.md) - Complete PJE documentation
- [scripts/pje/README-RASPAGEM.md](scripts/pje/README-RASPAGEM.md) - Scraping guide
- [docs/pje/APIs.md](docs/pje/APIs.md) - PJE API reference
- [docs/pje/ANTI-BOT-DETECTION.md](docs/pje/ANTI-BOT-DETECTION.md) - Anti-detection techniques
- [ESTRUTURA-ORGANIZADA.md](ESTRUTURA-ORGANIZADA.md) - Project reorganization history

### Configuration Files
- [package.json](package.json) - Dependencies and scripts
- [tsconfig.json](tsconfig.json) - TypeScript configuration
- [.claude/settings.local.json](.claude/settings.local.json) - Claude Code permissions

### Key Scripts
- [scripts/pje/login.js](scripts/pje/login.js) - Validated PJE login automation
- [scripts/pje/capturar-api.js](scripts/pje/capturar-api.js) - API discovery tool
- [scripts/pje/raspar-processos.js](scripts/pje/raspar-processos.js) - Simple scraper
- [scripts/pje/raspar-todos-processos.js](scripts/pje/raspar-todos-processos.js) - Full scraper
