import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { useJobsStore } from '../lib/stores/jobs-store';
import { useLogsStore } from '../lib/stores/logs-store';
import { useCredentialsStore } from '../lib/stores/credentials-store';
import { ScrapeJobStatus } from '../lib/types/scraping';
import type { ScrapeJobWithRelations } from '../lib/types/scraping';
import * as pjeActions from '../app/actions/pje';

describe('Zustand Stores', () => {
  describe('JobsStore', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      useJobsStore.getState().reset();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should fetch active jobs', async () => {
      const mockJobs: ScrapeJobWithRelations[] = [
        {
          id: 'job-1',
          status: ScrapeJobStatus.RUNNING as string,
          tribunals: [],
          advogadoId: 'adv-1',
          advogado: { id: 'adv-1', nome: 'Test' } as any,
          tipo: 'PENDENTES',
          createdAt: new Date(),
          startedAt: new Date(),
        } as ScrapeJobWithRelations,
        {
          id: 'job-2',
          status: ScrapeJobStatus.PENDING as string,
          tribunals: [],
          advogadoId: 'adv-1',
          advogado: { id: 'adv-1', nome: 'Test' } as any,
          tipo: 'PENDENTES',
          createdAt: new Date(),
        } as ScrapeJobWithRelations,
        {
          id: 'job-3',
          status: ScrapeJobStatus.COMPLETED as string,
          tribunals: [],
          advogadoId: 'adv-1',
          advogado: { id: 'adv-1', nome: 'Test' } as any,
          tipo: 'PENDENTES',
          createdAt: new Date(),
          completedAt: new Date(),
        } as ScrapeJobWithRelations,
      ];

      const stub = sandbox.stub(pjeActions, 'getActiveJobsStatusAction').resolves({
        success: true,
        data: mockJobs,
      });

      const store = useJobsStore.getState();
      const beforeFetch = Date.now();
      await store.fetchActiveJobs();

      // Validate only pending/running jobs were stored
      expect(store.activeJobs).to.have.lengthOf(2);
      expect(store.activeJobs.map((j) => j.id)).to.deep.equal(['job-1', 'job-2']);
      expect(store.lastFetch).to.be.at.least(beforeFetch);
      expect(stub.calledOnce).to.be.true;
    });

    it('should perform optimistic cancel', async () => {
      const mockJob: ScrapeJobWithRelations = {
        id: 'job-1',
        status: ScrapeJobStatus.RUNNING as string,
        tribunals: [],
        advogadoId: 'adv-1',
        advogado: { id: 'adv-1', nome: 'Test' } as any,
        tipo: 'PENDENTES',
        createdAt: new Date(),
        startedAt: new Date(),
      } as ScrapeJobWithRelations;

      const store = useJobsStore.getState();
      store.addJob(mockJob);
      expect(store.activeJobs).to.have.lengthOf(1);

      const stub = sandbox.stub(pjeActions, 'cancelScrapeJobAction').resolves({
        success: true,
      });

      const promise = store.cancelJob('job-1');

      // Check optimistic update
      expect(store.activeJobs[0].status).to.equal(ScrapeJobStatus.CANCELED);

      await promise;

      // Check job was removed after success
      expect(store.activeJobs).to.have.lengthOf(0);
      expect(stub.calledOnceWith('job-1')).to.be.true;
    });

    it('should revert optimistic update on failure', async () => {
      const mockJob: ScrapeJobWithRelations = {
        id: 'job-1',
        status: ScrapeJobStatus.RUNNING as string,
        tribunals: [],
        advogadoId: 'adv-1',
        advogado: { id: 'adv-1', nome: 'Test' } as any,
        tipo: 'PENDENTES',
        createdAt: new Date(),
        startedAt: new Date(),
      } as ScrapeJobWithRelations;

      const store = useJobsStore.getState();
      store.addJob(mockJob);

      const stub = sandbox.stub(pjeActions, 'cancelScrapeJobAction').resolves({
        success: false,
        error: 'Cancel failed',
      });

      const promise = store.cancelJob('job-1');

      // Check optimistic update
      expect(store.activeJobs[0].status).to.equal(ScrapeJobStatus.CANCELED);

      await promise;

      // Check job was reverted to original state
      expect(store.activeJobs).to.have.lengthOf(1);
      expect(store.activeJobs[0].status).to.equal(ScrapeJobStatus.RUNNING);
      expect(store.error).to.equal('Cancel failed');
      expect(stub.calledOnceWith('job-1')).to.be.true;
    });

    it('should filter running jobs correctly', () => {
      const store = useJobsStore.getState();

      store.addJob({
        id: 'job-1',
        status: ScrapeJobStatus.RUNNING as string,
        tribunals: [],
        advogadoId: 'adv-1',
        advogado: { id: 'adv-1', nome: 'Test' } as any,
        tipo: 'PENDENTES',
        createdAt: new Date(),
      } as ScrapeJobWithRelations);

      store.addJob({
        id: 'job-2',
        status: ScrapeJobStatus.PENDING as string,
        tribunals: [],
        advogadoId: 'adv-1',
        advogado: { id: 'adv-1', nome: 'Test' } as any,
        tipo: 'PENDENTES',
        createdAt: new Date(),
      } as ScrapeJobWithRelations);

      const runningJobs = store.getRunningJobs();
      expect(runningJobs).to.have.lengthOf(1);
      expect(runningJobs[0].id).to.equal('job-1');
    });

    it('should filter pending jobs correctly', () => {
      const store = useJobsStore.getState();

      store.addJob({
        id: 'job-1',
        status: ScrapeJobStatus.RUNNING as string,
        tribunals: [],
        advogadoId: 'adv-1',
        advogado: { id: 'adv-1', nome: 'Test' } as any,
        tipo: 'PENDENTES',
        createdAt: new Date(),
      } as ScrapeJobWithRelations);

      store.addJob({
        id: 'job-2',
        status: ScrapeJobStatus.PENDING as string,
        tribunals: [],
        advogadoId: 'adv-1',
        advogado: { id: 'adv-1', nome: 'Test' } as any,
        tipo: 'PENDENTES',
        createdAt: new Date(),
      } as ScrapeJobWithRelations);

      const pendingJobs = store.getPendingJobs();
      expect(pendingJobs).to.have.lengthOf(1);
      expect(pendingJobs[0].id).to.equal('job-2');
    });

    it('should get job by ID', () => {
      const store = useJobsStore.getState();

      store.addJob({
        id: 'job-1',
        status: ScrapeJobStatus.RUNNING as string,
        tribunals: [],
        advogadoId: 'adv-1',
        advogado: { id: 'adv-1', nome: 'Test' } as any,
        tipo: 'PENDENTES',
        createdAt: new Date(),
      } as ScrapeJobWithRelations);

      const job = store.getJobById('job-1');
      expect(job).to.not.be.undefined;
      expect(job?.id).to.equal('job-1');

      const nonExistent = store.getJobById('non-existent');
      expect(nonExistent).to.be.undefined;
    });
  });

  describe('LogsStore', () => {
    beforeEach(() => {
      useLogsStore.getState().reset();
    });

    it('should enforce MAX_LOGS_PER_JOB limit', () => {
      const store = useLogsStore.getState();
      const jobId = 'test-job-1';
      const MAX_LOGS_PER_JOB = 1000;

      // Add 1500 logs
      for (let i = 0; i < 1500; i++) {
        store.addLog(jobId, {
          level: 'info',
          message: `Log ${i}`,
          timestamp: new Date().toISOString(),
        });
      }

      const logs = store.getLogsForJob(jobId);
      expect(logs).to.have.lengthOf(MAX_LOGS_PER_JOB);

      // Validate oldest logs were removed (first 500)
      expect(logs[0].message).to.equal('Log 500');
      expect(logs[logs.length - 1].message).to.equal('Log 1499');
    });

    it('should handle batch log additions', () => {
      const store = useLogsStore.getState();
      const jobId = 'test-job-2';

      // Add 500 logs at once
      const batch1 = Array.from({ length: 500 }, (_, i) => ({
        level: 'info' as const,
        message: `Batch1 Log ${i}`,
        timestamp: new Date().toISOString(),
      }));

      store.addLogs(jobId, batch1);
      expect(store.getLogsForJob(jobId)).to.have.lengthOf(500);

      // Add 600 more logs
      const batch2 = Array.from({ length: 600 }, (_, i) => ({
        level: 'info' as const,
        message: `Batch2 Log ${i}`,
        timestamp: new Date().toISOString(),
      }));

      store.addLogs(jobId, batch2);

      // Validate total is 1000 (limit enforced)
      const logs = store.getLogsForJob(jobId);
      expect(logs).to.have.lengthOf(1000);

      // Validate oldest 100 logs from batch1 were removed
      expect(logs[0].message).to.equal('Batch1 Log 100');
      expect(logs[logs.length - 1].message).to.equal('Batch2 Log 599');
    });

    it('should track connection status', () => {
      const store = useLogsStore.getState();
      const jobId = 'test-job-3';

      // Default status
      expect(store.getConnectionStatus(jobId)).to.equal('disconnected');

      // Set to connecting
      store.setConnectionStatus(jobId, 'connecting');
      expect(store.getConnectionStatus(jobId)).to.equal('connecting');

      // Set to connected
      store.setConnectionStatus(jobId, 'connected');
      expect(store.getConnectionStatus(jobId)).to.equal('connected');

      // Set to error
      store.setConnectionStatus(jobId, 'error');
      expect(store.getConnectionStatus(jobId)).to.equal('error');
    });

    it('should store and retrieve stats', () => {
      const store = useLogsStore.getState();
      const jobId = 'test-job-4';

      const stats = {
        status: 'running',
        totalTribunals: 10,
        completedTribunals: 5,
        failedTribunals: 1,
        totalProcesses: 150,
        duration: 3600,
        startedAt: new Date(),
      };

      store.setStats(jobId, stats);

      const retrieved = store.getStats(jobId);
      expect(retrieved).to.deep.equal(stats);
    });
  });

  describe('CredentialsStore', () => {
    let sandbox: sinon.SinonSandbox;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      clock = sinon.useFakeTimers();
      useCredentialsStore.getState().reset();
    });

    afterEach(() => {
      sandbox.restore();
      clock.restore();
    });

    it('should respect cache TTL', async () => {
      const mockAdvogados = [
        {
          id: 'adv-1',
          nome: 'Test Advogado',
          credenciais: [
            {
              id: 'cred-1',
              advogadoId: 'adv-1',
              loginUrl: 'http://test.com',
              ativa: true,
            },
          ],
        },
      ];

      const stub = sandbox.stub(pjeActions, 'listAdvogadosAction').resolves({
        success: true,
        data: mockAdvogados,
      });

      const store = useCredentialsStore.getState();

      // First call - should make request
      await store.fetchCredentials();
      expect(stub.callCount).to.equal(1);
      expect(store.credentials).to.have.lengthOf(1);

      // Second call within 5 minutes - should use cache
      clock.tick(60 * 1000); // 1 minute
      await store.fetchCredentials();
      expect(stub.callCount).to.equal(1); // No new call

      // Advance time by 6 minutes total (cache expired)
      clock.tick(5 * 60 * 1000); // 5 more minutes = 6 minutes total
      await store.fetchCredentials();
      expect(stub.callCount).to.equal(2); // New call made
    });

    it('should invalidate cache on demand', async () => {
      const mockAdvogados = [
        {
          id: 'adv-1',
          nome: 'Test Advogado',
          credenciais: [
            {
              id: 'cred-1',
              advogadoId: 'adv-1',
              loginUrl: 'http://test.com',
              ativa: true,
            },
          ],
        },
      ];

      const stub = sandbox.stub(pjeActions, 'listAdvogadosAction').resolves({
        success: true,
        data: mockAdvogados,
      });

      const store = useCredentialsStore.getState();

      // First fetch
      await store.fetchCredentials();
      expect(stub.callCount).to.equal(1);

      // Invalidate cache
      store.invalidate();

      // Second fetch - should make new request
      await store.fetchCredentials();
      expect(stub.callCount).to.equal(2);
    });

    it('should filter active credentials', () => {
      const store = useCredentialsStore.getState();

      // Manually set credentials with mix of active/inactive
      store.setCredentials([
        {
          id: 'cred-1',
          advogadoId: 'adv-1',
          loginUrl: 'http://test1.com',
          ativa: true,
          advogado: { id: 'adv-1', nome: 'Test 1' } as any,
        } as any,
        {
          id: 'cred-2',
          advogadoId: 'adv-1',
          loginUrl: 'http://test2.com',
          ativa: false,
          advogado: { id: 'adv-1', nome: 'Test 1' } as any,
        } as any,
        {
          id: 'cred-3',
          advogadoId: 'adv-2',
          loginUrl: 'http://test3.com',
          ativa: true,
          advogado: { id: 'adv-2', nome: 'Test 2' } as any,
        } as any,
      ]);

      const activeCredentials = store.getActiveCredentials();
      expect(activeCredentials).to.have.lengthOf(2);
      expect(activeCredentials.map((c) => c.id)).to.deep.equal(['cred-1', 'cred-3']);
    });

    it('should get credential by ID', () => {
      const store = useCredentialsStore.getState();

      store.setCredentials([
        {
          id: 'cred-1',
          advogadoId: 'adv-1',
          loginUrl: 'http://test1.com',
          ativa: true,
          advogado: { id: 'adv-1', nome: 'Test 1' } as any,
        } as any,
      ]);

      const credential = store.getCredentialById('cred-1');
      expect(credential).to.not.be.undefined;
      expect(credential?.id).to.equal('cred-1');

      const nonExistent = store.getCredentialById('non-existent');
      expect(nonExistent).to.be.undefined;
    });

    it('should filter credentials by advogado', () => {
      const store = useCredentialsStore.getState();

      store.setCredentials([
        {
          id: 'cred-1',
          advogadoId: 'adv-1',
          loginUrl: 'http://test1.com',
          ativa: true,
          advogado: { id: 'adv-1', nome: 'Test 1' } as any,
        } as any,
        {
          id: 'cred-2',
          advogadoId: 'adv-1',
          loginUrl: 'http://test2.com',
          ativa: true,
          advogado: { id: 'adv-1', nome: 'Test 1' } as any,
        } as any,
        {
          id: 'cred-3',
          advogadoId: 'adv-2',
          loginUrl: 'http://test3.com',
          ativa: true,
          advogado: { id: 'adv-2', nome: 'Test 2' } as any,
        } as any,
      ]);

      const adv1Credentials = store.getCredentialsByAdvogado('adv-1');
      expect(adv1Credentials).to.have.lengthOf(2);
      expect(adv1Credentials.map((c) => c.id)).to.deep.equal(['cred-1', 'cred-2']);
    });
  });
});
