# Implementation Tasks: PJE Credentials Management

## 1. Database Schema

- [ ] 1.1 Add `Escritorio` model to `prisma/schema.prisma`
  - [ ] 1.1.1 Add fields: id, nome, createdAt, updatedAt
  - [ ] 1.1.2 Add relation field `advogados` to `Advogado[]`

- [ ] 1.2 Add `Advogado` model to `prisma/schema.prisma`
  - [ ] 1.2.1 Add fields: id, nome, oabNumero, oabUf, cpf, idAdvogado, escritorioId, createdAt, updatedAt
  - [ ] 1.2.2 Add unique constraint on `[oabNumero, oabUf]`
  - [ ] 1.2.3 Add index on `cpf`
  - [ ] 1.2.4 Add foreign key relation to `Escritorio` with SET NULL on delete
  - [ ] 1.2.5 Add relation field `credenciais` to `Credencial[]`

- [ ] 1.3 Add `Credencial` model to `prisma/schema.prisma`
  - [ ] 1.3.1 Add fields: id, senha, descricao, ativa, advogadoId, createdAt, updatedAt
  - [ ] 1.3.2 Add unique constraint on `[advogadoId, senha]`
  - [ ] 1.3.3 Add foreign key relation to `Advogado` with cascade delete
  - [ ] 1.3.4 Add relation field `tribunais` to `CredencialTribunal[]`

- [ ] 1.4 Add `CredencialTribunal` model to `prisma/schema.prisma`
  - [ ] 1.4.1 Add fields: id, tipoTribunal, validadoEm, credencialId, tribunalId
  - [ ] 1.4.2 Add unique constraint on `[credencialId, tribunalId]`
  - [ ] 1.4.3 Add foreign key to `Credencial` with cascade delete
  - [ ] 1.4.4 Add foreign key to `Tribunal` with cascade delete

- [ ] 1.5 Run database migration
  - [ ] 1.5.1 Generate migration: `npx prisma migrate dev --name add-credentials-management`
  - [ ] 1.5.2 Verify migration files generated correctly
  - [ ] 1.5.3 Test migration in development database

## 2. TypeScript Types

- [ ] 2.1 Create `lib/types/credentials.ts`
  - [ ] 2.1.1 Export `Escritorio` type from Prisma
  - [ ] 2.1.2 Export `Advogado` type from Prisma
  - [ ] 2.1.3 Export `Credencial` type from Prisma
  - [ ] 2.1.4 Export `CredencialTribunal` type from Prisma
  - [ ] 2.1.5 Create `TipoTribunal` string union type: "TRT" | "TJ" | "TRF"
  - [ ] 2.1.6 Create `CredencialWithRelations` type including nested tribunais
  - [ ] 2.1.7 Create `AdvogadoWithCredenciais` type including nested credenciais
  - [ ] 2.1.8 Create `EscritorioWithAdvogados` type including nested advogados

- [ ] 2.2 Update `lib/types/index.ts`
  - [ ] 2.2.1 Export all types from `credentials.ts`

## 3. Server Actions - Escritorio Management

- [ ] 3.1 Create escritorio CRUD actions in `app/actions/pje.ts`
  - [ ] 3.1.1 `createEscritorioAction(nome)` - Create new law firm
  - [ ] 3.1.2 `listEscritoriosAction()` - List all law firms
  - [ ] 3.1.3 `getEscritorioAction(id)` - Get single firm with lawyers
  - [ ] 3.1.4 `updateEscritorioAction(id, nome)` - Update firm name
  - [ ] 3.1.5 `deleteEscritorioAction(id)` - Delete firm (only if no lawyers)

- [ ] 3.2 Add validation for escritorio actions
  - [ ] 3.2.1 Validate nome is not empty
  - [ ] 3.2.2 Prevent deletion if firm has lawyers

## 4. Server Actions - Advogado Management

