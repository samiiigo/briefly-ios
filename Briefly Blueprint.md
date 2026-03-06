# Briefly: iOS 26-Only Build Blueprint — Live Transcription with SpeechAnalyzer

## Overview

Briefly is a privacy-first transcription and summarization app for iOS 26, built with React Native and native Swift bridges. Transcription **always** runs on-device via Apple's new `SpeechAnalyzer` + `SpeechTranscriber` APIs, with live text appearing as the user speaks. The "AI brain" for summaries/insights supports two modes: On-Device (Apple Foundation Models) and Cloud (OpenAI GPT-4o with zero-data-retention posture). No subscriptions, no paywalls. Developed on Windows using Expo + EAS cloud builds, tested on iPhone and iPad.[^1][^2]

***

## Architecture

| Layer | Technology | Where It Runs |
|-------|-----------|---------------|
| **Transcription** | SpeechAnalyzer + SpeechTranscriber | Always on-device (iOS 26)[^2] |
| **On-Device Summarization** | Apple Foundation Models (~3B param LLM) | On-device (Apple Intelligence)[^3] |
| **Cloud Summarization** | OpenAI GPT-4o | Cloud (ZDR posture)[^4] |
| **Audio Capture** | AVAudioEngine → AsyncStream → AnalyzerInput | On-device[^2] |
| **UI Framework** | React Native (Expo) + Swift native modules | Cross-compiled via EAS[^1] |
| **Storage** | AsyncStorage (local only) | On-device |

### Data Flow

```
[Microphone]
     │
  AVAudioEngine tap (4096 buffer)
     │
  AVAudioConverter → bestAvailableAudioFormat
     │
  AnalyzerInput → yield to AsyncStream
     │
  SpeechAnalyzer → SpeechTranscriber
     │
  ┌──────────────────────┐
  │  transcriber.results  │  (AsyncSequence)
  │  • volatile → partial │  (fast, rough)
  │  • isFinal → segment  │  (stable, accurate)
  └──────────────────────┘
     │
  RCTEventEmitter → JS
     │
  ┌────────────┐    ┌──────────────┐
  │ finalText   │ +  │ partialText   │  → Live UI
  └────────────┘    └──────────────┘
     │
  On stop: finalizeAndFinishThroughEndOfInput()
     │
  Full transcript → AI Brain
     │
  ┌──────────┴──────────┐
  │                      │
  ON-DEVICE MODE     CLOUD MODE
  Apple Foundation   OpenAI GPT-4o
  Models (iOS 26)    (ZDR posture)
  │                      │
  └──────────┬──────────┘
             │
       [Summary / Insights]
             │
       [AsyncStorage]
```

The key design choice: transcription is not modal. It always uses SpeechAnalyzer regardless of whether the user picks On-Device or Cloud for their AI brain. The mode toggle only affects post-transcription summarization.[^2][^3]

***

## Development Environment (Windows → iOS)

### Prerequisites

- **Windows**: Node.js 18+, VS Code, Git
- **Apple Developer Account**: $99/year (sign up from any browser)[^1]
- **iPhone or iPad**: Running iOS 26, registered for development

### Setup

```bash
# Install Expo and EAS CLIs
npm install -g expo-cli eas-cli
eas login

# Create the project
npx create-expo-app briefly --template blank-typescript
cd briefly

# Register your iOS devices for development builds
eas device:create
# → Opens a URL on your iPhone/iPad to install a provisioning profile
```

EAS Build compiles the app on Apple's macOS VMs in the cloud — no Mac needed. The free tier provides 15 iOS builds per month.[^5][^6]

### Development Cycle

```bash
# 1. Build the dev client (after any native code change)
eas build --platform ios --profile development

# 2. Install build on device via Expo Orbit or QR download link

# 3. Start Metro dev server on Windows
npx expo start

# 4. Open app on device — hot reload over local network
```

JavaScript changes hot-reload instantly. Native Swift changes require a new EAS build.[^7][^1]

***

## Project Structure

```
briefly/
├── app/
│   ├── index.tsx                         # Main screen (record + live transcript)
│   ├── recording/[id].tsx                # Recording detail view
│   └── _layout.tsx                       # Root layout (Expo Router)
├── src/
│   └── native/
│       └── BrieflySpeech.ts              # JS wrapper for native events
├── ios/
│   ├── BrieflySpeechTranscriber.swift    # Native module: live transcription
│   ├── BrieflySpeechTranscriberBridge.m  # Obj-C bridge macros
│   ├── BufferConverter.swift             # Audio format conversion utility
│   └── Briefly-Bridging-Header.h        # Bridging header for RCT imports
├── services/
│   ├── OnDeviceAI.ts                     # Apple Foundation Models summarization
│   ├── CloudAI.ts                        # OpenAI API summarization
│   └── Storage.ts                        # AsyncStorage CRUD
├── app.json
├── eas.json
└── package.json
```

***

## Dependencies

```bash
# Core
npx expo install expo-av expo-file-system
npm install @react-native-async-storage/async-storage

# Apple Intelligence (on-device summarization via Callstack)
npm install @react-native-ai/apple ai zod

# Prebuild (required — native Swift modules need bare workflow)
npx expo prebuild
```

No Whisper dependencies. Transcription uses only iOS 26 system frameworks (`Speech`, `AVFoundation`), which are linked automatically by Xcode during the EAS build.[^8][^2]

### `app.json`

```json
{
  "expo": {
    "name": "Briefly",
    "slug": "briefly",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourname.briefly",
      "supportsTablet": true,
      "deploymentTarget": "26.0",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Briefly needs microphone access to transcribe your speech.",
        "NSSpeechRecognitionUsageDescription": "Briefly uses speech recognition for live transcription."
      }
    },
    "plugins": ["expo-av"]
  }
}
```

### `eas.json`

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

***

## Native Module: Live Transcription (Swift)

This is the heart of the app. It mirrors Apple's WWDC25 sample code structure: set up a `SpeechTranscriber` with volatile results, attach it to a `SpeechAnalyzer`, feed mic audio through an `AsyncStream<AnalyzerInput>`, and read results from `transcriber.results`.[^2][^8]

