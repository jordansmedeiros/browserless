# Implementation Tasks

## 1. Project Setup and Dependencies

- [ ] 1.1 Install Next.js 15 and core dependencies
  - [ ] 1.1.1 Run `npx create-next-app@latest --typescript --tailwind --app --no-src-dir` in temp folder
  - [ ] 1.1.2 Copy generated config files to project root
  - [ ] 1.1.3 Add Next.js dependencies to package.json
  - [ ] 1.1.4 Update `package.json` scripts for Next.js
- [ ] 1.2 Install Shadcn/ui and UI dependencies
  - [ ] 1.2.1 Run `npx shadcn@latest init` and configure with defaults
  - [ ] 1.2.2 Install Radix UI primitives
  - [ ] 1.2.3 Configure Tailwind CSS with Shadcn theme
  - [ ] 1.2.4 Add base Shadcn components: Button, Card, Table, Dialog, Form, Input
- [ ] 1.3 Install additional dependencies
  - [ ] 1.3.1 Add `zustand` for state management
  - [ ] 1.3.2 Add `zod` for validation
  - [ ] 1.3.3 Add `date-fns` or `dayjs` for date handling
  - [ ] 1.3.4 Add `lucide-react` for icons

## 2. Project Restructuring

- [ ] 2.1 Create new directory structure
  - [ ] 2.1.1 Create `server/` directory at root
  - [ ] 2.1.2 Create `lib/` directory for shared code
  - [ ] 2.1.3 Create `components/` directory for React components
  - [ ] 2.1.4 Create `app/` directory for Next.js App Router
- [ ] 2.2 Move Browserless code to `server/`
  - [ ] 2.2.1 Move `src/` → `server/src/`
  - [ ] 2.2.2 Move `build/` → `server/build/`
  - [ ] 2.2.3 Move `scripts/` → `server/scripts/`
  - [ ] 2.2.4 Move `external/` → `server/external/`
  - [ ] 2.2.5 Move `functions/` → `server/functions/`
  - [ ] 2.2.6 Copy `tsconfig.json` → `server/tsconfig.json` and adjust paths
- [ ] 2.3 Update import paths
  - [ ] 2.3.1 Update all imports in `server/src/` to reflect new structure
  - [ ] 2.3.2 Update `server/tsconfig.json` paths and outDir
  - [ ] 2.3.3 Update references in `server/scripts/` if needed
- [ ] 2.4 Create shared types library
  - [ ] 2.4.1 Create `lib/types/pje.ts` with PJE domain types
  - [ ] 2.4.2 Create `lib/types/api.ts` with API request/response types
  - [ ] 2.4.3 Export types from `lib/types/index.ts`

## 3. TypeScript Configuration

- [ ] 3.1 Configure root `tsconfig.json`
  - [ ] 3.1.1 Create root config extending Next.js defaults
  - [ ] 3.1.2 Add path aliases: `@/*`, `@/server/*`, `@/lib/*`, `@/components/*`
  - [ ] 3.1.3 Set strict mode and ES2022 target
- [ ] 3.2 Configure `server/tsconfig.json`
  - [ ] 3.2.1 Extend root config
  - [ ] 3.2.2 Set `outDir: "./build"`
  - [ ] 3.2.3 Set `rootDir: "./src"`
  - [ ] 3.2.4 Include server-specific paths
- [ ] 3.3 Validate TypeScript setup
  - [ ] 3.3.1 Run `tsc --noEmit` on root
  - [ ] 3.3.2 Run `tsc --noEmit` on server
  - [ ] 3.3.3 Fix any compilation errors

## 4. Next.js App Structure

- [ ] 4.1 Create App Router structure
  - [ ] 4.1.1 Create `app/layout.tsx` with root layout
  - [ ] 4.1.2 Create `app/page.tsx` with landing page
  - [ ] 4.1.3 Create `app/globals.css` with Tailwind imports
  - [ ] 4.1.4 Create `app/(dashboard)/layout.tsx` for dashboard route group
- [ ] 4.2 Configure Next.js
  - [ ] 4.2.1 Create/update `next.config.mjs` with custom server port
  - [ ] 4.2.2 Configure output directory if needed
  - [ ] 4.2.3 Add environment variable handling
  - [ ] 4.2.4 Configure experimental features if needed (serverActions, etc.)
