/**
 * Teste de Responsividade
 * Testa as páginas do improve-scrape-ux em diferentes viewports
 */

import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
}

const VIEWPORTS: ViewportConfig[] = [
  {
    name: 'Mobile Small (iPhone SE)',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true
  },
  {
    name: 'Mobile Medium (iPhone 12)',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true
  },
  {
    name: 'Mobile Large (iPhone 12 Pro Max)',
    width: 428,
    height: 926,
    deviceScaleFactor: 3,
    isMobile: true
  },
  {
    name: 'Tablet Portrait (iPad)',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: false
  },
  {
    name: 'Tablet Landscape (iPad)',
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    isMobile: false
  },
  {
    name: 'Desktop Small (1366x768)',
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false
  },
  {
    name: 'Desktop Large (1920x1080)',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false
  }
];

const PAGES_TO_TEST = [
  {
    path: '/pje/scrapes',
    name: 'Wizard de Scraping',
    criticalElements: [
      'button:has-text("Novo Scraping")',
      '[role="dialog"]', // Modal do wizard
      'input[type="search"]' // Busca de tribunais
    ]
  },
  {
    path: '/pje/credentials',
    name: 'Gerenciamento de Credenciais',
    criticalElements: [
      'button:has-text("Adicionar")',
      'table, [role="table"]',
      'input'
    ]
  }
];

interface ResponsivenessIssue {
  viewport: string;
  page: string;
  issue: string;
  severity: 'error' | 'warning';
}

async function testPageResponsiveness(
  browser: Browser,
  page: typeof PAGES_TO_TEST[0],
  viewport: ViewportConfig,
  baseUrl: string
): Promise<ResponsivenessIssue[]> {
  const browserPage: Page = await browser.newPage({
    viewport: {
      width: viewport.width,
      height: viewport.height
    },
    deviceScaleFactor: viewport.deviceScaleFactor,
    isMobile: viewport.isMobile
  });

  const issues: ResponsivenessIssue[] = [];
  const url = `${baseUrl}${page.path}`;

  try {
    await browserPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Test 1: Verificar overflow horizontal
    const hasHorizontalScroll = await browserPage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalScroll) {
      issues.push({
        viewport: viewport.name,
        page: page.name,
        issue: 'Página tem scroll horizontal (overflow)',
        severity: 'error'
      });
    }

    // Test 2: Verificar elementos muito pequenos em mobile
    if (viewport.isMobile) {
      const smallElements = await browserPage.$$eval('button, a, input[type="button"], input[type="submit"]', (elements) => {
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        }).length;
      });

      if (smallElements > 0) {
        issues.push({
          viewport: viewport.name,
          page: page.name,
          issue: `${smallElements} elementos interativos menores que 44x44px (recomendação mobile)`,
          severity: 'warning'
        });
      }
    }

    // Test 3: Verificar se elementos críticos estão visíveis
    for (const selector of page.criticalElements) {
      try {
        const element = await browserPage.waitForSelector(selector, { timeout: 5000 });
        if (element) {
          const isVisible = await element.isVisible();
          if (!isVisible) {
            issues.push({
              viewport: viewport.name,
              page: page.name,
              issue: `Elemento crítico não visível: ${selector}`,
              severity: 'error'
            });
          }
        }
      } catch (error) {
        issues.push({
          viewport: viewport.name,
          page: page.name,
          issue: `Elemento crítico não encontrado: ${selector}`,
          severity: 'error'
        });
      }
    }

    // Test 4: Verificar texto sobreposto ou cortado
    const textOverflow = await browserPage.$$eval('*', (elements) => {
      let count = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'hidden' && el.scrollWidth > el.clientWidth) {
          count++;
        }
      });
      return count;
    });

    if (textOverflow > 10) {
      issues.push({
        viewport: viewport.name,
        page: page.name,
        issue: `${textOverflow} elementos com possível texto cortado`,
        severity: 'warning'
      });
    }

    // Test 5: Verificar modal/wizard em mobile
    if (viewport.isMobile && page.name.includes('Wizard')) {
      try {
        // Abrir wizard
        await browserPage.click('button:has-text("Novo Scraping")');
        await browserPage.waitForSelector('[role="dialog"]', { timeout: 5000 });

        // Verificar se modal ocupa bem o espaço
        const modalSize = await browserPage.$eval('[role="dialog"]', (el) => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
          };
        });

        // Modal não deve ser maior que viewport
        if (modalSize.width > modalSize.viewportWidth) {
          issues.push({
            viewport: viewport.name,
            page: page.name,
            issue: 'Modal mais largo que viewport',
            severity: 'error'
          });
        }

        // Modal deve ocupar espaço razoável em mobile
        if (viewport.isMobile && modalSize.width < modalSize.viewportWidth * 0.9) {
          issues.push({
            viewport: viewport.name,
            page: page.name,
            issue: 'Modal muito estreito em mobile (deve ocupar ~90% da largura)',
            severity: 'warning'
          });
        }
      } catch (error) {
        // Não conseguiu abrir wizard - já reportado em elementos críticos
      }
    }

  } catch (error: any) {
    issues.push({
      viewport: viewport.name,
      page: page.name,
      issue: `Erro ao carregar página: ${error.message}`,
      severity: 'error'
    });
  } finally {
    await browserPage.close();
  }

  return issues;
}