### `ios/Briefly-Bridging-Header.h`

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
```

### `ios/BufferConverter.swift`

This utility converts microphone audio buffers to the format required by SpeechAnalyzer. The analyzer does not perform format conversion internally — the app must match `bestAvailableAudioFormat` exactly.[^8][^2]

```swift
import Foundation
import AVFoundation

class BufferConverter {

    enum ConversionError: Error {
        case failedToCreateConverter
        case failedToCreateBuffer
        case conversionFailed(NSError?)
    }

    private var converter: AVAudioConverter?

    func convertBuffer(
        _ buffer: AVAudioPCMBuffer,
        to format: AVAudioFormat
    ) throws -> AVAudioPCMBuffer {
        let inputFormat = buffer.format
        guard inputFormat != format else { return buffer }

        if converter == nil || converter?.outputFormat != format {
            converter = AVAudioConverter(from: inputFormat, to: format)
            converter?.primeMethod = .none
        }

        guard let converter else {
            throw ConversionError.failedToCreateConverter
        }

        let sampleRateRatio = converter.outputFormat.sampleRate
            / converter.inputFormat.sampleRate
        let frameCapacity = AVAudioFrameCount(
            (Double(buffer.frameLength) * sampleRateRatio).rounded(.up)
        )

        guard let outBuffer = AVAudioPCMBuffer(
            pcmFormat: converter.outputFormat,
            frameCapacity: frameCapacity
        ) else {
            throw ConversionError.failedToCreateBuffer
        }

        var nsError: NSError?
        var consumed = false

        let status = converter.convert(
            to: outBuffer, error: &nsError
        ) { _, inputStatus in
            defer { consumed = true }
            inputStatus.pointee = consumed ? .noDataNow : .haveData
            return consumed ? nil : buffer
        }

        guard status != .error else {
            throw ConversionError.conversionFailed(nsError)
        }

        return outBuffer
    }
}
```

### `ios/BrieflySpeechTranscriber.swift`

The main native module. It subclasses `RCTEventEmitter` to stream live transcript events back to JavaScript. The implementation follows the exact flow from Apple's WWDC25 session:[^9][^2]

1. Create `SpeechTranscriber` with `.volatileResults` and `.audioTimeRange`
2. Create `SpeechAnalyzer(modules: [transcriber])`
3. Get `bestAvailableAudioFormat`, ensure model is downloaded via `AssetInventory`
4. Create `AsyncStream<AnalyzerInput>`, start analyzer
5. Install `AVAudioEngine` tap, convert buffers, yield `AnalyzerInput`
6. Read `transcriber.results` — emit volatile as `partial`, final as `finalSegment`
7. On stop: `finalizeAndFinishThroughEndOfInput()` to flush volatile → final

```swift
import Foundation
import AVFoundation
import Speech
import React

@objc(BrieflySpeechTranscriber)
class BrieflySpeechTranscriber: RCTEventEmitter {

    // MARK: - Properties

    private var hasListeners = false

    private let audioEngine = AVAudioEngine()
    private let bufferConverter = BufferConverter()

    private var transcriber: SpeechTranscriber?
    private var analyzer: SpeechAnalyzer?
    private var analyzerFormat: AVAudioFormat?

    private var inputBuilder: AsyncStream<AnalyzerInput>.Continuation?
    private var resultsTask: Task<Void, Never>?

    private var finalizedTranscript = ""
    private var volatileTranscript = ""
    private var isRunning = false
    private var isSuspendedByInterruption = false
    private var wasRunningBeforeInterruption = false

    // Throttle: limit volatile emissions to ~10/sec
    private var lastPartialEmitTime: CFAbsoluteTime = 0
    private let minPartialInterval: CFAbsoluteTime = 0.1 // 100ms

    // MARK: - RCTEventEmitter overrides

    override static func requiresMainQueueSetup() -> Bool { true }

    override func supportedEvents() -> [String]! {
        [
            "BrieflySpeechPartial",
            "BrieflySpeechFinalSegment",
            "BrieflySpeechFinal",
            "BrieflySpeechState",
            "BrieflySpeechError"
        ]
    }

    override func startObserving() { hasListeners = true }
    override func stopObserving()  { hasListeners = false }

    private func emit(_ name: String, _ body: Any) {
        guard hasListeners else { return }
        sendEvent(withName: name, body: body)
    }

    // MARK: - JS API: start

    @objc(start:resolver:rejecter:)
    func start(
        _ localeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard !isRunning else {
            resolve(["ok": true])
            return
        }

        Task { @MainActor in
            do {
                // 1. Audio session
                let session = AVAudioSession.sharedInstance()
                try session.setCategory(.playAndRecord, mode: .spokenAudio)
                try session.setActive(true, options: .notifyOthersOnDeactivation)

                // 2. Register for audio interruptions + config changes
                self.registerAudioNotifications()

                // 3. SpeechTranscriber + SpeechAnalyzer
                let locale = Locale(identifier: localeId)
                let t = SpeechTranscriber(
                    locale: locale,
                    transcriptionOptions: [],
                    reportingOptions: [.volatileResults],
                    attributeOptions: [.audioTimeRange]
                )
                self.transcriber = t
                self.analyzer = SpeechAnalyzer(modules: [t])
                self.analyzerFormat = await SpeechAnalyzer
                    .bestAvailableAudioFormat(compatibleWith: [t])

                // 4. Ensure model is downloaded
                try await self.ensureModel(transcriber: t, locale: locale)

                // 5. Create input stream and start analyzer
                let (inputSequence, inputBuilder) =
                    AsyncStream<AnalyzerInput>.makeStream()
                self.inputBuilder = inputBuilder
                try await self.analyzer?.start(inputSequence: inputSequence)

                // 6. Start reading results
                self.finalizedTranscript = ""
                self.volatileTranscript = ""
                self.startResultsLoop()

                // 7. Start mic tap
                try self.startAudioEngineTap()

                self.isRunning = true
                self.isSuspendedByInterruption = false
                self.emit("BrieflySpeechState", ["state": "running"])
                resolve(["ok": true])
            } catch {
                self.emit("BrieflySpeechError",
                          ["message": error.localizedDescription])
                reject("START_FAILED", error.localizedDescription, error)
            }
        }
    }

