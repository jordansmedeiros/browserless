/**
 * Performance Tests for Terminal Monitor
 * Tests for improve-scrape-ux - verifica performance com grandes volumes de logs
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { createJobLogger, scrapeLoggerService } from '../../lib/services/scrape-logger';

describe('Terminal Monitor - Performance Tests', () => {
  const testJobId = 'perf-test-job';
  let startTime: number;

  beforeEach(() => {
    scrapeLoggerService.clearJobLogs(testJobId);
    startTime = Date.now();
  });

  afterEach(() => {
    scrapeLoggerService.clearJobLogs(testJobId);
    scrapeLoggerService.removeAllListeners();
  });

  describe('High Volume Logging', () => {
    it('deve processar 1000 logs em menos de 1 segundo', () => {
      const logger = createJobLogger(testJobId);
      const logCount = 1000;

      for (let i = 0; i < logCount; i++) {
        logger.info(`Log entry ${i}`, { index: i, timestamp: Date.now() });
      }

      const duration = Date.now() - startTime;
      const logs = scrapeLoggerService.getJobLogs(testJobId);

      expect(logs).to.have.lengthOf(logCount);
      expect(duration).to.be.lessThan(1000); // Menos de 1 segundo

      console.log(`    ✓ ${logCount} logs processados em ${duration}ms`);
    });

    it('deve processar 10000 logs mantendo buffer limitado', () => {
      const logger = createJobLogger(testJobId);
      const logCount = 10000;

      for (let i = 0; i < logCount; i++) {
        logger.info(`Log entry ${i}`);
      }

      const duration = Date.now() - startTime;
      const logs = scrapeLoggerService.getJobLogs(testJobId);

      // Buffer deve estar limitado a 1000
      expect(logs).to.have.lengthOf(1000);
      expect(duration).to.be.lessThan(5000); // Menos de 5 segundos

      console.log(`    ✓ ${logCount} logs processados em ${duration}ms (buffer limitado a 1000)`);
    });

    it('deve manter performance constante com logs grandes', () => {
      const logger = createJobLogger(testJobId);
      const logCount = 500;
      const largeMessage = 'X'.repeat(1000); // 1KB por mensagem

      for (let i = 0; i < logCount; i++) {
        logger.info(largeMessage, {
          index: i,
          data: Array(10).fill('extra data')
        });
      }

      const duration = Date.now() - startTime;
      const logs = scrapeLoggerService.getJobLogs(testJobId);

      expect(logs).to.have.lengthOf(logCount);
      expect(duration).to.be.lessThan(2000); // Menos de 2 segundos

      const avgTimePerLog = duration / logCount;
      expect(avgTimePerLog).to.be.lessThan(5); // < 5ms por log

      console.log(`    ✓ ${logCount} logs de 1KB processados em ${duration}ms (${avgTimePerLog.toFixed(2)}ms/log)`);
    });
  });

  describe('Event Emission Performance', () => {
    it('deve emitir 1000 eventos sem degradação', (done) => {
      const logger = createJobLogger(testJobId);
      const eventCount = 1000;
      let receivedCount = 0;

      scrapeLoggerService.attachLogListener(testJobId, () => {
        receivedCount++;
        if (receivedCount === eventCount) {
          const duration = Date.now() - startTime;
          expect(duration).to.be.lessThan(2000);
          console.log(`    ✓ ${eventCount} eventos emitidos em ${duration}ms`);
          done();
        }
      });

      for (let i = 0; i < eventCount; i++) {
        logger.info(`Event ${i}`);
      }
    });

    it('deve suportar múltiplos listeners simultaneamente', (done) => {
      const logger = createJobLogger(testJobId);
      const eventCount = 500;
      const listenerCount = 5;

      const counters = Array(listenerCount).fill(0);

      for (let i = 0; i < listenerCount; i++) {
        scrapeLoggerService.attachLogListener(testJobId, () => {
          counters[i]++;

          // Todos os listeners receberam todos os eventos
          if (counters.every(c => c === eventCount)) {
            const duration = Date.now() - startTime;
            expect(duration).to.be.lessThan(3000);
            console.log(`    ✓ ${listenerCount} listeners, ${eventCount} eventos cada em ${duration}ms`);
            done();
          }
        });
      }

      for (let i = 0; i < eventCount; i++) {
        logger.info(`Multi-listener event ${i}`);
      }
    });
  });

  describe('Memory Management', () => {
    it('não deve vazar memória com logs contínuos', () => {
      const logger = createJobLogger(testJobId);
      const iterations = 5;
      const logsPerIteration = 2000;

      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < logsPerIteration; i++) {
          logger.info(`Iteration ${iter}, Log ${i}`);
        }

        // Buffer deve sempre ter no máximo 1000 logs
        const logs = scrapeLoggerService.getJobLogs(testJobId);
        expect(logs).to.have.lengthOf(1000);
      }

      const duration = Date.now() - startTime;
      console.log(`    ✓ ${iterations * logsPerIteration} logs em ${iterations} iterações (${duration}ms)`);
    });

    it('deve limpar logs corretamente', () => {
      const logger = createJobLogger(testJobId);

      // Criar logs
      for (let i = 0; i < 1000; i++) {
        logger.info(`Log ${i}`);
      }

      expect(scrapeLoggerService.getJobLogCount(testJobId)).to.equal(1000);

      // Limpar
      scrapeLoggerService.clearJobLogs(testJobId);

      expect(scrapeLoggerService.getJobLogCount(testJobId)).to.equal(0);

      // Verificar que pode adicionar novos logs após limpar
      // Precisa criar um novo logger depois de limpar
      const newLogger = createJobLogger(testJobId);
      newLogger.info('New log after clear');
      expect(scrapeLoggerService.getJobLogCount(testJobId)).to.equal(1);
    });
  });

  describe('Concurrent Jobs Performance', () => {
    it('deve gerenciar 10 jobs simultaneamente', () => {
      const jobCount = 10;
      const logsPerJob = 500;
      const loggers = [];

      // Criar múltiplos jobs
      for (let j = 0; j < jobCount; j++) {
        const jobId = `concurrent-job-${j}`;
        const logger = createJobLogger(jobId);
        loggers.push({ jobId, logger });

        for (let i = 0; i < logsPerJob; i++) {
          logger.info(`Job ${j}, Log ${i}`);
        }
      }

      const duration = Date.now() - startTime;

      // Verificar que cada job tem seus logs isolados
      loggers.forEach(({ jobId, logger }) => {
        const logs = scrapeLoggerService.getJobLogs(jobId);
        expect(logs).to.have.lengthOf(logsPerJob);
      });

      expect(duration).to.be.lessThan(3000);
      console.log(`    ✓ ${jobCount} jobs com ${logsPerJob} logs cada em ${duration}ms`);

      // Cleanup
      loggers.forEach(({ jobId }) => {
        scrapeLoggerService.clearJobLogs(jobId);
      });
    });
  });

  describe('Realistic Scraping Scenario', () => {
    it('deve simular scraping de 50 tribunais com logs realistas', () => {
      const logger = createJobLogger(testJobId);
      const tribunalCount = 50;
      const processesPerTribunal = 20;

      // Simular início do job
      logger.info(`Iniciando scraping de ${tribunalCount} tribunais`);

      for (let t = 0; t < tribunalCount; t++) {
        const tribunalId = `TRT${t + 1}`;

        logger.info(`Tribunal ${tribunalId}: Iniciando`, { tribunal: tribunalId });
        logger.info(`Tribunal ${tribunalId}: Autenticando credenciais`);
        logger.success(`Tribunal ${tribunalId}: Login bem-sucedido`);

        for (let p = 0; p < processesPerTribunal; p++) {
          const processNumber = `${100000 + (t * 1000) + p}`;

          if (p % 10 === 0) {
            logger.info(`Tribunal ${tribunalId}: Processando ${processNumber}`, {
              tribunal: tribunalId,
              processo: processNumber,
              progress: `${p}/${processesPerTribunal}`
            });
          }
        }

        logger.success(`Tribunal ${tribunalId}: Concluído`, {
          processCount: processesPerTribunal,
          duration: Math.random() * 5000
        });
      }

      logger.success(`Scraping concluído`, {
        tribunalCount,
        totalProcesses: tribunalCount * processesPerTribunal,
        duration: Date.now() - startTime
      });

      const duration = Date.now() - startTime;
      const logCount = scrapeLoggerService.getJobLogCount(testJobId);

      console.log(`    ✓ Simulação realística: ${tribunalCount} tribunais, ${logCount} logs em ${duration}ms`);

      // Performance deve ser razoável
      expect(duration).to.be.lessThan(5000);

      // Buffer limitado, mas deve ter logs relevantes
      expect(logCount).to.be.at.most(1000);
    });
  });
});
