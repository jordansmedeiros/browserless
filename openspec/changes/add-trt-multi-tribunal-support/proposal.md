# Add Multi-TRT Support for PJE Automation

## Why

Currently, PJE automation scripts are hardcoded to work exclusively with TRT3 (Tribunal Regional do Trabalho da 3ª Região). The login URLs and API endpoints are hardcoded throughout the codebase, making it impossible to automate processes for the other 23 TRTs in Brazil without significant code duplication.

Since the PJE (Processo Judicial Eletrônico) system for Labor Justice is largely standardized across all 24 TRTs, with only minor variations, we can create a scalable solution that supports all tribunals by:
- Moving hardcoded URLs to the database
- Creating a flexible type system to represent all 24 TRTs with their respective graus (1º and 2º grau)
- Enabling the same automation code to work across different TRTs with minimal configuration changes

This will enable lawyers and legal professionals to automate processes across all Labor Courts in Brazil, not just TRT3.

## What Changes

- **Create TRT enumeration**: Add comprehensive list of all 24 TRTs (TRT1 through TRT24) as TypeScript types and database models
- **Add grau (degree) support**: Support both 1º grau (first instance) and 2º grau (appeals) for each TRT
- **Database schema changes**: Create `Tribunal` and `TribunalConfig` models to store TRT configurations and URLs dynamically
- **Migrate hardcoded URLs**: Remove hardcoded `https://pje.trt3.jus.br` URLs and replace with database-driven configuration
- **Update TypeScript types**: Extend existing PJE types to include TRT and grau information
- **Seed initial data**: Populate database with all 48 URL configurations (24 TRTs × 2 graus) using standardized URL patterns
- **Update automation scripts**: Modify login and scraping functions to accept TRT/grau parameters and use dynamic URLs
- **Add configuration management**: Create admin interface or CLI tool to manage TRT configurations and handle edge cases

**BREAKING**: Existing `executarLoginPJE` and `rasparProcessosPJE` functions will require additional parameters for TRT and grau selection.

## Impact

### Affected Specs
- `pje-automation` (NEW) - Core PJE automation capability specification

### Affected Code
- `lib/api/pje-adapter.ts` - Remove hardcoded URLs, add TRT/grau parameters
- `lib/types/pje.ts` - Add TRT enum types, Tribunal interfaces
- `lib/types/index.ts` - Export new TRT types
- `prisma/schema.prisma` - Add Tribunal, TribunalConfig models
- `app/actions/pje.ts` - Update server actions to accept TRT/grau
- `server/scripts/pje-trt/` - Update all PJE scripts to use dynamic configuration
- `server/scripts/pje-trt/common/login.js` - Parameterize login URL
- All scrapers in `server/scripts/pje-trt/trt3/` - Make TRT-agnostic

### Migration Path
1. Existing TRT3 users will continue to work after database migration
2. Default TRT will be TRT3 for backward compatibility
3. New TRT selection will be opt-in via API parameters