    // MARK: - JS API: stop

    @objc(stop:rejecter:)
    func stop(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard isRunning else {
            resolve(["text": finalizedTranscript + volatileTranscript])
            return
        }

        Task { @MainActor in
            do {
                // Stop mic first
                self.stopAudioEngineTap()

                // Finish the input stream so analyzer knows no more audio
                self.inputBuilder?.finish()

                // Finalize: flushes volatile results into final results
                try await self.analyzer?.finalizeAndFinishThroughEndOfInput()

                // Brief pause to let the last results come through
                try await Task.sleep(for: .milliseconds(300))

                self.cleanup()
                self.isRunning = false

                let fullText = self.finalizedTranscript + self.volatileTranscript
                self.emit("BrieflySpeechFinal", ["text": fullText])
                self.emit("BrieflySpeechState", ["state": "stopped"])
                resolve(["text": fullText])
            } catch {
                self.emit("BrieflySpeechError",
                          ["message": error.localizedDescription])
                reject("STOP_FAILED", error.localizedDescription, error)
            }
        }
    }

    // MARK: - JS API: cancel

    @objc(cancel:rejecter:)
    func cancel(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        Task { @MainActor in
            self.stopAudioEngineTap()
            self.inputBuilder?.finish()
            await self.analyzer?.cancelAndFinishNow()
            self.cleanup()
            self.isRunning = false
            self.emit("BrieflySpeechState", ["state": "canceled"])
            resolve(["ok": true])
        }
    }

    // MARK: - Model management

    private func ensureModel(
        transcriber: SpeechTranscriber,
        locale: Locale
    ) async throws {
        let supported = await SpeechTranscriber.supportedLocales
        let bcp47 = locale.identifier(.bcp47)
        guard supported.map({ $0.identifier(.bcp47) }).contains(bcp47) else {
            throw NSError(
                domain: "BrieflySpeech", code: 10,
                userInfo: [NSLocalizedDescriptionKey:
                    "Language \(bcp47) not supported by SpeechTranscriber"]
            )
        }

        let installed = await Set(SpeechTranscriber.installedLocales)
        if installed.map({ $0.identifier(.bcp47) }).contains(bcp47) {
            return // already downloaded
        }

        // Download model via AssetInventory
        if let request = try await AssetInventory
            .assetInstallationRequest(supporting: [transcriber]) {
            try await request.downloadAndInstall()
        }
    }

    // MARK: - Results loop (with throttle for volatile results)

    private func startResultsLoop() {
        guard let transcriber else { return }

        resultsTask?.cancel()
        resultsTask = Task {
            do {
                for try await result in transcriber.results {
                    let text = String(result.text.characters)
                    if result.isFinal {
                        // Final segments: always emit immediately
                        self.finalizedTranscript += text
                        self.volatileTranscript = ""
                        // Send only the new segment; JS appends it
                        self.emit("BrieflySpeechFinalSegment",
                                  ["segment": text])
                    } else {
                        // Volatile: throttle to max ~10 emissions/sec
                        self.volatileTranscript = text
                        let now = CFAbsoluteTimeGetCurrent()
                        if now - self.lastPartialEmitTime >= self.minPartialInterval {
                            self.lastPartialEmitTime = now
                            self.emit("BrieflySpeechPartial",
                                      ["text": text])
                        }
                    }
                }
            } catch {
                self.emit("BrieflySpeechError",
                          ["message": "Results stream failed: "
                            + error.localizedDescription])
            }
        }
    }

    // MARK: - Audio interruption handling

    /// Registers for three critical notifications:
    /// 1. interruptionNotification — phone calls, alarms, Siri
    /// 2. AVAudioEngineConfigurationChange — sample rate / channel changes
    /// 3. mediaServicesWereResetNotification — rare OS-level audio reset
    private func registerAudioNotifications() {
        let nc = NotificationCenter.default

        nc.addObserver(
            self,
            selector: #selector(handleAudioInterruption),
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )

        nc.addObserver(
            self,
            selector: #selector(handleEngineConfigChange),
            name: NSNotification.Name.AVAudioEngineConfigurationChange,
            object: audioEngine
        )

        nc.addObserver(
            self,
            selector: #selector(handleMediaServicesReset),
            name: AVAudioSession.mediaServicesWereResetNotification,
            object: nil
        )
    }

    private func unregisterAudioNotifications() {
        let nc = NotificationCenter.default
        nc.removeObserver(self, name: AVAudioSession.interruptionNotification, object: nil)
        nc.removeObserver(self, name: NSNotification.Name.AVAudioEngineConfigurationChange, object: nil)
        nc.removeObserver(self, name: AVAudioSession.mediaServicesWereResetNotification, object: nil)
    }

    @objc private func handleAudioInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else { return }

        switch type {
        case .began:
            // iOS already stops AVAudioEngine; record state for resume
            wasRunningBeforeInterruption = isRunning
            isSuspendedByInterruption = true
            emit("BrieflySpeechState", ["state": "interrupted"])

        case .ended:
            guard wasRunningBeforeInterruption else { return }
            isSuspendedByInterruption = false

            let shouldResume: Bool = {
                guard let optVal = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return true }
                return AVAudioSession.InterruptionOptions(rawValue: optVal).contains(.shouldResume)
            }()

            if shouldResume {
                resumeAfterInterruption()
            } else {
                // System says don't resume — stop the session gracefully
                Task { @MainActor in
                    self.stopAudioEngineTap()
                    self.inputBuilder?.finish()
                    try? await self.analyzer?.finalizeAndFinishThroughEndOfInput()
                    self.cleanup()
                    self.isRunning = false
                    self.emit("BrieflySpeechState", ["state": "stopped"])
                    self.emit("BrieflySpeechFinal",
                              ["text": self.finalizedTranscript + self.volatileTranscript])
                }
            }

