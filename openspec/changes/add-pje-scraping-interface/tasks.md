# Implementation Tasks - PJE Scraping Interface

## 1. Database Schema ✅

- [x] 1.1 Create `ScrapeJob` model in Prisma schema
- [x] 1.2 Create `ScrapeJobTribunal` model with foreign keys
- [x] 1.3 Create `ScrapeExecution` model with result storage
- [x] 1.4 Add indexes for performance (status + createdAt on ScrapeJob)
- [x] 1.5 Generate and run Prisma migration
- [x] 1.6 Update TypeScript types from Prisma client

## 2. TypeScript Types and Interfaces ✅

- [x] 2.1 Create `lib/types/scraping.ts` with core types
- [x] 2.2 Define `ScrapeJobStatus` enum (pending, running, completed, failed, canceled)
- [x] 2.3 Define `ScrapeType` enum (acervo_geral, pendentes, arquivados, minha_pauta)
- [x] 2.4 Define `ScrapeSubType` enum (com_dado_ciencia, sem_prazo)
- [x] 2.5 Create `ScrapeJobWithRelations` type (job + tribunals + executions)
- [x] 2.6 Create `CreateScrapeJobInput` interface
- [x] 2.7 Create `ScrapingResult` interface for script output
- [x] 2.8 Export types in `lib/types/index.ts`

## 3. Scraping Configuration ✅

- [x] 3.1 Create `config/scraping.ts` with environment variable configuration
- [x] 3.2 Define max concurrent jobs setting
- [x] 3.3 Define max concurrent tribunals per job setting
- [x] 3.4 Define retry configuration (attempts, delays)
- [x] 3.5 Define script path mapping for scrape types

## 4. Core Services - Job Queue ✅

- [x] 4.1 Create `lib/services/scrape-queue.ts`
- [x] 4.2 Implement `ScrapeQueue` class with in-memory queue
- [x] 4.3 Implement `enqueue(job)` method
- [x] 4.4 Implement `process()` method with concurrent execution limits
- [x] 4.5 Implement `cancel(jobId)` method
- [x] 4.6 Implement `getStatus(jobId)` method
- [x] 4.7 Add singleton pattern for global queue instance
- [x] 4.8 Start queue processing on server initialization

## 5. Core Services - Script Executor ✅

- [x] 5.1 Create `lib/services/scrape-executor.ts`
- [x] 5.2 Implement `executeScript()` function with subprocess execution
- [x] 5.3 Implement credential passing via environment variables
- [x] 5.4 Implement tribunal configuration passing
- [x] 5.5 Implement script output parsing (stdout JSON)
- [x] 5.6 Implement timeout handling (10-minute max)
- [x] 5.7 Implement process cleanup on timeout/error
- [x] 5.8 Implement error classification (retryable vs non-retryable)
- [x] 5.9 Implement automatic retry with exponential backoff
- [x] 5.10 Implement execution logging capture

## 6. Core Services - Job Orchestrator ✅

- [x] 6.1 Create `lib/services/scrape-orchestrator.ts`
- [x] 6.2 Implement `executeJob(jobId)` main orchestration function
- [x] 6.3 Implement tribunal iteration with concurrency control
- [x] 6.4 Implement credential retrieval for each tribunal
- [x] 6.5 Implement script path resolution based on scrape type
- [x] 6.6 Implement execution record creation and updates
- [x] 6.7 Implement result data compression before storing
- [x] 6.8 Implement job status updates (running → completed/failed)
- [x] 6.9 Implement error handling and continuation for failed tribunals
- [x] 6.10 Implement execution log aggregation

## 7. Script Modifications ✅

- [x] 7.1 Modify `raspar-acervo-geral.js` to output JSON to stdout
- [x] 7.2 Modify `raspar-pendentes-no-prazo-dada-ciencia.js` for JSON output
- [x] 7.3 Modify `raspar-pendentes-sem-prazo.js` for JSON output
- [x] 7.4 Modify `raspar-arquivados.js` for JSON output
- [x] 7.5 Modify `raspar-minha-pauta.js` for JSON output
- [x] 7.6 Update all scripts to accept credentials via environment variables
- [x] 7.7 Update all scripts to accept base URL via environment variable
- [x] 7.8 Add structured error output to all scripts
- [x] 7.9 Test each modified script independently

## 8. Server Actions - Job Management ✅

- [x] 8.1 Create `createScrapeJobAction` in `app/actions/pje.ts`
- [x] 8.2 Validate input (tribunals, scrape type, sub-types)
- [x] 8.3 Validate credentials exist for all selected tribunals
- [x] 8.4 Check for duplicate active jobs
- [x] 8.5 Create ScrapeJob record in database
- [x] 8.6 Create ScrapeJobTribunal records for each tribunal
- [x] 8.7 Enqueue job in ScrapeQueue
- [x] 8.8 Return job ID to client

## 9. Server Actions - Job Querying ✅

