# Design: Multi-System Tribunal Architecture

## Problem Space

### Current Limitations

The existing system was designed around TRTs (Tribunais Regionais do Trabalho), which have a uniform structure:
- All 24 TRTs use PJE (Processo Judicial Eletrônico)
- All follow the URL pattern `https://pje.trt{N}.jus.br/{primeirograu|segundograu}/`
- All have two instances: 1º grau (first instance) and 2º grau (appeals court)

This creates three architectural assumptions that break for other tribunals:

1. **Single System Per Tribunal**: The unique constraint `@@unique([tribunalId, grau])` in `TribunalConfig` allows only one configuration per tribunal + grau combination
2. **Binary Grau**: The grau field assumes all tribunals have exactly two instances
3. **Implicit PJE**: There's no field to distinguish between PJE, EPROC, ESAJ, PROJUDI, or THEMIS

### Real-World Complexity

From the documentation (`docs/TJS_TRFS_TRIBUNAIS_SUPERIORES.md`), we see:

**TJCE (Ceará)** - Uses TWO different systems:
- PJE for 1º grau: `https://pje.tjce.jus.br/pje1grau/login.seam`
- PJE for 2º grau: `https://pje.tjce.jus.br/pje2grau/login.seam`
- ESAJ for unified access: `https://esaj.tjce.jus.br/sajcas/login?...`

**TJMG (Minas Gerais)** - Uses THREE different systems:
- PJE for 1º grau: `https://pje.tjmg.jus.br/pje/login.seam`
- THEMIS for 2º grau: `https://pe.tjmg.jus.br/rupe/portaljus/intranet/principal.rupe`
- PJE for Turma Recursal: `https://pjerecursal.tjmg.jus.br/pje/login.seam`

**TJSP (São Paulo)** - Unified access only:
- ESAJ only: `https://esaj.tjsp.jus.br/sajcas/login?...`
- No 1º/2º grau separation

**TRF2** - Unified EPROC access:
- EPROC only: `https://eproc.trf2.jus.br/eproc/`
- No 1º/2º grau separation

## Design Decisions

### Decision 1: Add `sistema` Field to TribunalConfig

**Chosen Approach**: Add a required `sistema` field (enum: PJE, EPROC, ESAJ, PROJUDI, THEMIS)

**Alternatives Considered**:

1. ❌ **Create separate Tribunal records** (e.g., TJCE-PJE, TJCE-ESAJ)
   - **Rejected**: Violates domain model - TJCE is ONE tribunal, not two
   - Would create confusion in UI ("Which TJCE do I select?")
   - Breaks semantic meaning of Tribunal entity

2. ✅ **Add sistema field to TribunalConfig** (CHOSEN)
   - Preserves semantic integrity (one Tribunal = one court)
   - Allows multiple systems per tribunal
   - Clear separation of concerns (Tribunal = institution, TribunalConfig = technical access point)
   - Enables filtering and grouping by system type

3. ❌ **Infer system from URL pattern**
   - **Rejected**: Too brittle and error-prone
   - URLs can change without system type changing
   - Makes queries complex (LIKE pattern matching on URLs)

**Implementation**:
```prisma
model TribunalConfig {
  id                 String   @id @default(uuid())
  tribunalId         String
  sistema            String   // "PJE" | "EPROC" | "ESAJ" | "PROJUDI" | "THEMIS"
  grau               String   // "1g" | "2g" | "unico"
  urlBase            String
  urlLoginSeam       String
  urlApi             String?  // Nullable

  @@unique([tribunalId, sistema, grau])  // NEW constraint
}
```

### Decision 2: Expand `grau` to Include "unico"

**Chosen Approach**: Allow grau to be "1g", "2g", or "unico"

**Alternatives Considered**:

1. ❌ **Make grau nullable**
   - **Rejected**: NULL has ambiguous meaning (missing data vs unified access?)
   - Breaks existing queries that assume grau is non-null
   - Complicates filtering and sorting

2. ❌ **Create both 1g and 2g configs with same URL**
   - **Rejected**: Data duplication
   - Confusing for users ("Why are there two entries?")
   - Maintenance burden (change URL in two places)

3. ✅ **Add "unico" as explicit grau value** (CHOSEN)
   - Clear semantic intent
   - Easy to filter (WHERE grau = 'unico')
   - Frontend can hide grau checkboxes when seeing "unico"
   - Aligns with Brazilian legal terminology ("Acesso Único")

**Frontend Mapping**:
```typescript
const grauLabel = {
  '1g': '1º Grau',
  '2g': '2º Grau',
  'unico': 'Acesso Único'
}[config.grau];
```

### Decision 3: Change Unique Constraint

**Current**: `@@unique([tribunalId, grau])`
**New**: `@@unique([tribunalId, sistema, grau])`

**Rationale**:
- TJCE needs both (PJE, 1g) and (ESAJ, unico) → current constraint blocks this
- New constraint allows: TJCE + PJE + 1g AND TJCE + ESAJ + unico
- Still prevents duplicates: can't have two (TJCE + PJE + 1g) configs

