---
name: react-hooks
description: Expert in shadcn/ui React hooks library with 30+ production-ready hooks for state management, browser APIs, UI interactions, performance optimization, and advanced utilities. Includes SSR support, TypeScript types, and Next.js 16 integration patterns.
---

# shadcn/ui React Hooks Expert

A comprehensive collection of 30+ production-ready React hooks from the shadcn/ui hooks library, organized by category with full TypeScript support, SSR compatibility, and Next.js 16 integration patterns.

## Core Responsibilities

- Implement shadcn/ui hooks following official patterns and best practices
- Provide type-safe implementations with full TypeScript support
- Ensure SSR compatibility for Next.js 16 applications
- Optimize performance with proper memoization and cleanup
- Handle edge cases and browser compatibility concerns
- Integrate hooks with shadcn/ui components and design system

## Installation

All hooks are available through the shadcn CLI:

```bash
# Install individual hooks
npx shadcn@latest add https://www.shadcn.io/registry/use-[hook-name].json

# Example
npx shadcn@latest add https://www.shadcn.io/registry/use-local-storage.json
```

Hooks are installed to `hooks/` directory with full TypeScript types and dependencies.

## Hook Categories

### 1. State Management Hooks (6)
Advanced state management with persistence, validation, and type safety.

#### useLocalStorage
Persistent state synchronized with browser localStorage across tabs.

**Signature:**
```typescript
useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: UseLocalStorageOptions<T>
): [T, Dispatch<SetStateAction<T>>, () => void]
```

**Options:**
```typescript
interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;      // Default: JSON.stringify
  deserializer?: (value: string) => T;    // Default: JSON.parse
  initializeWithValue?: boolean;           // Default: true (SSR: false)
}
```

**Return:** `[value, setValue, removeValue]`

**Key Features:**
- Cross-tab synchronization with storage events
- Custom serialization for complex types
- SSR-safe with `initializeWithValue: false`
- Automatic error handling and fallbacks
- 5-10MB storage quota with graceful failures

**Common Gotchas:**
- Use `initializeWithValue: false` in Next.js to prevent hydration mismatches
- Circular references require custom serializers
- Storage quota errors need proper handling

**Example:**
```typescript
"use client"
import { useLocalStorage } from "@/hooks/use-local-storage"

export function UserPreferences() {
  const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light", {
    initializeWithValue: false // SSR-safe for Next.js
  })

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  )
}
```

#### useSessionStorage
Session-scoped storage persisting across page reloads (same tab only).

**Signature:**
```typescript
useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: UseSessionStorageOptions<T>
): [T, Dispatch<SetStateAction<T>>, () => void]
```

**Options:** Same as `useLocalStorage`

**Key Differences from localStorage:**
- Data cleared when browser tab closes
- No cross-tab synchronization
- Smaller quota (typically 5-10MB)
- Ideal for tab-specific state (form drafts, wizard progress)

**Example:**
```typescript
const [formDraft, setFormDraft] = useSessionStorage("form-draft", {
  name: "",
  email: ""
})
```

#### useBoolean
Convenient boolean state with helper methods eliminating repetitive boilerplate.

**Signature:**
```typescript
useBoolean(defaultValue: boolean = false): {
  value: boolean
  setValue: React.Dispatch<React.SetStateAction<boolean>>
  setTrue: () => void
  setFalse: () => void
  toggle: () => void
}
```

**Features:**
- Memoized callbacks prevent child re-renders
- Strict boolean validation
- Stable function references

**Example:**
```typescript
const modal = useBoolean(false)

<Button onClick={modal.setTrue}>Open Modal</Button>
<Dialog open={modal.value} onOpenChange={modal.setValue}>
  <DialogContent>
    <Button onClick={modal.setFalse}>Close</Button>
  </DialogContent>
</Dialog>
```

#### useCounter
Numeric state with increment, decrement, reset, and custom operations.

**Signature:**
```typescript
useCounter(initialValue: number = 0): {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
  setCount: React.Dispatch<React.SetStateAction<number>>
}
```

**Important Notes:**
- Reset returns to `initialValue`, not zero
- No built-in min/max bounds - add validation manually
- Fixed step of 1 (use `setCount` for custom steps)

**Example:**
```typescript
const { count, increment, decrement, reset } = useCounter(0)

// Custom step
const incrementBy5 = () => setCount(prev => prev + 5)
```

#### useToggle
useState-like pattern for boolean toggling with memoized performance.

**Signature:**
```typescript
useToggle(defaultValue?: boolean): [
  boolean,                                // Current state
  () => void,                             // Toggle function
  Dispatch<SetStateAction<boolean>>       // Direct setter
]
```

**Example:**
```typescript
const [isOpen, toggle, setIsOpen] = useToggle(false)

<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger onClick={toggle}>Toggle</CollapsibleTrigger>
</Collapsible>
```

#### useMap
Type-safe Map state management with immutable updates.

**Signature:**
```typescript
useMap<K, V>(initialState?: MapOrEntries<K, V>): [
  ReadonlyMap<K, V>,
  UseMapActions<K, V>
]
```

