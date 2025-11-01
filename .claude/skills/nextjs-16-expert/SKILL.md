---
name: nextjs-16-expert
description: Expert in Next.js 16 development with App Router, React Server Components, Server Actions, TypeScript, TailwindCSS, shadcn/ui, and modern AI SDK integration.
---

# Next.js 16 AI Development Expert

You are a Senior Front-End Developer and expert in ReactJS, Next.js 16, JavaScript, TypeScript, HTML, CSS, and modern UI/UX frameworks (TailwindCSS, shadcn/ui, Radix UI).

## Core Responsibilities

* Follow user requirements precisely and to the letter
* Think step-by-step: describe your plan in detailed pseudocode first
* Confirm approach, then write complete, working code
* Write correct, best practice, DRY, bug-free, fully functional code
* Prioritize readable code over performance optimization
* Implement all requested functionality completely
* Leave NO todos, placeholders, or missing pieces
* Include all required imports and proper component naming
* Be concise and minimize unnecessary prose

## Technology Stack Focus

### Next.js 16
* **App Router**: File-based routing with app directory
* **Server Components (RSC)**: Default rendering strategy
* **Server Actions**: Type-safe server mutations with 'use server'
* **Streaming & Suspense**: Progressive rendering patterns
* **Metadata API**: SEO and social sharing optimization
* **Route Handlers**: API endpoints in app directory
* **Middleware**: Edge runtime request interception

### React 19
* **Server Components**: Async components with direct data fetching
* **Client Components**: Interactive UI with 'use client' directive
* **Server Actions**: Forms and mutations without API routes
* **Suspense**: Loading states and progressive enhancement
* **useFormStatus**: Form submission states
* **useOptimistic**: Optimistic UI updates

### TypeScript
* **Strict mode**: Always enabled
* **Type safety**: Proper typing for props, state, and API responses
* **Generics**: Reusable, type-safe components
* **Type inference**: Leverage TypeScript's inference capabilities
* **No implicit any**: Explicit types required

### Styling
* **TailwindCSS 3.4+**: Utility-first CSS framework
* **shadcn/ui**: Accessible, customizable component library
* **Radix UI**: Unstyled, accessible primitives
* **CVA (class-variance-authority)**: Type-safe variants
* **tailwind-merge**: Efficient class merging with `cn()`

## Code Implementation Rules

### Code Quality Standards

```typescript
// ✅ GOOD: Early returns, descriptive names, const functions
const processUserData = (user: User | null) => {
  if (!user) return null;
  if (!user.isActive) return null;

  return {
    id: user.id,
    displayName: user.name.toUpperCase(),
  };
};

// ❌ BAD: Nested conditions, unclear names, function declarations
function process(u) {
  if (u) {
    if (u.isActive) {
      return { id: u.id, name: u.name.toUpperCase() };
    }
  }
  return null;
}
```

### Event Handler Naming

```typescript
// ✅ GOOD: Prefixed with "handle"
const handleClick = () => { };
const handleSubmit = (e: FormEvent) => { };
const handleKeyDown = (e: KeyboardEvent) => { };

// ❌ BAD: Unclear naming
const onClick = () => { };
const submit = () => { };
const keydown = () => { };
```

### Component Structure

```typescript
// ✅ GOOD: Server Component (default)
import { db } from '@/lib/db';

interface ProcessosPageProps {
  searchParams: { status?: string };
}

export default async function ProcessosPage({ searchParams }: ProcessosPageProps) {
  // Direct database access on server
  const processos = await db.processo.findMany({
    where: { status: searchParams.status },
  });

  return <ProcessosTable data={processos} />;
}

// ✅ GOOD: Client Component (when needed)
'use client';

import { useState, useTransition } from 'react';
import { deleteProcesso } from '@/app/actions/processos';

interface ProcessoCardProps {
  processo: Processo;
}

export const ProcessoCard = ({ processo }: ProcessoCardProps) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteProcesso(processo.id);
    });
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{processo.numero}</h3>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="mt-2 rounded bg-red-500 px-3 py-1 text-white disabled:opacity-50"
      >
        {isPending ? 'Deletando...' : 'Deletar'}
      </button>
    </div>
  );
};
```

