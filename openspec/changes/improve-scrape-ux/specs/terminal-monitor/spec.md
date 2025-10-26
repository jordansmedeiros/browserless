# Capability: terminal-monitor

## Purpose

Provide real-time visibility into scraping job execution through an animated terminal interface displaying live logs and progress.

## ADDED Requirements

### Requirement: Terminal Monitor UI

The system SHALL display a terminal-style interface showing real-time logs and progress during scraping job execution.

#### Scenario: Open terminal after job creation

- **WHEN** a user submits the wizard and a scraping job is created successfully
- **THEN** the wizard modal closes
- **AND** the system immediately opens a terminal monitor modal
- **AND** the terminal displays the header "Raspagem em Andamento - Job #{shortId}"
- **AND** the terminal shows initial log: "[HH:MM:SS] Job criado com sucesso para {N} tribunais"

#### Scenario: Display terminal with animated logs

- **WHEN** the terminal monitor is open for a running job
- **THEN** the system displays a terminal component with:
  - Mac-style window controls (red, yellow, green dots)
  - Dark background (`bg-background`)
  - Monospace font for logs
  - Green text for timestamps
  - White text for log messages
- **AND** each log line appears with a typing animation (60ms per character)
- **AND** new logs fade in from top with opacity transition

#### Scenario: Stream logs in real-time

- **WHEN** a scraping job is running
- **THEN** the system establishes a Server-Sent Events (SSE) connection to `/api/scrapes/{jobId}/logs/stream`
- **AND** the server sends log events as they are generated during script execution
- **AND** the client receives events and appends them to the log display
- **AND** the terminal auto-scrolls to show the latest log entry

#### Scenario: Display progress indicators

- **WHEN** logs are streaming
- **THEN** the system displays progress messages like:
  - "[10:30:45] Autenticando no TRT3-1g..."
  - "[10:30:52] ✓ Autenticação concluída"
  - "[10:31:00] Buscando processos - Página 1/5"
  - "[10:31:15] ✓ 23 processos encontrados"
  - "[10:31:20] Iniciando raspagem TRT4-1g..."
- **AND** checkmarks (✓) appear for completed steps
- **AND** spinners appear for in-progress steps

#### Scenario: Auto-scroll to latest log

- **WHEN** new logs appear in the terminal
- **THEN** the system automatically scrolls to the bottom
- **AND** the scroll is smooth (scroll-behavior: smooth)
- **WHEN** a user manually scrolls up to view older logs
- **THEN** auto-scroll is temporarily disabled
- **AND** a "Scroll to bottom" button appears
- **WHEN** the user clicks "Scroll to bottom"
- **THEN** auto-scroll is re-enabled

#### Scenario: Close terminal while job is running

- **WHEN** a user closes the terminal modal while the job status is "running"
- **THEN** the system displays a confirmation: "A raspagem continuará em segundo plano. Deseja fechar?"
- **AND** if confirmed, the modal closes
- **AND** the scraping job continues executing
- **AND** logs continue being saved to the database
- **AND** the job appears in the "Active Jobs" section

#### Scenario: Reopen terminal for running job

- **WHEN** a user clicks "Visualizar" on an active job in the jobs monitor
- **THEN** the system opens the terminal monitor modal
- **AND** the terminal displays all previously logged entries from the database
- **AND** the terminal re-establishes SSE connection for new logs
- **AND** streaming resumes from the last log entry

#### Scenario: Display completion status

- **WHEN** a scraping job completes (status: "completed")
- **THEN** the terminal displays final summary:
  ```
  [10:35:00] ✓ Raspagem concluída!

  Resumo:
  - Tribunais processados: 3/3
  - Processos raspados: 127
  - Duração total: 4m 32s
  - Taxa de sucesso: 100%
  ```
- **AND** the SSE connection closes
- **AND** the modal shows a "Fechar" button instead of "Minimizar"

#### Scenario: Display failure status

- **WHEN** a scraping job fails (status: "failed")
- **THEN** the terminal displays error summary:
  ```
  [10:35:00] ✗ Raspagem falhou

  Erros:
  - TRT3-1g: Falha de autenticação
  - TRT4-1g: ✓ Concluído (45 processos)
  - TRT5-1g: Timeout de rede

  Taxa de sucesso: 33% (1/3 tribunais)
  ```
- **AND** failed tribunals show red ✗ marks
- **AND** successful tribunals show green ✓ marks

#### Scenario: Handle connection loss gracefully

- **WHEN** the SSE connection is lost during streaming
- **THEN** the system displays a warning: "⚠ Conexão perdida. Tentando reconectar..."
- **AND** the system attempts to reconnect 3 times with exponential backoff (1s, 2s, 4s)
- **AND** if reconnection fails, the system falls back to polling
- **AND** polling fetches logs every 3 seconds via `/api/scrapes/{jobId}/logs`

