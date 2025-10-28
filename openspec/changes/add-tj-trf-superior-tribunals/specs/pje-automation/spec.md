# pje-automation Spec Delta

## MODIFIED Requirements

### Requirement: Tribunal Enumeration (was: TRT Enumeration)

The system SHALL support all 60 Brazilian tribunals: 24 TRTs, 27 TJs, 6 TRFs, and 3 Superior Courts.

#### Scenario: List all supported TRTs

- **WHEN** querying available TRTs
- **THEN** the system returns all 24 TRTs from TRT1 to TRT24

#### Scenario: List all supported TJs

- **WHEN** querying available TJs (Tribunais de Justiça)
- **THEN** the system returns all 27 state justice courts (TJSP, TJMG, TJCE, TJRS, etc.)

#### Scenario: List all supported TRFs

- **WHEN** querying available TRFs (Tribunais Regionais Federais)
- **THEN** the system returns all 6 federal regional courts (TRF1 through TRF6)

#### Scenario: List all supported Superior Courts

- **WHEN** querying available Superior Courts
- **THEN** the system returns TST, STJ, and STF

#### Scenario: Tribunal identification

- **WHEN** a tribunal code is provided (e.g., "TRT3", "TJSP", "TRF2", "TST")
- **THEN** the system validates and recognizes the tribunal
- **AND** the system determines the tribunal type (TRT, TJ, TRF, or Superior)

### Requirement: Grau Support (MODIFIED to include unified access)

The system SHALL support 1º grau (first instance), 2º grau (appeals court), and acesso único (unified access) for tribunals.

#### Scenario: Select first instance

- **WHEN** user selects a tribunal with 1º grau (e.g., TRT3-PJE-1g, TJCE-PJE-1g)
- **THEN** the system uses the URL for first instance

#### Scenario: Select appeals court

- **WHEN** user selects a tribunal with 2º grau (e.g., TRT3-PJE-2g, TJCE-PJE-2g)
- **THEN** the system uses the URL for appeals court

#### Scenario: Select unified access

- **WHEN** user selects a tribunal with unified access (e.g., TJSP-ESAJ-unico, TRF2-EPROC-unico)
- **THEN** the system uses the unified access URL
- **AND** the system does NOT require grau selection

### Requirement: Database-Driven Tribunal Configuration (MODIFIED)

The system SHALL store tribunal configurations (URLs, sistema type, regional info) in the database rather than hardcoded values.

#### Scenario: Retrieve tribunal configuration from database

- **WHEN** automation script needs to login to a specific tribunal instance (e.g., TJSP-ESAJ-unico)
- **THEN** the system queries the database for that tribunal + sistema + grau combination
- **AND** returns the login URL, sistema type, API base URL (if available), and regional metadata

#### Scenario: Default tribunal configuration

- **WHEN** no tribunal is specified
- **THEN** the system defaults to TRT3-PJE-1g for backward compatibility

#### Scenario: Override tribunal URL for edge cases

- **WHEN** a specific tribunal has a non-standard URL pattern
- **THEN** administrators can override the URL in the database
- **AND** the system uses the custom URL instead of the generated pattern

#### Scenario: Handle tribunals with multiple systems

- **WHEN** querying configs for a tribunal like TJCE (which has both PJE and ESAJ)
- **THEN** the system returns multiple configs
- **AND** each config specifies its sistema type (PJE or ESAJ)

## ADDED Requirements

### Requirement: Multiple System Support

The system SHALL support multiple judicial systems: PJE, EPROC, ESAJ, PROJUDI, and THEMIS.

#### Scenario: Identify sistema type

- **WHEN** accessing a tribunal configuration
- **THEN** the system provides the sistema type (PJE, EPROC, ESAJ, PROJUDI, or THEMIS)
- **AND** automation scripts can route to the appropriate login/scraping implementation

#### Scenario: Query configs by sistema

- **WHEN** filtering tribunal configs by sistema (e.g., "all PJE tribunals")
- **THEN** the system returns only configs matching that sistema type

#### Scenario: Handle sistema-specific features

- **WHEN** a sistema does not have an API (e.g., EPROC, PROJUDI)
- **THEN** the config's urlApi field is NULL
- **AND** automation scripts use web scraping instead of API calls

### Requirement: Tribunal Config Identification

The system SHALL use a three-part identifier for tribunal configurations: CODIGO-SISTEMA-GRAU.

#### Scenario: Parse new format tribunal ID

- **WHEN** receiving ID "TJCE-PJE-1g"
- **THEN** the system parses it as { codigo: "TJCE", sistema: "PJE", grau: "1g" }

#### Scenario: Parse legacy format tribunal ID

- **WHEN** receiving legacy ID "TRT3-1g" (missing sistema)
- **THEN** the system upgrades it to { codigo: "TRT3", sistema: "PJE", grau: "1g" }
- **AND** logs a deprecation warning

#### Scenario: Reject invalid tribunal ID

- **WHEN** receiving invalid ID "INVALID"
- **THEN** the system throws an error with message "Invalid tribunal config ID format"
- **AND** provides expected format example

### Requirement: TypeScript Type System for All Tribunals (EXPANDED)

The system SHALL provide comprehensive TypeScript types and interfaces for all tribunal operations.

#### Scenario: Tribunal code types

