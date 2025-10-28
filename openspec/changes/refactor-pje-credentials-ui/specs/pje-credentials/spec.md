# pje-credentials Spec Delta

## MODIFIED Requirements

### Requirement: Law Firm Registration

The system SHALL allow users to register law firms (escritórios) to group lawyers. All lawyers MUST belong to a law firm - there is no distinction between law firms and solo lawyers. For solo practitioners, the system creates a law firm with the same name as the lawyer.

#### Scenario: Register new law firm

- **WHEN** a user submits a form with a valid firm name
- **THEN** the system creates a new `Escritorio` record in the database
- **AND** the system assigns a unique UUID to the firm
- **AND** the system displays a success message

#### Scenario: List all firms

- **WHEN** a user views the credentials management page
- **THEN** the system displays all registered firms in a collapsible accordion
- **AND** each firm shows the number of lawyers associated with it
- **AND** single-lawyer firms display a "(Solo)" badge

#### Scenario: Update firm information

- **WHEN** a user updates a firm's name via the lawyer detail modal
- **THEN** the system updates the `Escritorio` record
- **AND** all lawyers associated with the firm remain linked
- **AND** the accordion updates to show the new firm name

#### Scenario: Delete firm with no lawyers

- **WHEN** a user deletes a firm that has no associated lawyers
- **THEN** the system removes the `Escritorio` record
- **AND** the system displays a success message

#### Scenario: Prevent deleting firm with lawyers

- **WHEN** a user attempts to delete a firm that has associated lawyers
- **THEN** the system rejects the deletion
- **AND** the system displays an error message indicating lawyers must be reassigned or deleted first

#### Scenario: Auto-create firm for solo lawyer

- **WHEN** a user creates a new lawyer and provides only the lawyer's name
- **THEN** the system creates an `Escritorio` with `nome = advogado.nome`
- **AND** the system associates the lawyer with this newly created firm
- **AND** the firm displays with a "(Solo)" badge in the UI

### Requirement: Lawyer Registration

The system SHALL allow users to register lawyers with their professional information including full name, OAB number, OAB state, CPF, and mandatory association with a law firm.

#### Scenario: Register new lawyer with firm

- **WHEN** a user submits a form with valid lawyer information (nome, oabNumero, oabUf, cpf) and selects a firm
- **THEN** the system creates a new `Advogado` record in the database
- **AND** the system associates the lawyer with the selected `Escritorio` via `escritorioId`
- **AND** the system sets `idAdvogado` to NULL (to be auto-detected later)
- **AND** the system displays a success message

#### Scenario: Register solo lawyer auto-creates firm

- **WHEN** a user submits a form with valid lawyer information without selecting an existing firm
- **THEN** the system creates a new `Escritorio` record with `nome = advogado.nome`
- **AND** the system creates a new `Advogado` record associated with this firm
- **AND** the lawyer appears under the newly created firm in the accordion

#### Scenario: Prevent duplicate OAB registration

- **WHEN** a user attempts to register a lawyer with an OAB number and UF combination that already exists
- **THEN** the system rejects the registration
- **AND** the system displays an error message indicating the OAB is already registered

#### Scenario: Validate CPF format

- **WHEN** a user submits a lawyer registration form with an invalid CPF (not 11 digits)
- **THEN** the system rejects the registration
- **AND** the system displays an error message indicating CPF must be 11 digits

#### Scenario: Update lawyer information via modal

- **WHEN** a user updates a lawyer's name, OAB, or CPF in the lawyer detail modal
- **THEN** the system updates the `Advogado` record
- **AND** the system preserves the `idAdvogado` value if it was previously auto-detected
- **AND** all associated credentials remain linked
- **AND** the accordion updates to reflect the new lawyer name

#### Scenario: Update law firm name for solo lawyer

- **WHEN** a user updates the law firm name in a solo lawyer's detail modal
- **THEN** the system updates the associated `Escritorio.nome`
- **AND** the accordion reflects the new firm name
- **AND** the "(Solo)" badge remains visible

### Requirement: Credentials Management UI

The system SHALL provide a user interface for managing law firms, lawyers, and credentials at `app/(dashboard)/pje/credentials` using a collapsible accordion and modal pattern.

#### Scenario: View credentials management page

- **WHEN** a user navigates to `/pje/credentials`
- **THEN** the system displays a collapsible accordion listing all registered law firms
- **AND** each accordion item shows the firm name and lawyer count
- **AND** the system shows a button to add a new law firm
- **AND** the system shows a button to add a new lawyer

#### Scenario: Expand firm to view lawyers

- **WHEN** a user clicks on a law firm in the accordion
- **THEN** the accordion item expands in-line to show all lawyers in that firm
- **AND** each lawyer row shows their name, OAB, and number of credentials
- **AND** the system does NOT create a new card below the accordion

