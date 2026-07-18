Briefly
=======

**Briefly** is a voice recorder with built-in AI transcription and summarization. You can record meetings, lectures, and voice notes, and the app generates a timestamped transcript along with a concise summary. All processing can either stay entirely on your device or route through cloud services you configure yourself. There are no subscriptions built into the app.

This repository contains the **Expo / React Native** app located under the `briefly/` directory. The product is built **iOS-first** (supporting features like Live Activities and on-device speech recognition) while maintaining full **Android** support for recording, library management, and cloud workflows.

---

## What it does

### Record and review

- **One-tap recording**: Start instantly from the Recents tab. Includes audio playback, renaming, swipe actions, and a favorites system.
- **Background recording**: Supported on both iOS and Android (using a foreground service and persistent notification on Android).
- **Live Activity**: Real-time lock screen tracking on iOS while recording (requires a development or production build; this won't work in Expo Go).

### Transcribe

You can change the app-wide transcription mode in **Settings → Transcription**:

| Mode | Behavior |
|------|----------|
| **Live** | Streams a real-time transcript as you speak (powered by AssemblyAI). |
| **After recording** | Processes the entire audio file once you stop the recording. |
| **On device** | Uses Apple's native speech recognition on iOS so your audio never leaves the phone. |

Transcripts are broken down into timed segments and support speaker labels where available.

### Summarize

You can change the app-wide summarization mode in **Settings → Summarization**:

| Mode | Behavior |
|------|----------|
| **Cloud** | Briefly’s shared OpenRouter-backed service. |
| **Your API key** | Bring your own API key for OpenRouter, OpenAI, or Google Gemini. |
| **Local** | On-device summaries; currently implementing Apple Intelligence, or use Gemma for the AI. |

Summaries pull out key insights and format them into structured markdown sections.

### Organize and find

- **Library**: Built-in filters for All, Favorites, Archives, Unlisted, Imports, and Recently Deleted.
- **Custom folders**: Create and pin custom folders, and toggle between list or grid layouts.
- **Search**: Search globally across all your recordings, complete with recent search history.
- **Export**: Share your transcripts or summaries as PDFs (via `expo-print` / `expo-sharing`) or raw text.

---

## Tech stack

- **Framework**: Expo SDK 54, React Native 0.81, React 19
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (`expo-router`) using file-based routes inside `briefly/app/`
- **Auth / backend**: Supabase Auth + Edge Functions (shared AssemblyAI / OpenRouter keys stay server-side)
- **State**: [Zustand](https://github.com/pmndrs/zustand) with account-scoped AsyncStorage
- **Lists**: `@shopify/flash-list` for high-performance scrolling
- **Audio**: `expo-audio` handling recording, playback, and background audio tasks
- **Storage**: `expo-file-system` for local audio files; account-scoped metadata + optional Supabase library sync
- **UI**: Custom chrome (including a floating tab bar and blur overlays), `expo-blur`, `expo-haptics`, and native dark theme support
- **Build / OTA**: EAS Build and `expo-updates`

Check out `briefly/package.json` for the complete dependency tree and npm scripts.

---

## Project structure

```
briefly/
├── app/                    # Expo Router thin routes (auth, tabs, recording, …)
├── src/
│   ├── features/           # auth, recording, library, search, settings, processing
│   ├── shared/             # theme, components, storage, security, services
│   ├── api/                # Supabase client + Edge Function helpers
│   ├── providers/          # Auth + app providers
│   ├── navigation/         # chrome / overlays
│   └── store/              # cross-cutting store wiring (if any)
├── supabase/               # migrations + Edge Functions
├── docs/RELEASE_CHECKLIST.md
├── assets/
├── app.config.js           # Injects public Supabase config into expo.extra
├── app.json
├── eas.json
└── vercel.json             # static placeholder for linked Preview deploys
```

---

## Getting started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (this repo relies on `briefly/package-lock.json`)
- **macOS + Xcode** for iOS Simulator or physical device builds
- **Android Studio / SDK** if you plan to build for Android

**Note:** Briefly requires a custom dev client (`expo-dev-client`). You cannot use the standard Expo Go app because it doesn't support the native modules required for Live Activities and background recording.

### Install

```bash
cd briefly
npm install
```

On **Windows**, run `npm install` from the `briefly` folder (CMD, PowerShell, or Git Bash). `preinstall` refreshes `briefly/.npmrc` with a Windows path Node can load when npm runs scripts under `cmd.exe` (Git Bash `${PWD}` paths like `/d/...` do not work there). `npm install` skips `llama.rn`'s default postinstall (Git Bash GNU `tar` mishandles `C:\` paths) and runs the repo's Windows-safe downloader afterward via `postinstall`. If Git Bash still fails, run `npm run install:win`. Always `cd briefly` before installing. To re-download native artifacts manually: `npm run postinstall:llama`.

### API keys / Supabase

Cloud transcription and shared summarization run through **Supabase Edge Functions**. Put server keys in Supabase secrets (not in the app bundle).

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://vcuvfstcobxujjrvqpop.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

Deploy backend (after `supabase login` + link):

```bash
export ASSEMBLYAI_API_KEY=...
export OPENROUTER_SHARED_API_KEY=...
npm run supabase:deploy
```

Full store release steps: `briefly/docs/RELEASE_CHECKLIST.md`.

**Your API key** (BYOK) keys are stored in the OS secure enclave (Keychain / Keystore), not AsyncStorage. **On-device** transcription and **Local** summarization do not require cloud keys.


### Security (client)

Shared cloud calls go through authenticated Supabase Edge Functions. BYOK provider calls use `secureFetch` with per-device and per-user rate limits. User-facing text (titles, folder names, search queries) is validated under `briefly/src/shared/security/`.

### Run in development

Start the dev server (this assumes you already have a dev client installed on your device or simulator):

```bash
npm run start
```

Run a native debug build (you need to do this the first time you run the app, or whenever you change a native dependency):

```bash
# iOS (macOS required)
npm run ios

# Android
npm run android
```

If you run into caching issues, run `npm run start:clean` to clear the Metro cache.

---

## Quality checks

Run these commands from the root `briefly/` directory before committing code:

```bash
npm run typecheck
npm run lint
npm test
npm run verify      # Runs typecheck + test + npm audit (high)
```

---

## Privacy

- **On-device transcription** utilizes native iOS speech APIs, meaning your audio never leaves the phone.
- **Shared cloud** modes send audio or text through your Supabase Edge Functions to AssemblyAI / OpenRouter. **BYOK** modes call the provider you configure with your own key.
- Recording library metadata can sync to your signed-in Supabase account; audio files remain on-device. Review third-party provider privacy terms for cloud modes.
- The app has zero subscription billing logic.
