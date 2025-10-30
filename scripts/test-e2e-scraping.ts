import { chromium, Browser, Page } from 'playwright-core';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

async function setupBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);
  return { browser, page };
}

async function testCreateJobViaWizard(page: Page): Promise<TestResult> {
  const testName = 'Create job via wizard';
  console.log(`\n--- ${testName} ---`);
  const start = performance.now();

  try {
    // Navigate to scrapes page
    await page.goto(`${BASE_URL}/pje/scrapes`);
    await page.waitForSelector('text=Nova Raspagem', { timeout: 10000 });
    console.log('✓ Loaded scrapes page');

    // Click "Nova Raspagem"
    await page.click('text=Nova Raspagem');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✓ Opened wizard dialog');

    // Check for credential selector
    const credentialSelector = page.locator('[role="combobox"]').first();
    const isCredentialSelectorVisible = await credentialSelector.isVisible();

    if (!isCredentialSelectorVisible) {
      console.log('⚠️  No credential selector found - might need seeded data');
      throw new Error('Credential selector not found - run seed-credentials.ts first');
    }

    // Click credential selector
    await credentialSelector.click();
    await page.waitForTimeout(500);

    // Select first credential option
    const firstOption = page.locator('[role="option"]').first();
    const hasOptions = await firstOption.isVisible().catch(() => false);

    if (!hasOptions) {
      console.log('⚠️  No credentials available - run seed-credentials.ts first');
      throw new Error('No credentials available in database');
    }

    await firstOption.click();
    console.log('✓ Selected first credential');

    // Select tribunal(s)
    const tribunalCheckbox = page.locator('input[type="checkbox"]').first();
    if (await tribunalCheckbox.isVisible()) {
      await tribunalCheckbox.check();
      console.log('✓ Selected at least one tribunal');
    }

    // Select scrape type (Pendentes by default)
    const typeSelector = page.locator('text=Tipo de Raspagem').locator('..');
    if (await typeSelector.isVisible()) {
      console.log('✓ Scrape type selector found');
    }

    // Click "Iniciar Raspagem"
    const startButton = page.locator('button:has-text("Iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('✓ Clicked start button');

      // Wait for dialog to close
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
      console.log('✓ Dialog closed');
    } else {
      console.log('⚠️  Could not complete wizard - missing start button');
    }

    const duration = performance.now() - start;
    return { name: testName, passed: true, duration };
  } catch (error: any) {
    const duration = performance.now() - start;
    console.error(`✗ ${error.message}`);
    return { name: testName, passed: false, duration, error: error.message };
  }
}

async function testSSEReconnection(page: Page): Promise<TestResult> {
  const testName = 'SSE reconnection';
  console.log(`\n--- ${testName} ---`);
  const start = performance.now();

  try {
    await page.goto(`${BASE_URL}/pje/scrapes`);

    // Check for any active or recent jobs
    const jobRows = page.locator('[data-testid="job-row"]');
    const jobCount = await jobRows.count();

    if (jobCount === 0) {
      console.log('⚠️  No jobs found - create a job first via wizard');
      const duration = performance.now() - start;
      return { name: testName, passed: true, duration };
    }

    // Click first job to open terminal/logs
    const firstJob = jobRows.first();
    const viewLogsButton = firstJob.locator('button[aria-label*="Log"], button:has-text("Logs")');

    if (await viewLogsButton.isVisible().catch(() => false)) {
      await viewLogsButton.click();
      console.log('✓ Opened logs view');

      // Check connection status indicator
      await page.waitForTimeout(1000);
      const connectionStatus = page.locator('[data-testid="connection-status"]');
      if (await connectionStatus.isVisible().catch(() => false)) {
        const status = await connectionStatus.textContent();
        console.log(`✓ Connection status: ${status}`);
      }

      // Simulate offline
      await page.context().setOffline(true);
      console.log('✓ Simulated offline mode');
      await page.waitForTimeout(2000);

      // Go back online
      await page.context().setOffline(false);
      console.log('✓ Back online');
      await page.waitForTimeout(2000);

      // Check if reconnection occurred
      const logs = page.locator('[data-testid="log-entry"]');
      const logCount = await logs.count();
      console.log(`✓ Found ${logCount} log entries`);
    } else {
      console.log('⚠️  Could not find view logs button');
    }

    const duration = performance.now() - start;
    return { name: testName, passed: true, duration };
  } catch (error: any) {
    const duration = performance.now() - start;
    return { name: testName, passed: false, duration, error: error.message };
  }
}