- [x] 9.1 Create `listScrapeJobsAction` with filtering
- [x] 9.2 Implement status filter (pending, running, completed, failed, canceled)
- [x] 9.3 Implement scrape type filter
- [x] 9.4 Implement date range filter
- [x] 9.5 Implement tribunal search filter
- [x] 9.6 Implement pagination (50 jobs per page)
- [x] 9.7 Create `getScrapeJobAction(jobId)` for detailed view
- [x] 9.8 Include tribunals and executions in detailed view

## 10. Server Actions - Execution Management ✅

- [x] 10.1 Create `getScrapeExecutionAction(executionId)`
- [x] 10.2 Include decompressed result data
- [x] 10.3 Include execution logs
- [ ] 10.4 Create `retryScrapeExecutionAction(executionId)` (deferred - can be added later)
- [ ] 10.5 Validate execution is failed before retry (deferred)
- [ ] 10.6 Create new execution and trigger script (deferred)
- [x] 10.7 Create `cancelScrapeJobAction(jobId)`
- [x] 10.8 Update job status to canceled
- [x] 10.9 Cancel pending tribunal executions

## 11. Server Actions - Status Polling ✅

- [x] 11.1 Create `getActiveJobsStatusAction(jobIds)`
- [x] 11.2 Return status for all requested jobs
- [x] 11.3 Include progress percentage (completed/total tribunals)
- [x] 11.4 Include current tribunal being scraped
- [x] 11.5 Optimize query to avoid N+1 problems

## 12. UI Components - Tribunal Selector ✅

- [x] 12.1 Create `components/pje/tribunal-selector.tsx`
- [x] 12.2 Implement grouped display (TRT, TJ, TRF accordion)
- [x] 12.3 Implement individual tribunal checkboxes
- [x] 12.4 Implement "Select All TRTs" button
- [x] 12.5 Implement "Select All TJs" button
- [x] 12.6 Implement "Select All TRFs" button
- [x] 12.7 Implement "Select All" button (all types)
- [x] 12.8 Implement clear selection button
- [x] 12.9 Display count of selected tribunals
- [x] 12.10 Export as reusable component

## 13. UI Components - Scrape Type Selector ✅

- [x] 13.1 Create `components/pje/scrape-type-selector.tsx`
- [x] 13.2 Implement radio buttons for main scrape types
- [x] 13.3 Implement conditional sub-type checkboxes for "Pendentes"
- [x] 13.4 Validate at least one sub-type selected when Pendentes chosen
- [x] 13.5 Display descriptions for each scrape type
- [x] 13.6 Export as reusable component

## 14. UI Components - Scrape Configuration Form ✅

- [x] 14.1 Create `components/pje/scrape-config-form.tsx`
- [x] 14.2 Integrate TribunalSelector component
- [x] 14.3 Integrate ScrapeTypeSelector component
- [x] 14.4 Implement configuration summary section
- [x] 14.5 Display selected tribunal count
- [x] 14.6 Display estimated execution time
- [x] 14.7 Implement form validation
- [x] 14.8 Display validation errors inline
- [x] 14.9 Implement submit handler calling createScrapeJobAction
- [x] 14.10 Display success/error messages
- [x] 14.11 Reset form after successful submission

## 15. UI Components - Active Jobs Monitor ✅

- [x] 15.1 Create `components/pje/scrape-job-monitor.tsx`
- [x] 15.2 Display list of active jobs (pending + running)
- [x] 15.3 Implement progress bar for each job
- [x] 15.4 Calculate and display completion percentage
- [x] 15.5 Display current tribunal being scraped
- [x] 15.6 Implement expandable tribunal list
- [x] 15.7 Show tribunal-level status (pending, running, completed, failed)
- [x] 15.8 Implement cancel button per job
- [x] 15.9 Implement polling logic (every 3 seconds)
- [x] 15.10 Stop polling when no active jobs

## 16. UI Components - Job History Table ✅

- [x] 16.1 Create `components/pje/scrape-history.tsx`
- [x] 16.2 Display table of all jobs with key info
- [x] 16.3 Implement status badge with colors
- [x] 16.4 Display tribunal count per job
- [x] 16.5 Display success rate (completed/total)
- [x] 16.6 Implement status filter dropdown
- [x] 16.7 Implement scrape type filter checkboxes
- [x] 16.8 Implement date range picker
- [x] 16.9 Implement tribunal search input
- [x] 16.10 Implement pagination controls
- [x] 16.11 Implement row click to view details

## 17. UI Components - Execution Detail View ✅

- [x] 17.1 Create `components/pje/scrape-execution-detail.tsx`
- [x] 17.2 Display execution metadata (status, times, duration)
- [x] 17.3 Display process count
- [x] 17.4 Display execution logs in scrollable container
- [x] 17.5 Display error message if failed
- [x] 17.6 Display process data preview (first 10 processes)
- [x] 17.7 Implement "View All" button to expand full list
- [x] 17.8 Implement "Export JSON" button
- [ ] 17.9 Implement retry button for failed executions (deferred - requires 10.4-10.6)
- [x] 17.10 Format timestamps for readability

