# PJE Credentials Management - Specification Delta

## ADDED Requirements

### Requirement: Law Firm Registration

The system SHALL allow users to register law firms (escritórios) to group multiple lawyers, or operate as solo lawyers without a firm.

#### Scenario: Register new law firm

- **WHEN** a user submits a form with a valid firm name
- **THEN** the system creates a new `Escritorio` record in the database
- **AND** the system assigns a unique UUID to the firm
- **AND** the system displays a success message

#### Scenario: List all firms and solo lawyers

- **WHEN** a user views the credentials management page
- **THEN** the system displays all registered firms
- **AND** the system displays solo lawyers (those with NULL `escritorioId`) grouped separately

#### Scenario: Update firm information

- **WHEN** a user updates a firm's name
- **THEN** the system updates the `Escritorio` record
- **AND** all lawyers associated with the firm remain linked

#### Scenario: Delete firm with no lawyers

- **WHEN** a user deletes a firm that has no associated lawyers
- **THEN** the system removes the `Escritorio` record
- **AND** the system displays a success message

#### Scenario: Prevent deleting firm with lawyers

- **WHEN** a user attempts to delete a firm that has associated lawyers
- **THEN** the system rejects the deletion
- **AND** the system displays an error message indicating lawyers must be reassigned or deleted first

### Requirement: Lawyer Registration

The system SHALL allow users to register lawyers with their professional information including full name, OAB number, OAB state, CPF, and optional association with a law firm.

#### Scenario: Register new lawyer with firm

- **WHEN** a user submits a form with valid lawyer information (nome, oabNumero, oabUf, cpf) and selects a firm
- **THEN** the system creates a new `Advogado` record in the database
- **AND** the system associates the lawyer with the selected `Escritorio` via `escritorioId`
- **AND** the system sets `idAdvogado` to NULL (to be auto-detected later)
- **AND** the system displays a success message

#### Scenario: Register solo lawyer without firm

- **WHEN** a user submits a form with valid lawyer information without selecting a firm
- **THEN** the system creates a new `Advogado` record with NULL `escritorioId`
- **AND** the lawyer appears in the "Solo Lawyers" section

#### Scenario: Prevent duplicate OAB registration

- **WHEN** a user attempts to register a lawyer with an OAB number and UF combination that already exists
- **THEN** the system rejects the registration
- **AND** the system displays an error message indicating the OAB is already registered

#### Scenario: Validate CPF format

- **WHEN** a user submits a lawyer registration form with an invalid CPF (not 11 digits)
- **THEN** the system rejects the registration
- **AND** the system displays an error message indicating CPF must be 11 digits

#### Scenario: Update lawyer information

- **WHEN** a user updates a lawyer's name, OAB, or CPF
- **THEN** the system updates the `Advogado` record
- **AND** the system preserves the `idAdvogado` value if it was previously auto-detected
- **AND** all associated credentials remain linked

#### Scenario: Move lawyer between firm and solo

- **WHEN** a user changes a lawyer's firm association (from firm to NULL or vice versa)
- **THEN** the system updates the `escritorioId` field
- **AND** all credentials remain associated with the lawyer

### Requirement: Password Credential Management

The system SHALL allow users to create, read, update, and delete password credentials for a lawyer, where each credential can be associated with multiple tribunals.

#### Scenario: Add password credential for a lawyer

- **WHEN** a user creates a new credential for a lawyer with a password and optional description
- **THEN** the system stores the credential in the `Credencial` table
- **AND** the system associates the credential with the specified lawyer via `advogadoId`
- **AND** the system sets the credential as active by default
- **AND** the system does NOT store CPF (CPF comes from the parent Advogado)

#### Scenario: Prevent duplicate password for same lawyer

- **WHEN** a user attempts to create a credential with a password that already exists for the same lawyer
- **THEN** the system rejects the creation
- **AND** the system displays an error message indicating the password is already registered for this lawyer

#### Scenario: List credentials for a lawyer

- **WHEN** a user views a lawyer's profile
- **THEN** the system displays all credentials associated with that lawyer
- **AND** the system shows password (partially masked for security), description, associated tribunals, and active status

#### Scenario: Deactivate credential

- **WHEN** a user deactivates a credential
- **THEN** the system sets `ativa` to false
- **AND** the system SHALL NOT delete the credential record
- **AND** automation scripts SHALL NOT use deactivated credentials

#### Scenario: Delete credential

- **WHEN** a user deletes a credential
- **THEN** the system removes the credential record from the database
- **AND** the system removes all associated `CredencialTribunal` records via cascade delete

#### Scenario: Update credential password

- **WHEN** a user updates a credential's password
- **THEN** the system updates the `senha` field
- **AND** the system resets `validadoEm` timestamps for all associated tribunals to NULL
- **AND** the system suggests re-testing the credential

### Requirement: Tribunal Association

The system SHALL allow users to associate password credentials with specific tribunals and tribunal types.

#### Scenario: Associate credential with multiple tribunals

