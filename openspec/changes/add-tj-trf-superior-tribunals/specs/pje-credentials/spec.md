# pje-credentials Spec Delta

## MODIFIED Requirements

### Requirement: Tribunal Association (MODIFIED to support multiple sistemas)

The system SHALL allow users to associate password credentials with specific tribunal configurations (tribunal + sistema + grau combinations).

#### Scenario: Associate credential with multiple tribunal configs

- **WHEN** a user selects multiple tribunal configs (e.g., TJCE-PJE-1g, TJCE-ESAJ-unico, TRF2-EPROC-unico)
- **THEN** the system creates a `CredencialTribunal` record for each selected config
- **AND** the system sets the appropriate `tipoTribunal` value ("TRT", "TJ", "TRF", or "Superior")
- **AND** the system prevents duplicate associations for the same credential and tribunal config

#### Scenario: Remove tribunal config association

- **WHEN** a user removes a tribunal config from a credential's association list
- **THEN** the system deletes the corresponding `CredencialTribunal` record
- **AND** the credential remains available for other tribunal configs

#### Scenario: View tribunal configs for a credential

- **WHEN** a user views a credential's details
- **THEN** the system displays all associated tribunal configs grouped by type (TRT, TJ, TRF, Superior)
- **AND** within each type, configs are grouped by tribunal code
- **AND** within each tribunal, configs are grouped by sistema
- **AND** the system shows the last validation date for each config (if available)

#### Scenario: Bulk associate with all configs of a tribunal

- **WHEN** a user selects "Select All" for TJCE
- **THEN** the system creates associations with all TJCE configs (TJCE-PJE-1g, TJCE-PJE-2g, TJCE-ESAJ-unico)
- **AND** the system allows individual removal later if needed

#### Scenario: Bulk associate with all tribunals of a type

- **WHEN** a user selects "All TJs" when creating a credential
- **THEN** the system creates associations with all TJ tribunal configs in the database
- **AND** the system allows individual removal later if needed

### Requirement: Credential Testing with Login Scripts (MODIFIED for multiple sistemas)

The system SHALL provide functionality to test credentials against a tribunal's authentication system using sistema-specific login scripts.

#### Scenario: Test credential for TRT successfully

- **WHEN** a user initiates a credential test for a TRT tribunal config (e.g., TRT3-PJE-1g)
- **THEN** the system calls the `login-pje.js` script with the lawyer's CPF and credential password
- **AND** if login succeeds, the system updates the `validadoEm` timestamp in `CredencialTribunal`
- **AND** the system displays a success message with the lawyer's name from PJE

#### Scenario: Test credential for TJ with PJE successfully

- **WHEN** a user initiates a credential test for a TJ PJE config (e.g., TJCE-PJE-1g)
- **THEN** the system calls the `login-pje.js` script
- **AND** on success, updates `validadoEm` and displays success message

#### Scenario: Test credential for TJ with ESAJ

- **WHEN** a user initiates a credential test for a TJ ESAJ config (e.g., TJSP-ESAJ-unico)
- **THEN** the system displays a message "ESAJ login testing not yet implemented"
- **AND** the system does NOT update `validadoEm`
- **AND** the system suggests manual verification

#### Scenario: Test credential for TRF with EPROC

- **WHEN** a user initiates a credential test for a TRF EPROC config (e.g., TRF2-EPROC-unico)
- **THEN** the system displays a message "EPROC login testing not yet implemented"
- **AND** the system does NOT update `validadoEm`

#### Scenario: Route to correct login script based on sistema

- **WHEN** testing any credential
- **THEN** the system determines the sistema from the TribunalConfig
- **AND** routes to the appropriate script:
  - PJE → `login-pje.js`
  - EPROC → `login-eproc.js` (future)
  - ESAJ → `login-esaj.js` (future)
  - PROJUDI → `login-projudi.js` (future)
  - THEMIS → `login-themis.js` (future)

#### Scenario: Test credential fails

- **WHEN** a user tests a credential and the login script fails
- **THEN** the system displays an error message with the failure reason
- **AND** the system does NOT update the `validadoEm` timestamp
- **AND** the system suggests checking CPF and password

#### Scenario: Rate limit credential tests

