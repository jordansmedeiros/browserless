# Design: PJE Credentials Management System

## Context

The current implementation stores PJE credentials in environment variables (`.env` file), which creates several limitations:
- Cannot support multiple law firms or solo lawyers in the same system
- Cannot support multiple lawyers per firm (each with their own OAB and processes)
- Cannot handle different passwords per tribunal/degree (lawyer may use password "abc" for TRT3-1g but "xyz" for TRT3-2g)
- No way to store the `idAdvogado` obtained from PJE after login

This design introduces a database-backed credentials management system that supports:
- Multiple law firms (escritórios) or solo lawyers
- Multiple lawyers per firm, each with their professional information (name, OAB, CPF)
- Multiple passwords per lawyer (since same CPF may have different passwords for different tribunals)
- Flexible association: one password can work for multiple tribunals
- Automatic detection and storage of `idAdvogado` from PJE

## Goals / Non-Goals

### Goals
- Store law firm (escritório) as optional entity - NULL for solo lawyers
- Store lawyer information (name, OAB, CPF) with reference to firm
- Support multiple passwords per lawyer (same CPF, different passwords)
- Allow one password to be associated with multiple tribunals (e.g., same password for TRT3-1g, TRT4-1g, TRT5-1g)
- Automatically detect and store `idAdvogado` on first successful login
- Validate credentials using tribunal-specific login scripts (login-trt.js, login-tj.js, login-trf.js)
- Provide a clean UI for managing firms, lawyers, and credentials
- Database is single source of truth (no environment variable fallback)

### Non-Goals
- Encryption of credentials at rest (SQLite limitation - can be added later with better DB)
- Multi-user authentication/authorization (single-user dashboard for now)
- Credential rotation or expiration policies
- Integration with external credential vaults
- Support for 2FA tokens
- Migration scripts (system is in development)

## Decisions

### Decision 1: Three-Level Hierarchy (Escritorio → Advogado → Credencial)

**Chosen Approach**: Create `Escritorio`, `Advogado`, and `Credencial` models with CPF stored at Advogado level.

**Rationale**:
- **Escritorio (optional)**: Represents a law firm with multiple lawyers, or NULL for solo lawyer
- **Advogado**: Represents a lawyer with their OAB and fixed CPF - this is who has processes in PJE
- **Credencial**: Stores only passwords (not CPF) - one lawyer can have multiple passwords for different tribunals
- **Key insight**: CPF is tied to the lawyer (never changes), but passwords can be different per tribunal/degree

**Schema Structure**:
```prisma
model Escritorio {
  id              String       @id @default(uuid())
  nome            String       // "Silva e Matos" or "Dr. Pedro - Autônomo"
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  advogados       Advogado[]
}

model Advogado {
  id              String       @id @default(uuid())
  nome            String       // "Dr. João Silva"
  oabNumero       String       // "123456"
  oabUf           String       // "MG"
  cpf             String       // "11111111111" - FIXED per lawyer
  idAdvogado      String?      // Auto-detected from PJE
  escritorioId    String?      // NULL for solo lawyer
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  escritorio      Escritorio?  @relation(fields: [escritorioId], references: [id], onDelete: SetNull)
  credenciais     Credencial[]

  @@unique([oabNumero, oabUf])
  @@index([cpf])
}

model Credencial {
  id              String                @id @default(uuid())
  senha           String                // Just the password
  descricao       String?               // "Senha TRT3 1º grau" or "Senha Universal"
  ativa           Boolean               @default(true)
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  advogado        Advogado              @relation(fields: [advogadoId], references: [id], onDelete: Cascade)
  advogadoId      String
  tribunais       CredencialTribunal[]

  @@unique([advogadoId, senha])  // Same password cannot be registered twice for same lawyer
}

model CredencialTribunal {
  id              String       @id @default(uuid())
  tipoTribunal    String       // "TRT" | "TJ" | "TRF"
  validadoEm      DateTime?    // When this credential was last validated for this tribunal

  credencial      Credencial   @relation(fields: [credencialId], references: [id], onDelete: Cascade)
  credencialId    String
  tribunal        Tribunal     @relation(fields: [tribunalId], references: [id], onDelete: Cascade)
  tribunalId      String

  @@unique([credencialId, tribunalId])
}
```

**Why CPF is in Advogado, not Credencial**:
- CPF identifies the lawyer and never changes
- Same CPF can have different passwords for different tribunals
- When logging in, we use `advogado.cpf` + `credencial.senha`

