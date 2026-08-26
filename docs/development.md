# Development Workflow

## Prerequisites

- Node.js 20+
- pnpm 9.15+
- macOS + Xcode for iOS; Android Studio for Android
- Custom Expo dev client (not Expo Go)

## Install

```bash
pnpm install
```

From the repo root. Windows llama native install hooks still run via `apps/mobile` pre/postinstall scripts.

## Common commands

```bash
pnpm dev:mobile          # Expo dev client
pnpm dev:web             # Next.js authenticated app :3000
pnpm dev:website         # Marketing site :3001
pnpm typecheck           # Turbo typecheck across workspaces
pnpm lint
pnpm test
pnpm build
```

Filter a single package:

```bash
pnpm --filter @briefly/mobile start
pnpm --filter @briefly/mobile typecheck
pnpm --filter @briefly/mobile test
```

## Environment

Copy `apps/mobile/.env.example` → `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Web uses `apps/web/.env.example` with `NEXT_PUBLIC_*` keys, read through `@briefly/env`.

## Absolute imports

- Mobile: `@/*`, `@features/*`, `@core/*`, `@lib/*`, `@api/*`, plus `@briefly/*` packages
- Web / website: `@/*` → local `src` or `app` as configured
