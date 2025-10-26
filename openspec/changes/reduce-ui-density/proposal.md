# Change Proposal: reduce-ui-density

## Why

The current application has excessive visual density with default browser scaling (100%), making UI elements appear too large. Users need to manually adjust browser zoom to ~80% to achieve comfortable readability and information density. This indicates the base font-size and spacing scale need adjustment to provide a more compact, professional interface by default.

## What Changes

- Reduce base font-size from default 16px to 13.6px (85% scale)
- Adjust root HTML font-size to apply proportional scaling to all rem-based values
- Ensure all Tailwind CSS spacing and sizing automatically scale down
- Maintain relative proportions between all UI elements
- Preserve accessibility and readability at the new scale

## Impact

**User Experience Improvements:**
- More comfortable information density without requiring manual zoom adjustment
- Professional, less oversized appearance for all UI components
- More content visible on screen without scrolling
- Consistent visual scale across all pages and components

**Technical Changes:**
- Modify `app/globals.css` to set `:root { font-size: 80%; }`
- All rem-based values in Tailwind automatically scale proportionally
- No changes needed to individual component styles
- Affects all pages: landing page, scraping interface, credentials management

**Affected Specs:**
- Creates new `ui-design-system` capability
- Indirectly improves UX for `landing-page`, `pje-scraping`, `pje-credentials` specs

## Scope

This change introduces a foundational design system capability:

### UI Design System (`ui-design-system`)
- Define base font-size and scaling strategy
- Establish consistent visual density across application
- Provide foundation for future design system requirements

## Non-Goals

- Individual component size adjustments (handled automatically via rem scaling)
- Responsive breakpoint modifications (existing breakpoints remain valid)
- Font family or typography style changes
- Color scheme or theming modifications

## Dependencies

- Requires existing Tailwind CSS configuration
- Builds on Next.js app structure in `app/` directory
- Affects all components using rem-based sizing (shadcn/ui components)

## Success Criteria

1. **Visual Density**: Application appears at 85% scale without browser zoom adjustment
2. **Consistency**: All pages and components scale proportionally
3. **Readability**: Text remains readable and accessible at new scale
4. **No Regressions**: No layout breaks or overflow issues introduced

## Rollout Plan

1. Add base font-size adjustment to globals.css (low risk, single CSS rule)
2. Test all existing pages for visual correctness
3. Verify responsive behavior at different viewport sizes
4. Deploy and monitor user feedback

## Related Changes

- Foundation for future design system enhancements
- May inform future UI component modifications in other changes
