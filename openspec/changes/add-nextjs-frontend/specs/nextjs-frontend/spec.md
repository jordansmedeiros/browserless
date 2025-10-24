# Specification: Next.js Frontend

## ADDED Requirements

### Requirement: Next.js Application Setup

The system SHALL provide a Next.js 15 application using App Router architecture, TypeScript, and Tailwind CSS as the primary frontend framework.

#### Scenario: Next.js dev server starts successfully
- **WHEN** developer runs `npm run dev`
- **THEN** Next.js development server starts on port 3000
- **AND** hot module replacement (HMR) is enabled
- **AND** TypeScript compilation is active
- **AND** no compilation errors are displayed

#### Scenario: Next.js production build succeeds
- **WHEN** developer runs `npm run build`
- **THEN** Next.js builds static assets
- **AND** backend server code is compiled
- **AND** build completes without errors
- **AND** optimized bundle is created in `.next/` directory

#### Scenario: Environment variables are validated
- **WHEN** application starts (dev or production)
- **THEN** required environment variables are validated
- **AND** missing variables cause startup failure with helpful error
- **AND** `NEXT_PUBLIC_*` variables are accessible in browser
- **AND** private variables remain server-side only

---

### Requirement: Shadcn/ui Component Library Integration

The system SHALL integrate Shadcn/ui component library with Tailwind CSS for building accessible and customizable UI components.

#### Scenario: Shadcn/ui is initialized
- **WHEN** developer runs `npx shadcn@latest init`
- **THEN** `components.json` config file is created
- **AND** `components/ui/` directory is created
- **AND** Tailwind CSS is configured with Shadcn theme
- **AND** base utility functions (cn, clsx) are available

#### Scenario: Shadcn components can be added
- **WHEN** developer runs `npx shadcn@latest add button`
- **THEN** Button component is copied to `components/ui/button.tsx`
- **AND** component uses Radix UI primitives
- **AND** component is fully typed with TypeScript
- **AND** component supports theme variants (default, destructive, outline, etc.)

#### Scenario: Dark/light theme switching works
- **WHEN** user clicks theme toggle button
- **THEN** application theme switches between light and dark
- **AND** preference is persisted in localStorage
- **AND** all Shadcn components respect theme colors
- **AND** no flash of unstyled content (FOUC) occurs

---

### Requirement: Project Structure Reorganization

The system SHALL reorganize the codebase into a monorepo structure with clear separation between frontend (Next.js) and backend (Browserless + PJE scripts).

#### Scenario: Backend code is moved to server directory
- **WHEN** restructuring is complete
- **THEN** Browserless source code is in `server/src/`
- **AND** PJE scripts are in `server/scripts/pje/`
- **AND** backend build output is in `server/build/`
- **AND** backend has its own `server/tsconfig.json`

#### Scenario: Shared code is accessible to both frontend and backend
- **WHEN** code needs to be shared
- **THEN** shared types are defined in `lib/types/`
- **AND** shared utilities are in `lib/utils/`
- **AND** both frontend and backend can import from `@/lib/*`
- **AND** TypeScript path aliases resolve correctly

#### Scenario: CLI scripts still work after reorganization
- **WHEN** developer runs `node server/scripts/pje/login.js`
- **THEN** script executes successfully
- **AND** output is saved to `data/pje/` as before
- **AND** all existing functionality is preserved
- **AND** no breaking changes to CLI usage

---

### Requirement: Server Actions for PJE Operations

The system SHALL provide Next.js Server Actions to execute PJE automation scripts from the frontend without exposing backend implementation details.

#### Scenario: PJE login Server Action succeeds
- **WHEN** user submits login form with valid CPF and password
- **THEN** `loginPJE` Server Action is invoked
- **AND** credentials are validated on server-side
- **AND** Puppeteer script executes login flow
- **AND** session token/cookies are stored securely
- **AND** success response is returned to client

#### Scenario: PJE login Server Action fails with invalid credentials
- **WHEN** user submits login form with invalid credentials
- **THEN** `loginPJE` Server Action is invoked
- **AND** Puppeteer script detects login failure
- **AND** error message is returned to client
- **AND** no sensitive error details are exposed
- **AND** user sees friendly error message in UI

#### Scenario: PJE scraping Server Action executes
- **WHEN** user triggers process scraping action
- **THEN** `scrapePJE` Server Action is invoked
- **AND** backend script collects process data
- **AND** progress updates are streamed to client (optional)
- **AND** results are saved to `data/pje/processos/`
- **AND** summary is returned to client

#### Scenario: Server Actions validate input
- **WHEN** client sends malformed data to Server Action
- **THEN** Zod schema validation is performed
- **AND** validation errors are returned clearly
- **AND** invalid requests do not reach backend scripts
- **AND** no server errors are thrown

---

### Requirement: API Routes for External Access

The system SHALL provide optional REST API routes for external clients to trigger PJE operations when Server Actions are not suitable.

#### Scenario: API route handles PJE login request
- **WHEN** external client sends POST to `/api/pje/login`
- **THEN** request body is validated with Zod
- **AND** credentials are passed to backend login script
- **AND** JSON response is returned with success/error status
- **AND** appropriate HTTP status codes are used (200, 400, 401, 500)

