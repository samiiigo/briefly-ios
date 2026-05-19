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
- **State**: [Zustand](https://github.com/pmndrs/zustand) paired with AsyncStorage for persistence (`briefly/src/context/`)
- **Lists**: `@shopify/flash-list` for high-performance scrolling
- **Audio**: `expo-audio` handling recording, playback, and background audio tasks
- **Storage**: `expo-file-system` for local audio files; `@react-native-async-storage/async-storage` for metadata
- **UI**: Custom chrome (including a floating tab bar and blur overlays), `expo-blur`, `expo-haptics`, and native dark theme support
- **Build / OTA**: EAS Build and `expo-updates`

Check out `briefly/package.json` for the complete dependency tree and npm scripts.

---

## Project structure

```
briefly/
├── app/                    # Expo Router screens and layouts
│   ├── (tabs)/             # Recents + Library tab shell
│   ├── recording/          # New recording, detail, transcript, summarizing
│   ├── folder/             # Folder browser and detail
│   ├── settings.tsx
│   ├── search.tsx
│   └── …
├── src/
│   ├── components/         # UI (features/, navigation/)
│   ├── context/            # Zustand stores
│   ├── services/           # Audio, transcription, summarization, storage
│   ├── hooks/
│   ├── utils/
│   ├── theme/
│   └── types/
├── assets/
├── app.config.js           # Injects API keys from env into expo.extra
├── app.json
└── eas.json
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

### API keys (cloud modes)

If you want to use cloud transcription (AssemblyAI) or shared cloud summarization (OpenRouter), you need to provide API keys locally or via EAS secrets for builds.

Copy the example environment file and add your keys:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
```

- AssemblyAI: https://www.assemblyai.com/
- OpenRouter: https://openrouter.ai/

`app.config.js` also reads non-`EXPO_PUBLIC_` fallbacks (`ASSEMBLYAI_API_KEY`, `OPENROUTER_SHARED_API_KEY`). For production builds, it is highly recommended to use [EAS secrets](https://docs.expo.dev/build-reference/variables/) instead of committing your keys. You can also configure `expo.extra.assemblyAiApiKey` and `expo.extra.openRouterSharedApiKey` directly in `app.json`.

**On-device** transcription and **Local** summarization completely bypass these requirements. **Your API key** summarization just uses the provider you select in Settings—it doesn't use the shared Briefly key.

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
- **Cloud** modes send audio or text directly to the third-party APIs you configure (AssemblyAI, OpenRouter, or your own provider). You should review the privacy terms of the provider you choose.
- All recordings and metadata are stored **locally** on your device unless you manually export or share them.
- The app has zero subscription billing logic; cloud features run strictly on the API keys you provide or build into the app.