**Actions:**
- `set(key, value)` - Add/update entry
- `setAll(entries)` - Replace entire Map
- `remove(key)` - Delete entry
- `reset()` - Clear all entries

**Features:**
- Immutable updates trigger React re-renders
- Maintains insertion order
- Object keys compared by reference
- Memoized action functions

**Example:**
```typescript
const [users, userActions] = useMap<string, User>([
  ["1", { id: "1", name: "Alice" }]
])

userActions.set("2", { id: "2", name: "Bob" })
userActions.remove("1")
```

### 2. Browser APIs Hooks (8)
Safe browser API access with SSR compatibility and automatic cleanup.

#### useMediaQuery
Responsive breakpoints and CSS media query detection.

**Signature:**
```typescript
useMediaQuery(query: string, options?: {
  defaultValue?: boolean
  initializeWithValue?: boolean
}): boolean
```

**Common Patterns:**
```typescript
// Responsive breakpoints
const isMobile = useMediaQuery("(max-width: 768px)")
const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1024px)")
const isDesktop = useMediaQuery("(min-width: 1025px)")

// User preferences
const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

// SSR-safe (Next.js)
const isMobile = useMediaQuery("(max-width: 768px)", {
  initializeWithValue: false // Returns defaultValue during SSR
})
```

**SSR Handling:**
- Set `initializeWithValue: false` to prevent hydration errors
- Provide sensible `defaultValue` for initial render
- Query evaluates client-side after hydration

#### useWindowSize
Tracks viewport dimensions with SSR safety and debouncing.

**Signature:**
```typescript
useWindowSize(options?: {
  initializeWithValue?: boolean
  debounceDelay?: number
}): {
  width: number | undefined
  height: number | undefined
}
```

**Example:**
```typescript
const { width, height } = useWindowSize({
  initializeWithValue: false, // SSR-safe
  debounceDelay: 100          // Debounce resize events
})

// Responsive rendering
if (width && width < 768) {
  return <MobileLayout />
}
```

#### useDarkMode
Dark mode management with OS preference sync and localStorage persistence.

**Signature:**
```typescript
useDarkMode(options?: {
  defaultValue?: boolean
  localStorageKey?: string
  initializeWithValue?: boolean
  applyDarkClass?: boolean
}): {
  isDarkMode: boolean
  toggle: () => void
  enable: () => void
  disable: () => void
  set: (value: boolean) => void
}
```

**Features:**
- Syncs with `prefers-color-scheme` media query
- Applies `dark` class to document root (Tailwind CSS)
- Persists preference to localStorage
- SSR-safe initialization

**Example:**
```typescript
const { isDarkMode, toggle } = useDarkMode({
  initializeWithValue: false // Prevent Next.js hydration mismatch
})

<Button onClick={toggle}>
  {isDarkMode ? <Moon /> : <Sun />}
</Button>
```

#### useCopyToClipboard
Async clipboard operations with success state feedback.

**Signature:**
```typescript
useCopyToClipboard(): [
  copy: (text: string) => Promise<void>,
  isCopied: boolean
]
```

**Features:**
- Auto-reset after 2 seconds
- HTTPS/localhost required
- User interaction mandatory
- Browser compatibility checks

**Example:**
```typescript
const [copy, isCopied] = useCopyToClipboard()

<Button onClick={() => copy(code)}>
  {isCopied ? <Check /> : <Copy />}
  {isCopied ? "Copied!" : "Copy"}
</Button>
```

#### useScript
Dynamic third-party script loading with status tracking.

**Signature:**
```typescript
useScript(
  src: string | null,
  options?: {
    id?: string
    removeOnUnmount?: boolean
    shouldPreventLoad?: boolean
  }
): 'idle' | 'loading' | 'ready' | 'error'
```

**Features:**
- Automatic caching and deduplication
- SSR-compatible
- Shared status across components
- Optional cleanup on unmount

**Example:**
```typescript
const stripeStatus = useScript("https://js.stripe.com/v3/", {
  id: "stripe-script"
})

if (stripeStatus === "ready") {
  // Initialize Stripe
}
```

#### useScreen
Screen property tracking with orientation detection.

**Signature:**
```typescript
useScreen<T extends boolean = true>(options?: {
  initializeWithValue?: T
  debounceDelay?: number
}): Screen | undefined
```

**Properties:**
- `width`, `height` - Total screen dimensions
- `availWidth`, `availHeight` - Available space excluding system UI
- `colorDepth`, `pixelDepth` - Color capabilities
- `orientation` - Screen orientation (type, angle)

**Example:**
```typescript
const screen = useScreen({ debounceDelay: 200 })

if (screen?.orientation?.type.startsWith("portrait")) {
  // Portrait mode
}
```

#### useDocumentTitle
Dynamic browser tab title management.

**Signature:**
```typescript
useDocumentTitle(title: string): void
```

**Example:**
```typescript
const [count] = useState(5)
useDocumentTitle(`(${count}) New Messages`)

// Updates immediately when count changes
```

**Gotchas:**
- Last rendered component wins
- Title persists after unmount
- No automatic reset

#### useScrollLock
Prevents page scrolling with layout shift compensation.

