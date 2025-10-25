# pje-scraping Specification

## Purpose
TBD - created by archiving change add-pje-scraping-interface. Update Purpose after archive.
## Requirements
### Requirement: Tribunal Selection for Scraping

The system SHALL allow users to select one or more tribunals to scrape, including the ability to select all tribunals of a specific type or all tribunals in the system.

#### Scenario: Select single tribunal

- **WHEN** a user configures a scraping job
- **THEN** the system displays a tribunal selector with all available tribunals grouped by type (TRT, TJ, TRF)
- **AND** the user can select a single tribunal (e.g., TRT3-1g)
- **AND** the system validates that at least one tribunal is selected before allowing job creation

#### Scenario: Select multiple specific tribunals

- **WHEN** a user selects multiple individual tribunals (e.g., TRT3-1g, TRT4-1g, TRT5-2g)
- **THEN** the system stores all selected tribunals for the scraping job
- **AND** the system creates separate execution records for each tribunal

#### Scenario: Select all TRTs

- **WHEN** a user clicks "Todos os TRTs" button
- **THEN** the system automatically selects all 48 TRT configurations (24 TRTs × 2 graus)
- **AND** the individual selections are visually indicated
- **AND** the user can deselect individual tribunals after bulk selection

#### Scenario: Select all TJs

- **WHEN** a user clicks "Todos os TJs" button
- **THEN** the system automatically selects all TJ tribunal configurations
- **AND** the selection can be modified afterwards

#### Scenario: Select all TRFs

- **WHEN** a user clicks "Todos os TRFs" button
- **THEN** the system automatically selects all TRF tribunal configurations
- **AND** the selection can be modified afterwards

#### Scenario: Select absolutely all tribunals

- **WHEN** a user clicks "Selecionar Todos" button
- **THEN** the system selects all tribunals across all types (TRT, TJ, TRF)
- **AND** the system displays a warning about the large number of tribunals selected
- **AND** the user can still deselect individual tribunals

### Requirement: Scrape Type Selection

The system SHALL allow users to select the type of data to scrape from the PJE panel.

#### Scenario: Select Acervo Geral

- **WHEN** a user selects "Acervo Geral" as the scrape type
- **THEN** the system configures the job to scrape all active processes (agrupamento ID: 1)
- **AND** no sub-type options are displayed

#### Scenario: Select Pendentes de Manifestação with sub-types

- **WHEN** a user selects "Pendentes de Manifestação" as the scrape type
- **THEN** the system displays sub-type options: "Com dado ciência" and "Sem prazo"
- **AND** the user MUST select at least one sub-type
- **AND** the user can select both sub-types simultaneously

#### Scenario: Select Arquivados

- **WHEN** a user selects "Arquivados" as the scrape type
- **THEN** the system configures the job to scrape archived processes (agrupamento ID: 5)
- **AND** no sub-type options are displayed

#### Scenario: Select Minha Pauta (Audiências)

- **WHEN** a user selects "Minha Pauta" as the scrape type
- **THEN** the system configures the job to scrape scheduled hearings/audiências
- **AND** no sub-type options are displayed

### Requirement: Scrape Job Creation

The system SHALL create scraping jobs with all selected configurations and store them in the database.

#### Scenario: Create scrape job with valid configuration

- **WHEN** a user submits a scraping configuration with tribunals and scrape type selected
- **THEN** the system creates a `ScrapeJob` record with status "pending"
- **AND** the system creates `ScrapeJobTribunal` records for each selected tribunal
- **AND** the system generates a unique job ID
- **AND** the system associates the job with the current user (via advogado credentials)
- **AND** the system displays a success message with the job ID

#### Scenario: Validate credentials exist for selected tribunals

- **WHEN** a user creates a scraping job
- **THEN** the system validates that active credentials exist for ALL selected tribunals
- **AND** if any tribunal lacks credentials, the system rejects the job creation
- **AND** the system displays a detailed error message listing tribunals without credentials

#### Scenario: Store scrape type and sub-types

- **WHEN** a scraping job is created
- **THEN** the system stores the scrape type (acervo_geral, pendentes, arquivados, minha_pauta) as an enum
- **AND** if sub-types are selected (e.g., com_dado_ciencia, sem_prazo), they are stored as a JSON array in the job record

#### Scenario: Prevent duplicate active jobs

- **WHEN** a user attempts to create a scraping job
- **AND** an identical job (same tribunals, same scrape type) is already running or pending
- **THEN** the system rejects the job creation
- **AND** the system displays a message indicating the existing job ID and its status