- **WHEN** a user attempts to test multiple credentials rapidly
- **THEN** the system enforces a 10-second delay between tests
- **AND** the system displays a message explaining the rate limit (to avoid anti-bot detection)

### Requirement: Database Schema (MODIFIED to support sistema and expanded tipoTribunal)

The system SHALL implement the following database schema for credentials management with support for multiple sistemas.

#### Scenario: TribunalConfig table structure (MODIFIED)

- **WHEN** the database is initialized
- **THEN** the `TribunalConfig` table has columns: id (UUID), grau (String), sistema (String), urlBase (String), urlLoginSeam (String), urlApi (nullable String), tribunalId (String FK), createdAt (DateTime), updatedAt (DateTime)
- **AND** the system creates a unique constraint on `[tribunalId, sistema, grau]`
- **AND** the system creates indexes on `grau` and `sistema`

#### Scenario: CredencialTribunal table structure (MODIFIED)

- **WHEN** the database is initialized
- **THEN** the system creates a `CredencialTribunal` table with columns: id (UUID), tipoTribunal (String enum: "TRT"|"TJ"|"TRF"|"Superior"), validadoEm (nullable DateTime), credencialId (String FK), tribunalConfigId (String FK)
- **AND** the system creates a unique constraint on `[credencialId, tribunalConfigId]`
- **AND** the system creates foreign key relationships with `Credencial` and `TribunalConfig` with cascade delete

#### Scenario: tipoTribunal includes Superior

- **WHEN** a credential is associated with a Superior Court config (TST, STJ, STF)
- **THEN** the `tipoTribunal` field is set to "Superior"
- **AND** queries can filter by tipoTribunal="Superior"

## ADDED Requirements

### Requirement: Multi-Sistema Tribunal Display

The system SHALL display tribunals with multiple sistemas in a grouped, hierarchical structure in the UI.

#### Scenario: Display tribunal with single sistema

- **WHEN** viewing TJSP in the tribunal selector
- **THEN** the system displays:
  - TJSP (checkbox to select all)
    - ESAJ (badge)
      - □ Acesso Único

#### Scenario: Display tribunal with multiple sistemas

- **WHEN** viewing TJCE in the tribunal selector
- **THEN** the system displays:
  - TJCE (checkbox to select all)
    - PJE (badge)
      - □ 1º Grau
      - □ 2º Grau
    - ESAJ (badge)
      - □ Acesso Único

#### Scenario: Display tribunal with multiple sistemas and graus

- **WHEN** viewing TJMG in the tribunal selector
- **THEN** the system displays:
  - TJMG (checkbox to select all)
    - PJE (badge)
      - □ 1º Grau
      - □ Turma Recursal (if applicable)
    - THEMIS (badge)
      - □ 2º Grau

#### Scenario: Sistema badge styling

- **WHEN** displaying a sistema badge
- **THEN** each sistema type has a distinct color:
  - PJE: blue
  - EPROC: green
  - ESAJ: purple
  - PROJUDI: orange
  - THEMIS: red

### Requirement: Grau Display Logic

The system SHALL display appropriate grau labels based on the grau value.

#### Scenario: Display first instance grau

- **WHEN** displaying a config with grau="1g"
- **THEN** the system shows label "1º Grau"

#### Scenario: Display appeals court grau

- **WHEN** displaying a config with grau="2g"
- **THEN** the system shows label "2º Grau"

#### Scenario: Display unified access grau

- **WHEN** displaying a config with grau="unico"
- **THEN** the system shows label "Acesso Único"
- **AND** does NOT show "1º Grau" or "2º Grau" options

### Requirement: Tribunal Config ID Format

The system SHALL use the format CODIGO-SISTEMA-GRAU for tribunal config identifiers throughout the UI and API.

#### Scenario: Generate tribunal config ID

- **WHEN** creating a reference to a tribunal config
- **THEN** the system generates ID in format "{codigo}-{sistema}-{grau}"
- **AND** examples include: "TRT3-PJE-1g", "TJCE-ESAJ-unico", "TRF2-EPROC-unico"

#### Scenario: Parse tribunal config ID in backend

- **WHEN** backend receives a tribunal config ID
- **THEN** the system splits on "-" delimiter
- **AND** extracts codigo, sistema, and grau components
- **AND** queries TribunalConfig WHERE tribunal.codigo = ? AND sistema = ? AND grau = ?

