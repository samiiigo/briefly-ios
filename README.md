Briefly
=======

**Briefly** is a cross‑platform, privacy‑first AI transcription app. It records speech, converts it to text, and generates concise summaries using either fully local processing or a secure cloud mode—no subscriptions, no data retention.

The codebase in this repo is the React Native / Expo app that targets:

- iOS
- Android
- (Optionally) desktop shells that reuse the same React code

The goal is to feel as fast and local as a traditional voice recorder while adding just enough AI to make your recordings useful.

---

## Features

- **Record and transcribe**
  - Capture meetings, lectures, calls, and voice notes.
  - Long‑form transcription with timestamps and basic segmentation.

- **Local & online “AI brain”**
  - **On‑Device Mode**: Transcription and summaries run on the device (where supported) so recordings and text stay local.
  - **Online Mode**: Optionally send audio or transcripts to a remote AI service for deeper analysis and better reasoning.

- **Summaries and insights**
  - Short bullet summaries for each transcript.
  - Key highlights such as decisions, action items, and main topics.

- **Multi‑device UI**
  - Phone‑optimized recording screen with a big record button and recent recordings list.
  - Split‑view layout on larger screens (e.g. tablets, desktops) with recordings on the left and transcript/summary on the right.

---

## Tech stack

- **Framework**: React Native + Expo (`expo` 54, `react-native` 0.81)
- **Navigation**: React Navigation (stack + bottom tabs)
- **State management**: Zustand
- **Lists**: `@shopify/flash-list`
- **Storage**: `expo-file-system`, `expo-sqlite`, `@react-native-async-storage/async-storage`, `react-native-mmkv`
- **Media & device APIs**: `expo-av`, `expo-audio`, `expo-device`, `expo-haptics`, `expo-sharing`, `expo-print`, `expo-speech`

All dependencies and scripts are defined in `briefly/package.json`.

---

## Project structure (high level)

The important pieces for the app live under the `briefly` directory:

- `briefly/src/`
  - **`screens/`** – Top‑level screens (e.g. folder/recording lists, transcript views).
  - **`components/`** – Reusable UI components.
  - **`store/`** – Zustand stores for app state.
  - **`lib/` / `utils/`** – Helpers, data access, platform abstractions.

This README intentionally stays high level; see `Briefly.md` for more product‑level context and goals.

---

## Getting started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (or `pnpm`/`yarn`, but the repo ships with an `npm`‑oriented `package-lock.json`)
- **Expo CLI** and optional native tooling:
  - `npm install -g expo-cli` (or use `npx expo` with the local binary)
  - For iOS: Xcode + iOS Simulator (on macOS)
  - For Android: Android Studio + an Android emulator or device

### Install dependencies

From the `briefly` directory:

```bash
cd briefly
npm install
```

### Setting up API keys

Briefly requires two API keys for cloud transcription and AI summarization:

1. **AssemblyAI API Key** – for transcription
2. **OpenRouter API Key** – for AI summarization

You can set them in one of two ways:

#### Option 1: Environment variables (Recommended)

Create a `.env` file in the `briefly/` directory:

```env
EXPO_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_key_here
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key_here
```

Or set them directly in your terminal:

```bash
export EXPO_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_key
export EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
```

#### Option 2: Expo config

Edit `briefly/app.json` and add to the `expo.extra` section:

```json
{
  "expo": {
    "extra": {
      "assemblyAiApiKey": "your_assemblyai_key_here",
      "openRouterSharedApiKey": "your_openrouter_key_here"
    }
  }
}
```

#### Option 3: Native build settings (development builds / CI)

For native builds, you can also inject AssemblyAI at native compile time:

- Android: set `ASSEMBLYAI_API_KEY` as a Gradle property or environment variable.
- iOS: set `expo.ios.infoPlist.ASSEMBLYAI_API_KEY` in `briefly/app.json` (or inject the value during CI build).

Example (Android):

```bash
ASSEMBLYAI_API_KEY=your_assemblyai_key ./gradlew assembleDebug
```

#### Obtaining API keys

- **AssemblyAI**: Get your key at https://www.assemblyai.com/
- **OpenRouter**: Get your key at https://openrouter.ai/

### Run the app

Start the Expo dev server:

```bash
npm run start
```

Then:

- Press **`i`** in the Expo CLI to run on iOS Simulator (macOS only), or
- Press **`a`** to run on an Android emulator/device, or
- Scan the QR code with the Expo Go app.

You can also use the convenience scripts:

```bash
# Android (native build)
npm run android

# iOS (native build, macOS only)
npm run ios

# Web preview
npm run web
```

---

## Building and releasing

This project is set up for EAS (Expo Application Services) builds:

```bash
# Build for Android
npm run build:android

# Build for iOS
npm run build:ios

# Build both platforms
npm run build:all

# Submit to stores (after configuring EAS)
npm run submit:android
npm run submit:ios
```

See the Expo/EAS docs for store credentials, signing, and configuration.

---

## Quality checks

From `briefly`:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm test
```

---

## Privacy and data handling

Briefly is designed as a **privacy‑first** app:

- In **On‑Device Mode**, recordings and transcripts are processed and stored locally on the device.
- In **Online Mode**, audio/transcripts are sent to a remote AI service over encrypted channels for more advanced analysis.
- There are **no subscriptions** and no built‑in data‑retention features beyond what is required to make the app function.

Implementation details of which providers and models are used in Online Mode depend on your local configuration and environment; you should review and adapt this to match your own privacy and compliance requirements.

---

## Roadmap (v1 scope)

In scope for the first public version:

- Record audio and play it back.
- Transcribe recordings in both local and online modes.
- Generate concise summaries and key‑points lists from each transcript.
- Per‑recording toggle between On‑Device and Online processing with clear labels so users know where computation happens.

Out of scope for v1:

- Subscription tiers, billing, or “Pro” plans.
- Complex collaboration features such as shared workspaces, comments, or multi‑user accounts.

---

## Contributing

Issues and pull requests are welcome. When contributing:

- Keep the **privacy‑first** philosophy in mind.
- Prefer simple, reliable flows over feature creep.
- Align new UI with the existing design patterns in the app.

Before opening a PR, make sure `npm run typecheck`, `npm run lint`, and `npm test` all pass.

