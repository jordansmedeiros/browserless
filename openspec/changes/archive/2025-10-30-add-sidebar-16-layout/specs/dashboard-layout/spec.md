# Dashboard Layout Spec - Delta

## ADDED Requirements

### Requirement: Sidebar Provider Wrapper

The dashboard layout SHALL wrap all authenticated pages with a SidebarProvider component that manages sidebar state and context.

#### Scenario: Dashboard pages render within SidebarProvider
- **WHEN** a user navigates to any page under `/dashboard` or `/(dashboard)` route group
- **THEN** the page renders within a SidebarProvider wrapper
- **AND** sidebar state (expanded/collapsed) is available to all child components via context
- **AND** sidebar toggle functionality is accessible throughout the layout

#### Scenario: Landing page is excluded from sidebar layout
- **WHEN** a user navigates to the root route `/`
- **THEN** the page renders without SidebarProvider
- **AND** no sidebar is displayed
- **AND** landing page layout is independent from dashboard layout

### Requirement: Collapsible Sidebar

The dashboard layout SHALL provide a collapsible sidebar that can be toggled between expanded and collapsed states.

#### Scenario: User toggles sidebar on desktop
- **WHEN** a user clicks the sidebar toggle button or trigger rail
- **THEN** sidebar transitions smoothly between expanded and collapsed states
- **AND** transition duration is 200ms with ease-linear timing
- **AND** page content adjusts width accordingly
- **AND** sidebar state persists in cookie (`sidebar_state`) for 7 days

#### Scenario: Sidebar displays in collapsed icon mode
- **WHEN** sidebar is in collapsed state on desktop (viewport >= 768px)
- **THEN** sidebar width becomes `3rem` (icon-only mode)
- **AND** only icons are visible, text labels are hidden
- **AND** menu items show tooltips on hover displaying full text
- **AND** collapsible groups and sub-menus are hidden

#### Scenario: Sidebar keyboard shortcut toggles sidebar
- **WHEN** user presses Cmd+B (Mac) or Ctrl+B (Windows/Linux)
- **THEN** sidebar toggles between expanded and collapsed states
- **AND** keyboard shortcut works from any focused element within the dashboard

### Requirement: Responsive Mobile Drawer

The dashboard layout SHALL display sidebar as a mobile drawer on small viewports.

#### Scenario: Sidebar renders as drawer on mobile
- **WHEN** dashboard is viewed on mobile viewport (< 768px width)
- **THEN** sidebar is hidden by default (offcanvas)
- **AND** sidebar trigger button is displayed in the header or top bar
- **AND** page content takes full viewport width

#### Scenario: User opens mobile sidebar drawer
- **WHEN** user taps the sidebar trigger button on mobile
- **THEN** sidebar slides in from the left as an overlay sheet
- **AND** sidebar width is `18rem` (mobile width)
- **AND** backdrop overlay appears behind sidebar
- **AND** body scroll is locked while drawer is open

#### Scenario: User closes mobile sidebar drawer
- **WHEN** user taps outside the sidebar or on close button
- **THEN** sidebar slides out and closes
- **AND** backdrop overlay fades out
- **AND** body scroll is restored
- **AND** focus returns to trigger button

### Requirement: Sidebar Header with Branding

The dashboard layout SHALL display a sidebar header section with application branding and identity.

#### Scenario: Sidebar header displays app logo and name
- **WHEN** sidebar is rendered in expanded state
- **THEN** header displays application icon/logo (using `Command` icon or custom logo)
- **AND** displays application name "JusBrowserless" or appropriate branding
- **AND** displays optional subtitle or tier (e.g., "Pro", "Enterprise", or version)
- **AND** logo and text are clickable, linking to dashboard home

#### Scenario: Sidebar header in collapsed mode
- **WHEN** sidebar is collapsed (icon mode)
- **THEN** header displays only the application icon/logo
- **AND** text labels are hidden
- **AND** icon remains centered and accessible

### Requirement: Main Navigation Menu