**Migration Impact**:
- All existing TRT configs have implicit sistema="PJE"
- Migration adds sistema field with default "PJE"
- No data loss, no duplicates created

### Decision 4: Make `urlApi` Nullable

**Rationale**:
- PJE systems have API: `https://pje.trt3.jus.br/pje-comum-api/api`
- ESAJ systems have API: `https://esaj.tjsp.jus.br/esaj-api/`
- EPROC systems **do not have documented API**
- PROJUDI systems **do not have documented API**
- THEMIS systems **do not have documented API**

**Implementation**:
```prisma
urlApi String? // Nullable - not all systems expose APIs
```

**Query Impact**:
```typescript
// Safe querying
if (config.urlApi) {
  const response = await fetch(`${config.urlApi}/paineladvogado/${id}/processos`);
}
```

### Decision 5: Tribunal Config ID Format

**Current Format**: `TRT3-1g`
**New Format**: `TRT3-PJE-1g`

**Rationale**:
- Old format is ambiguous for tribunals with multiple systems
- "TJCE-1g" → Which system? PJE or ESAJ?
- New format is explicit: "TJCE-PJE-1g" vs "TJCE-ESAJ-unico"

**Parsing Strategy**:
```typescript
function parseTribunalConfigId(id: string) {
  const parts = id.split('-');

  if (parts.length === 2) {
    // Legacy format: "TRT3-1g" → upgrade to "TRT3-PJE-1g"
    return { codigo: parts[0], sistema: 'PJE', grau: parts[1] };
  }

  if (parts.length === 3) {
    // New format: "TJCE-PJE-1g"
    return { codigo: parts[0], sistema: parts[1], grau: parts[2] };
  }

  throw new Error(`Invalid tribunal config ID: ${id}`);
}
```

### Decision 6: Frontend Grouping Strategy

**UI Structure**:
```
Tribunais de Justiça (TJs)
  TJCE [checkbox: select all]
    PJE:
      □ 1º Grau
      □ 2º Grau
    ESAJ:
      □ Acesso Único

  TJSP [checkbox: select all]
    ESAJ:
      □ Acesso Único

Tribunais Regionais Federais (TRFs)
  TRF2 [checkbox: select all]
    EPROC:
      □ Acesso Único
```

**Rationale**:
- Groups by tribunal type (TJ, TRF, etc.) for easy navigation
- Then by tribunal code (TJCE, TJSP, etc.)
- Then by sistema (PJE, ESAJ, etc.) - NEW level
- Then by grau (1g, 2g, unico)
- Clear visual hierarchy with indentation and badges

**Component Structure**:
```typescript
// Data structure
const tribunaisAgrupados = {
  TJ: [
    {
      codigo: 'TJCE',
      sistemas: {
        PJE: [
          { id: 'TJCE-PJE-1g', grau: '1g' },
          { id: 'TJCE-PJE-2g', grau: '2g' }
        ],
        ESAJ: [
          { id: 'TJCE-ESAJ-unico', grau: 'unico' }
        ]
      }
    }
  ]
};
```

## Data Flow

### Credential Creation Flow

1. **User selects lawyer** → Opens credential form
2. **User enters password** → Input field
3. **User selects tribunals** → Opens TribunalSelector
4. **TribunalSelector groups configs** → By type → code → sistema → grau
5. **User selects multiple configs** → e.g., "TJCE-PJE-1g", "TJCE-ESAJ-unico"
6. **Backend receives IDs** → Parses each ID to extract (codigo, sistema, grau)
7. **Backend queries TribunalConfig** → WHERE tribunal.codigo AND sistema AND grau
8. **Backend creates CredencialTribunal** → Links credencial to each config
9. **Result**: One credential works across multiple systems

### Login Flow (Future)

1. **Scraper requests credential** → For tribunal "TJCE-PJE-1g"
2. **System parses ID** → (codigo: TJCE, sistema: PJE, grau: 1g)
3. **System queries config** → Finds TribunalConfig matching all three
4. **System retrieves credential** → Finds active CredencialTribunal
5. **System loads sistema-specific script** → `server/scripts/pje-comum/login-pje.js`
6. **Script uses correct URL** → From config.urlLoginSeam
7. **Authentication succeeds** → Updates validadoEm timestamp

## Seed Data Structure

### Tribunal Seeds
```typescript
// prisma/seeds/tribunais-tj.ts
export const tribunaisTJSeed = [
  {
    codigo: 'TJSP',
    nome: 'Tribunal de Justiça de São Paulo',
    regiao: 'Sudeste',
    uf: 'SP',
    cidadeSede: 'São Paulo',
    ativo: true
  },
  // ... 26 more TJs
];
```

