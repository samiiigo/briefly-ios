# Deployment

## Mobile (EAS)

```bash
pnpm --filter @briefly/mobile build:preview
pnpm --filter @briefly/mobile build:prod
pnpm --filter @briefly/mobile submit:prod
```

Configure public Supabase env in EAS:

```bash
pnpm --filter @briefly/mobile eas:env:supabase
```

Release checklist: `apps/mobile/docs/RELEASE_CHECKLIST.md`.

## Marketing + Web (Vercel)

- `apps/website` — independent Vercel project (`vercel.json` uses Next.js).
- `apps/web` — separate Vercel project for the authenticated product.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on the web project.

## Backend (Supabase)

Edge Functions and migrations live in `apps/backend/supabase`.

```bash
pnpm --filter @briefly/backend supabase:deploy
```

Requires `SUPABASE_DB_PASSWORD` / `SUPABASE_ACCESS_TOKEN` and server secrets `ASSEMBLYAI_API_KEY`, `OPENROUTER_SHARED_API_KEY`.

## Future backend HTTP

`apps/backend/src/{api,workers,services}` is reserved for a Node API server (Hono/Nest/Fastify) and workers. Docker packaging can wrap that server when it exists.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs:

```bash
pnpm install --frozen-lockfile
pnpm turbo run typecheck lint test
```