- **WHEN** code references a tribunal
- **THEN** it uses one of: TRTCode, TJCode, TRFCode, or TribunalSuperiorCode
- **AND** the union type TribunalCode accepts all 60 tribunal codes

#### Scenario: Sistema type definition

- **WHEN** code references a sistema
- **THEN** it uses the Sistema union type with values: "PJE" | "EPROC" | "ESAJ" | "PROJUDI" | "THEMIS"
- **AND** TypeScript provides autocomplete for sistema values

#### Scenario: Grau type definition (MODIFIED)

- **WHEN** code references a grau
- **THEN** it uses the Grau union type with values: "1g" | "2g" | "unico"
- **AND** TypeScript enforces valid grau values

#### Scenario: Tribunal configuration interface (MODIFIED)

- **WHEN** accessing tribunal configuration
- **THEN** the object conforms to TribunalConfig interface
- **AND** includes fields: codigo, nome, regiao, sistema, grau, urlBase, urlLogin, urlApi (nullable), ativo

## MODIFIED Requirements (continued)

### Requirement: Standardized URL Pattern Generation (MODIFIED)

The system SHALL generate URLs based on sistema type and tribunal-specific patterns, NOT assuming a single PJE pattern.

#### Scenario: Generate TRT PJE URL

- **WHEN** generating URL for TRT3 with sistema PJE and grau 1g
- **THEN** the system produces `https://pje.trt3.jus.br/primeirograu/login.seam`

#### Scenario: Generate TJ PJE URL

- **WHEN** generating URL for TJCE with sistema PJE and grau 1g
- **THEN** the system produces `https://pje.tjce.jus.br/pje1grau/login.seam`

#### Scenario: Generate ESAJ URL

- **WHEN** generating URL for TJSP with sistema ESAJ and grau unico
- **THEN** the system produces `https://esaj.tjsp.jus.br/sajcas/login?service=...`

#### Scenario: Generate EPROC URL

- **WHEN** generating URL for TRF2 with sistema EPROC and grau unico
- **THEN** the system produces `https://eproc.trf2.jus.br/eproc/`

#### Scenario: Handle custom URL patterns

- **WHEN** a tribunal uses a non-standard URL
- **THEN** the database stores the exact URL
- **AND** no pattern generation is attempted

### Requirement: Parameterized Automation Functions (MODIFIED)

The system SHALL accept tribunal code, sistema, and grau as parameters in all automation functions.

#### Scenario: Login with full tribunal parameters

- **WHEN** calling `executarLoginPJE(cpf, senha, codigo, sistema, grau)`
- **THEN** the function queries the config matching all three parameters
- **AND** uses the correct URL for that specific tribunal+sistema+grau combination

#### Scenario: Scrape processes with tribunal parameters

- **WHEN** calling `rasparProcessosPJE(cpf, senha, idAdvogado, codigo, sistema, grau, idAgrupamento)`
- **THEN** the function scrapes from the specified tribunal+sistema+grau
- **AND** returns results tagged with all three identifiers

#### Scenario: Backward compatibility with defaults

- **WHEN** calling legacy function without sistema parameter
- **THEN** the system defaults to sistema="PJE"
- **AND** maintains existing behavior for current users

### Requirement: Database Migration for All Tribunal Data (MODIFIED)

The system SHALL include migrations to populate all 168 tribunal configurations.

#### Scenario: Seed all tribunal configurations

- **WHEN** database migration runs
- **THEN** it creates configs for:
  - 48 TRT configs (24 TRTs × 2 graus, all PJE)
  - ~70 TJ configs (27 TJs with varying sistemas and graus)
  - ~10 TRF configs (6 TRFs with PJE or EPROC)
  - 3 Superior configs (TST, STJ, STF with unified access)

#### Scenario: Mark active tribunals

- **WHEN** seeding tribunal data
- **THEN** all tribunals are marked as active by default
- **AND** administrators can deactivate specific tribunals if needed

#### Scenario: Assign correct sistema to each config

- **WHEN** seeding a config
- **THEN** the sistema field matches the actual system used by that tribunal
- **AND** TRTs always use PJE
- **AND** TJs/TRFs use their documented sistema (PJE, EPROC, ESAJ, PROJUDI, or THEMIS)

### Requirement: Tribunal Code Validation (MODIFIED)

The system SHALL validate tribunal codes for all tribunal types and reject invalid values.

#### Scenario: Accept valid TRT codes

- **WHEN** user provides "TRT3" or "TRT15"
- **THEN** the system accepts and processes the request

#### Scenario: Accept valid TJ codes

- **WHEN** user provides "TJSP" or "TJCE"
- **THEN** the system accepts and categorizes as TJ type

#### Scenario: Accept valid TRF codes

- **WHEN** user provides "TRF2" or "TRF5"
- **THEN** the system accepts and categorizes as TRF type

#### Scenario: Accept valid Superior codes

- **WHEN** user provides "TST", "STJ", or "STF"
- **THEN** the system accepts and categorizes as Superior type

#### Scenario: Reject invalid tribunal codes

- **WHEN** user provides "TRT25", "TJ99", or "INVALID"
- **THEN** the system rejects with error "Invalid tribunal code"
- **AND** returns list of valid tribunal codes by type

#### Scenario: Normalize tribunal code format

- **WHEN** user provides "tjsp" (lowercase) or "trt3" (lowercase)
- **THEN** the system normalizes to uppercase ("TJSP", "TRT3")
- **AND** processes the request correctly