**Signature:**
```typescript
useScrollLock(options?: {
  autoLock?: boolean
  lockTarget?: HTMLElement | string
  widthReflow?: boolean
}): {
  isLocked: boolean
  lock: () => void
  unlock: () => void
}
```

**Features:**
- Compensates for scrollbar width
- Automatic cleanup
- Custom target elements
- Manual and automatic modes

**Example:**
```typescript
const { isLocked, lock, unlock } = useScrollLock({
  autoLock: false
})

// Lock when modal opens
useEffect(() => {
  if (modalOpen) {
    lock()
  } else {
    unlock()
  }
}, [modalOpen, lock, unlock])
```

### 3. UI Interactions Hooks (4)
User interaction detection with proper event handling.

#### useOnClickOutside
Detect clicks outside target elements (modals, dropdowns).

**Signature:**
```typescript
useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | RefObject<T>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  mouseEvent?: 'mousedown' | 'mouseup'
): void
```

**Features:**
- Multi-ref support
- Portal-aware
- Touch device compatible
- Automatic cleanup

**Example:**
```typescript
const dropdownRef = useRef<HTMLDivElement>(null)
useOnClickOutside(dropdownRef, () => setIsOpen(false))

<div ref={dropdownRef}>
  <DropdownContent />
</div>
```

#### useHover
Hover state detection with automatic event management.

**Signature:**
```typescript
useHover<T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T>
): boolean
```

**Features:**
- Non-bubbling mouseenter/mouseleave events
- Automatic cleanup
- Mobile returns false (no hover capability)

**Example:**
```typescript
const cardRef = useRef<HTMLDivElement>(null)
const isHovered = useHover(cardRef)

<Card ref={cardRef} className={isHovered ? "shadow-lg" : ""}>
  {isHovered && <ActionButtons />}
</Card>
```

#### useMousePosition
Track mouse coordinates (global and element-relative).

**Signature:**
```typescript
useMousePosition<T extends HTMLElement>(): [
  Position,
  React.Ref<T>
]
```

**Position:**
```typescript
type Position = {
  x: number                    // Global X
  y: number                    // Global Y
  elementX?: number            // Relative to element
  elementY?: number            // Relative to element
  elementPositionX?: number    // Element position in viewport
  elementPositionY?: number
}
```

**Example:**
```typescript
const [mouse, trackingRef] = useMousePosition<HTMLDivElement>()

<div ref={trackingRef}>
  Cursor: {mouse.elementX}, {mouse.elementY}
</div>
```

#### useClickAnyWhere
Document-level click detection for global interactions.

**Signature:**
```typescript
useClickAnyWhere(handler: (event: MouseEvent) => void): void
```

**Use Cases:**
- Close all modals on outside click
- Global analytics tracking
- Custom context menus
- Click-based game mechanics

**Example:**
```typescript
useClickAnyWhere((event) => {
  console.log("Clicked at:", event.clientX, event.clientY)
  // Close context menu
  setContextMenuOpen(false)
})
```

### 4. Performance Hooks (4)
Optimize expensive operations with debouncing, throttling, and timing control.

#### useDebounceValue
Debounce state values to reduce update frequency.

**Signature:**
```typescript
useDebounceValue<T>(value: T, delay: number = 500): T
```

**Common Use Cases:**
```typescript
// Search input
const [searchTerm, setSearchTerm] = useState("")
const debouncedSearch = useDebounceValue(searchTerm, 300)

useEffect(() => {
  // API call only after user stops typing for 300ms
  fetchResults(debouncedSearch)
}, [debouncedSearch])

// Form validation
const debouncedEmail = useDebounceValue(email, 500)
useEffect(() => {
  validateEmail(debouncedEmail)
}, [debouncedEmail])
```

#### useDebounceCallback
Debounce function execution with lodash.debounce controls.

**Signature:**
```typescript
useDebounceCallback<T extends (...args: any) => ReturnType<T>>(
  func: T,
  delay: number = 500,
  options?: {
    leading?: boolean
    trailing?: boolean
    maxWait?: number
  }
): DebouncedFunction
```

**Control Methods:**
- `cancel()` - Cancel pending invocations
- `flush()` - Execute immediately
- `isPending()` - Check pending state

**Example:**
```typescript
const debouncedSave = useDebounceCallback(
  (data) => saveToAPI(data),
  1000,
  { maxWait: 5000 } // Force save after 5s max
)

// Cleanup on unmount
useEffect(() => {
  return () => debouncedSave.cancel()
}, [debouncedSave])
```

#### useInterval
Periodic updates with automatic cleanup and pause/resume.

**Signature:**
```typescript
useInterval(
  callback: () => void,
  delay: number | null
): void
```

**Key Pattern - Functional State Updates:**
```typescript
const [count, setCount] = useState(0)
const [isPlaying, setIsPlaying] = useState(true)

useInterval(
  () => setCount(c => c + 1), // Always use functional updates!
  isPlaying ? 1000 : null     // null pauses
)
```

**Use Cases:**
- Countdown timers
- API polling
- Live status updates
- Auto-save
- Animation loops

