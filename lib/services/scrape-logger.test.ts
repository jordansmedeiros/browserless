/**
 * Unit Tests for Scrape Logger Service
 * Tests for improve-scrape-ux Phase 2 - Terminal Monitor
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { createJobLogger, scrapeLogEmitter, type LogEntry } from './scrape-logger';

describe('Scrape Logger Service', () => {
  const testJobId = 'test-job-123';
  let logger: ReturnType<typeof createJobLogger>;
  let receivedLogs: LogEntry[] = [];

  beforeEach(() => {
    logger = createJobLogger(testJobId);
    receivedLogs = [];

    // Listen to log events
    scrapeLogEmitter.on(`job-${testJobId}-log`, (log: LogEntry) => {
      receivedLogs.push(log);
    });
  });

  afterEach(() => {
    // Clean up event listeners
    scrapeLogEmitter.removeAllListeners(`job-${testJobId}-log`);
    receivedLogs = [];
  });

  describe('createJobLogger', () => {
    it('should create a logger for a specific job', () => {
      expect(logger).to.exist;
      expect(logger.info).to.be.a('function');
      expect(logger.success).to.be.a('function');
      expect(logger.warn).to.be.a('function');
      expect(logger.error).to.be.a('function');
    });

    it('should create different loggers for different jobs', () => {
      const logger1 = createJobLogger('job-1');
      const logger2 = createJobLogger('job-2');
      expect(logger1).to.not.equal(logger2);
    });
  });

  describe('logger.info', () => {
    it('should emit info log with correct level', () => {
      logger.info('Test info message');

      expect(receivedLogs).to.have.lengthOf(1);
      expect(receivedLogs[0].level).to.equal('info');
      expect(receivedLogs[0].message).to.equal('Test info message');
    });

    it('should include timestamp in ISO format', () => {
      logger.info('Test message');

      const log = receivedLogs[0];
      expect(log.timestamp).to.be.a('string');
      expect(new Date(log.timestamp).toISOString()).to.equal(log.timestamp);
    });

    it('should include optional context', () => {
      logger.info('Processing tribunal', { tribunalId: 'TRT3-1g', page: 1 });

      const log = receivedLogs[0];
      expect(log.context).to.deep.equal({ tribunalId: 'TRT3-1g', page: 1 });
    });

    it('should work without context', () => {
      logger.info('Simple message');

      const log = receivedLogs[0];
      expect(log.context).to.be.undefined;
    });
  });

  describe('logger.success', () => {
    it('should emit success log with correct level', () => {
      logger.success('Operation completed');

      expect(receivedLogs).to.have.lengthOf(1);
      expect(receivedLogs[0].level).to.equal('success');
      expect(receivedLogs[0].message).to.equal('Operation completed');
    });

    it('should include context data', () => {
      logger.success('Scraping completed', { processCount: 150, duration: 3500 });

      const log = receivedLogs[0];
      expect(log.context).to.deep.equal({ processCount: 150, duration: 3500 });
    });
  });

  describe('logger.warn', () => {
    it('should emit warning log with correct level', () => {
      logger.warn('Connection unstable');

      expect(receivedLogs).to.have.lengthOf(1);
      expect(receivedLogs[0].level).to.equal('warn');
      expect(receivedLogs[0].message).to.equal('Connection unstable');
    });
  });

  describe('logger.error', () => {
    it('should emit error log with correct level', () => {
      logger.error('Authentication failed');

      expect(receivedLogs).to.have.lengthOf(1);
      expect(receivedLogs[0].level).to.equal('error');
      expect(receivedLogs[0].message).to.equal('Authentication failed');
    });

    it('should include error details in context', () => {
      const errorDetails = {
        code: 'AUTH_FAILED',
        statusCode: 401,
        tribunal: 'TRT3-1g',
      };
      logger.error('Authentication error', errorDetails);

      const log = receivedLogs[0];
      expect(log.context).to.deep.equal(errorDetails);
    });
  });

  describe('log buffer', () => {
    it('should buffer logs for retrieval', () => {
      logger.info('Log 1');
      logger.info('Log 2');
      logger.success('Log 3');

      expect(receivedLogs).to.have.lengthOf(3);
      expect(receivedLogs[0].message).to.equal('Log 1');
      expect(receivedLogs[1].message).to.equal('Log 2');
      expect(receivedLogs[2].message).to.equal('Log 3');
    });

    it('should maintain log order', () => {
      const messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
      messages.forEach(msg => logger.info(msg));

      receivedLogs.forEach((log, index) => {
        expect(log.message).to.equal(messages[index]);
      });
    });
  });

  describe('log timestamps', () => {
    it('should have increasing timestamps', async () => {
      logger.info('Log 1');
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      logger.info('Log 2');

      const time1 = new Date(receivedLogs[0].timestamp).getTime();
      const time2 = new Date(receivedLogs[1].timestamp).getTime();

      expect(time2).to.be.greaterThan(time1);
    });
  });

  describe('multiple jobs', () => {
    it('should emit logs for different jobs independently', () => {
      const job1Logger = createJobLogger('job-1');
      const job2Logger = createJobLogger('job-2');

      const job1Logs: LogEntry[] = [];
      const job2Logs: LogEntry[] = [];

      scrapeLogEmitter.on('job-job-1-log', (log) => job1Logs.push(log));
      scrapeLogEmitter.on('job-job-2-log', (log) => job2Logs.push(log));

      job1Logger.info('Job 1 message');
      job2Logger.info('Job 2 message');

      expect(job1Logs).to.have.lengthOf(1);
      expect(job2Logs).to.have.lengthOf(1);
      expect(job1Logs[0].message).to.equal('Job 1 message');
      expect(job2Logs[0].message).to.equal('Job 2 message');

      // Cleanup
      scrapeLogEmitter.removeAllListeners('job-job-1-log');
      scrapeLogEmitter.removeAllListeners('job-job-2-log');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      logger.info('');

      expect(receivedLogs).to.have.lengthOf(1);
      expect(receivedLogs[0].message).to.equal('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      logger.info(longMessage);

      expect(receivedLogs[0].message).to.equal(longMessage);
    });

    it('should handle special characters in message', () => {
      const message = 'Test with 特殊字符 and émojis 🚀';
      logger.info(message);

      expect(receivedLogs[0].message).to.equal(message);
    });

    it('should handle null context gracefully', () => {
      logger.info('Test', null as any);

      expect(receivedLogs[0].message).to.equal('Test');
      // Context should be undefined or null, not throw error
    });

    it('should handle complex nested context', () => {
      const complexContext = {
        tribunal: { code: 'TRT3', grau: '1g' },
        stats: { total: 100, processed: 50 },
        metadata: { timestamp: Date.now(), user: 'system' },
      };

      logger.info('Complex log', complexContext);

      expect(receivedLogs[0].context).to.deep.equal(complexContext);
    });
  });
});
