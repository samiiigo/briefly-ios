# Briefly

**Briefly** is a voice recorder with built-in AI transcription and summarization. You can record meetings, lectures, and voice notes, and the app generates a timestamped transcript along with a concise summary. All processing can either stay entirely on your device or route through cloud services you configure yourself. There are no subscriptions built into the app.

This repository is a **pnpm + Turborepo monorepo**. The Expo / React Native app lives at [`apps/mobile`](apps/mobile). The product is built **iOS-first** (Live Activities, on-device speech recognition) while maintaining full **Android** support.

---

## Monorepo layout

```text
apps/
  mobile/       # Expo app (iOS + Android)
  web/          # Authenticated Next.js product app
  website/      # Marketing / SEO Next.js site
  backend/      # Future API / workers scaffold
packages/       # Shared capabilities (@briefly/*)
tooling/        # ESLint + TypeScript configs
docs/           # Architecture + migration notes
```

See [docs/architecture.md](docs/architecture.md) and [docs/migration-summary.md](docs/migration-summary.md).

---

## What it does

### Record and review

- **One-tap recording** from the Recents tab, with playback, renaming, swipe actions, and favorites
- **Background recording** on iOS and Android
- **Live Activity** lock-screen tracking on iOS (dev/production builds; not Expo Go)

### Transcribe

| Mode                | Behavior                                    |
| ------------------- | ------------------------------------------- |
| **Live**            | Streams a real-time transcript (AssemblyAI) |
| **After recording** | Processes the full audio file after stop    |
| **On device**       | Apple speech recognition on iOS             |

### Summarize

| Mode             | Behavior                                         |
| ---------------- | ------------------------------------------------ |
| **Cloud**        | Shared OpenRouter-backed service                 |
| **Your API key** | BYOK for OpenRouter, OpenAI, or Gemini           |
| **Local**        | On-device summaries (Apple Intelligence / Gemma) |

### Organize and find

Library folders, custom folders, global search, and export via PDF or text.

---

## Tech stack

- **Monorepo**: pnpm workspaces, Turborepo, shared TypeScript / ESLint / Prettier
- **Mobile**: Expo SDK 54, React Native 0.81, React 19, Expo Router
- **Web / Website**: Next.js App Router
- **Auth / backend**: Supabase Auth + Edge Functions (under `apps/mobile/supabase/`)
- **State**: Zustand + React context for auth/theme
- **Build / OTA**: EAS Build and `expo-updates`

---

## Getting started

### Prerequisites

- **Node.js** 22+ (see `.nvmrc`)
- **pnpm** 9.15.9 (`packageManager` field / Corepack)
- **macOS + Xcode** for iOS builds
- **Android Studio / SDK** for Android

**Note:** Mobile requires a custom dev client (`expo-dev-client`). Expo Go is not supported.

### Install

```bash
corepack enable
pnpm install
```

On **Windows**, install from the repo root. Mobile still runs llama Windows install hooks via `apps/mobile` scripts (`preinstall` / `postinstall`). Prefer `pnpm --filter @briefly/mobile install:win` if the default install mishandles paths.

### API keys / Supabase

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

Deploy Edge Functions (after `supabase login` + link):

```bash
export ASSEMBLYAI_API_KEY=...
export OPENROUTER_SHARED_API_KEY=...
pnpm --filter @briefly/mobile supabase:deploy
```

Store release steps: [`apps/mobile/docs/RELEASE_CHECKLIST.md`](apps/mobile/docs/RELEASE_CHECKLIST.md).

### Run

```bash
pnpm dev:mobile      # Expo dev client
pnpm dev:web         # Authenticated web :3000
pnpm dev:website     # Marketing site :3001
```

Native debug builds (first run / after native dependency changes):

```bash
pnpm --filter @briefly/mobile ios
pnpm --filter @briefly/mobile android
```

Clear Metro cache: `pnpm --filter @briefly/mobile start:clean`.

---

## Quality checks

From the repository root:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm verify
pnpm format:check
```

---

## Import rules (short)

- Apps may depend on `packages/*`
- Packages must not depend on apps
- `apps/website` must not depend on auth/API/feature/mobile code
- Prefer `@briefly/*` for shared code; keep `@/*` for mobile-local paths

---

## Privacy

- **On-device transcription** uses native iOS speech APIs — audio stays on device
- **Shared cloud** modes go through Supabase Edge Functions; **BYOK** uses your key
- Library metadata can sync to Supabase; audio files remain on-device
- No subscription billing logic in the app