- [ ] 4.1 Create advogado CRUD actions in `app/actions/pje.ts`
  - [ ] 4.1.1 `createAdvogadoAction(nome, oabNumero, oabUf, cpf, escritorioId?)` - Create new lawyer
  - [ ] 4.1.2 `listAdvogadosAction(escritorioId?)` - List lawyers (filtered by firm if provided)
  - [ ] 4.1.3 `getAdvogadoAction(id)` - Get single lawyer with credentials
  - [ ] 4.1.4 `updateAdvogadoAction(id, data)` - Update lawyer info
  - [ ] 4.1.5 `deleteAdvogadoAction(id)` - Delete lawyer (cascade deletes credentials)

- [ ] 4.2 Add validation for advogado actions
  - [ ] 4.2.1 Validate OAB number format (numeric)
  - [ ] 4.2.2 Validate OAB UF is a valid Brazilian state (2 letters)
  - [ ] 4.2.3 Validate CPF format (11 digits)
  - [ ] 4.2.4 Check for duplicate OAB number + UF combination
  - [ ] 4.2.5 Validate escritorioId exists if provided

## 5. Server Actions - Credencial Management

- [ ] 5.1 Create credencial CRUD actions in `app/actions/pje.ts`
  - [ ] 5.1.1 `createCredencialAction(advogadoId, senha, descricao, tribunalIds[])` - Create credential with tribunal associations
  - [ ] 5.1.2 `listCredenciaisAction(advogadoId)` - List credentials for a lawyer
  - [ ] 5.1.3 `getCredencialAction(id)` - Get single credential with tribunais
  - [ ] 5.1.4 `updateCredencialAction(id, senha?, descricao?, tribunalIds?)` - Update credential and tribunal associations
  - [ ] 5.1.5 `deleteCredencialAction(id)` - Delete credential
  - [ ] 5.1.6 `toggleCredencialAction(id)` - Activate/deactivate credential

- [ ] 5.2 Add validation for credencial actions
  - [ ] 5.2.1 Validate password minimum length (6 characters)
  - [ ] 5.2.2 Check for duplicate senha for same advogado
  - [ ] 5.2.3 Validate tribunal IDs exist
  - [ ] 5.2.4 Reset `validadoEm` to NULL when password changes

## 6. Credential Retrieval Logic

- [ ] 6.1 Create credential retrieval utility in `lib/api/pje-adapter.ts`
  - [ ] 6.1.1 Function `getCredencialParaTribunal(tribunalId)` - Query database for active credential
  - [ ] 6.1.2 Join with Advogado to get CPF
  - [ ] 6.1.3 Handle multiple credentials by returning most recently validated
  - [ ] 6.1.4 Return object with `{ cpf, senha, idAdvogado }`
  - [ ] 6.1.5 Throw error if no credentials found (no .env fallback)

- [ ] 6.2 Add logging for credential retrieval
  - [ ] 6.2.1 Log when using database credentials
  - [ ] 6.2.2 Log error when no credentials available with helpful message

## 7. Auto-detection of idAdvogado

- [ ] 7.1 Create auto-detection utility in `lib/api/pje-adapter.ts`
  - [ ] 7.1.1 Function `detectAndSaveIdAdvogado(advogadoId, authToken)` - Query PJE API
  - [ ] 7.1.2 Call `/pje-seguranca/api/token/perfis` after successful login
  - [ ] 7.1.3 Extract `idAdvogado` from response
  - [ ] 7.1.4 Update `Advogado.idAdvogado` in database
  - [ ] 7.1.5 Handle API errors gracefully (leave NULL, retry next time)

- [ ] 7.2 Integrate with login scripts
  - [ ] 7.2.1 Modify login function to check if `idAdvogado` is NULL
  - [ ] 7.2.2 Call auto-detection after successful authentication
  - [ ] 7.2.3 Skip if `idAdvogado` already populated

## 8. Credential Testing

