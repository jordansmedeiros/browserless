# PJE Scraping Interface - Technical Design

## Context

The PJE scraping interface needs to orchestrate execution of existing scraping scripts across multiple tribunals, manage job state, and provide real-time feedback to users. The system must handle:

- Concurrent execution of multiple scraping operations
- Long-running operations (scraping can take minutes per tribunal)
- Credential management and authentication
- Error handling and retry logic
- Result storage and retrieval
- Real-time progress updates

Key constraints:
- Existing scraping scripts are standalone Node.js scripts using Puppeteer
- Scripts currently use environment variables for credentials
- Each script performs its own login and data retrieval
- Scripts output JSON files to disk
- No existing job queue or worker system

## Goals / Non-Goals

### Goals
- Create a user-friendly interface for configuring and executing scraping jobs
- Integrate existing scraping scripts without major refactoring
- Store job history and results persistently in database
- Provide real-time progress feedback to users
- Handle errors gracefully with retry capabilities
- Support concurrent execution of multiple jobs

### Non-Goals
- Rewriting existing scraping scripts from scratch
- Real-time streaming of scraping data (batch processing is acceptable)
- WebSocket-based real-time updates (polling is acceptable for MVP)
- Distributed job processing across multiple servers (single-server queue is sufficient)
- Advanced job scheduling (cron, recurring jobs) - only manual triggering

## Decisions

### Decision 1: Job Queue Architecture - Simple In-Memory Queue

**Choice**: Implement a simple in-memory job queue using async task management

**Alternatives considered**:
1. **BullMQ with Redis**:
   - Pros: Robust, persistent queue, distributed support, automatic retries
   - Cons: Adds Redis dependency, overkill for single-server deployment, complex setup

2. **Bee-Queue**:
   - Pros: Lightweight, Redis-based, good for simple jobs
   - Cons: Still requires Redis, less actively maintained

3. **Simple in-memory queue**:
   - Pros: No external dependencies, simple implementation, sufficient for current needs
   - Cons: Jobs lost on server restart, no distributed support

**Rationale**:
- Current deployment is single-server
- Job loss on restart is acceptable (users can re-create jobs)
- Simplicity aligns with project conventions (avoid frameworks without justification)
- Can migrate to Redis-based queue later if needed

**Implementation**:
```typescript
// lib/services/scrape-queue.ts
class ScrapeQueue {
  private queue: ScrapeJob[] = [];
  private running: Set<string> = new Set();
  private maxConcurrentJobs = 2;

  async enqueue(job: ScrapeJob): Promise<void>
  async process(): Promise<void>
  async cancel(jobId: string): Promise<void>
}
```

### Decision 2: Script Integration - Subprocess Execution

**Choice**: Execute scraping scripts as subprocesses with parameter passing

**Alternatives considered**:
1. **Refactor scripts as ES modules and import**:
   - Pros: Better error handling, shared memory, easier testing
   - Cons: Requires significant script refactoring, browser instances share memory

2. **Subprocess execution with environment variables**:
   - Pros: Minimal script changes, process isolation, existing pattern
   - Cons: Environment variable passing for credentials

3. **Subprocess with command-line arguments**:
   - Pros: Clear parameter passing, process isolation
   - Cons: Requires script modifications to accept CLI args

**Rationale**:
- Scripts already work well as standalone processes
- Process isolation prevents memory leaks from affecting main server
- Each script can have its own browser instance
- Minimal changes to existing scripts (just parameter acceptance)

**Implementation**:
```typescript
// lib/services/scrape-executor.ts
async function executeScript(
  scriptPath: string,
  credentials: CredencialParaLogin,
  tribunal: TribunalConfig
): Promise<ScrapingResult> {
  const env = {
    ...process.env,
    PJE_CPF: credentials.cpf,
    PJE_SENHA: credentials.senha,
    PJE_ID_ADVOGADO: credentials.idAdvogado,
    PJE_BASE_URL: tribunal.baseUrl,
  };

  const result = await execAsync(`node ${scriptPath}`, { env });
  return JSON.parse(result.stdout);
}
```

### Decision 3: Script Modifications - Return Structured JSON to stdout

**Choice**: Modify scripts to output structured JSON result to stdout instead of files

**Rationale**:
- Enables capturing results in memory without file I/O
- Provides standardized result format across all scripts
- Simplifies error handling and result parsing
- Files can still be written for debugging if needed

