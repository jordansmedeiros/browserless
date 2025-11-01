# Jusbro Claude Code Skills

This directory contains custom Claude Code skills for the Jusbro project.

## Available Skills

### 1. ⚛️ nextjs-16-expert
**Expert in Next.js 16 and modern React development**

Provides specialized knowledge for:
- Next.js 16 App Router patterns
- React 19 Server Components and Client Components
- Server Actions for type-safe mutations
- TypeScript strict mode best practices
- TailwindCSS utility-first styling
- shadcn/ui component implementation
- Radix UI accessibility primitives
- Performance optimization (code splitting, image optimization)
- Error handling and loading states

**Use when:** Creating Next.js pages/components, implementing Server Actions, styling with Tailwind/shadcn, or building accessible UIs.

### 2. 🤖 pje-scraping
**Expert in PJE automation and web scraping**

Provides specialized knowledge for:
- Tribunal structure and organization (TJMG, TJES, TRT)
- Scraping categories (acervo, expedientes, pauta)
- Standard script templates and patterns
- Login flow implementations
- Data extraction techniques
- Anti-detection best practices
- Error handling and debugging

**Use when:** Creating new PJE scrapers, updating existing scripts, or troubleshooting scraping issues.

### 3. 🔐 pje-login-debug
**Specialized debugging for PJE authentication**

Provides debugging expertise for:
- Login flow diagnostics
- Tribunal-specific login quirks (TJMG Bad Request, TJES CAPTCHA)
- CAPTCHA solving and OCR
- Session management and expiration
- Network debugging and request monitoring
- Browser console debugging
- Systematic debugging workflows

**Use when:** Login scripts fail, CAPTCHA issues occur, or investigating authentication problems.

### 4. 🏗️ jusbro-patterns
**Architectural patterns and code conventions**

Enforces project standards for:
- Code style and formatting (Prettier/ESLint)
- Naming conventions (files, functions, types)
- File organization and structure
- Next.js patterns (Server/Client Components, Server Actions)
- Database patterns (Prisma)
- UI component patterns (shadcn style)
- Build and development workflows
- Testing approaches

**Use when:** Creating new files, refactoring code, setting up components, or enforcing standards.

### 5. 📊 data-table-dashboard
**Expert in enterprise-grade data tables and dashboards**

Provides specialized knowledge for:
- TanStack Table v8 integration with shadcn/ui
- Advanced filtering, sorting, and pagination
- Column definitions and custom cell renderers
- Row selection and bulk operations
- Recharts data visualization
- Interactive dashboards with filters
- Server-side data fetching with TanStack Query
- Virtual scrolling for large datasets
- Accessibility and performance optimization

**Use when:** Building data tables, creating dashboards, implementing charts, or handling complex data interfaces.

### 6. 🔴 realtime-websocket
**Expert in production-ready real-time applications**

Provides specialized knowledge for:
- Socket.io server and client setup with TypeScript
- Server-Sent Events (SSE) implementation
- WebSocket vs SSE decision framework
- React 19 useOptimistic for real-time updates
- Connection management and reconnection logic
- Real-time chat interfaces with shadcn/ui
- Live dashboards with streaming data
- Authentication and security for real-time connections
- Performance optimization (debouncing, throttling)
- Hybrid patterns (SSE + Server Actions)

**Use when:** Building chat apps, live dashboards, collaborative features, notifications, or any real-time data synchronization.

### 7. 🎨 shadcn-component-builder
**Expert in building and customizing shadcn/ui components**

Provides specialized knowledge for:
- shadcn/ui component patterns and architecture
- Radix UI primitive integration
- CVA (Class Variance Authority) variant management
- TypeScript strict typing for component props
- Compound component patterns (Card.Header, Card.Content)
- Advanced components (MultiSelect, Combobox, DateRangePicker)
- WCAG 2.1 AA accessibility standards
- Keyboard navigation and focus management
- Dark mode and theme integration
- Component testing and accessibility testing

**Use when:** Creating UI components, extending shadcn/ui, implementing accessible interfaces, or building design systems.

### 8. 🎬 animation-motion
**Expert in React animations and modern motion design**

Provides specialized knowledge for:
- Framer Motion integration with shadcn/ui
- AnimatePresence for enter/exit animations
- Stagger children and orchestrated sequences
- Layout animations and shared layouts
- Drag and drop with gesture recognition
- Scroll-triggered animations with useInView
- CSS animations with Tailwind keyframes
- useReducedMotion for accessibility
- 60fps performance optimization (GPU acceleration)
- Spring physics and easing curves

**Use when:** Creating animated components, micro-interactions, page transitions, loading states, or any UI motion design.

### 9. 🎨 tailwind-v4-expert
**Expert in Tailwind CSS v4.1.16+ with modern syntax**

Provides specialized knowledge for:
- Tailwind v4 CSS variable syntax (parentheses notation)
- Project-specific variables (--header-height, --sidebar-width)
- Responsive layouts with mobile-first approach
- Dark mode with CSS custom properties
- shadcn/ui theming integration
- Performance optimization and tree-shaking
- Container queries (new in v4)
- Accessibility patterns (focus states, high contrast)
- CVA variant management
- Migration from Tailwind v3 to v4

**Use when:** Writing Tailwind classes, styling components, creating layouts, implementing responsive design, or debugging CSS.

### 10. 🗄️ supabase-fullstack
**Expert in full-stack development with Supabase**

