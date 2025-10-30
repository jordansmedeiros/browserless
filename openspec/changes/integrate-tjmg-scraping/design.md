# Design: TJMG PJE Scraping Integration

## Context

TJMG (Tribunal de Justiça de Minas Gerais) uses the PJE system but does NOT provide a REST API like TRT tribunals. A complete scraping script has been developed that:

1. Parses HTML directly instead of consuming JSON APIs
2. Handles a unique "Bad Request" behavior that occurs after successful SSO login
3. Navigates manually through menu structures (Menu → Painel → Painel do Representante → ACERVO)
4. Iterates through multiple regions/jurisdictions (35+ in TJMG)
5. Extracts process data using regex and DOM parsing

The script (`server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js`) is functional and produces JSON output, but it's not integrated with the database, orchestration layer, or front-end UI.

**Constraints:**
- TJMG data structure is text-based (no structured API responses)
- Scraping is slower than API-based (requires full browser navigation)
- Region field is unique to TJMG (TRTs don't have this concept)
- Must maintain compatibility with existing TRT-based scraping patterns

**Stakeholders:**
- Legal automation users who need TJMG process data
- System administrators managing scraping jobs
- Developers maintaining the scraping infrastructure

## Goals / Non-Goals

**Goals:**
- Integrate TJMG scraping into existing job execution pipeline
- Store TJMG process data in dedicated database model
- Display TJMG results in UI with region-specific information
- Handle TJMG-specific errors gracefully (Bad Request, region parsing failures)
- Support retry/recovery for failed TJMG executions

**Non-Goals:**
- Creating a REST API for TJMG (not possible - TJMG system doesn't provide one)
- Implementing TJMG 2º Grau scraping (only 1º Grau for now)
- Scraping other TJMG views (Pendentes, Arquivados, Pauta) - only Acervo in this change
- Normalizing TJMG data structure to match TRT (they are fundamentally different)
- Real-time scraping (TJMG is slow - batch jobs only)

## Decisions

### Decision 1: Dedicated Database Model for TJMG

**What:** Create a separate `ProcessosTJMG` table instead of forcing TJMG data into the existing `Processos` model.

**Why:**
- TJMG data structure is fundamentally different from TRT:
  - Has `regiao` field (TRT doesn't)
  - Stores dates as text strings (TRT uses DateTime)
  - Has `textoCompleto` field for raw extracted HTML text
  - Missing structured fields like `idPje`, `classeJudicial`, etc.
- Attempting to normalize would result in many NULL fields or awkward mappings
- Separation allows each model to evolve independently

**Alternatives Considered:**
- **Use generic `Processos` table with nullable fields:** Rejected because it would clutter the model with TJMG-specific fields that TRT doesn't use, and vice versa.
- **Store TJMG data in JSON blob:** Rejected because it would prevent efficient querying, filtering, and indexing.

**Trade-offs:**
- ✅ Clean separation of concerns
- ✅ Efficient queries and indexes per tribunal type
- ⚠️ Requires separate UI components for displaying TJMG vs TRT data
- ⚠️ Slightly more complex orchestration logic (type detection)

### Decision 2: Script Invocation via Child Process

**What:** Execute the existing `raspar-acervo-geral.js` script as a child process, passing credentials via environment variables and capturing stdout/stderr.

**Why:**
- Script is already functional and battle-tested
- Script uses Puppeteer with stealth plugins - complex to refactor into library
- Child process isolation protects main application from script crashes
- Environment variables avoid passing credentials via command-line args (security)

**Alternatives Considered:**
- **Refactor script into importable module:** Rejected due to complexity and risk of breaking existing functionality.
- **Direct Puppeteer calls from orchestrator:** Rejected because script contains significant logic (Bad Request handling, region iteration, pagination).

**Trade-offs:**
- ✅ Reuses proven script without modification
- ✅ Process isolation improves stability
- ⚠️ Slightly higher overhead (process spawn)
- ⚠️ Requires IPC via stdout/stderr (but this is simple with JSON)

### Decision 3: Text-Based Date Storage

**What:** Store TJMG dates as text strings (e.g., "Distribuído em 31/08/2023") rather than parsing into DateTime.

**Why:**
- TJMG HTML provides dates in inconsistent formats
- Parsing logic would be brittle and error-prone
- Dates are primarily for display, not querying/filtering
- Preserves original text for audit/debugging

**Alternatives Considered:**
- **Parse dates into DateTime with fallback:** Rejected because parsing errors would require complex error handling and could lose information.
- **Use both text and parsed DateTime:** Rejected as over-engineering for this use case.

**Trade-offs:**
- ✅ Robust - no parsing failures
- ✅ Preserves original formatting
- ⚠️ Cannot filter by date range in SQL
- ⚠️ Front-end must handle text display

### Decision 4: Synchronous Region Iteration

**What:** Scrape regions sequentially (one at a time) rather than in parallel.

**Why:**
- TJMG server may rate-limit concurrent sessions
- Puppeteer browser instances are resource-intensive (memory, CPU)
- Simplifies error tracking (know exactly which region failed)
- Script is already implemented this way and works reliably

**Alternatives Considered:**
- **Parallel region scraping with worker pool:** Rejected due to increased complexity, potential rate-limiting issues, and risk of TJMG blocking.

**Trade-offs:**
- ✅ Simple, reliable, predictable
- ✅ Lower resource usage
- ⚠️ Slower total execution time (but TJMG is already slow)

## Risks / Trade-offs

### Risk: TJMG HTML Structure Changes

**Risk:** TJMG may update their page structure, breaking the HTML parsing logic.

**Mitigation:**
- Log full HTML snapshots on parsing failures for debugging
- Provide clear error messages indicating page structure issues
- Maintain comprehensive test cases with sample HTML
- Monitor for parsing failures via execution metrics

### Risk: Bad Request Behavior Changes

**Risk:** TJMG's "Bad Request" behavior after login may change or disappear.

**Mitigation:**
- Script already handles both cases (with and without Bad Request)
- Log when Bad Request is encountered vs. skipped
- Add monitoring for authentication failures

### Risk: Performance Degradation with Many Regions

**Risk:** TJMG has 35+ regions - scraping all may take 60+ minutes.

**Mitigation:**
- Set realistic timeout expectations (60 min default, configurable)
- Display per-region progress in UI
- Allow users to see partial results if some regions fail
- Consider adding region filtering in future (if needed)

### Risk: Data Volume

**Risk:** `textoCompleto` field may grow large for processes with extensive history.

**Mitigation:**
- Use PostgreSQL `TEXT` type (supports up to 1GB per field)
- Add database-level compression if needed
- Monitor table size and index performance
- Truncate `textoCompleto` to 10KB if needed (configurable)

## Migration Plan

### Phase 1: Database Migration

1. Create `ProcessosTJMG` model in Prisma schema
2. Generate migration: `npx prisma migrate dev --name add_processos_tjmg`
3. Apply migration: `npx prisma migrate deploy`
4. Verify table creation in PostgreSQL

### Phase 2: Script Integration

1. Test existing TJMG script with valid credentials
2. Create orchestration wrapper function `executeTJMGScrape()`
3. Add TJMG detection logic to scraping orchestrator
4. Test end-to-end: job creation → execution → data storage

### Phase 3: UI Integration

1. Verify TJMG appears in tribunal selector (should be automatic)
2. Create TJMG data display components
3. Add region filter and sorting
4. Test UI with sample TJMG data

### Phase 4: Testing & Validation

1. Execute full TJMG scrape in staging environment
2. Verify all regions scraped correctly
3. Test error scenarios (bad credentials, timeout)
4. Validate data persistence and query performance

### Rollback Plan

If critical issues arise:
1. Disable TJMG option in tribunal selector (UI flag)
2. Leave database model in place (no data loss)
3. Investigate and fix issues in development
4. Re-enable once validated

No data deletion required - `ProcessosTJMG` table can remain empty if feature is disabled.

## Open Questions

1. **Should we limit the number of regions scraped per execution?**
   - Decision: No, scrape all regions by default. Can add filtering later if performance becomes an issue.

2. **Should we support partial region retries (retry single region vs. entire job)?**
   - Decision: Defer to future enhancement. Retry entire job for now.

3. **Should we normalize the `textoCompleto` field into structured data?**
   - Decision: No, keep as-is. Structured parsing can be added later as a separate process if needed.

4. **Should we implement TJMG 2º Grau in this change?**
   - Decision: No, focus on 1º Grau Acervo only. 2º Grau is a separate change.
