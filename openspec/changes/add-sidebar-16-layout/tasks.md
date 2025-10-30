# Implementation Tasks - Add Sidebar-16 Layout

## 1. Update AppSidebar Component
- [x] 1.1 Replace example navigation data in `components/app-sidebar.tsx` with real app navigation
  - [x] Update `navMain` items to include PJE features (Credenciais, Processos, Raspagens)
  - [x] Update icons to match app context (replace generic icons with relevant ones)
  - [x] Update URLs to point to actual dashboard routes
  - [x] Remove or repurpose `navProjects` section (or adapt for real use case)
- [x] 1.2 Update branding in sidebar header
  - [x] Replace "Acme Inc" with "JusBrowserless" or appropriate app name
  - [x] Replace "Enterprise" subtitle with "PJE Automation"
  - [x] Update icon from `Command` to `Gavel` icon
- [x] 1.3 Update user data structure to use real user information
  - [x] Replace mock user data with placeholder user data (ready for real integration)
  - [ ] Integrate with authentication system if available (deferred for future implementation)
  - [x] Update avatar source to use placeholder (ready for real user avatar)
- [x] 1.4 Add active route detection using `usePathname` from Next.js
  - [x] Pass `isActive` prop to navigation items based on current route
  - [x] Ensure active state updates on route changes

## 2. Refactor Dashboard Layout
- [x] 2.1 Update `app/(dashboard)/layout.tsx` to use SidebarProvider
  - [x] Wrap layout in container with `[--header-height:calc(--spacing(14))]`
  - [x] Add `className="flex flex-col"` to `SidebarProvider`
  - [x] Render `SiteHeader` above the sidebar/content row
  - [x] Wrap `AppSidebar` and `SidebarInset` in `div` with `className="flex flex-1"`
  - [x] Remove legacy `Header` component from `SidebarInset`
- [ ] 2.2 (N/A) Legacy Header component integration
  - [ ] N/A — Legacy `<Header />` replaced by `<SiteHeader />` ahead of sidebar/content row
  - [ ] N/A — `<SidebarTrigger />` provided within `SiteHeader`
  - [ ] N/A — Styling responsibilities handled by `SiteHeader`
  - [ ] N/A — Responsiveness covered by `SiteHeader` behavior (manual testing deferred)
- [x] 2.3 Update main content area styling
  - [x] Ensure main content scrolling works independently
  - [x] Verify padding and spacing around content
  - [ ] Test content layout with sidebar expanded and collapsed (requires manual testing)
- [x] 2.4 Remove old sidebar implementation
  - [x] Remove `<Sidebar />` import from dashboard layout
  - [ ] Verify no other files import the old sidebar component (requires search/verification)
  - [ ] Archive or delete `components/layout/sidebar.tsx` file (deferred - may be needed for reference)

## 3. Navigation Integration
- [x] 3.1 Create navigation data structure or configuration
  - [x] Define navigation items inline in `components/app-sidebar.tsx`
  - [x] Include icon imports, labels, URLs, and optional sub-items
  - [x] Navigation data is ready for use in AppSidebar
- [x] 3.2 Implement route-based active state detection
  - [x] Use Next.js `usePathname()` hook in AppSidebar and NavMain components
  - [x] Match current pathname against navigation item URLs
  - [x] Apply `isActive` prop to `SidebarMenuButton` and `SidebarMenuSubButton` components
- [ ] 3.3 Test navigation between all dashboard pages
  - [ ] Verify all links navigate correctly (requires manual testing)
  - [ ] Confirm active state updates on navigation (requires manual testing)
  - [ ] Test nested sub-menu navigation if applicable (requires manual testing)

## 4. Responsive and Mobile Behavior
- [ ] 4.1 Test sidebar drawer on mobile viewports (< 768px)
  - [ ] Verify sidebar is hidden by default on mobile
  - [ ] Confirm trigger button opens mobile drawer
  - [ ] Test backdrop overlay and close behavior
  - [ ] Verify body scroll lock when drawer is open
- [ ] 4.2 Test sidebar collapse functionality on desktop
  - [ ] Verify sidebar toggles between expanded and collapsed states
  - [ ] Confirm icon-only mode displays correctly
  - [ ] Test tooltips appear on hover in collapsed mode
  - [ ] Verify smooth transitions (200ms ease-linear)
- [ ] 4.3 Test keyboard shortcuts
  - [ ] Verify Cmd+B (Mac) or Ctrl+B (Windows/Linux) toggles sidebar
  - [ ] Ensure shortcut works from different focused elements
  - [ ] Test that shortcut does not conflict with browser shortcuts
- [ ] 4.4 Test tablet and intermediate viewports
  - [ ] Test behavior at 768px breakpoint (mobile → desktop transition)
  - [ ] Verify layout is stable across viewport sizes

## 5. Sidebar State Persistence
- [ ] 5.1 Verify sidebar state cookie is set correctly
  - [ ] Confirm cookie name is `sidebar_state`
  - [ ] Verify cookie path is `/` and max-age is 604800 seconds (7 days)
  - [ ] Test that cookie updates when sidebar is toggled
- [ ] 5.2 Test state restoration on page reload
  - [ ] Toggle sidebar, reload page, confirm state persists
  - [ ] Test both expanded and collapsed states
  - [ ] Verify default state (expanded) when no cookie exists
