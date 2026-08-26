# Briefly Architecture

Briefly is a pnpm + Turborepo monorepo for a voice-recording SaaS product spanning mobile, authenticated web, marketing, and backend.

## Topology

```text
apps/
  mobile/     Expo (iOS/Android) — product app
  web/        Next.js — authenticated product web
  website/    Next.js — marketing / docs / SEO
  backend/    Supabase + future HTTP/workers
packages/     Shared libraries with real production code only
configs/      Shared ESLint, TypeScript, Prettier configs
```

## Ownership

| Area                                                            | Owner                                              |
| --------------------------------------------------------------- | -------------------------------------------------- |
| Recording, transcription, Live Activities, native modules       | `apps/mobile`                                      |
| Authenticated dashboard features                                | `apps/web` (own `src/features`)                    |
| Landing, pricing, blog, legal                                   | `apps/website`                                     |
| Edge Functions + future API server                              | `apps/backend`                                     |
| Design tokens / UI primitives / brand assets                    | `packages/theme`, `packages/ui`, `packages/assets` |
| Domain types, validation, env, config, API client, auth helpers | corresponding `@briefly/*` packages                |

## Import rules

1. **Features stay in apps.** Packages expose capabilities (clients, tokens, primitives), never screens.
2. **`apps/website` may depend only on** `@briefly/theme`, `@briefly/ui`, `@briefly/assets`.
3. **Do not import from `apps/mobile` into other apps or packages.**
4. **Mobile-only code** (audio, file system, haptics, Expo auth UI, native modules) stays in `apps/mobile`.
5. **Create a package only when it immediately contains reusable production code.** No placeholder packages.

## Mobile layout

```text
apps/mobile/src/
  features/   auth | recording | library | processing | search | settings
  core/       bootstrap, security adapters, storage services
  lib/        mobile-only hooks and utils
  config/     Expo Constants → @briefly/env bridge
  api/        AsyncStorage-bound Supabase client
  navigation/ chrome / overlays
  providers/  app composition
  store/      UI-only cross-cutting stores
```

## State

| Kind         | Approach                                   |
| ------------ | ------------------------------------------ |
| Client / UI  | Zustand stores owned by features           |
| Auth session | Supabase auth + `AuthProvider`             |
| Persistent   | Account-scoped AsyncStorage / SecureStore  |
| Server       | Supabase Edge Functions via `@briefly/api` |

TanStack Query is not adopted yet; `packages/api` is structured for future query/mutation modules.
