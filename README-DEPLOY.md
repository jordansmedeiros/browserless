# Browserless - Recursos de Deploy Local

Este repositório foi configurado com scripts e documentação completa para facilitar o deploy local do Browserless.

## ⚡ Problema com Docker Compose? Solução Rápida!

Se `docker compose up -d` está travando no pull da imagem:

**Windows:**
```batch
REM Solução automática
docker-fix.bat

REM OU manual
docker pull ghcr.io/browserless/chromium:latest
docker compose up -d
```

**Linux/macOS:**
```bash
# Solução automática
./docker-fix.sh

# OU manual
docker pull ghcr.io/browserless/chromium:latest
docker compose up -d
```

📖 **[Ver troubleshooting completo](#-troubleshooting-docker-compose)**

---

## 📚 Documentação Criada

### Guias Principais

| Arquivo | Descrição | Para quem? |
|---------|-----------|------------|
| **[QUICKSTART.md](QUICKSTART.md)** | Guia rápido de 5 minutos | Iniciantes que querem começar rápido |
| **[DEPLOY-LOCAL.md](DEPLOY-LOCAL.md)** | Documentação completa de deploy | Todos - leitura essencial |
| **[.env.example](.env.example)** | Todas as variáveis de ambiente | Configuração avançada |

### Scripts de Instalação

| Script | Plataforma | Uso |
|--------|-----------|-----|
| **[setup-browserless.sh](setup-browserless.sh)** | Linux/macOS | Setup automático completo |
| **[setup-browserless.bat](setup-browserless.bat)** | Windows | Setup automático completo |

### Scripts Docker

| Script | Plataforma | Uso |
|--------|-----------|-----|
| **[docker-start.sh](docker-start.sh)** | Linux/macOS | Iniciar com Docker (interativo) |
| **[docker-start.bat](docker-start.bat)** | Windows | Iniciar com Docker (interativo) |
| **[docker-compose.yml](docker-compose.yml)** | Todas | Configuração Docker Compose |

### Scripts de Diagnóstico e Fix (Novo!) 🆕

| Script | Plataforma | Uso |
|--------|-----------|-----|
| **[diagnose-docker.bat](diagnose-docker.bat)** | Windows | Diagnóstico completo do Docker |
| **[docker-fix.bat](docker-fix.bat)** | Windows | Fix automático de problemas |
| **[validate-docker.bat](validate-docker.bat)** | Windows | Valida Browserless rodando |
| **[validate-installation.bat](validate-installation.bat)** | Windows | Valida pré-requisitos |

## 🚀 Início Rápido

### Opção 1: Docker (Recomendado - Mais Fácil)

#### Windows
```batch
docker-start.bat
```

#### Linux/macOS
```bash
./docker-start.sh
```

#### Docker Compose
```bash
docker-compose up -d
```

### Opção 2: Desenvolvimento Local

#### Windows
```batch
setup-browserless.bat
```

#### Linux/macOS
```bash
./setup-browserless.sh
```

## 📋 O que foi configurado?

### ✅ Documentação
- [x] Guia rápido (QUICKSTART.md)
- [x] Documentação completa (DEPLOY-LOCAL.md)
- [x] Referência de variáveis de ambiente (.env.example)
- [x] Este README de deploy

### ✅ Scripts de Setup
- [x] Script automatizado para Linux/macOS
- [x] Script automatizado para Windows
- [x] Verificação de pré-requisitos
- [x] Instalação de dependências
- [x] Instalação de navegadores
- [x] Build do projeto

### ✅ Scripts Docker
- [x] Script interativo para Linux/macOS
- [x] Script interativo para Windows
- [x] Docker Compose configurado
- [x] Suporte a múltiplos navegadores

### ✅ Configurações
- [x] Arquivo .env.example com todas as variáveis
- [x] Scripts auxiliares (start, stop, restart)
- [x] Health checks
- [x] Limites de recursos

## 🎯 Fluxo Recomendado

```
1. Ler QUICKSTART.md (5 min)
   ↓
2. Escolher método de deploy:
   ↓
   ├─→ Docker? Execute docker-start.sh/bat
   │   └─→ Acesse http://localhost:3000/docs
   │
   └─→ Local? Execute setup-browserless.sh/bat
       └─→ Execute: npm run dev
           └─→ Acesse http://localhost:3000/docs
                ↓
3. Ler DEPLOY-LOCAL.md para detalhes
   ↓
4. Configurar .env conforme necessário
   ↓
5. Testar com exemplos no QUICKSTART.md
```

## 🛠️ Estrutura de Arquivos Criados

```
browserless/
├── 📄 README-DEPLOY.md          # Este arquivo
├── 📄 QUICKSTART.md              # Guia rápido de início
├── 📄 DEPLOY-LOCAL.md            # Documentação completa
├── 📄 .env.example               # Variáveis de ambiente
│
├── 🔧 setup-browserless.sh       # Setup Linux/macOS
├── 🔧 setup-browserless.bat      # Setup Windows
├── 🔧 docker-start.sh            # Docker Linux/macOS
├── 🔧 docker-start.bat           # Docker Windows
├── 🔧 docker-compose.yml         # Docker Compose
│
├── 📁 scripts/                   # Scripts auxiliares
│   ├── start.sh / start.bat
│   ├── stop.sh / stop.bat
│   └── restart.sh / restart.bat
│
├── 📁 downloads/                 # Diretório de downloads
└── 📁 logs/                      # Diretório de logs
```

## 🎮 Comandos Principais

### Setup Inicial

```bash
# Linux/macOS
./setup-browserless.sh

# Windows
setup-browserless.bat
```

### Executar com Docker

```bash
# Interativo
./docker-start.sh          # Linux/macOS
docker-start.bat           # Windows

# Docker Compose
docker-compose up -d       # Background
docker-compose up          # Foreground com logs
docker-compose down        # Parar e remover
```

### Executar Local

```bash
npm run dev                # Desenvolvimento
npm start                  # Produção
npm run build:dev          # Build com debugger
npm run install:browsers   # Reinstalar navegadores
```

### Gerenciamento

```bash
# Linux/macOS
./scripts/start.sh
./scripts/stop.sh
./scripts/restart.sh

# Windows
scripts\start.bat
scripts\stop.bat
scripts\restart.bat
```

## 🌐 URLs Importantes

Após iniciar (porta padrão 3000):

| URL | Descrição |
|-----|-----------|
| http://localhost:3000/docs | Documentação OpenAPI |
| http://localhost:3000/debugger/?token=6R0W53R135510 | Debugger interativo |
| ws://localhost:3000 | Endpoint WebSocket |
| http://localhost:3000/health | Health check |

## 🔑 Configuração Padrão

Token de autenticação padrão: `6R0W53R135510`

⚠️ **IMPORTANTE**: Mude o token em `.env` antes de usar em produção!

## 📦 Navegadores Suportados

| Navegador | Imagem Docker | Porta Padrão |
|-----------|---------------|--------------|
| Chromium | `ghcr.io/browserless/chromium` | 3000 |
| Firefox | `ghcr.io/browserless/firefox` | 3001 |
| WebKit | `ghcr.io/browserless/webkit` | 3002 |
| Edge | `ghcr.io/browserless/edge` | 3003 |
| Multi | `ghcr.io/browserless/multi` | 3000 |

## 🧪 Testar Instalação

### 1. Verificar se está rodando
```bash
curl http://localhost:3000/health
```

### 2. Acessar documentação
Abra: http://localhost:3000/docs

### 3. Teste com Puppeteer
Veja exemplos em [QUICKSTART.md](QUICKSTART.md)

### 4. Teste REST API
```bash
curl -X POST http://localhost:3000/pdf?token=6R0W53R135510 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  --output test.pdf
```

## 🐛 Troubleshooting Docker Compose

### ❌ Problema: Pull está muito lento ou travado

**Sintoma:**
```
[+] Running 0/9
 - chromium Pulling    84.0s
   - 5851b96e7e03 Pulling fs layer...
```

**Causas:**
- Conexão lenta com ghcr.io
- Imagem grande (~1-2GB)
- Timeout de rede
- Firewall/proxy

**Soluções:**

#### 1. Script Automatizado (Recomendado) ⭐

**Windows:**
```batch
docker-fix.bat
```

Este script:
- ✅ Faz pull com retry automático
- ✅ Remove containers antigos
- ✅ Reinicia o serviço
- ✅ Valida instalação

#### 2. Pull Manual

```bash
# 1. Fazer pull separadamente
docker pull ghcr.io/browserless/chromium:latest

# 2. Depois executar compose
docker compose up -d

# 3. Validar (Windows)
validate-docker.bat
```

#### 3. Diagnóstico

```batch
# Windows: Ver o que está errado
diagnose-docker.bat
```

### ❌ Aviso "version is obsolete"

**Solução:** ✅ Já corrigido em [docker-compose.yml](docker-compose.yml)!

### Outros Problemas Frequentes

1. **Porta 3000 em uso**: Mude a porta no `.env` ou docker-compose
2. **Node.js errado**: Use Node.js v24.x via NVM
3. **Docker não inicia**: Verifique se Docker Desktop está rodando
4. **Navegadores não encontrados**: Execute `npm run install:browsers`

**Documentação completa:** [DEPLOY-LOCAL.md](DEPLOY-LOCAL.md#troubleshooting) | [QUICKSTART.md](QUICKSTART.md#troubleshooting-rápido)

## 📖 Próximos Passos

1. ✅ Comece pelo [QUICKSTART.md](QUICKSTART.md)
2. ✅ Leia a [documentação completa](DEPLOY-LOCAL.md)
3. ✅ Configure seu [.env](.env.example)
4. ✅ Teste os exemplos
5. ✅ Explore a [documentação oficial](https://docs.browserless.io/)

## 🔗 Links Úteis

- [Documentação Oficial](https://docs.browserless.io/)
- [Repositório GitHub](https://github.com/browserless/browserless)
- [Docker Images](https://github.com/browserless/browserless/pkgs/container/base)
- [Issues](https://github.com/browserless/browserless/issues)
- [Discussões](https://github.com/browserless/browserless/discussions)

## 📝 Licença

Este projeto usa licença SSPL-1.0 para uso open source.

- ✅ Uso gratuito para projetos open source
- 💼 [Licença comercial](https://www.browserless.io/contact) necessária para uso proprietário

## 🤝 Contribuindo

Para contribuir com o projeto original:
https://github.com/browserless/browserless

---

**Desenvolvido para facilitar o deploy local do Browserless** 🚀

Última atualização: 2025-10-23
