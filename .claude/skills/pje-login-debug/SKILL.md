---
name: pje-login-debug
description: Specialized debugging for PJE login flows, CAPTCHA solving, SSO authentication issues, and session management across different Brazilian tribunals.
---

# PJE Login & CAPTCHA Debugging Expert

This skill provides debugging expertise for PJE authentication challenges, including SSO flows, CAPTCHA solving, and tribunal-specific login quirks.

## Core Debugging Areas

### 1. Login Flow Debugging Steps

When login fails, follow this diagnostic sequence:

**Step 1: Verify credentials**
```bash
# Test with manual credentials
PJE_CPF="12345678900" PJE_SENHA="test123" PJE_LOGIN_URL="https://pje.tjmg.jus.br/pje/login.seam" node script.js
```

**Step 2: Check iframe loading**
```javascript
// Add logging to detect iframe issues
console.log('🔍 Waiting for SSO iframe...');
await page.waitForSelector('iframe[name="ssoFrame"]', { timeout: 10000 });
console.log('✅ SSO iframe loaded');

const frames = page.frames();
console.log('📋 Available frames:', frames.map(f => f.name() || f.url()));

const ssoFrame = frames.find(f => f.name() === 'ssoFrame');
if (!ssoFrame) {
  throw new Error('SSO frame not found!');
}
```

**Step 3: Monitor navigation**
```javascript
page.on('framenavigated', frame => {
  console.log('🔄 Frame navigated:', frame.name() || frame.url());
});

page.on('response', response => {
  if (response.status() >= 400) {
    console.log('❌ HTTP Error:', response.status(), response.url());
  }
});
```

**Step 4: Screenshot at each step**
```javascript
await page.screenshot({ path: 'debug-1-before-login.png' });
// ... login logic
await page.screenshot({ path: 'debug-2-after-login.png' });
```

### 2. Tribunal-Specific Login Quirks

**TJMG - Bad Request Workaround**
```javascript
/**
 * TJMG shows "Bad Request" after successful login
 * Solution: Reload the page once
 */
async function loginTJMG(page) {
  await page.goto(LOGIN_URL);
  await page.waitForSelector('iframe[name="ssoFrame"]');

  const frame = page.frames().find(f => f.name() === 'ssoFrame');
  await frame.type('#username', CPF);
  await frame.type('#password', SENHA);
  await frame.click('#kc-login');

  // Wait for navigation
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // ⚠️ TJMG-SPECIFIC: Check for Bad Request
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Bad Request')) {
    console.log('🔄 TJMG: Detected Bad Request, reloading...');
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('✅ TJMG: Page reloaded successfully');
  }

  // Verify login success
  await page.waitForSelector('#menu', { timeout: 10000 });
  console.log('✅ Login successful');
}
```

**TJES - CAPTCHA Required**
```javascript
/**
 * TJES requires CAPTCHA solving
 * See: server/scripts/pje-tj/tjes/common/test-captcha-solver.js
 */
async function loginTJES(page) {
  await page.goto(LOGIN_URL);

  // Fill credentials
  await page.type('#username', CPF);
  await page.type('#password', SENHA);

  // Solve CAPTCHA
  const captchaImg = await page.$('#captchaImage');
  if (captchaImg) {
    console.log('🧩 CAPTCHA detected, solving...');
    const solution = await solveCaptcha(page, captchaImg);
    await page.type('#captchaInput', solution);
  }

  await page.click('#kc-login');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
}
```

**Standard Tribunals (TRT, etc.)**
```javascript
/**
 * Most tribunals use standard SSO iframe flow
 */
async function loginStandard(page) {
  await page.goto(LOGIN_URL);
  await page.waitForSelector('iframe[name="ssoFrame"]');

  const frame = page.frames().find(f => f.name() === 'ssoFrame');
  await frame.type('#username', CPF);
  await frame.type('#password', SENHA);
  await frame.click('#kc-login');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });
}
```

### 3. CAPTCHA Debugging

**Test CAPTCHA solver independently:**
```bash
# Run CAPTCHA test script
PJE_CPF="..." PJE_SENHA="..." timeout 60 bash -c "node server/scripts/pje-tj/tjes/common/test-captcha-solver.js"
```

**Common CAPTCHA issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| "CAPTCHA image not found" | Selector changed | Update selector in script |
| "OCR failed" | Image quality poor | Enhance image before OCR |
| "Invalid CAPTCHA" | Wrong answer | Improve OCR algorithm |
| "Too many attempts" | Rate limited | Add retry with exponential backoff |

