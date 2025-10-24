# Design Document: Multi-TRT Support

## Context

The current PJE automation system is hardcoded to work exclusively with TRT3 (Tribunal Regional do Trabalho da 3ª Região - Minas Gerais). All login URLs, API endpoints, and configurations reference `https://pje.trt3.jus.br` directly in the code. This creates several problems:

1. **Scalability**: Supporting other TRTs requires code duplication and manual URL changes
2. **Maintainability**: URL changes across 24 TRTs would require touching multiple files
3. **Flexibility**: Cannot easily handle edge cases where specific TRTs have non-standard URLs
4. **User Experience**: Lawyers working across multiple regions cannot automate processes in different TRTs

Brazil has 24 TRTs covering different geographic regions, each with two graus (judicial instances):
- 1º grau (first instance): Initial labor lawsuits
- 2º grau (appeals court): Appeals from first instance decisions

The PJE system is largely standardized across all TRTs, with predictable URL patterns, making it feasible to create a unified solution.

### Constraints
- Must maintain backward compatibility for existing TRT3 users
- Must handle edge cases where TRTs deviate from standard URL patterns
- Database must be SQLite (existing stack)
- TypeScript strict mode must be maintained
- Performance should not degrade with database lookups (caching may be needed)

### Stakeholders
- Legal professionals using the automation for multiple TRTs
- System administrators managing TRT configurations
- Developers maintaining the codebase

## Goals / Non-Goals

### Goals
- Support all 24 TRTs with minimal code changes
- Store TRT configurations in database for flexibility
- Provide type-safe TRT selection in TypeScript
- Enable URL overrides for edge cases
- Maintain backward compatibility with existing TRT3 usage
- Generate URLs following standard PJE patterns
- Organize TRTs by geographic region

### Non-Goals
- Supporting non-Labor courts (TJs, TRFs) - out of scope
- Real-time TRT URL discovery/validation - URLs will be configured once
- Multi-tribunal simultaneous scraping - each operation targets one TRT
- TRT-specific business logic variations - assume behavior is consistent
- Automatic URL pattern detection - patterns will be manually configured

## Decisions

### Decision 1: Database-Driven Configuration

**What**: Store all TRT configurations (URLs, metadata) in SQLite database using Prisma ORM.

**Why**:
- **Flexibility**: Administrators can update URLs without code changes
- **Edge Case Handling**: Allows URL overrides for TRTs with non-standard patterns
- **Single Source of Truth**: All TRT data centralized in one location
- **Auditability**: Configuration changes can be tracked

**Alternatives Considered**:
1. **Config file (JSON/YAML)**: Simpler but requires deployment for changes
2. **Hardcoded constants**: No flexibility, current problem
3. **Environment variables**: Too many URLs (48+), hard to manage

**Trade-offs**:
- ➕ Runtime flexibility
- ➕ No deployments needed for URL changes
- ➖ Slight performance overhead (mitigated by caching)
- ➖ Requires database migration

### Decision 2: Two-Model Schema (Tribunal + TribunalConfig)

**What**: Separate `Tribunal` model (static metadata) from `TribunalConfig` model (URLs per grau).

```prisma
model Tribunal {
  id         String            @id @default(uuid())
  codigo     String            @unique  // "TRT3", "TRT15"
  nome       String                     // "TRT da 3ª Região"
  regiao     String                     // "Sudeste"
  uf         String                     // "MG"
  cidadeSede String                     // "Belo Horizonte"
  ativo      Boolean           @default(true)
  configs    TribunalConfig[]
}

model TribunalConfig {
  id           String    @id @default(uuid())
  tribunal     Tribunal  @relation(fields: [tribunalId], references: [id])
  tribunalId   String
  grau         String    // "1g" | "2g"
  urlBase      String    // "https://pje.trt3.jus.br"
  urlLoginSeam String    // "https://pje.trt3.jus.br/primeirograu/login.seam"
  urlApi       String    // "https://pje.trt3.jus.br/pje-comum-api/api"
}
```

**Why**:
- **Normalization**: Tribunal metadata doesn't duplicate across graus
- **Clarity**: Separation of concerns (identity vs. configuration)
- **Extensibility**: Easy to add more graus or configuration types later

**Alternatives Considered**:
1. **Single model with embedded configs**: Simpler but less normalized
2. **JSON field for URLs**: Less type-safe, harder to query

### Decision 3: TypeScript Union Types for TRT Codes

**What**: Define TRT codes as literal union type rather than enum or string.

