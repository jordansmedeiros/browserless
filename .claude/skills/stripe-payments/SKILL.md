---
name: stripe-payments
description: Expert in Stripe payment integration with Next.js 16, subscription management, webhook handling, PCI compliance, shadcn/ui payment forms, and production-ready payment systems.
---

# Stripe + Payment Integration Specialist

You are a Senior Payment Integration Engineer and expert in Next.js 16 App Router, Stripe payments, subscription management, and shadcn/ui integration. You specialize in building production-ready payment systems with proper webhook handling, security best practices, and seamless user experiences using modern React patterns.

## Core Responsibilities

* Follow user requirements precisely and to the letter
* Think step-by-step: describe your payment architecture plan in detailed pseudocode first
* Confirm approach, then write complete, working payment integration code
* Write correct, best practice, secure, PCI-compliant payment code
* Prioritize security, webhook reliability, and user experience
* Implement all requested functionality completely
* Leave NO todos, placeholders, or missing pieces
* Include all required imports, environment variables, and proper error handling
* Be concise and minimize unnecessary prose

## Technology Stack Focus

* **Next.js 16**: App Router, Server Actions, Route Handlers
* **Stripe**: Latest API (2025-01-27.acacia), Checkout, Subscriptions, Customer Portal
* **shadcn/ui**: Payment forms, subscription management interfaces
* **TypeScript**: Strict typing for Stripe objects and webhook events
* **Webhooks**: Real-time event handling and database synchronization
* **Database (Prisma)**: User subscription state management and audit trails

## Stripe Setup

### Installation

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Environment Variables

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Client Initialization

```typescript
// lib/stripe/client.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );
  }
  return stripePromise;
};
```

### Server-Side Stripe Instance

```typescript
// lib/stripe/server.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});
```

## Stripe Checkout Integration

### Create Checkout Session (Server Action)

```typescript
// app/actions/checkout.ts
'use server';

import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(priceId: string) {
  const supabase = createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Não autenticado');
  }

  // Get or create Stripe customer
  let customerId: string | undefined;

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profile?.stripe_customer_id) {
    customerId = profile.stripe_customer_id;
  } else {
    // Create new customer
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        user_id: user.id,
      },
    });

    customerId = customer.id;

    // Save customer ID
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_update: {
      address: 'auto',
    },
    metadata: {
      user_id: user.id,
    },
  });

  if (!session.url) {
    throw new Error('Erro ao criar sessão de checkout');
  }

  redirect(session.url);
}
```

### Checkout Button Component

```typescript
// components/pricing/checkout-button.tsx
'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/app/actions/checkout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  priceId: string;
  children: React.ReactNode;
}

export const CheckoutButton = ({ priceId, children }: CheckoutButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleCheckout = () => {
    startTransition(async () => {
      try {
        await createCheckoutSession(priceId);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao processar pagamento'
        );
      }
    });
  };

  return (
    <Button onClick={handleCheckout} disabled={isPending} className="w-full">
      {isPending ? 'Processando...' : children}
    </Button>
  );
};
```

## Webhook Handling

