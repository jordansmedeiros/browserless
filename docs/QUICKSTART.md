# Browserless - Guia Rápido de Início

Guia rápido para começar a usar o Browserless em minutos.

## Início Rápido com Docker (Mais Rápido) ⭐

### Método Recomendado (Evita Timeout)

**Linux/macOS:**
```bash
# 1. Pull manual da imagem (evita timeout no compose)
docker pull ghcr.io/browserless/chromium:latest

# 2. Iniciar com Docker Compose
docker compose up -d

# 3. Validar instalação
./validate-docker.sh
```

**Windows:**
```batch
REM 1. Pull manual da imagem (evita timeout no compose)
docker pull ghcr.io/browserless/chromium:latest

REM 2. Iniciar com Docker Compose
docker compose up -d

REM 3. Validar instalação
validate-docker.bat
```

### Método Automatizado com Scripts

**Linux/macOS:**
```bash
# Diagnóstico + Fix automático
./docker-fix.sh

# OU script interativo
./docker-start.sh
```

**Windows:**
```batch
REM Diagnóstico + Fix automático
docker-fix.bat

REM OU script interativo
docker-start.bat
```

### Método Simples (Comando Direto)

```bash
docker run -p 3000:3000 ghcr.io/browserless/chromium
```

**Pronto!** Acesse: http://localhost:3000/docs

## Início Rápido - Desenvolvimento Local

### Linux/macOS

```bash
# 1. Executar script de setup
./setup-browserless.sh

# 2. Iniciar aplicação
npm run dev
```

### Windows

```batch
REM 1. Executar script de setup
setup-browserless.bat

REM 2. Iniciar aplicação
npm run dev
```

## Pré-requisitos

### Para Docker
- Docker Desktop instalado e rodando
- Porta 3000 disponível

### Para Desenvolvimento Local
- Node.js v24.x
- npm (incluído com Node.js)
- ~2GB de espaço em disco

## Instalação Manual Passo a Passo

Se preferir instalar manualmente:

```bash
# 1. Instalar Node.js 24 (via NVM recomendado)
nvm install 24
nvm use 24

# 2. Instalar dependências
npm install

# 3. Instalar navegadores
npm run install:browsers

# 4. Build do projeto
npm run build:dev

# 5. Configurar ambiente
cp .env.dev .env

# 6. Iniciar
npm start
```

## Primeiros Testes

### Teste 1: Acessar Documentação

Abra seu navegador em:
- http://localhost:3000/docs

### Teste 2: Puppeteer

```javascript
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://localhost:3000?token=6R0W53R135510',
  });

  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log(await page.title());
  await browser.close();
})();
```

### Teste 3: Playwright

```javascript
const playwright = require('playwright-core');

(async () => {
  const browser = await playwright.chromium.connect(
    'ws://localhost:3000/chromium/playwright?token=6R0W53R135510'
  );

  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log(await page.title());
  await browser.close();
})();
```

### Teste 4: API REST (PDF)

```bash
curl -X POST http://localhost:3000/pdf?token=6R0W53R135510 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output example.pdf
```

## Arquivos Importantes

### Documentação

| Arquivo | Descrição |
|---------|-----------|
| `DEPLOY-LOCAL.md` | Documentação completa de deploy |
| `README-DEPLOY.md` | Guia de deploy e configuração |
| `QUICKSTART.md` | Este arquivo - Guia rápido |

### Scripts de Deploy

| Arquivo | Descrição |
|---------|-----------|
| `setup-browserless.bat` | Script de setup para Windows |
| `setup-browserless.sh` | Script de setup para Linux/Mac |
| `docker-start.bat` | Script Docker interativo (Windows) |
| `docker-start.sh` | Script Docker interativo (Linux/Mac) |

### Scripts de Diagnóstico e Manutenção

| Arquivo | Descrição |
|---------|-----------|
| `diagnose-docker.bat` | Diagnóstico completo do Docker (Windows) |
| `docker-fix.bat` | Fix automático de problemas (Windows) |
| `validate-docker.bat` | Valida Browserless rodando (Windows) |
| `validate-installation.bat` | Valida pré-requisitos (Windows) |

### Configuração

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Configuração Docker Compose |
| `.env.example` | Exemplo de configuração de ambiente |
| `.env.dev` | Configuração padrão de desenvolvimento |

## Scripts Úteis

### NPM Scripts

