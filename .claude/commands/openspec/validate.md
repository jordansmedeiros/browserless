## Command

`openspec validate add-sidebar-16-layout --strict`

## Purpose

Validate the change proposal structure, ensuring:
- All required files exist (proposal.md, tasks.md, specs/)
- Delta files have proper format (## ADDED/MODIFIED/REMOVED Requirements)
- All requirements have at least one scenario with `#### Scenario:` format
- No parsing errors or structural issues

## Expected output

- Success message indicating the change passes all validation checks
- If errors occur, detailed error messages with file locations and specific issues

## Troubleshooting

- If "Change must have at least one delta" error: Verify `specs/dashboard-layout/spec.md` exists and has operation headers
- If "Requirement must have at least one scenario" error: Check that scenarios use `#### Scenario:` format (4 hashtags)
- Use `openspec show add-sidebar-16-layout --json --deltas-only` to debug delta parsing

## Next step

If validation passes, proceed to archiving. If validation fails, fix the reported issues and re-validate.