### Config Seeds
```typescript
// prisma/seeds/tribunal-configs-tj.ts
export const tribunalConfigsTJSeed = [
  // TJSP - Single ESAJ system
  {
    tribunalCodigo: 'TJSP',
    sistema: 'ESAJ',
    grau: 'unico',
    urlBase: 'https://esaj.tjsp.jus.br',
    urlLoginSeam: 'https://esaj.tjsp.jus.br/sajcas/login?service=https%3A%2F%2Fesaj.tjsp.jus.br%2Fesaj%2Fj_spring_cas_security_check',
    urlApi: null // ESAJ API not documented
  },

  // TJCE - Multiple systems
  {
    tribunalCodigo: 'TJCE',
    sistema: 'PJE',
    grau: '1g',
    urlBase: 'https://pje.tjce.jus.br',
    urlLoginSeam: 'https://pje.tjce.jus.br/pje1grau/login.seam',
    urlApi: 'https://pje.tjce.jus.br/pje-comum-api/api'
  },
  {
    tribunalCodigo: 'TJCE',
    sistema: 'PJE',
    grau: '2g',
    urlBase: 'https://pje.tjce.jus.br',
    urlLoginSeam: 'https://pje.tjce.jus.br/pje2grau/login.seam',
    urlApi: 'https://pje.tjce.jus.br/pje-comum-api/api'
  },
  {
    tribunalCodigo: 'TJCE',
    sistema: 'ESAJ',
    grau: 'unico',
    urlBase: 'https://esaj.tjce.jus.br',
    urlLoginSeam: 'https://esaj.tjce.jus.br/sajcas/login?service=https%3A%2F%2Fesaj.tjce.jus.br%2Fesaj%2Fj_spring_cas_security_check',
    urlApi: null
  }
];
```

## Testing Strategy

### Unit Tests
- Test ID parsing for all formats (legacy and new)
- Test tipo tribunal inference (TRT/TJ/TRF/Superior from codigo)
- Test unique constraint enforcement

### Integration Tests
- Create credential with multiple sistema associations
- Query configs by (codigo, sistema, grau) tuple
- Verify frontend displays all tribunal types correctly

### Data Validation
```sql
-- Verify TJCE has 3 configs
SELECT tc.sistema, tc.grau, tc.urlLoginSeam
FROM "TribunalConfig" tc
JOIN "Tribunal" t ON tc."tribunalId" = t.id
WHERE t.codigo = 'TJCE';

-- Expected result:
-- PJE    | 1g     | https://pje.tjce.jus.br/pje1grau/login.seam
-- PJE    | 2g     | https://pje.tjce.jus.br/pje2grau/login.seam
-- ESAJ   | unico  | https://esaj.tjce.jus.br/sajcas/login?...
```

## Future Extensibility

### Adding New Systems
To support a new system (e.g., "SAJ"):
1. Add "SAJ" to Sistema enum
2. Create seed data with SAJ URLs
3. Implement `server/scripts/saj-comum/login-saj.js`
4. Update frontend to recognize SAJ badges

**No schema changes required** - architecture is system-agnostic.

### Adding New Tribunal Types
To support a new tribunal category (e.g., "TRE" - Tribunais Regionais Eleitorais):
1. Add TRE codes to TribunalCode type
2. Update tipoTribunal logic to recognize "TRE" prefix
3. Add TRE section to TribunalSelector component
4. Create seed data for TRE tribunals

**No database changes required** - Tribunal.codigo is flexible String.

## Performance Considerations

### Query Optimization
Current query:
```typescript
// Before: 2 fields in WHERE clause
WHERE tribunalId = ? AND grau = ?
```

New query:
```typescript
// After: 3 fields in WHERE clause
WHERE tribunalId = ? AND sistema = ? AND grau = ?
```

**Impact**: Negligible - all three fields are indexed.

### Seed Data Volume
- Current: 48 TribunalConfig records (24 TRTs × 2 graus)
- After: ~168 TribunalConfig records (48 TRTs + ~120 TJs/TRFs/Superior)
- **Impact**: 3.5x increase, still trivial for database

### Frontend Performance
- TribunalSelector now renders 3 levels instead of 2
- Grouping happens in `useMemo` hook - computed once per render
- Expected render time: <50ms for 168 configs

## Risks and Mitigations

### Risk: URL Accuracy
**Problem**: Manual transcription of 120+ URLs from document
**Mitigation**:
- Create validation script to ping each URL
- Cross-reference with official tribunal websites
- Flag any 404s or redirects

### Risk: Schema Migration
**Problem**: Adding required field to existing table
**Mitigation**:
- Use default value "PJE" for existing records
- Run migration in transaction
- Test rollback procedure

### Risk: ID Parsing Regression
**Problem**: Old code assumes 2-part IDs (TRT3-1g)
**Mitigation**:
- Implement backward-compatible parser
- Add explicit tests for legacy format
- Grep codebase for `.split('-')` patterns

### Risk: Frontend Complexity
**Problem**: 3-level grouping adds UI complexity
**Mitigation**:
- Keep UI patterns consistent (accordion + checkboxes)
- Add visual cues (badges, indentation)
- Test with screen readers for accessibility