The dashboard layout SHALL provide a main navigation menu with collapsible groups and sub-items.

#### Scenario: Main navigation displays PJE-related items
- **WHEN** sidebar main navigation renders
- **THEN** displays "PJE Automação" or "Automação" group
- **AND** includes "Credenciais" menu item linking to `/pje/credentials`
- **AND** includes "Processos" menu item linking to `/pje/processos`
- **AND** includes "Raspagens" menu item linking to `/pje/scrapes`
- **AND** each item displays an appropriate Lucide icon

#### Scenario: User expands collapsible navigation group
- **WHEN** user clicks on a navigation item with sub-items
- **THEN** group expands smoothly with chevron rotating 90 degrees
- **AND** sub-items appear with indentation and connecting border line
- **AND** sub-items are clickable and navigate to their respective routes

#### Scenario: Active route is highlighted in navigation
- **WHEN** user is on a specific dashboard page (e.g., `/pje/credentials`)
- **THEN** corresponding menu item has active visual state (background accent color)
- **AND** active item text is medium font-weight
- **AND** parent group (if nested) remains expanded

### Requirement: Secondary Navigation Menu

The dashboard layout SHALL provide a secondary navigation section for auxiliary links like support and settings.

#### Scenario: Secondary navigation displays at bottom of sidebar
- **WHEN** sidebar content renders
- **THEN** secondary navigation is positioned at the bottom of scrollable area (with `mt-auto`)
- **AND** displays "Suporte" or "Ajuda" link (optional external link)
- **AND** displays "Configurações" link to settings page
- **AND** items use smaller size variant (`size="sm"`)

### Requirement: User Profile Footer

The dashboard layout SHALL display a user profile section in the sidebar footer with account actions.

#### Scenario: Footer displays current user information
- **WHEN** sidebar footer renders
- **THEN** displays user avatar (image or fallback initials)
- **AND** displays user name
- **AND** displays user email
- **AND** avatar and info are contained in a clickable dropdown trigger

#### Scenario: User opens profile dropdown menu
- **WHEN** user clicks on the profile section in footer
- **THEN** dropdown menu appears adjacent to sidebar (right side on desktop, bottom on mobile)
- **AND** menu displays user info header with avatar repeated
- **AND** menu includes "Conta" or "Perfil" menu item
- **AND** menu includes "Configurações" menu item (optional)
- **AND** menu includes "Sair" or "Log out" menu item

#### Scenario: User initiates logout from profile menu
- **WHEN** user clicks "Sair" menu item
- **THEN** a logout action is dispatched.
- **AND** the application is responsible for handling session termination and redirection.

### Requirement: Site Header
The dashboard layout SHALL feature a SiteHeader component rendered above the main content and sidebar area.

#### Scenario: SiteHeader is fixed at the top
- **WHEN** any dashboard page is rendered
- **THEN** the SiteHeader component is displayed at the top of the viewport.
- **AND** it has a fixed height defined by `--header-height`.

#### Scenario: SiteHeader contains sidebar trigger
- **WHEN** the SiteHeader is rendered
- **THEN** it contains the SidebarTrigger button.
- **AND** this button is responsible for toggling the sidebar on mobile and desktop.

### Requirement: Page Content Area
The dashboard layout SHALL render page content in an area that adjusts to the sidebar's state.

#### Scenario: Page content area is positioned correctly
- **WHEN** a dashboard page is rendered
- **THEN** the main content area is wrapped in a `SidebarInset` component.
- **AND** `SidebarInset` is placed in a flex row next to the `AppSidebar`.

#### Scenario: Page content adjusts to expanded sidebar
- **WHEN** sidebar is in expanded state (default)
- **THEN** main content area starts at `var(--sidebar-width)` offset (16rem)
- **AND** content takes remaining viewport width
- **AND** content is scrollable independently of sidebar