#### Scenario: Open lawyer detail modal

- **WHEN** a user clicks on a lawyer within an expanded firm
- **THEN** the system opens a modal dialog showing the lawyer's full details
- **AND** the modal contains two tabs: "Lawyer Info" and "Credentials"
- **AND** the modal header shows a breadcrumb: "[Firm Name] > [Lawyer Name]"
- **AND** the background content is dimmed

#### Scenario: Edit lawyer information in modal

- **WHEN** a user opens the "Lawyer Info" tab in the lawyer detail modal
- **THEN** the system displays editable fields for: name, OAB number, OAB state, CPF, and law firm name
- **AND** the user can modify these fields
- **AND** clicking "Save" updates both the `Advogado` and `Escritorio` records
- **AND** the modal closes and the accordion reflects the changes

#### Scenario: View credentials in modal

- **WHEN** a user opens the "Credentials" tab in the lawyer detail modal
- **THEN** the system displays a list of all credentials for that lawyer
- **AND** each credential shows: description, password (masked with eye icon toggle), associated tribunals, and active status
- **AND** the system shows buttons for: Edit, Delete, Test, Activate/Deactivate
- **AND** the system shows an "Add Credential" button at the bottom

#### Scenario: Edit credential in modal

- **WHEN** a user clicks "Edit" on a credential within the modal
- **THEN** the system displays an inline edit form with fields for: password, description, and tribunal selection
- **AND** the tribunal selector allows multi-select for TRT, TJ, TRF, and Superior tribunals
- **AND** upon clicking "Save", the system updates the credential and tribunal associations
- **AND** if the password changed, the system resets all `validadoEm` timestamps for that credential

#### Scenario: Add new credential via modal

- **WHEN** a user clicks "Add Credential" in the modal's "Credentials" tab
- **THEN** the system displays a form with fields for password, description, and tribunal selection
- **AND** the tribunal selection allows multi-select for all tribunal types
- **AND** upon submission, the system creates the credential and associations
- **AND** the credential list updates to show the new credential

#### Scenario: Delete credential via modal

- **WHEN** a user clicks "Delete" on a credential in the modal
- **THEN** the system displays a confirmation dialog
- **AND** upon confirmation, the system deletes the credential and all tribunal associations
- **AND** the credential list updates to remove the deleted credential

#### Scenario: Test credential from modal

- **WHEN** a user clicks "Test" on a credential in the modal
- **THEN** the system calls the appropriate login script (based on tribunal type)
- **AND** the system displays a loading indicator
- **AND** if successful, updates the `validadoEm` timestamp and shows success message
- **AND** if failed, shows error message with failure reason

#### Scenario: Toggle password visibility in modal

- **WHEN** a user clicks the eye icon next to a credential's password in the modal
- **THEN** the system reveals the password in plain text
- **AND** the eye icon changes to an "eye-off" icon
- **AND** clicking again re-masks the password

#### Scenario: Close modal without saving

- **WHEN** a user clicks the "X" or "Cancel" button in the modal
- **THEN** the system closes the modal without saving changes
- **AND** the accordion remains in its current expanded/collapsed state
- **AND** no changes are persisted to the database

## REMOVED Requirements

### Requirement: List all firms and solo lawyers

**Reason**: Merged with "List all firms" scenario in the modified "Law Firm Registration" requirement. The system no longer distinguishes between firms and solo lawyers.

**Migration**: The modified requirement's "List all firms" scenario covers this functionality with a unified approach (solo lawyers appear as single-lawyer firms with a badge).

### Requirement: Register solo lawyer without firm

**Reason**: Removed because the system now auto-creates a law firm for solo lawyers instead of allowing NULL `escritorioId`.

**Migration**: The modified "Lawyer Registration" requirement includes "Register solo lawyer auto-creates firm" scenario that handles this case automatically.

### Requirement: Move lawyer between firm and solo

**Reason**: Removed because there is no longer a "solo" state (all lawyers belong to a firm).

**Migration**: Lawyers can be moved between firms by updating `escritorioId`, but they cannot have NULL `escritorioId`. Covered by existing "Update lawyer information via modal" scenario.

### Requirement: Select firm and view lawyers

**Reason**: Replaced by the new accordion pattern in the "Credentials Management UI" requirement.

**Migration**: The "Expand firm to view lawyers" scenario covers this functionality with an improved UX (collapsible accordion instead of cascading cards).

### Requirement: Select lawyer and view credentials

**Reason**: Replaced by the modal pattern in the "Credentials Management UI" requirement.

**Migration**: The "Open lawyer detail modal" and "View credentials in modal" scenarios provide this functionality with better visual organization.

### Requirement: Add new credential via UI