**Migration path**:
- Scripts keep existing file output for backward compatibility
- Add JSON output to stdout as last operation
- Executor parses stdout for result

**Example script modification**:
```javascript
// At end of script:
console.log(JSON.stringify({
  success: true,
  processosCount: processos.length,
  processos: processos,
  timestamp: new Date().toISOString()
}));
```

### Decision 4: Progress Updates - Polling with 3-Second Interval

**Choice**: Client polls server every 3 seconds for job status updates

**Alternatives considered**:
1. **WebSocket real-time updates**:
   - Pros: True real-time, efficient for high-frequency updates
   - Cons: Adds WebSocket infrastructure, complexity, overkill for 3s updates

2. **Server-Sent Events (SSE)**:
   - Pros: Simpler than WebSocket, uni-directional updates
   - Cons: HTTP connection per client, still adds complexity

3. **Polling**:
   - Pros: Simple, works with existing REST API, no new infrastructure
   - Cons: Slight delay (3s), more HTTP requests

**Rationale**:
- Scraping jobs run for minutes, not milliseconds - 3s delay is acceptable
- Polling is simpler and aligns with "boring, proven patterns"
- Can upgrade to WebSocket later if needed
- Most users will have 1-5 active jobs, minimal server load

**Implementation**:
```typescript
// Client-side polling
useEffect(() => {
  if (activeJobs.length === 0) return;

  const interval = setInterval(async () => {
    const updated = await fetchJobStatuses(activeJobs.map(j => j.id));
    setActiveJobs(updated);
  }, 3000);

  return () => clearInterval(interval);
}, [activeJobs]);
```

### Decision 5: Result Storage - JSON Column with Compression

**Choice**: Store scraping results as compressed JSON in PostgreSQL JSONB column

**Alternatives considered**:
1. **Separate Processo table with relations**:
   - Pros: Normalized, easier querying, relational integrity
   - Cons: Complex migrations, slow inserts for thousands of records

2. **File storage (disk/S3)**:
   - Pros: Handles large datasets, cheap storage
   - Cons: Adds file management complexity, harder to query

3. **JSON column with compression**:
   - Pros: Simple, keeps data with execution, PostgreSQL JSONB is fast
   - Cons: Limited querying capabilities on process data

**Rationale**:
- Scraping results are primarily for viewing/exporting, not querying
- Keeping results with execution record simplifies data model
- PostgreSQL JSONB handles MB-sized documents efficiently
- Compression (gzip) reduces storage for repetitive JSON

**Implementation**:
```prisma
model ScrapeExecution {
  id               String   @id @default(uuid())
  resultData       Json?    // Compressed JSON: { processos: ProcessoPJE[] }
  processosCount   Int      @default(0)
  // ... other fields
}
```

```typescript
// Compression helper
function compressResult(data: any): Buffer {
  return gzipSync(JSON.stringify(data));
}

function decompressResult(buffer: Buffer): any {
  return JSON.parse(gunzipSync(buffer).toString());
}
```

### Decision 6: Concurrent Execution - Configurable Limits

**Choice**: Allow configurable concurrent execution at job and tribunal levels

**Configuration**:
- Max concurrent jobs: 2 (system-wide)
- Max concurrent tribunals per job: 3
- Max browser instances: 10 (system-wide)

**Rationale**:
- Prevents resource exhaustion (each browser uses ~200MB RAM)
- Respects anti-bot detection (too many parallel requests = suspicious)
- Allows reasonable throughput (can scrape 3 tribunals in parallel)
- Configurable via environment variables for tuning

**Implementation**:
```typescript
// config/scraping.ts
export const SCRAPING_CONFIG = {
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2'),
  maxConcurrentTribunals: parseInt(process.env.MAX_CONCURRENT_TRIBUNALS || '3'),
  maxBrowserInstances: parseInt(process.env.MAX_BROWSER_INSTANCES || '10'),
  retryAttempts: 3,
  retryDelays: [30000, 60000, 120000], // 30s, 60s, 120s
};
```

### Decision 7: Error Classification and Retry Logic

**Choice**: Classify errors and apply automatic retry for transient failures

**Error categories**:
1. **Authentication errors** (non-retryable): Invalid credentials, expired session
2. **Network errors** (retryable): Timeout, connection refused
3. **Rate limit** (retryable): HTTP 429, CloudFront blocking
4. **PJE system errors** (retryable): 500, 503 responses
5. **Script errors** (non-retryable): Bug in script, invalid data format