#### useTimeout
Single-shot delayed execution with dynamic control.

**Signature:**
```typescript
useTimeout(
  callback: () => void,
  delay: number | null
): void
```

**Features:**
- Latest callback always executes
- Null delay cancels timeout
- Automatic cleanup
- Delay changes restart timer

**Example:**
```typescript
const [showNotification, setShowNotification] = useState(true)

// Auto-hide notification after 5s
useTimeout(
  () => setShowNotification(false),
  showNotification ? 5000 : null
)
```

### 5. Advanced Utilities Hooks (12)
Advanced patterns for event handling, lifecycle management, and SSR compatibility.

#### useEventListener
Type-safe global event listener management.

**Signature:**
```typescript
useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: RefObject<HTMLElement> | Window | Document,
  options?: boolean | AddEventListenerOptions
): void
```

**Features:**
- TypeScript overloads for window/element/document
- Automatic cleanup
- Latest handler execution (no stale closures)
- Options support (capture, passive, once)

**Example:**
```typescript
// Window event
useEventListener("resize", () => {
  console.log("Window resized")
})

// Element event
const buttonRef = useRef<HTMLButtonElement>(null)
useEventListener("click", (e) => {
  console.log("Button clicked")
}, buttonRef)

// Keyboard shortcuts
useEventListener("keydown", (e) => {
  if (e.metaKey && e.key === "k") {
    openCommandPalette()
  }
})
```

#### useIntersectionObserver
Visibility tracking for lazy loading and scroll triggers.

**Signature:**
```typescript
useIntersectionObserver<T extends HTMLElement>(
  elementRef: RefObject<T>,
  options?: {
    threshold?: number | number[]
    root?: Element | null
    rootMargin?: string
    freezeOnceVisible?: boolean
  }
): IntersectionObserverEntry | undefined
```

**Common Patterns:**
```typescript
// Lazy loading images
const imgRef = useRef<HTMLImageElement>(null)
const entry = useIntersectionObserver(imgRef, {
  threshold: 0.1,
  freezeOnceVisible: true // Stop observing after first visibility
})

const isVisible = entry?.isIntersecting

useEffect(() => {
  if (isVisible && !imageLoaded) {
    loadImage()
  }
}, [isVisible])

// Scroll animations
const sectionRef = useRef(null)
const entry = useIntersectionObserver(sectionRef, {
  threshold: 0.5
})

<section ref={sectionRef} className={entry?.isIntersecting ? "fade-in" : ""}>
```

#### useResizeObserver
Element size tracking without window resize listeners.

**Signature:**
```typescript
useResizeObserver<T extends HTMLElement>(options: {
  ref: RefObject<T>
  onResize?: (size: Size) => void
  box?: 'content-box' | 'border-box' | 'device-pixel-content-box'
}): {
  width: number | undefined
  height: number | undefined
}
```

**Box Models:**
- `content-box` - Content only (default)
- `border-box` - Includes padding and border
- `device-pixel-content-box` - High-DPI graphics

**Example:**
```typescript
const containerRef = useRef<HTMLDivElement>(null)
const { width, height } = useResizeObserver({
  ref: containerRef,
  box: "border-box"
})

// Responsive chart sizing
<div ref={containerRef}>
  {width && height && (
    <Chart width={width} height={height} />
  )}
</div>
```

#### useCountdown
Countdown/count-up timer with controls.

**Signature:**
```typescript
useCountdown(options: {
  countStart: number
  countStop?: number
  intervalMs?: number
  isIncrement?: boolean
}): [number, {
  startCountdown: () => void
  stopCountdown: () => void
  resetCountdown: () => void
}]
```

**Example:**
```typescript
const [count, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
  countStart: 60,
  countStop: 0,
  intervalMs: 1000
})

<div>
  <p>Time remaining: {count}s</p>
  <Button onClick={startCountdown}>Start</Button>
  <Button onClick={stopCountdown}>Pause</Button>
  <Button onClick={resetCountdown}>Reset</Button>
</div>
```

#### useEventCallback
Stable callbacks with fresh closure access (solves useCallback dependency issues).

**Signature:**
```typescript
useEventCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R
): (...args: Args) => R
```

**Problem Solved:**
```typescript
// ❌ Without useEventCallback - stale closure or excessive re-renders
const handleClick = useCallback(() => {
  console.log(count) // Stale unless count in deps
}, []) // Missing dependency warning

const handleClick = useCallback(() => {
  console.log(count) // Fresh value but new reference every render
}, [count]) // Causes child re-renders

// ✅ With useEventCallback - stable reference + fresh values
const handleClick = useEventCallback(() => {
  console.log(count) // Always fresh, reference never changes
})
```

**Use Cases:**
- Passing callbacks to memoized children
- Form handlers needing latest state
- Event listeners requiring stable references
- Complex interactions with multiple state dependencies

#### useIsClient
Detect client-side execution for SSR-safe browser API access.

**Signature:**
```typescript
useIsClient(): boolean
```

**Returns:**
- `false` during SSR and before hydration
- `true` on client after mount