#### Scenario: API route handles PJE processos request
- **WHEN** external client sends GET to `/api/pje/processos`
- **THEN** authentication token is validated (if implemented)
- **AND** backend scraping script is executed
- **AND** JSON response contains list of processes
- **AND** pagination parameters are respected

#### Scenario: API routes enforce rate limiting
- **WHEN** client exceeds rate limit (e.g., 10 requests/minute)
- **THEN** subsequent requests are rejected
- **AND** HTTP 429 (Too Many Requests) is returned
- **AND** `Retry-After` header is included
- **AND** rate limit counters are tracked per IP/user

---

### Requirement: TypeScript Configuration for Monorepo

The system SHALL configure TypeScript to support both frontend (Next.js) and backend (Node.js) code with shared types and path aliases.

#### Scenario: Root TypeScript config is created
- **WHEN** TypeScript is configured
- **THEN** root `tsconfig.json` exists with common settings
- **AND** path aliases are defined (`@/*`, `@/lib/*`, `@/server/*`)
- **AND** strict mode is enabled
- **AND** ES2022 target is set

#### Scenario: Server TypeScript config extends root
- **WHEN** backend code is compiled
- **THEN** `server/tsconfig.json` extends root config
- **AND** `outDir` is set to `server/build/`
- **AND** `rootDir` is set to `server/src/`
- **AND** server-specific settings are applied

#### Scenario: TypeScript compilation succeeds
- **WHEN** developer runs `tsc --noEmit` in root
- **THEN** no compilation errors are shown
- **AND** all imports resolve correctly
- **AND** shared types are accessible from both frontend and backend

---

### Requirement: Development Workflow with Concurrent Servers

The system SHALL provide a development workflow that runs Next.js dev server and backend server concurrently with hot reload.

#### Scenario: Concurrent dev servers start
- **WHEN** developer runs `npm run dev`
- **THEN** Next.js dev server starts on port 3000
- **AND** backend server starts on port 3001 (if standalone)
- **AND** both servers log startup messages
- **AND** developer can access frontend at `http://localhost:3000`

#### Scenario: Frontend hot reload works
- **WHEN** developer edits a React component
- **THEN** Next.js detects file change
- **AND** component is recompiled instantly
- **AND** browser updates without full refresh
- **AND** React state is preserved (Fast Refresh)

#### Scenario: Backend changes trigger rebuild
- **WHEN** developer edits backend TypeScript file
- **THEN** TypeScript recompiles automatically (if using ts-node-dev)
- **AND** changes are reflected in Server Actions
- **AND** developer sees compilation status in terminal

---

### Requirement: Environment Variable Management

The system SHALL manage environment variables with clear separation between client-side and server-side variables, following Next.js conventions.

#### Scenario: Client-side variables are accessible
- **WHEN** frontend code accesses `process.env.NEXT_PUBLIC_APP_URL`
- **THEN** variable value is available in browser
- **AND** variable is embedded in bundle at build time
- **AND** no server-only variables are exposed

#### Scenario: Server-side variables are protected
- **WHEN** frontend code tries to access `process.env.PJE_CPF`
- **THEN** variable is undefined in client bundle
- **AND** variable is only accessible in Server Actions/API Routes
- **AND** no credentials leak to browser

#### Scenario: Missing required variables cause startup error
- **WHEN** required variable is missing from `.env`
- **THEN** application fails to start
- **AND** clear error message indicates missing variable
- **AND** example value is shown in error message

---

### Requirement: UI Component Library

The system SHALL provide a base set of Shadcn/ui components for building forms, tables, dialogs, and other common UI patterns.

#### Scenario: Button component is available
- **WHEN** developer imports `Button` from `@/components/ui/button`
- **THEN** component renders with correct styles
- **AND** component supports variants (default, destructive, outline, ghost, link)
- **AND** component supports sizes (default, sm, lg, icon)
- **AND** component is fully accessible (keyboard navigation, ARIA)

#### Scenario: Form components handle validation
- **WHEN** user submits form with invalid data
- **THEN** validation errors are displayed inline
- **AND** error messages use Shadcn styling
- **AND** form state is managed by Server Actions or React Hook Form
- **AND** user can correct errors and resubmit

#### Scenario: Table component displays data
- **WHEN** developer uses `Table` component to display processes
- **THEN** data is rendered in accessible table markup
- **AND** table supports sorting (optional)
- **AND** table supports pagination (optional)
- **AND** table is responsive on mobile devices

#### Scenario: Dialog component shows modals
- **WHEN** user triggers action requiring confirmation
- **THEN** Dialog/AlertDialog component opens
- **AND** modal is centered with backdrop
- **AND** modal traps focus (accessibility)
- **AND** modal closes on Esc key or backdrop click
- **AND** modal returns focus to trigger element on close

---

### Requirement: Landing Page and Dashboard Layout

The system SHALL provide a landing page and basic dashboard layout with navigation, header, and content areas.