#### Scenario: Page content adjusts to collapsed sidebar
- **WHEN** sidebar is collapsed (icon mode)
- **THEN** main content area starts at `var(--sidebar-width-icon)` offset (3rem)
- **AND** content expands to use additional available width
- **AND** transition is smooth (200ms ease-linear)

### Requirement: Sidebar State Persistence

The dashboard layout SHALL persist sidebar state across page navigations and browser sessions.

#### Scenario: Sidebar state is saved to cookie
- **WHEN** user toggles sidebar state (expanded/collapsed)
- **THEN** state is saved to cookie named `sidebar_state`
- **AND** cookie has path `/` (accessible across all routes)
- **AND** cookie max-age is 604800 seconds (7 days)

#### Scenario: Sidebar state is restored on page load
- **WHEN** user returns to dashboard after closing browser
- **THEN** sidebar state is read from `sidebar_state` cookie
- **AND** sidebar initializes in previously set state (expanded or collapsed)
- **AND** if no cookie exists, sidebar defaults to expanded state

### Requirement: Sidebar Variants and Customization

The dashboard layout SHALL use the standard sidebar variant without requiring inset or floating variants.

#### Scenario: Sidebar uses standard fixed variant
- **WHEN** sidebar renders on desktop
- **THEN** sidebar variant is `sidebar` (default, not floating or inset)
- **AND** sidebar is fixed positioned at left edge
- **AND** sidebar has right border separator
- **AND** sidebar background uses `bg-sidebar` theme variable

### Requirement: Accessibility and Keyboard Navigation

The dashboard layout SHALL ensure sidebar is fully accessible via keyboard and screen readers.

#### Scenario: Sidebar trigger has accessible label
- **WHEN** SidebarTrigger button renders
- **THEN** button includes `sr-only` span with text "Toggle Sidebar"
- **AND** button is focusable via keyboard Tab navigation
- **AND** button can be activated with Enter or Space key

#### Scenario: Sidebar menu items are keyboard navigable
- **WHEN** sidebar is open and focused
- **THEN** user can Tab through all menu items sequentially
- **AND** user can activate menu item with Enter key
- **AND** user can collapse/expand groups with Enter or Space
- **AND** focus is visually indicated with ring outline

#### Scenario: Sidebar drawer on mobile is keyboard accessible
- **WHEN** mobile sidebar drawer is open
- **THEN** focus is trapped within the drawer
- **AND** Escape key closes the drawer
- **AND** Tab cycles through drawer focusable elements only
- **AND** closing drawer returns focus to trigger button

### Requirement: Theme Integration

The dashboard layout SHALL use theme-aware sidebar colors that respond to light/dark mode.

#### Scenario: Sidebar colors use CSS custom properties
- **WHEN** sidebar renders
- **THEN** background color uses `var(--sidebar)` or `bg-sidebar` Tailwind class
- **AND** text color uses `var(--sidebar-foreground)` or `text-sidebar-foreground`
- **AND** active/hover states use `var(--sidebar-accent)` and `var(--sidebar-accent-foreground)`
- **AND** borders use `var(--sidebar-border)`

#### Scenario: Sidebar adapts to dark mode
- **WHEN** user switches to dark mode
- **THEN** all sidebar theme variables update to dark mode values
- **AND** sidebar remains visually coherent with rest of dashboard
- **AND** text contrast meets WCAG AA standards

### Requirement: Migration from Old Sidebar

The dashboard layout SHALL cleanly replace the existing custom sidebar without breaking existing pages.

#### Scenario: Old sidebar component is deprecated
- **WHEN** new Sidebar-16 layout is implemented
- **THEN** `components/layout/sidebar.tsx` is no longer imported in dashboard layout
- **AND** old sidebar component can be safely removed or archived
- **AND** no dashboard pages reference the old sidebar directly

#### Scenario: All existing dashboard routes work with new layout
- **WHEN** new layout is deployed
- **THEN** all pages under `/(dashboard)` route group render correctly
- **AND** navigation links in new sidebar point to correct routes
- **AND** active route highlighting works for all pages
- **AND** no 404 errors or broken links occur