- [ ] 8.1 Create credential test action in `app/actions/pje.ts`
  - [ ] 8.1.1 `testCredencialAction(credencialId, tribunalId)` - Test login
  - [ ] 8.1.2 Determine tribunal type (TRT, TJ, TRF) from tribunalId
  - [ ] 8.1.3 Call appropriate login script (login-trt.js, login-tj.js, login-trf.js)
  - [ ] 8.1.4 Pass lawyer's CPF + credential password to script
  - [ ] 8.1.5 On success, update `CredencialTribunal.validadoEm` timestamp
  - [ ] 8.1.6 Return success/failure result with error details

- [ ] 8.2 Add rate limiting for tests
  - [ ] 8.2.1 Track last test timestamp per user/credential
  - [ ] 8.2.2 Enforce 10-second delay between tests
  - [ ] 8.2.3 Return error if rate limit exceeded

## 9. Credentials Management UI

- [ ] 9.1 Create page at `app/(dashboard)/pje/credentials/page.tsx`
  - [ ] 9.1.1 Create three-level layout: Firms → Lawyers → Credentials
  - [ ] 9.1.2 Top section: List of firms + solo lawyers
  - [ ] 9.1.3 Middle section: Lawyers for selected firm
  - [ ] 9.1.4 Bottom section: Credentials for selected lawyer
  - [ ] 9.1.5 Add "Add Escritorio" and "Add Solo Lawyer" buttons

- [ ] 9.2 Create Escritorio components
  - [ ] 9.2.1 `EscritorioCard` - Display firm info (nome, lawyer count)
  - [ ] 9.2.2 `EscritorioFormDialog` - Add/edit firm form
  - [ ] 9.2.3 `EscritorioDeleteConfirm` - Confirmation dialog for deletion

- [ ] 9.3 Create Advogado components
  - [ ] 9.3.1 `AdvogadoCard` - Display lawyer info (nome, OAB, CPF masked, credential count)
  - [ ] 9.3.2 `AdvogadoFormDialog` - Add/edit lawyer with CPF input and firm selector
  - [ ] 9.3.3 `AdvogadoDeleteConfirm` - Confirmation dialog for deletion
  - [ ] 9.3.4 CPF input with mask (XXX.XXX.XXX-XX) and validation

- [ ] 9.4 Create Credencial components
  - [ ] 9.4.1 `CredencialTable` - Display credentials in table format
  - [ ] 9.4.2 `CredencialFormDialog` - Add/edit credential with tribunal multi-select
  - [ ] 9.4.3 `CredencialTestButton` - Test credential functionality with loading state
  - [ ] 9.4.4 `TribunalMultiSelector` - Multi-select component for TRT/TJ/TRF with checkboxes
  - [ ] 9.4.5 Show password masked (******) in list view, option to reveal
  - [ ] 9.4.6 Display last validated timestamp per tribunal

- [ ] 9.5 Implement state management
  - [ ] 9.5.1 Use React state for selected firm
  - [ ] 9.5.2 Use React state for selected lawyer
  - [ ] 9.5.3 Use React state for modal open/close
  - [ ] 9.5.4 Implement optimistic updates for better UX
  - [ ] 9.5.5 Handle loading states for all async operations

- [ ] 9.6 Add error handling and feedback
  - [ ] 9.6.1 Display success toast on create/update/delete
  - [ ] 9.6.2 Display error toast on failures
  - [ ] 9.6.3 Show validation errors inline in forms
  - [ ] 9.6.4 Display rate limit warning for credential tests

## 10. Remove Interactive Login Page

- [ ] 10.1 Delete `app/(dashboard)/pje/login/page.tsx`

- [ ] 10.2 Update navigation/menu
  - [ ] 10.2.1 Remove "Login" link from sidebar
  - [ ] 10.2.2 Add "Credentials" link to sidebar

- [ ] 10.3 Handle old route redirects
  - [ ] 10.3.1 Add redirect from `/pje/login` to `/pje/credentials` in routing config or middleware
  - [ ] 10.3.2 Display informational toast explaining the change

- [ ] 10.4 Clean up `app/actions/pje.ts`
  - [ ] 10.4.1 Remove or repurpose `loginPJEAction` (can be used for testing framework)

