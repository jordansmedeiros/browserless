# PJE Automation Capability

## ADDED Requirements

### Requirement: TRT Enumeration
The system SHALL support all 24 TRTs (Tribunais Regionais do Trabalho) in Brazil.

#### Scenario: List all supported TRTs
- **WHEN** querying available TRTs
- **THEN** the system returns all 24 TRTs from TRT1 to TRT24

#### Scenario: TRT identification
- **WHEN** a TRT code is provided (e.g., "TRT3", "TRT15")
- **THEN** the system validates and recognizes the TRT

### Requirement: Grau Support
The system SHALL support both 1º grau (first instance) and 2º grau (appeals court) for each TRT.

#### Scenario: Select first instance
- **WHEN** user selects TRT3 with 1º grau
- **THEN** the system uses the URL pattern for first instance (e.g., `https://pje.trt3.jus.br/primeirograu/`)

#### Scenario: Select appeals court
- **WHEN** user selects TRT3 with 2º grau
- **THEN** the system uses the URL pattern for appeals court (e.g., `https://pje.trt3.jus.br/segundograu/`)

### Requirement: Database-Driven TRT Configuration
The system SHALL store TRT configurations (URLs, regional info) in the database rather than hardcoded values.

#### Scenario: Retrieve TRT configuration from database
- **WHEN** automation script needs to login to TRT15 1º grau
- **THEN** the system queries the database for TRT15 configuration
- **AND** returns the login URL, API base URL, and regional metadata

#### Scenario: Default TRT configuration
- **WHEN** no TRT is specified
- **THEN** the system defaults to TRT3 for backward compatibility

#### Scenario: Override TRT URL for edge cases
- **WHEN** a specific TRT has a non-standard URL pattern
- **THEN** administrators can override the URL in the database
- **AND** the system uses the custom URL instead of the generated pattern

### Requirement: Standardized URL Pattern Generation
The system SHALL generate PJE URLs following the standard pattern `https://pje.trt{N}.jus.br/{grau}/` where N is the TRT number and grau is either "primeirograu" or "segundograu".

#### Scenario: Generate TRT3 first instance URL
- **WHEN** generating URL for TRT3 1º grau
- **THEN** the system produces `https://pje.trt3.jus.br/primeirograu/login.seam`

#### Scenario: Generate TRT15 appeals URL
- **WHEN** generating URL for TRT15 2º grau
- **THEN** the system produces `https://pje.trt15.jus.br/segundograu/login.seam`

#### Scenario: Generate API base URL
- **WHEN** generating API base URL for TRT8
- **THEN** the system produces `https://pje.trt8.jus.br`

### Requirement: TypeScript Type System for TRTs
The system SHALL provide comprehensive TypeScript types and interfaces for TRT operations.

#### Scenario: TRT type definition
- **WHEN** code references a TRT
- **THEN** it uses the TRT union type that includes all 24 TRTs
- **AND** TypeScript provides autocomplete and type safety

#### Scenario: Grau type definition
- **WHEN** code references a grau
- **THEN** it uses the Grau union type with "1g" | "2g" values
- **AND** TypeScript enforces valid grau values

#### Scenario: Tribunal configuration interface
- **WHEN** accessing tribunal configuration
- **THEN** the object conforms to TribunalConfig interface
- **AND** includes fields: codigo, nome, regiao, urlBase, urlLogin, ativo

### Requirement: Parameterized Automation Functions
The system SHALL accept TRT and grau as parameters in all PJE automation functions.

#### Scenario: Login with TRT parameter
- **WHEN** calling `executarLoginPJE(cpf, senha, trt, grau)`
- **THEN** the function uses the specified TRT's login URL
- **AND** executes login for that specific tribunal and grau

#### Scenario: Scrape processes with TRT parameter
- **WHEN** calling `rasparProcessosPJE(cpf, senha, idAdvogado, trt, grau, idAgrupamento)`
- **THEN** the function scrapes processes from the specified TRT and grau
- **AND** returns results tagged with TRT and grau information

#### Scenario: Backward compatibility with defaults
- **WHEN** calling legacy function without TRT parameters
- **THEN** the system defaults to TRT3 1º grau
- **AND** maintains existing behavior for current users

### Requirement: Database Migration for Initial TRT Data
The system SHALL include a migration to populate all 48 TRT configurations (24 TRTs × 2 graus).

#### Scenario: Seed all TRT configurations
- **WHEN** database migration runs
- **THEN** it creates 48 TribunalConfig records
- **AND** each record contains the correct URL pattern, region, and metadata

#### Scenario: Mark active TRTs
- **WHEN** seeding TRT data
- **THEN** all 24 TRTs are marked as active by default
- **AND** administrators can deactivate specific TRTs if needed

### Requirement: Regional Grouping
The system SHALL organize TRTs by their geographic regions (5 regions in Brazil).

#### Scenario: Group TRTs by region
- **WHEN** querying TRTs
- **THEN** the system can filter by region (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)
- **AND** returns TRTs belonging to that region

#### Scenario: TRT regional metadata
- **WHEN** accessing TRT configuration
- **THEN** it includes regional information (regiao, uf, cidade sede)
- **AND** provides context for geographic organization

### Requirement: TRT Code Validation
The system SHALL validate TRT codes and reject invalid values.

#### Scenario: Accept valid TRT codes
- **WHEN** user provides "TRT3" or "TRT15"
- **THEN** the system accepts and processes the request

#### Scenario: Reject invalid TRT codes
- **WHEN** user provides "TRT25" or "TRT0"
- **THEN** the system rejects with error "Invalid TRT code"
- **AND** returns list of valid TRT codes

#### Scenario: Normalize TRT code format
- **WHEN** user provides "trt3" (lowercase) or "3" (number only)
- **THEN** the system normalizes to "TRT3"
- **AND** processes the request correctly
