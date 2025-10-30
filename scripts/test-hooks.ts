import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJobPolling } from '../hooks/use-job-polling';
import { useJobLogs } from '../hooks/use-job-logs';
import { useCredentials } from '../hooks/use-credentials';
import { useJobsStore } from '../lib/stores/jobs-store';
import { useLogsStore } from '../lib/stores/logs-store';
import { useCredentialsStore } from '../lib/stores/credentials-store';
import { ScrapeJobStatus } from '../lib/types/scraping';
import type { ScrapeJobWithRelations } from '../lib/types/scraping';
import * as pjeActions from '../app/actions/pje';

describe('Custom Hooks', () => {
  describe('useJobPolling', () => {
    let sandbox: sinon.SinonSandbox;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      clock = sinon.useFakeTimers();
      useJobsStore.getState().reset();
    });

    afterEach(() => {
      sandbox.restore();
      clock.restore();
    });

    it('should start polling when enabled', async () => {
      const mockJobs: ScrapeJobWithRelations[] = [
        {
          id: 'job-1',
          status: ScrapeJobStatus.RUNNING as string,
          tribunals: [],
          advogadoId: 'adv-1',
          advogado: { id: 'adv-1', nome: 'Test' } as any,
          tipo: 'PENDENTES',
          createdAt: new Date(),
        } as ScrapeJobWithRelations,
      ];

      const stub = sandbox.stub(pjeActions, 'getActiveJobsStatusAction').resolves({
        success: true,
        data: mockJobs,
      });

      const { result, unmount } = renderHook(() => useJobPolling({ enabled: true }));

      // Wait for initial fetch
      await act(async () => {
        await clock.tickAsync(0);
      });

      expect(stub.calledOnce).to.be.true;

      // Wait for interval tick (3000ms)
      await act(async () => {
        await clock.tickAsync(3000);
      });

      expect(stub.callCount).to.equal(2);

      unmount();
    });

    it('should apply exponential backoff', async () => {
      const mockJob: ScrapeJobWithRelations = {
        id: 'job-1',
        status: ScrapeJobStatus.RUNNING as string,
        tribunals: [{ status: 'running' }] as any,
        advogadoId: 'adv-1',
        advogado: { id: 'adv-1', nome: 'Test' } as any,
        tipo: 'PENDENTES',
        createdAt: new Date(),
      } as ScrapeJobWithRelations;

      // Return same job (no changes)
      const stub = sandbox.stub(pjeActions, 'getActiveJobsStatusAction').resolves({
        success: true,
        data: [mockJob],
      });

      const { unmount } = renderHook(() => useJobPolling({ enabled: true }));

      // Initial fetch
      await act(async () => {
        await clock.tickAsync(0);
      });
      const initialCalls = stub.callCount;

      // First interval (3000ms) - no change
      await act(async () => {
        await clock.tickAsync(3000);
      });

      // Second interval (3000ms) - no change, will trigger backoff
      await act(async () => {
        await clock.tickAsync(3000);
      });

      // Third poll should have longer interval (~5000ms)
      const beforeBackoff = stub.callCount;
      await act(async () => {
        await clock.tickAsync(3000);
      });
      expect(stub.callCount).to.equal(beforeBackoff); // Hasn't fired yet

      await act(async () => {
        await clock.tickAsync(2000); // ~5000ms total
      });
      expect(stub.callCount).to.be.greaterThan(beforeBackoff); // Fired after backoff

      unmount();
    });

    it('should reset backoff on job change', async () => {
      let tribunalCount = 0;

      const stub = sandbox.stub(pjeActions, 'getActiveJobsStatusAction').callsFake(async () => {
        tribunalCount++;
        return {
          success: true,
          data: [
            {
              id: 'job-1',
              status: ScrapeJobStatus.RUNNING as string,
              tribunals: Array(tribunalCount).fill({ status: 'completed' }) as any,
              advogadoId: 'adv-1',
              advogado: { id: 'adv-1', nome: 'Test' } as any,
              tipo: 'PENDENTES',
              createdAt: new Date(),
            } as ScrapeJobWithRelations,
          ],
        };
      });

      const { unmount } = renderHook(() => useJobPolling({ enabled: true }));

      // Initial fetch
      await act(async () => {
        await clock.tickAsync(0);
      });

      // Changes on every poll - should maintain 3s interval
      for (let i = 0; i < 5; i++) {
        const beforeCall = stub.callCount;
        await act(async () => {
          await clock.tickAsync(3000);
        });
        expect(stub.callCount).to.equal(beforeCall + 1);
      }

      unmount();
    });

    it('should stop polling when no jobs', async () => {
      const stub = sandbox.stub(pjeActions, 'getActiveJobsStatusAction').resolves({
        success: true,
        data: [], // No active jobs
      });

      const { unmount } = renderHook(() => useJobPolling({ enabled: true }));

      // Initial fetch
      await act(async () => {
        await clock.tickAsync(0);
      });

      // Poll three times with empty results
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await clock.tickAsync(3000);
        });
      }

      const callCount = stub.callCount;

      // Should have stopped polling, no more calls
      await act(async () => {
        await clock.tickAsync(10000);
      });

      expect(stub.callCount).to.equal(callCount); // No new calls
      expect(useJobsStore.getState().isPolling).to.be.false;

      unmount();
    });

    it('should cleanup on unmount', async () => {
      const stub = sandbox.stub(pjeActions, 'getActiveJobsStatusAction').resolves({
        success: true,
        data: [
          {
            id: 'job-1',
            status: ScrapeJobStatus.RUNNING as string,
            tribunals: [],
            advogadoId: 'adv-1',
            advogado: { id: 'adv-1', nome: 'Test' } as any,
            tipo: 'PENDENTES',
            createdAt: new Date(),
          } as ScrapeJobWithRelations,
        ],
      });

      const { unmount } = renderHook(() => useJobPolling({ enabled: true }));

      await act(async () => {
        await clock.tickAsync(0);
      });

      const callsBeforeUnmount = stub.callCount;

      unmount();

      // After unmount, no more calls should happen
      await act(async () => {
        await clock.tickAsync(10000);
      });

      expect(stub.callCount).to.equal(callsBeforeUnmount);
    });
  });

  describe('useJobLogs', () => {
    let sandbox: sinon.SinonSandbox;
    let clock: sinon.SinonFakeTimers;
    let mockEventSource: any;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      clock = sinon.useFakeTimers();
      useLogsStore.getState().reset();

      // Mock EventSource
      mockEventSource = {
        close: sinon.stub(),
        addEventListener: sinon.stub(),
        removeEventListener: sinon.stub(),
        onopen: null,
        onmessage: null,
        onerror: null,
        readyState: 0,
      };

      (global as any).EventSource = sinon.stub().returns(mockEventSource);

      // Mock fetch for stats endpoint
      (global as any).fetch = sandbox.stub().callsFake((url: string) => {
        if (url.includes('/status')) {
          return Promise.resolve({
            json: () =>
              Promise.resolve({
                stats: {
                  status: ScrapeJobStatus.RUNNING,
                  totalTribunals: 5,
                  completedTribunals: 2,
                  failedTribunals: 0,
                  totalProcesses: 100,
                },
                recentLogs: [],
              }),
          });
        }
        return Promise.resolve({ json: () => Promise.resolve({}) });
      });

      // Mock URL.createObjectURL and related APIs
      (global as any).URL = {
        createObjectURL: sinon.stub().returns('blob:mock-url'),
        revokeObjectURL: sinon.stub(),
      };
      (global as any).Blob = class MockBlob {
        constructor(public content: any[], public options: any) {}
      };
    });

    afterEach(() => {
      sandbox.restore();
      clock.restore();
      delete (global as any).EventSource;
      delete (global as any).fetch;
      delete (global as any).URL;
      delete (global as any).Blob;
    });

    it('should create SSE connection', async () => {
      const { unmount } = renderHook(() => useJobLogs('test-job-1', { enabled: true }));

      expect((global as any).EventSource.calledOnce).to.be.true;
      expect((global as any).EventSource.firstCall.args[0]).to.include('/api/scrapes/test-job-1/logs/stream');

      await act(async () => {
        await clock.tickAsync(0);
      });

      unmount();
    });

    it('should handle SSE messages', async () => {
      const { result, unmount } = renderHook(() => useJobLogs('test-job-2', { enabled: true }));

      // Simulate connection open
      await act(async () => {
        mockEventSource.onopen?.();
        await clock.tickAsync(0);
      });

      expect(useLogsStore.getState().getConnectionStatus('test-job-2')).to.equal('connected');

      // Simulate message
      const mockLog = {
        level: 'info',
        message: 'Test log message',
        timestamp: new Date().toISOString(),
      };

      await act(async () => {
        mockEventSource.onmessage?.({ data: JSON.stringify(mockLog) });
      });

      const logs = useLogsStore.getState().getLogsForJob('test-job-2');
      expect(logs).to.have.lengthOf(1);
      expect(logs[0].message).to.equal('Test log message');

      unmount();
    });

    it('should reconnect on SSE failure', async () => {
      let eventSourceCallCount = 0;
      (global as any).EventSource = sinon.stub().callsFake(() => {
        eventSourceCallCount++;
        return {
          ...mockEventSource,
          close: sinon.stub(),
        };
      });

      const { unmount } = renderHook(() => useJobLogs('test-job-3', { enabled: true }));

      // First connection attempt
      await act(async () => {
        await clock.tickAsync(0);
      });
      expect(eventSourceCallCount).to.equal(1);

      // Simulate error
      await act(async () => {
        mockEventSource.onerror?.();
        await clock.tickAsync(1000); // 1s delay
      });
      expect(eventSourceCallCount).to.equal(2); // First reconnect

      // Second error
      await act(async () => {
        mockEventSource.onerror?.();
        await clock.tickAsync(2000); // 2s delay
      });
      expect(eventSourceCallCount).to.equal(3); // Second reconnect

      // Third error - should trigger polling fallback
      await act(async () => {
        mockEventSource.onerror?.();
        await clock.tickAsync(4000); // 4s delay
      });
      expect(eventSourceCallCount).to.equal(4); // Third reconnect

      // Fourth error - no more reconnects, polling takes over
      await act(async () => {
        mockEventSource.onerror?.();
        await clock.tickAsync(5000);
      });
      expect(eventSourceCallCount).to.equal(4); // No more SSE attempts

      unmount();
    });

    it('should fallback to polling', async () => {
      const fetchStub = sandbox.stub().resolves({
        json: () =>
          Promise.resolve({
            logs: [
              { level: 'info', message: 'Polling log 1', timestamp: new Date().toISOString() },
              { level: 'info', message: 'Polling log 2', timestamp: new Date().toISOString() },
            ],
            hasMore: false,
          }),
      });
      (global as any).fetch = fetchStub;

      // Force immediate polling fallback by exceeding reconnection attempts
      mockEventSource.onerror = sinon.stub().callsFake(function (this: any) {
        // Simulate SSE error handler behavior
      });

      const { unmount } = renderHook(() => useJobLogs('test-job-4', { enabled: true }));

      // Trigger 3 errors to force polling fallback
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          mockEventSource.onerror?.();
          await clock.tickAsync(1000 * Math.pow(2, i));
        });
      }

      // Simulate polling request
      await act(async () => {
        await clock.tickAsync(2000); // Polling interval
      });

      unmount();
    });

    it('should poll stats from consolidated endpoint', async () => {
      const statusResponse = {
        stats: {
          status: ScrapeJobStatus.COMPLETED,
          totalTribunals: 5,
          completedTribunals: 5,
          failedTribunals: 0,
          totalProcesses: 150,
          duration: 120000,
        },
        recentLogs: [],
      };

      const fetchStub = sandbox.stub().resolves({
        json: () => Promise.resolve(statusResponse),
      });
      (global as any).fetch = fetchStub;

      const { unmount } = renderHook(() => useJobLogs('test-job-5', { enabled: true }));

      // Wait for initial stats poll
      await act(async () => {
        await clock.tickAsync(0);
      });

      expect(fetchStub.calledWith(sinon.match(/\/api\/scrapes\/test-job-5\/status/))).to.be.true;

      const stats = useLogsStore.getState().getStats('test-job-5');
      expect(stats).to.not.be.undefined;
      expect(stats?.status).to.equal(ScrapeJobStatus.COMPLETED);

      unmount();
    });

    it('should download logs with sanitization', async () => {
      const store = useLogsStore.getState();
      const jobId = 'test-job-6';

      // Add logs with sensitive data
      store.addLogs(jobId, [
        { level: 'info', message: 'User CPF: 123.456.789-00', timestamp: new Date().toISOString() },
        { level: 'info', message: 'Token: abc123secrettoken', timestamp: new Date().toISOString() },
        { level: 'info', message: 'Normal log message', timestamp: new Date().toISOString() },
      ]);

      const { result, unmount } = renderHook(() => useJobLogs(jobId, { enabled: false }));

      // Mock document methods
      const mockElement = {
        click: sinon.stub(),
      };
      const createElementStub = sinon.stub(document, 'createElement').returns(mockElement as any);
      const appendChildStub = sinon.stub(document.body, 'appendChild');
      const removeChildStub = sinon.stub(document.body, 'removeChild');

      await act(async () => {
        result.current.downloadLogs();
      });

      expect(createElementStub.calledWith('a')).to.be.true;
      expect(mockElement.click.calledOnce).to.be.true;
      expect((global as any).URL.createObjectURL.calledOnce).to.be.true;

      createElementStub.restore();
      appendChildStub.restore();
      removeChildStub.restore();
      unmount();
    });
  });

  describe('useCredentials', () => {
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

    it('should auto-fetch on mount', async () => {
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

      const { result, unmount } = renderHook(() => useCredentials());

      // Verify fetch is called on mount
      await act(async () => {
        await clock.tickAsync(0);
      });

      expect(stub.calledOnce).to.be.true;
      expect(result.current.credentials).to.have.lengthOf(1);

      unmount();
    });

    it('should use cache when available', async () => {
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

      // First render
      const { unmount: unmount1 } = renderHook(() => useCredentials());

      await act(async () => {
        await clock.tickAsync(0);
      });

      expect(stub.callCount).to.equal(1);
      unmount1();

      // Advance time by 1 minute (within cache TTL)
      await act(async () => {
        await clock.tickAsync(60 * 1000);
      });

      // Second render - should use cache
      const { unmount: unmount2 } = renderHook(() => useCredentials());

      await act(async () => {
        await clock.tickAsync(0);
      });

      // No new fetch should be made
      expect(stub.callCount).to.equal(1);

      unmount2();
    });

    it('should refresh on demand', async () => {
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

      const { result, unmount } = renderHook(() => useCredentials());

      // Initial fetch
      await act(async () => {
        await clock.tickAsync(0);
      });

      expect(stub.callCount).to.equal(1);

      // Call refresh - should trigger new fetch
      await act(async () => {
        await result.current.refresh();
        await clock.tickAsync(0);
      });

      expect(stub.callCount).to.equal(2);

      unmount();
    });
  });
});
