# 005 — Web auth with magic links and SSR cookies

## Status

Accepted

## Context

Phase 2 needs an authenticated web app that shares identity with mobile without importing Expo APIs.

## Decision

- Use `@supabase/ssr` browser + server clients in `apps/web`.
- Reuse `@briefly/auth` (`mapUser`, session types) and `@briefly/env` (now reads `NEXT_PUBLIC_*`).
- Protect product routes with Next.js middleware; allow `/sign-in` and `/auth/callback`.
- Email magic link is the first web provider; Apple/Google can be added as adapters later.

## Consequences

- Mobile and web share the same Supabase project and user model.
- Marketing site (`apps/website`) remains auth-free and statically exportable.
- Web requires a Node-capable host (Vercel Root Directory `apps/web`) for middleware; not part of the static marketing deploy.
