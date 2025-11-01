---
name: pje-scraping
description: Expert in PJE (Processo Judicial Eletrônico) automation and web scraping for Brazilian electronic legal process systems. Handles tribunal-specific flows, API integration, and data extraction patterns.
---

# PJE Scraping Expert

This skill provides specialized knowledge for automating PJE (Processo Judicial Eletrônico) legal process scraping across Brazilian tribunals (TJMG, TJES, TRT, etc.).

## Core Capabilities

### 1. Tribunal Structure Understanding
- **First Instance (1g)**: `server/scripts/pje-tj/{tribunal}/1g/`
- **Second Instance (2g)**: `server/scripts/pje-tj/{tribunal}/2g/`
- **Common utilities**: `server/scripts/pje-tj/{tribunal}/common/`

### 2. Scraping Categories
Each tribunal supports these main scraping types:
- **Acervo**: All active processes (`raspar-acervo-*.js`)
- **Expedientes**: Court orders and notifications (`raspar-expedientes.js`)
- **Pauta Audiência**: Hearing schedules (`raspar-pauta-audiencia.js`)

### 3. File Naming Conventions
Follow this pattern for new scrapers:
```
server/scripts/pje-tj/{tribunal}/{instance}/{category}/raspar-{description}.js
```

Examples:
- `server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js`
- `server/scripts/pje-tj/tjes/1g/expedientes/raspar-expedientes.js`

### 4. Standard Script Structure

Every PJE scraping script should follow this template:

```javascript
/**
 * [Script Description]
 *
 * USAGE:
 * PJE_CPF="..." PJE_SENHA="..." PJE_LOGIN_URL="..." node script.js
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';

puppeteer.use(StealthPlugin());

// Environment variables
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;
const LOGIN_URL = process.env.PJE_LOGIN_URL;
const BASE_URL = process.env.PJE_BASE_URL;
const OUTPUT_FILE = process.env.PJE_OUTPUT_FILE || 'data/output.json';

// Validation
if (!CPF || !SENHA || !LOGIN_URL) {
  console.error('❌ Missing required env vars');
  process.exit(1);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page = await browser.newPage();

    // Login flow
    console.log('🔐 Logging in...');
    await performLogin(page);

    // Scraping logic
    console.log('📊 Scraping data...');
    const data = await scrapeData(page);

    // Save results
    await mkdir(OUTPUT_FILE.substring(0, OUTPUT_FILE.lastIndexOf('/')), { recursive: true });
    writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Saved to ${OUTPUT_FILE}`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
```

### 5. Login Flow Patterns

**Standard PJE Login (most tribunals):**
```javascript
async function performLogin(page) {
  await page.goto(LOGIN_URL);
  await page.waitForSelector('iframe[name="ssoFrame"]');

  const frame = page.frames().find(f => f.name() === 'ssoFrame');
  await frame.type('#username', CPF);
  await frame.type('#password', SENHA);
  await frame.click('#kc-login');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });
}
```

**TJMG-specific quirk:**
```javascript
// TJMG shows "Bad Request" after login - needs page refresh
await page.reload({ waitUntil: 'networkidle2' });
console.log('🔄 TJMG: Refreshed after Bad Request');
```

**TJES with CAPTCHA:**
```javascript
// TJES requires CAPTCHA solving
const captchaImg = await page.$('#captchaImage');
const captchaSolution = await solveCaptcha(captchaImg);
await page.type('#captchaInput', captchaSolution);
```

### 6. Data Extraction Patterns

**Wait for dynamic content:**
```javascript
await page.waitForSelector('.dataTable', { timeout: 30000 });
await page.waitForFunction(() => {
  const table = document.querySelector('.dataTable');
  return table && table.querySelectorAll('tbody tr').length > 0;
});
```

**Extract table data:**
```javascript
const processos = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.dataTable tbody tr'));
  return rows.map(row => ({
    numero: row.querySelector('.numero')?.textContent.trim(),
    classe: row.querySelector('.classe')?.textContent.trim(),
    assunto: row.querySelector('.assunto')?.textContent.trim(),
  }));
});
```

### 7. Environment Variables

Always use these standard env vars:
- `PJE_CPF`: User CPF
- `PJE_SENHA`: User password
- `PJE_LOGIN_URL`: Tribunal login URL
- `PJE_BASE_URL`: Tribunal base URL
- `PJE_API_URL`: API base URL (if using APIs)
- `PJE_OUTPUT_FILE`: Output path (default: auto-generated)

### 8. Error Handling

```javascript
try {
  // Scraping logic
} catch (error) {
  console.error('❌ Error:', error.message);

  // Save error state
  const errorFile = OUTPUT_FILE.replace('.json', '-error.json');
  writeFileSync(errorFile, JSON.stringify({
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  }, null, 2));

  // Take screenshot for debugging
  await page.screenshot({ path: 'error.png', fullPage: true });

  throw error;
}
```

### 9. Anti-Detection Best Practices

Reference: `docs/pje/ANTI-BOT-DETECTION.md`

- Always use `puppeteer-extra` with StealthPlugin
- Launch with these args:
  ```javascript
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
  ]
  ```
- Add human-like delays:
  ```javascript
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  await delay(500 + Math.random() * 1000); // 500-1500ms
  ```

### 10. Testing New Scrapers

Always test with these steps:

1. **Manual test first:**
   ```bash
   PJE_CPF="..." PJE_SENHA="..." PJE_LOGIN_URL="..." node script.js
   ```

2. **Check output file:**
   ```bash
   cat data/output.json | head -20
   ```

3. **Verify data structure:**
   - All required fields present?
   - Data types correct?
   - No null/undefined values?

4. **Add to test suite:**
   Reference existing tests in `scripts/test-*.ts`

## Common Issues & Solutions

### Issue: "Navigation timeout"
**Solution:** Increase timeout or wait for specific elements
```javascript
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
```

### Issue: "Element not found"
**Solution:** Wait for dynamic content
```javascript
await page.waitForSelector(selector, { timeout: 30000 });
```

### Issue: "CAPTCHA blocking"
**Solution:** Check tribunal-specific CAPTCHA solver
```javascript
// See server/scripts/pje-tj/tjes/common/test-captcha-solver.js
```

### Issue: "Session expired"
**Solution:** Implement session refresh
```javascript
if (await page.$('#sessionExpired')) {
  await performLogin(page);
}
```

## When to Use This Skill

Use this skill when:
- Creating new PJE scraping scripts
- Debugging existing scrapers
- Adding support for new tribunals
- Updating scraper logic due to PJE UI changes
- Implementing new scraping categories (acervo, expedientes, etc.)
- Troubleshooting login flows
- Optimizing anti-detection techniques

## Related Documentation

- `docs/pje/APIs.md` - PJE API reference
- `docs/pje/ANTI-BOT-DETECTION.md` - Anti-detection techniques
- `server/scripts/pje-tj/tjmg/common/login.js` - TJMG login reference
- `server/scripts/pje-tj/tjes/common/test-captcha-solver.js` - CAPTCHA handling
