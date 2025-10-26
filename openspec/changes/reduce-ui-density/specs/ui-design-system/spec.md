## ADDED Requirements

### Requirement: Base Font-Size Scale
The application SHALL use a reduced base font-size of 85% (13.6px) to provide optimal visual density across all interface components.

#### Scenario: Global scaling applied
- **WHEN** user views any page in the application
- **THEN** base font-size is set to 85% of browser default (13.6px)
- **AND** all rem-based values scale proportionally

#### Scenario: Consistent scaling across pages
- **WHEN** user navigates between different pages (landing, scraping, credentials)
- **THEN** visual scale remains consistent
- **AND** no manual browser zoom adjustment is required

### Requirement: Rem-Based Sizing Strategy
The application SHALL use rem-based sizing for all spacing, typography, and component dimensions to maintain proportional scaling from the base font-size.

#### Scenario: Automatic component scaling
- **WHEN** base font-size is adjusted
- **THEN** all Tailwind spacing classes (p-*, m-*, gap-*, etc.) scale proportionally
- **AND** all typography sizes (text-*, leading-*) scale proportionally
- **AND** no manual adjustments to individual components are required

### Requirement: Accessibility Preservation
The application SHALL maintain minimum accessibility standards for text size and touch targets at the reduced scale.

#### Scenario: Readable text at reduced scale
- **WHEN** user views text content at 85% base scale
- **THEN** body text renders at minimum 13px
- **AND** text remains comfortably readable without strain

#### Scenario: Adequate touch targets
- **WHEN** user interacts with buttons and inputs on touch devices
- **THEN** interactive elements maintain minimum 44x44px touch target size
- **AND** touch interactions remain accurate and user-friendly

### Requirement: Responsive Behavior
The application SHALL maintain proper responsive layout behavior at all viewport sizes with the reduced base font-size.

#### Scenario: Desktop responsiveness
- **WHEN** user views application on desktop (>1024px width)
- **THEN** layout displays correctly without overflow or truncation
- **AND** all content remains properly aligned and spaced

#### Scenario: Mobile responsiveness
- **WHEN** user views application on mobile device (<768px width)
- **THEN** responsive breakpoints function correctly
- **AND** content scales appropriately for smaller viewports
- **AND** no horizontal scrolling occurs