Provides specialized knowledge for:
- Supabase client setup (browser and server)
- Authentication systems (email/password, OAuth, magic links)
- Database operations with TypeScript types
- React Query integration for data fetching
- Real-time subscriptions and presence
- File storage and uploads
- Row Level Security (RLS) policies
- Server Actions with Supabase
- Protected routes with middleware
- Supabase UI Library components

**Use when:** Building full-stack apps, implementing auth, creating CRUD operations, adding real-time features, or managing files.

### 11. 💳 stripe-payments
**Expert in Stripe payment integration and subscription management**

Provides specialized knowledge for:
- Stripe Checkout integration with Server Actions
- Webhook handling and signature verification
- Subscription lifecycle management
- Customer Portal integration
- Pricing tables with shadcn/ui
- Payment error handling and retry logic
- Database synchronization (Prisma)
- PCI compliance and security best practices
- Test mode and production deployment
- Invoice and billing management

**Use when:** Integrating payments, building subscription systems, handling webhooks, creating pricing pages, or managing billing.

### 12. 🪝 react-hooks
**Expert in shadcn/ui React hooks library (30+ hooks)**

Provides specialized knowledge for:
- State Management hooks (useLocalStorage, useBoolean, useCounter, useToggle, useMap, useSessionStorage)
- Browser API hooks (useMediaQuery, useWindowSize, useDarkMode, useCopyToClipboard, useScript, useScreen, useDocumentTitle, useScrollLock)
- UI Interaction hooks (useOnClickOutside, useHover, useMousePosition, useClickAnyWhere)
- Performance hooks (useDebounceValue, useDebounceCallback, useInterval, useTimeout)
- Advanced Utilities (useEventListener, useIntersectionObserver, useResizeObserver, useCountdown, useEventCallback, useIsClient, useIsMounted, useIsomorphicLayoutEffect, useReadLocalStorage, useStep, useTernaryDarkMode, useUnmount)
- SSR compatibility patterns for Next.js 16
- TypeScript types and generic constraints
- Performance optimization with memoization
- Accessibility considerations

**Use when:** Implementing React hooks, managing state persistence, handling browser APIs, optimizing performance, or building accessible interactive UIs.

## How Skills Work

Claude Code automatically:
1. **Discovers** skills in `.claude/skills/` directory
2. **Reads** the `SKILL.md` file when relevant
3. **Applies** the patterns and knowledge from the skill

You don't need to explicitly invoke skills - Claude will use them contextually based on your tasks.

## Skill Structure

Each skill follows this structure:

```
.claude/skills/
└── skill-name/
    ├── SKILL.md          # Main skill definition (required)
    └── examples/         # Optional supporting files
```

### SKILL.md Format

```yaml
---
name: skill-name
description: Brief description of what this skill does (max 1024 chars)
---

# Skill Name

Detailed instructions, examples, and patterns...
```

## Testing Skills

To verify skills are working:

1. **Ask skill-specific questions:**
   ```
   "How should I structure a new PJE scraper for TJMG?"
   → Should reference pje-scraping skill
   ```

2. **Request skill-related tasks:**
   ```
   "Debug this TJMG login issue"
   → Should apply pje-login-debug patterns
   ```

3. **Create new code:**
   ```
   "Create a new React component for processos"
   → Should follow jusbro-patterns conventions
   ```

## Skill Best Practices

### ✅ Do:
- Keep skills focused on specific domains
- Include concrete examples and templates
- Update skills when patterns change
- Document when to use each skill

### ❌ Don't:
- Create overlapping skills
- Make skills too generic
- Forget to update after architectural changes
- Include sensitive data (credentials, keys)

## Maintenance

### Updating Skills

When project patterns change:

1. Edit the relevant `SKILL.md` file
2. Update examples and templates
3. Test with sample tasks
4. Commit changes to git

### Adding New Skills

To create a new skill:

```bash
# 1. Create skill directory
mkdir -p .claude/skills/new-skill-name

# 2. Create SKILL.md
cat > .claude/skills/new-skill-name/SKILL.md << 'EOF'
---
name: new-skill-name
description: What this skill does
---

# Skill Name

Instructions and patterns...
EOF

# 3. Test the skill
# Ask Claude to use the new skill patterns
```

## Integration with OpenSpec

Skills complement OpenSpec workflow:

- **OpenSpec**: Manages change proposals and specs
- **Skills**: Enforces implementation patterns

Use both together:
1. Create OpenSpec proposal for new feature
2. Use skills to implement following project patterns
3. Update skills if new patterns emerge

## Related Documentation

- [OpenSpec AGENTS.md](../../openspec/AGENTS.md) - Change workflow
- [Project Context](../../openspec/project.md) - Full project overview
- [Claude Code Docs](https://docs.claude.com/en/docs/claude-code/skills) - Official skills documentation

## Troubleshooting

### Skill not being used?

1. **Check name format:** Lowercase, hyphens only (no spaces/underscores)
2. **Verify description:** Must be under 1024 characters
3. **Validate YAML:** Proper frontmatter format
4. **Restart Claude Code:** May need to reload skills

### Skill conflicts?

If multiple skills overlap:
1. Make skills more specific
2. Clarify "when to use" sections
3. Merge related skills if appropriate

## Questions?

For skill-related issues:
- Check [Claude Code documentation](https://docs.claude.com/en/docs/claude-code/skills)
- Review existing SKILL.md files for examples
- Test with simple tasks first
