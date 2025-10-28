# Tasks: Add TJ, TRF, and Superior Tribunals

## Phase 1: Database Schema and Migration

### Task 1.1: Update Prisma Schema
- [ ] Add `sistema` field to `TribunalConfig` model (String, required)
- [ ] Expand `grau` field documentation to include "unico" value
- [ ] Change unique constraint from `[tribunalId, grau]` to `[tribunalId, sistema, grau]`
- [ ] Make `urlApi` field nullable (String?)
- [ ] Add index on `sistema` field for query optimization
- [ ] Update `tipoTribunal` enum in `CredencialTribunal` to include "Superior"

**Validation**: Run `npx prisma format` and `npx prisma validate`

### Task 1.2: Create Database Migration
- [ ] Run `npx prisma migrate dev --name add_sistema_and_grau_unico`
- [ ] Verify migration file includes default value "PJE" for existing records
- [ ] Test migration on development database
- [ ] Verify all 48 existing TRT configs have sistema="PJE" after migration

**Validation**: Query `SELECT DISTINCT sistema FROM "TribunalConfig"` returns only "PJE"

### Task 1.3: Update Existing TRT Seeds to Include Sistema
- [ ] Update `prisma/seeds/tribunal-configs.ts` to include `sistema: 'PJE'` for all TRT configs
- [ ] Run seed script to verify no conflicts with migrated data

**Validation**: Seed script completes without unique constraint errors

---

## Phase 2: Type System Updates

### Task 2.1: Expand Tribunal Types
- [ ] Add `TJCode` type in `lib/types/tribunal.ts` with all 27 TJ codes
- [ ] Add `TRFCode` type with 6 TRF codes (TRF1-TRF6)
- [ ] Add `TribunalSuperiorCode` type with 3 codes (TST, STJ, STF)
- [ ] Create `TribunalCode` union type combining all four types
- [ ] Export all new types

**Validation**: TypeScript compilation succeeds

### Task 2.2: Add Sistema Type
- [ ] Define `Sistema` type in `lib/types/tribunal.ts` with values: "PJE" | "EPROC" | "ESAJ" | "PROJUDI" | "THEMIS"
- [ ] Add `sistema` field to `TribunalConfig` interface
- [ ] Add `sistema` field to `TribunalConfigConstant` interface

**Validation**: No TypeScript errors in files importing these types

### Task 2.3: Expand Grau Type
- [ ] Update `Grau` type to include "unico": `"1g" | "2g" | "unico"`
- [ ] Update all type guards and validation functions that check grau values

**Validation**: Search for `Grau` usage and verify all sites handle "unico"

### Task 2.4: Update Credential Types
- [ ] Update `TipoTribunal` in `lib/types/credentials.ts` to include "Superior"
- [ ] Verify all credential-related interfaces reference updated types

**Validation**: TypeScript compilation succeeds in credential modules

---

## Phase 3: Seed Data Creation

### Task 3.1: Create TJ Tribunal Seeds
- [ ] Create `prisma/seeds/tribunais-tj.ts` with all 27 TJ tribunals
- [ ] Include metadata: codigo, nome, regiao, uf, cidadeSede, ativo
- [ ] Verify UF mappings are correct (TJSP → SP, TJMG → MG, etc.)

**Validation**: File exports `tribunaisTJSeed` array with 27 entries

### Task 3.2: Create TJ Config Seeds
- [ ] Create `prisma/seeds/tribunal-configs-tj.ts`
- [ ] Add configs for each TJ with accurate URLs from `docs/TJS_TRFS_TRIBUNAIS_SUPERIORES.md`
- [ ] Handle multi-system tribunals (TJCE has PJE + ESAJ, TJMG has PJE + THEMIS + PJE-TR)
- [ ] Handle unified access tribunals (TJSP, TJMS, TJAL use grau="unico")
- [ ] Set urlApi to null for non-PJE systems

**Validation**: File exports `tribunalConfigsTJSeed` array with ~60-70 entries

### Task 3.3: Create TRF Tribunal Seeds
- [ ] Create `prisma/seeds/tribunais-trf.ts` with all 6 TRF tribunals
- [ ] Include metadata for each TRF

**Validation**: File exports `tribunaisTRFSeed` array with 6 entries

### Task 3.4: Create TRF Config Seeds
- [ ] Create `prisma/seeds/tribunal-configs-trf.ts`
- [ ] Add configs based on docs:
  - TRF1: PJE 1g + PJE 2g
  - TRF2: EPROC unico
  - TRF3: PJE 1g + PJE 2g
  - TRF4: EPROC unico
  - TRF5: PJE unico (single instance PJE)
  - TRF6: EPROC 1g + EPROC 2g

**Validation**: File exports `tribunalConfigsTRFSeed` array with ~10 entries

### Task 3.5: Create Superior Tribunal Seeds
- [ ] Create `prisma/seeds/tribunais-superiores.ts` with TST, STJ, STF
- [ ] Create `prisma/seeds/tribunal-configs-superiores.ts` with URLs
- [ ] All use grau="unico" (no instance separation)