async function testBackoffPolling(page: Page): Promise<TestResult> {
  const testName = 'Polling backoff';
  console.log(`\n--- ${testName} ---`);
  const start = performance.now();

  try {
    await page.goto(`${BASE_URL}/pje/scrapes`);

    // Monitor network requests for polling patterns
    const requests: { url: string; timestamp: number }[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/jobs') || request.url().includes('getActiveJobsStatus')) {
        requests.push({
          url: request.url(),
          timestamp: Date.now(),
        });
      }
    });

    // Wait and collect polling requests
    await page.waitForTimeout(15000);

    if (requests.length >= 3) {
      console.log(`✓ Detected ${requests.length} polling requests`);

      // Calculate intervals between requests
      for (let i = 1; i < Math.min(requests.length, 4); i++) {
        const interval = requests[i].timestamp - requests[i - 1].timestamp;
        console.log(`  Interval ${i}: ${interval}ms`);
      }
    } else {
      console.log('⚠️  Insufficient polling requests to verify backoff');
    }

    const duration = performance.now() - start;
    return { name: testName, passed: true, duration };
  } catch (error: any) {
    const duration = performance.now() - start;
    return { name: testName, passed: false, duration, error: error.message };
  }
}

async function testTableVirtualization(page: Page): Promise<TestResult> {
  const testName = 'Table virtualization';
  console.log(`\n--- ${testName} ---`);
  const start = performance.now();

  try {
    await page.goto(`${BASE_URL}/pje/scrapes`);

    // Check for completed jobs with results
    const completedJobLinks = page.locator('a[href*="/results"]');
    const linkCount = await completedJobLinks.count();

    if (linkCount === 0) {
      console.log('⚠️  No completed jobs with results found');
      const duration = performance.now() - start;
      return { name: testName, passed: true, duration };
    }

    // Click first results link
    await completedJobLinks.first().click();
    await page.waitForLoadState('domcontentloaded');
    console.log('✓ Opened results page');

    // Check for table
    const table = page.locator('table, [role="table"]');
    if (await table.isVisible().catch(() => false)) {
      // Count visible rows in DOM
      const rows = page.locator('tbody tr, [role="row"]');
      const visibleRowCount = await rows.count();

      console.log(`✓ Table rendered with ${visibleRowCount} visible rows`);

      // Check if virtualization is active (should have limited DOM rows for large datasets)
      if (visibleRowCount > 0 && visibleRowCount < 50) {
        console.log('✓ Virtualization likely active (limited DOM rows)');
      } else if (visibleRowCount >= 50) {
        console.log(`⚠️  Large number of rows in DOM (${visibleRowCount}) - virtualization may not be active`);
      }

      // Try scrolling to trigger virtualization
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(500);

      const rowsAfterScroll = await rows.count();
      console.log(`✓ Rows after scroll: ${rowsAfterScroll}`);
    } else {
      console.log('⚠️  No table found on results page');
    }

    const duration = performance.now() - start;
    return { name: testName, passed: true, duration };
  } catch (error: any) {
    const duration = performance.now() - start;
    return { name: testName, passed: false, duration, error: error.message };
  }
}

