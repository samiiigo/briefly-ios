// BrieflyTranscriber.swift
// Real-time live transcription + recording via AVAudioEngine.
// Streams 16kHz PCM audio to AssemblyAI websocket from native iOS code.
// Also keeps post-recording on-device file transcription as a fallback path.

import Foundation
import AVFoundation
import Speech

private final class OnDeviceSpeechSession {
  private let engine = AVAudioEngine()
  private let speechRecognizer: SFSpeechRecognizer?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var audioFile: AVAudioFile?
  private(set) var outputURL: URL?
  private var startDate: Date?

  var onPartial: ((String) -> Void)?
  var onFinal: ((String) -> Void)?
  var onState: ((String, String?) -> Void)?
  var onError: ((String) -> Void)?

  init(locale: Locale = Locale.current) {
    self.speechRecognizer = SFSpeechRecognizer(locale: locale)
  }

  func start() throws {
    guard let recognizer = speechRecognizer else {
      throw NSError(domain: "OnDeviceSpeechSession", code: -1, userInfo: [
        NSLocalizedDescriptionKey: "Speech recognizer unavailable."
      ])
    }

    if #available(iOS 13.0, *),
       recognizer.supportsOnDeviceRecognition == false {
      throw NSError(domain: "OnDeviceSpeechSession", code: -2, userInfo: [
        NSLocalizedDescriptionKey: "On-device recognition is not supported for this locale."
      ])
    }

    let authStatus = SFSpeechRecognizer.authorizationStatus()
    if authStatus == .notDetermined {
      var authError: Error?
      let group = DispatchGroup()
      group.enter()
      SFSpeechRecognizer.requestAuthorization { status in
        if status != .authorized {
          authError = NSError(domain: "OnDeviceSpeechSession", code: -3, userInfo: [
            NSLocalizedDescriptionKey: "Speech recognition authorization denied."
          ])
        }
        group.leave()
      }
      group.wait()
      if let authError {
        throw authError
      }
    } else if authStatus != .authorized {
      throw NSError(domain: "OnDeviceSpeechSession", code: -4, userInfo: [
        NSLocalizedDescriptionKey: "Speech recognition authorization denied."
      ])
    }

    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
    try session.setActive(true, options: .notifyOthersOnDeactivation)

    let inputNode = engine.inputNode
    let inputFormat = inputNode.outputFormat(forBus: 0)

    let request = SFSpeechAudioBufferRecognitionRequest()
    if #available(iOS 13.0, *) {
      request.requiresOnDeviceRecognition = true
    }
    request.shouldReportPartialResults = true
    recognitionRequest = request

    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let ts = Int(Date().timeIntervalSince1970)
    let url = docs.appendingPathComponent("ondevice-\(ts).caf")
    outputURL = url

    let file = try AVAudioFile(forWriting: url, settings: inputFormat.settings)
    audioFile = file

    inputNode.installTap(onBus: 0, bufferSize: 2048, format: inputFormat) { [weak self] buffer, _ in
      guard let self, let request = self.recognitionRequest else { return }
      do {
        try self.audioFile?.write(from: buffer)
      } catch {
        self.onError?("Audio write failed: \(error.localizedDescription)")
      }
      request.append(buffer)
    }

    recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      guard let self else { return }
      if let error {
        self.onError?("Speech recognition failed: \(error.localizedDescription)")
        self.onState?("closed", "error")
        return
      }
      guard let result else { return }
      let text = result.bestTranscription.formattedString
        .trimmingCharacters(in: .whitespacesAndNewlines)
      guard !text.isEmpty else { return }

      if result.isFinal {
        self.onFinal?(text)
        self.onState?("closed", "final")
      } else {
        self.onPartial?(text)
        self.onState?("open", nil)
      }
    }

    engine.prepare()
    try engine.start()
    startDate = Date()
    onState?("open", nil)
  }

  func pause() {
    engine.pause()
    onState?("paused", nil)
  }

  func resume() throws {
    try engine.start()
    onState?("open", nil)
  }

  func stop() -> (uri: String, duration: TimeInterval) {
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    recognitionRequest = nil
    recognitionTask = nil
    audioFile = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

    let duration = startDate.map { Date().timeIntervalSince($0) } ?? 0
    let uri = outputURL?.absoluteString ?? ""
    outputURL = nil
    startDate = nil
    return (uri, duration)
  }
}

private final class LiveAudioCapture {
  private let sampleRate: Double
  private let engine = AVAudioEngine()
  private var converter: AVAudioConverter?
  private var targetFormat: AVAudioFormat?
  private var audioFile: AVAudioFile?
  private(set) var outputURL: URL?