```typescript
export type TRTCode =
  | 'TRT1' | 'TRT2' | 'TRT3' | 'TRT4' | 'TRT5' | 'TRT6'
  | 'TRT7' | 'TRT8' | 'TRT9' | 'TRT10' | 'TRT11' | 'TRT12'
  | 'TRT13' | 'TRT14' | 'TRT15' | 'TRT16' | 'TRT17' | 'TRT18'
  | 'TRT19' | 'TRT20' | 'TRT21' | 'TRT22' | 'TRT23' | 'TRT24';

export type Grau = '1g' | '2g';
```

**Why**:
- **Type Safety**: Autocomplete and compile-time validation
- **Readability**: Clear which values are valid
- **No Magic Numbers**: Self-documenting code
- **Easier Refactoring**: TypeScript catches invalid references

**Alternatives Considered**:
1. **Enum**: More verbose, harder to use as object keys
2. **Plain string**: No type safety
3. **Const array**: Less ergonomic for types

### Decision 4: URL Pattern Generation with Override Support

**What**: Generate URLs following standard pattern, but allow database overrides.

```typescript
function generatePJEUrl(trtNum: number, grau: Grau, path: string = ''): string {
  const grauPath = grau === '1g' ? 'primeirograu' : 'segundograu';
  return `https://pje.trt${trtNum}.jus.br/${grauPath}${path}`;
}
```

Database can override any URL if pattern doesn't match reality.

**Why**:
- **DRY Principle**: Don't repeat 48 similar URLs manually
- **Maintainability**: Pattern change updates all TRTs
- **Flexibility**: Edge cases handled via database override

**Alternatives Considered**:
1. **All URLs hardcoded in seed**: More explicit but harder to maintain
2. **No generation, only overrides**: More manual work

### Decision 5: Grau Encoding as '1g' / '2g'

**What**: Use short codes '1g' and '2g' instead of full names.

**Why**:
- **Brevity**: Shorter to type and store
- **Consistency**: Matches URL pattern naming (primeirograu, segundograu)
- **Clarity**: 'g' suffix clearly indicates "grau"

**Alternatives Considered**:
1. **Full names**: "primeiro_grau", "segundo_grau" - too verbose
2. **Numbers**: 1, 2 - less clear in code
3. **URL fragments**: "primeirograu", "segundograu" - too long

### Decision 6: Backward Compatibility via Default Parameters

**What**: Add TRT/grau parameters with defaults to preserve existing behavior.

```typescript
export async function executarLoginPJE(
  cpf: string,
  senha: string,
  trt: TRTCode = 'TRT3',
  grau: Grau = '1g'
): Promise<LoginResult>
```

**Why**:
- **Non-Breaking**: Existing calls continue working
- **Gradual Migration**: Users can adopt new features incrementally
- **Least Surprise**: Default behavior matches current system

**Alternatives Considered**:
1. **Separate functions**: `loginTRT3()`, `loginMultiTRT()` - duplication
2. **Required parameters**: Breaking change for all users

### Decision 7: Regional Organization

**What**: Store regional metadata (Norte, Nordeste, Centro-Oeste, Sudeste, Sul) with each TRT.

**Why**:
- **User Experience**: Lawyers can filter by region
- **Logical Grouping**: Matches geographic organization of Brazil's courts
- **Future Analytics**: Regional reporting and insights

**Data Structure**:
```
Sudeste: TRT1(RJ), TRT2(SP), TRT3(MG), TRT15(Campinas)
Sul: TRT4(RS), TRT9(PR), TRT12(SC)
Nordeste: TRT5(BA), TRT6(PE), TRT7(CE), TRT11(AM/RR), TRT14(RO/AC), TRT19(AL), TRT22(PI)
Centro-Oeste: TRT10(DF/TO), TRT18(GO), TRT23(MT)
Norte: TRT8(PA/AP), TRT11(AM/RR), TRT14(RO/AC)
```

## Risks / Trade-offs

### Risk 1: URL Pattern Assumptions May Be Wrong
**Description**: Assuming all TRTs follow `https://pje.trt{N}.jus.br/{grau}/` pattern may be incorrect.

**Likelihood**: Medium - Most TRTs likely follow this, but some may deviate.

**Impact**: High - Broken login/scraping for affected TRTs.

**Mitigation**:
- Implement URL override capability in database
- Test with multiple TRTs during implementation
- Document process for administrators to update URLs
- Add URL validation/connectivity checks

