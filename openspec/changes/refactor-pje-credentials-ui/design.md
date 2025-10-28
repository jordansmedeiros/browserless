# Design Document: Refactor PJE Credentials UI

## Context

The credentials management page currently implements a three-tier navigation pattern:
1. User selects a law firm → new card appears showing lawyers
2. User selects a lawyer → new card appears showing credentials
3. User interacts with credentials (activate, deactivate, delete, test)

This creates:
- Visual clutter (3+ cards stacked vertically)
- Cognitive load (tracking which cards correspond to which selections)
- Limited editing capability (can only delete, not edit)
- Confusing "solo lawyer" vs "law firm" distinction

## Goals

- Simplify UI to single collapsible accordion + modal pattern
- Consolidate all editing into one modal interface
- Remove artificial distinction between solo lawyers and law firms
- Maintain all existing functionality (create, read, update, delete, test)
- Improve discoverability of password visibility toggle

## Non-Goals

- Changing the underlying credential validation logic
- Modifying tribunal selector behavior
- Altering the Prisma schema structure (beyond making escritorioId required)
- Adding bulk operations (e.g., bulk edit, bulk delete)

## Decisions

### Decision 1: Accordion + Modal Pattern

**Rationale:**
- Accordion keeps all law firms visible at once (better overview)
- Expanding a firm shows lawyers in-line (no new cards)
- Modal provides focused editing environment without losing context
- Familiar pattern from other admin UIs (e.g., user management dashboards)

**Alternatives Considered:**
- **Tabs**: Rejected because number of firms can be large (dozens)
- **Nested routing** (`/credentials/[escritorio]/[advogado]`): Rejected because adds unnecessary URL complexity for a single-page CRUD interface
- **Side panel**: Rejected because limited width makes tribunal selector cramped

**Implementation:**
- Use `components/ui/accordion.tsx` (shadcn/ui) for collapsible firms
- Use `components/ui/dialog.tsx` (shadcn/ui) for edit modal
- Modal contains tabs for: Lawyer Info | Credentials

### Decision 2: Unify Solo Lawyers with Law Firms

**Rationale:**
- Solo lawyer is functionally identical to a single-person firm
- Reduces code paths (no special handling for NULL escritorioId)
- Simplifies UI (no "Solo Lawyers" section)
- Makes data model more consistent

**Alternatives Considered:**
- **Keep nullable escritorioId**: Rejected because it complicates queries and UI rendering
- **Use a special "Solo" flag**: Rejected because it's redundant (can check if firm has 1 lawyer)

**Implementation:**
- Migration script creates `Escritorio` for each solo `Advogado`
- Schema change: `escritorioId String` (remove `?` nullable marker)
- UI: "Add Lawyer" button always prompts for law firm name (defaults to lawyer name)

### Decision 3: Modal Structure with Nested Forms

**Rationale:**
- Lawyer info (name, OAB, CPF) is edited infrequently
- Credentials are edited more often (add/remove tribunals, change password)
- Separate forms reduce accidental edits

**Alternatives Considered:**
- **Single flat form**: Rejected because mixing lawyer + credentials creates validation confusion
- **Separate modals**: Rejected because requires closing and re-opening to switch between lawyer and credentials

**Implementation:**
- Modal has two tabs: "Lawyer Info" and "Credentials"
- "Lawyer Info" tab includes editable law firm name (for solo lawyers)
- "Credentials" tab lists all credentials with inline edit/delete/test actions
- Each credential row has "Edit" button opening nested form for password/tribunals

### Decision 4: Password Visibility Toggle Preservation

**Rationale:**
- User feedback indicated password visibility is essential
- Newly added eye icon feature (from previous session) is valuable
- Modal should maintain this capability

**Implementation:**
- Keep existing `visiblePasswords` state management
- Eye icon appears in credential list within modal
- Same `Eye`/`EyeOff` Lucide icons

## Risks / Trade-offs

### Risk: Migration Complexity
**Issue:** Existing solo lawyers need `Escritorio` records created

**Mitigation:**
- Write migration script that runs before schema change
- Script logs all created escritórios for audit trail
- Include rollback logic (delete auto-created escritórios)
- Test on development database first

### Risk: User Confusion (Law Firm Name = Lawyer Name)
**Issue:** Solo lawyers see their name duplicated (firm name = lawyer name)

**Mitigation:**
- UI hint: "(Solo)" badge next to single-lawyer firms
- Tooltip explaining: "This is a solo practice"
- Allow editing firm name to differentiate if desired

### Risk: Modal Overload
**Issue:** Modal contains many actions (edit lawyer, edit credentials, test, delete)

**Mitigation:**
- Use tabs to separate concerns (Lawyer Info vs Credentials)
- Scrollable credential list if >5 credentials
- Confirmation dialogs for destructive actions (delete)

### Risk: Loss of Visual Hierarchy
**Issue:** Current card stacking shows selection path (Firm > Lawyer > Credential)

**Mitigation:**
- Breadcrumb in modal header: "Pedro Silva > Credenciais"
- Accordion keeps selected firm highlighted
- Modal overlay dims background, maintaining focus

## Migration Plan

### Phase 1: Data Migration (Pre-Deploy)
1. Identify all `Advogado` records with `escritorioId = NULL`
2. For each, create `Escritorio` with `nome = advogado.nome`
3. Update `Advogado.escritorioId` to reference new firm
4. Log migration results (number of firms created, advogado IDs affected)

### Phase 2: Schema Update
1. Run Prisma migration making `escritorioId` required
2. Generate new Prisma client
3. Update TypeScript types (remove `escritorioId: string | null`)

### Phase 3: UI Refactor
1. Replace card-based navigation with Accordion
2. Implement lawyer detail modal with tabs
3. Move credential editing into modal
4. Remove "Solo Lawyer" section and related code

### Phase 4: Testing
1. Test migration script on copy of production database
2. Verify all lawyers have escritórios
3. Test UI with migrated data
4. Validate edit/delete/test actions work in new modal

### Rollback Strategy
If critical bugs discovered post-deployment:
1. Revert Prisma schema to make `escritorioId` nullable
2. Revert UI to previous card-based version
3. Auto-created escritórios remain (no data loss)
4. Investigate and fix bugs, then re-deploy

## Open Questions

1. **Should we allow bulk-editing credentials?**
   - Example: Change password for all credentials of a lawyer at once
   - **Decision:** No - out of scope for this change, can be added later

2. **Should law firm editing be inline or in the modal?**
   - Inline: Click pencil icon next to firm name in accordion
   - Modal: Edit firm name in "Lawyer Info" tab
   - **Decision:** Modal - keeps editing consolidated, avoids accidental clicks

3. **How to handle credential testing in the modal?**
   - Option 1: Test button in credential list (current behavior)
   - Option 2: Batch test all credentials for a lawyer
   - **Decision:** Keep per-credential test button (more granular control)

4. **Should we add a "Convert to Multi-Lawyer Firm" action?**
   - Allows adding second lawyer to a solo practice
   - **Decision:** Not needed - just "Add Lawyer" to the existing firm

## References

- Current implementation: `app/(dashboard)/pje/credentials/page.tsx`
- Accordion component: `components/ui/accordion.tsx`
- Dialog component: `components/ui/dialog.tsx`
- Prisma schema: `prisma/schema.prisma` (Advogado, Escritorio models)
