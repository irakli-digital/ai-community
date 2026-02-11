# Repository Guidelines

## Project Structure & Module Organization
- `app/` — Next.js App Router (server components by default), routes and layouts. Use kebab-case for route segments.
- `components/` — Reusable UI. Files are kebab-case; exported React components are PascalCase.
- `lib/` — Domain logic (auth, db, payments, storage, email, i18n, utils). Drizzle schema lives in `lib/db/schema.ts`; migrations in `lib/db/migrations/`.
- `e2e/` — Playwright tests with fixtures in `e2e/fixtures/`.
- `public/` — Static assets. Other infra: `Dockerfile`, `drizzle.config.ts`, `playwright.config.ts`.

## Build, Test, and Development Commands
- `pnpm dev` — Run local dev server (Turbopack) at http://localhost:3000.
- `pnpm build` / `pnpm start` — Production build and start.
- `pnpm db:setup` — Initialize database and required tables.
- `pnpm db:migrate` / `pnpm db:generate` — Run/generate Drizzle migrations.
- `pnpm db:seed` / `pnpm db:seed-mock` — Seed real or mock data.
- `pnpm db:studio` — Open Drizzle Studio.
- `npx playwright test` — Run E2E tests (uses `playwright.config.ts` to boot the app).

## Coding Style & Naming Conventions
- TypeScript strict; 2-space indentation; prefer functional components.
- Server Components by default; add `"use client"` only when needed.
- Components: PascalCase exports in kebab-case files (e.g., `components/community/post-card.tsx` → `export function PostCard`).
- Routes: kebab-case (e.g., `app/(app)/community/new/page.tsx`).
- Imports: use `@/*` path alias where appropriate. Prefer named exports.
- Styling: Tailwind CSS; use `cn()` from `lib/utils.ts` to merge classes; favor `data-testid` for testable elements.

## Testing Guidelines
- Framework: Playwright. Tests in `e2e/*.spec.ts`; shared helpers in `e2e/fixtures/` (`login`, DB seed/cleanup).
- Pre-reqs: `.env` configured (see `.env.example`) and a reachable Postgres at `POSTGRES_URL`.
- Run: `npx playwright test`. For a single file: `npx playwright test e2e/landing.spec.ts`.
- Write deterministic tests; select elements by role or `data-testid`. Clean up data via provided DB helpers.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. Example: `feat: add community post pinning`.
- PRs include: concise description, linked issue, screenshots/GIFs for UI changes, migration notes (`lib/db/migrations`), env changes (`.env.example`), and a test plan (E2E command/output).

## Security & Configuration Tips
- Never commit secrets. Update `.env.example` when introducing new env vars.
- Database changes must include a migration (`pnpm db:generate` then commit files under `lib/db/migrations/`).
- For payment or auth changes, verify in local E2E and document any webhook/config updates in the PR.

