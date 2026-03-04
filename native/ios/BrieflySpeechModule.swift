import Foundation
import Speech

@objc(BrieflySpeechModule)
final class BrieflySpeechModule: NSObject {
  private var startedAt: Date?

  @objc
  func isAvailable(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(SFSpeechRecognizer.authorizationStatus() != .denied)
  }

  @objc
  func startTranscription(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    startedAt = Date()
    resolve(nil)
  }

  @objc
  func stopTranscription(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    let duration = Int(Date().timeIntervalSince(startedAt ?? Date()))
    resolve([
      "text": "iOS transcription placeholder from SFSpeechRecognizer bridge",
      "durationSeconds": duration
    ])
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }
}
