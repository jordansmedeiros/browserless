# Add PJE Credentials Management System

## Why

Currently, the dashboard has an interactive login page (`app/(dashboard)/pje/login/page.tsx`) that allows users to manually authenticate into PJE. However, this approach is fundamentally flawed because:

1. **Scripts already handle login**: Each automation script (scraping, process retrieval) performs its own login when executed
2. **No persistent session**: There's no way to maintain an authenticated session across different TRTs - each TRT requires separate authentication
3. **No credential storage**: User credentials are not stored, requiring manual input every time
4. **Environment variables don't scale**: Currently, credentials are in `.env` files, which doesn't support:
   - Multiple law firms or solo lawyers in the same system
   - Multiple lawyers per firm (each with their own OAB and processes)
   - Different passwords per tribunal/degree (lawyer may use different passwords for TRT3-1g vs TRT3-2g)
   - Multiple types of tribunals (TRT, TJ, TRF)

The solution is to **remove the interactive login page** and **create a credentials management system** where users can:
- Register law firms (escritórios) or solo lawyers
- Register lawyers with their professional information (name, OAB, CPF)
- Store multiple passwords per lawyer (since same CPF may have different passwords per tribunal/degree)
- Associate each password with one or more tribunals where it works
- Automatically detect and store the lawyer ID (`idAdvogado`) from PJE during first use
- Validate credentials by running actual login scripts per tribunal type

This enables scripts to automatically select the correct credentials for each tribunal, supporting multiple law firms with multiple lawyers and different access patterns across Brazil's court system.

## What Changes

- **BREAKING**: Remove interactive login page at `app/(dashboard)/pje/login/page.tsx`
- **BREAKING**: Remove `loginPJEAction` from `app/actions/pje.ts` (repurposed for credential testing)
- **BREAKING**: Environment variables (`PJE_CPF`, `PJE_PASSWORD`) are no longer used - database only
- Create new database models:
  - `Escritorio` - Stores law firm information (optional - NULL for solo lawyers)
  - `Advogado` - Stores lawyer information (name, OAB number, CPF, idAdvogado)
  - `Credencial` - Stores passwords (one password can work for multiple tribunals)
  - `CredencialTribunal` - Junction table associating credentials with tribunals
- Create new page: `app/(dashboard)/pje/credentials/page.tsx` for credentials management
- Add CRUD operations for law firms, lawyers, and credentials via server actions
- Update automation scripts to query credentials from database
- Implement automatic `idAdvogado` detection and storage on first successful login
- Add credential validation using tribunal-specific login scripts (login-trt.js, login-tj.js, login-trf.js)

**No Migration Path Needed**:
- System is in development, no production data to migrate
- Environment variables will be completely removed

## Impact

### Affected Specs
- `pje-credentials` (NEW) - Credentials and lawyer management capability

### Affected Code
- **Removed**:
  - `app/(dashboard)/pje/login/page.tsx` - Interactive login page
  - `loginPJEAction` in `app/actions/pje.ts` - Repurposed for credential testing
  - Environment variable usage for `PJE_CPF` and `PJE_PASSWORD`

- **Modified**:
  - `prisma/schema.prisma` - Add Escritorio, Advogado, Credencial, CredencialTribunal models
  - `lib/api/pje-adapter.ts` - Query credentials from database
  - `app/actions/pje.ts` - Add credential management and testing actions
  - Automation scripts - Accept tribunal parameter and retrieve credentials from database

- **Created**:
  - `app/(dashboard)/pje/credentials/page.tsx` - Credentials management UI
  - `lib/types/credentials.ts` - TypeScript types for credentials
  - Database migration files
  - Credential testing integration with login scripts

### Dependencies
- Works alongside `add-trt-multi-tribunal-support` change (credentials reference Tribunal model)
- Requires Prisma schema extension
- Login scripts per tribunal type: login-trt.js, login-tj.js, login-trf.js

### Breaking Changes
- Users can no longer use the interactive login page
- Environment variables no longer supported - database is the single source of truth
- Automation scripts require database access to retrieve credentials