**Alternatives Considered**:
1. **CPF in Credencial**: Would duplicate CPF across multiple credenciais for same lawyer ❌
2. **No Escritorio entity**: Doesn't allow grouping lawyers by firm ❌
3. **One password per tribunal**: Creates redundancy when same password works for multiple tribunals ❌

### Decision 2: `idAdvogado` Stored in `Advogado` Model

**Chosen Approach**: Store `idAdvogado` in the `Advogado` table, not in `Credencial`.

**Rationale**:
- The `idAdvogado` is tied to the lawyer's identity (OAB), not to the credential
- Same lawyer will have the same `idAdvogado` across all tribunals where their OAB is registered
- Simplifies logic: one `idAdvogado` per lawyer, auto-populated on first successful login

**Detection Logic**:
1. When a script performs login with a credential
2. If `advogado.idAdvogado` is NULL
3. After successful authentication, query PJE profile API: `GET /pje-seguranca/api/token/perfis`
4. Extract `idAdvogado` from response
5. Update `Advogado.idAdvogado` field
6. Future logins can use this stored value

### Decision 3: Tribunal Type as String Enum

**Chosen Approach**: Use string field `tipoTribunal` in `CredencialTribunal` with values `"TRT" | "TJ" | "TRF"`.

**Rationale**:
- Simple and flexible
- SQLite doesn't have native enum support
- Easy to extend to other tribunal types later (STJ, TST, etc.)
- TypeScript can enforce type safety in application layer

**Alternatives Considered**:
1. **Separate table for tribunal types**: Overkill for 3-4 values
2. **Separate junction tables per type**: Too rigid, harder to query

### Decision 4: Database as Single Source of Truth (No Environment Fallback)

**Chosen Approach**: Remove environment variable support completely - database is the only source for credentials.

**Rationale**:
- System is in development, no production data to migrate
- Simplifies implementation (no fallback logic needed)
- Forces proper credential management from the start
- Cleaner architecture without dual sources of truth

**No Lookup Order**: Query database only - if no credentials found, throw error with helpful message

## Data Model Diagram

```
┌──────────────┐
│ Escritorio   │ (optional - NULL for solo lawyer)
│──────────────│
│ id           │
│ nome         │  "Silva e Matos"
└──────────────┘
      │ 1:N
      ▼
┌──────────────┐
│  Advogado    │
│──────────────│
│ id           │
│ nome         │
│ oabNumero    │
│ oabUf        │
│ cpf          │  ← CPF is HERE (fixed per lawyer)
│ idAdvogado   │  (auto-detected)
│ escritorioId │
└──────────────┘
      │ 1:N
      ▼
┌──────────────┐
│ Credencial   │ (just password, no CPF!)
│──────────────│
│ id           │
│ senha        │  ← Only password
│ descricao    │
│ ativa        │
│ advogadoId   │
└──────────────┘
      │ N:M (one password → multiple tribunals)
      ▼
┌──────────────────────┐
│ CredencialTribunal   │
│──────────────────────│
│ id                   │
│ credencialId         │
│ tribunalId           │
│ tipoTribunal         │  "TRT" | "TJ" | "TRF"
│ validadoEm           │
└──────────────────────┘
      │ N:1
      ▼
┌──────────────┐
│  Tribunal    │ (existing model from add-trt-multi-tribunal-support)
│──────────────│
│ id           │
│ codigo       │  "TRT3-1g", "TRT3-2g" (separate tribunals)
│ grau         │  "1g" | "2g"
│ nome         │
└──────────────┘
```

**Login Flow**: To login, system gets `advogado.cpf` + `credencial.senha` and sends to PJE

## UI/UX Design

### Page Structure: `/pje/credentials`

**Layout**:
1. **Top Section**: List of escritórios and solo lawyers
   - Cards showing: Escritório name (or "Solo"), number of lawyers
   - "Add Escritório" and "Add Solo Lawyer" buttons

2. **Middle Section**: Lawyers for selected escritório
   - Cards showing: Nome, OAB, CPF (masked), number of credentials
   - "Add Lawyer" button (if escritório selected)

3. **Bottom Section**: Credentials for selected lawyer
   - Table showing: Description, Tribunals, Last validated, Active status
   - "Add Credential" button

4. **Modals/Dialogs**:
   - Add/Edit Escritório: Nome
   - Add/Edit Lawyer: Nome, OAB Número, OAB UF, CPF, Escritório (optional)
   - Add/Edit Credential: Senha, Descrição, Tribunal selection (multi-select with checkboxes)
   - Test Credential: Run login script for selected tribunal type

