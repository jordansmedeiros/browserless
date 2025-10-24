# PJE Security Specification

## ADDED Requirements

### Requirement: Environment-Based Credentials

The PJE automation scripts SHALL read all sensitive credentials exclusively from environment variables, never from hardcoded values in source code.

#### Scenario: Loading credentials from environment variables

- **WHEN** a PJE script is executed
- **THEN** it MUST read `PJE_CPF`, `PJE_SENHA`, and `PJE_ID_ADVOGADO` from environment variables
- **AND** it MUST NOT contain hardcoded credential values in the source code

#### Scenario: Missing required credentials

- **WHEN** a PJE script is executed without required environment variables
- **THEN** the script SHALL fail immediately with a clear error message
- **AND** the error message SHALL indicate which environment variables are missing
- **AND** the error message SHALL reference documentation on how to configure credentials

#### Scenario: Multiple environments

- **WHEN** the same codebase is used across different environments (dev, staging, production)
- **THEN** each environment SHALL be able to use different credentials via separate `.env` files
- **AND** no code changes SHALL be required to switch between environments

### Requirement: Environment Configuration Template

The project SHALL provide a `.env.example` file with all required PJE environment variables documented.

#### Scenario: New developer setup

- **WHEN** a new developer clones the repository
- **THEN** they SHALL find a `.env.example` file with PJE credential variables
- **AND** each variable SHALL have a descriptive comment explaining its purpose
- **AND** the variables SHALL include `PJE_CPF`, `PJE_SENHA`, and `PJE_ID_ADVOGADO`

#### Scenario: Environment file example values

- **WHEN** viewing the `.env.example` file
- **THEN** credential fields SHALL contain placeholder values or be empty
- **AND** placeholder values SHALL clearly indicate they are examples (e.g., "SEU_CPF_AQUI")
- **AND** the file SHALL NOT contain real credentials

### Requirement: Gitignore Protection

The project SHALL ensure that `.gitignore` prevents committing sensitive credential files.

#### Scenario: Preventing credential leaks

- **WHEN** files matching `*.env*` pattern are created in the project
- **THEN** Git SHALL ignore these files by default
- **AND** the pattern SHALL cover `.env`, `.env.local`, `.env.development`, etc.
- **AND** the `data/` directory containing scraped data SHALL also be ignored

#### Scenario: Verifying gitignore rules

- **WHEN** a developer runs `git status` with an `.env` file present
- **THEN** the `.env` file SHALL NOT appear as an untracked file
- **AND** files in `data/` directory SHALL NOT appear as untracked files

### Requirement: Credential Validation

PJE scripts SHALL validate that credentials are properly configured before attempting authentication.

#### Scenario: Validation before login attempt

- **WHEN** a PJE script starts execution
- **THEN** it SHALL check that all required credential environment variables are defined
- **AND** it SHALL check that credential values are non-empty
- **AND** validation SHALL occur before any network requests are made

#### Scenario: Clear error reporting

- **WHEN** credential validation fails
- **THEN** the script SHALL output an error message in Portuguese (user-facing language)
- **AND** the message SHALL list each missing or invalid credential variable
- **AND** the message SHALL provide a link or reference to setup documentation
- **AND** the script SHALL exit with a non-zero exit code

### Requirement: Documentation Updates

All PJE documentation SHALL be updated to reflect the environment-based credential configuration.

#### Scenario: Setup instructions

- **WHEN** a user reads the PJE README files
- **THEN** the documentation SHALL include step-by-step instructions for configuring credentials
- **AND** instructions SHALL cover creating a `.env` file from `.env.example`
- **AND** instructions SHALL explain where to obtain each credential value (CPF, senha, ID do advogado)

#### Scenario: Troubleshooting guide

- **WHEN** a user encounters credential-related errors
- **THEN** the documentation SHALL provide a troubleshooting section
- **AND** the section SHALL cover common errors (missing vars, empty values, wrong format)
- **AND** the section SHALL provide example error messages and solutions
