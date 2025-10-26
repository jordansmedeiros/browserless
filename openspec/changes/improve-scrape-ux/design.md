# Design Document: improve-scrape-ux

## Architecture Overview

This change introduces three independent but complementary UI capabilities for the scraping interface. Each can be developed in parallel with minimal coupling.

```
┌─────────────────────────────────────────────────────────────┐
│                      Scrapes Page                           │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ Config Modal │  │ Active Jobs    │  │ Job History   │  │
│  │  (Wizard)    │  │  (Terminal)    │  │  (Details →)  │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
                                     ┌──────────────────────────┐
                                     │  Scrape Job Detail Page  │
                                     │  (Results Viewer)        │
                                     └──────────────────────────┘
```

## Component Design

### 1. Modal Wizard UI

**Component Structure**:
```typescript
<Dialog>
  <WizardContainer currentStep={step}>
    <WizardStep step={1} title="Selecionar Tribunais">
      <TribunalSelector />  // Existing component
    </WizardStep>

    <WizardStep step={2} title="Configurar Raspagem">
      <ScrapeTypeSelector />
      <ConfigSummary />
    </WizardStep>
  </WizardContainer>

  <WizardNavigation
    onNext={handleNext}
    onPrevious={handlePrevious}
    onSubmit={handleCreateJob}
  />
</Dialog>
```

**Visual Hierarchy**:
- Modal Title: `text-2xl font-bold` (largest)
- Step Title: `text-xl font-semibold` (medium)
- Section Labels: `text-sm font-medium text-muted-foreground` (smallest)

**State Management**:
- Use `useState` for current step (1-2)
- Validate step before allowing navigation
- Preserve selections when going back

**Trade-offs**:
- ✅ **Pro**: Clear progression, reduced cognitive load
- ✅ **Pro**: No scrolling (better mobile UX)
- ⚠️ **Con**: Extra click required (acceptable for clarity)

---

### 2. Terminal Monitor

**Integration Point**: Opens after job creation, can reopen from active jobs list

**Data Flow**:
```
┌───────────────┐      WebSocket/Polling      ┌──────────────┐
│ Terminal UI   │ ◄──────────────────────────► │ Server       │
│ Component     │                              │ (Log Stream) │
└───────────────┘                              └──────────────┘
       │                                              │
       │ Renders                                      │ Writes
       ▼                                              ▼
┌───────────────┐                              ┌──────────────┐
│ AnimatedSpan  │                              │ ScrapeJob    │
│ TypingAnimation│                             │ .logs (JSON) │
└───────────────┘                              └──────────────┘
```

**Component Structure**:
```typescript
<Terminal className="max-h-[500px]">
  {logs.map((log, i) => (
    <AnimatedSpan key={i} delay={i * 100}>
      <span className="text-green-400">[{log.timestamp}]</span>
      <span className="ml-2">{log.message}</span>
    </AnimatedSpan>
  ))}

  {status === 'running' && (
    <TypingAnimation duration={60}>
      Processing...
    </TypingAnimation>
  )}
</Terminal>
```

**Log Streaming Options**:

**Option A: Server-Sent Events (Recommended)**
```typescript
// Server
app.get('/api/scrapes/:id/logs/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');

  const sendLog = (log) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  };

  // Attach listener to job execution
  scrapeQueue.on(`job-${jobId}-log`, sendLog);

  req.on('close', () => {
    scrapeQueue.off(`job-${jobId}-log`, sendLog);
  });
});

// Client
const eventSource = new EventSource(`/api/scrapes/${jobId}/logs/stream`);
eventSource.onmessage = (event) => {
  const log = JSON.parse(event.data);
  setLogs(prev => [...prev, log]);
};
```

**Option B: Polling (Fallback)**
```typescript
// Poll every 2 seconds for new logs
useEffect(() => {
  if (status !== 'running') return;

  const interval = setInterval(async () => {
    const result = await getJobLogs(jobId, lastLogIndex);
    if (result.logs.length > 0) {
      setLogs(prev => [...prev, ...result.logs]);
      setLastLogIndex(result.lastIndex);
    }
  }, 2000);

  return () => clearInterval(interval);
}, [jobId, status]);
```