        @unknown default:
            break
        }
    }

    /// AVAudioEngineConfigurationChange fires *after* interruptionNotification
    /// when the interrupting app uses a different sample rate / channel count.
    /// The engine is stopped at this point; we must restart it.
    @objc private func handleEngineConfigChange(notification: Notification) {
        guard !isSuspendedByInterruption else { return }
        // Engine was stopped by a config change outside an interruption
        resumeAfterInterruption()
    }

    /// Media services reset is rare but catastrophic — all audio objects are
    /// invalidated. Tear everything down and notify JS.
    @objc private func handleMediaServicesReset(notification: Notification) {
        Task { @MainActor in
            self.stopAudioEngineTap()
            self.cleanup()
            self.isRunning = false
            self.isSuspendedByInterruption = false
            self.emit("BrieflySpeechState", ["state": "mediaReset"])
            self.emit("BrieflySpeechError",
                      ["message": "System audio services were reset. Please start a new recording."])
        }
    }

    private func resumeAfterInterruption() {
        Task { @MainActor in
            do {
                let session = AVAudioSession.sharedInstance()
                try session.setActive(true, options: .notifyOthersOnDeactivation)
                try self.audioEngine.start()
                self.emit("BrieflySpeechState", ["state": "running"])
            } catch {
                self.emit("BrieflySpeechError",
                          ["message": "Failed to resume after interruption: "
                            + error.localizedDescription])
            }
        }
    }

    // MARK: - Audio engine

    @MainActor
    private func startAudioEngineTap() throws {
        let inputNode = audioEngine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)

        inputNode.removeTap(onBus: 0)
        inputNode.installTap(
            onBus: 0,
            bufferSize: 4096,
            format: inputFormat
        ) { [weak self] buffer, _ in
            guard let self,
                  !self.isSuspendedByInterruption,
                  let analyzerFormat = self.analyzerFormat,
                  let inputBuilder = self.inputBuilder else { return }
            do {
                let converted = try self.bufferConverter
                    .convertBuffer(buffer, to: analyzerFormat)
                let input = AnalyzerInput(buffer: converted)
                inputBuilder.yield(input)
            } catch {
                self.emit("BrieflySpeechError",
                          ["message": "Buffer conversion failed: "
                            + error.localizedDescription])
            }
        }

        audioEngine.prepare()
        try audioEngine.start()
    }

    @MainActor
    private func stopAudioEngineTap() {
        audioEngine.inputNode.removeTap(onBus: 0)
        audioEngine.stop()
        try? AVAudioSession.sharedInstance()
            .setActive(false, options: .notifyOthersOnDeactivation)
    }

    // MARK: - Cleanup

    private func cleanup() {
        resultsTask?.cancel()
        resultsTask = nil
        inputBuilder = nil
        analyzer = nil
        transcriber = nil
        analyzerFormat = nil
        unregisterAudioNotifications()
    }
}
```

### `ios/BrieflySpeechTranscriberBridge.m`

The Objective-C bridge file exports the Swift class and its three promise-based methods to React Native.[^10][^11]

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BrieflySpeechTranscriber, RCTEventEmitter)

RCT_EXTERN_METHOD(start:(NSString *)localeId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancel:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

***

## JavaScript Layer

### `src/native/BrieflySpeech.ts`

This wrapper subscribes to native events and exposes a clean API to React components. It uses `NativeEventEmitter` as React Native documents for iOS event emitters.[^12][^10]

```typescript
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { BrieflySpeechTranscriber } = NativeModules;

const emitter =
  Platform.OS === 'ios'
    ? new NativeEventEmitter(BrieflySpeechTranscriber)
    : null;

export type SpeechState =
  | 'running'
  | 'stopped'
  | 'canceled'
  | 'interrupted'   // phone call, alarm, Siri
  | 'mediaReset';   // rare OS audio reset

export type SpeechEvent =
  | { type: 'partial'; text: string }           // volatile text only
  | { type: 'finalSegment'; segment: string }   // new stable segment only
  | { type: 'final'; text: string }             // full transcript on stop
  | { type: 'state'; state: SpeechState }
  | { type: 'error'; message: string };

export function addSpeechListener(cb: (e: SpeechEvent) => void) {
  if (!emitter) return () => {};

  const subs = [
    emitter.addListener('BrieflySpeechPartial', (p) =>
      cb({ type: 'partial', text: p.text })
    ),
    emitter.addListener('BrieflySpeechFinalSegment', (p) =>
      cb({ type: 'finalSegment', segment: p.segment })
    ),
    emitter.addListener('BrieflySpeechFinal', (p) =>
      cb({ type: 'final', text: p.text })
    ),
    emitter.addListener('BrieflySpeechState', (p) =>
      cb({ type: 'state', state: p.state })
    ),
    emitter.addListener('BrieflySpeechError', (p) =>
      cb({ type: 'error', message: p.message })
    ),
  ];

  return () => subs.forEach((s) => s.remove());
}

export async function startLiveTranscription(locale = 'en-US') {
  return BrieflySpeechTranscriber.start(locale);
}

export async function stopLiveTranscription(): Promise<{ text: string }> {
  return BrieflySpeechTranscriber.stop();
}

export async function cancelLiveTranscription() {
  return BrieflySpeechTranscriber.cancel();
}
```

Key changes from the naive version: native Swift now sends only the new `segment` (not the accumulated string) for `finalSegment` events, and volatile partials are throttled to ~10/sec on the native side. JS handles accumulation, keeping bridge payloads small even for hour-long recordings.

***

## Services (AI Brain + Storage)

### `services/OnDeviceAI.ts` — Apple Foundation Models

Uses Callstack's `@react-native-ai/apple` package, which wraps Apple's Foundation Models framework for React Native. The on-device LLM has a hard 4096-token context window (input + output combined). A rough `chars / 4` heuristic is unsafe with technical jargon, URLs, or non-English names — using a conservative multiplier of 3.0 characters per token gives a safety margin that prevents `Context length of 4096 was exceeded` errors. iOS 26.4+ adds `SystemLanguageModel.contextSize` and `tokenUsage(for:)` APIs for precise measurement.[^13][^14][^15][^3]

```typescript
import { apple } from '@react-native-ai/apple';
import { generateText, streamText } from 'ai';