- **WHEN** a user selects multiple tribunals (e.g., TRT3-1g, TRT4-1g, TRT5-1g) for a credential
- **THEN** the system creates a `CredencialTribunal` record for each selected tribunal
- **AND** the system sets the appropriate `tipoTribunal` value ("TRT", "TJ", or "TRF")
- **AND** the system prevents duplicate associations for the same credential and tribunal

#### Scenario: Remove tribunal association

- **WHEN** a user removes a tribunal from a credential's association list
- **THEN** the system deletes the corresponding `CredencialTribunal` record
- **AND** the credential remains available for other tribunals

#### Scenario: View tribunals for a credential

- **WHEN** a user views a credential's details
- **THEN** the system displays all associated tribunals grouped by type (TRT, TJ, TRF)
- **AND** the system shows the last validation date for each tribunal (if available)

#### Scenario: Bulk associate with all tribunals of a type

- **WHEN** a user selects "All TRTs" when creating a credential
- **THEN** the system creates associations with all TRT tribunals in the database
- **AND** the system allows individual removal later if needed

### Requirement: Auto-detection of idAdvogado

The system SHALL automatically detect and store the lawyer's PJE ID (`idAdvogado`) upon first successful login.

#### Scenario: Detect idAdvogado on first login

- **WHEN** an automation script performs a successful login using a credential
- **AND** the associated lawyer's `idAdvogado` field is NULL
- **THEN** the system queries the PJE profile API endpoint `/pje-seguranca/api/token/perfis`
- **AND** the system extracts the `idAdvogado` value from the response
- **AND** the system updates the `Advogado.idAdvogado` field
- **AND** the system logs the successful auto-detection

#### Scenario: Skip detection if idAdvogado already exists

- **WHEN** an automation script performs a login
- **AND** the associated lawyer's `idAdvogado` field is already populated
- **THEN** the system SHALL NOT query the profile API again
- **AND** the system uses the stored `idAdvogado` value

#### Scenario: Handle detection failure

- **WHEN** the system attempts to detect `idAdvogado` but the API request fails
- **THEN** the system logs a warning
- **AND** the system continues with the login process
- **AND** the system leaves `idAdvogado` as NULL for retry on next login

### Requirement: Credential Retrieval for Automation Scripts

The system SHALL provide a way for automation scripts to retrieve the appropriate credentials for a given tribunal.

#### Scenario: Retrieve credential for a specific tribunal

- **WHEN** an automation script requests credentials for a specific tribunal (e.g., TRT3-1g)
- **THEN** the system queries the database for active credentials associated with that tribunal
- **AND** the system returns the credential with the lawyer's CPF, the password, and associated `idAdvogado`
- **AND** if multiple credentials are found, the system returns the most recently validated one

#### Scenario: No active credentials available

- **WHEN** an automation script requests credentials for a tribunal
- **AND** no active credentials exist in the database for that tribunal
- **THEN** the system throws an error indicating missing credentials
- **AND** the system provides instructions to configure credentials via the UI

#### Scenario: Return CPF from Advogado and senha from Credencial

- **WHEN** the system retrieves a credential for a tribunal
- **THEN** the system returns an object with `{ cpf: advogado.cpf, senha: credencial.senha, idAdvogado: advogado.idAdvogado }`
- **AND** the CPF is retrieved from the parent `Advogado` record

### Requirement: Credential Testing with Login Scripts

The system SHALL provide functionality to test credentials against a tribunal's authentication system using tribunal-specific login scripts.

#### Scenario: Test credential for TRT successfully

- **WHEN** a user initiates a credential test for a TRT tribunal
- **THEN** the system calls the `login-trt.js` script with the lawyer's CPF and credential password
- **AND** if login succeeds, the system updates the `validadoEm` timestamp in `CredencialTribunal`
- **AND** the system displays a success message with the lawyer's name from PJE

#### Scenario: Test credential for TJ successfully

- **WHEN** a user initiates a credential test for a TJ tribunal
- **THEN** the system calls the `login-tj.js` script with the lawyer's CPF and credential password
- **AND** on success, updates `validadoEm` and displays success message

#### Scenario: Test credential for TRF successfully

- **WHEN** a user initiates a credential test for a TRF tribunal
- **THEN** the system calls the `login-trf.js` script with the lawyer's CPF and credential password
- **AND** on success, updates `validadoEm` and displays success message

#### Scenario: Test credential fails

- **WHEN** a user tests a credential and the login script fails
- **THEN** the system displays an error message with the failure reason
- **AND** the system does NOT update the `validadoEm` timestamp
- **AND** the system suggests checking CPF and password

#### Scenario: Rate limit credential tests

- **WHEN** a user attempts to test multiple credentials rapidly
- **THEN** the system enforces a 10-second delay between tests
- **AND** the system displays a message explaining the rate limit (to avoid anti-bot detection)

### Requirement: Remove Interactive Login Page

The system SHALL remove the interactive login page at `app/(dashboard)/pje/login/page.tsx` as it serves no purpose with the new credentials management system.

#### Scenario: Access removed login page