**Example:**
```typescript
const isClient = useIsClient()

return (
  <div>
    {!isClient ? (
      <p>Loading...</p>
    ) : (
      <p>Window width: {window.innerWidth}px</p>
    )}
  </div>
)
```

#### useIsMounted
Check component mount status to prevent state updates on unmounted components.

**Signature:**
```typescript
useIsMounted(): () => boolean
```

**Returns:** Stable function that returns mount status

**Example:**
```typescript
const isMounted = useIsMounted()

useEffect(() => {
  fetchData().then(data => {
    if (isMounted()) {
      setData(data) // Safe - only updates if still mounted
    }
  })
}, [isMounted])
```

**Critical Notes:**
- Always call the function: `isMounted()` not `isMounted`
- Check immediately before setState
- Supplements proper useEffect cleanup, doesn't replace it

#### useIsomorphicLayoutEffect
SSR-safe layout effects (automatically switches between useLayoutEffect and useEffect).

**Signature:**
```typescript
useIsomorphicLayoutEffect(
  effect: () => void | (() => void),
  deps?: DependencyList
): void
```

**Behavior:**
- Client: Uses `useLayoutEffect` (synchronous DOM access)
- Server: Uses `useEffect` (prevents SSR warnings)

**Use Cases:**
```typescript
// DOM measurements
useIsomorphicLayoutEffect(() => {
  const height = elementRef.current?.offsetHeight
  setHeight(height)
}, [])

// Synchronous theme application
useIsomorphicLayoutEffect(() => {
  document.documentElement.classList.toggle("dark", isDark)
}, [isDark])
```

#### useReadLocalStorage
Read-only localStorage access with automatic updates.

**Signature:**
```typescript
useReadLocalStorage<T>(
  key: string,
  options?: {
    deserializer?: (value: string) => T
    initializeWithValue?: boolean
  }
): T | null | undefined
```

**Features:**
- Read-only optimization
- Cross-tab sync via storage events
- SSR-safe with `initializeWithValue: false`
- Automatic error handling

**Example:**
```typescript
// Read user preferences from another component
const theme = useReadLocalStorage<string>("theme", {
  initializeWithValue: false
})

if (theme === "dark") {
  // Apply dark styles
}
```

#### useStep
Multi-step process navigation (wizards, onboarding, forms).

**Signature:**
```typescript
useStep(maxStep: number): [number, {
  canGoToNextStep: boolean
  canGoToPrevStep: boolean
  goToNextStep: () => void
  goToPrevStep: () => void
  reset: () => void
  setStep: Dispatch<SetStateAction<number>>
}]
```

**Features:**
- 1-based numbering
- Automatic boundary validation
- Memoized navigation functions

**Example:**
```typescript
const [currentStep, {
  canGoToNextStep,
  canGoToPrevStep,
  goToNextStep,
  goToPrevStep,
  reset
}] = useStep(4)

<div>
  <p>Step {currentStep} of 4</p>
  {currentStep === 1 && <ProfileForm />}
  {currentStep === 2 && <PreferencesForm />}
  {currentStep === 3 && <ReviewForm />}
  {currentStep === 4 && <ConfirmationForm />}

  <Button onClick={goToPrevStep} disabled={!canGoToPrevStep}>
    Back
  </Button>
  <Button onClick={goToNextStep} disabled={!canGoToNextStep}>
    Next
  </Button>
</div>
```

#### useTernaryDarkMode
Three-mode theme management: light, dark, system.

**Signature:**
```typescript
useTernaryDarkMode(options?: {
  defaultValue?: 'system' | 'dark' | 'light'
  localStorageKey?: string
  initializeWithValue?: boolean
}): {
  isDarkMode: boolean
  ternaryDarkMode: 'system' | 'dark' | 'light'
  setTernaryDarkMode: Dispatch<SetStateAction<TernaryDarkMode>>
  toggleTernaryDarkMode: () => void
}
```

**Features:**
- Three modes: light → system → dark → light
- System mode respects OS preference
- localStorage persistence
- Automatic OS theme change detection

**Example:**
```typescript
const {
  isDarkMode,
  ternaryDarkMode,
  toggleTernaryDarkMode
} = useTernaryDarkMode({
  initializeWithValue: false
})

<Select value={ternaryDarkMode} onValueChange={setTernaryDarkMode}>
  <SelectItem value="light">Light</SelectItem>
  <SelectItem value="dark">Dark</SelectItem>
  <SelectItem value="system">System</SelectItem>
</Select>

<Button onClick={toggleTernaryDarkMode}>
  {ternaryDarkMode === "light" && <Sun />}
  {ternaryDarkMode === "dark" && <Moon />}
  {ternaryDarkMode === "system" && <Monitor />}
</Button>
```

#### useUnmount
Execute cleanup only on component unmount.

**Signature:**
```typescript
useUnmount(fn: () => void): void
```

**Features:**
- Runs exclusively on unmount (not re-renders)
- Latest closure access
- Strict function validation
- Multiple calls supported

**Example:**
```typescript
useUnmount(() => {
  // Cancel API requests
  abortController.abort()

  // Disconnect WebSocket
  socket.disconnect()

  // Clear timers
  clearTimeout(timerId)

  // Remove event listeners
  window.removeEventListener("resize", handler)
})
```

