# landing-page Specification

## Purpose
TBD - created by archiving change add-landing-page. Update Purpose after archive.
## Requirements
### Requirement: Public Landing Page

The system SHALL provide a public landing page at the root route (`/`) that presents the project to visitors without requiring authentication.

#### Scenario: First-time visitor accesses root URL
- **WHEN** a user navigates to `/`
- **THEN** the landing page loads successfully
- **AND** displays hero section with project title and description
- **AND** does not require authentication or redirect to login

#### Scenario: Landing page renders on mobile device
- **WHEN** a user accesses `/` on a mobile device (viewport < 768px)
- **THEN** all sections render in single-column layout
- **AND** content is readable without horizontal scrolling
- **AND** interactive elements are touch-friendly (min 44px touch target)

#### Scenario: Landing page renders on desktop
- **WHEN** a user accesses `/` on a desktop device (viewport >= 1024px)
- **THEN** sections render in multi-column layouts where appropriate
- **AND** maximum content width is constrained for readability
- **AND** layout is centered and visually balanced

### Requirement: Hero Section

The landing page SHALL display a hero section that communicates the project's purpose and provides primary calls-to-action.

#### Scenario: Hero section displays project information
- **WHEN** the landing page loads
- **THEN** hero section displays the project name
- **AND** displays a concise tagline (1-2 sentences)
- **AND** explains the dual nature (Browserless + PJE automation)

#### Scenario: Hero displays GitHub badges
- **WHEN** the hero section renders
- **THEN** displays GitHub star count badge
- **AND** displays fork count badge
- **AND** displays license badge (SSPL-1.0)
- **AND** displays Node.js version requirement badge

#### Scenario: Hero provides navigation CTAs
- **WHEN** the hero section renders
- **THEN** displays primary CTA button linking to `/dashboard`
- **AND** displays secondary CTA button linking to documentation
- **AND** displays tertiary link to GitHub repository
- **AND** all CTAs are clearly labeled and accessible

### Requirement: About Section

The landing page SHALL provide an About section that explains what the project is and its key differentiators.

#### Scenario: About section explains project purpose
- **WHEN** the About section renders
- **THEN** describes the project as a fork of Browserless
- **AND** explains the PJE automation extensions
- **AND** clarifies it is an open source project
- **AND** uses language that balances simplicity with technical accuracy

#### Scenario: About section shows project structure
- **WHEN** the About section renders
- **THEN** visually distinguishes Browserless core functionality
- **AND** visually distinguishes PJE automation functionality
- **AND** shows how they integrate

### Requirement: Features Section

The landing page SHALL display a Features section showcasing the main capabilities of the system.

#### Scenario: Features section displays PJE capabilities
- **WHEN** the Features section renders
- **THEN** lists PJE automated login feature
- **AND** lists PJE process scraping feature
- **AND** lists anti-detection mechanisms
- **AND** lists multi-TRT support (24 tribunals)

#### Scenario: Features section displays Browserless capabilities
- **WHEN** the Features section renders
- **THEN** lists headless browser deployment feature
- **AND** lists Puppeteer/Playwright support
- **AND** lists REST APIs feature
- **AND** lists interactive debugger feature

#### Scenario: Features section displays Web Interface capabilities
- **WHEN** the Features section renders
- **THEN** lists Next.js dashboard feature
- **AND** lists credentials management feature
- **AND** lists process visualization feature

#### Scenario: Feature cards are interactive
- **WHEN** a user hovers over a feature card (desktop)
- **THEN** card displays hover effect (visual feedback)
- **AND** transition is smooth (< 300ms)

### Requirement: Technology Stack Section

The landing page SHALL display a Technology Stack section showing the key technologies used in the project.

#### Scenario: Tech stack displays frontend technologies
- **WHEN** the Tech Stack section renders
- **THEN** displays Next.js with version badge
- **AND** displays React with version badge
- **AND** displays Tailwind CSS
- **AND** displays Shadcn/ui

#### Scenario: Tech stack displays backend technologies
- **WHEN** the Tech Stack section renders
- **THEN** displays Node.js with version requirement
- **AND** displays TypeScript
- **AND** displays Prisma ORM

#### Scenario: Tech stack displays automation technologies
- **WHEN** the Tech Stack section renders
- **THEN** displays Puppeteer with version
- **AND** displays Playwright with version
- **AND** displays puppeteer-extra-stealth

#### Scenario: Technology items are organized
- **WHEN** the Tech Stack section renders
- **THEN** technologies are grouped by category (Frontend, Backend, Automation, etc)
- **AND** each technology displays a visual badge or icon
- **AND** layout is grid-based and responsive

### Requirement: Quick Start Section

The landing page SHALL provide a Quick Start section with basic installation and usage instructions.

#### Scenario: Quick start displays installation steps
- **WHEN** the Quick Start section renders
- **THEN** displays step 1: clone repository
- **AND** displays step 2: install dependencies
- **AND** displays step 3: configure environment
- **AND** displays step 4: run development server

#### Scenario: Quick start displays code snippets
- **WHEN** the Quick Start section renders
- **THEN** displays code snippet for installation commands
- **AND** code snippet has syntax highlighting
- **AND** code snippet is properly formatted

#### Scenario: Quick start provides copy functionality
- **WHEN** a user clicks on a code snippet
- **THEN** code is copied to clipboard
- **AND** user receives visual feedback (tooltip or toast)

#### Scenario: Quick start links to full documentation
- **WHEN** the Quick Start section renders
- **THEN** displays link to complete README.md
- **AND** displays link to PJE-specific documentation
- **AND** links are clearly labeled