### Requirement: Scrape Job Execution

The system SHALL execute scraping jobs by invoking the appropriate scraping scripts for each tribunal with proper authentication.

#### Scenario: Start job execution automatically

- **WHEN** a scraping job is created with status "pending"
- **THEN** the system automatically queues the job for execution
- **AND** the job status changes to "running" when execution begins
- **AND** the system records the start timestamp

#### Scenario: Execute scraping for each tribunal sequentially

- **WHEN** a scraping job execution starts
- **THEN** the system processes each `ScrapeJobTribunal` record sequentially
- **AND** for each tribunal, the system creates a `ScrapeExecution` record
- **AND** the system retrieves the appropriate credentials from the database
- **AND** the system invokes the correct scraping script based on scrape type and tribunal

#### Scenario: Map scrape type to script path

- **WHEN** the system needs to execute a scraping for a tribunal
- **THEN** if scrape type is "acervo_geral", the system calls `server/scripts/pje-trt/{trt}/{grau}/acervo/raspar-acervo-geral.js`
- **AND** if scrape type is "pendentes" with sub-type "com_dado_ciencia", the system calls `.../pendentes/raspar-pendentes-no-prazo-dada-ciencia.js`
- **AND** if scrape type is "pendentes" with sub-type "sem_prazo", the system calls `.../pendentes/raspar-pendentes-sem-prazo.js`
- **AND** if scrape type is "arquivados", the system calls `.../arquivados/raspar-arquivados.js`
- **AND** if scrape type is "minha_pauta", the system calls `.../pauta/raspar-minha-pauta.js`

#### Scenario: Pass credentials and tribunal to script

- **WHEN** the system invokes a scraping script
- **THEN** the system passes credentials (CPF, senha, idAdvogado) as parameters or environment variables
- **AND** the system passes tribunal configuration (TRT code, grau, base URL)
- **AND** the script performs authentication and data retrieval

#### Scenario: Handle successful scraping execution

- **WHEN** a scraping script completes successfully
- **THEN** the system updates the `ScrapeExecution` record with status "completed"
- **AND** the system stores the scraped data (processes) in the `resultData` JSON field
- **AND** the system records the number of processes scraped in `processosCount`
- **AND** the system updates the `ScrapeJobTribunal` status to "completed"
- **AND** the system records the completion timestamp

#### Scenario: Handle scraping execution failure

- **WHEN** a scraping script fails (authentication error, network error, etc.)
- **THEN** the system updates the `ScrapeExecution` record with status "failed"
- **AND** the system stores the error message in the `errorMessage` field
- **AND** the system updates the `ScrapeJobTribunal` status to "failed"
- **AND** the system continues executing remaining tribunals in the job

#### Scenario: Complete job when all tribunals processed

- **WHEN** all `ScrapeJobTribunal` records are processed (completed or failed)
- **THEN** the system updates the `ScrapeJob` status to "completed"
- **AND** the system records the completion timestamp
- **AND** the system calculates success rate (completed vs failed tribunals)

### Requirement: Real-Time Progress Monitoring

The system SHALL provide real-time updates on scraping job progress through the UI.

#### Scenario: Display active jobs with progress

- **WHEN** a user views the scrapes page while jobs are running
- **THEN** the system displays all active jobs (status: "pending" or "running")
- **AND** for each job, the system shows a progress bar indicating completion percentage
- **AND** the progress is calculated as (completed + failed) / total tribunals
- **AND** the system displays the current tribunal being scraped

#### Scenario: Poll for progress updates

- **WHEN** there are active jobs on the scrapes page
- **THEN** the system automatically polls the server every 3 seconds for status updates
- **AND** the UI updates progress bars and status without page refresh
- **AND** polling stops when all displayed jobs are completed or failed

#### Scenario: Display tribunal-level status

- **WHEN** a user expands a job in the active jobs monitor
- **THEN** the system displays a list of all tribunals in the job
- **AND** for each tribunal, the system shows status (pending, running, completed, failed)
- **AND** the system displays the number of processes scraped (if completed)
- **AND** failed tribunals show a brief error message

### Requirement: Scrape Job History

The system SHALL maintain a persistent history of all scraping jobs with filtering and search capabilities.

#### Scenario: List all scraping jobs

- **WHEN** a user views the scrapes page
- **THEN** the system displays a table of all scraping jobs ordered by creation date (newest first)
- **AND** for each job, the system shows: job ID, creation date, scrape type, tribunal count, status, and success rate
- **AND** the table supports pagination (50 jobs per page)

