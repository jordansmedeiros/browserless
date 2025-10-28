# Implementation Tasks: refactor-pje-credentials-ui

## 1. Data Migration & Schema Changes

- [ ] 1.1 Create migration script `scripts/migrate-solo-lawyers-to-firms.ts`
  - Queries all `Advogado` with `escritorioId = NULL`
  - For each, creates `Escritorio` with `nome = advogado.nome`
  - Updates `Advogado.escritorioId` to reference new firm
  - Logs migration summary (count, affected IDs)

- [ ] 1.2 Test migration script on development database
  - Run script against local database
  - Verify all solo lawyers now have escritórios
  - Check audit log output

- [ ] 1.3 Update Prisma schema to make escritorioId required
  - Change `prisma/schema.prisma`: `escritorioId String` (remove `?`)
  - Create Prisma migration
  - Run `npx prisma generate` to update types

- [ ] 1.4 Update server actions to enforce escritório requirement
  - Modify `createAdvogadoAction` in `app/actions/pje.ts`
  - Ensure `escritorioId` is always provided (not nullable)
  - Update Zod schema validation

## 2. UI Component Refactoring

- [ ] 2.1 Create lawyer detail modal component
  - New file: `components/pje/lawyer-detail-modal.tsx`
  - Props: `lawyerId`, `onClose`, `onUpdate`
  - Contains tabs for "Lawyer Info" and "Credentials"
  - Use `components/ui/dialog.tsx` and `components/ui/tabs.tsx`

- [ ] 2.2 Implement "Lawyer Info" tab
  - Form fields: name, OAB number, OAB state, CPF
  - Editable law firm name field (updates Escritorio.nome)
  - Save button calls `updateAdvogadoAction` and `updateEscritorioAction`
  - Validation with Zod schema

- [ ] 2.3 Implement "Credentials" tab
  - List all credentials for the selected lawyer
  - Each credential shows: description, password (with eye toggle), tribunals, status
  - Actions: Edit, Delete, Test (one-time password), Activate/Deactivate
  - "Add Credential" button opens nested form

- [ ] 2.4 Create credential edit form component
  - Nested component within "Credentials" tab
  - Fields: password, description, tribunal selector
  - Reuse `TribunalSelector` component
  - Save button calls `updateCredencialAction`

- [ ] 2.5 Refactor credentials page to use Accordion
  - Replace card-based layout with `Accordion` component
  - `AccordionItem` per law firm (escritório)
  - `AccordionContent` shows list of lawyers in that firm
  - Clicking lawyer opens `LawyerDetailModal`

- [ ] 2.6 Remove "Solo Lawyers" section
  - Delete code rendering solo lawyers separately
  - Remove "Add Solo Lawyer" button
  - Update "Add Lawyer" button to always require escritório selection

- [ ] 2.7 Add visual indicators for single-lawyer firms
  - Badge showing "(Solo)" next to firm name if `escritorio.advogados.length === 1`
  - Tooltip explaining "This is a solo practice"

## 3. Server Action Updates

- [ ] 3.1 Create `updateEscritorioAction` in `app/actions/pje.ts`
  - Input: `{ id: string, nome: string }`
  - Updates `Escritorio` record
  - Returns success/error response

- [ ] 3.2 Create `updateAdvogadoAction` in `app/actions/pje.ts`
  - Input: `{ id: string, nome, oabNumero, oabUf, cpf }`
  - Updates `Advogado` record
  - Preserves `idAdvogado` (auto-detected value)
  - Returns success/error response

- [ ] 3.3 Create `updateCredencialAction` in `app/actions/pje.ts`
  - Input: `{ id: string, senha, descricao, tribunalConfigIds }`
  - Updates `Credencial` record
  - Updates `CredencialTribunal` associations (delete old, create new)
  - If password changed, resets `validadoEm` timestamps
  - Returns success/error response

- [ ] 3.4 Update `createAdvogadoAction` validation
  - Ensure `escritorioId` is always required (not nullable)
  - Update Zod schema: `escritorioId: z.string().uuid()`

## 4. Testing & Validation

- [ ] 4.1 Test migration script rollback
  - Create rollback script to delete auto-created escritórios
  - Test on development database
  - Verify data integrity after rollback

- [ ] 4.2 Test UI with migrated data
  - Verify all lawyers appear under their law firms
  - Test expanding/collapsing accordion items
  - Verify modal opens correctly when clicking a lawyer

- [ ] 4.3 Test editing functionality
  - Edit lawyer name, OAB, CPF
  - Edit law firm name (for solo lawyers)
  - Edit credential password and tribunals
  - Verify database updates correctly

- [ ] 4.4 Test credential operations in modal
  - Add new credential via modal
  - Delete credential from modal
  - Test credential (one-time password)
  - Toggle credential active/inactive status

- [ ] 4.5 Test password visibility toggle in modal
  - Click eye icon to reveal password
  - Click again to hide password
  - Verify toggle works for all credentials

- [ ] 4.6 Test with edge cases
  - Law firm with 0 lawyers (should not appear)
  - Law firm with 1 lawyer (solo practice badge)
  - Law firm with 10+ lawyers (scrollable list)
  - Lawyer with 0 credentials
  - Lawyer with 10+ credentials (scrollable in modal)

## 5. Documentation & Cleanup

- [ ] 5.1 Update code comments
  - Document modal component structure
  - Explain escritório requirement in schema comments
  - Add JSDoc for new server actions

- [ ] 5.2 Remove dead code
  - Delete "Solo Lawyer" rendering logic
  - Remove unused state variables (e.g., `selectedEscritorio` cascading logic)
  - Clean up commented-out code

- [ ] 5.3 Update type definitions
  - Remove `escritorioId: string | null` from types
  - Update `AdvogadoWithCredenciais` type if needed
  - Ensure Prisma-generated types are up-to-date

- [ ] 5.4 Final validation with strict mode
  - Run `openspec validate refactor-pje-credentials-ui --strict`
  - Resolve any remaining issues
  - Ensure all scenarios have proper formatting