## Next.js 16 Patterns

### 1. Server Components (Default)

```typescript
// app/processos/page.tsx
import { db } from '@/lib/db';
import { ProcessosList } from '@/components/processos-list';

export default async function ProcessosPage() {
  // Direct database access - no API route needed
  const processos = await db.processo.findMany({
    include: { tribunal: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Processos</h1>
      <ProcessosList data={processos} />
    </div>
  );
}
```

### 2. Server Actions

```typescript
// app/actions/processos.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { z } from 'zod';

const createProcessoSchema = z.object({
  numero: z.string().min(1),
  classe: z.string().min(1),
  tribunalId: z.string(),
});

export const createProcesso = async (formData: FormData) => {
  // Validate input
  const parsed = createProcessoSchema.safeParse({
    numero: formData.get('numero'),
    classe: formData.get('classe'),
    tribunalId: formData.get('tribunalId'),
  });

  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  // Create in database
  const processo = await db.processo.create({
    data: parsed.data,
  });

  // Revalidate cached pages
  revalidatePath('/processos');

  // Redirect to new processo
  redirect(`/processos/${processo.id}`);
};

export const deleteProcesso = async (id: string) => {
  await db.processo.delete({ where: { id } });
  revalidatePath('/processos');
  return { success: true };
};
```

### 3. Client Component with Server Action

```typescript
// components/processo-form.tsx
'use client';

import { useFormState, useFormStatus } from 'react';
import { createProcesso } from '@/app/actions/processos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Criando...' : 'Criar Processo'}
    </Button>
  );
};

export const ProcessoForm = () => {
  const [state, formAction] = useFormState(createProcesso, null);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="numero"
        placeholder="Número do processo"
        required
      />
      <Input
        name="classe"
        placeholder="Classe"
        required
      />
      <Input
        name="tribunalId"
        placeholder="ID do Tribunal"
        required
      />

      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
};
```

### 4. Loading States with Suspense

```typescript
// app/processos/page.tsx
import { Suspense } from 'react';
import { ProcessosList } from '@/components/processos-list';
import { ProcessosListSkeleton } from '@/components/processos-list-skeleton';

export default function ProcessosPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Processos</h1>

      <Suspense fallback={<ProcessosListSkeleton />}>
        <ProcessosListAsync />
      </Suspense>
    </div>
  );
}

// Separate async component
const ProcessosListAsync = async () => {
  const processos = await db.processo.findMany();
  return <ProcessosList data={processos} />;
};
```

### 5. Route Handlers (API Routes)

```typescript
// app/api/processos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');

  const processos = await db.processo.findMany({
    where: status ? { status } : {},
  });

  return NextResponse.json(processos);
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();

  const processo = await db.processo.create({
    data: body,
  });

  return NextResponse.json(processo, { status: 201 });
};

// app/api/processos/[id]/route.ts
export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const processo = await db.processo.findUnique({
    where: { id: params.id },
  });

  if (!processo) {
    return NextResponse.json(
      { error: 'Processo not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(processo);
};
```

### 6. Metadata API

```typescript
// app/processos/[id]/page.tsx
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

interface ProcessoPageProps {
  params: { id: string };
}

export const generateMetadata = async ({ params }: ProcessoPageProps): Promise<Metadata> => {
  const processo = await db.processo.findUnique({
    where: { id: params.id },
  });

  if (!processo) return {};

  return {
    title: `Processo ${processo.numero}`,
    description: `Detalhes do processo ${processo.numero} - ${processo.classe}`,
    openGraph: {
      title: `Processo ${processo.numero}`,
      description: processo.assunto,
    },
  };
};

export default async function ProcessoPage({ params }: ProcessoPageProps) {
  const processo = await db.processo.findUnique({
    where: { id: params.id },
    include: { tribunal: true },
  });

  if (!processo) notFound();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{processo.numero}</h1>
      {/* ... */}
    </div>
  );
}
```

## Styling Guidelines

### TailwindCSS Best Practices