## 11. Update Automation Scripts

- [ ] 11.1 Remove environment variable references
  - [ ] 11.1.1 Remove `PJE_CPF` and `PJE_PASSWORD` usage from all scripts
  - [ ] 11.1.2 Add comment indicating credentials come from database only

- [ ] 11.2 Update login scripts to accept parameters
  - [ ] 11.2.1 Modify `login-trt.js` to accept tribunal parameter
  - [ ] 11.2.2 Create `login-tj.js` for TJ authentication (if different from TRT)
  - [ ] 11.2.3 Create `login-trf.js` for TRF authentication (if different from TRT)
  - [ ] 11.2.4 Each script receives: tribunalId, cpf, senha

- [ ] 11.3 Update scraping scripts
  - [ ] 11.3.1 Modify scripts to call `getCredencialParaTribunal(tribunalId)`
  - [ ] 11.3.2 Use returned CPF and password for authentication
  - [ ] 11.3.3 Trigger `detectAndSaveIdAdvogado()` on first successful login

## 12. Documentation

- [ ] 12.1 Update README files
  - [ ] 12.1.1 Update `README-PJE.md` to explain new credentials system
  - [ ] 12.1.2 Remove references to `.env` credentials
  - [ ] 12.1.3 Add guide: "Getting Started" with credentials setup
  - [ ] 12.1.4 Document credential testing functionality
  - [ ] 12.1.5 Explain Escritorio vs Solo lawyer workflow

- [ ] 12.2 Add inline code comments
  - [ ] 12.2.1 Document credential retrieval logic
  - [ ] 12.2.2 Document auto-detection mechanism
  - [ ] 12.2.3 Document security considerations (unencrypted passwords in SQLite)

## 13. Testing

- [ ] 13.1 Manual testing - Database and Backend
  - [ ] 13.1.1 Test adding a new escritorio
  - [ ] 13.1.2 Test adding a solo lawyer (NULL escritorioId)
  - [ ] 13.1.3 Test adding a lawyer to a firm
  - [ ] 13.1.4 Test adding credentials with multiple tribunal associations
  - [ ] 13.1.5 Test unique constraints (duplicate OAB, duplicate senha)
  - [ ] 13.1.6 Test cascade deletes (firm → lawyers → credentials)

- [ ] 13.2 Manual testing - UI
  - [ ] 13.2.1 Test full workflow: add firm → add lawyer → add credential → test
  - [ ] 13.2.2 Test credential testing functionality with rate limiting
  - [ ] 13.2.3 Test auto-detection of idAdvogado
  - [ ] 13.2.4 Test credential deactivation
  - [ ] 13.2.5 Test credential deletion with cascade
  - [ ] 13.2.6 Test lawyer deletion with cascade
  - [ ] 13.2.7 Test moving lawyer between firm and solo

- [ ] 13.3 Integration testing
  - [ ] 13.3.1 Test login script with database credentials (TRT)
  - [ ] 13.3.2 Test scraping script with database credentials
  - [ ] 13.3.3 Verify idAdvogado is saved correctly after first login
  - [ ] 13.3.4 Verify most recently validated credential is selected when multiple exist

- [ ] 13.4 Edge cases
  - [ ] 13.4.1 Test behavior when no credentials configured for a tribunal
  - [ ] 13.4.2 Test behavior when multiple credentials exist for same tribunal
  - [ ] 13.4.3 Test behavior when idAdvogado detection fails
  - [ ] 13.4.4 Test CPF validation with invalid formats
  - [ ] 13.4.5 Test password validation with short passwords

## 14. Cleanup

- [ ] 14.1 Remove `.env.example` references to `PJE_CPF` and `PJE_PASSWORD`

- [ ] 14.2 Remove any remaining environment variable fallback code

- [ ] 14.3 Update `.gitignore` if needed (database file should already be ignored)

- [ ] 14.4 Clean up any unused imports or dead code
