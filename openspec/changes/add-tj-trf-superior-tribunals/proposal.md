# Proposal: Add Support for TJ, TRF, and Superior Tribunals

## Why

Currently, the system only supports the 24 TRTs (Tribunais Regionais do Trabalho), which exclusively use the PJE system with a standardized URL pattern. However, legal professionals need to automate access to:

1. **27 State Justice Courts (TJs)** - which use different systems (PJE, EPROC, ESAJ, PROJUDI, THEMIS)
2. **6 Federal Regional Courts (TRFs)** - which use PJE or EPROC
3. **3 Superior Courts** - TST, STJ, STF (each with custom systems)

The current architecture assumes:
- All tribunals use PJE
- All tribunals follow the same URL pattern (`pje.trt{N}.jus.br`)
- All tribunals have 1º grau and 2º grau (first and second instance)

This assumption breaks for:
- **TJSP** (São Paulo) - uses ESAJ only, unified access (no grau separation)
- **TJCE** (Ceará) - uses both PJE (1º/2º grau) AND ESAJ (unified access)
- **TRF2** - uses EPROC only, unified access
- **TJMG** (Minas Gerais) - uses PJE (1º grau), THEMIS (2º grau), and PJE (turma recursal)

## What Changes

### 1. Database Schema Expansion
- Add `sistema` field to `TribunalConfig` model (enum: PJE, EPROC, ESAJ, PROJUDI, THEMIS)
- Expand `grau` values to include "unico" (unified access) alongside "1g" and "2g"
- Change unique constraint from `[tribunalId, grau]` to `[tribunalId, sistema, grau]`
- Make `urlApi` nullable (not all systems have APIs)
- Update `tipoTribunal` enum to include "Superior" alongside "TRT", "TJ", "TRF"

**Rationale**: A single tribunal can now have multiple system configurations. For example, TJCE will have 3 configs:
- TJCE + PJE + 1g
- TJCE + PJE + 2g
- TJCE + ESAJ + unico

### 2. Seed Data for New Tribunals
- Create seeds for 27 TJs with accurate URLs from documentation
- Create seeds for 6 TRFs with accurate URLs
- Create seeds for 3 Superior Courts (TST, STJ, STF)
- Seed test credentials for existing lawyers (CPF 07529294610 and 05234885640)

**Total new records**:
- ~36 new Tribunal records (27 TJs + 6 TRFs + 3 Superior)
- ~120 new TribunalConfig records (accounting for multiple systems per tribunal)
- ~30 new Credencial and CredencialTribunal records

### 3. Type System Expansion
- Define `TJCode` type with 27 state codes (TJSP, TJMG, TJCE, etc.)
- Define `TRFCode` type with 6 regional codes (TRF1 through TRF6)
- Define `TribunalSuperiorCode` type (TST, STJ, STF)
- Expand `TribunalCode` union to include all four types
- Define `Sistema` type (PJE, EPROC, ESAJ, PROJUDI, THEMIS)
- Expand `Grau` type to include "unico"

### 4. Frontend Updates
- Update `TribunalSelector` component to group by tribunal → sistema → grau
- Display sistema badges (PJE, ESAJ, EPROC, etc.) in the UI
- Show "Acesso Único" for grau="unico" instead of "1º/2º Grau"
- Update tribunal config ID format from "TRT3-1g" to "TRT3-PJE-1g"
- Populate TJ, TRF, and Superior sections that are currently empty

### 5. Constants Updates
- Expand `TRIBUNAL_CONFIGS` constant with all TJ, TRF, and Superior configurations
- Update helper functions to parse new ID format (CODIGO-SISTEMA-GRAU)
- Add sistema field to all constant definitions

## Impact

### Breaking Changes
1. **Database Schema**: The unique constraint change requires a migration
2. **ID Format**: Frontend now sends "TRT3-PJE-1g" instead of "TRT3-1g"
3. **Backend Parsing**: All code that parses tribunal IDs must be updated

### Backward Compatibility Strategy
- Existing TRT configs receive `sistema = "PJE"` via migration (all TRTs use PJE)
- Old ID format "TRT3-1g" can be auto-upgraded to "TRT3-PJE-1g" by parsers
- No existing credentials are affected

### New Capabilities Enabled
1. **Multi-system support**: Lawyers can now manage credentials for multiple systems per tribunal
2. **Unified access**: Systems without grau separation (ESAJ, some EPROC) are properly modeled
3. **Scalability**: Architecture supports future tribunal types and systems

### Out of Scope
This change **does not include**:
- Implementing scrapers for EPROC, ESAJ, PROJUDI, or THEMIS systems
- Testing credentials against non-PJE systems
- Migrating existing automation scripts to support new tribunals

These will be addressed in future change proposals after the infrastructure is in place.

## Risk Assessment

### Low Risk
- Database migration is straightforward with default values
- Frontend changes are isolated to credential management UI
- Type system changes are additive (no removals)

### Medium Risk
- Seed data volume is significant (~120 new configs)
- ID format change requires careful testing of all parsing logic
- URL accuracy depends on manual verification from documentation

### Mitigation
- Validate all URLs against the source document
- Run `openspec validate --strict` before deployment
- Test credential association UI with new tribunals
- Verify database queries handle new constraint correctly

## Validation Criteria

1. **Database**: All 36 new tribunals seeded with correct metadata
2. **Configs**: All 120 new configs created with accurate URLs
3. **Frontend**: TribunalSelector displays all tribunal types correctly
4. **Types**: TypeScript compilation succeeds with no errors
5. **Constants**: All helper functions parse new ID format correctly
6. **Credentials**: Test credentials can be associated with new tribunals
7. **Migration**: Existing TRT data is preserved with `sistema="PJE"`

## Timeline Estimate

- Schema migration: 1 hour
- Seed file creation: 3-4 hours
- Type system updates: 1 hour
- Constants updates: 2 hours
- Frontend updates: 3-4 hours
- Testing and validation: 2 hours

**Total**: ~12-14 hours of development work
