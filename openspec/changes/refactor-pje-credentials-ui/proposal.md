# Change Proposal: refactor-pje-credentials-ui

## Why

The current credentials management UI (`/pje/credentials`) has a confusing multi-step navigation flow where users must click through three separate sections (Escritórios → Advogados → Credenciais), with each click creating a new card below the previous one. This creates visual clutter and makes it difficult to quickly view and manage credentials.

Additionally, the current system distinguishes between "law firms" (escritórios) and "solo lawyers" (advogados autônomos), which adds unnecessary complexity since solo lawyers are functionally equivalent to single-person law firms.

## What Changes

**Simplified Data Model:**
- Remove the distinction between law firms and solo lawyers
- All lawyers MUST belong to a law firm (escritório)
- For solo lawyers, automatically create a law firm with the same name as the lawyer
- Remove NULL `escritorioId` support - all `Advogado` records must reference an `Escritorio`

**Redesigned UI Flow:**
- Single-level accordion/collapsible interface showing all law firms
- Clicking a law firm expands to show its lawyers in-line (no new card)
- Clicking a lawyer opens a modal/dialog with full credential details and edit capabilities
- Modal allows editing: lawyer information, law firm name, and all credentials

**New Editing Capabilities:**
- Edit law firm name directly from the modal
- Edit lawyer information (name, OAB, CPF) from the modal
- Edit credential details (password, description, tribunals) from the modal
- All editing happens in a single consolidated interface

**Visual Improvements:**
- Replace cascading cards with collapsible accordion (cleaner, more compact)
- Use modal/popover pattern for detailed editing (focused interaction)
- Maintain password visibility toggle (eye icon) from previous improvements

## Impact

**Affected Specs:**
- `pje-credentials` - Major modifications to UI requirements and data model constraints

**Affected Code:**
- `app/(dashboard)/pje/credentials/page.tsx` - Complete UI refactor
- `app/actions/pje.ts` - Update CRUD actions to enforce escritório requirement
- `prisma/schema.prisma` - Change `escritorioId` from nullable to required
- Database migration - Ensure all existing solo lawyers have escritórios created

**Breaking Changes:**
- **BREAKING**: `Advogado.escritorioId` becomes required (previously nullable)
- **BREAKING**: UI no longer supports creating solo lawyers without a law firm
- **BREAKING**: Existing solo lawyers (`escritorioId = NULL`) must be migrated

## Migration Strategy

1. Create migration script to identify all `Advogado` records with NULL `escritorioId`
2. For each solo lawyer, create an `Escritorio` with `nome = advogado.nome`
3. Update the `Advogado` record to reference the newly created `Escritorio`
4. Apply Prisma schema change to make `escritorioId` required
5. Update UI to remove "Solo Lawyer" section and "Add Solo Lawyer" button

## Success Criteria

1. **Data Integrity**: All lawyers have an associated law firm (no NULL escritorioId)
2. **UI Simplicity**: Single accordion interface without cascading cards
3. **Edit Capability**: Users can edit law firms, lawyers, and credentials from one modal
4. **Visual Clarity**: Password visibility toggle works in the new modal interface
5. **No Regressions**: Existing credentials continue to work without re-entry

## Dependencies

- Builds on existing `pje-credentials` spec
- Requires completed `add-tj-trf-superior-tribunals` change (for tribunal selector)
- Compatible with `reduce-ui-density` visual scaling change