### Risk 2: Performance Degradation from Database Lookups
**Description**: Every login/scrape operation requires database query for TRT config.

**Likelihood**: Low - SQLite reads are very fast.

**Impact**: Low - Minimal latency addition (< 1ms).

**Mitigation**:
- Implement in-memory caching of TRT configs
- Use Prisma's query optimization
- Benchmark performance before/after

### Risk 3: Breaking Changes for Existing Integrations
**Description**: Even with defaults, signature changes may break some integrations.

**Likelihood**: Low - Default parameters maintain compatibility.

**Impact**: Medium - Requires user code updates.

**Mitigation**:
- Use default parameters for backward compatibility
- Comprehensive migration guide
- Version bumping to signal changes

### Risk 4: Incomplete TRT Support Metadata
**Description**: May not have accurate regional/city data for all 24 TRTs initially.

**Likelihood**: Medium - Requires research to gather accurate metadata.

**Impact**: Low - Doesn't block functionality, only affects filtering/display.

**Mitigation**:
- Start with known TRTs (TRT1-TRT4)
- Crowdsource data from legal community
- Mark incomplete data explicitly

### Risk 5: TRT-Specific Variations Not Covered
**Description**: Some TRTs may have unique authentication flows or API differences.

**Likelihood**: Medium - PJE is standardized but variations exist.

**Impact**: High - Login/scraping may fail for affected TRTs.

**Mitigation**:
- Design system for extensibility (URL overrides)
- Document variation handling process
- Create TRT-specific adapters if needed (future work)
- Start with well-tested TRTs (TRT3, TRT2, TRT15)

## Migration Plan

### Phase 1: Database Setup (Non-Breaking)
1. Create and run Prisma migrations for new models
2. Seed database with all 48 TRT configurations
3. Verify data integrity

**Rollback**: Drop new tables, no impact on existing code.

### Phase 2: Type System & Service Layer (Non-Breaking)
1. Add new TypeScript types (TRTCode, Grau, etc.)
2. Implement tribunal service layer
3. Add tests for service layer
4. No changes to public APIs yet

**Rollback**: Remove new files, no impact.

### Phase 3: Update Core Functions (Breaking but Compatible)
1. Update `executarLoginPJE` and `rasparProcessosPJE` with default parameters
2. Test backward compatibility with existing TRT3 calls
3. Test new TRT functionality with TRT2, TRT15
4. Update documentation

**Rollback**: Revert function signatures, keep database/types for future use.

### Phase 4: Frontend Integration (Opt-In)
1. Add TRT selector to UI (optional feature)
2. Users can continue using TRT3 by default or select others
3. Gather feedback from early adopters

**Rollback**: Remove UI components, backend remains functional.

### Phase 5: Legacy Script Migration (Gradual)
1. Update CLI scripts to accept `--trt` and `--grau` flags
2. Keep defaults for backward compatibility
3. Migrate scripts one by one

**Rollback**: Scripts continue working with defaults.

### Testing Strategy
- **Unit Tests**: TRT code validation, URL generation, service layer
- **Integration Tests**: Login with TRT2, TRT3, TRT15 (1g and 2g)
- **Backward Compatibility Tests**: Ensure existing TRT3 calls work unchanged
- **Edge Case Tests**: Invalid TRT codes, URL overrides, normalization

### Deployment Steps
1. Deploy database migrations (no downtime)
2. Run seed script to populate TRT data
3. Deploy code changes (backward compatible)
4. Monitor for errors in production
5. Gradually enable new TRT support for users

### Rollback Plan
If issues arise:
1. Revert code deployment (functions default to TRT3)
2. Keep database tables (no harm)
3. Fix issues and redeploy
4. Database rollback not needed (additive only)

## Open Questions

1. **Q**: Should we validate TRT URLs by actually testing connectivity during seed?
   **A**: Not in initial implementation - add as monitoring/health check feature later.

2. **Q**: Should TRT selection be stored per user/account?
   **A**: Not in this change - focus on per-request selection first.

3. **Q**: Do we need caching for tribunal configs?
   **A**: Profile first, add caching if performance impact > 5ms.

4. **Q**: Should we support legacy TRT3-only code paths separately?
   **A**: No - use default parameters for simplicity.

5. **Q**: What if a TRT requires different authentication (e.g., different SSO)?
   **A**: Out of scope - document as known limitation, address in future if needed.

6. **Q**: Should grau be required or optional in APIs?
   **A**: Optional with default to '1g' for most common use case.
