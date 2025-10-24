# 🏛️ Automação de Login PJE (Processo Judicial Eletrônico)

Sistema de automação para login no PJE TRT3 com anti-detecção de bot.

## ✅ Status

**TESTADO E FUNCIONANDO** - 24/10/2025

- ✅ CloudFront não detecta como bot
- ✅ Login bem-sucedido
- ✅ Acesso ao painel do usuário
- ✅ Navegador visível para inspeção

---

## 🚀 Uso Rápido

### 1. Instalar Dependências

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

### 2. Atualizar Credenciais

Edite [login.js](login.js) e atualize:

```javascript
const CPF = '07529294610';     // ← Seu CPF
const SENHA = '12345678A@';    // ← Sua senha
```

### 3. Executar

```bash
node scripts/pje/login.js
```

O navegador Chromium vai abrir automaticamente e você verá:
- ✅ Página PJE carregando
- ✅ Clique no botão "Entrar com PDPJ"
- ✅ Redirecionamento para SSO
- ✅ CPF sendo digitado caractere por caractere
- ✅ Senha sendo digitada caractere por caractere
- ✅ Mouse se movendo até o botão Entrar
- ✅ Login bem-sucedido
- ✅ Painel do usuário carregado

---

## 📁 Estrutura de Arquivos

```
scripts/pje/
├── login.js              # Script principal de login (USE ESTE)
├── test-detection.js     # Testa anti-detecção de bot
└── README.md            # Esta documentação

docs/pje/
└── ANTI-BOT-DETECTION.md  # Guia completo de técnicas anti-detecção

screenshots/
└── pje-login-success.png  # Evidência do login funcionando
```

---

## 🎯 Funcionalidades

### Anti-Detecção de Bot

O script usa múltiplas técnicas para evitar detecção:

1. **Puppeteer-Extra Stealth Plugin**
   - Remove ~25 pontos de detecção automaticamente
   - Oculta `navigator.webdriver`
   - Adiciona `window.chrome`
   - Mocka plugins e permissões

2. **Comportamento Humano**
   - Digitação caractere por caractere (50-150ms por tecla)
   - Movimento gradual do mouse (10 passos)
   - Delays aleatórios entre ações
   - Pausa de 2 segundos antes de interagir

3. **Headers Realistas**
   - User-Agent: Chrome 131
   - Accept-Language: pt-BR
   - Todos os headers Sec-Fetch-*

4. **Navegador Completo**
   - Não-headless (visível)
   - Plugins configurados
   - Languages array completo

### Fluxo Completo

```
1. Acessa página de login do PJE
   └─> https://pje.trt3.jus.br/primeirograu/login.seam

2. Procura botão "Entrar com PDPJ"
   └─> Move mouse até o botão
   └─> Clica com delay humano

3. Redirecionado para SSO
   └─> https://sso.cloud.pje.jus.br/auth/realms/pje/...
   └─> State OAuth gerado dinamicamente (não expira)

4. Preenche CPF
   └─> Digita caractere por caractere
   └─> Delay aleatório entre cada tecla

5. Preenche Senha
   └─> Digita caractere por caractere
   └─> Delay aleatório entre cada tecla

6. Clica em Entrar
   └─> Move mouse gradualmente
   └─> Clica no botão
   └─> Aguarda redirecionamento

7. Sucesso!
   └─> https://pje.trt3.jus.br/pjekz/painel/usuario-externo
   └─> Painel do usuário carregado
```

---

## 🧪 Testar Anti-Detecção

Para verificar se o anti-detecção está funcionando:

```bash
node scripts/pje/test-detection.js
```

Este script:
- Testa contra bot.sannysoft.com
- Verifica todos os pontos de detecção
- Testa acesso ao PJE
- Gera screenshots de evidência

**Resultado esperado**:
```
✅ WebDriver: OCULTO
✅ User-Agent: Normal
✅ Plugins: 5 plugins
✅ Languages: pt-BR, pt, en-US, en
✅ Chrome object: Presente
✅ PJE carregou a página de login normalmente!
```

---

## 📊 Comparação

