# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
Single product: **Briefly**, an Expo SDK 54 / React Native 0.81 (TypeScript) mobile app living entirely under `briefly/`. There is **no backend, database, or docker service** in this repo — it is a client-only app that persists data locally and talks to optional third-party cloud APIs (AssemblyAI, OpenRouter, etc.). All cloud features are opt-in and have on-device fallbacks, so **no API keys or `.env` are required** to build, lint, test, or bundle.

### Working directory
All `npm` commands must be run from `briefly/`, not the repo root (the root is a thin wrapper with only `tsconfig.json` + `README.md`).

### Quality checks (see `briefly/package.json` scripts)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — `eslint src`
- `npm test` — **caveat:** the script glob `src/**/*.test.ts` is not recursive under bash's default (no `globstar`), so it only runs the top-level `src/security/*.test.ts` files (~8 tests). To run the **full** suite (~161 tests, all `*.test.ts` under `src/`), enable globstar first: `shopt -s globstar && npx tsx --test src/**/*.test.ts`.
- `npm run verify` runs typecheck + (partial) test + `npm audit --audit-level=high`. `npm audit` reports known advisories in the dependency tree; a non-zero audit exit does not indicate the app is broken.

### Running the app (development)
- `npm run start` launches the Metro dev server (`expo start --dev-client`) on `http://localhost:8081`. This is the dev-mode run command; it stays in the foreground, so run it in a background/tmux session.
- The app **requires a custom dev client** — Expo Go and web are **not** supported (uses native-only modules: `llama.rn`, `expo-live-activity`, `expo-audio`, etc.; `react-native-web` is not installed).
- Fully exercising the UI (record → transcribe → summarize) needs an **iOS Simulator (macOS/Xcode)** or **Android emulator (Android Studio/SDK)** — neither is available in a headless Linux cloud VM. In this environment, verify the app by: running the checks above, starting Metro, and confirming the full JS bundle builds via
  `curl "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&transform.routerRoot=app"` (expect HTTP 200, ~11 MB, ~1900 modules). Use `platform=ios` for the iOS bundle.
- The `preinstall`/`postinstall` npm hooks are **Windows-only** and no-op on Linux/macOS.
