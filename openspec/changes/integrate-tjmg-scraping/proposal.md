# Proposal: Integrate TJMG PJE 1º Grau Scraping

## Why

A complete TJMG (Tribunal de Justiça de Minas Gerais) PJE scraping script has been developed for the "Acervo" view, but it is not yet integrated with the main system. The script extracts process data by parsing HTML (since TJMG lacks a REST API), handles the unique "Bad Request" behavior after login, and supports multiple regions/jurisdictions. To make this functionality accessible and persistent, we need to integrate it with the database schema, execution framework, and front-end UI.

## What Changes

- Create database model `ProcessosTJMG` for storing TJMG-specific process data with region field
- Add TJMG execution logic to the scraping orchestrator (`scrape-executor.ts`)
- Map TJMG script invocation in execution pipeline
- Extend credential validation to support TJMG (already in `add-tj-trf-superior-tribunals`)
- Update front-end scraping UI to include TJMG tribunal selection
- Add TJMG data display in scraping results views
- Document TJMG-specific behavior (HTML parsing, Bad Request handling, region iteration)

## Impact

- **Affected specs**: `pje-scraping`
- **Affected code**:
  - `prisma/schema.prisma` - New `ProcessosTJMG` model
  - `server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js` - Already exists
  - `app/actions/pje.ts` or equivalent - Scraping orchestration
  - `app/(dashboard)/pje/scrapes/` - UI components for TJMG
  - `lib/scrape-executor.ts` (if exists) or similar orchestrator module
