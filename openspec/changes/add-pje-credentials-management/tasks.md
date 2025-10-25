# Implementation Tasks: PJE Credentials Management

## 1. Database Schema

- [x] 1.1 Add `Escritorio` model to `prisma/schema.prisma`
  - [x] 1.1.1 Add fields: id, nome, createdAt, updatedAt
  - [x] 1.1.2 Add relation field `advogados` to `Advogado[]`

- [x] 1.2 Add `Advogado` model to `prisma/schema.prisma`
  - [x] 1.2.1 Add fields: id, nome, oabNumero, oabUf, cpf, idAdvogado, escritorioId, createdAt, updatedAt
  - [x] 1.2.2 Add unique constraint on `[oabNumero, oabUf]`
  - [x] 1.2.3 Add index on `cpf`
  - [x] 1.2.4 Add foreign key relation to `Escritorio` with SET NULL on delete
  - [x] 1.2.5 Add relation field `credenciais` to `Credencial[]`

- [x] 1.3 Add `Credencial` model to `prisma/schema.prisma`
  - [x] 1.3.1 Add fields: id, senha, descricao, ativa, advogadoId, createdAt, updatedAt
  - [x] 1.3.2 Add unique constraint on `[advogadoId, senha]`
  - [x] 1.3.3 Add foreign key relation to `Advogado` with cascade delete
  - [x] 1.3.4 Add relation field `tribunais` to `CredencialTribunal[]`

- [x] 1.4 Add `CredencialTribunal` model to `prisma/schema.prisma`
  - [x] 1.4.1 Add fields: id, tipoTribunal, validadoEm, credencialId, tribunalId
  - [x] 1.4.2 Add unique constraint on `[credencialId, tribunalId]`
  - [x] 1.4.3 Add foreign key to `Credencial` with cascade delete
  - [x] 1.4.4 Add foreign key to `Tribunal` with cascade delete

- [x] 1.5 Run database migration
  - [x] 1.5.1 Generate migration: `npx prisma migrate dev --name add-credentials-management`
  - [x] 1.5.2 Verify migration files generated correctly
  - [x] 1.5.3 Test migration in development database

## 2. TypeScript Types

- [x] 2.1 Create `lib/types/credentials.ts`
  - [x] 2.1.1 Export `Escritorio` type from Prisma
  - [x] 2.1.2 Export `Advogado` type from Prisma
  - [x] 2.1.3 Export `Credencial` type from Prisma
  - [x] 2.1.4 Export `CredencialTribunal` type from Prisma
  - [x] 2.1.5 Create `TipoTribunal` string union type: "TRT" | "TJ" | "TRF"
  - [x] 2.1.6 Create `CredencialWithRelations` type including nested tribunais
  - [x] 2.1.7 Create `AdvogadoWithCredenciais` type including nested credenciais
  - [x] 2.1.8 Create `EscritorioWithAdvogados` type including nested advogados

- [x] 2.2 Update `lib/types/index.ts`
  - [x] 2.2.1 Export all types from `credentials.ts`

## 3. Server Actions - Escritorio Management

- [x] 3.1 Create escritorio CRUD actions in `app/actions/pje.ts`
  - [x] 3.1.1 `createEscritorioAction(nome)` - Create new law firm
  - [x] 3.1.2 `listEscritoriosAction()` - List all law firms
  - [x] 3.1.3 `getEscritorioAction(id)` - Get single firm with lawyers
  - [x] 3.1.4 `updateEscritorioAction(id, nome)` - Update firm name
  - [x] 3.1.5 `deleteEscritorioAction(id)` - Delete firm (only if no lawyers)

- [x] 3.2 Add validation for escritorio actions
  - [x] 3.2.1 Validate nome is not empty
  - [x] 3.2.2 Prevent deletion if firm has lawyers

## 4. Server Actions - Advogado Management

- [x] 4.1 Create advogado CRUD actions in `app/actions/pje.ts`
  - [x] 4.1.1 `createAdvogadoAction(nome, oabNumero, oabUf, cpf, escritorioId?)` - Create new lawyer
  - [x] 4.1.2 `listAdvogadosAction(escritorioId?)` - List lawyers (filtered by firm if provided)
  - [x] 4.1.3 `getAdvogadoAction(id)` - Get single lawyer with credentials
  - [x] 4.1.4 `updateAdvogadoAction(id, data)` - Update lawyer info
  - [x] 4.1.5 `deleteAdvogadoAction(id)` - Delete lawyer (cascade deletes credentials)

- [x] 4.2 Add validation for advogado actions
  - [x] 4.2.1 Validate OAB number format (numeric)
  - [x] 4.2.2 Validate OAB UF is a valid Brazilian state (2 letters)
  - [x] 4.2.3 Validate CPF format (11 digits)
  - [x] 4.2.4 Check for duplicate OAB number + UF combination
  - [x] 4.2.5 Validate escritorioId exists if provided

## 5. Server Actions - Credencial Management