**Validation**: Files export seed arrays with 3 tribunals and 3 configs

### Task 3.6: Update Seed Orchestration Script
- [ ] Update `prisma/seed.ts` to import new seed files
- [ ] Merge all tribunal seeds into one array
- [ ] Merge all config seeds into one array
- [ ] Ensure proper ordering (tribunals before configs)

**Validation**: Run `npx prisma db seed` completes without errors

---

## Phase 4: Constants and Helper Functions

### Task 4.1: Expand TRIBUNAL_CONFIGS Constant
- [ ] Update `lib/constants/tribunais.ts` to include all new configs
- [ ] Add `sistema` field to each constant entry
- [ ] Update ID format to include sistema: "TJCE-PJE-1g"
- [ ] Group constants by type for readability

**Validation**: Constant includes ~168 entries (48 TRTs + ~120 others)

### Task 4.2: Create ID Parsing Helper
- [ ] Create `parseTribunalConfigId(id: string)` function
- [ ] Handle legacy format "TRT3-1g" → upgrade to { codigo: "TRT3", sistema: "PJE", grau: "1g" }
- [ ] Handle new format "TJCE-PJE-1g" → { codigo: "TJCE", sistema: "PJE", grau: "1g" }
- [ ] Throw error for invalid formats

**Validation**: Unit tests pass for both legacy and new formats

### Task 4.3: Create ID Generation Helper
- [ ] Create `getTribunalConfigId(codigo, sistema, grau)` function
- [ ] Returns format "CODIGO-SISTEMA-GRAU"
- [ ] Add TypeScript overloads for type safety

**Validation**: Function generates correct IDs for all combinations

### Task 4.4: Update Tipo Tribunal Inference
- [ ] Update `getTipoTribunal(codigo: string)` helper
- [ ] Add logic for TST/STJ/STF → "Superior"
- [ ] Keep TRT/TJ/TRF prefix detection

**Validation**: Unit tests cover all tribunal types

---

## Phase 5: Frontend Updates

### Task 5.1: Update TribunalSelector Data Structure
- [ ] Update `useMemo` hook to group by tribunal → sistema → configs
- [ ] Create nested Map structure: `Map<codigo, Map<sistema, TribunalConfigConstant[]>>`
- [ ] Sort sistemas alphabetically within each tribunal

**Validation**: Console log shows correct nested structure

### Task 5.2: Update TribunalSelector Rendering
- [ ] Add sistema badge component (PJE, ESAJ, EPROC badges with different colors)
- [ ] Add fourth-level nesting for sistema groups
- [ ] Update grau label logic: "unico" → "Acesso Único", "1g" → "1º Grau", "2g" → "2º Grau"
- [ ] Update checkbox selection logic to handle 4-level hierarchy

**Validation**: Visual inspection shows correct grouping and labels

### Task 5.3: Add Sistema Badge Styles
- [ ] Create Badge component variants for each sistema type
- [ ] PJE: blue badge
- [ ] EPROC: green badge
- [ ] ESAJ: purple badge
- [ ] PROJUDI: orange badge
- [ ] THEMIS: red badge

**Validation**: Storybook or manual testing shows all badge variants

### Task 5.4: Update Credentials Page ID Handling
- [ ] Update `app/(dashboard)/pje/credentials/page.tsx` to handle new ID format
- [ ] Update server action to parse IDs correctly
- [ ] Update CredencialTribunal creation logic to use parsed sistema value

**Validation**: Can create credential with new tribunal configs

### Task 5.5: Update Backend Tribunal Query Logic
- [ ] Update `app/actions/pje.ts` to query by (codigo, sistema, grau)
- [ ] Replace old query `WHERE tribunalId = ? AND grau = ?`
- [ ] With new query `WHERE tribunal.codigo = ? AND sistema = ? AND grau = ?`

**Validation**: Credentials associate correctly with new configs

---

## Phase 6: Credential Seeding

### Task 6.1: Create Credential Seed Data File
- [ ] Create `prisma/seeds/credenciais-tj.ts`
- [ ] Parse credential table from `docs/TJS_TRFS_TRIBUNAIS_SUPERIORES.md`
- [ ] Structure data by advogado CPF with nested credentials array
- [ ] Include tribunal codigo, sistema, grau, senha, observacoes

**Validation**: File exports `credenciaisTJSeed` array with ~30 credential entries

### Task 6.2: Create Credential Seeding Script
- [ ] Create `scripts/seed-tj-credentials.ts`
- [ ] Find or create Advogado records by CPF (07529294610, 05234885640)
- [ ] For each credential, find matching TribunalConfig by (codigo, sistema, grau)
- [ ] Create Credencial record with password
- [ ] Create CredencialTribunal link with correct tipoTribunal
- [ ] Skip duplicates (check advogadoId + senha unique constraint)