#### Scenario: Filter jobs by status

- **WHEN** a user selects a status filter (pending, running, completed, failed)
- **THEN** the system displays only jobs matching the selected status
- **AND** the filter persists across page refreshes

#### Scenario: Filter jobs by scrape type

- **WHEN** a user selects a scrape type filter
- **THEN** the system displays only jobs matching the selected scrape type
- **AND** multiple scrape types can be selected simultaneously

#### Scenario: Filter jobs by date range

- **WHEN** a user selects a date range (start date and end date)
- **THEN** the system displays only jobs created within that date range
- **AND** the system validates that start date is before or equal to end date

#### Scenario: Search jobs by tribunal

- **WHEN** a user enters a tribunal code in the search box (e.g., "TRT3")
- **THEN** the system displays only jobs that include at least one tribunal matching the search
- **AND** the search is case-insensitive

### Requirement: Scrape Execution Detail View

The system SHALL provide detailed information about individual scraping executions including logs and results.

#### Scenario: View execution details

- **WHEN** a user clicks on a tribunal within a job
- **THEN** the system displays a detailed view of the `ScrapeExecution` record
- **AND** the view shows: tribunal, status, start time, end time, duration, processes count
- **AND** if status is "failed", the system displays the complete error message

#### Scenario: Display execution logs

- **WHEN** viewing an execution detail
- **THEN** the system displays execution logs captured from the scraping script
- **AND** logs are shown in chronological order with timestamps
- **AND** logs include authentication steps, pagination progress, and data retrieval events

#### Scenario: View scraped processes

- **WHEN** viewing a completed execution
- **THEN** the system displays a summary of scraped processes
- **AND** the system shows total count and a preview of the first 10 processes
- **AND** the user can download the complete process data as JSON

#### Scenario: Export execution results

- **WHEN** a user clicks "Export" on an execution detail
- **THEN** the system generates a JSON file with all scraped processes
- **AND** the filename includes tribunal, scrape type, and timestamp
- **AND** the browser downloads the file

### Requirement: Scrape Job Cancellation

The system SHALL allow users to cancel pending or running scraping jobs.

#### Scenario: Cancel pending job

- **WHEN** a user clicks "Cancel" on a pending job
- **THEN** the system updates the job status to "canceled"
- **AND** all `ScrapeJobTribunal` records with status "pending" are marked as "canceled"
- **AND** the system displays a success message

#### Scenario: Cancel running job

- **WHEN** a user clicks "Cancel" on a running job
- **THEN** the system marks the job for cancellation
- **AND** currently running tribunal executions complete normally
- **AND** pending tribunal executions are marked as "canceled" and not executed
- **AND** the job status updates to "canceled" when current executions finish

#### Scenario: Prevent canceling completed jobs

- **WHEN** a user attempts to cancel a job with status "completed"
- **THEN** the system rejects the cancellation
- **AND** the system displays a message indicating the job is already completed

### Requirement: Database Schema for Scraping

The system SHALL implement database models to store scraping jobs, executions, and results.

#### Scenario: ScrapeJob table structure

- **WHEN** the database is initialized
- **THEN** the system creates a `ScrapeJob` table with columns: id (UUID), status (enum: pending|running|completed|failed|canceled), scrapeType (enum: acervo_geral|pendentes|arquivados|minha_pauta), scrapeSubTypes (JSON array), advogadoId (String FK), createdAt (DateTime), startedAt (nullable DateTime), completedAt (nullable DateTime)
- **AND** the system creates a foreign key relationship with `Advogado` with cascade delete
- **AND** the system creates an index on [status, createdAt] for efficient querying

#### Scenario: ScrapeJobTribunal table structure

- **WHEN** the database is initialized
- **THEN** the system creates a `ScrapeJobTribunal` table with columns: id (UUID), status (enum: pending|running|completed|failed|canceled), scrapeJobId (String FK), tribunalConfigId (String FK), executionOrder (Int)
- **AND** the system creates a unique constraint on [scrapeJobId, tribunalConfigId]
- **AND** the system creates foreign key relationships with `ScrapeJob` and tribunal config with cascade delete

#### Scenario: ScrapeExecution table structure

- **WHEN** the database is initialized
- **THEN** the system creates a `ScrapeExecution` table with columns: id (UUID), status (enum: running|completed|failed|canceled), scrapeJobTribunalId (String FK), processosCount (Int default 0), resultData (JSON nullable), logs (Text nullable), errorMessage (Text nullable), startedAt (DateTime), completedAt (nullable DateTime)
- **AND** the system creates a foreign key relationship with `ScrapeJobTribunal` with cascade delete
- **AND** the system creates an index on [scrapeJobTribunalId]

