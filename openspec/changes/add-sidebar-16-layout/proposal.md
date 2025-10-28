# Add Sidebar-16 Layout Proposal

## Why

The current dashboard layout uses a custom-built sidebar that lacks modern features like collapsibility, responsive mobile drawer, keyboard shortcuts, and advanced state management. The shadcn Sidebar-16 block provides a production-ready, accessible, and feature-rich sidebar system that will significantly improve the user experience across all dashboard pages.

## What Changes

- Replace the custom sidebar in `app/(dashboard)/layout.tsx` with the shadcn Sidebar-16 system (`SidebarProvider`, `AppSidebar`, `SidebarInset`)
- Adapt the AppSidebar content to match the application's actual navigation structure (PJE features, credentials management, process scraping, etc.)
- Integrate the existing Header component within the new layout structure
- Implement responsive mobile behavior with drawer-style sidebar
- Add keyboard shortcut support (Cmd/Ctrl + B to toggle sidebar)
- Add collapsible sidebar functionality for desktop
- Keep the landing page (`app/page.tsx`) outside the sidebar layout (no changes needed)
- Remove the old custom sidebar component (`components/layout/sidebar.tsx`)

## Impact

- **Affected specs**: Creates new `dashboard-layout` capability
- **Affected code**:
  - `app/(dashboard)/layout.tsx` - Complete restructure to use SidebarProvider wrapper
  - `components/app-sidebar.tsx` - Adapt navigation data to real app structure
  - `components/layout/sidebar.tsx` - Will be deprecated/removed
  - `components/layout/header.tsx` - May need minor adjustments to work inside SidebarInset
  - All existing dashboard pages will automatically inherit the new layout
- **User experience**: Improved navigation, better mobile support, modern collapsible sidebar
- **Accessibility**: Enhanced keyboard navigation and ARIA support from shadcn components
- **No breaking changes**: Landing page remains unaffected, all existing routes continue to work