### Requirement: Open Source Section

The landing page SHALL provide an Open Source section explaining the licensing and contribution model.

#### Scenario: Open source section displays license information
- **WHEN** the Open Source section renders
- **THEN** states the project is licensed under SSPL-1.0
- **AND** explains open source use cases (personal, educational, research)
- **AND** mentions commercial license option
- **AND** links to full LICENSE file

#### Scenario: Open source section encourages contributions
- **WHEN** the Open Source section renders
- **THEN** explains how to contribute (GitHub Issues, PRs)
- **AND** links to CONTRIBUTING.md or contribution guidelines
- **AND** mentions conventional commit style

#### Scenario: Open source section credits upstream
- **WHEN** the Open Source section renders
- **THEN** credits original Browserless project
- **AND** links to upstream repository
- **AND** acknowledges fork relationship

### Requirement: Footer Section

The landing page SHALL display a footer with useful links and credits.

#### Scenario: Footer displays navigation links
- **WHEN** the footer renders
- **THEN** displays link to documentation
- **AND** displays link to GitHub repository
- **AND** displays link to PJE TRT3 (external)

#### Scenario: Footer displays credits
- **WHEN** the footer renders
- **THEN** displays copyright notice with current year
- **AND** credits original Browserless project with link
- **AND** displays "Made with ❤️ for Brazilian legal automation" or similar

### Requirement: GitHub Integration

The landing page SHALL integrate with GitHub API to display real-time repository statistics.

#### Scenario: GitHub badges display real-time data
- **WHEN** the landing page is built (SSG)
- **THEN** fetches current star count from GitHub API
- **AND** fetches current fork count from GitHub API
- **AND** fetches open issues count from GitHub API
- **AND** caches data for 1 hour (ISR revalidation)

#### Scenario: GitHub API failure is handled gracefully
- **WHEN** GitHub API request fails
- **THEN** displays fallback static values
- **AND** logs error to console (development)
- **AND** does not prevent page from rendering

#### Scenario: GitHub badges update periodically
- **WHEN** page is accessed after ISR revalidation period (1 hour)
- **THEN** Next.js regenerates page with fresh GitHub data
- **AND** updated badges are served to subsequent visitors

### Requirement: SEO and Metadata

The landing page SHALL include comprehensive metadata for search engine optimization and social sharing.

#### Scenario: Page includes SEO metadata
- **WHEN** the landing page HTML is generated
- **THEN** includes page title with project name and description
- **AND** includes meta description (< 160 characters)
- **AND** includes meta keywords array
- **AND** includes canonical URL

#### Scenario: Page includes OpenGraph metadata
- **WHEN** the landing page is shared on social media
- **THEN** displays correct og:title
- **AND** displays correct og:description
- **AND** displays og:image (project logo or screenshot)
- **AND** displays og:type as "website"

#### Scenario: Page includes Twitter Card metadata
- **WHEN** the landing page is shared on Twitter
- **THEN** displays correct twitter:card type
- **AND** displays correct twitter:title
- **AND** displays correct twitter:description

### Requirement: Performance and Accessibility

The landing page SHALL meet performance and accessibility standards.

#### Scenario: Landing page achieves Lighthouse performance score
- **WHEN** Lighthouse audit is run on production build
- **THEN** Performance score is >= 95
- **AND** First Contentful Paint is < 1.5s
- **AND** Largest Contentful Paint is < 2.5s
- **AND** Total Blocking Time is < 300ms

#### Scenario: Landing page achieves Lighthouse accessibility score
- **WHEN** Lighthouse audit is run
- **THEN** Accessibility score is 100
- **AND** all images have alt text
- **AND** all interactive elements are keyboard accessible
- **AND** color contrast ratios meet WCAG AA standards

#### Scenario: Landing page achieves Lighthouse SEO score
- **WHEN** Lighthouse audit is run
- **THEN** SEO score is 100
- **AND** page has meta description
- **AND** page has valid structured data
- **AND** all links are crawlable

### Requirement: Static Site Generation

The landing page SHALL be statically generated at build time for maximum performance.

#### Scenario: Landing page is pre-rendered at build
- **WHEN** `npm run build` is executed
- **THEN** landing page HTML is generated as static file
- **AND** initial page load requires no JavaScript execution
- **AND** page can be served directly by CDN or static host

#### Scenario: Landing page uses Incremental Static Regeneration
- **WHEN** ISR revalidation period expires (1 hour)
- **THEN** Next.js regenerates page in background
- **AND** visitors continue to see cached version during regeneration
- **AND** updated page is served after regeneration completes

### Requirement: Responsive Design

The landing page SHALL be fully responsive and mobile-friendly.

#### Scenario: Page adapts to mobile viewport
- **WHEN** page is viewed on mobile (< 640px width)
- **THEN** all sections stack vertically
- **AND** feature grid displays 1 column
- **AND** tech stack displays 2 columns maximum
- **AND** font sizes are readable (>= 16px for body text)

#### Scenario: Page adapts to tablet viewport
- **WHEN** page is viewed on tablet (640-1023px width)
- **THEN** feature grid displays 2 columns
- **AND** tech stack displays 3-4 columns
- **AND** hero section maintains readability

#### Scenario: Page adapts to desktop viewport
- **WHEN** page is viewed on desktop (>= 1024px width)
- **THEN** feature grid displays 3 columns
- **AND** content max-width is constrained (e.g., 1280px)
- **AND** sections are centered and balanced

