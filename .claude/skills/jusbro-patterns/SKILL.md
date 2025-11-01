---
name: jusbro-patterns
description: Architectural patterns, code conventions, and best practices for the Jusbro project - a Browserless fork with Next.js dashboard for legal automation.
---

# Jusbro Project Patterns

This skill enforces project-specific patterns, conventions, and architectural decisions for the Jusbro codebase.

## Project Overview

Jusbro is a **Browserless fork** with three main components:
1. **Core Browserless Platform**: Headless browser service
2. ** Legal Automation**: Scripts for Brazilian legal process scraping
3. **Next.js Dashboard**: Modern UI for credentials and workflow management

## Tech Stack Summary

**Frontend:**
- Next.js 16 (App Router + RSC)
- React 19 with TypeScript 5.9
- Tailwind CSS 3.4 + Radix UI + shadcn patterns
- React Hook Form + Zod validation

**Backend:**
- Node.js 24 (strict range: `>= 24 < 25`)
- Puppeteer 24.26.1 + Playwright 1.56.1
- Prisma 6.18.0 with PostgreSQL
- TypeScript strict mode

**Automation:**
- `puppeteer-extra` with Stealth plugin
- Custom PJE scrapers in `server/scripts/pje-tj/`

## Code Style Conventions

### 1. Formatting (Prettier enforced)
```javascript
// ✅ Correct
const config = {
  semicolons: true,
  quotes: 'single',
  trailingComma: 'all',
  lineWidth: 80,
  indentation: 2,
};

// ❌ Wrong
const config = {
  semicolons: false,  // Missing semicolons
  quotes: "double",   // Double quotes
  trailingComma: 'none', // No trailing comma
}
```

### 2. Naming Conventions

```typescript
// Files: kebab-case
// ✅ server/scripts/pje-tj/tjmg/1g/raspar-acervo-geral.js
// ✅ app/(dashboard)/pje/processos/page.tsx
// ❌ server/scripts/PJE_TJ/TJMG/RasparAcervo.js

// Functions/variables: camelCase
const fetchProcessos = async () => { }; // ✅
const FetchProcessos = async () => { }; // ❌

// Types/Interfaces: PascalCase
interface ProcessoData { }  // ✅
interface processoData { }  // ❌

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;  // ✅
const maxRetries = 3;   // ❌
```

### 3. TypeScript Rules

```typescript
// ✅ Strict mode enabled - no 'any' without explicit override
function processData(data: ProcessoData): Result {
  return { success: true };
}

// ❌ Using 'any'
function processData(data: any): any {
  return data;
}

// ✅ Null checks required
const value: string | null = getData();
if (value !== null) {
  console.log(value.toUpperCase());
}

// ❌ No null check
const value = getData();
console.log(value.toUpperCase()); // Error if strict mode
```

### 4. Import Organization (ESLint enforced)

```typescript
// ✅ Correct order: sorted alphabetically, grouped by type
import { mkdir } from 'fs/promises';
import { writeFileSync } from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { processData } from '@/lib/utils';
import type { ProcessoData } from '@/lib/types';

// ❌ Wrong: not sorted
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { processData } from '@/lib/utils';
import puppeteer from 'puppeteer-extra';
```

## Architectural Patterns

### 1. File Organization

```
app/                         # Next.js routes (App Router)
├── (dashboard)/             # Dashboard layout group
│   └── pje/
│       ├── processos/       # Processos page
│       └── credentials/     # Credentials management
├── actions/                 # Server actions
│   └── pje.ts              # PJE server actions
└── api/                     # API routes

components/                  # Shared UI (shadcn style)
├── ui/                     # Base components (button, table, etc.)
└── pje/                    # PJE-specific components

lib/                        # Shared utilities
├── services/               # Service clients
├── types/                  # TypeScript types
└── utils/                  # Helper functions

server/                     # Browserless service
├── src/                    # TypeScript source
├── scripts/pje-tj/         # PJE automation scripts
│   ├── tjmg/              # TJMG-specific
│   │   ├── common/        # Shared utilities
│   │   ├── 1g/            # First instance
│   │   └── 2g/            # Second instance
│   └── tjes/              # TJES-specific
└── build/                  # Compiled output

prisma/                     # Database schema
data/pje/                   # Scraped data output
```

### 2. Next.js Patterns

**Server Actions (use server directive):**
```typescript
// app/actions/pje.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function saveCredentials(data: CredentialData) {
  // Server-side logic
  await db.credential.create({ data });

  // Revalidate cached pages
  revalidatePath('/pje/credentials');

  return { success: true };
}
```

