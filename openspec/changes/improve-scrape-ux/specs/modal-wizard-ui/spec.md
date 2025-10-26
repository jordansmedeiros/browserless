# Capability: modal-wizard-ui

## Purpose

Transform the scrape configuration modal into a multi-step wizard with proper visual hierarchy to improve usability and reduce cognitive load.

## MODIFIED Requirements

### Requirement: Scraping Configuration Form UI

The system SHALL provide a wizard-based form interface with clear visual hierarchy for configuring scraping jobs.

#### Scenario: Display wizard modal with proper heading hierarchy

- **WHEN** a user clicks "Nova Raspagem" on the scrapes page
- **THEN** the system displays a modal dialog with title "Configurar Raspagem" in `text-2xl font-bold`
- **AND** the modal shows a step indicator (e.g., "Etapa 1 de 2")
- **AND** step titles are displayed in `text-xl font-semibold`
- **AND** section labels use `text-sm font-medium text-muted-foreground`
- **AND** the visual hierarchy is: Modal Title (largest) > Step Title (medium) > Labels (smallest)

#### Scenario: Navigate through wizard steps

- **WHEN** a user is on Step 1 (Tribunal Selection)
- **THEN** the system displays the tribunal selector component
- **AND** the modal shows a "Próximo" button to advance to Step 2
- **AND** the "Próximo" button is disabled if no tribunals are selected
- **WHEN** the user clicks "Próximo" with valid selections
- **THEN** the system advances to Step 2 (Configuration)
- **AND** the modal updates the step indicator to "Etapa 2 de 2"

#### Scenario: Step 1 - Tribunal Selection

- **WHEN** a user is on Step 1
- **THEN** the system displays "Selecionar Tribunais" as the step title
- **AND** the system shows the existing `TribunalSelector` component
- **AND** the tribunal list has internal scroll (max-height: 400px)
- **AND** the modal body does NOT scroll
- **AND** the system displays selected count below the selector (e.g., "3 tribunais selecionados")

#### Scenario: Step 2 - Scrape Configuration

- **WHEN** a user is on Step 2
- **THEN** the system displays "Configurar Raspagem" as the step title
- **AND** the system shows the scrape type selector (radio buttons)
- **AND** sub-type options appear dynamically if "Pendentes" is selected
- **AND** the system displays a configuration summary showing:
  - Number of tribunals selected
  - Selected scrape type
  - Selected sub-types (if applicable)
  - Estimated execution time
- **AND** the modal shows "Voltar" and "Iniciar Raspagem" buttons

#### Scenario: Validate step before navigation

- **WHEN** a user attempts to advance from Step 1 without selecting tribunals
- **THEN** the system prevents navigation to Step 2
- **AND** the "Próximo" button remains disabled
- **AND** the system shows a validation message: "Selecione ao menos um tribunal"

- **WHEN** a user attempts to submit Step 2 without selecting a scrape type
- **THEN** the system prevents job creation
- **AND** the "Iniciar Raspagem" button is disabled
- **AND** the system shows validation message: "Selecione um tipo de raspagem"

#### Scenario: Navigate back to previous step

- **WHEN** a user clicks "Voltar" on Step 2
- **THEN** the system returns to Step 1
- **AND** all previous selections are preserved
- **AND** the step indicator updates to "Etapa 1 de 2"

#### Scenario: Modal dimensions and scrolling

- **WHEN** the wizard modal is displayed
- **THEN** the modal has a fixed height appropriate for viewport
- **AND** only the tribunal selector (Step 1) has internal scrolling
- **AND** the modal body itself does NOT scroll
- **AND** all content is visible without needing to scroll the modal

#### Scenario: Close wizard modal

- **WHEN** a user clicks outside the modal or presses Escape
- **THEN** the system displays a confirmation dialog if any selections were made
- **AND** the confirmation asks "Descartar configuração?"
- **AND** if confirmed, the modal closes and selections are reset
- **WHEN** no selections were made
- **THEN** the modal closes immediately without confirmation

#### Scenario: Submit configuration and create job

- **WHEN** a user clicks "Iniciar Raspagem" on Step 2 with valid configuration
- **THEN** the system creates the scraping job via `createScrapeJobAction`
- **AND** the wizard modal closes
- **AND** the system displays the terminal monitor modal (see `terminal-monitor` capability)

## ADDED Requirements

### Requirement: Wizard Step Navigation Component

The system SHALL provide a reusable wizard navigation component for step-based flows.

#### Scenario: Render wizard navigation buttons

- **WHEN** a wizard step is displayed
- **THEN** the system shows navigation buttons in the modal footer
- **AND** on Step 1, only "Próximo" button is shown
- **AND** on Step 2, both "Voltar" and "Iniciar Raspagem" buttons are shown
- **AND** buttons are styled with primary (Próximo/Iniciar) and secondary (Voltar) variants

#### Scenario: Disable navigation when invalid

- **WHEN** a wizard step has validation errors
- **THEN** the forward navigation button is disabled
- **AND** the button shows a disabled state (gray, not clickable)
- **AND** validation messages are displayed above the buttons

### Requirement: Wizard State Persistence

The system SHALL preserve wizard selections when navigating between steps.

#### Scenario: Preserve Step 1 selections when advancing

- **WHEN** a user selects 5 tribunals on Step 1 and clicks "Próximo"
- **THEN** the system stores the selections in component state
- **WHEN** the user clicks "Voltar" from Step 2
- **THEN** the 5 tribunals are still selected on Step 1

#### Scenario: Preserve Step 2 selections when going back

- **WHEN** a user selects "Acervo Geral" on Step 2 and clicks "Voltar"
- **THEN** the scrape type selection is stored
- **WHEN** the user advances to Step 2 again
- **THEN** "Acervo Geral" is still selected

## REMOVED Requirements

### Requirement: Scraping Configuration Form UI (Old Single-Page Form)

The old requirement that displayed all configuration options on a single scrollable form is replaced by the wizard-based approach.

**Scenarios removed**:
- Display scraping configuration form (old single-page version)
- Tribunal selection UI with grouping (now in Step 1)
- Scrape type selection with radio buttons (now in Step 2)
- Display configuration summary (now integrated in Step 2)
- Form validation feedback (now step-based)
