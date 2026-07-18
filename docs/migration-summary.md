# Migration Summary

## What changed

1. **Moved** the Expo app from `briefly/` → `apps/mobile` (not a rewrite).
2. **Introduced** pnpm workspaces + Turborepo + shared `configs/`.
3. **Extracted** only packages with immediate production code:
   `types`, `validation`, `theme`, `env`, `config`, `api`, `auth`, `assets`, `ui`, `utils`.
4. **Scaffolded** `apps/web`, `apps/website`, and `apps/backend` (`src/{api,workers,services}` + `supabase/`).
5. **Reshaped** mobile `shared/` into `core/`, `lib/`, and `config/`.
6. **Updated imports immediately** to `@briefly/*` — no temporary shims.
7. **Documented** architecture, conventions, deployment, and ADRs.

## What did not change

- Feature business logic for recording, library, processing, search, settings.
- Expo Router route structure.
- Native module `briefly-transcriber`.
- Custom validation engine (not rewritten to Zod).
- No TanStack Query adoption.
- No empty `hooks` / `store` packages.

## Architectural decisions

See [architecture/decisions.md](./architecture/decisions.md).

## Verification gates

After migration:

- `pnpm --filter @briefly/mobile typecheck`
- `pnpm --filter @briefly/mobile test`
- `pnpm turbo run typecheck lint test`
