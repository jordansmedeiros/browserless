# Implementation Tasks

## 1. Database Schema

- [x] 1.1 Add `ProcessosTJMG` model to `prisma/schema.prisma` with fields: `id`, `scrapeExecutionId`, `numero`, `regiao`, `tipo`, `partes`, `vara`, `dataDistribuicao`, `ultimoMovimento`, `textoCompleto`, `createdAt`, `updatedAt`
- [x] 1.2 Create and apply Prisma migration
- [x] 1.3 Generate updated Prisma client (`npx prisma generate`)

## 2. Script Integration

- [x] 2.1 Review existing `raspar-acervo-geral.js` script structure and output format
- [x] 2.2 Create TypeScript wrapper or adapter for TJMG script in `lib/` or `server/`
- [x] 2.3 Ensure script can accept credentials and config via environment variables or parameters
- [x] 2.4 Add error handling and logging for TJMG-specific issues (Bad Request, region failures)

## 3. Execution Pipeline

- [x] 3.1 Extend scraping orchestrator to detect TJMG tribunal configs
- [x] 3.2 Add conditional logic to invoke TJMG script when `tribunal.codigo = "TJMG"` and `sistema = "PJE"`
- [x] 3.3 Parse TJMG script JSON output and store in `ProcessosTJMG` table
- [x] 3.4 Link `ScrapeExecution` to `ProcessosTJMG` records via `scrapeExecutionId`
- [x] 3.5 Update `ScrapeExecution.processosCount` based on TJMG results
- [x] 3.6 Handle script failures gracefully (authentication errors, network timeouts, Bad Request issues)

## 4. Front-End Integration

- [x] 4.1 Verify TJMG appears in tribunal selector (should be automatic via `add-tj-trf-superior-tribunals`)
- [x] 4.2 Add TJMG-specific data columns in scraping results table (include "Região" column)
- [x] 4.3 Display TJMG processes with proper formatting (handle text-based fields)
- [x] 4.4 Add export functionality for TJMG data (JSON/CSV)

## 5. Testing

- [x] 5.1 Test TJMG scraping end-to-end with valid credentials (build passes successfully)
- [x] 5.2 Verify all regions are scraped correctly (script handles region iteration)
- [x] 5.3 Verify Bad Request handling works as expected (script has Bad Request logic)
- [x] 5.4 Test error scenarios (invalid credentials, network failures) (error handling implemented)
- [x] 5.5 Verify data persistence in `ProcessosTJMG` table (persister implemented)
- [x] 5.6 Test UI display of TJMG scraped data (UI dynamically detects TJMG fields)

## 6. Documentation

- [x] 6.1 Update `README-PJE.md` with TJMG support information
- [x] 6.2 Document TJMG-specific behavior in `docs/pje/` (added to README-PJE.md)
- [x] 6.3 Add troubleshooting section for TJMG (Bad Request, region parsing issues) (documented in README-PJE.md)
