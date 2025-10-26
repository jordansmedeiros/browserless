# Tasks: improve-scrape-ux

## Phase 1: Modal Wizard UI (Low Risk, UI Only) ✅ COMPLETED

### Task 1.1: Create WizardContainer Component ✅
- [x] Create `components/ui/wizard-container.tsx`
- [x] Implement step state management (currentStep, totalSteps)
- [x] Add step indicator UI (e.g., "Etapa 1 de 2")
- [x] Support step validation before navigation
- [x] Test: Render wizard with 2 steps, navigate forward/back

### Task 1.2: Create WizardStep Component ✅
- [x] Create `components/ui/wizard-step.tsx`
- [x] Accept `step`, `title`, `children` props
- [x] Conditionally render based on currentStep
- [x] Apply proper heading hierarchy (`text-xl font-semibold` for title)
- [x] Test: Multiple steps render correctly

### Task 1.3: Create WizardNavigation Component ✅
- [x] Create `components/ui/wizard-navigation.tsx`
- [x] Render "Próximo", "Voltar", "Iniciar" buttons conditionally
- [x] Handle disabled states based on validation
- [x] Style with primary/secondary variants
- [x] Test: Buttons enable/disable correctly

### Task 1.4: Refactor ScrapeConfigForm to Use Wizard ✅
- [x] Update `components/pje/scrape-config-form.tsx`
- [x] Replace single-page form with `WizardContainer`
- [x] Move `TribunalSelector` to Step 1
- [x] Move scrape type/subtype selectors to Step 2
- [x] Add configuration summary to Step 2
- [x] Test: Full wizard flow works, selections persist

### Task 1.5: Fix Visual Hierarchy ✅
- [x] Update modal title to `text-2xl font-bold`
- [x] Ensure step titles are `text-xl font-semibold`
- [x] Update section labels to `text-sm font-medium text-muted-foreground`
- [x] Verify visual hierarchy: Modal Title > Step Title > Labels
- [x] Test: Manually verify heading sizes with screenshot

### Task 1.6: Eliminate Modal Scrolling ✅
- [x] Set modal body to fixed height (no scroll)
- [x] Apply `max-h-[400px] overflow-y-auto` to TribunalSelector only
- [x] Test all content visible without modal scroll
- [x] Test on various viewport sizes (mobile, tablet, desktop)

### Task 1.7: Add Wizard Validation ✅
- [x] Validate Step 1: At least one tribunal selected
- [x] Validate Step 2: Scrape type selected
- [x] Validate Step 2: Subtype selected if "Pendentes"
- [x] Display inline validation errors
- [x] Prevent navigation if validation fails
- [x] Test: Try to advance with invalid selections

### Task 1.8: Implement Close Confirmation ✅
- [x] Detect if any selections were made
- [x] Show confirmation dialog when closing with selections
- [x] Reset wizard state on confirmed close
- [x] Test: Close with/without selections

---

## Phase 2: Terminal Monitor (Medium Risk, Backend Changes) ✅ COMPLETED

### Task 2.1: Update Database Schema for Structured Logs ✅
- [x] Modify `prisma/schema.prisma`: `ScrapeExecution.logs` → `Json` (was `String`)
- [x] Create migration: `npx prisma db push` (used instead of migrate due to shadow DB issue)
- [x] Update seed data if needed
- [x] Test: Migrate dev database successfully

### Task 2.2: Create Log Emitter Utility ✅
- [x] Create `lib/services/scrape-logger.ts`
- [x] Implement `createJobLogger(jobId)` factory function
- [x] Add methods: `logger.info()`, `logger.success()`, `logger.warn()`, `logger.error()`
- [x] Emit events via EventEmitter: `emit('job-{jobId}-log', logEntry)`
- [x] Buffer logs in memory for batch DB writes
- [x] Test: Logger emits events correctly

### Task 2.3: Create SSE Endpoint for Log Streaming ✅
- [x] Create `app/api/scrapes/[jobId]/logs/stream/route.ts`
- [x] Set SSE headers (`Content-Type: text/event-stream`)
- [x] Attach listener to job log emitter
- [x] Send logs as SSE events: `data: {json}\n\n`
- [x] Clean up listener on connection close
- [x] Test: Connect via EventSource, receive events

### Task 2.4: Create Polling Endpoint for Historical Logs ✅
- [x] Create `app/api/scrapes/[jobId]/logs/route.ts`
- [x] Accept `fromIndex` query parameter
- [x] Return logs from database starting at index
- [x] Include `lastIndex` and `jobStatus` in response
- [x] Test: Fetch logs, verify pagination works

