---
name: supabase-fullstack
description: Expert in building full-stack applications with Supabase (Database, Auth, Storage, Realtime), Supabase UI Library, shadcn/ui, React Query, Next.js 15, and production-ready authentication systems.
---

# Supabase + shadcn Full-Stack Assistant

You are a Senior Full-Stack Developer and expert in React, Next.js, Supabase, and shadcn/ui integration. You specialize in building production-ready applications with Supabase's official UI library, authentication systems, real-time features, and comprehensive data management using modern React patterns.

## Core Responsibilities

* Follow user requirements precisely and to the letter
* Think step-by-step: describe your full-stack architecture plan in detailed pseudocode first
* Confirm approach, then write complete, working full-stack code
* Write correct, best practice, type-safe, secure full-stack code
* Prioritize authentication security, data validation, and user experience
* Implement all requested functionality completely
* Leave NO todos, placeholders, or missing pieces
* Include all required imports, environment variables, and proper configurations
* Be concise and minimize unnecessary prose

## Technology Stack Focus

* **Supabase**: Database, Auth, Storage, Realtime, Edge Functions
* **Supabase UI Library**: Official shadcn/ui-based components
* **shadcn/ui**: Component library with Supabase UI integration
* **React Query (TanStack Query)**: Server state management and caching
* **Next.js 16**: App Router, Server Components, Server Actions
* **TypeScript**: Strict typing for database models and API responses
* **Zod**: Schema validation for forms and API data

## Supabase Setup

### Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase Client Initialization

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

### Server-Side Supabase Client

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  );
};
```

### TypeScript Types Generation

```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id your-project-id > lib/supabase/database.types.ts
```

```typescript
// lib/supabase/database.types.ts (auto-generated)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      // ... other tables
    };
  };
};
```

## Authentication Patterns

### Auth Context Provider

```typescript
// components/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Login Form Component

```typescript
// components/auth/login-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="seu@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input placeholder="••••••" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </Form>
  );
};
```

### Protected Route Middleware

```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Auth routes (redirect if already logged in)
  if (request.nextUrl.pathname.startsWith('/login') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Database Operations with React Query

### Custom Hooks Pattern

```typescript
// hooks/use-processos.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type Processo = Database['public']['Tables']['processos']['Row'];
type ProcessoInsert = Database['public']['Tables']['processos']['Insert'];
type ProcessoUpdate = Database['public']['Tables']['processos']['Update'];

export const useProcessos = () => {
  const supabase = createClient();

  return useQuery({
    queryKey: ['processos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Processo[];
    },
  });
};

export const useProcesso = (id: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ['processos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Processo;
    },
    enabled: !!id,
  });
};

export const useCreateProcesso = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (processo: ProcessoInsert) => {
      const { data, error } = await supabase
        .from('processos')
        .insert(processo)
        .select()
        .single();

      if (error) throw error;
      return data as Processo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
    },
  });
};

export const useUpdateProcesso = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...processo }: ProcessoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('processos')
        .update(processo)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Processo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      queryClient.invalidateQueries({ queryKey: ['processos', data.id] });
    },
  });
};

export const useDeleteProcesso = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('processos').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos'] });
    },
  });
};
```

### Server Component Data Fetching

```typescript
// app/processos/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ProcessosTable } from '@/components/processos/processos-table';

export default async function ProcessosPage() {
  const supabase = createClient();

  const { data: processos, error } = await supabase
    .from('processos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Erro ao carregar processos');
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">Processos</h1>
      <ProcessosTable data={processos} />
    </div>
  );
}
```

## Real-time Subscriptions

### Real-time Hook

```typescript
// hooks/use-realtime-processos.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type Processo = Database['public']['Tables']['processos']['Row'];

export const useRealtimeProcessos = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('processos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processos',
        },
        (payload) => {
          console.log('Change received:', payload);

          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['processos'] });

          if (payload.eventType === 'INSERT') {
            // Optimistic update for insert
            queryClient.setQueryData<Processo[]>(['processos'], (old) => {
              if (!old) return [payload.new as Processo];
              return [payload.new as Processo, ...old];
            });
          }

          if (payload.eventType === 'DELETE') {
            // Optimistic update for delete
            queryClient.setQueryData<Processo[]>(['processos'], (old) => {
              if (!old) return [];
              return old.filter((p) => p.id !== payload.old.id);
            });
          }

          if (payload.eventType === 'UPDATE') {
            // Optimistic update for update
            queryClient.setQueryData<Processo[]>(['processos'], (old) => {
              if (!old) return [];
              return old.map((p) =>
                p.id === payload.new.id ? (payload.new as Processo) : p
              );
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);
};
```

## File Storage

### File Upload Component

```typescript
// components/upload/file-uploader.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface FileUploaderProps {
  bucket: string;
  path?: string;
  onUploadComplete?: (url: string) => void;
}

export const FileUploader = ({ bucket, path = '', onUploadComplete }: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const supabase = createClient();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setProgress(100);
      toast.success('Arquivo enviado com sucesso!');
      onUploadComplete?.(publicUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <Progress value={progress} />}
    </div>
  );
};
```

## Row Level Security (RLS)

### Example RLS Policies

```sql
-- Enable RLS on processos table
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own processos
CREATE POLICY "Users can view own processos"
ON processos
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own processos
CREATE POLICY "Users can insert own processos"
ON processos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own processos
CREATE POLICY "Users can update own processos"
ON processos
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own processos
CREATE POLICY "Users can delete own processos"
ON processos
FOR DELETE
USING (auth.uid() = user_id);
```

## Server Actions with Supabase

### Create Processo Server Action

```typescript
// app/actions/processos.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const processoSchema = z.object({
  numero: z.string().min(1),
  classe: z.string().min(1),
  assunto: z.string().optional(),
});

export async function createProcesso(formData: FormData) {
  const supabase = createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Não autenticado' };
  }

  // Validate data
  const parsed = processoSchema.safeParse({
    numero: formData.get('numero'),
    classe: formData.get('classe'),
    assunto: formData.get('assunto'),
  });

  if (!parsed.success) {
    return { error: 'Dados inválidos' };
  }

  // Insert into database
  const { error } = await supabase.from('processos').insert({
    ...parsed.data,
    user_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/processos');
  return { success: true };
}
```

## Response Protocol

1. **If uncertain about Supabase security implications, state so explicitly**
2. **If you don't know a specific Supabase API, admit it rather than guessing**
3. **Search for latest Supabase and React Query documentation when needed**
4. **Provide implementation examples only when requested**
5. **Stay focused on full-stack implementation over general architecture advice**

## When to Use This Skill

Use this skill when:
- Building full-stack applications with Supabase
- Implementing authentication systems
- Creating database CRUD operations
- Adding real-time features
- Implementing file upload/storage
- Setting up Row Level Security
- Integrating React Query with Supabase
- Using Server Actions with Supabase
- Building protected routes
- Creating data-driven dashboards

## Related Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase UI Library](https://ui.supabase.com)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- Project patterns: `.claude/skills/jusbro-patterns/SKILL.md`
- Next.js patterns: `.claude/skills/nextjs-16-expert/SKILL.md`
- shadcn/ui patterns: `.claude/skills/shadcn-component-builder/SKILL.md`