**Validation**: Script runs without errors and creates expected credentials

### Task 6.3: Handle Advogado Creation
- [ ] Check if advogados exist by CPF
- [ ] If not found, prompt user to create them manually via UI first
- [ ] Or create as solo lawyers with placeholder OAB data

**Validation**: Script handles missing advogados gracefully

### Task 6.4: Add Credential Validation
- [ ] Verify each created credential links to correct TribunalConfig
- [ ] Check tipoTribunal is set correctly (TJ for TJDFT, etc.)
- [ ] Log summary of created credentials grouped by tribunal

**Validation**: Script output shows credential count per tribunal

---

## Phase 7: Testing and Validation

### Task 7.1: Database Validation Queries
- [ ] Run query to count tribunals by type (should show TRT:24, TJ:27, TRF:6, Superior:3)
- [ ] Run query to count configs by sistema (should show PJE:~XX, EPROC:~XX, ESAJ:~XX, etc.)
- [ ] Verify TJCE has exactly 3 configs (PJE-1g, PJE-2g, ESAJ-unico)
- [ ] Verify all TRT configs have sistema="PJE"

**Validation**: All queries return expected counts

### Task 7.2: Frontend UI Testing
- [ ] Navigate to `/pje/credentials` page
- [ ] Verify "Tribunais de Justiça" accordion shows 27 TJs
- [ ] Verify "Tribunais Regionais Federais" accordion shows 6 TRFs
- [ ] Verify "Tribunais Superiores" accordion shows 3 entries
- [ ] Select TJCE and verify sistema badges show (PJE, ESAJ)
- [ ] Select TJSP and verify only ESAJ badge shows with "Acesso Único"

**Validation**: All UI elements render correctly

### Task 7.3: Credential Association Testing
- [ ] Create new credential for existing lawyer
- [ ] Select multiple TJ configs (e.g., TJDFT-PJE-1g, TJSP-ESAJ-unico)
- [ ] Submit form
- [ ] Verify CredencialTribunal records created correctly
- [ ] Verify tipoTribunal field is "TJ" for both

**Validation**: Credential shows correct tribunal associations

### Task 7.4: ID Parsing Testing
- [ ] Test legacy ID "TRT3-1g" still works (auto-upgraded to TRT3-PJE-1g)
- [ ] Test new ID "TJCE-PJE-1g" works correctly
- [ ] Test invalid ID "INVALID" throws appropriate error

**Validation**: All parsing tests pass

### Task 7.5: Type System Validation
- [ ] Run `npm run build` to compile TypeScript
- [ ] Verify no TypeScript errors in any file
- [ ] Run ESLint to check for type issues

**Validation**: Clean build with zero errors

---

## Phase 8: Documentation and Cleanup

### Task 8.1: Update README Documentation
- [ ] Update main README to mention TJ/TRF/Superior support
- [ ] Document new tribunal config ID format
- [ ] Add examples of multi-sistema tribunals

**Validation**: Documentation is clear and accurate

### Task 8.2: Update OpenSpec Validation
- [ ] Run `openspec validate add-tj-trf-superior-tribunals --strict`
- [ ] Resolve any validation errors
- [ ] Ensure all spec deltas are properly formatted

**Validation**: `openspec validate` passes with zero errors

### Task 8.3: Create Migration Rollback Plan
- [ ] Document steps to rollback schema migration if needed
- [ ] Create backup SQL script of existing TRT data
- [ ] Test rollback procedure on staging database

**Validation**: Rollback restores original state

---

## Success Criteria

All tasks completed when:
- ✅ Database contains 60 tribunals (24 TRT + 27 TJ + 6 TRF + 3 Superior)
- ✅ Database contains ~168 tribunal configs (accounting for multi-sistema)
- ✅ Frontend displays all tribunals grouped correctly
- ✅ Credentials can be associated with any tribunal config
- ✅ Test credentials exist for 2 advogados with TJ/TRF tribunals
- ✅ TypeScript compilation succeeds with no errors
- ✅ OpenSpec validation passes
- ✅ All existing TRT functionality remains working

## Dependencies

- **Task 1.2** depends on **Task 1.1** (schema before migration)
- **Tasks 3.1-3.5** depend on **Task 1.2** (migration must run first)
- **Task 3.6** depends on **Tasks 3.1-3.5** (all seed files must exist)
- **Tasks 4.1-4.4** can run in parallel with Phase 3
- **Phase 5** depends on **Tasks 2.1-2.3** (types must exist)
- **Task 6.2** depends on **Task 3.6** (configs must be seeded first)
- **Phase 7** depends on all previous phases

## Estimated Timeline

- Phase 1: 2 hours
- Phase 2: 1 hour
- Phase 3: 4 hours (most time-consuming: URL transcription)
- Phase 4: 2 hours
- Phase 5: 4 hours
- Phase 6: 2 hours
- Phase 7: 2 hours
- Phase 8: 1 hour

**Total**: ~18 hours (conservative estimate including testing time)