**Server Components (default):**
```typescript
// app/(dashboard)/pje/processos/page.tsx
import { db } from '@/lib/db';

export default async function ProcessosPage() {
  // Fetch data directly on server
  const processos = await db.processo.findMany();

  return <ProcessosTable data={processos} />;
}
```

**Client Components (use client directive):**
```typescript
// components/pje/processo-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function ProcessoForm() {
  const [loading, setLoading] = useState(false);
  const form = useForm();

  // Client-side interactivity
  return <form>...</form>;
}
```

### 3. PJE Script Patterns

**Standard script template:**
```javascript
/**
 * [Script Purpose]
 *
 * USAGE:
 * PJE_CPF="..." PJE_SENHA="..." PJE_LOGIN_URL="..." node script.js
 *
 * OUTPUT:
 * Saves to data/pje/{tribunal}/{instance}/{category}/YYYY-MM-DD-HHmmss.json
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';

puppeteer.use(StealthPlugin());

// Environment variables
const CPF = process.env.PJE_CPF;
const SENHA = process.env.PJE_SENHA;
const LOGIN_URL = process.env.PJE_LOGIN_URL;
const BASE_URL = process.env.PJE_BASE_URL;

// Validation
if (!CPF || !SENHA || !LOGIN_URL) {
  console.error('❌ Missing env vars: PJE_CPF, PJE_SENHA, PJE_LOGIN_URL');
  process.exit(1);
}

// Output file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const OUTPUT_FILE = process.env.PJE_OUTPUT_FILE ||
  `data/pje/tjmg/1g/acervo/${timestamp}.json`;

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page = await browser.newPage();

    // Your automation logic here
    console.log('🚀 Starting automation...');

    // Save results
    await mkdir(OUTPUT_FILE.substring(0, OUTPUT_FILE.lastIndexOf('/')), {
      recursive: true,
    });
    writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`✅ Saved to ${OUTPUT_FILE}`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
```

### 4. Database Patterns (Prisma)

**Schema conventions:**
```prisma
// prisma/schema.prisma

model Tribunal {
  id        String   @id @default(cuid())
  codigo    String   @unique // TJMG, TJES, TRT3
  nome      String
  baseUrl   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  credentials Credential[]

  @@map("tribunals")
}

model Credential {
  id         String    @id @default(cuid())
  tribunalId String
  cpf        String
  senha      String    // Encrypted in production
  ativo      Boolean   @default(true)
  createdAt  DateTime  @default(now())

  tribunal   Tribunal  @relation(fields: [tribunalId], references: [id])

  @@map("credentials")
}
```

**Service pattern:**
```typescript
// lib/services/tribunal-service.ts

import { db } from '@/lib/db';

export class TribunalService {
  static async findByCodigo(codigo: string) {
    return db.tribunal.findUnique({
      where: { codigo },
      include: { credentials: true },
    });
  }

  static async getActiveCredentials(tribunalId: string) {
    return db.credential.findMany({
      where: {
        tribunalId,
        ativo: true,
      },
    });
  }
}
```

### 5. UI Component Patterns (shadcn style)

**Base component (Radix UI + CVA):**
```typescript
// components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-input bg-background',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

**Feature component:**
```typescript
// components/pje/processo-table.tsx
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Processo } from '@/lib/types/processo';

interface ProcessoTableProps {
  data: Processo[];
}

