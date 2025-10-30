# Delta: PJE Scraping - TJMG Integration

## ADDED Requirements

### Requirement: HTML-Based Scraping for Tribunals Without APIs

The system SHALL support scraping tribunals that do not provide REST APIs by parsing HTML content directly.

#### Scenario: Detect API availability

- **WHEN** the system prepares to execute a scrape for a tribunal config
- **THEN** the system checks if `tribunalConfig.urlApi` is NULL
- **AND** if NULL, the system routes to HTML-based scraping logic
- **AND** if present, the system uses API-based scraping logic

#### Scenario: Execute HTML-based scraping for TJMG

- **WHEN** the system executes a scrape for TJMG-PJE-1g
- **THEN** the system invokes the script at `server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js`
- **AND** the system passes credentials (CPF, password) via environment variables
- **AND** the system waits for the script to complete and capture stdout JSON output
- **AND** the system parses the returned process array

#### Scenario: Handle Bad Request after login

- **WHEN** the TJMG script encounters a "Bad Request" page after login
- **THEN** the script automatically refreshes the page (F5 equivalent)
- **AND** the script continues with navigation to Acervo
- **AND** the system logs this behavior as expected (not an error)

#### Scenario: Navigate through manual menus

- **WHEN** the TJMG script is executing
- **THEN** the script navigates sequentially: Menu → Painel → Painel do Representante → ACERVO
- **AND** the script uses DOM element selection to find and click navigation items
- **AND** the script waits for page transitions between each navigation step

### Requirement: Multi-Region Scraping for TJMG

The system SHALL support tribunals with multiple regions/jurisdictions that require iterating through each region separately.

#### Scenario: Identify regions with processes

- **WHEN** the TJMG script reaches the Acervo view
- **THEN** the script parses the page to identify all regions (e.g., "Belo Horizonte", "Juiz de Fora", "Uberlândia")
- **AND** the script counts the number of processes in each region
- **AND** the script creates a list of regions to scrape

#### Scenario: Iterate through each region

- **WHEN** the script has a list of regions
- **THEN** for each region, the script:
  - Expands the region section
  - Clicks "Caixa de entrada"
  - Extracts processes from the current page
  - Handles pagination within the region
  - Stores the region name with each extracted process
- **AND** the script continues to the next region after completing the current one

#### Scenario: Associate processes with their region

- **WHEN** a process is extracted from TJMG
- **THEN** the process record includes the `regiao` field
- **AND** the region value is one of the TJMG jurisdictions (e.g., "Belo Horizonte")

### Requirement: TJMG Process Data Model

The system SHALL store TJMG process data in a dedicated model that reflects the HTML-parsed structure.

#### Scenario: Create ProcessosTJMG table

- **WHEN** the database schema is initialized or migrated
- **THEN** the system creates a `ProcessosTJMG` table with columns:
  - `id` (UUID, primary key)
  - `scrapeExecutionId` (String, foreign key to ScrapeExecution)
  - `numero` (String) - Process number (e.g., "ProceComCiv 5196751-57.2023.8.13.0024")
  - `regiao` (String) - Jurisdiction/region (e.g., "Belo Horizonte")
  - `tipo` (String, nullable) - Process type (if extracted)
  - `partes` (String, nullable) - Parties involved (e.g., "AUTOR X RÉU")
  - `vara` (String, nullable) - Court designation (e.g., "20ª Vara Cível da Comarca de Belo Horizonte")
  - `dataDistribuicao` (String, nullable) - Distribution date text
  - `ultimoMovimento` (String, nullable) - Last movement text
  - `textoCompleto` (Text, nullable) - Full extracted text
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)
- **AND** the system creates a foreign key relationship with `ScrapeExecution` with cascade delete
- **AND** the system creates an index on `scrapeExecutionId`
- **AND** the system creates an index on `numero`
- **AND** the system creates an index on `regiao`

#### Scenario: Store TJMG scraped processes

- **WHEN** the TJMG script completes successfully
- **THEN** the system parses the JSON output array
- **AND** for each process in the array, the system creates a `ProcessosTJMG` record
- **AND** the system links each record to the current `ScrapeExecution` via `scrapeExecutionId`
- **AND** the system updates `ScrapeExecution.processosCount` with the total count

#### Scenario: Handle text-based date fields

- **WHEN** storing TJMG process data
- **THEN** the system stores dates as text strings (e.g., "Distribuído em 31/08/2023")
- **AND** does NOT attempt to parse them into DateTime objects (since format may vary)
- **AND** stores them in `dataDistribuicao` and `ultimoMovimento` fields as-is