**Decision**: Use **Option A (SSE)** for live jobs, Option B for historical logs

**Terminal Behavior**:
- Auto-scrolls to bottom as new logs appear
- Supports manual scroll (disables auto-scroll)
- Closes modal → logs saved to database, can reopen
- Terminal shows "Job completed" with stats when done

**Trade-offs**:
- ✅ **Pro**: Real-time feedback improves UX
- ✅ **Pro**: SSE is simpler than WebSockets
- ⚠️ **Con**: Requires backend changes (log streaming)
- ⚠️ **Con**: Memory usage if logs are large (mitigate with pagination)

---

### 3. Scrape Results Viewer

**Route**: `/pje/scrapes/[id]`

**Page Structure**:
```typescript
<div>
  <PageHeader>
    <Title>Raspagem #{shortId}</Title>
    <Metadata>
      Date, Status, Duration, Success Rate
    </Metadata>
  </PageHeader>

  <Tabs defaultValue="table">
    <TabsList>
      <TabsTrigger value="table">Tabela</TabsTrigger>
      <TabsTrigger value="json">JSON</TabsTrigger>
      <TabsTrigger value="explorer">Explorador</TabsTrigger>
    </TabsList>

    <TabsContent value="table">
      <DataTableView data={processedData} />
    </TabsContent>

    <TabsContent value="json">
      <JsonView data={rawData} />
    </TabsContent>

    <TabsContent value="explorer">
      <FileExplorerView data={hierarchicalData} />
    </TabsContent>
  </Tabs>
</div>
```

**Data Transformation**:

**Table View**:
```typescript
// Flatten JSON to table rows
function processDataForTable(executions: ScrapeExecution[]) {
  return executions.flatMap(exec => {
    const processes = JSON.parse(exec.resultData);
    return processes.map(proc => ({
      tribunal: exec.tribunalConfig.codigo,
      numero: proc.numero,
      classe: proc.classe,
      assunto: proc.assunto,
      dataDistribuicao: proc.dataDistribuicao,
      // ... extract all keys dynamically
    }));
  });
}

// Dynamic columns based on keys
const columns = Object.keys(data[0] || {}).map(key => ({
  accessorKey: key,
  header: formatHeader(key),
  cell: ({ row }) => formatCell(row.getValue(key), key)
}));
```

**JSON View**:
```typescript
<pre className="text-sm overflow-auto max-h-[600px]">
  <code>{JSON.stringify(data, null, 2)}</code>
</pre>

// With syntax highlighting (optional)
import { Prism } from 'react-syntax-highlighter';
<Prism language="json" style={vscDarkPlus}>
  {JSON.stringify(data, null, 2)}
</Prism>
```

**Explorer View**:
```typescript
// Hierarchical structure
const hierarchy = {
  [tribunal1]: {
    [agrupamento1]: [
      { numero: '...', data: {...} },
      ...
    ]
  }
};

<TreeView>
  {Object.entries(hierarchy).map(([tribunal, groups]) => (
    <TreeNode key={tribunal} label={tribunal}>
      {Object.entries(groups).map(([group, processes]) => (
        <TreeNode key={group} label={`${group} (${processes.length})`}>
          {processes.map(proc => (
            <TreeLeaf key={proc.numero} data={proc} />
          ))}
        </TreeNode>
      ))}
    </TreeNode>
  ))}
</TreeView>
```

**Export Options**:
- CSV: Table data → downloadable CSV file
- JSON: Raw data → pretty-printed JSON file
- Excel: Table data → `.xlsx` file (using `xlsx` library)

