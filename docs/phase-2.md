# Phase 2 — Product surfaces

Builds on the monorepo foundation (Phase 1).

## Goals

1. Deploy the marketing site from the monorepo via Vercel (static export).
2. Authenticated web app shell with magic-link sign-in.
3. Web routes reuse `@briefly/theme`, `@briefly/ui`, `@briefly/config`, `@briefly/types`, `@briefly/auth`, `@briefly/env`.

## Delivered

- Root `vercel.json` builds `@briefly/website` to `apps/website/out` (static export).
- `@briefly/env` accepts both `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` keys.
- `apps/web` middleware protects routes; `/sign-in` + `/auth/callback` for magic links.
- App shell with sidebar navigation; library/search use shared config/types.
- `@briefly/ui` `Input` primitive for forms.

## Not yet (later phases)

- Library/search data sync from Supabase for web
- Google/Apple OAuth on web
- Full settings parity with mobile
- Separate Vercel project Root Directory for `apps/web` (Node server; not static export)