### Requirement: Log Streaming Backend

The system SHALL provide server endpoints for streaming scraping logs in real-time.

#### Scenario: Establish SSE endpoint for log streaming

- **WHEN** a client connects to `GET /api/scrapes/:jobId/logs/stream`
- **THEN** the server sets response headers:
  ```
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
  ```
- **AND** the server attaches a listener to the scraping job's log emitter
- **AND** the server keeps the connection open until the client disconnects or job completes

#### Scenario: Send log events via SSE

- **WHEN** a scraping script generates a log entry
- **THEN** the system emits an event: `scrapeQueue.emit('job-{jobId}-log', logEntry)`
- **AND** the SSE endpoint receives the event
- **AND** the server sends an SSE message:
  ```
  data: {"timestamp":"2025-01-26T10:30:45.123Z","level":"info","message":"Autenticando..."}

  ```
- **AND** the client EventSource receives and parses the message

#### Scenario: Persist logs to database

- **WHEN** log entries are generated during scraping
- **THEN** the system appends each log to `ScrapeExecution.logs` as a JSON array
- **AND** logs are stored with structure:
  ```json
  {
    "timestamp": "2025-01-26T10:30:45.123Z",
    "level": "info" | "success" | "warn" | "error",
    "message": "Human-readable message",
    "context": { "optional": "structured data" }
  }
  ```
- **AND** logs are batch-saved every 5 seconds or when job completes

#### Scenario: Retrieve historical logs

- **WHEN** a client requests `GET /api/scrapes/:jobId/logs?fromIndex=0`
- **THEN** the server returns all logs starting from the specified index
- **AND** the response includes:
  ```json
  {
    "logs": [...],
    "lastIndex": 42,
    "jobStatus": "running" | "completed" | "failed"
  }
  ```
- **AND** the client can use `lastIndex` for subsequent polling requests

### Requirement: Terminal Component Integration

The system SHALL integrate the existing Terminal component with animated text capabilities.

#### Scenario: Render terminal with animation

- **WHEN** logs are displayed in the terminal
- **THEN** the system uses the `Terminal` component from `components/ui/shadcn-io/terminal/`
- **AND** each log line is wrapped in `<AnimatedSpan>` for fade-in effect
- **AND** in-progress messages use `<TypingAnimation>` for typewriter effect

#### Scenario: Format log messages with colors

- **WHEN** rendering logs
- **THEN** the system applies colors based on log level:
  - `info`: `text-white`
  - `success`: `text-green-400` with ✓ prefix
  - `warn`: `text-yellow-400` with ⚠ prefix
  - `error`: `text-red-400` with ✗ prefix
- **AND** timestamps are always `text-green-400`

#### Scenario: Limit displayed logs for performance

- **WHEN** more than 1000 log entries exist
- **THEN** the terminal only renders the last 1000 logs
- **AND** the system shows a notice: "Mostrando últimas 1000 linhas de log"
- **AND** a "Download full logs" button is provided
- **WHEN** clicked, the system downloads all logs as a `.log` file

## MODIFIED Requirements

### Requirement: Real-Time Progress Monitoring

The system SHALL provide real-time updates on scraping job progress through the UI **and** terminal monitor.

#### Scenario: Display active jobs with progress (Modified)

- **WHEN** a user views the scrapes page while jobs are running
- **THEN** the system displays all active jobs with progress bars (existing behavior)
- **AND** each active job shows a "Visualizar Terminal" button
- **WHEN** the user clicks "Visualizar Terminal"
- **THEN** the system opens the terminal monitor modal for that job

#### Scenario: Update progress from terminal logs (New)

- **WHEN** terminal logs indicate progress (e.g., "Página 3/10")
- **THEN** the system parses the log context to update progress percentage
- **AND** the progress bar in the jobs monitor reflects the current page/total
- **AND** the current tribunal being scraped is displayed

### Requirement: Scrape Job Execution

The system SHALL execute scraping jobs **and emit logs** for real-time monitoring.

#### Scenario: Emit logs during execution (New)

- **WHEN** a scraping script performs an action (authentication, API call, data save)
- **THEN** the script calls `emitLog(jobId, level, message, context)`
- **AND** the log is:
  1. Emitted to SSE listeners via event emitter
  2. Appended to the in-memory log buffer
  3. Periodically flushed to `ScrapeExecution.logs` in database

Example integration in scraping script:
```typescript
const logger = createJobLogger(jobId);

logger.info('Iniciando autenticação', { tribunal: 'TRT3-1g' });
await authenticate();
logger.success('Autenticação concluída', { idAdvogado: '12345' });

for (let page = 1; page <= totalPages; page++) {
  logger.info(`Buscando processos - Página ${page}/${totalPages}`);
  const processos = await fetchPage(page);
  logger.info(`${processos.length} processos encontrados`);
}
```