**Performance Considerations**:
- Paginate table view (50 rows per page)
- Virtual scrolling for large JSON (use `react-window`)
- Lazy load explorer nodes (don't render all upfront)

**Trade-offs**:
- ✅ **Pro**: Multiple views suit different use cases
- ✅ **Pro**: Export enables further analysis
- ⚠️ **Con**: Complexity for large datasets (10k+ processes)
- ⚠️ **Con**: Memory usage for JSON view (mitigate with virtualization)

---

## Data Model Changes

### ScrapeExecution.logs

**Current**: `logs: Text (nullable)`

**Proposed**: `logs: JSONB (nullable)` - Array of log objects

```typescript
type LogEntry = {
  timestamp: string;  // ISO 8601
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  context?: Record<string, any>;  // Optional structured data
};

// Example
logs: [
  {
    timestamp: '2025-01-26T10:30:45.123Z',
    level: 'info',
    message: 'Iniciando autenticação no TRT3-1g',
  },
  {
    timestamp: '2025-01-26T10:30:52.456Z',
    level: 'success',
    message: 'Autenticação concluída',
    context: { idAdvogado: '12345' }
  },
  {
    timestamp: '2025-01-26T10:31:00.789Z',
    level: 'info',
    message: 'Buscando processos - Página 1/5',
    context: { page: 1, total: 5 }
  }
]
```

**Migration**:
```sql
-- Postgres
ALTER TABLE "ScrapeExecution"
  ALTER COLUMN logs TYPE JSONB USING logs::jsonb;

-- SQLite (current)
-- Create new column, migrate data, drop old
ALTER TABLE "ScrapeExecution" ADD COLUMN logs_json TEXT;
UPDATE "ScrapeExecution" SET logs_json = '[]' WHERE logs IS NULL;
-- Manual migration for existing text logs
ALTER TABLE "ScrapeExecution" DROP COLUMN logs;
ALTER TABLE "ScrapeExecution" RENAME COLUMN logs_json TO logs;
```

---

## Error Handling

### Wizard Validation
- Step 1: Must select at least one tribunal
- Step 2: Must select scrape type (and subtype if pendentes)
- Show inline errors, prevent navigation to next step

### Terminal Connection Loss
```typescript
eventSource.onerror = () => {
  // Try to reconnect 3 times
  if (reconnectAttempts < 3) {
    setTimeout(() => reconnectTerminal(), 1000 * reconnectAttempts);
    reconnectAttempts++;
  } else {
    // Fall back to polling
    startPollingLogs();
  }
};
```

### Results Viewer Data Loading
```typescript
if (loading) return <Skeleton />;
if (error) return <Alert>Erro ao carregar: {error.message}</Alert>;
if (!data || data.length === 0) return <EmptyState />;
```

---

## Testing Strategy

### Unit Tests
- Wizard step validation logic
- Log parsing and formatting
- Data transformation for table/explorer views

### Integration Tests
- Full wizard flow (select → configure → create)
- Terminal connects and receives logs
- Results viewer loads and displays data correctly

### Manual Testing Checklist
- [ ] Wizard: Can complete 2-step flow without errors
- [ ] Wizard: Visual hierarchy is clear (headings, spacing)
- [ ] Terminal: Logs stream in real-time during scraping
- [ ] Terminal: Can close and reopen terminal without loss
- [ ] Results: Table view shows all processes with correct columns
- [ ] Results: JSON view displays valid formatted JSON
- [ ] Results: Explorer view is navigable and performant
- [ ] Export: CSV/JSON exports contain correct data

---

## Open Questions

1. **Terminal Max Logs**: Should we limit log history (e.g., last 1000 entries)?
   - **Decision**: Yes, keep last 1000 in memory, full history in DB

2. **Results Pagination**: Server-side or client-side for table view?
   - **Decision**: Client-side for < 1000 rows, server-side for larger datasets

3. **Real-time Updates**: Should results viewer update if job is still running?
   - **Decision**: Yes, show partial results with "Aguardando mais dados..." indicator

4. **Export Formats**: Do we need PDF export?
   - **Decision**: Not in initial implementation (can add later if needed)
