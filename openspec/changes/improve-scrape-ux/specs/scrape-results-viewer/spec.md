# Capability: scrape-results-viewer

## Purpose

Provide a comprehensive results viewing interface with multiple visualization options (table, JSON, explorer) and export capabilities for scraped process data.

## ADDED Requirements

### Requirement: Scrape Job Detail Page

The system SHALL provide a dedicated page for viewing detailed results of completed scraping jobs.

#### Scenario: Navigate to job detail page

- **WHEN** a user clicks "Detalhes" on a job in the scrape history
- **THEN** the system navigates to `/pje/scrapes/[jobId]`
- **AND** the page displays the job detail view

#### Scenario: Display job metadata header

- **WHEN** the job detail page loads
- **THEN** the system displays a header section with:
  - Job ID (short format, e.g., "Raspagem #abc12")
  - Creation date and time
  - Job status badge (completed, failed, canceled)
  - Total duration (e.g., "Duração: 4m 32s")
  - Success rate (e.g., "Taxa de sucesso: 100% (3/3 tribunais)")
- **AND** the header includes action buttons:
  - "Export CSV"
  - "Export JSON"
  - "Retry Failed" (if any tribunals failed)

#### Scenario: Handle missing or invalid job ID

- **WHEN** a user navigates to `/pje/scrapes/[jobId]` with an invalid ID
- **THEN** the system displays a 404 error page
- **AND** the error shows message: "Job de raspagem não encontrado"
- **AND** a link is provided to return to the scrapes page

### Requirement: Tabbed Results Viewer

The system SHALL display scraping results in multiple views using a tabbed interface.

#### Scenario: Display tabs for result views

- **WHEN** the job detail page is displayed
- **THEN** the system shows a tab navigation with 3 tabs:
  - "Tabela" (default selected)
  - "JSON"
  - "Explorador"
- **AND** only one tab content is visible at a time
- **AND** clicking a tab switches the active view

#### Scenario: Persist tab selection in URL

- **WHEN** a user switches to the "JSON" tab
- **THEN** the URL updates to `/pje/scrapes/[jobId]?view=json`
- **AND** refreshing the page maintains the selected tab
- **WHEN** a user shares the URL with `?view=json`
- **THEN** the page opens with the JSON tab selected

### Requirement: Table View

The system SHALL display scraped processes in a sortable, filterable data table.

#### Scenario: Render table with dynamic columns

- **WHEN** the "Tabela" tab is selected
- **THEN** the system flattens all `ScrapeExecution.resultData` into table rows
- **AND** columns are generated dynamically from JSON keys in the process data
- **AND** common columns include:
  - Tribunal (e.g., "TRT3-1g")
  - Número do Processo
  - Classe
  - Assunto
  - Data de Distribuição
  - Status
  - ... (all other keys found in the data)

#### Scenario: Sort table columns

- **WHEN** a user clicks a column header in the table
- **THEN** the system sorts the table by that column in ascending order
- **AND** clicking again sorts in descending order
- **AND** a sort indicator (↑↓) appears next to the column name

#### Scenario: Filter table data

- **WHEN** a user types in the global search box above the table
- **THEN** the system filters rows to show only those matching the search term
- **AND** the search is case-insensitive
- **AND** the search applies across all columns
- **WHEN** a user selects a filter by tribunal
- **THEN** only rows for that tribunal are displayed

#### Scenario: Paginate table results

- **WHEN** more than 50 processes are displayed
- **THEN** the system paginates the table (50 rows per page)
- **AND** pagination controls appear below the table
- **AND** the user can navigate between pages
- **AND** the current page is indicated (e.g., "Página 1 de 5")

#### Scenario: Select table rows

- **WHEN** a user clicks a checkbox next to a row
- **THEN** the row is highlighted
- **AND** a bulk action toolbar appears above the table
- **AND** the toolbar shows "X selecionados" and bulk actions:
  - "Export Selected (CSV)"
  - "Export Selected (JSON)"

#### Scenario: View row details

- **WHEN** a user clicks on a table row
- **THEN** the system expands the row to show full process details
- **AND** all JSON fields are displayed in a formatted view
- **AND** clicking again collapses the row

### Requirement: JSON View

The system SHALL display raw scraped data in formatted JSON with syntax highlighting.

#### Scenario: Render formatted JSON

- **WHEN** the "JSON" tab is selected
- **THEN** the system displays all `ScrapeExecution.resultData` merged into a single JSON object:
  ```json
  {
    "job": {
      "id": "...",
      "status": "completed",
      "tribunals": [...]
    },
    "executions": [
      {
        "tribunal": "TRT3-1g",
        "processes": [...]
      },
      {
        "tribunal": "TRT4-1g",
        "processes": [...]
      }
    ]
  }
  ```
- **AND** the JSON is syntax-highlighted with colors for keys, strings, numbers
- **AND** the JSON is pretty-printed with 2-space indentation

#### Scenario: Enable JSON collapsing

- **WHEN** viewing the JSON
- **THEN** the system allows collapsing and expanding JSON objects and arrays
- **AND** clicking on a `{...}` or `[...]` toggles the collapsed state
- **AND** collapsed objects show "..." to indicate hidden content

#### Scenario: Copy JSON to clipboard