**CAPTCHA solver template:**
```javascript
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

async function solveCaptcha(page, captchaElement) {
  // Screenshot CAPTCHA
  const captchaBox = await captchaElement.boundingBox();
  const screenshot = await page.screenshot({
    clip: {
      x: captchaBox.x,
      y: captchaBox.y,
      width: captchaBox.width,
      height: captchaBox.height,
    }
  });

  // Enhance image for better OCR
  const enhanced = await sharp(screenshot)
    .greyscale()
    .normalize()
    .threshold(128)
    .toBuffer();

  // Run OCR
  const { data: { text } } = await Tesseract.recognize(enhanced, 'eng');

  // Clean result
  const solution = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  console.log('🧩 CAPTCHA solved:', solution);
  return solution;
}
```

### 4. Session Management Debugging

**Detect session expiration:**
```javascript
async function checkSession(page) {
  // Check for common session expired indicators
  const sessionExpired = await page.evaluate(() => {
    const bodyText = document.body.innerText.toLowerCase();
    return bodyText.includes('sessão expirada') ||
           bodyText.includes('session expired') ||
           bodyText.includes('faça login novamente');
  });

  if (sessionExpired) {
    console.log('⏰ Session expired, re-authenticating...');
    return false;
  }

  // Check for menu (indicates active session)
  const hasMenu = await page.$('#menu') !== null;
  return hasMenu;
}
```

**Implement session refresh:**
```javascript
async function ensureSession(page) {
  const isActive = await checkSession(page);

  if (!isActive) {
    console.log('🔐 Session inactive, logging in...');
    await performLogin(page);
  }

  return page;
}

// Use before scraping operations
async function scrapeWithSessionCheck(page) {
  await ensureSession(page);

  // Your scraping logic
  const data = await page.evaluate(() => {
    // Extract data
  });

  return data;
}
```

### 5. Common Login Errors & Solutions

**Error: "Navigation timeout exceeded"**
```javascript
// Increase timeout
await page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 60000 // 60 seconds
});

// Or wait for specific element instead
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#expected-element', { timeout: 30000 });
```

**Error: "Element not found: #username"**
```javascript
// Debug: List all available selectors
const selectors = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('input')).map(el => ({
    id: el.id,
    name: el.name,
    type: el.type,
    placeholder: el.placeholder,
  }));
});
console.log('Available inputs:', selectors);
```

**Error: "Frame not found"**
```javascript
// Debug: List all frames
const frames = page.frames();
console.log('Available frames:', frames.map(f => ({
  name: f.name(),
  url: f.url(),
})));

// Wait for frame to load
await page.waitForFunction(() => {
  return window.frames.length > 0;
}, { timeout: 10000 });
```

**Error: "Credentials invalid"**
```javascript
// Verify credentials are correct
console.log('Testing with CPF:', CPF);
console.log('Password length:', SENHA?.length);

// Check for input validation errors in UI
const validationError = await page.evaluate(() => {
  const error = document.querySelector('.error, .alert, .validation-error');
  return error?.textContent || null;
});

if (validationError) {
  console.error('❌ Validation error:', validationError);
}
```

### 6. Network Debugging

**Monitor all network requests:**
```javascript
page.on('request', request => {
  console.log('📤', request.method(), request.url());
});

page.on('response', async response => {
  const url = response.url();
  const status = response.status();

  console.log('📥', status, url);

  // Log failed requests
  if (status >= 400) {
    try {
      const body = await response.text();
      console.error('Error body:', body.substring(0, 200));
    } catch (e) {
      console.error('Could not read error body');
    }
  }
});

page.on('requestfailed', request => {
  console.error('❌ Request failed:', request.url(), request.failure().errorText);
});
```

**Capture authentication tokens:**
```javascript
const tokens = [];

page.on('response', async response => {
  const url = response.url();

  // Capture auth-related responses
  if (url.includes('/auth/') || url.includes('/login') || url.includes('/token')) {
    try {
      const json = await response.json();
      console.log('🔑 Auth response:', json);
      tokens.push({ url, data: json });
    } catch (e) {
      // Not JSON
    }
  }
});
```

### 7. Browser Console Debugging

**Capture browser console logs:**
```javascript
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();

  if (type === 'error') {
    console.error('🔴 Browser Error:', text);
  } else if (type === 'warning') {
    console.warn('🟡 Browser Warning:', text);
  } else {
    console.log('🔵 Browser Log:', text);
  }
});

page.on('pageerror', error => {
  console.error('💥 Page Error:', error.message);
});
```