- [x] 5.1 Create credencial CRUD actions in `app/actions/pje.ts`
  - [x] 5.1.1 `createCredencialAction(advogadoId, senha, descricao, tribunalIds[])` - Create credential with tribunal associations
  - [x] 5.1.2 `listCredenciaisAction(advogadoId)` - List credentials for a lawyer
  - [x] 5.1.3 `getCredencialAction(id)` - Get single credential with tribunais
  - [x] 5.1.4 `updateCredencialAction(id, senha?, descricao?, tribunalIds?)` - Update credential and tribunal associations
  - [x] 5.1.5 `deleteCredencialAction(id)` - Delete credential
  - [x] 5.1.6 `toggleCredencialAction(id)` - Activate/deactivate credential

- [x] 5.2 Add validation for credencial actions
  - [x] 5.2.1 Validate password minimum length (6 characters)
  - [x] 5.2.2 Check for duplicate senha for same advogado
  - [x] 5.2.3 Validate tribunal IDs exist
  - [x] 5.2.4 Reset `validadoEm` to NULL when password changes

## 6. Credential Retrieval Logic

- [x] 6.1 Create credential retrieval utility in `lib/api/pje-adapter.ts`
  - [x] 6.1.1 Function `getCredencialParaTribunal(tribunalId)` - Query database for active credential
  - [x] 6.1.2 Join with Advogado to get CPF
  - [x] 6.1.3 Handle multiple credentials by returning most recently validated
  - [x] 6.1.4 Return object with `{ cpf, senha, idAdvogado }`
  - [x] 6.1.5 Throw error if no credentials found (no .env fallback)

- [x] 6.2 Add logging for credential retrieval
  - [x] 6.2.1 Log when using database credentials
  - [x] 6.2.2 Log error when no credentials available with helpful message

## 7. Auto-detection of idAdvogado

- [x] 7.1 Create auto-detection utility in `lib/api/pje-adapter.ts`
  - [x] 7.1.1 Function `detectAndSaveIdAdvogado(advogadoId, authToken)` - Query PJE API
  - [x] 7.1.2 Call `/pje-seguranca/api/token/perfis` after successful login
  - [x] 7.1.3 Extract `idAdvogado` from response
  - [x] 7.1.4 Update `Advogado.idAdvogado` in database
  - [x] 7.1.5 Handle API errors gracefully (leave NULL, retry next time)

- [x] 7.2 Integrate with login scripts
  - [x] 7.2.1 Modify login function to check if `idAdvogado` is NULL
  - [x] 7.2.2 Call auto-detection after successful authentication
  - [x] 7.2.3 Skip if `idAdvogado` already populated

## 8. Credential Testing

- [x] 8.1 Create credential test action in `app/actions/pje.ts`
  - [x] 8.1.1 `testCredencialAction(credencialId, tribunalId)` - Test login
  - [x] 8.1.2 Determine tribunal type (TRT, TJ, TRF) from tribunalId
  - [x] 8.1.3 Call appropriate login script (login-trt.js, login-tj.js, login-trf.js)
  - [x] 8.1.4 Pass lawyer's CPF + credential password to script
  - [x] 8.1.5 On success, update `CredencialTribunal.validadoEm` timestamp
  - [x] 8.1.6 Return success/failure result with error details

- [x] 8.2 Add rate limiting for tests
  - [x] 8.2.1 Track last test timestamp per user/credential
  - [x] 8.2.2 Enforce 10-second delay between tests
  - [x] 8.2.3 Return error if rate limit exceeded

## 9. Credentials Management UI

- [x] 9.1 Create page at `app/(dashboard)/pje/credentials/page.tsx`
  - [x] 9.1.1 Create three-level layout: Firms → Lawyers → Credentials
  - [x] 9.1.2 Top section: List of firms + solo lawyers
  - [x] 9.1.3 Middle section: Lawyers for selected firm
  - [x] 9.1.4 Bottom section: Credentials for selected lawyer
  - [x] 9.1.5 Add "Add Escritorio" and "Add Solo Lawyer" buttons

- [x] 9.2 Create Escritorio components
  - [x] 9.2.1 `EscritorioCard` - Display firm info (nome, lawyer count)
  - [x] 9.2.2 `EscritorioFormDialog` - Add/edit firm form
  - [x] 9.2.3 `EscritorioDeleteConfirm` - Confirmation dialog for deletion

- [x] 9.3 Create Advogado components
  - [x] 9.3.1 `AdvogadoCard` - Display lawyer info (nome, OAB, CPF masked, credential count)
  - [x] 9.3.2 `AdvogadoFormDialog` - Add/edit lawyer with CPF input and firm selector
  - [x] 9.3.3 `AdvogadoDeleteConfirm` - Confirmation dialog for deletion
  - [x] 9.3.4 CPF input with mask (XXX.XXX.XXX-XX) and validation

- [x] 9.4 Create Credencial components
  - [x] 9.4.1 `CredencialTable` - Display credentials in table format
  - [x] 9.4.2 `CredencialFormDialog` - Add/edit credential with tribunal multi-select
  - [x] 9.4.3 `CredencialTestButton` - Test credential functionality with loading state
  - [x] 9.4.4 `TribunalMultiSelector` - Multi-select component for TRT/TJ/TRF with checkboxes
  - [x] 9.4.5 Show password masked (******) in list view, option to reveal
  - [x] 9.4.6 Display last validated timestamp per tribunal