  var onPCMChunk: ((Data) -> Void)?
  var onError: ((String) -> Void)?

  init(sampleRate: Double) {
    self.sampleRate = sampleRate
  }

  func start() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers, .defaultToSpeaker])
    try session.setActive(true, options: .notifyOthersOnDeactivation)

    let inputNode = engine.inputNode
    let inputFormat = inputNode.outputFormat(forBus: 0)

    guard let target = AVAudioFormat(
      commonFormat: .pcmFormatInt16,
      sampleRate: sampleRate,
      channels: 1,
      interleaved: true
    ) else {
      throw NSError(domain: "LiveAudioCapture", code: -1, userInfo: [
        NSLocalizedDescriptionKey: "Failed to build target audio format."
      ])
    }

    guard let avConverter = AVAudioConverter(from: inputFormat, to: target) else {
      throw NSError(domain: "LiveAudioCapture", code: -2, userInfo: [
        NSLocalizedDescriptionKey: "Failed to initialize audio converter."
      ])
    }

    converter = avConverter
    targetFormat = target

    let ts = Int(Date().timeIntervalSince1970)
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    outputURL = docs.appendingPathComponent("recording-\(ts).caf")
    audioFile = try AVAudioFile(
      forWriting: outputURL!,
      settings: target.settings,
      commonFormat: .pcmFormatInt16,
      interleaved: true
    )

    inputNode.installTap(onBus: 0, bufferSize: 2048, format: inputFormat) { [weak self] buffer, _ in
      self?.process(buffer: buffer)
    }

    engine.prepare()
    try engine.start()
  }

  func pause() {
    engine.pause()
  }

  func resume() throws {
    try engine.start()
  }

  func stop() {
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    audioFile = nil
    converter = nil
    targetFormat = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  private func process(buffer: AVAudioPCMBuffer) {
    guard let converter, let targetFormat else { return }

    let ratio = targetFormat.sampleRate / buffer.format.sampleRate
    let outCapacity = AVAudioFrameCount(max(1024, (Double(buffer.frameLength) * ratio) + 32))
    guard let outBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: outCapacity) else { return }

    var conversionError: NSError?
    var consumed = false
    let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
      if consumed {
        outStatus.pointee = .noDataNow
        return nil
      }
      consumed = true
      outStatus.pointee = .haveData
      return buffer
    }

    let status = converter.convert(to: outBuffer, error: &conversionError, withInputFrom: inputBlock)
    if let conversionError {
      onError?("Audio conversion failed: \(conversionError.localizedDescription)")
      return
    }
    guard status == .haveData || status == .inputRanDry else { return }
    guard outBuffer.frameLength > 0 else { return }

    do {
      try audioFile?.write(from: outBuffer)
    } catch {
      onError?("Audio write failed: \(error.localizedDescription)")
    }

    guard let channelData = outBuffer.int16ChannelData else { return }
    let frameLength = Int(outBuffer.frameLength)
    let bytesPerFrame = Int(outBuffer.format.streamDescription.pointee.mBytesPerFrame)
    let byteCount = frameLength * bytesPerFrame
    let data = Data(bytes: channelData[0], count: byteCount)
    onPCMChunk?(data)
  }
}

private final class AssemblyAIStreamingClient {
  enum State: String {
    case idle
    case connecting
    case open
    case reconnecting
    case closed
  }

  private struct Config {
    let apiKey: String
    let sampleRate: Int
    let speechModel: String
  }

  private let queue = DispatchQueue(label: "com.briefly.assemblyai.streaming")
  private let session = URLSession(configuration: .default)

  private var socketTask: URLSessionWebSocketTask?
  private var config: Config?
  private var didRequestClose = false
  private var reconnectAttempts = 0
  private let maxReconnectAttempts = 3

  var onState: ((State, String?) -> Void)?
  var onPartial: ((String) -> Void)?
  var onFinal: ((String) -> Void)?
  var onError: ((String) -> Void)?

  func connect(apiKey: String, sampleRate: Int, speechModel: String) {
    queue.async {
      self.config = Config(apiKey: apiKey, sampleRate: sampleRate, speechModel: speechModel)
      self.didRequestClose = false
      self.reconnectAttempts = 0
      self.openSocket()
    }
  }

  func sendAudio(_ data: Data) {
    queue.async {
      guard let task = self.socketTask else { return }
      task.send(.data(data)) { [weak self] error in
        guard let self, let error else { return }
        self.handleRecoverableFailure("Audio send failed: \(error.localizedDescription)")
      }
    }
  }