export function ProcessoTable({ data }: ProcessoTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead>Assunto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((processo) => (
          <TableRow key={processo.id}>
            <TableCell>{processo.numero}</TableCell>
            <TableCell>{processo.classe}</TableCell>
            <TableCell>{processo.assunto}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Build & Development Patterns

### 1. Environment Variables

```bash
# .env.example template
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# PJE Credentials (for testing only - use DB in production)
PJE_CPF="12345678900"
PJE_SENHA="password"

# PJE URLs
PJE_LOGIN_URL="https://pje.tjmg.jus.br/pje/login.seam"
PJE_BASE_URL="https://pje.tjmg.jus.br"
PJE_API_URL="https://pje.tjmg.jus.br/pje-comum-api/api"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3003"
```

### 2. Build Commands

```bash
# Development
npm run dev              # Build + start with .env
npm run build:dev        # Build dev assets

# Production
npm run build            # Full production build
npm start                # Start built app

# Testing
npm test                 # Mocha test suite
npm run test:ux          # UI tests (accessibility + responsive)
npm run coverage         # Coverage report

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio

# Browsers
npm run install:browsers # Install Playwright browsers
```

### 3. Git Commit Conventions

Follow conventional commits from repo history:

```bash
# Feature
git commit -m "feat(pje): add TJES expedientes scraper"

# Fix
git commit -m "fix(tjmg): handle Bad Request after login"

# Chore
git commit -m "chore(deps): update puppeteer to 24.26.1"
git commit -m "chore(config): update prettier rules"

# Docs
git commit -m "docs(pje): update CAPTCHA solving guide"

# Refactor
git commit -m "refactor(scraper): extract common login logic"
```

## Testing Patterns

### 1. Mocha Tests (Backend)

```typescript
// server/src/utils/scraper.spec.ts
import { expect } from 'chai';
import { ScraperUtils } from './scraper';

describe('ScraperUtils', () => {
  it('should parse processo number', () => {
    const numero = ScraperUtils.parseNumero('0000123-45.2023.5.03.0001');
    expect(numero).to.equal('0000123-45.2023.5.03.0001');
  });

  it('should handle invalid input', () => {
    expect(() => ScraperUtils.parseNumero('')).to.throw();
  });
});
```

### 2. React Testing Library (Frontend)

```typescript
// components/pje/processo-table.test.tsx
import { render, screen } from '@testing-library/react';
import { ProcessoTable } from './processo-table';

describe('ProcessoTable', () => {
  it('renders processos', () => {
    const data = [
      { id: '1', numero: '123', classe: 'RT', assunto: 'Test' },
    ];

    render(<ProcessoTable data={data} />);

    expect(screen.getByText('123')).toBeInTheDocument();
  });
});
```

## OpenSpec Integration

This project uses OpenSpec for change management:

**When to create a proposal:**
- New features or capabilities
- Breaking changes (API, schema)
- Architecture changes
- Performance optimizations (that change behavior)

**Skip proposal for:**
- Bug fixes (restoring intended behavior)
- Typos, formatting, comments
- Non-breaking dependency updates
- Configuration changes

**Create proposal with:**
```bash
# See .claude/commands/openspec/ for commands
# Follow openspec/AGENTS.md instructions
```

## Common Pitfalls & Solutions

### Pitfall 1: Using CommonJS
```javascript
// ❌ Wrong - CommonJS
const puppeteer = require('puppeteer');
module.exports = { login };

// ✅ Correct - ES Modules
import puppeteer from 'puppeteer';
export { login };
```

### Pitfall 2: Hardcoding credentials
```javascript
// ❌ Wrong
const CPF = '12345678900';

// ✅ Correct
const CPF = process.env.PJE_CPF;
if (!CPF) throw new Error('PJE_CPF required');
```

### Pitfall 3: Not using path aliases
```typescript
// ❌ Wrong
import { db } from '../../../lib/db';

// ✅ Correct
import { db } from '@/lib/db';
```

### Pitfall 4: Missing await
```typescript
// ❌ Wrong - Promise not awaited
const data = page.evaluate(() => document.title);

// ✅ Correct
const data = await page.evaluate(() => document.title);
```

### Pitfall 5: Not handling tribunal-specific quirks
```javascript
// ❌ Wrong - Assumes standard flow
await login(page);

// ✅ Correct - Handle TJMG Bad Request
await login(page);
if (tribunal === 'TJMG') {
  await page.reload();
}
```

## Performance Best Practices

1. **Use Server Components by default** (no 'use client')
2. **Batch database queries** with Prisma `include`
3. **Add delays between scraping requests** (500ms recommended)
4. **Close browser instances** in finally blocks
5. **Use TypeScript strict mode** to catch errors early
6. **Enable Prettier/ESLint auto-fix** in your editor

## Security Best Practices

1. **Never commit credentials** (use .env, add to .gitignore)
2. **Encrypt passwords in database** (production)
3. **Use environment variables** for all sensitive config
4. **Validate user input** with Zod schemas
5. **Use HTTPS in production** (PJE URLs)
6. **Respect rate limits** (avoid DDoS-like behavior)

## When to Use This Skill

Use this skill when:
- Creating new files or modules
- Refactoring existing code
- Setting up new routes or components
- Writing tests
- Creating database migrations
- Adding new PJE scrapers
- Configuring build scripts
- Enforcing code standards in reviews

## Related Documentation

- `openspec/project.md` - Full project context
- `README.md` - Main project docs
- `README-PJE.md` - PJE quick start
- `docs/pje/` - PJE technical docs
- `.eslintrc.json` - ESLint config
- `.prettierrc` - Prettier config
