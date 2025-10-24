# Deploy Local do Browserless

Guia completo para configurar e executar o Browserless localmente em sua máquina.

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Opção 1: Deploy com Docker (Recomendado)](#opção-1-deploy-com-docker-recomendado)
- [Opção 2: Deploy em Desenvolvimento Local](#opção-2-deploy-em-desenvolvimento-local)
- [Configuração](#configuração)
- [Scripts de Gerenciamento](#scripts-de-gerenciamento)
- [Testando a Instalação](#testando-a-instalação)
- [Troubleshooting](#troubleshooting)

## Pré-requisitos

### Para Deploy com Docker
- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado
- Porta 3000 disponível (ou outra porta de sua escolha)

### Para Deploy em Desenvolvimento Local
- **Node.js**: Versão 24.x (exatamente - veja `.nvmrc`)
- **Git**: Para clonar o repositório
- **npm**: Incluído com Node.js
- **Sistema Operacional**: Windows, macOS ou Linux
- **Memória RAM**: Mínimo 4GB recomendado
- **Espaço em disco**: ~2GB para navegadores + dependências

## Opção 1: Deploy com Docker (Recomendado)

Esta é a opção mais simples e rápida para começar.

### 1.1. Chromium (Padrão)

```bash
docker run -p 3000:3000 ghcr.io/browserless/chromium
```

### 1.2. Firefox

```bash
docker run -p 3000:3000 ghcr.io/browserless/firefox
```

### 1.3. WebKit

```bash
docker run -p 3000:3000 ghcr.io/browserless/webkit
```

### 1.4. Microsoft Edge

```bash
docker run -p 3000:3000 ghcr.io/browserless/edge
```

### 1.5. Multi-Browser (Todos os navegadores)

```bash
docker run -p 3000:3000 ghcr.io/browserless/multi
```

### 1.6. Com Variáveis de Ambiente

```bash
docker run -p 3000:3000 \
  -e "TOKEN=seu_token_aqui" \
  -e "MAX_CONCURRENT_SESSIONS=10" \
  -e "DEBUG=browserless*" \
  ghcr.io/browserless/chromium
```

### 1.7. Com Volume Persistente

```bash
docker run -p 3000:3000 \
  -v $(pwd)/downloads:/app/downloads \
  ghcr.io/browserless/chromium
```

### 1.8. Executar em Background (Daemon)

```bash
docker run -d \
  --name browserless \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/browserless/chromium
```

Comandos úteis para gerenciar o container:
```bash
# Ver logs
docker logs -f browserless

# Parar container
docker stop browserless

# Iniciar container
docker start browserless

# Remover container
docker rm -f browserless
```

## Opção 2: Deploy em Desenvolvimento Local

Para desenvolvimento ou quando você precisa modificar o código-fonte.

### 2.1. Instalar Node.js Correto

Verifique a versão requerida:
```bash
cat .nvmrc
```

#### Usando NVM (Recomendado)

**Linux/macOS:**
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Usar a versão correta do Node.js
nvm install
nvm use
```

**Windows:**
```powershell
# Baixe e instale nvm-windows de: https://github.com/coreybutler/nvm-windows/releases
# Depois execute:
nvm install 24
nvm use 24
```

### 2.2. Instalar Dependências

```bash
npm install
```

### 2.3. Instalar Navegadores

Este passo baixa os binários dos navegadores (Chromium, Firefox, WebKit, Edge):

```bash
npm run install:browsers
```

> **Nota**: Este processo pode demorar alguns minutos e requer ~1-2GB de espaço em disco.

### 2.4. Build do Projeto

#### Build Simples (Produção)
```bash
npm run build
```

#### Build Completo (Desenvolvimento)
```bash
npm run build:dev
```

O build de desenvolvimento inclui:
- Compilação do TypeScript
- Instalação de ad-blocking
- Schemas e DevTools
- Documentação OpenAPI
- Funções customizadas
- Debugger interativo

### 2.5. Executar a Aplicação

#### Modo Desenvolvimento (com hot reload)
```bash
npm run dev
```

#### Modo Produção
```bash
npm start
```

A aplicação estará disponível em:
- **Documentação**: http://localhost:3000/docs
- **Debugger**: http://localhost:3000/debugger/?token=6R0W53R135510
- **API WebSocket**: ws://localhost:3000

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.dev`:

```bash
cp .env.dev .env
```

Edite o arquivo `.env` conforme necessário:

```bash
# Nível de debug
DEBUG=browserless*,-**:verbose

# Token de autenticação (IMPORTANTE: mude em produção!)
TOKEN=seu_token_seguro_aqui

# Porta do servidor (padrão: 3000)
PORT=3000

# Máximo de sessões concorrentes
MAX_CONCURRENT_SESSIONS=10

# Timeout de sessão em milissegundos (padrão: 30000)
CONNECTION_TIMEOUT=30000

# Habilitar modo headless (padrão: true)
HEADLESS=true

# Diretório de downloads
DOWNLOAD_DIR=/tmp/browserless-downloads
```

### Configurações Importantes

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `TOKEN` | Token para autenticação da API | `6R0W53R135510` |
| `PORT` | Porta do servidor | `3000` |
| `MAX_CONCURRENT_SESSIONS` | Sessões simultâneas permitidas | `10` |
| `CONNECTION_TIMEOUT` | Timeout de conexão (ms) | `30000` |
| `HEADLESS` | Modo headless (true/false) | `true` |
| `DEBUG` | Nível de logging | `browserless*` |

## Scripts de Gerenciamento

### Scripts NPM Disponíveis

```bash
# Build e compilação
npm run build              # Build completo para produção
npm run build:dev          # Build com ferramentas de desenvolvimento
npm run clean              # Limpar arquivos de build

# Desenvolvimento
npm run dev                # Executar em modo desenvolvimento
npm start                  # Executar em modo produção

# Instalação
npm run install:browsers   # Instalar navegadores (Chromium, Firefox, WebKit, Edge)
npm run install:debugger   # Instalar debugger interativo
npm run install:dev        # Instalar browsers + debugger

# Testes e qualidade
npm test                   # Executar testes
npm run coverage           # Gerar relatório de cobertura
npm run lint               # Verificar e corrigir problemas de linting
npm run prettier           # Formatar código

# Build específico
npm run build:ts           # Apenas compilar TypeScript
npm run build:schemas      # Apenas build de schemas
npm run build:devtools     # Apenas build de devtools
npm run build:openapi      # Apenas build da documentação OpenAPI
```

### Scripts Customizados (Para criar)

Os scripts abaixo serão criados para facilitar o gerenciamento:

**Linux/macOS: `scripts/start.sh`**
```bash
#!/bin/bash
npm start
```

**Linux/macOS: `scripts/stop.sh`**
```bash
#!/bin/bash
pkill -f "node build"
```

**Windows: `scripts/start.bat`**
```batch
@echo off
npm start
```

## Testando a Instalação

### 1. Verificar se está rodando

Abra seu navegador e acesse:
- http://localhost:3000/docs

Você deve ver a documentação OpenAPI do Browserless.

### 2. Testar com Puppeteer

Crie um arquivo `test-puppeteer.js`:

```javascript
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://localhost:3000?token=6R0W53R135510',
  });

  const page = await browser.newPage();
  await page.goto('https://example.com');

  console.log('Título da página:', await page.title());

  await browser.close();
  console.log('Teste concluído com sucesso!');
})();
```

Execute:
```bash
node test-puppeteer.js
```

### 3. Testar com Playwright

Crie um arquivo `test-playwright.js`:

```javascript
const playwright = require('playwright-core');

(async () => {
  const browser = await playwright.chromium.connect(
    'ws://localhost:3000/chromium/playwright?token=6R0W53R135510'
  );

  const page = await browser.newPage();
  await page.goto('https://example.com');

  console.log('Título da página:', await page.title());

  await browser.close();
  console.log('Teste concluído com sucesso!');
})();
```

Execute:
```bash
node test-playwright.js
```

### 4. Testar API REST

```bash
# Gerar PDF
curl -X POST http://localhost:3000/pdf?token=6R0W53R135510 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output example.pdf

# Capturar screenshot
curl -X POST http://localhost:3000/screenshot?token=6R0W53R135510 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output screenshot.png

# Obter HTML
curl -X POST http://localhost:3000/content?token=6R0W53R135510 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Troubleshooting

### Erro: "Node version not supported"

Solução: Instale o Node.js versão 24.x
```bash
nvm install 24
nvm use 24
```

### Erro: "Port 3000 already in use"

Solução 1: Pare o processo usando a porta
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Solução 2: Use outra porta
```bash
PORT=3001 npm start
```

### Erro: "Cannot find browsers"

Solução: Reinstale os navegadores
```bash
npm run install:browsers
```

### Erro de memória ou timeout

Solução: Aumente os recursos no `.env`
```bash
MAX_CONCURRENT_SESSIONS=5
CONNECTION_TIMEOUT=60000
```

### Navegador não inicia em modo headless

Solução: Desabilite headless temporariamente
```bash
HEADLESS=false npm start
```

### Problemas com fontes ou caracteres especiais

Docker já inclui fontes. Para desenvolvimento local:

**Ubuntu/Debian:**
```bash
sudo apt-get install fonts-liberation fonts-noto-color-emoji
```

**macOS:**
```bash
brew install --cask font-noto-emoji
```

### Debugger não aparece

Certifique-se de ter executado:
```bash
npm run install:debugger
```

### Performance lenta

1. Reduza sessões concorrentes no `.env`
2. Aumente a RAM disponível
3. Use Docker em vez de desenvolvimento local
4. Verifique se há processos Chrome órfãos:
   ```bash
   # Linux/macOS
   pkill -f chrome

   # Windows
   taskkill /F /IM chrome.exe
   ```

## Recursos Adicionais

- [Documentação Oficial](https://docs.browserless.io/)
- [Exemplos de Código](https://github.com/browserless/browserless/tree/main/examples)
- [API Reference](http://localhost:3000/docs) (quando rodando)
- [Issues no GitHub](https://github.com/browserless/browserless/issues)
- [Docker Hub](https://hub.docker.com/r/browserless/chrome)

## Licença

Este projeto usa licença SSPL-1.0 para uso open source e licença comercial para uso comercial/proprietário.

- **Uso gratuito**: Projetos open source compatíveis com SSPL-1.0
- **Uso comercial**: Requer [licença comercial](https://www.browserless.io/contact)

---

**Dica**: Para produção, sempre use Docker e configure variáveis de ambiente seguras!
