# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (uses Turbopack)
pnpm build            # Production build
pnpm db:setup         # Interactive .env file creation
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed DB (test@test.com / admin123)
pnpm db:generate      # Generate migrations after schema changes
pnpm db:studio        # Open Drizzle Studio for DB inspection
stripe listen --forward-to localhost:3000/api/stripe/webhook  # Local Stripe webhooks
```

## Architecture

**Next.js 15 SaaS starter** with App Router, React 19, PostgreSQL (Drizzle ORM), Stripe payments, and JWT auth.

### Route Groups
- `app/(login)/` — Public auth pages (sign-in, sign-up). Shared `login.tsx` component and `actions.ts` with all auth server actions.
- `app/(dashboard)/` — Protected routes. Middleware in `middleware.ts` redirects unauthenticated users to `/sign-in`.
- `app/api/` — API routes for user/team data (SWR endpoints) and Stripe webhook/checkout handlers.

### Auth System (`lib/auth/`)
- **JWT-based** using `jose` library, stored in httpOnly secure cookies with 24h expiry.
- `session.ts` — Token signing/verification, cookie management, password hashing (bcryptjs).
- `middleware.ts` — Wrappers for server actions: `validatedAction` (Zod validation), `validatedActionWithUser` (adds user context), `withTeam` (adds team context).
- Next.js `middleware.ts` at root protects `/dashboard` routes and refreshes tokens on GET requests.

### Database (`lib/db/`)
- **Schema** (`schema.ts`): `users`, `teams`, `teamMembers`, `activityLogs`, `invitations` tables with Drizzle relations.
- **Queries** (`queries.ts`): Helper functions like `getUser()`, `getTeamForUser()`, `getActivityLogs()`.
- Users have soft deletes (`deletedAt` field). On delete, email is concatenated with user ID for uniqueness.
- Teams store Stripe subscription data (`stripeCustomerId`, `stripeSubscriptionId`, `planName`, `subscriptionStatus`).

### Payments (`lib/payments/`)
- `stripe.ts` — Stripe client setup and checkout session creation.
- `actions.ts` — Server actions for checkout and customer portal redirect.
- Webhook (`app/api/stripe/webhook/route.ts`) handles `customer.subscription.updated` and `customer.subscription.deleted`.
- Checkout redirect (`app/api/stripe/checkout/route.ts`) saves Stripe IDs to the team record.

### UI
- **shadcn/ui** components in `components/ui/` (New York style, Zinc base color).
- Tailwind CSS v4 with CSS variables for theming.
- SWR for client-side data fetching; root layout provides fallback data for `/api/user` and `/api/team`.

### Key Patterns
- Server Actions use Zod schemas validated via `validatedAction`/`validatedActionWithUser` wrappers from `lib/auth/middleware.ts`.
- `useActionState` hook manages form state in client components.
- RBAC with `owner` and `member` roles via `teamMembers.role`.
- Activity logging tracks all user actions via `ActivityType` enum in schema.
- `server-only` package ensures sensitive code never leaks to client bundles.

## Environment Variables

`POSTGRES_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BASE_URL`, `AUTH_SECRET` — run `pnpm db:setup` for interactive creation.