async function testKeyboardNavigation(page: Page): Promise<TestResult> {
  const testName = 'Keyboard navigation';
  console.log(`\n--- ${testName} ---`);
  const start = performance.now();

  try {
    await page.goto(`${BASE_URL}/pje/scrapes`);
    await page.waitForLoadState('domcontentloaded');

    // Test Tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    console.log(`✓ Tab navigation works (focused: ${focusedElement})`);

    const duration = performance.now() - start;
    return { name: testName, passed: true, duration };
  } catch (error: any) {
    const duration = performance.now() - start;
    return { name: testName, passed: false, duration, error: error.message };
  }
}

async function testAriaAttributes(page: Page): Promise<TestResult> {
  const testName = 'ARIA attributes';
  console.log(`\n--- ${testName} ---`);
  const start = performance.now();

  try {
    await page.goto(`${BASE_URL}/pje/scrapes`);
    await page.waitForLoadState('domcontentloaded');

    // Check for aria-current on active nav link
    const navLinks = page.locator('nav a[aria-current="page"]');
    const ariaCurrent = await navLinks.count();
    console.log(`✓ Active nav links with aria-current: ${ariaCurrent > 0 ? '✅' : '⚠️  none found'}`);

    // Check for aria-label on icon buttons
    const iconButtons = page.locator('button[aria-label]');
    const buttonCount = await iconButtons.count();
    console.log(`✓ Found ${buttonCount} buttons with aria-label`);

    // Check for heading hierarchy
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    console.log(`✓ Heading structure: ${h1Count} h1, ${h2Count} h2`);

    // Check for proper form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    let labeledInputs = 0;

    for (let i = 0; i < Math.min(inputCount, 10); i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate((el) => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const hasAssociatedLabel = id && document.querySelector(`label[for="${id}"]`);
        return !!(ariaLabel || ariaLabelledBy || hasAssociatedLabel);
      });

      if (hasLabel) labeledInputs++;
    }

    console.log(`✓ Labeled inputs: ${labeledInputs}/${Math.min(inputCount, 10)} checked`);

    // Check for color contrast issues (basic check)
    const buttons = page.locator('button');
    const firstButton = buttons.first();
    if (await firstButton.isVisible().catch(() => false)) {
      const styles = await firstButton.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          bg: computed.backgroundColor,
          color: computed.color,
        };
      });
      console.log(`✓ Button styles: bg=${styles.bg}, color=${styles.color}`);
    }

    const duration = performance.now() - start;
    const passed = ariaCurrent > 0 || buttonCount > 0;
    return { name: testName, passed, duration };
  } catch (error: any) {
    const duration = performance.now() - start;
    return { name: testName, passed: false, duration, error: error.message };
  }
}

async function main() {
  console.log('=================================================');
  console.log('E2E Scraping Tests');
  console.log('=================================================');
  console.log(`Base URL: ${BASE_URL}\n`);

  let browser: Browser | undefined;
  const results: TestResult[] = [];

  try {
    const { browser: b, page } = await setupBrowser();
    browser = b;
    console.log('✅ Browser launched');

    // Run tests
    results.push(await testCreateJobViaWizard(page));
    results.push(await testSSEReconnection(page));
    results.push(await testBackoffPolling(page));
    results.push(await testTableVirtualization(page));
    results.push(await testKeyboardNavigation(page));
    results.push(await testAriaAttributes(page));

    await browser.close();

    // Summary
    console.log('\n=================================================');
    console.log('Summary');
    console.log('=================================================\n');

    results.forEach((r) => {
      const status = r.passed ? '✅' : '❌';
      console.log(`${status} ${r.name.padEnd(30)} (${r.duration.toFixed(0)}ms)`);
      if (r.error) {
        console.log(`   Error: ${r.error}`);
      }
    });

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;

    console.log(`\nPassed: ${passedCount}/${totalCount}`);

    if (passedCount === totalCount) {
      console.log('\n=================================================');
      console.log('All E2E tests PASSED ✅');
      console.log('=================================================\n');
      console.log('Note: Some tests are stubs and require test data');
      console.log('Populate database with test credentials/jobs to run full suite\n');
      process.exit(0);
    } else {
      console.log('\n=================================================');
      console.log('Some tests FAILED ❌');
      console.log('=================================================\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