```bash
npm start              # Iniciar em produção
npm run dev            # Iniciar em desenvolvimento
npm run build          # Build para produção
npm run build:dev      # Build com debugger
npm test               # Executar testes
npm run install:browsers  # Reinstalar navegadores
```

### Docker

```bash
# Docker Compose
docker-compose up -d      # Iniciar
docker-compose down       # Parar
docker-compose logs -f    # Ver logs
docker-compose restart    # Reiniciar

# Docker direto
docker run -p 3000:3000 ghcr.io/browserless/chromium
docker stop browserless
docker start browserless
docker logs -f browserless
```

## URLs Importantes

Quando rodando localmente em http://localhost:3000:

| URL | Descrição |
|-----|-----------|
| `/docs` | Documentação OpenAPI interativa |
| `/debugger/?token=6R0W53R135510` | Debugger visual interativo |
| `/health` | Health check endpoint |
| WebSocket: `ws://localhost:3000` | Endpoint para Puppeteer/Playwright |

## Configuração Básica

Edite o arquivo `.env`:

```bash
# Token de autenticação (MUDE EM PRODUÇÃO!)
TOKEN=seu_token_super_seguro

# Porta
PORT=3000

# Sessões concorrentes
MAX_CONCURRENT_SESSIONS=10

# Modo headless
HEADLESS=true

# Debug
DEBUG=browserless*,-**:verbose
```

## Troubleshooting Rápido

### ❌ Docker pull está muito lento ou travou

**Sintoma:**
```
[+] Running 0/9
 - chromium Pulling    84.0s
   - 5851b96e7e03 Pulling fs layer...
```

**Solução Rápida:**
```bash
# Cancelar (Ctrl+C) e fazer pull manual
docker pull ghcr.io/browserless/chromium:latest

# Depois executar compose
docker compose up -d
```

**Solução Automatizada (Windows):**
```batch
docker-fix.bat
```

### ❌ Aviso "version is obsolete"

**Sintoma:**
```
warning: the attribute `version` is obsolete
```

**Solução:** Já corrigido no [docker-compose.yml](docker-compose.yml)! Se ainda aparecer, baixe a versão atualizada.

### ❌ Erro: "Port 3000 already in use"

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# OU use outra porta
docker run -p 3001:3000 ghcr.io/browserless/chromium
```

### ❌ Erro: "Node version not supported"

```bash
# Use Node.js 24
nvm install 24
nvm use 24
```

### ❌ Docker não inicia

```bash
# Verificar se Docker está rodando
docker ps

# Ver logs do container
docker logs browserless-chromium

# Diagnóstico completo (Windows)
diagnose-docker.bat
```

### ❌ Container inicia mas não responde

```bash
# Ver logs
docker logs -f browserless-chromium

# Reiniciar
docker compose restart

# Validar (Windows)
validate-docker.bat
```

### 🛠️ Scripts de Diagnóstico (Windows)

| Script | Descrição |
|--------|-----------|
| `diagnose-docker.bat` | Diagnóstico completo do ambiente |
| `docker-fix.bat` | Fix automático de problemas comuns |
| `validate-docker.bat` | Valida instalação funcionando |
| `validate-installation.bat` | Valida pré-requisitos |

**Uso:**
```batch
REM Diagnosticar problemas
diagnose-docker.bat

REM Resolver automaticamente
docker-fix.bat

REM Validar que está funcionando
validate-docker.bat
```

## Próximos Passos

1. ✅ Leia a documentação completa em `DEPLOY-LOCAL.md`
2. ✅ Configure variáveis de ambiente no `.env`
3. ✅ Teste diferentes navegadores (Chromium, Firefox, WebKit)
4. ✅ Explore a documentação OpenAPI em `/docs`
5. ✅ Use o debugger em `/debugger`
6. ✅ Implemente seu primeiro script

## Recursos

- [Documentação Oficial](https://docs.browserless.io/)
- [GitHub](https://github.com/browserless/browserless)
- [Docker Hub](https://hub.docker.com/r/browserless/chrome)
- [Exemplos](https://github.com/browserless/browserless/tree/main/examples)

## Suporte

- Issues: https://github.com/browserless/browserless/issues
- Documentação: https://docs.browserless.io/
- Comunidade: https://github.com/browserless/browserless/discussions

---

**Dica**: Use Docker para produção e desenvolvimento local apenas quando precisar modificar o código!
