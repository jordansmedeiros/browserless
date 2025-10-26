# Change Proposal: improve-scrape-ux

## Summary

Improve the user experience of the PJE scraping interface by implementing a wizard-based configuration modal, real-time terminal monitoring with animated logs, and a comprehensive results viewer with multiple visualization options.

## Motivation

The current scraping interface has several UX issues that make it difficult to use:

1. **Poor Visual Hierarchy**: The modal title font is smaller than section titles, creating confusion
2. **Overwhelming Interface**: All configuration steps shown at once require scrolling within the modal
3. **Limited Progress Visibility**: Users cannot see real-time logs or detailed progress during scraping
4. **No Results Viewer**: Clicking "Details" in scrape history has no dedicated page for viewing scraped data
5. **Data Exploration Friction**: No easy way to browse, filter, or export scraped process data

These issues reduce user efficiency and satisfaction when performing scraping operations.

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