#### Scenario: Landing page renders
- **WHEN** user navigates to `/`
- **THEN** landing page displays hero section
- **AND** navigation links to dashboard are visible
- **AND** page is styled with Tailwind + Shadcn
- **AND** page is responsive on all screen sizes

#### Scenario: Dashboard layout renders
- **WHEN** user navigates to `/dashboard`
- **THEN** dashboard layout displays sidebar
- **AND** header shows user info placeholder
- **AND** main content area is responsive
- **AND** navigation links are functional

#### Scenario: Sidebar navigation works
- **WHEN** user clicks sidebar link
- **THEN** route changes to corresponding page
- **AND** sidebar highlights active route
- **AND** page transition is smooth
- **AND** sidebar collapses on mobile

---

### Requirement: PJE Login Form UI

The system SHALL provide a login form for PJE credentials that calls the backend login Server Action and displays results.

#### Scenario: Login form renders
- **WHEN** user navigates to `/pje/login`
- **THEN** form displays CPF input field
- **AND** form displays password input field
- **AND** form displays submit button
- **AND** form uses Shadcn Form components

#### Scenario: Login form validates input
- **WHEN** user enters invalid CPF format
- **THEN** inline validation error is shown
- **AND** submit button is disabled
- **AND** error message is descriptive

#### Scenario: Login form submits successfully
- **WHEN** user submits form with valid credentials
- **THEN** loading spinner is shown on button
- **AND** Server Action is invoked
- **AND** success message is displayed on success
- **AND** user is redirected or shown next steps

#### Scenario: Login form handles errors
- **WHEN** Server Action returns error (e.g., wrong password)
- **THEN** error message is displayed to user
- **AND** loading state is cleared
- **AND** form remains editable for retry
- **AND** error is styled with Shadcn destructive variant

---

### Requirement: Build System Integration

The system SHALL integrate Next.js build process with existing backend build process to produce a complete application bundle.

#### Scenario: Production build succeeds
- **WHEN** developer runs `npm run build`
- **THEN** Next.js frontend is built to `.next/`
- **AND** backend TypeScript is compiled to `server/build/`
- **AND** both builds complete without errors
- **AND** build artifacts are ready for deployment

#### Scenario: Production server starts
- **WHEN** developer runs `npm start` after build
- **THEN** Next.js server starts in production mode
- **AND** backend server is available (if needed)
- **AND** frontend serves optimized bundles
- **AND** server-side rendering works correctly

#### Scenario: Bundle size is optimized
- **WHEN** production build completes
- **THEN** Next.js reports bundle size
- **AND** initial page load is under 200KB (gzipped)
- **AND** code splitting is applied automatically
- **AND** only used Shadcn components are included

---

### Requirement: Backwards Compatibility

The system SHALL maintain backwards compatibility with existing CLI scripts and file output paths after frontend integration.

#### Scenario: CLI scripts work unchanged
- **WHEN** developer runs `node server/scripts/pje/login.js`
- **THEN** script executes as before restructuring
- **AND** output files are saved to `data/pje/`
- **AND** no new dependencies are required for CLI usage
- **AND** environment variables work as before

#### Scenario: Data output paths are preserved
- **WHEN** backend script saves process data
- **THEN** JSON files are saved to `data/pje/processos/`
- **AND** screenshots are saved to `data/pje/screenshots/`
- **AND** file naming conventions are unchanged
- **AND** frontend can read these files

---

### Requirement: Error Handling and User Feedback

The system SHALL provide consistent error handling across frontend and backend with user-friendly error messages.

#### Scenario: Server Action error is caught
- **WHEN** Server Action throws error (e.g., Puppeteer crash)
- **THEN** error is caught and logged on server
- **AND** sanitized error message is returned to client
- **AND** user sees friendly error (not stack trace)
- **AND** developer can debug with server logs

#### Scenario: Network error is handled
- **WHEN** client loses connection during Server Action
- **THEN** user sees "Connection lost" message
- **AND** user can retry action
- **AND** no data is corrupted

#### Scenario: Loading states are shown
- **WHEN** long-running operation is in progress
- **THEN** loading spinner or skeleton is displayed
- **AND** user cannot submit duplicate requests
- **AND** user can cancel operation (optional)

---

### Requirement: Security Best Practices

The system SHALL follow Next.js and React security best practices to protect user data and prevent common vulnerabilities.

#### Scenario: Credentials never reach client
- **WHEN** PJE credentials are used
- **THEN** credentials remain on server-side only
- **AND** credentials are never sent in client bundle
- **AND** credentials are not logged in browser console

#### Scenario: Input is validated on server
- **WHEN** user input is sent to Server Action
- **THEN** input is validated with Zod schema
- **AND** malicious input is rejected
- **AND** SQL injection is prevented (if DB is used)
- **AND** XSS attacks are prevented (React escapes by default)

#### Scenario: CSRF protection is enabled
- **WHEN** Server Action is invoked
- **THEN** Next.js CSRF token is validated
- **AND** requests from other origins are rejected
- **AND** same-site cookies are used

#### Scenario: Environment variables are secure
- **WHEN** application is deployed
- **THEN** `.env` files are not committed to Git
- **AND** production secrets are managed securely
- **AND** example `.env.example` is provided