- [ ] 4.3 Create base components
  - [ ] 4.3.1 Create `components/ui/` for Shadcn components
  - [ ] 4.3.2 Create `components/layout/header.tsx`
  - [ ] 4.3.3 Create `components/layout/sidebar.tsx`
  - [ ] 4.3.4 Create `components/layout/footer.tsx`
- [ ] 4.4 Setup theme provider
  - [ ] 4.4.1 Create `components/theme-provider.tsx` for dark/light mode
  - [ ] 4.4.2 Integrate with Shadcn theme system
  - [ ] 4.4.3 Add theme toggle component

## 5. Backend API Integration

- [ ] 5.1 Create API utilities
  - [ ] 5.1.1 Create `lib/api/pje-client.ts` to wrap PJE scripts
  - [ ] 5.1.2 Create `lib/api/error-handler.ts` for standardized errors
  - [ ] 5.1.3 Create `lib/api/response.ts` for API response types
- [ ] 5.2 Create Server Actions
  - [ ] 5.2.1 Create `app/actions/pje-login.ts` for PJE login
  - [ ] 5.2.2 Create `app/actions/pje-scrape.ts` for scraping
  - [ ] 5.2.3 Add proper error handling and validation
  - [ ] 5.2.4 Add TypeScript return types
- [ ] 5.3 Create API Routes (optional, for external access)
  - [ ] 5.3.1 Create `app/api/pje/login/route.ts`
  - [ ] 5.3.2 Create `app/api/pje/processos/route.ts`
  - [ ] 5.3.3 Add rate limiting middleware
  - [ ] 5.3.4 Add request validation with Zod
- [ ] 5.4 Adapt PJE scripts for API usage
  - [ ] 5.4.1 Refactor `server/scripts/pje/login.js` to export function
  - [ ] 5.4.2 Refactor `server/scripts/pje/raspar-processos.js` to export function
  - [ ] 5.4.3 Ensure scripts can be called programmatically
  - [ ] 5.4.4 Maintain CLI compatibility

## 6. Environment Configuration

- [ ] 6.1 Update environment variables
  - [ ] 6.1.1 Create `.env.example` with all required variables
  - [ ] 6.1.2 Add `NEXT_PUBLIC_*` variables for client-side config
  - [ ] 6.1.3 Document which variables are client vs server
  - [ ] 6.1.4 Update `.gitignore` to exclude `.env.local`
- [ ] 6.2 Create environment validation
  - [ ] 6.2.1 Create `lib/env.ts` with Zod schema for env vars
  - [ ] 6.2.2 Validate env on app startup
  - [ ] 6.2.3 Provide helpful error messages for missing vars

## 7. Build System Updates

- [ ] 7.1 Update npm scripts
  - [ ] 7.1.1 Update `build` script to build both Next.js and server
  - [ ] 7.1.2 Update `dev` script to run Next.js dev + backend (concurrently)
  - [ ] 7.1.3 Create `build:server` script for backend only
  - [ ] 7.1.4 Create `build:next` script for frontend only
  - [ ] 7.1.5 Update `start` script to run production builds
- [ ] 7.2 Install development utilities
  - [ ] 7.2.1 Install `concurrently` for running multiple dev servers
  - [ ] 7.2.2 Install `cross-env` if not already present
  - [ ] 7.2.3 Configure development ports (Next.js: 3000, Backend: 3001)
- [ ] 7.3 Update linting and formatting
  - [ ] 7.3.1 Update ESLint config to support Next.js
  - [ ] 7.3.2 Add `eslint-config-next`
  - [ ] 7.3.3 Update Prettier config if needed
  - [ ] 7.3.4 Run `npm run lint` and fix issues

## 8. Initial UI Implementation

- [ ] 8.1 Create landing page
  - [ ] 8.1.1 Design simple hero section
  - [ ] 8.1.2 Add navigation to dashboard
  - [ ] 8.1.3 Style with Tailwind + Shadcn components