- [x] 9.5 Implement state management
  - [x] 9.5.1 Use React state for selected firm
  - [x] 9.5.2 Use React state for selected lawyer
  - [x] 9.5.3 Use React state for modal open/close
  - [x] 9.5.4 Implement optimistic updates for better UX
  - [x] 9.5.5 Handle loading states for all async operations

- [x] 9.6 Add error handling and feedback
  - [x] 9.6.1 Display success toast on create/update/delete
  - [x] 9.6.2 Display error toast on failures
  - [x] 9.6.3 Show validation errors inline in forms
  - [x] 9.6.4 Display rate limit warning for credential tests

## 10. Remove Interactive Login Page

- [x] 10.1 Delete `app/(dashboard)/pje/login/page.tsx`

- [x] 10.2 Update navigation/menu
  - [x] 10.2.1 Remove "Login" link from sidebar
  - [x] 10.2.2 Add "Credentials" link to sidebar

- [x] 10.3 Handle old route redirects
  - [x] 10.3.1 Add redirect from `/pje/login` to `/pje/credentials` in routing config or middleware
  - [x] 10.3.2 Display informational toast explaining the change

- [x] 10.4 Clean up `app/actions/pje.ts`
  - [x] 10.4.1 Remove or repurpose `loginPJEAction` (can be used for testing framework)

## 11. Update Automation Scripts

- [x] 11.1 Remove environment variable references
  - [x] 11.1.1 Remove `PJE_CPF` and `PJE_PASSWORD` usage from all scripts
  - [x] 11.1.2 Add comment indicating credentials come from database only

- [x] 11.2 Update login scripts to accept parameters
  - [x] 11.2.1 Modify `login-trt.js` to accept tribunal parameter
  - [x] 11.2.2 Create `login-tj.js` for TJ authentication (if different from TRT)
  - [x] 11.2.3 Create `login-trf.js` for TRF authentication (if different from TRT)
  - [x] 11.2.4 Each script receives: tribunalId, cpf, senha

- [x] 11.3 Update scraping scripts
  - [x] 11.3.1 Modify scripts to call `getCredencialParaTribunal(tribunalId)`
  - [x] 11.3.2 Use returned CPF and password for authentication
  - [x] 11.3.3 Trigger `detectAndSaveIdAdvogado()` on first successful login

## 12. Documentation

- [x] 12.1 Update README files
  - [x] 12.1.1 Update `README.md` to explain new credentials system
  - [x] 12.1.2 Remove references to `.env` credentials
  - [x] 12.1.3 Add guide: "Getting Started" with credentials setup
  - [x] 12.1.4 Document credential testing functionality
  - [x] 12.1.5 Explain Escritorio vs Solo lawyer workflow

- [x] 12.2 Add inline code comments
  - [x] 12.2.1 Document credential retrieval logic
  - [x] 12.2.2 Document auto-detection mechanism
  - [x] 12.2.3 Document security considerations (unencrypted passwords in SQLite)

## 13. Testing

- [x] 13.1 Manual testing - Database and Backend
  - [x] 13.1.1 Test adding a new escritorio
  - [x] 13.1.2 Test adding a solo lawyer (NULL escritorioId)
  - [x] 13.1.3 Test adding a lawyer to a firm
  - [x] 13.1.4 Test adding credentials with multiple tribunal associations
  - [x] 13.1.5 Test unique constraints (duplicate OAB, duplicate senha)
  - [x] 13.1.6 Test cascade deletes (firm → lawyers → credentials)

- [x] 13.2 Manual testing - UI
  - [x] 13.2.1 Test full workflow: add firm → add lawyer → add credential → test
  - [x] 13.2.2 Test credential testing functionality with rate limiting
  - [x] 13.2.3 Test auto-detection of idAdvogado
  - [x] 13.2.4 Test credential deactivation
  - [x] 13.2.5 Test credential deletion with cascade
  - [x] 13.2.6 Test lawyer deletion with cascade
  - [x] 13.2.7 Test moving lawyer between firm and solo

- [x] 13.3 Integration testing
  - [x] 13.3.1 Test login script with database credentials (TRT)
  - [x] 13.3.2 Test scraping script with database credentials
  - [x] 13.3.3 Verify idAdvogado is saved correctly after first login
  - [x] 13.3.4 Verify most recently validated credential is selected when multiple exist

- [x] 13.4 Edge cases
  - [x] 13.4.1 Test behavior when no credentials configured for a tribunal
  - [x] 13.4.2 Test behavior when multiple credentials exist for same tribunal
  - [x] 13.4.3 Test behavior when idAdvogado detection fails
  - [x] 13.4.4 Test CPF validation with invalid formats
  - [x] 13.4.5 Test password validation with short passwords

## 14. Cleanup

- [x] 14.1 Remove `.env.example` references to `PJE_CPF` and `PJE_PASSWORD`

- [x] 14.2 Remove any remaining environment variable fallback code

- [x] 14.3 Update `.gitignore` if needed (database file should already be ignored)

- [x] 14.4 Clean up any unused imports or dead code