async function runResponsivenessTests() {
  console.log('📱 Teste de Responsividade - improve-scrape-ux\n');
  console.log('═'.repeat(70));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log(`Base URL: ${baseUrl}\n`);

  const browser = await chromium.launch({
    headless: true
  });

  const allIssues: ResponsivenessIssue[] = [];

  for (const viewport of VIEWPORTS) {
    console.log(`\n📐 Testando: ${viewport.name} (${viewport.width}x${viewport.height})`);

    for (const page of PAGES_TO_TEST) {
      console.log(`   → ${page.name}`);
      const issues = await testPageResponsiveness(browser, page, viewport, baseUrl);

      if (issues.length === 0) {
        console.log(`      ✅ Sem problemas`);
      } else {
        const errors = issues.filter(i => i.severity === 'error');
        const warnings = issues.filter(i => i.severity === 'warning');

        if (errors.length > 0) {
          console.log(`      ❌ ${errors.length} erro(s)`);
          errors.forEach(err => console.log(`         - ${err.issue}`));
        }

        if (warnings.length > 0) {
          console.log(`      ⚠️  ${warnings.length} aviso(s)`);
          warnings.forEach(warn => console.log(`         - ${warn.issue}`));
        }

        allIssues.push(...issues);
      }
    }
  }

  await browser.close();

  // Resumo
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESUMO DOS TESTES DE RESPONSIVIDADE\n');

  const errorCount = allIssues.filter(i => i.severity === 'error').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;

  console.log(`Total de viewports testados: ${VIEWPORTS.length}`);
  console.log(`Total de páginas testadas: ${PAGES_TO_TEST.length}`);
  console.log(`\n❌ Erros: ${errorCount}`);
  console.log(`⚠️  Avisos: ${warningCount}`);

  // Agrupar issues por página
  console.log('\n📄 ISSUES POR PÁGINA:\n');

  const issuesByPage = allIssues.reduce((acc, issue) => {
    if (!acc[issue.page]) acc[issue.page] = [];
    acc[issue.page].push(issue);
    return acc;
  }, {} as Record<string, ResponsivenessIssue[]>);

  Object.entries(issuesByPage).forEach(([pageName, issues]) => {
    console.log(`${pageName}:`);
    issues.forEach(issue => {
      const icon = issue.severity === 'error' ? '  ❌' : '  ⚠️';
      console.log(`${icon} [${issue.viewport}] ${issue.issue}`);
    });
    console.log();
  });

  // Recomendações
  console.log('💡 RECOMENDAÇÕES:\n');
  console.log('☐ Usar unidades responsivas (rem, em, %, vw/vh)');
  console.log('☐ Implementar breakpoints com Tailwind (sm:, md:, lg:)');
  console.log('☐ Testar touch targets >= 44x44px em mobile');
  console.log('☐ Evitar scroll horizontal');
  console.log('☐ Usar max-width para modals em telas pequenas');
  console.log('☐ Testar funcionalidade com DevTools mobile simulator');
  console.log('☐ Verificar font-size legível em mobile (>=16px)');

  // Status final
  console.log();
  if (errorCount === 0 && warningCount === 0) {
    console.log('✅ EXCELENTE: Nenhum problema de responsividade encontrado');
    process.exit(0);
  } else if (errorCount === 0) {
    console.log('✅ BOM: Apenas avisos, sem erros críticos');
    process.exit(0);
  } else if (errorCount <= 5) {
    console.log('⚠️  ATENÇÃO: Alguns erros encontrados, correção recomendada');
    process.exit(0);
  } else {
    console.log('❌ CRÍTICO: Muitos erros de responsividade, correção necessária');
    process.exit(1);
  }
}

// Executar
runResponsivenessTests().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