### Task 2.5: Integrate Logger into Scraping Scripts ✅
- [x] Update scraping orchestrator to use `createJobLogger`
- [x] Add log calls for key actions:
  - Job start with tribunal count
  - Tribunal start
  - Credentials search and authentication
  - Script execution
  - Completion with statistics
  - Error handling
- [x] Persist logs to database on job completion
- [x] Test: Run scrape, verify logs are emitted and saved

### Task 2.6: Create TerminalMonitor Component ✅
- [x] Create `components/pje/terminal-monitor.tsx`
- [x] Use `Terminal` from `components/ui/shadcn-io/terminal/`
- [x] Accept `jobId` prop
- [x] Establish SSE connection on mount
- [x] Render logs with `AnimatedSpan`
- [x] Apply color coding by log level
- [x] Test: Render with mock logs

### Task 2.7: Implement Auto-Scroll Logic ✅
- [x] Auto-scroll to bottom when new logs appear
- [x] Detect manual scroll and disable auto-scroll
- [x] Show "Scroll to bottom" button when auto-scroll disabled
- [x] Re-enable auto-scroll when button clicked
- [x] Test: Scroll behavior works correctly
**Note**: Implemented in TerminalMonitor component

### Task 2.8: Handle SSE Connection Loss ✅
- [x] Detect `eventSource.onerror`
- [x] Attempt reconnection 3 times with exponential backoff
- [x] Fall back to polling if reconnection fails
- [x] Display connection status to user
- [x] Test: Disconnect server mid-stream, verify fallback
**Note**: Implemented in TerminalMonitor component

### Task 2.9: Integrate Terminal into Scrape Workflow ✅
- [x] Open TerminalMonitor modal after job creation
- [x] Close wizard modal when terminal opens
- [x] Display terminal in dialog with job ID
- [x] Auto-open on job creation
- [x] Test: Create job → terminal opens automatically

### Task 2.10: Support Reopening Terminal ✅
- [x] Add "Visualizar Terminal" button to active jobs monitor
- [x] Fetch historical logs from DB on open
- [x] Resume SSE streaming from last log
- [x] Test: Close terminal, reopen, verify logs preserved

### Task 2.11: Display Completion/Failure Summary ✅
- [x] Detect job completion (status: "completed" or "failed")
- [x] Render final summary with stats (processes, success rate, duration, tribunals)
- [x] Close SSE connection automatically on completion
- [x] Update status footer with completion state
- [x] Show summary card with color-coded border (green/red)
- [x] Display grid with 4 key metrics: processes, success rate, duration, tribunal stats
- [x] Test: Complete job, verify summary appears

### Task 2.12: Limit Log Display for Performance ✅
- [x] Render only last 1000 logs in UI
- [x] Show notice if logs exceed limit
- [x] Provide "Download full logs" button
- [x] Generate `.log` file with all logs
- [x] Test: Job with > 1000 logs renders smoothly
**Note**: Buffer limiting implemented in logger service, download button added to terminal footer

---

## Phase 3: Scrape Results Viewer (Low Risk, New Page) ✅ COMPLETED

### Task 3.1: Create Job Detail Page Route ✅
- [x] Create `app/(dashboard)/pje/scrapes/[id]/page.tsx`
- [x] Fetch job data via `getScrapeJobAction(id)`
- [x] Handle invalid/missing job ID (error display)
- [x] Test: Navigate to valid and invalid URLs

### Task 3.2: Create Job Metadata Header Component ✅
- [x] Create `components/pje/scrape-job-header.tsx`
- [x] Display job ID, date, status, duration, success rate
- [x] Display tribunal statistics (completed/failed/total)
- [x] Add action buttons (Export CSV, Export JSON, Export Excel, Retry Failed)
- [x] Test: Render with various job statuses

### Task 3.3: Create Tabbed Results Container ✅
- [x] Add `Tabs` component to detail page
- [x] Create 3 tabs: "Tabela", "JSON", "Explorador"
- [x] Implement tab state management
- [x] Test: Switch tabs, verify content displays

### Task 3.4-3.8: Implement Table View Component with Full Features ✅
- [x] Create `components/pje/results-table-view.tsx`
- [x] Decompress and flatten `ScrapeExecution.resultData` into rows
- [x] Generate columns dynamically from JSON keys
- [x] Implement column sorting (ascending/descending/none)
- [x] Add global search box with real-time filtering
- [x] Paginate with configurable page size (25/50/100/200 rows)
- [x] Add pagination controls with page navigation
- [x] Implement row selection with checkboxes
- [x] Display statistics and filtering status
- [x] Test: Sort, filter, paginate, select rows

### Task 3.7-3.8: Row Selection (Implemented in Table View) ✅
- [x] Add checkboxes to table rows
- [x] Show selected count badge
- [x] Select/deselect all rows functionality
- [x] Note: Bulk actions deferred to export implementation