### Requirement: TJMG Scraping Orchestration

The system SHALL integrate TJMG scraping into the existing job execution pipeline.

#### Scenario: Detect TJMG tribunal configuration

- **WHEN** the scraping orchestrator processes a `ScrapeExecution` for a tribunal
- **THEN** the system checks if `tribunal.codigo = "TJMG"` AND `sistema = "PJE"` AND `grau = "1g"`
- **AND** if true, the system routes to TJMG-specific scraping logic
- **AND** the system verifies that `urlApi` is NULL (TJMG does not have API)

#### Scenario: Invoke TJMG scraping script

- **WHEN** executing a TJMG scrape
- **THEN** the system sets environment variables:
  - `PJE_CPF` = credential CPF
  - `PJE_SENHA` = credential password
  - `PJE_LOGIN_URL` = tribunalConfig.urlLoginSeam
  - `PJE_BASE_URL` = tribunalConfig.urlBase
  - `PJE_OUTPUT_FILE` = "" (empty to skip file output)
- **AND** the system spawns a Node.js process: `node server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js`
- **AND** the system captures stdout (JSON array of processes) and stderr (logs)
- **AND** the system waits up to 60 minutes for completion (configurable timeout)

#### Scenario: Parse TJMG script output

- **WHEN** the TJMG script completes successfully
- **THEN** the system reads stdout as JSON
- **AND** the system validates that output is an array
- **AND** each item in the array is a process object with fields: `numero`, `regiao`, `tipo`, `partes`, `vara`, `dataDistribuicao`, `ultimoMovimento`, `textoCompleto`

#### Scenario: Handle TJMG script failure

- **WHEN** the TJMG script exits with non-zero code
- **THEN** the system marks the `ScrapeExecution` as "failed"
- **AND** the system stores stderr output in `ScrapeExecution.errorMessage`
- **AND** the system logs the full error for debugging
- **AND** the system suggests checking credentials or tribunal availability

### Requirement: TJMG Data Display in UI

The system SHALL display TJMG process data in the scraping results interface with region-specific information.

#### Scenario: Display TJMG processes in execution details

- **WHEN** a user views a completed TJMG scrape execution
- **THEN** the system displays a table of processes with columns:
  - Número do Processo
  - Região (TJMG-specific)
  - Partes
  - Vara
  - Data Distribuição
  - Último Movimento
- **AND** the table supports sorting by region, número, and data distribuição
- **AND** the user can expand a row to view `textoCompleto`

#### Scenario: Filter TJMG processes by region

- **WHEN** viewing TJMG execution results
- **THEN** the system provides a region filter dropdown
- **AND** the dropdown lists all unique regions in the scraped data
- **AND** selecting a region filters the table to show only processes from that region

#### Scenario: Export TJMG processes

- **WHEN** a user clicks "Export" on a TJMG execution
- **THEN** the system generates a JSON file with all `ProcessosTJMG` records
- **AND** the filename includes: "TJMG-acervo-{timestamp}.json"
- **AND** the JSON structure matches the original script output format

### Requirement: TJMG-Specific Error Handling

The system SHALL provide specific error messages and recovery guidance for TJMG scraping issues.

#### Scenario: Detect authentication failure

- **WHEN** the TJMG script fails with "Login failed" or similar message
- **THEN** the system marks the execution as "failed" with error type "authentication"
- **AND** the system displays: "TJMG authentication failed. Please verify your CPF and password in the credentials page."
- **AND** the system provides a direct link to the credentials management page

#### Scenario: Detect Bad Request timeout

- **WHEN** the TJMG script gets stuck on the Bad Request page without recovering
- **THEN** the system marks the execution as "failed" with error type "bad_request_timeout"
- **AND** the system displays: "TJMG Bad Request recovery failed. This may be a temporary tribunal issue. Please retry later."

#### Scenario: Detect region parsing failure

- **WHEN** the TJMG script cannot identify any regions
- **THEN** the system marks the execution as "failed" with error type "no_regions_found"
- **AND** the system displays: "No regions found in TJMG Acervo. The page structure may have changed."
- **AND** the system suggests checking for TJMG system updates or contacting support

#### Scenario: Retry TJMG scraping

- **WHEN** a user clicks "Retry" on a failed TJMG execution
- **THEN** the system creates a new `ScrapeExecution` record
- **AND** the system re-invokes the TJMG script with the same configuration
- **AND** the system increments the retry counter
- **AND** if retry succeeds, both execution records remain (for audit trail)