### Requirement: Scraping Configuration Form UI

The system SHALL provide an intuitive form interface for configuring scraping jobs.

#### Scenario: Display scraping configuration form

- **WHEN** a user navigates to the scrapes page and clicks "Nova Raspagem"
- **THEN** the system displays a modal or drawer with the scraping configuration form
- **AND** the form includes sections: Tribunal Selection, Scrape Type, and Summary

#### Scenario: Tribunal selection UI with grouping

- **WHEN** viewing the tribunal selection section
- **THEN** the system displays tribunals grouped by type (TRT, TJ, TRF) in an accordion
- **AND** each group has a "Select All" checkbox for bulk selection
- **AND** individual tribunals are shown with checkboxes and labels (e.g., "TRT3 - 1º Grau")

#### Scenario: Scrape type selection with radio buttons

- **WHEN** viewing the scrape type section
- **THEN** the system displays radio buttons for: Acervo Geral, Pendentes de Manifestação, Arquivados, Minha Pauta
- **AND** only one scrape type can be selected at a time
- **AND** when "Pendentes de Manifestação" is selected, checkboxes for sub-types appear below

#### Scenario: Display configuration summary

- **WHEN** a user has selected tribunals and scrape type
- **THEN** the system displays a summary section showing: number of tribunals selected, scrape type, estimated execution time
- **AND** the system shows a "Create Job" button (enabled only when valid)

#### Scenario: Form validation feedback

- **WHEN** a user attempts to submit the form with missing selections
- **THEN** the system displays validation errors inline
- **AND** errors include: "Select at least one tribunal" and "Select a scrape type"
- **AND** if "Pendentes" is selected without sub-types, show "Select at least one sub-type"

### Requirement: Error Handling and Recovery

The system SHALL handle errors gracefully and provide recovery options for failed scraping executions.

#### Scenario: Retry failed tribunal execution

- **WHEN** a user clicks "Retry" on a failed tribunal execution
- **THEN** the system creates a new `ScrapeExecution` record for that tribunal
- **AND** the system updates the `ScrapeJobTribunal` status to "running"
- **AND** the system re-executes the scraping script with the same configuration

#### Scenario: Handle authentication failures

- **WHEN** a scraping execution fails due to authentication error
- **THEN** the system marks the execution as "failed" with error type "authentication"
- **AND** the error message suggests checking credentials for the tribunal
- **AND** the system provides a link to the credentials management page

#### Scenario: Handle network timeouts

- **WHEN** a scraping execution fails due to network timeout
- **THEN** the system marks the execution as "failed" with error type "timeout"
- **AND** the error message indicates the tribunal may be temporarily unavailable
- **AND** the system suggests retrying later

#### Scenario: Automatic retry on transient errors

- **WHEN** a scraping execution fails with a retryable error (timeout, rate limit)
- **THEN** the system automatically retries up to 3 times with exponential backoff (30s, 60s, 120s)
- **AND** if all retries fail, the execution is marked as "failed"
- **AND** the logs include all retry attempts

### Requirement: Performance and Scalability

The system SHALL execute scraping jobs efficiently and handle multiple concurrent jobs.

#### Scenario: Process tribunals in parallel for same job

- **WHEN** a scraping job has multiple tribunals
- **THEN** the system can process up to 3 tribunals concurrently (configurable)
- **AND** the system respects rate limits by introducing delays between requests
- **AND** concurrent executions do not share browser instances

#### Scenario: Queue multiple jobs

- **WHEN** multiple scraping jobs are created
- **THEN** the system queues jobs and processes them in FIFO order
- **AND** the system displays queue position for pending jobs
- **AND** a maximum of 2 jobs (configurable) can run simultaneously

#### Scenario: Limit concurrent scraping across system

- **WHEN** the system is executing scraping jobs
- **THEN** the system enforces a global limit of 10 concurrent browser instances (configurable)
- **AND** if the limit is reached, new executions wait in queue
- **AND** the system displays a warning if many jobs are queued

#### Scenario: Store large result datasets efficiently

- **WHEN** a scraping execution returns thousands of processes
- **THEN** the system compresses the result data before storing in the database (gzip)
- **AND** the system decompresses data when retrieved for display
- **AND** the system provides pagination when displaying process lists

