/**
 * Auditoria de Acessibilidade
 * Testa acessibilidade das páginas do improve-scrape-ux usando Lighthouse
 */

import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';

interface AccessibilityScore {
  page: string;
  score: number;
  violations: string[];
  warnings: string[];
}

const PAGES_TO_TEST = [
  {
    path: '/pje/scrapes',
    name: 'Scrapes List (Wizard)',
    description: 'Página principal com wizard de scraping'
  },
  {
    path: '/pje/scrapes/mock-job-id',
    name: 'Results Viewer',
    description: 'Visualizador de resultados de scraping'
  },
  {
    path: '/pje/credentials',
    name: 'Credentials Management',
    description: 'Gerenciamento de credenciais'
  }
];

const ACCESSIBILITY_CHECKS = {
  keyboard: [
    'Navegação por Tab funciona corretamente',
    'Foco visível em elementos interativos',
    'Modais podem ser fechados com Escape',
    'Formulários podem ser submetidos com Enter'
  ],
  screenReader: [
    'Elementos têm labels descritivos',
    'ARIA roles estão corretos',
    'Landmarks estão presentes (main, nav, aside)',
    'Headings estão em ordem hierárquica'
  ],
  visual: [
    'Contraste de texto atende WCAG AA (4.5:1)',
    'Botões têm tamanho mínimo de 44x44px',
    'Links são distinguíveis de texto normal',
    'Estados de foco são visíveis'
  ],
  forms: [
    'Inputs têm labels associados',
    'Erros de validação são anunciados',
    'Campos required são marcados',
    'Autocomplete está configurado quando apropriado'
  ]
};

async function testPageAccessibility(browser: Browser, page: typeof PAGES_TO_TEST[0], baseUrl: string): Promise<AccessibilityScore> {
  const browserPage: Page = await browser.newPage();
  const url = `${baseUrl}${page.path}`;

  console.log(`\n📋 Testando: ${page.name}`);
  console.log(`   URL: ${url}`);

  try {
    await browserPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const violations: string[] = [];
    const warnings: string[] = [];

    // Test 1: Verificar headings hierarquia
    const headings = await browserPage.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
      elements.map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.trim() || '',
        hasId: el.hasAttribute('id')
      }))
    );

    let prevLevel = 0;
    headings.forEach((heading, index) => {
      if (index > 0 && heading.level - prevLevel > 1) {
        violations.push(`Hierarquia de headings quebrada: h${prevLevel} → h${heading.level}`);
      }
      prevLevel = heading.level;
    });

    if (headings.length === 0) {
      violations.push('Nenhum heading encontrado na página');
    }

    console.log(`   ✓ Headings: ${headings.length} encontrados`);

    // Test 2: Verificar ARIA labels em elementos interativos
    const interactiveElements = await browserPage.$$eval(
      'button, a, input, select, textarea, [role="button"], [role="link"]',
      (elements) => elements.map(el => ({
        tag: el.tagName,
        hasAriaLabel: el.hasAttribute('aria-label'),
        hasAriaLabelledBy: el.hasAttribute('aria-labelledby'),
        hasText: (el.textContent?.trim() || '').length > 0,
        type: el.getAttribute('type'),
        role: el.getAttribute('role')
      }))
    );

    const unlabeledInteractive = interactiveElements.filter(
      el => !el.hasAriaLabel && !el.hasAriaLabelledBy && !el.hasText
    );

    if (unlabeledInteractive.length > 0) {
      violations.push(`${unlabeledInteractive.length} elementos interativos sem label`);
    }

    console.log(`   ✓ Elementos interativos: ${interactiveElements.length} (${unlabeledInteractive.length} sem label)`);

    // Test 3: Verificar inputs com labels
    const inputs = await browserPage.$$eval('input, textarea, select', (elements) =>
      elements.map(el => ({
        id: el.getAttribute('id'),
        name: el.getAttribute('name'),
        type: el.getAttribute('type'),
        hasLabel: !!document.querySelector(`label[for="${el.getAttribute('id')}"]`),
        hasAriaLabel: el.hasAttribute('aria-label'),
        placeholder: el.getAttribute('placeholder')
      }))
    );

    const unlabeledInputs = inputs.filter(
      input => !input.hasLabel && !input.hasAriaLabel && input.type !== 'hidden'
    );

    if (unlabeledInputs.length > 0) {
      violations.push(`${unlabeledInputs.length} inputs sem label`);
    }

    console.log(`   ✓ Inputs: ${inputs.length} (${unlabeledInputs.length} sem label)`);

    // Test 4: Verificar landmarks
    const landmarks = await browserPage.$$eval('[role="main"], [role="navigation"], [role="complementary"], main, nav, aside', (elements) =>
      elements.map(el => el.getAttribute('role') || el.tagName.toLowerCase())
    );

    if (!landmarks.includes('main') && !landmarks.includes('main')) {
      warnings.push('Landmark <main> não encontrado');
    }

    console.log(`   ✓ Landmarks: ${landmarks.join(', ') || 'nenhum'}`);

    // Test 5: Verificar alt em imagens
    const images = await browserPage.$$eval('img', (elements) =>
      elements.map(el => ({
        src: el.getAttribute('src'),
        alt: el.getAttribute('alt'),
        role: el.getAttribute('role')
      }))
    );

    const imagesWithoutAlt = images.filter(img => img.alt === null && img.role !== 'presentation');

    if (imagesWithoutAlt.length > 0) {
      violations.push(`${imagesWithoutAlt.length} imagens sem atributo alt`);
    }

    console.log(`   ✓ Imagens: ${images.length} (${imagesWithoutAlt.length} sem alt)`);

    // Test 6: Verificar contraste (simplificado - apenas aviso)
    const hasLowContrast = await browserPage.$$eval('*', (elements) => {
      let count = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const textContent = el.textContent?.trim();

        if (textContent && textContent.length > 0) {
          const color = style.color;
          const bgColor = style.backgroundColor;

          // Simplificação: apenas detectar texto preto em fundo branco ou vice-versa
          if ((color === 'rgb(0, 0, 0)' && bgColor === 'rgb(255, 255, 255)') ||
              (color === 'rgb(255, 255, 255)' && bgColor === 'rgb(0, 0, 0)')) {
            // OK
          } else if (color && bgColor && color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
            count++;
          }
        }
      });
      return count;
    });

    if (hasLowContrast > 50) {
      warnings.push('Muitos elementos com possível baixo contraste (recomendado: verificação manual)');
    }

    console.log(`   ✓ Contraste: ${hasLowContrast} elementos para revisão manual`);

    // Calcular score
    const maxViolations = 10;
    const violationPenalty = violations.length * 10;
    const warningPenalty = warnings.length * 5;
    const score = Math.max(0, 100 - violationPenalty - warningPenalty);

    console.log(`   📊 Score: ${score}/100`);

    if (violations.length > 0) {
      console.log(`   ❌ Violações (${violations.length}):`);
      violations.forEach(v => console.log(`      - ${v}`));
    }

    if (warnings.length > 0) {
      console.log(`   ⚠️  Avisos (${warnings.length}):`);
      warnings.forEach(w => console.log(`      - ${w}`));
    }

    return {
      page: page.name,
      score,
      violations,
      warnings
    };

  } catch (error: any) {
    console.error(`   ❌ Erro ao testar ${page.name}:`, error.message);
    return {
      page: page.name,
      score: 0,
      violations: [`Erro ao carregar página: ${error.message}`],
      warnings: []
    };
  } finally {
    await browserPage.close();
  }
}