## Next.js 16 Integration Patterns

### SSR-Safe Hook Usage

**Always set `initializeWithValue: false` for SSR hooks:**

```typescript
// ✅ CORRECT - Prevents hydration mismatch
const [theme] = useLocalStorage("theme", "light", {
  initializeWithValue: false
})

const isMobile = useMediaQuery("(max-width: 768px)", {
  initializeWithValue: false,
  defaultValue: false
})

// ❌ WRONG - Will cause hydration errors
const [theme] = useLocalStorage("theme", "light")
```

### Client Component Boundary

Mark components using browser-dependent hooks with `"use client"`:

```typescript
"use client"

import { useLocalStorage } from "@/hooks/use-local-storage"
import { useMediaQuery } from "@/hooks/use-media-query"

export function ClientComponent() {
  const [value] = useLocalStorage("key", "default", {
    initializeWithValue: false
  })

  return <div>{value}</div>
}
```

### Server Component Pattern

Keep server components pure, move hooks to client children:

```typescript
// app/page.tsx (Server Component)
import { ClientPreferences } from "@/components/client-preferences"

export default function Page() {
  return (
    <div>
      <h1>Server Content</h1>
      <ClientPreferences /> {/* Client boundary */}
    </div>
  )
}

// components/client-preferences.tsx
"use client"

import { useLocalStorage } from "@/hooks/use-local-storage"

export function ClientPreferences() {
  const [theme] = useLocalStorage("theme", "light", {
    initializeWithValue: false
  })

  return <div>Theme: {theme}</div>
}
```

## Common Patterns

### Form State Management

```typescript
"use client"

export function ContactForm() {
  // Persist form draft to sessionStorage
  const [formData, setFormData] = useSessionStorage("contact-form", {
    name: "",
    email: "",
    message: ""
  })

  // Debounce email validation
  const debouncedEmail = useDebounceValue(formData.email, 500)

  useEffect(() => {
    if (debouncedEmail) {
      validateEmail(debouncedEmail)
    }
  }, [debouncedEmail])

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          name: e.target.value
        }))}
      />
      {/* ... */}
    </form>
  )
}
```

### Responsive Layout

```typescript
"use client"

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 768px)", {
    initializeWithValue: false
  })

  const isTablet = useMediaQuery(
    "(min-width: 769px) and (max-width: 1024px)",
    { initializeWithValue: false }
  )

  const isDesktop = useMediaQuery("(min-width: 1025px)", {
    initializeWithValue: false
  })

  return (
    <div className={cn({
      "mobile-layout": isMobile,
      "tablet-layout": isTablet,
      "desktop-layout": isDesktop
    })}>
      {children}
    </div>
  )
}
```

### Infinite Scroll

```typescript
"use client"

export function InfiniteList() {
  const [items, setItems] = useState<Item[]>([])
  const loaderRef = useRef<HTMLDivElement>(null)

  const entry = useIntersectionObserver(loaderRef, {
    threshold: 0.1
  })

  const isVisible = entry?.isIntersecting

  useEffect(() => {
    if (isVisible) {
      loadMoreItems().then(newItems => {
        setItems(prev => [...prev, ...newItems])
      })
    }
  }, [isVisible])

  return (
    <div>
      {items.map(item => <ItemCard key={item.id} item={item} />)}
      <div ref={loaderRef}>Loading...</div>
    </div>
  )
}
```

### Modal with Scroll Lock

```typescript
"use client"

export function Modal({ open, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const { lock, unlock } = useScrollLock({
    autoLock: false
  })

  useEffect(() => {
    if (open) {
      lock()
    } else {
      unlock()
    }
  }, [open, lock, unlock])

  useOnClickOutside(modalRef, onClose)

  useEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      onClose()
    }
  })

  if (!open) return null

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-content">
        {/* Modal content */}
      </div>
    </div>
  )
}
```

### Real-time Dashboard

```typescript
"use client"

export function LiveDashboard() {
  const [data, setData] = useState<DashboardData>()
  const [isPolling, setIsPolling] = useState(true)

  // Poll API every 5 seconds
  useInterval(
    async () => {
      const newData = await fetchDashboardData()
      setData(newData)
    },
    isPolling ? 5000 : null
  )

  // Auto-refresh countdown
  const [countdown, { resetCountdown }] = useCountdown({
    countStart: 5,
    countStop: 0,
    intervalMs: 1000
  })

  useEffect(() => {
    if (countdown === 0) {
      resetCountdown()
    }
  }, [countdown, resetCountdown])

  return (
    <div>
      <p>Next refresh in {countdown}s</p>
      <Button onClick={() => setIsPolling(!isPolling)}>
        {isPolling ? "Pause" : "Resume"}
      </Button>
      {/* Dashboard content */}
    </div>
  )
}
```

## TypeScript Best Practices

### Generic Type Inference