#### Scenario: Handle legacy ID format

- **WHEN** backend receives a legacy ID like "TRT3-1g"
- **THEN** the system interprets it as "TRT3-PJE-1g" (default sistema to PJE)
- **AND** logs a deprecation warning

### Requirement: Credential Retrieval for Automation Scripts (MODIFIED)

The system SHALL provide a way for automation scripts to retrieve credentials for a specific tribunal + sistema + grau combination.

#### Scenario: Retrieve credential for specific config

- **WHEN** an automation script requests credentials for a specific config (e.g., TJCE-PJE-1g)
- **THEN** the system parses the ID to extract (TJCE, PJE, 1g)
- **AND** queries for active credentials associated with that exact config
- **AND** returns the credential with lawyer's CPF, password, and `idAdvogado`
- **AND** if multiple credentials are found, returns the most recently validated one

#### Scenario: No active credentials for specific config

- **WHEN** an automation script requests credentials for a config
- **AND** no active credentials exist for that specific config
- **THEN** the system throws an error indicating missing credentials
- **AND** provides the specific config ID in the error message
- **AND** instructs user to configure credentials via the UI

#### Scenario: Return config metadata with credentials

- **WHEN** the system retrieves a credential
- **THEN** the response includes: `{ cpf, senha, idAdvogado, config: { urlBase, urlLoginSeam, urlApi, sistema, grau } }`
- **AND** automation scripts have all necessary connection info

## MODIFIED Requirements (continued)

### Requirement: Credentials Management UI (MODIFIED for multi-sistema support)

The system SHALL provide a user interface for managing credentials with support for viewing and selecting multiple sistemas per tribunal.

#### Scenario: View tribunal selector with all types

- **WHEN** a user opens the tribunal selector in credential form
- **THEN** the system displays four accordions:
  - "Tribunais Regionais do Trabalho" (24 TRTs)
  - "Tribunais de Justiça" (27 TJs)
  - "Tribunais Regionais Federais" (6 TRFs)
  - "Tribunais Superiores" (3 Superior)

#### Scenario: Expand TJ accordion

- **WHEN** a user expands the "Tribunais de Justiça" accordion
- **THEN** the system displays all 27 TJs alphabetically
- **AND** each TJ shows its sistema badges
- **AND** each sistema shows its grau checkboxes

#### Scenario: Select individual grau within sistema

- **WHEN** a user checks "1º Grau" under TJCE → PJE
- **THEN** only TJCE-PJE-1g is selected
- **AND** TJCE-PJE-2g and TJCE-ESAJ-unico remain unselected

#### Scenario: Select all graus for a sistema

- **WHEN** a user clicks the sistema-level checkbox (e.g., PJE badge checkbox)
- **THEN** all graus under that sistema are selected
- **AND** other sistemas remain unaffected

#### Scenario: Select all configs for a tribunal

- **WHEN** a user clicks the tribunal-level checkbox (e.g., TJCE checkbox)
- **THEN** all sistemas and all graus under that tribunal are selected

#### Scenario: Visual indentation hierarchy

- **WHEN** viewing the tribunal selector
- **THEN** the system uses indentation to show hierarchy:
  - Level 1: Tribunal type (TJ, TRF, etc.)
  - Level 2: Tribunal code (TJCE, TJSP, etc.)
  - Level 3: Sistema (PJE, ESAJ, etc.)
  - Level 4: Grau checkboxes (1º Grau, 2º Grau, Acesso Único)

### Requirement: Auto-detection of idAdvogado (NO CHANGES)

*No modifications to this requirement - remains unchanged from base spec.*

### Requirement: Law Firm Registration (NO CHANGES)

*No modifications to this requirement - remains unchanged from base spec.*

### Requirement: Lawyer Registration (NO CHANGES)

*No modifications to this requirement - remains unchanged from base spec.*

### Requirement: Password Credential Management (NO CHANGES)

*No modifications to this requirement - remains unchanged from base spec.*

### Requirement: Remove Interactive Login Page (NO CHANGES)

*No modifications to this requirement - remains unchanged from base spec.*

### Requirement: No Environment Variable Fallback (NO CHANGES)

*No modifications to this requirement - remains unchanged from base spec.*
