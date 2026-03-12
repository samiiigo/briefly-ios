// BrieflyTranscriber.swift
// Real-time on-device transcription + recording via AVAudioEngine.
// Uses SFSpeechAudioBufferRecognitionRequest (iOS 13+) with
// requiresOnDeviceRecognition = true for privacy and speed.
// Auto-restarts the recognition task to bypass the OS 1-minute limit.

import Foundation
import AVFoundation
import Speech

@objc(BrieflyTranscriber)
class BrieflyTranscriber: RCTEventEmitter {

  // MARK: - Live session state

  private var audioEngine: AVAudioEngine?
  private var speechRecognizer: SFSpeechRecognizer?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var audioFile: AVAudioFile?
  private var liveOutputURL: URL?
  private var liveStartDate: Date?
  private var liveInputFormat: AVAudioFormat?

  private var isLive = false
  private var isPaused = false
  private var hasListeners = false

  // MARK: - RCTEventEmitter

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String] {
    [
      "onPartialTranscript",     // real-time partial result during live session
      "onFinalTranscript",       // finalized segment from live session
      "onTranscriptSegment",     // word-level segment from post-recording file transcription
      "onTranscriptionComplete", // post-recording file transcription finished
      "onTranscriptionError",    // any error
    ]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving()  { hasListeners = false }

  // MARK: - Live Transcription: Start

  @objc func startLiveTranscription(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    SFSpeechRecognizer.requestAuthorization { [weak self] status in
      guard let self else { return }
      guard status == .authorized else {
        reject("PERMISSION_DENIED", "Speech recognition permission denied", nil)
        return
      }
      DispatchQueue.main.async {
        self.doStartLive(resolve: resolve, reject: reject)
      }
    }
  }

  private func doStartLive(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    // Pick best available recognizer for the device locale
    let locale = Locale.current
    let recognizer: SFSpeechRecognizer? = SFSpeechRecognizer(locale: locale)?.isAvailable == true
      ? SFSpeechRecognizer(locale: locale)
      : SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

    guard let recognizer, recognizer.isAvailable else {
      reject("UNAVAILABLE", "Speech recognition is not available on this device", nil)
      return
    }
    speechRecognizer = recognizer

    // Configure audio session for recording
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.record, mode: .measurement, options: .duckOthers)
      try session.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      reject("AUDIO_SESSION", error.localizedDescription, error)
      return
    }

    // Output file — CAF supports the hardware's native float PCM format directly
    let ts = Int(Date().timeIntervalSince1970)
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    liveOutputURL = docs.appendingPathComponent("recording-\(ts).caf")

    let engine = AVAudioEngine()
    audioEngine = engine
    let inputNode = engine.inputNode
    let inputFormat = inputNode.outputFormat(forBus: 0)
    liveInputFormat = inputFormat

    // Open output file using the hardware's native format (no conversion needed)
    do {
      audioFile = try AVAudioFile(forWriting: liveOutputURL!, settings: inputFormat.settings)
    } catch {
      reject("FILE_ERROR", error.localizedDescription, error)
      return
    }

    // Start the first recognition task
    spawnRecognitionTask(recognizer: recognizer, engine: engine, inputFormat: inputFormat)

    // Tap microphone: feed to recognizer AND write to file simultaneously
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { [weak self] buffer, _ in
      guard let self, !self.isPaused else { return }
      self.recognitionRequest?.append(buffer)
      try? self.audioFile?.write(from: buffer)
    }

    engine.prepare()
    do {
      try engine.start()
    } catch {
      reject("ENGINE_START", error.localizedDescription, error)
      return
    }

    isLive = true
    isPaused = false
    liveStartDate = Date()
    resolve(nil)
  }

  // MARK: - Recognition task lifecycle

  /// Creates a fresh SFSpeechAudioBufferRecognitionRequest and starts a recognition task.
  /// Called initially and again automatically whenever the current task ends (OS ~1 min limit).
  private func spawnRecognitionTask(
    recognizer: SFSpeechRecognizer,
    engine: AVAudioEngine,
    inputFormat: AVAudioFormat
  ) {
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    request.requiresOnDeviceRecognition = true  // Always on-device: speed + privacy
    if #available(iOS 16, *) {
      request.addsPunctuation = true
    }
    recognitionRequest = request

    recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      guard let self else { return }

      if let result {
        let text = result.bestTranscription.formattedString
        if result.isFinal {
          // Emit finalized speech segment
          if self.hasListeners {
            self.sendEvent(withName: "onFinalTranscript", body: ["text": text])
          }
          // Immediately spawn a new task to continue transcribing (bypasses OS 1-min limit)
          if self.isLive && !self.isPaused {
            self.spawnRecognitionTask(recognizer: recognizer, engine: engine, inputFormat: inputFormat)
          }
        } else {
          // Emit live partial update
          if self.hasListeners {
            self.sendEvent(withName: "onPartialTranscript", body: ["text": text])
          }
        }
      }

      if let error {
        let code = (error as NSError).code
        // 1110 = no speech detected, 1700 = cancelled — both are normal during live use
        let isNormal = (code == 1110 || code == 1700 || code == 203)
        if !isNormal && self.isLive {
          // Transient OS error — respawn after a short delay
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard let self, self.isLive, !self.isPaused else { return }
            self.spawnRecognitionTask(recognizer: recognizer, engine: engine, inputFormat: inputFormat)
          }
        }
      }
    }
  }

  // MARK: - Live Transcription: Pause

  @objc func pauseLiveTranscription(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isLive else {
      resolve(nil)
      return
    }
    isPaused = true
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    audioEngine?.pause()
    resolve(nil)
  }

  // MARK: - Live Transcription: Resume

  @objc func resumeLiveTranscription(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isLive, let engine = audioEngine,
          let recognizer = speechRecognizer,
          let format = liveInputFormat else {
      reject("NOT_LIVE", "No active live transcription session", nil)
      return
    }
    do {
      try engine.start()
      isPaused = false
      spawnRecognitionTask(recognizer: recognizer, engine: engine, inputFormat: format)
      resolve(nil)
    } catch {
      reject("ENGINE_START", error.localizedDescription, error)
    }
  }

  // MARK: - Live Transcription: Stop

  @objc func stopLiveTranscription(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let duration = liveStartDate.map { Date().timeIntervalSince($0) } ?? 0
    let uri = liveOutputURL?.absoluteString ?? ""

    isLive = false
    isPaused = false

    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()

    // Setting audioFile to nil closes and flushes the CAF file
    audioFile = nil

    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

    // Clean up state
    audioEngine = nil
    recognitionRequest = nil
    recognitionTask = nil
    speechRecognizer = nil
    liveOutputURL = nil
    liveStartDate = nil
    liveInputFormat = nil

    resolve(["uri": uri, "duration": duration])
  }

  // MARK: - Post-recording file transcription (used after saving to get full transcript)

  @objc func transcribeFile(_ filePath: String) {
    let url: URL
    if filePath.hasPrefix("file://") {
      guard let u = URL(string: filePath) else {
        sendError("Invalid file URI: \(filePath)")
        return
      }
      url = u
    } else {
      url = URL(fileURLWithPath: filePath)
    }

    guard let recognizer = SFSpeechRecognizer(locale: Locale.current),
          recognizer.isAvailable else {
      sendError("Speech recognition is not available on this device.")
      return
    }

    SFSpeechRecognizer.requestAuthorization { [weak self] status in
      guard let self else { return }
      guard status == .authorized else {
        self.sendError("Speech recognition permission denied.")
        return
      }

      let request = SFSpeechURLRecognitionRequest(url: url)
      request.shouldReportPartialResults = false
      request.requiresOnDeviceRecognition = true

      if #available(iOS 16, *) {
        request.addsPunctuation = true
      }

      recognizer.recognitionTask(with: request) { [weak self] result, error in
        guard let self else { return }

        if let error {
          self.sendError(error.localizedDescription)
          return
        }

        guard let result, result.isFinal else { return }

        for segment in result.bestTranscription.segments {
          let payload: [String: Any] = [
            "text": segment.substring,
            "startTime": segment.timestamp,
            "endTime": segment.timestamp + segment.duration,
            "isFinal": true,
          ]
          self.sendEvent(withName: "onTranscriptSegment", body: payload)
        }

        self.sendEvent(withName: "onTranscriptionComplete", body: [:])
      }
    }
  }

  // MARK: - Summarization (on-device extractive; upgrade to FoundationModels on iOS 26+)

  @objc func summarize(
    _ text: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(extractiveSummarize(text: text))
  }

  private func extractiveSummarize(text: String) -> [String: Any] {
    let sentences = text
      .components(separatedBy: CharacterSet(charactersIn: ".!?"))
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .filter { $0.count > 20 }

    let summary = sentences.prefix(3).joined(separator: ". ")
    let keywords = ["decide", "action", "will", "should", "must", "key", "important"]
    let insights = sentences
      .filter { s in keywords.contains { s.lowercased().contains($0) } }
      .prefix(5)
      .map { $0 }

    return [
      "summary": summary.isEmpty ? String(text.prefix(200)) : summary,
      "keyInsights": insights.isEmpty && !sentences.isEmpty ? [sentences[0]] : Array(insights),
    ]
  }

  // MARK: - Helpers

  private func sendError(_ message: String) {
    guard hasListeners else { return }
    sendEvent(withName: "onTranscriptionError", body: ["message": message])
  }
}