### 8. Debugging Workflow Template

Use this template for systematic debugging:

```javascript
/**
 * Debug Login - Full Diagnostic Script
 */
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;
const LOGIN_URL = process.env.PJE_LOGIN_URL;

async function debugLogin() {
  console.log('🐛 Starting login debug...\n');
  console.log('Config:', { CPF, LOGIN_URL, passwordLength: SENHA?.length });

  const browser = await puppeteer.launch({
    headless: false, // Always use headful for debugging
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox'],
    devtools: true, // Open DevTools automatically
  });

  const page = await browser.newPage();

  // Enable all logging
  page.on('console', msg => console.log('🔵 Console:', msg.text()));
  page.on('request', req => console.log('📤', req.method(), req.url()));
  page.on('response', res => console.log('📥', res.status(), res.url()));
  page.on('requestfailed', req => console.error('❌ Failed:', req.url()));

  try {
    // Step 1: Navigate
    console.log('\n📍 Step 1: Navigating to login page...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'debug-1-loaded.png' });
    console.log('✅ Page loaded');

    // Step 2: Find iframe
    console.log('\n📍 Step 2: Finding SSO iframe...');
    await page.waitForSelector('iframe[name="ssoFrame"]', { timeout: 10000 });
    const frames = page.frames();
    console.log('Frames:', frames.map(f => f.name() || f.url()));
    const ssoFrame = frames.find(f => f.name() === 'ssoFrame');
    if (!ssoFrame) throw new Error('SSO frame not found');
    console.log('✅ SSO iframe found');

    // Step 3: Fill credentials
    console.log('\n📍 Step 3: Filling credentials...');
    await ssoFrame.type('#username', CPF, { delay: 100 });
    await ssoFrame.type('#password', SENHA, { delay: 100 });
    await page.screenshot({ path: 'debug-2-filled.png' });
    console.log('✅ Credentials filled');

    // Step 4: Submit
    console.log('\n📍 Step 4: Submitting login...');
    await ssoFrame.click('#kc-login');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'debug-3-after-submit.png' });
    console.log('✅ Form submitted');

    // Step 5: Verify login
    console.log('\n📍 Step 5: Verifying login...');
    const bodyText = await page.evaluate(() => document.body.innerText);

    if (bodyText.includes('Bad Request')) {
      console.log('🔄 Detected Bad Request, reloading...');
      await page.reload({ waitUntil: 'networkidle2' });
      await page.screenshot({ path: 'debug-4-after-reload.png' });
    }

    const hasMenu = await page.$('#menu') !== null;
    if (hasMenu) {
      console.log('✅ Login successful - Menu detected');
    } else {
      console.error('❌ Login may have failed - No menu found');
      console.log('Body text:', bodyText.substring(0, 500));
    }

    // Wait for manual inspection
    console.log('\n⏸️  Pausing for manual inspection (60 seconds)...');
    await new Promise(r => setTimeout(r, 60000));

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
    throw error;

  } finally {
    await browser.close();
  }
}

debugLogin().catch(console.error);
```

### 9. Debugging Checklist

When login fails, go through this checklist:

- [ ] Credentials are correct and not expired
- [ ] Login URL is correct for the tribunal
- [ ] iframe selector is correct (`iframe[name="ssoFrame"]`)
- [ ] Username/password input selectors are correct (`#username`, `#password`)
- [ ] Submit button selector is correct (`#kc-login`)
- [ ] Navigation timeout is sufficient (60s recommended)
- [ ] Stealth plugin is enabled
- [ ] Browser args include `--disable-blink-features=AutomationControlled`
- [ ] Network is stable (check for timeout errors)
- [ ] No CAPTCHA is blocking login (check for CAPTCHA elements)
- [ ] Session cookies are not corrupted (try incognito/fresh profile)
- [ ] Tribunal-specific quirks are handled (Bad Request for TJMG, etc.)

## When to Use This Skill

Use this skill when:
- Login scripts are failing
- CAPTCHA solving is not working
- Session management issues occur
- Adding support for a new tribunal with different login flow
- Debugging network/timeout issues during authentication
- Investigating anti-bot detection triggers
- Troubleshooting SSO iframe issues

## Related Documentation

- `server/scripts/pje-tj/tjmg/common/login.js` - TJMG login example
- `server/scripts/pje-tj/tjes/common/test-captcha-solver.js` - CAPTCHA solver
- `docs/pje/ANTI-BOT-DETECTION.md` - Anti-detection reference
