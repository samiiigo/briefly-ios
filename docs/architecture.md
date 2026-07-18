# Briefly Monorepo Architecture

## Overview

Briefly is a pnpm + Turborepo monorepo supporting:

| App     | Path           | Role                               |
| ------- | -------------- | ---------------------------------- |
| Mobile  | `apps/mobile`  | Expo / React Native (iOS, Android) |
| Web     | `apps/web`     | Authenticated Next.js product app  |
| Website | `apps/website` | Marketing / SEO site               |
| Backend | `apps/backend` | Future API / workers scaffold      |

Shared reusable capabilities live in `packages/*`. Tooling configs live in `tooling/*`.

## Folder structure

```text
apps/
  mobile/          # Expo app (moved from briefly/)
  web/             # Authenticated Next.js app
  website/         # Marketing Next.js site
  backend/         # api/ workers/ services/ scaffold
packages/
  types/           # Domain + auth types
  constants/       # API URLs, folders, search limits
  utils/           # Pure utilities (no Expo/RN)
  validation/      # Schemas, rate limits, secureFetch
  theme/           # Design tokens (colors, spacing)
  hooks/           # Pure React hooks
  api/             # API client factory (scaffold)
  auth/            # Auth adapter (scaffold)
  config/          # Env helpers (scaffold)
  ui/              # Design-system primitives (scaffold)
  store/           # Store conventions (scaffold)
tooling/
  eslint-config/
  typescript-config/
docs/
scripts/
```

## Feature conventions (`apps/mobile`)

Business logic is organized by feature under `apps/mobile/src/features/`:

- `auth`, `recording`, `library`, `processing`, `search`, `settings`

Each feature owns its components, hooks, services, types, and utils.

Expo Router routes in `apps/mobile/app/` stay thin and import from features.

Platform-specific code (Live Activities, native modules, EAS, credentials, Supabase functions) stays in `apps/mobile`.

## Package conventions

Packages contain **capabilities**, not screens:

- Reusable across apps (or clearly destined to be)
- No Expo Router screens or feature workflows
- No dependency on `apps/*`
- Prefer zero React Native / Expo dependencies unless the package is explicitly platform-specific

### Import rules

```text
apps/*  →  packages/*     ✅
packages/* → packages/*   ✅ (avoid cycles)
packages/* → apps/*       ❌
website → auth/api/mobile ❌
```

- Use `@briefly/*` for workspace packages
- Use `@/*` (and related aliases) for mobile-local code only

## State management

| Kind                 | Approach                                                 |
| -------------------- | -------------------------------------------------------- |
| Server / remote      | Supabase + Edge Functions (mobile); future web API layer |
| Client feature state | Zustand stores inside features                           |
| Auth session         | React context (`AuthProvider`) + auth services           |
| Persistent           | Account-scoped AsyncStorage / SecureStore (mobile)       |
| UI chrome            | Local component state + small navigation stores          |

Avoid unnecessary global state. Do not put network calls in UI components — use services / API helpers.

## Development workflow

```bash
pnpm install
pnpm dev:mobile          # Expo dev client
pnpm dev:web             # Next.js :3000
pnpm dev:website         # Next.js :3001
pnpm typecheck
pnpm lint
pnpm test
pnpm verify
```

Filtered commands:

```bash
pnpm --filter @briefly/mobile typecheck
pnpm --filter @briefly/website build
```

## Deployment

| Surface | Pipeline                                                                         |
| ------- | -------------------------------------------------------------------------------- |
| Mobile  | Expo EAS (`apps/mobile/eas.json`)                                                |
| Web     | Vercel project → `apps/web`                                                      |
| Website | Vercel project → `apps/website` (independent)                                    |
| Backend | Future Docker / platform TBD; Supabase remains in `apps/mobile/supabase` for now |

## Testing

- Unit tests: colocated `*.test.ts` (Node test runner + `tsx`)
- Package tests: `packages/*/src/**/*.test.ts`
- Mobile tests: existing `apps/mobile/scripts/run-tests.mjs`
- Component / e2e: structure reserved; add under each app as needed (`apps/*/tests/`)

## Code quality

- TypeScript strict
- ESLint (Expo config for mobile; shared base for packages / Next)
- Prettier
- Husky + lint-staged on commit