- [ ] 5.3 Test state persistence across different dashboard pages
  - [ ] Navigate between pages, confirm sidebar state remains consistent

## 6. Accessibility and Keyboard Navigation
- [ ] 6.1 Test keyboard navigation through sidebar
  - [ ] Tab through all sidebar menu items
  - [ ] Verify focus indicators are visible (ring outline)
  - [ ] Test Enter/Space key activation on menu items and collapsible groups
- [ ] 6.2 Test screen reader compatibility
  - [ ] Verify `sr-only` text on trigger button ("Toggle Sidebar")
  - [ ] Test with screen reader (NVDA, VoiceOver, or JAWS) if possible
  - [ ] Confirm ARIA labels and roles are correctly applied
- [ ] 6.3 Test focus management in mobile drawer
  - [ ] Verify focus trap within open drawer
  - [ ] Test Escape key closes drawer
  - [ ] Confirm focus returns to trigger button on close

## 7. Theme and Styling
- [ ] 7.1 Verify sidebar uses theme variables correctly
  - [ ] Confirm `bg-sidebar`, `text-sidebar-foreground` classes are applied
  - [ ] Test active/hover states use `sidebar-accent` colors
  - [ ] Verify borders use `sidebar-border` color
- [ ] 7.2 Test light and dark mode compatibility
  - [ ] Switch between light and dark modes
  - [ ] Verify sidebar colors update correctly
  - [ ] Confirm text contrast meets accessibility standards (WCAG AA)
- [ ] 7.3 Verify consistency with rest of dashboard theme
  - [ ] Check that sidebar styling matches global theme
  - [ ] Ensure header and main content areas are visually coherent

## 8. Testing and Validation
- [ ] 8.1 Test all existing dashboard routes
  - [ ] `/dashboard` or dashboard home
  - [ ] `/pje/credentials`
  - [ ] `/pje/processos`
  - [ ] `/pje/scrapes`
  - [ ] Any other dashboard routes
- [ ] 8.2 Verify landing page is unaffected
  - [ ] Navigate to `/` and confirm no sidebar is present
  - [ ] Verify landing page layout is unchanged
- [ ] 8.3 Perform cross-browser testing
  - [ ] Test in Chrome, Firefox, Safari, Edge
  - [ ] Verify layout and interactions work consistently
- [ ] 8.4 Test on actual mobile devices
  - [ ] Test on iOS Safari (iPhone)
  - [ ] Test on Android Chrome
  - [ ] Verify touch interactions and drawer behavior

## 9. Documentation and Cleanup
- [ ] 9.1 Update any relevant documentation or comments
  - [ ] Document navigation data structure if centralized
  - [ ] Add comments explaining custom sidebar configurations if any
- [ ] 9.2 Remove or archive old sidebar component
  - [ ] Delete `components/layout/sidebar.tsx` if no longer needed
  - [ ] Remove any unused imports or references
- [ ] 9.3 Update this tasks.md checklist
  - [ ] Mark all tasks as complete `[x]` once finished
  - [ ] Note any deviations or additional tasks completed

## 10. Deployment Readiness
- [ ] 10.1 Run production build and verify no errors
  - [ ] Execute `npm run build`
  - [ ] Confirm build completes successfully
  - [ ] Check for any console warnings related to sidebar
- [ ] 10.2 Test production build locally
  - [ ] Run `npm run start` and test production build
  - [ ] Verify sidebar works correctly in production mode
  - [ ] Check that state persistence works with production cookies
- [ ] 10.3 Perform final visual QA
  - [ ] Review all dashboard pages for visual consistency
  - [ ] Confirm no layout breaks or styling issues
  - [ ] Verify responsive behavior on all target devices

---

## Implementation Summary

### Completed (Core Implementation)
- ✅ Updated AppSidebar with real PJE navigation structure
- ✅ Changed branding from "Acme Inc" to "JusBrowserless"
- ✅ Implemented active route detection with usePathname
- ✅ Refactored dashboard layout to use SidebarProvider, AppSidebar, and SidebarInset
- ✅ Integrated SiteHeader component with SidebarTrigger
- ✅ Updated NavMain and NavSecondary to use Next.js Link components
- ✅ Fixed import path for useIsMobile hook in sidebar.tsx
- ✅ Refactored dashboard layout to follow official sidebar-16 structure with wrapper div, flex-col provider, SiteHeader above content, and flex row for sidebar/content
- ✅ Replaced old Header component with SiteHeader component
- ✅ Implemented proper CSS variable for header height

### Remaining (Testing & Validation)
- ⏳ Manual testing of all navigation links and active states (Sections 3.3, 4, 5, 6, 7, 8)
- ⏳ Verification of old sidebar removal from other files (Section 2.4)
- ⏳ Cross-browser and mobile device testing (Section 8)
- ⏳ Production build testing (Section 10)

### Notes
- Navigation data is currently defined inline in `components/app-sidebar.tsx` for simplicity
- User authentication integration is deferred for future implementation
- Old `components/layout/sidebar.tsx` is preserved for reference (can be deleted after verification)
- The Sidebar-16 block is fully integrated and ready for testing