| Aspecto | Código Comum | Este Script |
|---------|--------------|-------------|
| Clica em "Entrar com PDPJ" | ❌ | ✅ |
| State OAuth dinâmico | ❌ | ✅ |
| Stealth Plugin | ❌ | ✅ |
| Digitação humana | ❌ | ✅ |
| Movimento do mouse | ❌ | ✅ |
| CloudFront bloqueia (403) | ❌ Sim | ✅ Não |
| **Login funciona** | ❌ | ✅ |

---

## 🔧 Configuração Avançada

### Alterar Delays

Edite o arquivo `login.js`:

```javascript
// Delay entre campos
await delay(1000);  // ← Ajuste aqui (ms)

// Delay de digitação
await page.type('#username', char, {
  delay: Math.random() * 100 + 50  // ← Ajuste aqui (50-150ms)
});
```

### Usar Headless (Sem Interface Gráfica)

```javascript
const browser = await puppeteer.launch({
  headless: true,  // ← Mude para true
  // ...
});
```

**Nota**: Headless pode aumentar chance de detecção.

### Adicionar Proxy

```javascript
const browser = await puppeteer.launch({
  args: [
    '--proxy-server=http://proxy.example.com:8080',
    // ...
  ],
});
```

---

## ⚠️ Limitações Conhecidas

### HTTP 400 vs HTTP 403

- **HTTP 403**: CloudFront detectou bot → **Erro de anti-detecção**
- **HTTP 400**: Token OAuth expirou → **Não é problema de detecção**

Este script evita ambos:
- State OAuth gerado dinamicamente (evita 400)
- Stealth Plugin + comportamento humano (evita 403)

### Rate Limiting

Não faça muitas tentativas consecutivas:
- CloudFront pode bloquear temporariamente
- Aguarde 5-10 minutos entre tentativas se necessário

### Captchas

Se o PJE adicionar captcha:
- O script vai parar no captcha
- Você pode resolver manualmente (navegador fica aberto)
- Considere usar serviço de resolução de captcha

---

## 🆘 Solução de Problemas

### Erro: "Cannot find module 'puppeteer-extra'"

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### Navegador não abre

Verifique se o Chromium foi instalado:
```bash
npm install puppeteer
```

### Ainda dá erro 403

1. Aguarde 5-10 minutos entre tentativas
2. Tente de outro IP (VPN)
3. Verifique se as credenciais estão corretas
4. Execute o teste de detecção primeiro

### Credenciais inválidas

O script mostra:
```
⚠️ Ainda na página de login SSO
```

Verifique:
- CPF está correto (sem pontos/traços)
- Senha está correta
- Conta não está bloqueada

---

## 📚 Documentação Adicional

- [ANTI-BOT-DETECTION.md](../../docs/pje/ANTI-BOT-DETECTION.md) - Técnicas detalhadas de anti-detecção
- [Browserless Docs](https://docs.browserless.io/) - Documentação oficial do Browserless
- [Puppeteer Stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) - Plugin de stealth

---

## 🔐 Segurança

⚠️ **IMPORTANTE**:
- Nunca commite credenciais em repositórios Git
- Use variáveis de ambiente em produção
- Mantenha o `.env` no `.gitignore`
- Este script é apenas para uso autorizado

### Usar Variáveis de Ambiente

```javascript
import dotenv from 'dotenv';
dotenv.config();

const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;
```

Arquivo `.env`:
```
PJE_CPF=07529294610
PJE_SENHA=12345678A@
```

---

## 📝 Changelog

### v1.0.0 - 24/10/2025
- ✅ Login funcionando com sucesso
- ✅ Clique no botão "Entrar com PDPJ"
- ✅ State OAuth dinâmico
- ✅ Anti-detecção completo (Stealth Plugin)
- ✅ Comportamento humano implementado
- ✅ Navegador visível para inspeção
- ✅ Screenshots de evidência
- ✅ Documentação completa

---

## 📄 Licença

Este projeto é parte do Browserless e segue a mesma licença.

---

**Última atualização**: 24 de Outubro de 2025
**Status**: ✅ Testado e funcionando
**Compatível com**: PJE TRT3 (Tribunal Regional do Trabalho da 3ª Região)
