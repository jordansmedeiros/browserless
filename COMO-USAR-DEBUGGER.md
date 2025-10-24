# 🐛 Como Usar o Debugger do Browserless - Login PJE

## ✅ Teste Anti-Detecção Passou com Sucesso!

Todos os testes de anti-detecção passaram:
- ✅ WebDriver: OCULTO
- ✅ User-Agent: Normal
- ✅ Plugins: 5 plugins detectados
- ✅ Languages: pt-BR, pt, en-US, en
- ✅ Chrome object: Presente
- ✅ Permissions API: Presente
- ✅ **PJE carregou a página de login normalmente (sem erro 403!)**

---

## 📋 Passo a Passo para Usar no Debugger

### 1️⃣ Abra o Debugger do Browserless

Acesse no seu navegador:
```
http://localhost:3000/debugger/?token=6R0W53R135510
```

### 2️⃣ Atualize suas Credenciais

Abra o arquivo [login-pje-debugger.js](login-pje-debugger.js) e atualize:

```javascript
// ⚠️ ATUALIZE SUAS CREDENCIAIS AQUI:
const CPF = '07529294610';      // ← Seu CPF
const SENHA = '12345678A@';     // ← Sua senha
```

### 3️⃣ Cole o Código no Debugger

1. Copie **TODO** o conteúdo do arquivo `login-pje-debugger.js`
2. Cole no campo **"Code"** no debugger
3. Clique em **"Run"**

### 4️⃣ Acompanhe a Execução

Você verá no **Console** (parte inferior):
```
🔧 Configurando anti-detecção...
🌐 Navegando para página de login...
👤 Preenchendo CPF...
🔒 Preenchendo senha...
🖱️ Clicando em Entrar...
⏳ Aguardando redirecionamento...
✅ Login realizado com sucesso!
```

E no **Preview** (lado direito):
- Você verá o navegador executando as ações em tempo real
- A digitação acontece com delay humano (parece digitação real)
- O mouse se move suavemente até o botão

---

## 🎯 O Que Esperar

### ✅ Se Der Certo:
```
📍 URL atual: https://pje.trt3.jus.br/primeirograu/authenticateSSO.seam?...
📄 Título: PJE - Primeiro Grau
✅ Login realizado com sucesso!
🎉 Você foi redirecionado para o sistema
```

### ❌ Se Ainda Der 403:
```
❌ Erro 403 - CloudFront bloqueou o acesso
💡 Tente novamente ou ajuste as configurações anti-detecção
```

**Possíveis causas:**
- CloudFront está usando detecção adicional (captcha, fingerprinting avançado)
- Múltiplas tentativas consecutivas podem acionar proteção temporária
- IP pode estar marcado como suspeito

**Soluções:**
- Aguarde alguns minutos entre tentativas
- Tente em horários diferentes
- Use um proxy/VPN se necessário
- Considere usar Residential Proxies para maior naturalidade

---

## 🔍 Diferença Entre os Arquivos

| Arquivo | Uso | Quando Usar |
|---------|-----|-------------|
| `login-pje-debugger.js` | **Debugger visual** | Testar e visualizar passo a passo no navegador |
| `test-anti-detection.js` | **Teste de detecção** | Verificar se anti-detecção está funcionando |
| `login-pje-stealth.js` | **API com Stealth** | Usar via API do Browserless (requer puppeteer-extra) |
| `login-pje-playwright.js` | **API com Playwright** | Usar via endpoint /function com Playwright |

---

## 🚀 Usar via API REST (alternativa ao Debugger)

Se preferir usar via API ao invés do debugger:

### Puppeteer (com Stealth - RECOMENDADO):
```bash
# Instale dependências primeiro
npm install puppeteer-extra puppeteer-extra-plugin-stealth

# Execute o script
node login-pje-stealth.js
```

### Via HTTP POST:
```bash
curl -X POST http://localhost:3000/function?token=6R0W53R135510 \
  -H "Content-Type: application/javascript" \
  --data-binary @login-pje-debugger.js
```

---

## 📊 Screenshots de Teste

Após executar `node test-anti-detection.js`, foram gerados:

1. **test-anti-detection-result.png** - Mostra todos os testes de detecção (verde = passou)
2. **test-pje-access.png** - Mostra que o PJE carregou sem erro 403

---

## ⚠️ Avisos Importantes

1. **Credenciais em Plain Text**: Nunca commite credenciais em repositórios Git
2. **Rate Limiting**: Não faça muitas tentativas consecutivas (pode acionar bloqueio temporário)
3. **Conformidade Legal**: Use apenas para automação autorizada em sistemas que você tem permissão
4. **CloudFront Dinâmico**: A proteção pode mudar, ajustes podem ser necessários no futuro

---

## 🆘 Solução de Problemas

### Preview Fica em Branco no Debugger

**Problema**: Ao executar no debugger, o preview não mostra nada.

**Soluções**:
1. ✅ Certifique-se de copiar **TODO** o código do arquivo
2. ✅ Verifique se não há erros no Console (parte inferior)
3. ✅ Aguarde alguns segundos - a página pode demorar para carregar
4. ✅ Clique em "Run" novamente se necessário
5. ✅ Verifique se o Browserless está rodando: http://localhost:3000/health

### Erro "page is not defined"

**Causa**: O objeto `page` só existe no contexto do debugger ou da API /function.

**Solução**: Use `node test-anti-detection.js` para testar localmente ao invés do debugger.

### Erro "Cannot find module 'puppeteer-extra'"

**Causa**: Dependências não instaladas.

**Solução**:
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

---

## 📚 Recursos Adicionais

- [ANTI-BOT-DETECTION.md](ANTI-BOT-DETECTION.md) - Guia completo de técnicas anti-detecção
- [README-PJE-LOGIN.md](README-PJE-LOGIN.md) - Documentação completa do login PJE
- Browserless Docs: https://docs.browserless.io/
- Puppeteer Stealth: https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth

---

**Última atualização**: 24 de Outubro de 2025
**Status**: ✅ Testado e funcionando (anti-detecção passou em todos os testes)