  func endSession() {
    queue.async {
      guard let task = self.socketTask else { return }
      let endMessage = #"{"type": "Terminate"}"#
      task.send(.string(endMessage)) { [weak self] error in
        if let error {
          self?.onMain {
            self?.onError?("Session termination failed: \(error.localizedDescription)")
          }
        }
      }
    }
  }

  func disconnect() {
    queue.async {
      self.didRequestClose = true
      self.socketTask?.cancel(with: .normalClosure, reason: nil)
      self.socketTask = nil
      self.emitState(.closed, reason: nil)
    }
  }

  private func openSocket() {
    guard let config else { return }
    guard var components = URLComponents(string: "wss://streaming.assemblyai.com/v3/ws") else {
      emitError("Invalid AssemblyAI websocket URL.")
      emitState(.closed, reason: "invalid-url")
      return
    }
    components.queryItems = [
      URLQueryItem(name: "sample_rate", value: "\(config.sampleRate)"),
      URLQueryItem(name: "speech_model", value: config.speechModel),
      URLQueryItem(name: "format_turns", value: "true")
    ]
    guard let url = components.url else {
      emitError("Unable to construct AssemblyAI websocket URL.")
      emitState(.closed, reason: "invalid-url")
      return
    }

    var request = URLRequest(url: url)
    request.setValue(config.apiKey, forHTTPHeaderField: "Authorization")

    emitState(reconnectAttempts > 0 ? .reconnecting : .connecting, reason: nil)

    let task = session.webSocketTask(with: request)
    socketTask = task
    task.resume()
    // .open is emitted when the "Begin" message arrives, not here
    receiveLoop()
  }

  private func receiveLoop() {
    guard let task = socketTask else { return }
    task.receive { [weak self] result in
      guard let self else { return }
      self.queue.async {
        switch result {
        case .failure(let error):
          self.handleRecoverableFailure("AssemblyAI receive failed: \(error.localizedDescription)")
        case .success(let message):
          switch message {
          case .string(let text):
            self.handleInboundJSON(text)
          case .data:
            break
          @unknown default:
            break
          }
          if self.socketTask != nil {
            self.receiveLoop()
          }
        }
      }
    }
  }

  private func handleInboundJSON(_ text: String) {
    guard let data = text.data(using: .utf8),
          let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      return
    }

    let eventType = (payload["type"] as? String)?.lowercased()

    // v3 API: session established
    if eventType == "begin" {
      emitState(.open, reason: nil)
      return
    }

    if eventType == "error" {
      let message = payload["error"] as? String
        ?? payload["message"] as? String
        ?? "AssemblyAI returned an unknown error."
      emitError(message)
      return
    }

    if eventType == "termination" {
      didRequestClose = true
      socketTask?.cancel(with: .normalClosure, reason: nil)
      socketTask = nil
      emitState(.closed, reason: "terminated")
      return
    }

    // v3 API: real-time transcript turn
    if eventType == "turn" {
      let transcript = (payload["transcript"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
      guard !transcript.isEmpty else { return }
      let isFinalTurn = (payload["turn_is_formatted"] as? Bool) ?? false
      if isFinalTurn {
        onMain { self.onFinal?(transcript) }
      } else {
        onMain { self.onPartial?(transcript) }
      }
    }
  }

  private func handleRecoverableFailure(_ message: String) {
    if didRequestClose {
      socketTask = nil
      emitState(.closed, reason: "closed")
      return
    }

    socketTask?.cancel(with: .goingAway, reason: nil)
    socketTask = nil

    guard reconnectAttempts < maxReconnectAttempts else {
      emitError(message)
      emitState(.closed, reason: "reconnect-failed")
      return
    }

    reconnectAttempts += 1
    emitState(.reconnecting, reason: "attempt-\(reconnectAttempts)")
    let backoff = DispatchTimeInterval.milliseconds(500 * reconnectAttempts)
    queue.asyncAfter(deadline: .now() + backoff) {
      guard !self.didRequestClose else { return }
      self.openSocket()
    }
  }

  private func emitState(_ state: State, reason: String?) {
    onMain { self.onState?(state, reason) }
  }

  private func emitError(_ message: String) {
    onMain { self.onError?(message) }
  }

  private func onMain(_ block: @escaping () -> Void) {
    if Thread.isMainThread {
      block()
    } else {
      DispatchQueue.main.async(execute: block)
    }
  }
}

@objc(BrieflyTranscriber)
class BrieflyTranscriber: RCTEventEmitter {

  // MARK: - Live session state (legacy cloud path — WebSocket now handled in JS)