### User Flow

1. User optionally creates an escritório (e.g., "Silva e Matos")
2. User adds a lawyer: name, OAB, CPF, and links to escritório (or leaves NULL for solo)
3. User adds a credential for that lawyer: password + description
4. User selects which tribunals this password works for (e.g., TRT3-1g, TRT4-1g, TRT5-1g)
5. User optionally tests the credential (calls login-trt.js to validate)
6. On first automation script execution, system auto-detects `idAdvogado` if not already set

## Risks / Trade-offs

### Risk 1: Unencrypted Passwords in SQLite
- **Impact**: Passwords stored in plaintext in SQLite database
- **Mitigation**:
  - Document this limitation clearly
  - Recommend file system permissions to protect database file
  - Plan for future migration to encrypted storage (PostgreSQL + encrypted fields)
- **Trade-off**: Simplicity now vs. security later

### Risk 2: Multiple Passwords for Same Tribunal
- **Impact**: Ambiguity when selecting which password to use for a tribunal if multiple credenciais cover it
- **Mitigation**:
  - Return most recently validated credential first
  - Add UI warning when multiple passwords overlap
  - Allow user to deactivate unused credentials
- **Trade-off**: Simplicity vs. flexibility

### Risk 3: Credential Testing May Trigger Anti-Bot Detection
- **Impact**: Testing multiple credentials rapidly may trigger CloudFront WAF blocks
- **Mitigation**:
  - Add rate limiting between tests (10-second delay)
  - Display warning about test frequency
  - Use same anti-detection techniques as production scripts
- **Trade-off**: Fast validation vs. avoiding blocks

## Implementation Plan

### Phase 1: Database Schema
1. Add `Escritorio`, `Advogado`, `Credencial`, `CredencialTribunal` models to Prisma schema
2. Run migration: `npx prisma migrate dev --name add-credentials-management`
3. Verify migration in development
4. Remove environment variable references from code

### Phase 2: Backend - Server Actions
1. Implement CRUD actions for Escritorio
2. Implement CRUD actions for Advogado (with CPF validation)
3. Implement CRUD actions for Credencial (with tribunal associations)
4. Implement credential retrieval function for automation scripts
5. Implement `idAdvogado` auto-detection function
6. Implement credential testing using login scripts (login-trt.js, etc.)

### Phase 3: Frontend - UI Components
1. Build credentials management page at `/pje/credentials`
2. Create Escritorio management components
3. Create Advogado management components with CPF input
4. Create Credencial management components with tribunal multi-select
5. Add credential testing button with loading states
6. Implement optimistic UI updates

### Phase 4: Integration
1. Update automation scripts to use database credentials
2. Test credential retrieval for different tribunal types
3. Test `idAdvogado` auto-detection on first login
4. Remove interactive login page at `/pje/login`
5. Update navigation to replace "Login" with "Credentials"

### Phase 5: Testing & Documentation
1. Manual testing of full workflow (add firm → add lawyer → add credential → test → scrape)
2. Test with TRT, TJ, TRF login scripts
3. Update README with new credentials system
4. Document UI usage with screenshots

### No Rollback Plan Needed
- System is in development
- No production data to protect
- Can restart from scratch if issues arise

## Open Questions

1. **How to handle credential updates?**
   - Current design: Edit in place (update password, tribunal associations)
   - Alternative: Version history for credentials
   - **Decision**: Start simple, add history if needed later

2. **Should we validate credentials on save?**
   - ✅ **Decided**: Option A - Only save, validate on-demand via "Test" button
   - Rationale: Faster UX, user controls when to test, avoids anti-bot detection issues

3. **Should we support multiple login scripts per tribunal type?**
   - Current: One script per type (login-trt.js for all TRTs, login-tj.js for all TJs)
   - Alternative: Per-tribunal scripts if variations are found later
   - **Decision**: Start with type-level scripts, refactor if needed

4. **How to handle when same password exists in multiple credenciais?**
   - Can happen if user accidentally creates duplicate password entries
   - **Mitigation**: Unique constraint `[advogadoId, senha]` prevents this at database level

## Implementation Notes

- Use shadcn/ui components for consistency with existing dashboard
- Implement optimistic UI updates for better UX
- Add loading states for all async operations
- Include proper error handling and user feedback
- Consider adding export/backup functionality for credentials
