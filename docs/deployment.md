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

### Marketing (`apps/website`) — default Git-connected project

The repo-root [`vercel.json`](../vercel.json) installs with pnpm and statically exports the marketing site to `apps/website/out`. This restores a green deploy without changing the Vercel Root Directory.

```bash
pnpm --filter @briefly/website build
```

### Authenticated web (`apps/web`)

Create a **separate** Vercel project with Root Directory `apps/web` (Node runtime required for middleware). Set:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Enable the Supabase Auth redirect URL: `https://<web-domain>/auth/callback`.

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