- **WHEN** a user clicks "Copy JSON" button above the viewer
- **THEN** the system copies the entire JSON to the clipboard
- **AND** a toast notification confirms: "JSON copiado para área de transferência"

#### Scenario: Search within JSON

- **WHEN** a user types in the JSON search box
- **THEN** the system highlights all matching text in the JSON
- **AND** the user can navigate between matches with ← → buttons
- **AND** the current match index is shown (e.g., "3 of 12")

### Requirement: File Explorer View

The system SHALL display scraped data in a hierarchical file explorer interface.

#### Scenario: Render hierarchical tree structure

- **WHEN** the "Explorador" tab is selected
- **THEN** the system organizes data into a tree hierarchy:
  ```
  📁 TRT3-1g (2 agrupamentos)
    📁 Acervo Geral (45 processos)
      📄 Processo 0000123-45.2024.5.03.0001
      📄 Processo 0000124-46.2024.5.03.0002
      ...
  📁 TRT4-1g (1 agrupamento)
    📁 Pendentes (32 processos)
      📄 Processo 0000456-78.2024.5.04.0001
      ...
  ```
- **AND** tribunal nodes show process count
- **AND** agrupamento nodes show process count
- **AND** process nodes show the process number

#### Scenario: Expand and collapse tree nodes

- **WHEN** a user clicks a folder icon (📁)
- **THEN** the node expands to show child nodes
- **AND** the icon changes to 📂 (open folder)
- **WHEN** clicking again
- **THEN** the node collapses
- **AND** the icon changes back to 📁

#### Scenario: Display process details in explorer

- **WHEN** a user clicks a process node (📄)
- **THEN** the system displays a detail panel on the right side
- **AND** the panel shows all process fields in a formatted layout
- **AND** the panel includes an "Export this process" button

#### Scenario: Filter explorer tree

- **WHEN** a user types in the explorer search box
- **THEN** the system filters the tree to show only matching nodes
- **AND** parent nodes are expanded if children match
- **AND** non-matching nodes are hidden

#### Scenario: Bulk expand/collapse

- **WHEN** a user clicks "Expand All" button
- **THEN** all tree nodes are expanded
- **AND** the full hierarchy is visible
- **WHEN** a user clicks "Collapse All"
- **THEN** all nodes except root are collapsed

### Requirement: Export Functionality

The system SHALL allow users to export scraped data in multiple formats.

#### Scenario: Export table data as CSV

- **WHEN** a user clicks "Export CSV" in the table view
- **THEN** the system generates a CSV file from the current table data (filtered/sorted)
- **AND** column headers match table columns
- **AND** the filename is `scrape-{jobId}-{timestamp}.csv`
- **AND** the browser downloads the file

#### Scenario: Export JSON data

- **WHEN** a user clicks "Export JSON" button
- **THEN** the system generates a JSON file with all execution results
- **AND** the filename is `scrape-{jobId}-{timestamp}.json`
- **AND** the file is pretty-printed for readability
- **AND** the browser downloads the file

#### Scenario: Export selected rows only

- **WHEN** a user selects specific rows in the table and clicks "Export Selected (CSV)"
- **THEN** the system exports only the selected rows to CSV
- **AND** the filename includes "-selected" (e.g., `scrape-{jobId}-selected.csv`)

#### Scenario: Export Excel file

- **WHEN** a user clicks "Export Excel" button
- **THEN** the system generates an Excel file (`.xlsx`) using the `xlsx` library
- **AND** each tribunal's data is in a separate sheet
- **AND** the file includes formatting (headers bold, borders, filters)
- **AND** the filename is `scrape-{jobId}-{timestamp}.xlsx`

### Requirement: Performance Optimization for Large Datasets

The system SHALL handle large scraped datasets efficiently without UI freezing.

#### Scenario: Virtualize table rendering

- **WHEN** a table has more than 1000 rows
- **THEN** the system uses virtual scrolling (e.g., `react-window` or `@tanstack/react-virtual`)
- **AND** only visible rows are rendered in the DOM
- **AND** scrolling remains smooth even with 10k+ rows

#### Scenario: Lazy load JSON viewer

- **WHEN** the JSON view contains more than 100,000 characters
- **THEN** the system initially renders collapsed nodes
- **AND** expanding a node loads its children on-demand
- **AND** the UI remains responsive

#### Scenario: Paginate explorer tree

- **WHEN** a tree node has more than 100 children
- **THEN** the system shows only the first 100 with a "Load more" button
- **AND** clicking "Load more" renders the next 100
- **AND** virtualization is applied to long lists

## MODIFIED Requirements

### Requirement: Scrape Job History

The system SHALL maintain a persistent history with **links to detail pages**.

#### Scenario: Navigate to detail page from history (Modified)

- **WHEN** a user views the scrape history table
- **THEN** each completed or failed job shows a "Detalhes" button
- **WHEN** the user clicks "Detalhes"
- **THEN** the system navigates to `/pje/scrapes/[jobId]`
- **AND** the detail page opens with the job results

#### Scenario: Filter history to find results (Enhanced)

- **WHEN** a user filters jobs by status "completed"
- **THEN** only completed jobs (with results) are shown
- **AND** each job row shows preview stats:
  - Total processes scraped
  - Tribunals processed
  - Success rate

## REMOVED Requirements

None. This capability is purely additive and enhances existing scrape history functionality.