- [ ] 8.2 Create dashboard layout
  - [ ] 8.2.1 Create `app/(dashboard)/dashboard/page.tsx`
  - [ ] 8.2.2 Add sidebar with navigation links
  - [ ] 8.2.3 Add header with user info placeholder
  - [ ] 8.2.4 Add loading skeleton states
- [ ] 8.3 Create PJE login form
  - [ ] 8.3.1 Create `app/(dashboard)/pje/login/page.tsx`
  - [ ] 8.3.2 Build form with Shadcn Form + Input components
  - [ ] 8.3.3 Add CPF input with mask
  - [ ] 8.3.4 Add password input with toggle visibility
  - [ ] 8.3.5 Connect form to Server Action
  - [ ] 8.3.6 Add loading and success/error states
- [ ] 8.4 Create placeholder pages
  - [ ] 8.4.1 Create `app/(dashboard)/pje/processos/page.tsx`
  - [ ] 8.4.2 Create `app/(dashboard)/pje/scrape/page.tsx`
  - [ ] 8.4.3 Add "Coming Soon" placeholders with Shadcn Card

## 9. Testing and Validation

- [ ] 9.1 Test development environment
  - [ ] 9.1.1 Run `npm run dev` and verify both servers start
  - [ ] 9.1.2 Test hot reload on frontend changes
  - [ ] 9.1.3 Test hot reload on backend changes (if configured)
  - [ ] 9.1.4 Verify no TypeScript errors in console
- [ ] 9.2 Test API integration
  - [ ] 9.2.1 Test PJE login Server Action from UI
  - [ ] 9.2.2 Verify credentials are not exposed to client
  - [ ] 9.2.3 Test error handling (wrong credentials)
  - [ ] 9.2.4 Verify server logs are working
- [ ] 9.3 Test CLI compatibility
  - [ ] 9.3.1 Test `node server/scripts/pje/login.js` still works
  - [ ] 9.3.2 Test other PJE scripts independently
  - [ ] 9.3.3 Verify data output paths are correct
- [ ] 9.4 Test production build
  - [ ] 9.4.1 Run `npm run build` and verify no errors
  - [ ] 9.4.2 Run `npm start` and test app in production mode
  - [ ] 9.4.3 Verify bundle size is reasonable
  - [ ] 9.4.4 Check for console errors/warnings

## 10. Documentation

- [ ] 10.1 Update README files
  - [ ] 10.1.1 Update main `README.md` with new architecture
  - [ ] 10.1.2 Document how to run development environment
  - [ ] 10.1.3 Document build and deployment process
  - [ ] 10.1.4 Add screenshots of UI (when available)
- [ ] 10.2 Create developer documentation
  - [ ] 10.2.1 Create `docs/ARCHITECTURE.md` explaining new structure
  - [ ] 10.2.2 Create `docs/API.md` documenting Server Actions/API Routes
  - [ ] 10.2.3 Create `docs/CONTRIBUTING.md` for new contributors
- [ ] 10.3 Update code comments
  - [ ] 10.3.1 Add JSDoc comments to Server Actions
  - [ ] 10.3.2 Add comments to complex configuration files
  - [ ] 10.3.3 Document component props with TypeScript

## 11. Cleanup and Finalization

- [ ] 11.1 Remove unused files
  - [ ] 11.1.1 Remove old build artifacts from root
  - [ ] 11.1.2 Clean up temporary files from setup
  - [ ] 11.1.3 Remove unused dependencies
- [ ] 11.2 Final code review
  - [ ] 11.2.1 Run `npm run lint` and fix all issues
  - [ ] 11.2.2 Run `npm run prettier` to format all files
  - [ ] 11.2.3 Check for console.log statements to remove
  - [ ] 11.2.4 Verify no sensitive data is committed
- [ ] 11.3 Prepare for merge
  - [ ] 11.3.1 Create feature branch if not already
  - [ ] 11.3.2 Commit changes with conventional commit messages
  - [ ] 11.3.3 Test full flow one more time
  - [ ] 11.3.4 Request code review

## Notes

- **Estimated Time**: 3-5 days for complete implementation
- **Blockers**: None identified
- **Dependencies**: Node.js v24, npm
- **Testing Strategy**: Manual testing initially, E2E tests in future phase
- **Rollback Plan**: Keep original structure in separate branch for first week