## 18. Main Scrapes Page ✅

- [x] 18.1 Replace placeholder in `app/(dashboard)/pje/scrapes/page.tsx`
- [x] 18.2 Implement page layout with sections
- [x] 18.3 Add "New Scrape Job" button to open configuration form
- [x] 18.4 Integrate ScrapeConfigForm in modal/drawer
- [x] 18.5 Integrate ScrapeJobMonitor for active jobs section
- [x] 18.6 Integrate ScrapeHistory for job history section
- [x] 18.7 Implement detail view navigation
- [x] 18.8 Add page-level loading states
- [x] 18.9 Add page-level error handling
- [ ] 18.10 Implement auto-refresh toggle (deferred - auto-polling is implemented)

## 19. Data Compression Utilities ✅

- [x] 19.1 Create `lib/utils/compression.ts`
- [x] 19.2 Implement `compressJSON(data)` using zlib gzip
- [x] 19.3 Implement `decompressJSON(buffer)` using zlib gunzip
- [x] 19.4 Add error handling for corrupt data
- [x] 19.5 Add size comparison logging (before/after)

## 20. Error Handling ✅

- [x] 20.1 Create `lib/errors/scraping-errors.ts`
- [x] 20.2 Define `ScrapingError` class
- [x] 20.3 Define error types (authentication, network, timeout, script, rate_limit)
- [x] 20.4 Implement `isRetryableError(error)` helper
- [x] 20.5 Implement user-friendly error messages
- [x] 20.6 Implement error logging with context

## 21. Testing - Unit Tests

- [ ] 21.1 Test `ScrapeQueue` enqueue/dequeue logic
- [ ] 21.2 Test concurrent execution limits
- [ ] 21.3 Test `ScrapeExecutor` subprocess execution
- [ ] 21.4 Test retry logic with exponential backoff
- [ ] 21.5 Test error classification
- [ ] 21.6 Test compression/decompression utilities
- [ ] 21.7 Test script path resolution

## 22. Testing - Integration Tests

- [ ] 22.1 Test full job creation → execution → completion flow
- [ ] 22.2 Test job with multiple tribunals (sequential execution)
- [ ] 22.3 Test job cancellation during execution
- [ ] 22.4 Test failed execution retry
- [ ] 22.5 Test credential validation before job creation
- [ ] 22.6 Test result data storage and retrieval
- [ ] 22.7 Test polling for active job status

## 23. Testing - End-to-End Tests

- [ ] 23.1 Test scraping Acervo Geral for TRT3-1g
- [ ] 23.2 Test scraping Pendentes (com dado ciência) for TRT3-1g
- [ ] 23.3 Test scraping Pendentes (sem prazo) for TRT3-1g
- [ ] 23.4 Test scraping Arquivados for TRT3-1g
- [ ] 23.5 Test scraping Minha Pauta for TRT3-1g
- [ ] 23.6 Test multi-tribunal job (3 tribunals)
- [ ] 23.7 Test authentication failure handling
- [ ] 23.8 Test network timeout handling

## 24. Documentation

- [ ] 24.1 Update README with scraping interface usage
- [ ] 24.2 Document environment variables for scraping config
- [ ] 24.3 Document script modification guide
- [ ] 24.4 Create troubleshooting guide for common errors
- [ ] 24.5 Document queue architecture and limits
- [ ] 24.6 Add JSDoc comments to core services

## 25. Performance Optimization

- [ ] 25.1 Add database indexes for frequent queries
- [ ] 25.2 Optimize polling query (avoid N+1 with includes)
- [ ] 25.3 Implement result data pagination for large datasets
- [ ] 25.4 Test memory usage with concurrent jobs
- [ ] 25.5 Test database performance with 1000+ jobs
- [ ] 25.6 Add monitoring for queue length and execution times

## 26. Deployment Preparation

- [ ] 26.1 Set default environment variables in .env.example
- [ ] 26.2 Document migration steps
- [ ] 26.3 Test server restart handling (interrupted jobs)
- [ ] 26.4 Test process cleanup on server shutdown
- [ ] 26.5 Create rollback plan documentation
- [ ] 26.6 Verify backward compatibility with existing scripts

## 27. Final Review

- [ ] 27.1 Code review for all new files
- [ ] 27.2 Verify all requirements met from spec
- [ ] 27.3 Verify all scenarios pass
- [ ] 27.4 Performance review (no obvious bottlenecks)
- [ ] 27.5 Security review (credential handling, input validation)
- [ ] 27.6 UI/UX review (intuitive, accessible)
- [ ] 27.7 Browser compatibility testing
- [ ] 27.8 Mobile responsiveness testing