### Task 3.9-3.11: Implement JSON View Component ✅
- [x] Create `components/pje/results-json-view.tsx`
- [x] Merge all execution results into single JSON object
- [x] Format JSON with proper indentation
- [x] Implement search within JSON with highlighting
- [x] Add "Copy JSON" button with clipboard integration
- [x] Add "Download JSON" button
- [x] Display file size and line count statistics
- [x] Test: Search, copy, download JSON

### Task 3.12-3.15: Implement File Explorer View Component ✅
- [x] Create `components/pje/results-explorer-view.tsx`
- [x] Build hierarchical tree: Tribunal → Processes
- [x] Implement collapsible nodes with icons
- [x] Add "Expand All" / "Collapse All" buttons
- [x] Display process details inline when expanded
- [x] Implement tree filtering by search term
- [x] Show filtered counts and badges
- [x] Test: Expand/collapse, search, filter

### Task 3.16-3.18: Export Utilities ✅
- [x] JSON export implemented in job detail page
- [x] Export buttons added to header component
- [x] CSV export utility implemented with proper escaping
- [x] Excel export utility implemented (HTML table approach)
**Note**: All export functionality complete and working

### Task 3.19-3.20: Performance Optimization (Not Critical) ⏭️
- [ ] Virtual scrolling for large tables
- [ ] Lazy loading for JSON view
**Note**: Current implementation handles moderate datasets well, defer optimization

### Task 3.21: Link History to Detail Page ✅
- [x] Update scrapes page to navigate on "Ver Detalhes"
- [x] Link navigates to `/pje/scrapes/[jobId]`
- [x] History component already has "Ver Detalhes" button
- [x] Test: Click details from history, page opens

---

## Phase 4: Testing and Polish

### Task 4.1: Write Unit Tests
- [ ] Test wizard validation logic
- [ ] Test log formatting functions
- [ ] Test data transformation for table/explorer
- [ ] Test CSV/JSON export utilities
- [ ] Run: `npm test`

### Task 4.2: Write Integration Tests
- [ ] Test full wizard flow (select → configure → create)
- [ ] Test terminal SSE connection and fallback
- [ ] Test results page navigation and tab switching
- [ ] Run: `npm test`

### Task 4.3: Manual End-to-End Testing
- [ ] Create scraping job via wizard
- [ ] Monitor progress in terminal
- [ ] Close and reopen terminal
- [ ] View completed job in results page
- [ ] Switch between table/JSON/explorer views
- [ ] Export data in multiple formats
- [ ] Verify on different browsers (Chrome, Firefox, Safari)

### Task 4.4: Performance Testing
- [ ] Test wizard with all 48 tribunals selected
- [ ] Test terminal with 1000+ log entries
- [ ] Test results page with 10k+ processes
- [ ] Measure page load times, ensure < 2s

### Task 4.5: Accessibility Audit
- [ ] Run Lighthouse accessibility audit
- [ ] Ensure keyboard navigation works (Tab, Enter, Escape)
- [ ] Verify screen reader compatibility (ARIA labels)
- [ ] Fix any accessibility issues found

### Task 4.6: Mobile Responsiveness
- [ ] Test wizard on mobile viewport (< 640px)
- [ ] Test terminal on tablet viewport (768px)
- [ ] Test results page on various screen sizes
- [ ] Adjust layouts for mobile if needed

### Task 4.7: Update Documentation
- [ ] Add wizard usage guide to README-PJE.md
- [ ] Document terminal monitoring feature
- [ ] Document results viewer capabilities
- [ ] Add screenshots to docs

### Task 4.8: Validate OpenSpec
- [ ] Run `openspec validate improve-scrape-ux --strict`
- [ ] Fix any validation errors
- [ ] Ensure all requirements have scenarios
- [ ] Verify spec deltas are complete

---

## Dependencies

**Sequential Dependencies**:
- Phase 2 depends on Phase 1 (wizard creates jobs that terminal monitors)
- Phase 3 is independent (can be developed in parallel with Phase 2)
- Phase 4 depends on Phases 1-3 completion

**Parallel Work Opportunities**:
- Tasks 1.1-1.3 (wizard components) can be done in parallel
- Tasks 2.1-2.2 (schema + logger) can be done in parallel
- Tasks 3.4-3.14 (all view components) can be done in parallel after 3.1-3.3

**External Dependencies**:
- Terminal component already exists (`components/ui/shadcn-io/terminal/`)
- Database models (`ScrapeJob`, `ScrapeExecution`) already exist
- Next.js 16, React 19, Prisma already installed
