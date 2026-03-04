# Briefly

Briefly is a cross-platform transcription and summarization foundation targeting iOS, Android, and Windows.

## Monorepo Structure

- `apps/mobile`: React Native app shell for iOS and Android.
- `apps/windows`: React Native for Windows app shell.
- `packages/shared`: Shared TypeScript models, state, storage, and Local/Cloud summarization wiring.
- `native/ios`: iOS Swift bridge scaffolding for speech transcription and SwiftUI-hosted UI.
- `native/android`: Android native bridge scaffolding for speech transcription.
- `native/windows`: Windows native bridge scaffolding for speech transcription.

## MVP Features Included

- Shared screens and navigation for:
  - Record
  - Transcript List
  - Transcript Detail
  - Settings
- Shared transcript store and persistence adapter contracts.
- Local Mode summarization (offline JS summarization stub).
- Cloud Mode summarization via configurable endpoint + API key.
- Platform service wiring points for recording/transcription modules.
- Native module extension points for iOS/Android/Windows transcription bridges.
- iOS-native SwiftUI hosting bridge component exposed to React Native.

## Build / Run

### Prerequisites

- Node.js 20+
- npm 10+
- Xcode 15+ (iOS)
- Android Studio (Android)
- Visual Studio 2022 with UWP/Desktop C++ workload and RNW dependencies (Windows)

### Install

```bash
npm install
```

### Shared tests

```bash
npm run test
```

### iOS / Android (mobile app)

From `apps/mobile`:

```bash
npm install
npx react-native start
```

Then in separate terminals:

```bash
npx react-native run-ios
npx react-native run-android
```

For physical devices, use standard React Native CLI deployment steps and platform signing/provisioning settings.

### Windows app shell

From `apps/windows`:

```bash
npm install
npx react-native run-windows
```

## Extension Points

- Replace `createLocalSummarizer()` with richer on-device model logic.
- Plug real LLM provider into `createCloudSummarizer()`.
- Wire native modules in `apps/mobile/src/services/transcription.ts` and `apps/windows/src/NativeBrieflySpeech.ts`.
- Implement platform recording in `apps/mobile/src/services/recording.ts`.