**Reason**: Merged into the "Credentials Management UI" requirement under "Add new credential via modal" scenario.

**Migration**: Functionality remains the same, but accessed via modal instead of a separate card.

### Requirement: Edit credential via UI

**Reason**: New functionality added in this change. Previously only delete was supported.

**Migration**: The "Edit credential in modal" scenario provides this new capability.

### Requirement: Delete credential via UI

**Reason**: Merged into the "Credentials Management UI" requirement under "Delete credential via modal" scenario.

**Migration**: Functionality remains the same, but accessed via modal instead of a separate card.

## ADDED Requirements

### Requirement: Solo Practice Badge Indicator

The system SHALL visually indicate when a law firm represents a solo practice (single lawyer) with a badge in the UI.

#### Scenario: Display solo badge for single-lawyer firms

- **WHEN** a law firm has exactly one associated lawyer
- **THEN** the system displays a "(Solo)" badge next to the firm name in the accordion
- **AND** hovering over the badge shows a tooltip: "This is a solo practice"

#### Scenario: Remove solo badge when second lawyer added

- **WHEN** a second lawyer is added to a previously solo firm
- **THEN** the system removes the "(Solo)" badge from the firm name
- **AND** the firm is displayed without any special indicator

#### Scenario: Restore solo badge when lawyers removed

- **WHEN** lawyers are removed from a multi-lawyer firm leaving only one lawyer
- **THEN** the system re-displays the "(Solo)" badge next to the firm name

### Requirement: Data Migration for Solo Lawyers

The system SHALL provide a migration script to convert existing solo lawyers (those with NULL `escritorioId`) into single-lawyer firms before enforcing the required `escritorioId` constraint.

#### Scenario: Migrate solo lawyers to firms

- **WHEN** the migration script is executed
- **THEN** the system identifies all `Advogado` records with `escritorioId = NULL`
- **AND** for each solo lawyer, creates an `Escritorio` with `nome = advogado.nome`
- **AND** updates the `Advogado.escritorioId` to reference the newly created firm
- **AND** logs a summary of created firms and affected lawyer IDs

#### Scenario: Handle migration errors gracefully

- **WHEN** the migration script encounters a database error (e.g., unique constraint violation)
- **THEN** the system logs the error with details (lawyer ID, error message)
- **AND** the system continues processing remaining solo lawyers
- **AND** the system reports total successes and failures at the end

#### Scenario: Rollback migration if needed

- **WHEN** the rollback script is executed
- **THEN** the system identifies all `Escritorio` records created by the migration (via timestamp or migration flag)
- **AND** the system sets the associated `Advogado.escritorioId` back to NULL
- **AND** the system deletes the auto-created `Escritorio` records
- **AND** the system logs the rollback summary

## MODIFIED Requirements

### Requirement: Database Schema

The system SHALL implement the following database schema for credentials management with a required `escritorioId` field for all lawyers.

#### Scenario: Escritorio table structure

- **WHEN** the database is initialized
- **THEN** the system creates an `Escritorio` table with columns: id (UUID), nome (String), createdAt (DateTime), updatedAt (DateTime)

#### Scenario: Advogado table structure with required escritorioId

- **WHEN** the database is initialized or migrated
- **THEN** the system creates an `Advogado` table with columns: id (UUID), nome (String), oabNumero (String), oabUf (String), cpf (String), idAdvogado (nullable String), escritorioId (String FK - REQUIRED), createdAt (DateTime), updatedAt (DateTime)
- **AND** the system creates a unique constraint on `[oabNumero, oabUf]`
- **AND** the system creates an index on `cpf`
- **AND** the system creates a foreign key relationship with `Escritorio` with SET NULL on delete
- **AND** the system enforces NOT NULL constraint on `escritorioId`

#### Scenario: Credencial table structure

- **WHEN** the database is initialized
- **THEN** the system creates a `Credencial` table with columns: id (UUID), senha (String), descricao (nullable String), ativa (Boolean default true), advogadoId (String FK), createdAt (DateTime), updatedAt (DateTime)
- **AND** the system creates a unique constraint on `[advogadoId, senha]`
- **AND** the system creates a foreign key relationship with `Advogado` with cascade delete

#### Scenario: CredencialTribunal table structure

- **WHEN** the database is initialized
- **THEN** the system creates a `CredencialTribunal` table with columns: id (UUID), tipoTribunal (String enum: "TRT"|"TJ"|"TRF"|"Superior"), validadoEm (nullable DateTime), credencialId (String FK), tribunalConfigId (String FK)
- **AND** the system creates a unique constraint on `[credencialId, tribunalConfigId]`
- **AND** the system creates foreign key relationships with `Credencial` and `TribunalConfig` with cascade delete
