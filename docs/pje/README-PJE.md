# 🏛️ Automação PJE - Processo Judicial Eletrônico

Sistema de automação de login no PJE com anti-detecção de bot.

## ✅ Status: FUNCIONANDO

Login testado e validado em **24/10/2025**:
- ✅ CloudFront não detecta como bot
- ✅ Login bem-sucedido
- ✅ Acesso ao painel do usuário

---

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

### 2. Executar

```bash
node scripts/pje/login.js
```

Veja a [documentação completa](scripts/pje/README.md) para mais detalhes.

---

## 📁 Estrutura do Projeto

```
browserless/
├── scripts/pje/              # ✅ Scripts principais (USE ESTES)
│   ├── login.js             # Script de login (VALIDADO)
│   ├── test-detection.js    # Teste de anti-detecção
│   └── README.md            # Documentação completa
│
├── docs/pje/                # Documentação técnica
│   └── ANTI-BOT-DETECTION.md
│
├── screenshots/             # Evidências
│   └── pje-login-success.png
│
└── README-PJE.md           # Este arquivo
```

---

## 🎯 Funcionalidades

### ✅ O que está implementado:

1. **Login Automatizado Completo**
   - Clica no botão "Entrar com PDPJ"
   - Preenche CPF e senha automaticamente
   - Acessa o painel do usuário

2. **Anti-Detecção de Bot**
   - Puppeteer-Extra Stealth Plugin
   - Digitação caractere por caractere (humana)
   - Movimento gradual do mouse
   - Headers realistas do Chrome 131
   - Navigator.webdriver oculto

3. **State OAuth Dinâmico**
   - Não usa state hardcoded
   - Token gerado automaticamente
   - Sem erro HTTP 400

4. **Navegador Visível**
   - Abre Chromium com interface
   - Você vê cada ação em tempo real
   - Fica aberto para inspeção

---

## 📊 Resultado do Teste

**URL de login**: `https://pje.trt3.jus.br/primeirograu/login.seam`

**Fluxo executado**:
```
1. ✅ Página PJE carregada
2. ✅ Botão "Entrar com PDPJ" clicado
3. ✅ Redirecionado para SSO (state dinâmico)
4. ✅ CPF preenchido (digitação humana)
5. ✅ Senha preenchida (digitação humana)
6. ✅ Botão Entrar clicado
7. ✅ Login bem-sucedido
8. ✅ Painel do usuário carregado
```

**URL final**: `https://pje.trt3.jus.br/pjekz/painel/usuario-externo`

**Screenshot**: [pje-login-success.png](screenshots/pje-login-success.png)

---

## 📚 Documentação

- **[scripts/pje/README.md](scripts/pje/README.md)** - Documentação completa e detalhada
- **[docs/pje/ANTI-BOT-DETECTION.md](docs/pje/ANTI-BOT-DETECTION.md)** - Técnicas de anti-detecção

---

## 🆘 Suporte

### Problemas Comuns

**Erro 403 (CloudFront)**
- Aguarde 5-10 minutos entre tentativas
- Execute primeiro: `node scripts/pje/test-detection.js`

**Módulo não encontrado**
```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

**Navegador não abre**
```bash
npm install puppeteer
```

### Mais ajuda

Veja a [documentação completa](scripts/pje/README.md) para mais soluções.

---

## 🔐 Segurança

⚠️ **Importante**:
- Nunca commite credenciais no Git
- Use variáveis de ambiente em produção
- Adicione `.env` no `.gitignore`
- Use apenas para fins autorizados

---

## 📝 Changelog

### v1.0.0 - 24/10/2025
- ✅ Login funcionando com sucesso
- ✅ Anti-detecção completo
- ✅ Estrutura de projeto organizada
- ✅ Documentação completa

---

**Última atualização**: 24 de Outubro de 2025
**Compatível com**: PJE TRT3