  private var audioCapture: LiveAudioCapture?
  private var streamingClient: AssemblyAIStreamingClient?
  private var liveOutputURL: URL?
  private var liveStartDate: Date?
  private var onDeviceSession: OnDeviceSpeechSession?

  private var isLive = false
  private var isPaused = false
  private var hasListeners = false

  // MARK: - Audio-capture-only state (JS handles the WebSocket/AssemblyAI side)

  private var captureSes: LiveAudioCapture?
  private var captureURL: URL?
  private var captureDate: Date?
  private var isCaptureActive = false

  // MARK: - RCTEventEmitter

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String] {
    [
      "onPartialTranscript",     // real-time partial result during live session
      "onFinalTranscript",       // finalized segment from live session
      "onStreamingState",        // websocket lifecycle updates for UI/debug
      "onTranscriptSegment",     // word-level segment from post-recording file transcription
      "onTranscriptionComplete", // post-recording file transcription finished
      "onTranscriptionError",    // any error
      "onPCMChunk",              // raw PCM audio chunk for JS-side streaming (base64 encoded)
    ]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving()  { hasListeners = false }

  // MARK: - Live Transcription: Start

  @objc func startLiveTranscription(
    _ options: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.doStartLive(options: options, resolve: resolve, reject: reject)
    }
  }

  private func doStartLive(
    options: NSDictionary,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    if isLive {
      reject("ALREADY_LIVE", "Live transcription session already in progress.", nil)
      return
    }

    let sampleRate = options["sampleRate"] as? Int ?? 16000
    let speechModel = options["speechModel"] as? String ?? "u3-rt-pro"
    let suppliedApiKey = options["apiKey"] as? String
    guard let apiKey = resolveAssemblyAIApiKey(suppliedApiKey: suppliedApiKey) else {
      reject(
        "MISSING_API_KEY",
        "AssemblyAI API key is missing. Configure ASSEMBLYAI_API_KEY in iOS Info.plist or pass apiKey from JS config.",
        nil
      )
      return
    }

    let capture = LiveAudioCapture(sampleRate: Double(sampleRate))
    let client = AssemblyAIStreamingClient()

    capture.onPCMChunk = { [weak self] chunk in
      guard let self, self.isLive, !self.isPaused else { return }
      client.sendAudio(chunk)
    }
    capture.onError = { [weak self] message in
      self?.sendError(message)
    }

    client.onPartial = { [weak self] text in
      guard let self, self.hasListeners else { return }
      self.sendEvent(withName: "onPartialTranscript", body: ["text": text])
    }
    client.onFinal = { [weak self] text in
      guard let self, self.hasListeners else { return }
      self.sendEvent(withName: "onFinalTranscript", body: ["text": text])
    }
    client.onError = { [weak self] message in
      self?.sendError(message)
    }
    client.onState = { [weak self] state, reason in
      guard let self, self.hasListeners else { return }
      self.sendEvent(withName: "onStreamingState", body: [
        "state": state.rawValue,
        "reason": reason ?? NSNull()
      ])
    }

    do {
      try capture.start()
    } catch {
      reject("AUDIO_CAPTURE", error.localizedDescription, error)
      return
    }

    client.connect(apiKey: apiKey, sampleRate: sampleRate, speechModel: speechModel)

    audioCapture = capture
    streamingClient = client
    liveOutputURL = capture.outputURL
    isLive = true
    isPaused = false
    liveStartDate = Date()
    resolve(["sampleRate": sampleRate, "speechModel": speechModel])
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
    audioCapture?.pause()
    if hasListeners {
      sendEvent(withName: "onStreamingState", body: ["state": "paused"])
    }
    resolve(nil)
  }

  // MARK: - Live Transcription: Resume