**Retry strategy**:
- Retry up to 3 times with exponential backoff (30s, 60s, 120s)
- Only retry transient errors (network, rate limit, system errors)
- Log all retry attempts in execution logs

**Implementation**:
```typescript
async function executeWithRetry(
  execution: () => Promise<Result>,
  isRetryable: (error: Error) => boolean
): Promise<Result> {
  const delays = [30000, 60000, 120000];

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      return await execution();
    } catch (error) {
      if (!isRetryable(error) || attempt === 3) throw error;
      await delay(delays[attempt]);
    }
  }
}
```

## Risks / Trade-offs

### Risk 1: In-Memory Queue Job Loss

**Risk**: Server restart causes all queued/running jobs to be lost

**Mitigation**:
- Store job status in database (pending, running, completed)
- On server start, check for jobs with status "running" and mark as "interrupted"
- Provide UI to manually re-run interrupted jobs
- Future: Migrate to Redis-based persistent queue if needed

### Risk 2: Long-Running Requests in Next.js

**Risk**: Next.js has 60-second timeout for API routes, scraping can take longer

**Mitigation**:
- Job creation returns immediately after queuing (doesn't wait for execution)
- Execution happens in background (separate async process)
- Client polls for status updates
- Consider moving to separate worker process if timeouts occur

### Risk 3: Script Subprocess Management

**Risk**: Zombie processes if script crashes or server dies during execution

**Mitigation**:
- Wrap script execution in try/catch with timeout
- Kill subprocess after 10-minute timeout
- Clean up child processes on server shutdown (SIGTERM handler)
- Monitor process count and alert if growing unexpectedly

### Risk 4: Database Storage Limits

**Risk**: Storing thousands of processes per execution could exceed row size limits

**Mitigation**:
- Compress JSON data before storing (gzip reduces size by ~70%)
- PostgreSQL JSONB limit is ~1GB per row (sufficient for 10k+ processes)
- If needed, split large results across multiple rows
- Provide option to export to file instead of storing in DB

### Risk 5: Anti-Bot Detection from Concurrent Scraping

**Risk**: Too many concurrent scraping operations triggers CloudFront WAF

**Mitigation**:
- Limit concurrent executions (default: 3 tribunals in parallel)
- Add random delays between requests (500-1000ms)
- Stagger job starts (don't start all tribunals simultaneously)
- Monitor for rate limiting errors and adjust concurrency dynamically

## Migration Plan

### Phase 1: Core Infrastructure (Week 1)
1. Create database schema (ScrapeJob, ScrapeJobTribunal, ScrapeExecution)
2. Implement basic in-memory queue (`ScrapeQueue`)
3. Implement script executor (`ScrapeExecutor`)
4. Create server actions for job management

### Phase 2: Script Integration (Week 1-2)
1. Modify existing scripts to output structured JSON
2. Update scripts to accept credentials as environment variables
3. Test script execution via subprocess
4. Implement error handling and retry logic

### Phase 3: UI Implementation (Week 2)
1. Create scraping configuration form component
2. Implement tribunal selector with bulk actions
3. Build active jobs monitor with progress bars
4. Create job history table with filtering

### Phase 4: Testing and Refinement (Week 2-3)
1. End-to-end testing with all scrape types
2. Load testing with multiple concurrent jobs
3. Error scenario testing (auth failures, network issues)
4. Performance tuning and optimization

### Rollback Plan
- Feature is additive, doesn't affect existing functionality
- If critical issues found, disable job creation in UI
- Command-line scraping scripts continue to work independently
- Database migrations can be rolled back via Prisma

## Open Questions

1. **Should we support job scheduling (cron)?**
   - Decision: No, out of scope for MVP. Manual triggering only.

2. **Should we implement job priority?**
   - Decision: No, FIFO queue is sufficient. All jobs have equal priority.

3. **Should we allow pausing jobs?**
   - Decision: No for MVP. Only cancel is supported. Pause adds complexity.

4. **How to handle very large result sets (50k+ processes)?**
   - Decision: Start with compressed JSON storage. If issues arise, implement pagination or file export.

5. **Should we deduplicate processes across scraping executions?**
   - Decision: No, out of scope. Each execution stores independent snapshot.