- **WHEN** a user attempts to navigate to `/pje/login`
- **THEN** the system redirects to the credentials management page at `/pje/credentials`
- **AND** the system displays an informational message explaining the change

### Requirement: Credentials Management UI

The system SHALL provide a user interface for managing law firms, lawyers, and credentials at `app/(dashboard)/pje/credentials`.

#### Scenario: View credentials management page

- **WHEN** a user navigates to `/pje/credentials`
- **THEN** the system displays a list of all registered firms and solo lawyers
- **AND** the system shows a button to add a new firm
- **AND** the system shows a button to add a solo lawyer

#### Scenario: Select firm and view lawyers

- **WHEN** a user selects a law firm
- **THEN** the system displays all lawyers associated with that firm
- **AND** the system shows each lawyer's name, OAB, CPF (masked), and number of credentials
- **AND** the system shows a button to add a new lawyer to the firm

#### Scenario: Select lawyer and view credentials

- **WHEN** a user selects a lawyer
- **THEN** the system displays all credentials for that lawyer
- **AND** the system shows each credential's description, associated tribunals, last validated date, and active status
- **AND** the system shows a button to add a new credential

#### Scenario: Add new credential via UI

- **WHEN** a user clicks "Add Credential" for a lawyer
- **THEN** the system displays a form with fields for password, description, and tribunal selection
- **AND** the tribunal selection allows multi-select for TRT, TJ, and TRF types
- **AND** upon submission, the system creates the credential and associations
- **AND** the system displays a "Test" button to validate the credential

#### Scenario: Edit credential via UI

- **WHEN** a user clicks "Edit" on a credential
- **THEN** the system displays a pre-filled form with current values
- **AND** the user can modify password, description, and tribunal associations
- **AND** upon submission, the system updates the credential and associations
- **AND** if password changed, the system resets all `validadoEm` timestamps

#### Scenario: Delete credential via UI

- **WHEN** a user clicks "Delete" on a credential
- **THEN** the system displays a confirmation dialog
- **AND** upon confirmation, the system deletes the credential and all tribunal associations
- **AND** the system displays a success message

### Requirement: Database Schema

The system SHALL implement the following database schema for credentials management.

#### Scenario: Escritorio table structure

- **WHEN** the database is initialized
- **THEN** the system creates an `Escritorio` table with columns: id (UUID), nome (String), createdAt (DateTime), updatedAt (DateTime)

#### Scenario: Advogado table structure

- **WHEN** the database is initialized
- **THEN** the system creates an `Advogado` table with columns: id (UUID), nome (String), oabNumero (String), oabUf (String), cpf (String), idAdvogado (nullable String), escritorioId (nullable String FK), createdAt (DateTime), updatedAt (DateTime)
- **AND** the system creates a unique constraint on `[oabNumero, oabUf]`
- **AND** the system creates an index on `cpf`
- **AND** the system creates a foreign key relationship with `Escritorio` with SET NULL on delete

#### Scenario: Credencial table structure

- **WHEN** the database is initialized
- **THEN** the system creates a `Credencial` table with columns: id (UUID), senha (String), descricao (nullable String), ativa (Boolean default true), advogadoId (String FK), createdAt (DateTime), updatedAt (DateTime)
- **AND** the system creates a unique constraint on `[advogadoId, senha]`
- **AND** the system creates a foreign key relationship with `Advogado` with cascade delete

#### Scenario: CredencialTribunal table structure

- **WHEN** the database is initialized
- **THEN** the system creates a `CredencialTribunal` table with columns: id (UUID), tipoTribunal (String enum: "TRT"|"TJ"|"TRF"), validadoEm (nullable DateTime), credencialId (String FK), tribunalId (String FK)
- **AND** the system creates a unique constraint on `[credencialId, tribunalId]`
- **AND** the system creates foreign key relationships with `Credencial` and `Tribunal` with cascade delete

### Requirement: No Environment Variable Fallback

The system SHALL NOT support environment variables for credentials - database is the single source of truth.

#### Scenario: Environment variables are ignored

- **WHEN** an automation script starts
- **AND** environment variables `PJE_CPF` and `PJE_PASSWORD` are set
- **THEN** the system SHALL NOT use these values
- **AND** the system queries the database exclusively for credentials

#### Scenario: Error when no database credentials exist

- **WHEN** an automation script requests credentials for a tribunal
- **AND** no credentials exist in the database
- **THEN** the system throws a clear error message
- **AND** the error message instructs the user to configure credentials via `/pje/credentials`

## REMOVED Requirements

### Requirement: Interactive Login Functionality

**Reason**: The interactive login page is being removed because each automation script performs its own login, making a persistent login session unnecessary and misleading.

**Migration**: Users should use the new credentials management page to store their credentials, which will be automatically used by automation scripts.

### Requirement: Environment Variable Credential Storage

**Reason**: Environment variables (`PJE_CPF`, `PJE_PASSWORD`) are being completely removed in favor of database-driven credentials management.

**Migration**: System is in development, no migration needed. All credentials must be configured via the UI at `/pje/credentials`.
