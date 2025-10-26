# Change Proposal: improve-scrape-ux

## Why

The current PJE scraping interface has poor visual hierarchy (modal title smaller than section titles), overwhelming configuration (requires scrolling), no real-time progress visibility during scraping, and no dedicated results viewer for exploring scraped data. These UX issues reduce user efficiency and satisfaction when performing scraping operations.

## What Changes

- Implement wizard-based configuration modal with 2-step flow (Tribunal Selection → Configuration)
- Fix visual hierarchy with proper heading sizes and eliminate modal scrolling
- Add real-time terminal monitor with live log streaming and SSE connection
- Create dedicated results viewer page with Table/JSON/File Explorer views
- Implement data filtering, sorting, and export functionality (CSV, JSON, Markdown)
- Add comprehensive testing suite (unit, performance, accessibility, responsiveness)

## Impact

**User Experience Improvements:**
- Reduced cognitive load with step-by-step wizard
- Real-time feedback during scraping operations
- Multiple data visualization options for exploring results
- Better visual hierarchy and no modal scrolling

**Technical Changes:**
- New wizard UI components (WizardContainer, WizardStep, WizardNavigation)
- Backend structured logging service with EventEmitter
- SSE endpoint for log streaming with fallback polling
- New scrape results page with tabbed interface
- 115 automated tests covering critical functionality

## Scope

This change introduces three major capabilities:

### 1. Modal Wizard UI (`modal-wizard-ui`)
- Convert scrape configuration modal to a multi-step wizard
- Fix visual hierarchy (clear heading sizes)
- Implement 2-step flow: Tribunal Selection → Configuration
- Eliminate modal scrolling (except internal tribunal list scroll)

### 2. Terminal Monitor (`terminal-monitor`)
- Integrate animated terminal component for real-time log display
- Show scraping progress with live log streaming
- Support background execution (logs persist if modal closed)
- Allow reopening terminal from "active jobs" view

### 3. Scrape Results Viewer (`scrape-results-viewer`)
- Create dedicated page for viewing scrape job results
- Implement tabbed interface with multiple views:
  - **Table View**: Dynamic columns based on JSON keys
  - **JSON View**: Raw structured data
  - **File Explorer View**: Hierarchical data visualization
- Enable filtering, sorting, and export functionality

## Non-Goals

- Real-time collaboration (multi-user watching same scrape)
- Historical log replay with time travel
- Advanced data analytics or charting
- Integration with external data warehouses

## Dependencies

- Terminal component already installed at `components/ui/shadcn-io/terminal/index.tsx`
- Requires existing `ScrapeJob`, `ScrapeExecution` database models
- Builds on `pje-scraping` spec requirements

## Success Criteria

1. **Wizard Usability**: Users can configure scraping in 2 clear steps without scrolling
2. **Real-Time Monitoring**: Users see live logs and progress during scraping
3. **Results Accessibility**: Users can view, filter, and export scraped data in multiple formats
4. **Visual Polish**: Proper heading hierarchy and consistent spacing throughout

## Rollout Plan

1. Implement modal wizard UI (low risk, UI only)
2. Integrate terminal monitoring (medium risk, requires backend changes)
3. Build results viewer (low risk, new page)
4. Test end-to-end flow with real scraping jobs

## Related Changes

- Extends `add-pje-credentials-management` (credential integration)
- Implements requirements from `pje-scraping` spec