```typescript
// Let TypeScript infer types when possible
const [user, setUser] = useLocalStorage("user", {
  id: "",
  name: ""
}) // Type inferred as { id: string; name: string }

// Explicit typing for complex types
interface User {
  id: string
  name: string
  preferences: UserPreferences
}

const [user, setUser] = useLocalStorage<User>("user", defaultUser)
```

### Custom Serialization for Complex Types

```typescript
const [date, setDate] = useLocalStorage<Date>("last-visit", new Date(), {
  serializer: (date) => date.toISOString(),
  deserializer: (str) => new Date(str)
})

const [map, setMap] = useLocalStorage<Map<string, number>>("cache", new Map(), {
  serializer: (map) => JSON.stringify(Array.from(map.entries())),
  deserializer: (str) => new Map(JSON.parse(str))
})
```

### Type-Safe Event Listeners

```typescript
// Window events - fully typed
useEventListener("resize", (event) => {
  // event is WindowEventMap["resize"]
  console.log(event.target)
})

// Element events - specify element type
const buttonRef = useRef<HTMLButtonElement>(null)
useEventListener("click", (event) => {
  // event is HTMLElementEventMap["click"]
  event.currentTarget // HTMLButtonElement
}, buttonRef)
```

## Performance Optimization

### Memoization Strategy

```typescript
// ✅ Use memoized hooks for child components
const Child = memo(({ onClick }: { onClick: () => void }) => {
  return <Button onClick={onClick}>Click</Button>
})

export function Parent() {
  const [count, setCount] = useState(0)

  // Stable reference + fresh closure
  const handleClick = useEventCallback(() => {
    console.log(count) // Always latest count
    setCount(count + 1)
  })

  return <Child onClick={handleClick} /> // No re-render on count change
}
```

### Debounce Expensive Operations

```typescript
// Search input with API calls
export function SearchInput() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounceValue(query, 300)

  useEffect(() => {
    if (debouncedQuery) {
      // Only calls API after 300ms of no typing
      searchAPI(debouncedQuery)
    }
  }, [debouncedQuery])

  return <Input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

### Lazy Loading with Intersection Observer

```typescript
export function LazyImage({ src, alt }: ImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [imageSrc, setImageSrc] = useState<string>()

  const entry = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    freezeOnceVisible: true // Stop observing after visible
  })

  useEffect(() => {
    if (entry?.isIntersecting && !imageSrc) {
      setImageSrc(src) // Load image only when visible
    }
  }, [entry, src, imageSrc])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      loading="lazy"
    />
  )
}
```

## Accessibility Considerations

### Respect User Preferences

```typescript
export function AnimatedComponent() {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", {
    initializeWithValue: false
  })

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3 // No animation if user prefers
      }}
    />
  )
}
```

### Focus Management

```typescript
export function Dialog({ open }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && dialogRef.current) {
      const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [open])

  useEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      // Trap focus within dialog
      trapFocus(e, dialogRef.current)
    }
  })

  return <div ref={dialogRef} role="dialog" aria-modal="true" />
}
```

## Error Handling

### localStorage Quota Errors

```typescript
export function SafeStorageComponent() {
  const [data, setData, remove] = useLocalStorage("large-data", [], {
    serializer: (value) => {
      try {
        return JSON.stringify(value)
      } catch (error) {
        console.error("Serialization failed:", error)
        return "[]"
      }
    },
    deserializer: (value) => {
      try {
        return JSON.parse(value)
      } catch (error) {
        console.error("Deserialization failed:", error)
        return []
      }
    }
  })

  const handleAdd = (item: Item) => {
    try {
      setData(prev => [...prev, item])
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        // Handle quota exceeded
        alert("Storage quota exceeded. Please clear some data.")
        remove() // Clear storage
      }
    }
  }

  return <div>{/* ... */}</div>
}
```

### Safe API Calls with Mount Check

```typescript
export function DataFetcher() {
  const [data, setData] = useState<Data>()
  const isMounted = useIsMounted()

  useEffect(() => {
    let abortController = new AbortController()

    fetchData({ signal: abortController.signal })
      .then(result => {
        if (isMounted()) {
          setData(result) // Only update if still mounted
        }
      })
      .catch(error => {
        if (error.name !== "AbortError" && isMounted()) {
          console.error(error)
        }
      })

    return () => abortController.abort()
  }, [isMounted])

  return <div>{data?.content}</div>
}
```

## Testing Considerations

### Mock Window APIs

```typescript
// tests/setup.ts
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}))

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
```

### Test Hook Behavior

```typescript
import { renderHook, act } from "@testing-library/react"
import { useCounter } from "@/hooks/use-counter"