// Conservative: 3 chars/token avoids edge-case overflows
// with jargon, URLs, non-English names
const SAFE_CHARS_PER_TOKEN = 3.0;

// Reserve tokens for the system prompt + output
const INPUT_TOKEN_BUDGET = 2800;
const MAX_CHUNK_CHARS = Math.floor(INPUT_TOKEN_BUDGET * SAFE_CHARS_PER_TOKEN);

export async function checkAvailability(): Promise<boolean> {
  try {
    const { text } = await generateText({
      model: apple(),
      prompt: 'Say OK',
      maxTokens: 5,
    });
    return !!text;
  } catch {
    return false;
  }
}

export async function summarizeOnDevice(transcript: string): Promise<string> {
  const chunks = chunkText(transcript, MAX_CHUNK_CHARS);
  let runningSummary = '';

  for (const chunk of chunks) {
    const prompt = runningSummary
      ? `Previous context: ${runningSummary}\n\nContinue summarizing:\n${chunk}`
      : `Summarize this transcript segment concisely:\n${chunk}`;

    try {
      const { text } = await generateText({
        model: apple(),
        prompt,
        temperature: 0.3,
      });
      runningSummary = text;
    } catch (err: any) {
      // If context exceeded despite safety margin, split chunk further
      if (err.message?.includes('Context length')) {
        const subChunks = chunkText(chunk, Math.floor(MAX_CHUNK_CHARS / 2));
        for (const sub of subChunks) {
          const { text } = await generateText({
            model: apple(),
            prompt: `Summarize concisely:\n${sub}`,
            temperature: 0.3,
          });
          runningSummary += ' ' + text;
        }
      } else {
        throw err;
      }
    }
  }

  if (chunks.length > 1) {
    const { text } = await generateText({
      model: apple(),
      prompt: `Create a final cohesive summary from these notes:\n${runningSummary}\n\nProvide:\n1) Key Points\n2) Action Items\n3) Brief Summary`,
      temperature: 0.3,
    });
    return text;
  }

  return runningSummary;
}

export async function summarizeOnDeviceStreaming(
  transcript: string,
  onChunk: (text: string) => void
): Promise<string> {
  const result = streamText({
    model: apple(),
    prompt: `Summarize this transcript with key points and action items:\n\n${transcript}`,
    temperature: 0.3,
  });

  let fullText = '';
  for await (const chunk of result.textStream) {
    fullText += chunk;
    onChunk(fullText);
  }
  return fullText;
}