  @objc func resumeLiveTranscription(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isLive else {
      reject("NOT_LIVE", "No active live transcription session", nil)
      return
    }
    do {
      try audioCapture?.resume()
      isPaused = false
      if hasListeners {
        sendEvent(withName: "onStreamingState", body: ["state": "open"])
      }
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
    let activeClient = streamingClient

    isLive = false
    isPaused = false

    audioCapture?.stop()

    // Clean up state
    audioCapture = nil
    streamingClient = nil
    liveOutputURL = nil
    liveStartDate = nil

    DispatchQueue.global(qos: .userInitiated).async {
      activeClient?.endSession()
      usleep(250_000) // Allow final turn events before closure.
      activeClient?.disconnect()
      DispatchQueue.main.async {
        resolve(["uri": uri, "duration": duration])
      }
    }
  }

  // MARK: - On-device Live Transcription (Speech framework)

  @objc func startOnDeviceLiveTranscription(
    _ options: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if isLive {
      reject("ALREADY_LIVE", "Live transcription session already in progress.", nil)
      return
    }

    let session = OnDeviceSpeechSession()
    session.onPartial = { [weak self] text in
      guard let self, self.hasListeners else { return }
      self.sendEvent(withName: "onPartialTranscript", body: ["text": text])
    }
    session.onFinal = { [weak self] text in
      guard let self, self.hasListeners else { return }
      self.sendEvent(withName: "onFinalTranscript", body: ["text": text])
    }
    session.onState = { [weak self] state, reason in
      guard let self, self.hasListeners else { return }
      self.sendEvent(withName: "onStreamingState", body: [
        "state": state,
        "reason": reason ?? NSNull()
      ])
    }
    session.onError = { [weak self] message in
      self?.sendError(message)
    }

    do {
      try session.start()
      onDeviceSession = session
      isLive = true
      isPaused = false
      liveStartDate = Date()
      resolve([
        "sampleRate": 0,
        "speechModel": "on-device"
      ])
    } catch {
      reject("ONDEVICE_START", error.localizedDescription, error)
    }
  }

  @objc func pauseOnDeviceLiveTranscription(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isLive, let session = onDeviceSession else {
      resolve(nil)
      return
    }
    isPaused = true
    session.pause()
    resolve(nil)
  }

  @objc func resumeOnDeviceLiveTranscription(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isLive, let session = onDeviceSession else {
      reject("NOT_LIVE", "No active on-device live transcription session", nil)
      return
    }
    do {
      try session.resume()
      isPaused = false
      resolve(nil)
    } catch {
      reject("ENGINE_START", error.localizedDescription, error)
    }
  }

  @objc func stopOnDeviceLiveTranscription(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let session = onDeviceSession else {
      resolve(["uri": "", "duration": 0])
      return
    }

    let result = session.stop()
    onDeviceSession = nil
    isLive = false
    isPaused = false

    resolve([
      "uri": result.uri,
      "duration": result.duration
    ])
  }

  // MARK: - Audio Capture Only (PCM chunks → JS WebSocket)

  @objc func startAudioCapture(
    _ options: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      if self.isCaptureActive {
        reject("ALREADY_CAPTURING", "Audio capture already in progress.", nil)
        return
      }

      let sampleRate = options["sampleRate"] as? Int ?? 16000
      let capture = LiveAudioCapture(sampleRate: Double(sampleRate))

      capture.onPCMChunk = { [weak self] data in
        guard let self, self.hasListeners, self.isCaptureActive else { return }
        let b64 = data.base64EncodedString()
        self.sendEvent(withName: "onPCMChunk", body: ["data": b64])
      }
      capture.onError = { [weak self] message in
        self?.sendError(message)
      }

      do {
        try capture.start()
      } catch {
        reject("AUDIO_CAPTURE", error.localizedDescription, error)
        return
      }

      self.captureSes = capture
      self.captureURL = capture.outputURL
      self.captureDate = Date()
      self.isCaptureActive = true
      resolve(["sampleRate": sampleRate])
    }
  }

  @objc func pauseAudioCapture(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    captureSes?.pause()
    resolve(nil)
  }

  @objc func resumeAudioCapture(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      try captureSes?.resume()
      resolve(nil)
    } catch {
      reject("ENGINE_START", error.localizedDescription, error)
    }
  }

  @objc func stopAudioCapture(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let duration = captureDate.map { Date().timeIntervalSince($0) } ?? 0
    let uri = captureURL?.absoluteString ?? ""

    captureSes?.stop()
    captureSes = nil
    captureURL = nil
    captureDate = nil
    isCaptureActive = false

    resolve(["uri": uri, "duration": duration])
  }

  // MARK: - Post-recording file transcription

  @objc func transcribeFile(_ filePath: String) {
    _ = filePath
    sendError(
      "Post-recording native transcription is disabled. Briefly uses AssemblyAI as the single provider."
    )
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

  private func resolveAssemblyAIApiKey(suppliedApiKey: String?) -> String? {
    if let suppliedApiKey {
      let trimmed = suppliedApiKey.trimmingCharacters(in: .whitespacesAndNewlines)
      if !trimmed.isEmpty {
        return trimmed
      }
    }

    let info = Bundle.main.infoDictionary
    let plistKey = (info?["ASSEMBLYAI_API_KEY"] as? String)?
      .trimmingCharacters(in: .whitespacesAndNewlines)
    if let plistKey, !plistKey.isEmpty {
      return plistKey
    }
    return nil
  }
}