test("useCounter increments", () => {
  const { result } = renderHook(() => useCounter(0))

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

## When to Use Each Hook

### State Management
- **useLocalStorage**: User preferences, theme, auth tokens (cross-session)
- **useSessionStorage**: Form drafts, wizard state, tab-specific data
- **useBoolean**: Modal visibility, toggle switches, loading states
- **useCounter**: Pagination, step indicators, quantity selectors
- **useToggle**: Simple on/off states, accordion panels
- **useMap**: Entity lookups, caching, dynamic key-value state

### Browser APIs
- **useMediaQuery**: Responsive breakpoints, user preferences
- **useWindowSize**: Adaptive layouts, chart resizing
- **useDarkMode**: Theme management with OS sync
- **useCopyToClipboard**: Share buttons, code snippets
- **useScript**: Third-party libraries (Stripe, Google Maps)
- **useScreen**: Display capabilities, orientation
- **useDocumentTitle**: Notification badges, page context
- **useScrollLock**: Modals, side panels, overlays

### UI Interactions
- **useOnClickOutside**: Dropdowns, popovers, modals
- **useHover**: Tooltips, action reveals, previews
- **useMousePosition**: Custom cursors, drag tracking
- **useClickAnyWhere**: Global interactions, analytics

### Performance
- **useDebounceValue**: Search inputs, live validation
- **useDebounceCallback**: Auto-save, API throttling
- **useInterval**: Polling, countdowns, live updates
- **useTimeout**: Auto-hide, delayed actions

### Advanced Utilities
- **useEventListener**: Keyboard shortcuts, global events
- **useIntersectionObserver**: Lazy loading, scroll animations
- **useResizeObserver**: Responsive components, charts
- **useCountdown**: Timers, auctions, sessions
- **useEventCallback**: Stable callbacks with fresh state
- **useIsClient**: SSR safety checks
- **useIsMounted**: Async operation safety
- **useIsomorphicLayoutEffect**: Synchronous DOM access
- **useReadLocalStorage**: Read-only storage access
- **useStep**: Wizards, onboarding, forms
- **useTernaryDarkMode**: Three-mode theming
- **useUnmount**: Cleanup on unmount

## Related Documentation

- [shadcn/ui Hooks Library](https://www.shadcn.io/hooks) - Official hooks documentation
- [Next.js 16 Expert](../.claude/skills/nextjs-16-expert/SKILL.md) - Next.js patterns and Server Components
- [shadcn Component Builder](../.claude/skills/shadcn-component-builder/SKILL.md) - Component integration
- [Tailwind v4 Expert](../.claude/skills/tailwind-v4-expert/SKILL.md) - Styling patterns
- [Jusbro Patterns](../.claude/skills/jusbro-patterns/SKILL.md) - Project conventions

## Installation Reference

```bash
# State Management
npx shadcn@latest add https://www.shadcn.io/registry/use-local-storage.json
npx shadcn@latest add https://www.shadcn.io/registry/use-session-storage.json
npx shadcn@latest add https://www.shadcn.io/registry/use-boolean.json
npx shadcn@latest add https://www.shadcn.io/registry/use-counter.json
npx shadcn@latest add https://www.shadcn.io/registry/use-toggle.json
npx shadcn@latest add https://www.shadcn.io/registry/use-map.json

# Browser APIs
npx shadcn@latest add https://www.shadcn.io/registry/use-media-query.json
npx shadcn@latest add https://www.shadcn.io/registry/use-window-size.json
npx shadcn@latest add https://www.shadcn.io/registry/use-dark-mode.json
npx shadcn@latest add https://www.shadcn.io/registry/use-copy-to-clipboard.json
npx shadcn@latest add https://www.shadcn.io/registry/use-script.json
npx shadcn@latest add https://www.shadcn.io/registry/use-screen.json
npx shadcn@latest add https://www.shadcn.io/registry/use-document-title.json
npx shadcn@latest add https://www.shadcn.io/registry/use-scroll-lock.json

# UI Interactions
npx shadcn@latest add https://www.shadcn.io/registry/use-on-click-outside.json
npx shadcn@latest add https://www.shadcn.io/registry/use-hover.json
npx shadcn@latest add https://www.shadcn.io/registry/use-mouse-position.json
npx shadcn@latest add https://www.shadcn.io/registry/use-click-anywhere.json

# Performance
npx shadcn@latest add https://www.shadcn.io/registry/use-debounce-value.json
npx shadcn@latest add https://www.shadcn.io/registry/use-debounce-callback.json
npx shadcn@latest add https://www.shadcn.io/registry/use-interval.json
npx shadcn@latest add https://www.shadcn.io/registry/use-timeout.json

# Advanced Utilities
npx shadcn@latest add https://www.shadcn.io/registry/use-event-listener.json
npx shadcn@latest add https://www.shadcn.io/registry/use-intersection-observer.json
npx shadcn@latest add https://www.shadcn.io/registry/use-resize-observer.json
npx shadcn@latest add https://www.shadcn.io/registry/use-countdown.json
npx shadcn@latest add https://www.shadcn.io/registry/use-event-callback.json
npx shadcn@latest add https://www.shadcn.io/registry/use-is-client.json
npx shadcn@latest add https://www.shadcn.io/registry/use-is-mounted.json
npx shadcn@latest add https://www.shadcn.io/registry/use-isomorphic-layout-effect.json
npx shadcn@latest add https://www.shadcn.io/registry/use-read-local-storage.json
npx shadcn@latest add https://www.shadcn.io/registry/use-step.json
npx shadcn@latest add https://www.shadcn.io/registry/use-ternary-dark-mode.json
npx shadcn@latest add https://www.shadcn.io/registry/use-unmount.json
```
