## Command

`openspec archive add-sidebar-16-layout --yes`

## Purpose

Archive the completed change proposal by:
- Moving `openspec/changes/add-sidebar-16-layout/` to `openspec/changes/archive/2025-10-30-add-sidebar-16-layout/` (using current date)
- Updating `openspec/specs/dashboard-layout/` with the delta changes from the proposal
- Merging ADDED requirements into the spec, applying MODIFIED changes, removing REMOVED requirements
- Preserving the complete change history in the archive

## Flags explained

- `--yes` or `-y`: Skip confirmation prompts for non-interactive execution (required for automation)
- `--skip-specs`: Use this flag ONLY for tooling-only changes that don't affect capabilities (NOT applicable for this change)

## Expected outcome

- Directory `openspec/changes/add-sidebar-16-layout/` no longer exists
- New directory `openspec/changes/archive/2025-10-30-add-sidebar-16-layout/` contains all proposal files
- File `openspec/specs/dashboard-layout/spec.md` updated with the new requirements (if this spec exists; if not, it may be created)
- Success message confirming the archive operation

## Verification steps

- Check that `openspec/changes/add-sidebar-16-layout/` directory is gone
- Verify `openspec/changes/archive/2025-10-30-add-sidebar-16-layout/` exists with all files (proposal.md, tasks.md, specs/)
- Run `openspec list` to confirm the change no longer appears in active changes
- Run `openspec validate --strict` to ensure the archived change and updated specs pass validation

## Troubleshooting

- If archive fails with "Change not found": Verify the change-id is correct (must be exact: `add-sidebar-16-layout`)
- If spec merge fails: Check that delta files have proper format and matching requirement headers
- If validation fails after archive: Review the updated spec file for formatting issues

## Note

This is a documentation file to guide the archiving process. The actual command execution will be done by the user or CI/CD pipeline. According to OpenSpec workflow, archiving should be done in a separate PR after deployment.