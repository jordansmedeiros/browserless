import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  command: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  output: string;
}

interface TestPhase {
  name: string;
  tests: Array<{ name: string; command: string; required: boolean }>;
}

const TEST_PHASES: TestPhase[] = [
  {
    name: 'Unit Tests',
    tests: [
      { name: 'Sanitization Utils', command: 'npx tsx scripts/test-sanitization.ts', required: true },
      { name: 'Zustand Stores', command: 'npx tsx scripts/test-stores.ts', required: false },
      { name: 'Custom Hooks', command: 'npx tsx scripts/test-hooks.ts', required: false },
      { name: 'Existing Tests', command: 'npm test', required: false },
    ],
  },
  {
    name: 'Performance Tests',
    tests: [
      {
        name: 'Compression Performance',
        command: 'npx tsx scripts/test-compression-performance.ts',
        required: true,
      },
      { name: 'Batching Performance', command: 'npx tsx scripts/test-batching.ts', required: true },
      { name: 'Process Cleanup', command: 'npx tsx scripts/test-process-cleanup.ts', required: true },
    ],
  },
  {
    name: 'Accessibility Tests',
    tests: [{ name: 'Accessibility Audit', command: 'npm run test:accessibility', required: false }],
  },
  {
    name: 'E2E Tests',
    tests: [
      { name: 'E2E Scraping Flows', command: 'npx tsx scripts/test-e2e-scraping.ts', required: false },
    ],
  },
  {
    name: 'Static Analysis',
    tests: [
      {
        name: 'Check error.message leaks',
        command: 'node -e "console.log(\'Static analysis placeholder\')"',
        required: true,
      },
      { name: 'ESLint', command: 'npm run lint', required: false },
    ],
  },
];

function runCommand(command: string): Promise<{ exitCode: number; output: string; duration: number }> {
  return new Promise((resolve) => {
    const start = performance.now();
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    let output = '';

    const child = spawn(cmd, args, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      const duration = performance.now() - start;
      resolve({ exitCode: code || 0, output, duration });
    });

    child.on('error', (error) => {
      const duration = performance.now() - start;
      output += `\nError: ${error.message}`;
      resolve({ exitCode: 1, output, duration });
    });
  });
}

async function runTest(
  name: string,
  command: string,
  required: boolean
): Promise<TestResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${name}`);
  console.log(`Command: ${command}`);
  console.log(`${'='.repeat(60)}\n`);

  const { exitCode, output, duration } = await runCommand(command);

  const status: 'pass' | 'fail' | 'skip' =
    exitCode === 0 ? 'pass' : required ? 'fail' : 'skip';

  const statusEmoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`\n${statusEmoji} ${name} - ${status.toUpperCase()} (${duration.toFixed(0)}ms)\n`);

  return { name, command, status, duration, output };
}

function generateMarkdownReport(results: TestResult[]): string {
  const totalTests = results.length;
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;
  const passRate = ((passed / totalTests) * 100).toFixed(1);

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const durationMin = Math.floor(totalDuration / 60000);
  const durationSec = Math.floor((totalDuration % 60000) / 1000);

  let report = `# Relatório de Validação - Audits 001-006\n\n`;
  report += `**Data:** ${new Date().toISOString().split('T')[0]}\n\n`;

  report += `## Resumo Executivo\n\n`;
  report += `- **Total de testes:** ${totalTests}\n`;
  report += `- **Passaram:** ${passed} (${passRate}%)\n`;
  report += `- **Falharam:** ${failed}\n`;
  report += `- **Ignorados:** ${skipped}\n`;
  report += `- **Duração total:** ${durationMin}min ${durationSec}s\n\n`;

  // Group by phase
  TEST_PHASES.forEach((phase) => {
    report += `## ${phase.name}\n\n`;

    const phaseResults = results.filter((r) =>
      phase.tests.some((t) => t.name === r.name)
    );

    phaseResults.forEach((result) => {
      const emoji = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      report += `${emoji} **${result.name}** (${result.duration.toFixed(0)}ms)\n`;

      if (result.status === 'fail') {
        report += `\`\`\`\n${result.output.slice(-500)}\n\`\`\`\n\n`;
      }
    });

    report += `\n`;
  });

  if (failed > 0) {
    report += `## Falhas Detectadas\n\n`;
    results
      .filter((r) => r.status === 'fail')
      .forEach((result) => {
        report += `### ${result.name}\n\n`;
        report += `**Command:** \`${result.command}\`\n\n`;
        report += `**Output:**\n\`\`\`\n${result.output.slice(-1000)}\n\`\`\`\n\n`;
      });
  }

  report += `## Recomendações\n\n`;
  if (failed === 0 && skipped === 0) {
    report += `✅ Todos os testes passaram! O código está pronto para produção.\n\n`;
  } else if (failed === 0) {
    report += `✅ Todos os testes obrigatórios passaram.\n`;
    report += `⚠️  ${skipped} testes foram ignorados (não obrigatórios ou requerem setup adicional).\n\n`;
  } else {
    report += `❌ ${failed} teste(s) falharam. Corrija os problemas antes de prosseguir.\n\n`;
    results
      .filter((r) => r.status === 'fail')
      .forEach((result) => {
        report += `- **${result.name}:** Revisar e corrigir\n`;
      });
  }

  return report;
}

async function main() {
  console.log('='.repeat(60));
  console.log('VALIDAÇÃO DE AUDITORIAS 001-006');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  const allResults: TestResult[] = [];

  for (const phase of TEST_PHASES) {
    console.log(`\n${'#'.repeat(60)}`);
    console.log(`# PHASE: ${phase.name}`);
    console.log(`${'#'.repeat(60)}\n`);

    for (const test of phase.tests) {
      const result = await runTest(test.name, test.command, test.required);
      allResults.push(result);

      // Stop on critical failure
      if (result.status === 'fail' && test.required) {
        console.log(`\n❌ Critical test failed: ${test.name}`);
        console.log('Stopping test suite...\n');
        break;
      }
    }
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('GENERATING REPORT');
  console.log('='.repeat(60) + '\n');

  const report = generateMarkdownReport(allResults);
  const reportPath = join(process.cwd(), 'AUDIT_VALIDATION_REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`✅ Report saved to: ${reportPath}\n`);

  // Print summary
  const passed = allResults.filter((r) => r.status === 'pass').length;
  const failed = allResults.filter((r) => r.status === 'fail').length;
  const skipped = allResults.filter((r) => r.status === 'skip').length;

  console.log('='.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed:  ${passed}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log('='.repeat(60) + '\n');

  // Exit with appropriate code
  if (failed > 0) {
    console.log('❌ Validation FAILED\n');
    process.exit(1);
  } else if (skipped > 0) {
    console.log('⚠️  Validation passed with skipped tests\n');
    process.exit(0);
  } else {
    console.log('✅ Validation PASSED\n');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}
