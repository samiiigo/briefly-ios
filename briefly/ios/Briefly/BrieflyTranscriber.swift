// BrieflyTranscriber.swift
// Native module: wraps Apple SpeechAnalyzer (iOS 26+) and Apple Foundation Models.
// Exposes RCT methods for React Native.

import Foundation
import AVFoundation

// ─── Conditional imports for iOS 26+ APIs ────────────────────────────────────
// SpeechAnalyzer and FoundationModels are only available on iOS 26+.
// We guard all usage with #available checks so the app compiles on older SDKs.

#if canImport(Speech)
import Speech
#endif

@objc(BrieflyTranscriber)
class BrieflyTranscriber: RCTEventEmitter {

  private var hasListeners = false

  // MARK: - RCTEventEmitter

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String] {
    ["onTranscriptSegment", "onTranscriptionComplete", "onTranscriptionError"]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  // MARK: - Transcription

  @objc func transcribeFile(_ filePath: String) {
    guard #available(iOS 17.0, *) else {
      sendError("Requires iOS 17+")
      return
    }

    let url: URL
    if filePath.hasPrefix("file://") {
      url = URL(string: filePath)!
    } else {
      url = URL(fileURLWithPath: filePath)
    }

    transcribeWithSFSpeech(url: url)
  }

  // ─── SFSpeechRecognizer (iOS 17+, available everywhere) ─────────────────────

  @available(iOS 17.0, *)
  private func transcribeWithSFSpeech(url: URL) {
    guard let recognizer = SFSpeechRecognizer(locale: Locale.current),
          recognizer.isAvailable else {
      sendError("Speech recognition is not available on this device.")
      return
    }

    SFSpeechRecognizer.requestAuthorization { [weak self] status in
      guard let self = self else { return }
      guard status == .authorized else {
        self.sendError("Speech recognition permission denied.")
        return
      }

      let request = SFSpeechURLRecognitionRequest(url: url)
      request.shouldReportPartialResults = false
      request.requiresOnDeviceRecognition = true // Privacy-first

      recognizer.recognitionTask(with: request) { [weak self] result, error in
        guard let self = self else { return }

        if let error = error {
          self.sendError(error.localizedDescription)
          return
        }

        guard let result = result else { return }

        if result.isFinal {
          let segments = result.bestTranscription.segments
          var offset: Double = 0

          for (i, segment) in segments.enumerated() {
            let startTime = segment.timestamp
            let endTime = startTime + segment.duration
            let payload: [String: Any] = [
              "text": segment.substring,
              "startTime": startTime,
              "endTime": endTime,
              "isFinal": true,
            ]
            self.sendEvent(withName: "onTranscriptSegment", body: payload)
          }

          self.sendEvent(withName: "onTranscriptionComplete", body: [:])
        }
      }
    }
  }

  // MARK: - Summarization (placeholder — connects to Apple Intelligence on iOS 26+)

  @objc func summarize(_ text: String,
                        resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    // TODO: On iOS 26+, use FoundationModels.GenerativeModel for on-device inference.
    // For now, perform simple extractive summarization in Swift.
    let result = extractiveSummarize(text: text)
    resolve(result)
  }

  private func extractiveSummarize(text: String) -> [String: Any] {
    let sentences = text
      .components(separatedBy: CharacterSet(charactersIn: ".!?"))
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .filter { $0.count > 20 }

    let summary = sentences.prefix(3).joined(separator: ". ")
    let keywords = ["decide", "action", "will", "should", "must", "key", "important"]
    let insights = sentences.filter { sentence in
      keywords.contains { sentence.lowercased().contains($0) }
    }.prefix(5).map { $0 }

    return [
      "summary": summary.isEmpty ? text.prefix(200).description : summary,
      "keyInsights": insights.isEmpty && !sentences.isEmpty
        ? [sentences[0]]
        : Array(insights),
    ]
  }

  // MARK: - Helpers

  private func sendError(_ message: String) {
    sendEvent(withName: "onTranscriptionError", body: ["message": message])
  }
}
