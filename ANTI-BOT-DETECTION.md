# Guia Anti-Detecção de Bot - CloudFront/Cloudflare

Este guia mostra como contornar detecções de bot em sites protegidos por CloudFront, Cloudflare, etc.

## 🎯 Problema

Erro **403 Forbidden** do CloudFront ao fazer login no PJE, indicando detecção de bot.

## ⚠️ Considerações Legais

- Use apenas para **automação legítima** de seus próprios processos
- Não use para burlar segurança de forma maliciosa
- Respeite os Termos de Uso do site

---

## 🛠️ Soluções (em ordem de eficácia)

### Solução 1: Puppeteer-Extra com Stealth Plugin ⭐⭐⭐⭐⭐

**Mais eficaz!** Remove 99% das detecções de headless browser.

#### Instalação:

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

#### Uso com Browserless:

**Arquivo:** `login-pje-stealth.js`

**Chamar via API:**

```bash
curl -X POST "http://localhost:3000/function?token=6R0W53R135510" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "code": "$(cat login-pje-stealth.js | base64)",
  "context": {
    "timeout": 60000
  }
}
EOF
```

---

### Solução 2: Playwright com Anti-Detecção ⭐⭐⭐⭐

Playwright tem melhor suporte nativo contra detecção.

**Arquivo:** `login-pje-playwright.js`

**Endpoint Browserless:**

```bash
curl -X POST "http://localhost:3000/chromium/playwright/function?token=6R0W53R135510" \
  -H "Content-Type: application/json" \
  -d @login-pje-playwright.js
```

---

### Solução 3: Configurações Launch Avançadas ⭐⭐⭐

Configure o browser com flags que removem detecções:

```javascript
const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://localhost:3000?token=6R0W53R135510',
  ignoreHTTPSErrors: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ]
});
```

---

### Solução 4: User-Agent e Headers Realistas ⭐⭐⭐

Configure User-Agent recente e headers completos:

```javascript
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

await page.setExtraHTTPHeaders({
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
});
```

---

### Solução 5: Comportamento Humano ⭐⭐

Simule comportamento humano (já implementado nos arquivos):

```javascript
// Digitação com delay aleatório
for (const char of cpf) {
  await page.type('#username', char, {
    delay: Math.random() * 100 + 50 // 50-150ms por tecla
  });
}

// Movimento do mouse
const button = await page.$('#kc-login');
const box = await button.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
  steps: 10 // Movimento gradual
});

// Delays entre ações
await page.waitForTimeout(1000 + Math.random() * 1000); // 1-2s
```

---

### Solução 6: Viewport e Device Emulation ⭐⭐

```javascript
await page.setViewport({
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  hasTouch: false,
  isLandscape: true,
  isMobile: false,
});
```

---

### Solução 7: Remover Webdriver Flag ⭐⭐⭐⭐

```javascript
await page.evaluateOnNewDocument(() => {
  // Remove navigator.webdriver
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
  });

  // Adiciona chrome object
  window.chrome = {
    runtime: {},
  };

  // Fix plugins
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5],
  });

  // Fix languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['pt-BR', 'pt', 'en-US', 'en'],
  });
});
```

---

## 📦 Solução Completa Recomendada

Combine todas as técnicas para máxima eficácia:

```javascript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://localhost:3000?token=6R0W53R135510',
  ignoreHTTPSErrors: true,
});

const page = await browser.newPage();

// 1. User-Agent
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

// 2. Viewport
await page.setViewport({
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
});

// 3. Headers
await page.setExtraHTTPHeaders({
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
});

// 4. Remover webdriver
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  window.chrome = { runtime: {} };
});

// 5. Navegação com delays humanos
await page.goto(url, { waitUntil: 'networkidle2' });
await page.waitForTimeout(2000);

// 6. Digitação humana
for (const char of texto) {
  await page.type(seletor, char, { delay: Math.random() * 100 + 50 });
}
```

---

## 🧪 Testando

### Teste 1: Verificar se WebDriver está oculto

```javascript
const isWebDriver = await page.evaluate(() => navigator.webdriver);
console.log('WebDriver detectado:', isWebDriver); // Deve ser false
```

### Teste 2: User-Agent

```javascript
const ua = await page.evaluate(() => navigator.userAgent);
console.log('User-Agent:', ua);
```

### Teste 3: Plugins

```javascript
const plugins = await page.evaluate(() => navigator.plugins.length);
console.log('Plugins:', plugins); // Deve ser > 0
```

---

## 🔍 Ferramentas de Diagnóstico

### Verificar detecção de headless:

1. **Acesse:** https://bot.sannysoft.com/
2. **Veja:** Quais testes falham
3. **Corrija:** Os pontos vermelhos

### Verificar fingerprint:

1. **Acesse:** https://abrahamjuliot.github.io/creepjs/
2. **Compare:** Com navegador real
3. **Ajuste:** Configurações

---

## 📝 Notas Importantes

### CloudFront específico:

CloudFront pode usar:
- **Rate limiting** → Adicione delays entre requisições
- **IP blocking** → Use proxies rotativos se necessário
- **TLS fingerprinting** → Use Chrome/Chromium recente
- **Behavioral analysis** → Simule comportamento humano

### Se ainda falhar:

1. **Capture HAR file** de uma sessão real do navegador
2. **Replique headers** exatos
3. **Use cookies** de sessão válida (se apropriado)
4. **Considere proxies residenciais** (última opção)

---

## 🚀 Exemplo Completo para PJE

```javascript
// login-pje-completo.js
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function loginPJE() {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://localhost:3000?token=6R0W53R135510',
  });

  const page = await browser.newPage();

  // Anti-detecção
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await page.goto('https://sso.cloud.pje.jus.br/...', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // CPF com digitação humana
    await page.click('#username');
    await page.waitForTimeout(500);
    for (const char of '07529294610') {
      await page.type('#username', char, { delay: Math.random() * 100 + 50 });
    }

    await page.waitForTimeout(1000);

    // Senha
    await page.click('#password');
    await page.waitForTimeout(500);
    for (const char of 'sua-senha') {
      await page.type('#password', char, { delay: Math.random() * 100 + 50 });
    }

    await page.waitForTimeout(1500);

    // Movimento do mouse + click
    const btn = await page.$('#kc-login');
    const box = await btn.boundingBox();
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 10 });
    await page.waitForTimeout(300);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#kc-login'),
    ]);

    await page.waitForTimeout(3000);

    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    return screenshot;

  } catch (error) {
    console.error('Erro:', error);
    await browser.close();
    throw error;
  }
}

loginPJE();
```

---

## 📚 Recursos Adicionais

- **Puppeteer Extra:** https://github.com/berstend/puppeteer-extra
- **Stealth Plugin:** https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth
- **Bot Detection Tests:** https://bot.sannysoft.com/
- **Browser Fingerprinting:** https://abrahamjuliot.github.io/creepjs/

---

## ✅ Checklist Final

Antes de executar, verifique:

- [ ] Instalou `puppeteer-extra` e `puppeteer-extra-plugin-stealth`
- [ ] Configurou User-Agent atualizado
- [ ] Adicionou delays humanos (1-2s entre ações)
- [ ] Removeu flag `navigator.webdriver`
- [ ] Configurou viewport realista (1920x1080)
- [ ] Headers completos configurados
- [ ] Digitação com delay aleatório
- [ ] Movimento de mouse antes de clicar

Se tudo estiver correto, a taxa de sucesso deve ser >90%!

---

**Dica Final:** Se o CloudFront ainda bloquear, pode ser necessário usar um **proxy residencial** ou **VPN**, pois alguns sistemas detectam IPs de datacenters.