async function runAccessibilityAudit() {
  console.log('🔍 Auditoria de Acessibilidade - improve-scrape-ux\n');
  console.log('═'.repeat(60));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log(`Base URL: ${baseUrl}\n`);

  const browser = await chromium.launch({
    headless: true
  });

  const results: AccessibilityScore[] = [];

  for (const page of PAGES_TO_TEST) {
    const result = await testPageAccessibility(browser, page, baseUrl);
    results.push(result);
  }

  await browser.close();

  // Resumo
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMO DA AUDITORIA\n');

  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  results.forEach(result => {
    const emoji = result.score >= 90 ? '✅' : result.score >= 70 ? '⚠️' : '❌';
    console.log(`${emoji} ${result.page}: ${result.score}/100`);
  });

  console.log(`\n📈 Score Médio: ${avgScore.toFixed(1)}/100`);
  console.log(`❌ Total de Violações: ${totalViolations}`);
  console.log(`⚠️  Total de Avisos: ${totalWarnings}`);

  // Recomendações
  console.log('\n💡 RECOMENDAÇÕES:\n');

  Object.entries(ACCESSIBILITY_CHECKS).forEach(([category, checks]) => {
    console.log(`${category.toUpperCase()}:`);
    checks.forEach(check => console.log(`  ☐ ${check}`));
    console.log();
  });

  // Status final
  if (avgScore >= 90) {
    console.log('✅ APROVADO: Acessibilidade está em bom nível');
    process.exit(0);
  } else if (avgScore >= 70) {
    console.log('⚠️  ATENÇÃO: Acessibilidade precisa de melhorias');
    process.exit(0);
  } else {
    console.log('❌ REPROVADO: Acessibilidade precisa de correções urgentes');
    process.exit(1);
  }
}

// Executar
runAccessibilityAudit().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