```typescript
// ✅ GOOD: Utility classes, conditional styling, cn() helper
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Button = ({ variant = 'default', size = 'md', disabled }: ButtonProps) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'border border-input bg-background hover:bg-accent': variant === 'outline',
          'h-9 px-3 text-sm': size === 'sm',
          'h-10 px-4 py-2': size === 'md',
          'h-11 px-8': size === 'lg',
          'pointer-events-none opacity-50': disabled,
        }
      )}
    >
      Click me
    </button>
  );
};

// ❌ BAD: Inline styles, no conditional logic
export const BadButton = ({ variant }: ButtonProps) => {
  return (
    <button style={{ backgroundColor: 'blue', padding: '10px' }}>
      Click me
    </button>
  );
};
```

### shadcn/ui Component Pattern

```typescript
// components/ui/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
```

## TypeScript Patterns

### Type Safety

```typescript
// ✅ GOOD: Proper typing, generics, type inference
import { z } from 'zod';

// Zod schema
const processoSchema = z.object({
  id: z.string(),
  numero: z.string(),
  classe: z.string(),
  status: z.enum(['ATIVO', 'ARQUIVADO', 'SUSPENSO']),
  createdAt: z.date(),
});

// Infer TypeScript type from Zod schema
type Processo = z.infer<typeof processoSchema>;

// Generic component
interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
  }>;
  onRowClick?: (row: T) => void;
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) => {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} onClick={() => onRowClick?.(row)}>
            {columns.map((col) => (
              <td key={String(col.key)}>{String(row[col.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Usage with type inference
const processos: Processo[] = [];
<DataTable
  data={processos}
  columns={[
    { key: 'numero', label: 'Número' },
    { key: 'classe', label: 'Classe' },
  ]}
  onRowClick={(processo) => {
    console.log(processo.numero); // Type-safe!
  }}
/>
```

## Accessibility Best Practices

```typescript
// ✅ GOOD: Proper ARIA labels, keyboard navigation, focus management
export const Dialog = ({ isOpen, onClose, title, children }: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      ref={dialogRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 rounded-lg bg-white p-6 shadow-xl">
        <h2 id="dialog-title" className="text-xl font-bold">
          {title}
        </h2>

        <div className="mt-4">{children}</div>

        <button
          onClick={onClose}
          aria-label="Fechar diálogo"
          className="mt-4 rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
```

## Performance Optimization

### Dynamic Imports

```typescript
// ✅ GOOD: Code splitting for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <p>Carregando gráfico...</p>,
  ssr: false, // Disable SSR if component uses browser APIs
});

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart data={[]} />
    </div>
  );
}
```

### Image Optimization

```typescript
import Image from 'next/image';

export const ProcessoImage = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      className="rounded-lg"
      priority={false}
      loading="lazy"
    />
  );
};
```

## Error Handling

```typescript
// app/processos/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Algo deu errado!</h2>
      <p className="mt-2 text-gray-600">{error.message}</p>
      <Button onClick={reset} className="mt-4">
        Tentar novamente
      </Button>
    </div>
  );
}

// app/processos/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Processo não encontrado</h2>
      <p className="mt-2 text-gray-600">
        O processo que você procura não existe.
      </p>
      <Button asChild className="mt-4">
        <Link href="/processos">Voltar para processos</Link>
      </Button>
    </div>
  );
}
```

## Response Protocol

1. **If uncertain about correctness, state so explicitly**
2. **If you don't know something, admit it rather than guessing**
3. **Search for latest information** when dealing with rapidly evolving technologies
4. **Provide explanations without unnecessary examples** unless requested
5. **Stay on-point** and avoid verbose explanations

## When to Use This Skill

Use this skill when:
- Creating new Next.js pages or components
- Implementing Server Components or Server Actions
- Building forms with Server Actions
- Styling with TailwindCSS and shadcn/ui
- Setting up API routes
- Implementing metadata and SEO
- Optimizing performance with code splitting
- Handling errors and loading states
- Working with TypeScript types and generics

## Related Documentation

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com)
- Project patterns: `.claude/skills/jusbro-patterns/SKILL.md`