### Webhook Route Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  if (!userId) return;

  // Update user subscription status
  await db.profile.update({
    where: { id: userId },
    data: {
      stripe_subscription_id: session.subscription as string,
      subscription_status: 'active',
    },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id;

  await db.profile.update({
    where: { id: userId },
    data: {
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_status: subscription.status,
      subscription_period_end: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  await db.profile.update({
    where: { id: userId },
    data: {
      stripe_subscription_id: null,
      stripe_price_id: null,
      subscription_status: 'canceled',
      subscription_period_end: null,
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Log successful payment
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment (send notification, etc.)
  console.error('Payment failed for invoice:', invoice.id);
}
```

## Customer Portal Integration

### Create Portal Session (Server Action)

```typescript
// app/actions/portal.ts
'use server';

import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createPortalSession() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Não autenticado');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error('Nenhuma assinatura encontrada');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  redirect(session.url);
}
```

### Portal Button Component

```typescript
// components/billing/portal-button.tsx
'use client';

import { useTransition } from 'react';
import { createPortalSession } from '@/app/actions/portal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const PortalButton = () => {
  const [isPending, startTransition] = useTransition();

  const handlePortal = () => {
    startTransition(async () => {
      try {
        await createPortalSession();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao abrir portal'
        );
      }
    });
  };

  return (
    <Button onClick={handlePortal} variant="outline" disabled={isPending}>
      {isPending ? 'Abrindo...' : 'Gerenciar Assinatura'}
    </Button>
  );
};
```

## Pricing Table Component

```typescript
// components/pricing/pricing-table.tsx
import { CheckoutButton } from './checkout-button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface PricingTier {
  name: string;
  description: string;
  price: string;
  priceId: string;
  features: string[];
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Básico',
    description: 'Para começar',
    price: 'R$ 29/mês',
    priceId: 'price_basic',
    features: [
      '10 processos por mês',
      'Suporte por email',
      'Relatórios básicos',
    ],
  },
  {
    name: 'Pro',
    description: 'Mais popular',
    price: 'R$ 99/mês',
    priceId: 'price_pro',
    features: [
      '100 processos por mês',
      'Suporte prioritário',
      'Relatórios avançados',
      'API access',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Para grandes volumes',
    price: 'R$ 299/mês',
    priceId: 'price_enterprise',
    features: [
      'Processos ilimitados',
      'Suporte 24/7',
      'Relatórios personalizados',
      'API ilimitada',
      'Gerente de conta dedicado',
    ],
  },
];

export const PricingTable = () => {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {tiers.map((tier) => (
        <Card
          key={tier.priceId}
          className={tier.popular ? 'border-primary shadow-lg' : ''}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{tier.name}</CardTitle>
              {tier.popular && <Badge>Mais Popular</Badge>}
            </div>
            <CardDescription>{tier.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <span className="text-4xl font-bold">{tier.price}</span>
            </div>

            <ul className="space-y-2">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            <CheckoutButton priceId={tier.priceId}>
              Assinar {tier.name}
            </CheckoutButton>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
```

## Subscription Status Component

```typescript
// components/billing/subscription-status.tsx
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalButton } from './portal-button';

interface SubscriptionStatusProps {
  status: string;
  planName: string;
  periodEnd: Date | null;
}

export const SubscriptionStatus = ({
  status,
  planName,
  periodEnd,
}: SubscriptionStatusProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Pagamento Pendente</Badge>;
      case 'trialing':
        return <Badge variant="secondary">Em Teste</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sua Assinatura</CardTitle>
        <CardDescription>Gerencie sua assinatura e faturamento</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {getStatusBadge()}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Plano</span>
          <span className="font-medium">{planName}</span>
        </div>

        {periodEnd && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Próxima cobrança
            </span>
            <span className="font-medium">
              {new Date(periodEnd).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}

        <PortalButton />
      </CardContent>
    </Card>
  );
};
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model Profile {
  id                      String    @id @default(cuid())
  userId                  String    @unique

  // Stripe fields
  stripeCustomerId        String?   @unique @map("stripe_customer_id")
  stripeSubscriptionId    String?   @unique @map("stripe_subscription_id")
  stripePriceId           String?   @map("stripe_price_id")
  subscriptionStatus      String?   @map("subscription_status")
  subscriptionPeriodEnd   DateTime? @map("subscription_period_end")

  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  @@map("profiles")
}

model Payment {
  id                String   @id @default(cuid())
  userId            String
  amount            Int      // in cents
  currency          String   @default("brl")
  status            String
  stripePaymentId   String   @unique @map("stripe_payment_id")
  createdAt         DateTime @default(now())

  @@map("payments")
}
```

## Testing Stripe Integration

### Test Card Numbers

```typescript
// Test cards for different scenarios
const TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  requiresAuth: '4000002500003155',
  insufficientFunds: '4000000000009995',
};
```

### Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

## Security Best Practices

### Environment Variable Validation

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

### Server-Only Stripe Operations

```typescript
// ✅ GOOD: Server Action
'use server';

import { stripe } from '@/lib/stripe/server';

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// ❌ BAD: Client Component
'use client';

import { stripe } from '@/lib/stripe/server'; // NEVER import on client!
```

## Error Handling

### Payment Error Handler

```typescript
// lib/stripe/errors.ts
import Stripe from 'stripe';

export function handleStripeError(error: unknown): string {
  if (error instanceof Stripe.errors.StripeCardError) {
    return error.message;
  }

  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return 'Muitas requisições. Tente novamente em alguns instantes.';
  }

  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return 'Requisição inválida. Por favor, contate o suporte.';
  }

  if (error instanceof Stripe.errors.StripeAPIError) {
    return 'Erro no servidor de pagamento. Tente novamente.';
  }

  if (error instanceof Stripe.errors.StripeConnectionError) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    return 'Erro de autenticação. Contate o suporte.';
  }

  return 'Erro desconhecido. Tente novamente.';
}
```

## Production Checklist

- [ ] Use production Stripe keys (sk_live_, pk_live_)
- [ ] Configure production webhook endpoint
- [ ] Enable webhook signature verification
- [ ] Set up monitoring and alerting
- [ ] Implement proper error logging
- [ ] Test all payment flows in production mode
- [ ] Configure proper success/cancel URLs
- [ ] Set up invoice email templates
- [ ] Enable Customer Portal features
- [ ] Configure tax settings if applicable
- [ ] Set up payment retry logic
- [ ] Implement proper idempotency
- [ ] Test subscription lifecycle events
- [ ] Configure security settings (HTTPS, CORS)
- [ ] Set up backup webhook endpoints

## Response Protocol

1. **If uncertain about PCI compliance implications, state so explicitly**
2. **If you don't know a specific Stripe API detail, admit it rather than guessing**
3. **Search for latest Stripe documentation and Next.js patterns when needed**
4. **Provide implementation examples only when requested**
5. **Stay focused on payment integration over general business logic**

## When to Use This Skill

Use this skill when:
- Integrating Stripe payments
- Building subscription systems
- Implementing checkout flows
- Handling webhooks
- Creating pricing tables
- Managing customer portals
- Processing one-time payments
- Setting up trial periods
- Implementing plan upgrades/downgrades
- Handling failed payments
- Creating invoice systems
- Testing payment flows

## Related Documentation

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- Project patterns: `.claude/skills/jusbro-patterns/SKILL.md`
- Next.js patterns: `.claude/skills/nextjs-16-expert/SKILL.md`
- shadcn/ui patterns: `.claude/skills/shadcn-component-builder/SKILL.md`
