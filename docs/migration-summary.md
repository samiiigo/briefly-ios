# Migration Summary

Incremental migration from a single Expo app (`briefly/`) to a pnpm + Turborepo monorepo.

## Decisions

### 1. Structural monorepo first

Moved the working Expo app to `apps/mobile` without rewriting features. Extracted only pure TypeScript (no Expo/RN imports) into packages. Left RN-coupled `src/shared` code in mobile.

**Why:** Preserves a green build, avoids large import churn, and still establishes long-term boundaries.

### 2. ESLint + Prettier

Kept `eslint-config-expo` for mobile. Added shared ESLint base + Prettier at the repo root with Husky/lint-staged.

**Why:** Minimal disruption to the Expo lint story while standardizing format across apps/packages.

### 3. pnpm workspaces + Turborepo

Replaced npm/`package-lock.json` with pnpm workspaces and Turbo task caching.

**Why:** Industry-standard monorepo DX for Expo + Next.js multi-app repos.

### 4. Package extraction boundaries

| Extracted now                          | Kept in mobile                         |
| -------------------------------------- | -------------------------------------- |
| `@briefly/types`                       | Feature UI / screens                   |
| `@briefly/constants`                   | ThemeProvider, fonts, StyleSheet       |
| `@briefly/utils` (pure)                | File system / SecureStore / haptics    |
| `@briefly/validation`                  | Expo auth (Apple/Google)               |
| `@briefly/theme` (tokens)              | Recording / Live Activities / llama.rn |
| `@briefly/hooks` (pure)                | `modules/briefly-transcriber`          |
| Scaffold: api, auth, ui, config, store | Supabase Edge Functions                |

**Why:** Packages must be genuinely reusable. Screens and native I/O are not.

### 5. Re-export shims in mobile

Old paths like `@/shared/types` and `@/shared/utils/formatting/formatting` re-export from `@briefly/*`.

**Why:** Avoid a big-bang import rewrite while packages become the source of truth.

### 6. Sibling apps are scaffolds

- `apps/web` — authenticated product shell (Next.js App Router)
- `apps/website` — marketing/SEO site, independent of product logic
- `apps/backend` — folder scaffold only

**Why:** Establish deployable surfaces and ownership without inventing unfinished product features.

### 7. Supabase stays under mobile (for now)

Edge Functions and migrations remain at `apps/mobile/supabase/`.

**Why:** They are production-critical and coupled to the current mobile release process. Moving them is a separate, deliberate backend consolidation.

### 8. Website isolation

`apps/website` depends only on design packages (`theme`, `ui`). No auth, API business logic, or mobile imports.

**Why:** Marketing must stay independently deployable and free of product coupling.

### 9. Device identity made injectable

`deviceIdentity` moved into `@briefly/validation` with a storage adapter. Mobile configures AsyncStorage.

**Why:** Rate limiting helpers are pure enough to share once persistence is injected.

### 10. CI updated atomically with the move

GitHub Actions installs from the repo root with pnpm and runs Turbo pipelines. Legacy `working-directory: briefly` is gone.

## What was not done (intentionally)

- No rewrite of recording/processing
- No cross-platform UI port of RN components
- No TanStack Query / new global state layer
- No deep extraction of Supabase client or Expo auth services
- No move of Supabase functions into `apps/backend`

## Follow-ups (future PRs)

1. Implement real `@briefly/ui` primitives for web/website
2. Wire `@briefly/auth` + `@briefly/api` for `apps/web`
3. Consolidate Supabase into `apps/backend` when ready
4. Add eslint-plugin boundaries for import rules
5. Gradually delete mobile re-export shims after direct `@briefly/*` adoption
