<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

## Tech Stack & Conventions

### Frontend Stack
- **Next.js** - App Router (latest)
- **React** - Server Components & Client Components
- **TypeScript** - Strict mode
- **Tailwind CSS v4.1.16** - Modern CSS framework (see syntax notes below)
- **shadcn/ui** - Component library
- **Radix UI** - Headless UI primitives

### Tailwind CSS v4 Important Notes

This project uses **Tailwind CSS v4**, which has **different syntax** from v3:

#### CSS Variable Syntax
```tsx
// ✅ CORRECT (Tailwind v4)
className="top-(--header-height)"
className="h-[calc(100svh-var(--header-height))]"

// ❌ WRONG (Tailwind v3 syntax - DO NOT USE)
className="top-[var(--header-height)]"
```

**Key differences:**
- Use **parentheses `()`** for CSS variables: `top-(--variable)`
- `var()` is **implicit** in v4 - you don't write it explicitly
- Complex calc expressions still use brackets: `h-[calc(100svh-var(--var))]`
- The `!` suffix for important is still valid: `h-full!`

#### Configuration
- Uses `@tailwindcss/postcss` plugin (see `postcss.config.js`)
- Config file: `tailwind.config.ts`
- Custom variables defined via inline arbitrary values: `[--var-name:value]`

### Component Architecture

**shadcn/ui Components:**
- Located in `components/ui/`
- Never modify these directly - they may be updated from shadcn registry
- Extend via wrapper components or composition
- Use built-in variants and slots when available

**Layout System:**
- `SidebarProvider` manages sidebar state and CSS variables
- Sidebar uses fixed positioning with invisible spacer for layout
- Header height: `--header-height: calc(theme(spacing.14))` (56px / 3.5rem / h-14)
- Sidebar width: `--sidebar-width: 16rem` (256px)

### CSS Variables

**Global variables** (defined at root level):
- `--header-height` - Height of site header (56px)
- `--sidebar-width` - Sidebar width when expanded (256px)
- `--sidebar-width-icon` - Sidebar width when collapsed (48px)
- Color scheme variables defined in `globals.css`

### File Structure Conventions
```
app/
  (dashboard)/          # Route group with shared layout
    layout.tsx          # Dashboard layout with sidebar
    page.tsx            # Dashboard home
    [feature]/          # Feature-specific routes
components/
  ui/                   # shadcn/ui components (DO NOT MODIFY)
  [feature]/            # Feature-specific components
lib/
  utils.ts              # Utility functions (cn, etc.)
config/
  navigation.ts         # Navigation configuration
```

### Best Practices
- Always use `Link` from `next/link` instead of `<a>` for internal navigation
- Use `usePathname()` for detecting active routes
- Prefer Server Components by default, use `"use client"` only when needed
- Keep layout components aligned with shadcn/ui originals for easier updates