function chunkText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).length > maxChars) {
      chunks.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
```

### `services/CloudAI.ts` — OpenAI API

Cloud mode sends only the transcript text (never audio) to OpenAI for summarization. Audio never leaves the device because transcription is always on-device via SpeechAnalyzer.[^2]

```typescript
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const BASE_URL = 'https://api.openai.com/v1';

export async function summarizeCloud(transcript: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert meeting summarizer. Extract key points, action items, and provide a concise summary. Be structured and clear.',
        },
        {
          role: 'user',
          content: `Summarize:\n\n${transcript}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error(`Summarization failed: ${res.statusText}`);
  const data = await res.json();
  return data.choices.message.content;
}

export async function summarizeCloudStreaming(
  transcript: string,
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert meeting summarizer. Extract key points, action items, and provide a concise summary.',
        },
        { role: 'user', content: `Summarize:\n\n${transcript}` },
      ],
      stream: true,
      temperature: 0.3,
    }),
  });

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
    for (const line of lines) {
      const json = line.replace('data: ', '');
      if (json === '[DONE]') break;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.?.delta?.content;
        if (content) {
          fullText += content;
          onChunk(fullText);
        }
      } catch {}
    }
  }
  return fullText;
}
```

### `services/Storage.ts` — Local Persistence

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Recording {
  id: string;
  title: string;
  date: string;
  duration: number;
  transcript: string;
  summary: string | null;
  mode: 'on-device' | 'cloud';
}

const KEY = '@briefly_recordings';

export async function saveRecording(rec: Recording) {
  const all = await getRecordings();
  all.unshift(rec);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function getRecordings(): Promise<Recording[]> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function getRecording(id: string): Promise<Recording | null> {
  const all = await getRecordings();
  return all.find((r) => r.id === id) || null;
}

export async function deleteRecording(id: string) {
  const all = await getRecordings();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter((r) => r.id !== id)));
}
```

***

## Main Screen: `app/index.tsx`

The UI shows live transcript text while recording — finalized segments in white, volatile partial text in a faded color — matching the exact UX pattern Apple demonstrates: volatile results appear immediately, then get replaced by finalized results. The native module now sends only new segments (not the full accumulated string) over the bridge, so JS accumulates locally — preventing memory bloat on long recordings.[^2]

```tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView, ScrollView, Text, TouchableOpacity,
  View, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import {
  addSpeechListener, startLiveTranscription,
  stopLiveTranscription, cancelLiveTranscription,
  SpeechState,
} from '../src/native/BrieflySpeech';
import * as OnDeviceAI from '../services/OnDeviceAI';
import * as CloudAI from '../services/CloudAI';
import * as Storage from '../services/Storage';

type AIMode = 'on-device' | 'cloud';

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [partialText, setPartialText] = useState('');
  const [summary, setSummary] = useState('');
  const [mode, setMode] = useState<AIMode>('on-device');
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [recordings, setRecordings] = useState<Storage.Recording[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  // Subscribe to native speech events
  useEffect(() => {
    const unsub = addSpeechListener((e) => {
      switch (e.type) {
        case 'partial':
          // Volatile text (already throttled native-side to ~10/sec)
          setPartialText(e.text);
          break;
        case 'finalSegment':
          // Append only the new segment — bridge sends segment, not full string
          setFinalText((prev) => prev + e.segment);
          setPartialText('');
          break;
        case 'final':
          setFinalText(e.text);
          setPartialText('');
          break;
        case 'state':
          if (e.state === 'interrupted') {
            setIsInterrupted(true);
          } else if (e.state === 'running') {
            setIsInterrupted(false);
          } else if (e.state === 'mediaReset') {
            setIsRecording(false);
            setIsInterrupted(false);
            if (timerRef.current) clearInterval(timerRef.current);
          } else if (e.state === 'stopped' || e.state === 'canceled') {
            setIsInterrupted(false);
          }
          break;
        case 'error':
          Alert.alert('Speech Error', e.message);
          break;
      }
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return unsub;
  }, []);

  async function loadRecordings() {
    setRecordings(await Storage.getRecordings());
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  async function onPressRecord() {
    if (isRecording) {
      // ── STOP ──
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setProcessing(true);
      setProgressMsg('Finalizing transcript…');

      try {
        const { text } = await stopLiveTranscription();
        const transcript = text || finalText + partialText;

        setProgressMsg('Generating summary…');
        const summaryText =
          mode === 'on-device'
            ? await OnDeviceAI.summarizeOnDevice(transcript)
            : await CloudAI.summarizeCloud(transcript);

        setSummary(summaryText);

        await Storage.saveRecording({
          id: Date.now().toString(),
          title: `Recording ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString(),
          duration: seconds * 1000,
          transcript,
          summary: summaryText,
          mode,
        });
        await loadRecordings();
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        setProcessing(false);
        setProgressMsg('');
      }
    } else {
      // ── START ──
      setFinalText('');
      setPartialText('');
      setSummary('');
      setSeconds(0);

      try {
        await startLiveTranscription('en-US');
        setIsRecording(true);
        timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      } catch (err: any) {
        Alert.alert('Start Failed', err.message);
      }
    }
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Briefly</Text>
        <Text style={s.subtitle}>Private Transcription & Summaries</Text>
      </View>

      {/* Mode toggle (only affects summarization) */}
      <View style={s.modeRow}>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'on-device' && s.modeBtnActive]}
          onPress={() => setMode('on-device')}
          disabled={isRecording}
        >
          <Text style={s.modeIcon}>🔒</Text>
          <Text style={[s.modeLbl, mode === 'on-device' && s.modeLblActive]}>
            On-Device
          </Text>
          <Text style={s.modeHint}>Private & Offline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.modeBtn, mode === 'cloud' && s.modeBtnActive]}
          onPress={() => setMode('cloud')}
          disabled={isRecording}
        >
          <Text style={s.modeIcon}>☁️</Text>
          <Text style={[s.modeLbl, mode === 'cloud' && s.modeLblActive]}>
            Cloud
          </Text>
          <Text style={s.modeHint}>Advanced Analysis</Text>
        </TouchableOpacity>
      </View>

      {/* Live transcript area */}
      <ScrollView
        ref={scrollRef}
        style={s.transcriptScroll}
        contentContainerStyle={s.transcriptContent}
      >
        {!finalText && !partialText && !summary && (
          <Text style={s.placeholder}>
            Tap the button below to start recording…
          </Text>
        )}

        {!!finalText && <Text style={s.finalTxt}>{finalText}</Text>}
        {!!partialText && <Text style={s.partialTxt}>{partialText}</Text>}

        {!!summary && (
          <View style={s.summaryBox}>
            <Text style={s.summaryTitle}>Summary</Text>
            <Text style={s.summaryTxt}>{summary}</Text>
          </View>
        )}
      </ScrollView>

      {/* Interruption banner */}
      {isInterrupted && (
        <View style={s.interruptBanner}>
          <Text style={s.interruptText}>
            ⏸ Recording paused — audio interrupted
          </Text>
        </View>
      )}

      {/* Record button + timer */}
      <View style={s.controls}>
        {isRecording && (
          <Text style={[s.timer, isInterrupted && s.timerPaused]}>
            {formatTime(seconds)}
          </Text>
        )}

        {processing ? (
          <View style={s.processingWrap}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={s.processingTxt}>{progressMsg}</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.recBtn} onPress={onPressRecord}>
            <View
              style={[s.recInner, isRecording && s.recInnerStop]}
            />
          </TouchableOpacity>
        )}

        <Text style={s.recHint}>
          {processing
            ? ''
            : isRecording
            ? 'Tap to stop'
            : 'Tap to record'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 34, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 15, color: '#888', marginTop: 2 },

  modeRow: {
    flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 12,
  },
  modeBtn: {
    flex: 1, padding: 14, borderRadius: 16,
    backgroundColor: '#1C1C1E', alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#0A2A4A', borderColor: '#007AFF', borderWidth: 1,
  },
  modeIcon: { fontSize: 22 },
  modeLbl: { fontSize: 15, fontWeight: '600', color: '#FFF', marginTop: 6 },
  modeLblActive: { color: '#007AFF' },
  modeHint: { fontSize: 11, color: '#888', marginTop: 2 },

  transcriptScroll: {
    flex: 1, marginTop: 16, marginHorizontal: 20,
    backgroundColor: '#1C1C1E', borderRadius: 16,
  },
  transcriptContent: { padding: 16, paddingBottom: 24 },
  placeholder: { color: '#555', fontSize: 16 },
  finalTxt: { color: '#FFF', fontSize: 16, lineHeight: 24 },
  partialTxt: {
    color: '#AAA', fontSize: 16, lineHeight: 24,
    opacity: 0.5, fontStyle: 'italic',
  },

  summaryBox: {
    marginTop: 20, padding: 14,
    backgroundColor: '#0A2A4A', borderRadius: 12,
  },
  summaryTitle: {
    color: '#007AFF', fontSize: 14, fontWeight: '700', marginBottom: 8,
  },
  summaryTxt: { color: '#DDD', fontSize: 15, lineHeight: 22 },

  controls: { alignItems: 'center', paddingBottom: 28, paddingTop: 12 },
  timer: {
    fontSize: 44, fontWeight: '200', color: '#FF3B30', marginBottom: 12,
  },
  recBtn: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#FF3B30',
    justifyContent: 'center', alignItems: 'center',
  },
  recInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF3B30',
  },
  recInnerStop: { width: 28, height: 28, borderRadius: 6 },
  recHint: { fontSize: 13, color: '#888', marginTop: 8 },

  processingWrap: { alignItems: 'center', padding: 16 },
  processingTxt: { color: '#FFF', fontSize: 15, marginTop: 10 },

  interruptBanner: {
    backgroundColor: '#FF9500', paddingVertical: 8, paddingHorizontal: 16,
    marginHorizontal: 20, borderRadius: 10, marginTop: 8,
  },
  interruptText: { color: '#000', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  timerPaused: { color: '#FF9500' },
});
```

***

## Robustness: Four Production Hardening Fixes

The following fixes address real-world edge cases that would otherwise cause crashes or degraded UX in production.

### Audio Interruptions (Phone Calls, Alarms, Siri)

iOS aggressively reclaims audio resources when a phone call arrives, an alarm fires, or Siri activates. Without handling, `AVAudioEngine` silently halts or crashes. The native module now observes three notifications:[^16][^17]

| Notification | Trigger | Response |
|---|---|---|
| `interruptionNotification` | Phone call, alarm, Siri, other app takes mic | Pause on `.began`, resume or stop on `.ended` based on `.shouldResume`[^16][^17] |
| `AVAudioEngineConfigurationChange` | Interrupting app uses different sample rate/channels | Restart engine after config settles (fires *after* interruption ends)[^16] |
| `mediaServicesWereResetNotification` | Rare OS-level audio daemon crash | Tear down everything, notify JS to start fresh[^17][^18] |

The `.ended` handler checks `AVAudioSession.InterruptionOptions.shouldResume` before restarting — not all interruptions allow automatic resume (e.g., if another app permanently claims the mic). The audio tap's closure also guards against `isSuspendedByInterruption` to avoid feeding stale buffers into SpeechAnalyzer during the transition.[^19][^20]

### Bridge Traffic Throttling

`SpeechTranscriber` with `.volatileResults` can fire dozens of results per second. Sending every one over the React Native bridge causes UI stutter on older devices, as each event requires JSON serialization across the JS-native boundary. The native module now enforces a 100ms minimum interval between `BrieflySpeechPartial` emissions (~10 updates/sec max). Final segments are always emitted immediately since they fire far less frequently. This balances responsive live text with smooth 60fps rendering.[^21][^22][^2]

### Conservative Token Estimation

The Apple Foundation Models on-device LLM has a hard 4096-token context window (input + output combined). The naive `chars ÷ 4` heuristic overestimates capacity — technical jargon, URLs, code snippets, and non-English names tokenize less efficiently. The chunking function now uses `3.0 chars/token` with a 2800-token input budget (reserving ~1296 tokens for the system prompt + model output). If the model still throws `Context length exceeded`, a catch block automatically re-splits the offending chunk at half size. iOS 26.4+ adds `tokenUsage(for:)` for precise pre-measurement.[^14][^13]

### Memory-Efficient Bridge Payloads

For long lectures or meetings, the earlier design sent the entire accumulated transcript string over the bridge on every `finalSegment` event — growing linearly with recording length. The updated design sends only the new segment text (`{"segment": "new words"}`) and lets JavaScript append it to local state via `setFinalText((prev) => prev + e.segment)`. This keeps bridge payloads constant-size regardless of recording duration.

***

## Privacy Architecture

| Data | On-Device Mode | Cloud Mode |
|------|---------------|------------|
| **Audio** | Never leaves device (mic → AVAudioEngine → SpeechAnalyzer)[^2] | Never leaves device (same pipeline) |
| **Transcript** | Stays on device (AsyncStorage) | Stays on device (only sent for summarization) |
| **Summary request** | Processed by Apple Foundation Models on-device[^3] | Sent to OpenAI (transcript text only, no audio) |
| **Summary result** | Stored locally | Stored locally |
| **Speech model** | System-managed asset, not in app bundle[^2] | N/A |

Audio never leaves the device in either mode. The only data that touches the network in Cloud mode is the transcript text sent to OpenAI for summarization. To minimize retention, disable API call logging in the OpenAI dashboard.[^23]

***

## Device Requirements

| Feature | Requirement |
|---------|-------------|
| Live transcription (SpeechAnalyzer) | iOS 26+ (any supported hardware)[^2] |
| On-device summarization (Apple Intelligence) | iOS 26 + Apple Intelligence device (iPhone 15 Pro+, M-series iPad)[^3] |
| Cloud summarization | iOS 26 + internet + OpenAI API key |
| Full offline operation | iOS 26 + Apple Intelligence device |

Set `deploymentTarget: "26.0"` in `app.json` to enforce the iOS 26 minimum. Devices running older iOS versions will not be able to install the app.

***

## Build & Submit (Windows)

```bash
# Development build (after native code changes)
eas build --platform ios --profile development

# Production build
eas build --platform ios --profile production

# Submit to App Store (also from Windows)
eas submit --platform ios
```

All compilation occurs on EAS cloud macOS VMs with Xcode. The development build connects to the Windows Metro server for JS hot reload. Only native Swift changes require a new cloud build.[^6][^1]

***

## Potential Enhancements

- **Word-level playback highlighting**: The `.audioTimeRange` attribute option is already enabled in the native module. Each result's `AttributedString` contains `CMTimeRange` per run, which can be used to highlight words during audio playback.[^2]
- **Multi-language support**: Call `SpeechTranscriber.supportedLocales` to list available languages, and pass a different locale to `startLiveTranscription()`. The `ensureModel` function already handles downloading new language packs via `AssetInventory`.[^2]
- **Recording detail screen**: A dedicated screen showing the full transcript, editable title, share/export, and the summary.
- **SQLite migration**: Replace AsyncStorage with `expo-sqlite` for better performance with large recording libraries.
- **Siri Shortcuts / Action Button**: Launch recording instantly from the Lock Screen or Action Button.

---

## References

1. [Can i develop and publish iOS app only using windows laptop with ...](https://stackoverflow.com/questions/79484102/can-i-develop-and-publish-ios-app-only-using-windows-laptop-with-eas-build-and-i) - Development can be done on your Windows PC, with testing on your iPhone through the Expo Go App. Whe...

2. [Bring advanced speech-to-text to your app with SpeechAnalyzer](https://developer.apple.com/videos/play/wwdc2025/277/) - Discover the new SpeechAnalyzer API for speech to text. We'll learn about the Swift API and its capa...

3. [Community Providers: React Native Apple - AI SDK](https://ai-sdk.dev/providers/community-providers/react-native-apple) - It allows you to run the AI SDK entirely on-device, leveraging Apple Intelligence foundation models ...

4. [Zero Data Retention Information - API - OpenAI Developer Community](https://community.openai.com/t/zero-data-retention-information/702540) - The standards retention is 30 days for the “eligible endpoints” - this does not seem to be the same ...

5. [Using expo, is there a way to build iOS for free if you're on windows?](https://www.reddit.com/r/reactnative/comments/1jtwa2m/using_expo_is_there_a_way_to_build_ios_for_free/) - Yes, you can use the eas service. You get 15 free iOS builds for free per month, then get charged pe...

6. [iOS build process](https://docs.expo.dev/build-reference/ios-builds/) - Learn how an iOS project is built on EAS Build. This page describes the process of building iOS proj...

7. [Is it possible to run Expo using EAS on an iPhone device but on ...](https://stackoverflow.com/questions/77450688/is-it-possible-to-run-expo-using-eas-on-an-iphone-device-but-on-windows) - Yes, you can use EAS for development builds. Once built and installed on your device it can connect ...

8. [Implementing advanced speech-to-text in your SwiftUI app](https://www.createwithswift.com/implementing-advanced-speech-to-text-in-your-swiftui-app/) - bestAvailableAudioFormat(compatibleWith: [transcriber!]) let (inputSequence, inputBuilder) = AsyncSt...

9. [Bring advanced speech-to-text to your app with SpeechAnalyzer](https://developer.apple.com/videos/play/wwdc2025/277/?time=26) - SpeechAnalyzer, built with Swift, is faster, more flexible, and supports long-form and distant audio...

10. [iOS Native Modules](https://reactnative.dev/docs/legacy/native-modules-ios) - In the following guide you will create a native module, CalendarModule, that will allow you to acces...

11. [Integrating React Native into iOS Apps - The Miners](https://blog.codeminer42.com/integrating-react-native-into-ios-apps/) - RCTEventEmitter.swift : It's the actual swift implementation of the event emitter that will be used ...

12. [Sending Events to JavaScript in React Native - Callstack](https://www.callstack.com/blog/sending-events-to-javascript-from-your-native-module-in-react-native) - 1. Subclass #import <React/RCTBridgeModule.h> · 2. Implement #import "ModuleWithEmitter.h" · 3. Send...

13. [What's the context limit for the Foundation Models Framework?](https://stackoverflow.com/questions/79672782/whats-the-context-limit-for-the-foundation-models-framework) - Based on trial-and-error, it seems the limit is 4096 tokens. You get the message: `Failed to run inf...

14. [Tracking token usage in Foundation Models - Artem Novichkov](https://artemnovichkov.com/blog/tracking-token-usage-in-foundation-models) - iOS 26.4 introduces token usage tracking for Apple's Foundation Models framework. The on-device mode...

15. [On-Device Apple LLM Support Comes to React Native - Callstack](https://www.callstack.com/blog/on-device-apple-llm-support-comes-to-react-native) - React Native now supports Apple's on-device LLM for private, fast, and offline AI experiences. Build...

16. [Correct way to recover from a Core Audio interruption - Audiodog](https://www.audiodog.co.uk/blog/2021/07/11/correct-way-to-recover-from-core-audio-interruptions/) - A basic implmentation just needs to have a guard flag to store the interruption state and then resta...

17. [Quick Notes on AVAudioSession - Zenn](https://zenn.dev/nobu_y/articles/d3165cbd667918?locale=en) - AVAudioSession.mediaServicesWereResetNotification. This is notified when media services (system-leve...

18. [mediaServicesWereResetNotific...](https://developer.apple.com/documentation/avfaudio/avaudiosession/mediaserviceswereresetnotification) - You can trigger a media server reset by choosing the “Reset Media Services” selection under the Deve...

19. [How I handle audio interruptions (phone calls, Siri) with proper state ...](https://www.reddit.com/r/SwiftUI/comments/1qu8k2i/how_i_handle_audio_interruptions_phone_calls_siri/) - During development of my internet radio streaming app "Pladio", I discovered that handling interrupt...

20. [Resuming AVPlayer after being interrupted - Erik's Hangout](https://blog.erikvdwal.nl/resuming-avplayer-after-being-interrupted/index.html) - In order for your application to do so, you need to switch on Background Modes via your target's Cap...

21. [React Native Improved Performance: 2025 Techniques ... - Infozzle](https://www.infozzle.com/blog/react-native-improved-performance-2025-techniques-benchmarks-and-best-practices/) - Switch to Hermes for quicker startup and lower memory. Adopt the New Architecture (Fabric + TurboMod...

22. [Performance hit when handling every single event ... - Stack Overflow](https://stackoverflow.com/questions/76137159/performance-hit-when-handling-every-single-event-from-event-emitters-rn) - I am using react-native-reanimated for moving the View by modifying the translateX property. When I ...

23. [Zero Retention Days and API Call Logging](https://community.openai.com/t/zero-retention-days-and-api-call-logging/1147377) - To help identify abuse, API data may be retained for up to 30 days, after which it will be deleted (...

