import ExpoModulesCore

public class BrieflyTranscriberModule: Module {
  private var engine: BrieflyTranscriberEngine!
  private var listenerCount = 0

  public func definition() -> ModuleDefinition {
    Name("BrieflyTranscriber")

    Events(
      "onPartialTranscript",
      "onFinalTranscript",
      "onStreamingState",
      "onTranscriptSegment",
      "onTranscriptionComplete",
      "onTranscriptionError",
      "onPCMChunk"
    )

    OnCreate {
      var sink = BrieflyTranscriberEventSink()
      sink.isListening = { [weak self] in
        guard let self else { return false }
        return self.listenerCount > 0
      }
      sink.emit = { [weak self] name, body in
        self?.sendEvent(name, body)
      }
      self.engine = BrieflyTranscriberEngine(eventSink: sink)
    }

    OnStartObserving {
      self.listenerCount += 1
    }

    OnStopObserving {
      self.listenerCount = max(0, self.listenerCount - 1)
    }

    AsyncFunction("summarize") { (text: String) -> [String: Any] in
      try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[String: Any], Error>) in
        DispatchQueue.global(qos: .userInitiated).async {
          let result = BrieflyOnDeviceSummarizer.summarize(text: text)
          continuation.resume(returning: result)
        }
      }
    }

    AsyncFunction("startLiveTranscription") { (options: [String: Any]) -> [String: Any] in
      try self.engine.startLiveTranscription(options: options as NSDictionary)
    }

    AsyncFunction("pauseLiveTranscription") {
      try self.engine.pauseLiveTranscription()
    }

    AsyncFunction("resumeLiveTranscription") {
      try self.engine.resumeLiveTranscription()
    }

    AsyncFunction("stopLiveTranscription") { () -> [String: Any] in
      try self.engine.stopLiveTranscription()
    }

    AsyncFunction("startOnDeviceLiveTranscription") { (options: [String: Any]) -> [String: Any] in
      try self.engine.startOnDeviceLiveTranscription(options: options as NSDictionary)
    }

    AsyncFunction("pauseOnDeviceLiveTranscription") {
      try self.engine.pauseOnDeviceLiveTranscription()
    }

    AsyncFunction("resumeOnDeviceLiveTranscription") {
      try self.engine.resumeOnDeviceLiveTranscription()
    }

    AsyncFunction("stopOnDeviceLiveTranscription") { () -> [String: Any] in
      try self.engine.stopOnDeviceLiveTranscription()
    }

    AsyncFunction("startAudioCapture") { (options: [String: Any]) -> [String: Any] in
      try self.engine.startAudioCapture(options: options as NSDictionary)
    }

    AsyncFunction("pauseAudioCapture") {
      try self.engine.pauseAudioCapture()
    }

    AsyncFunction("resumeAudioCapture") {
      try self.engine.resumeAudioCapture()
    }

    AsyncFunction("stopAudioCapture") { () -> [String: Any] in
      try self.engine.stopAudioCapture()
    }

    Function("transcribeFile") { (filePath: String) in
      self.engine.transcribeFile(filePath)
    }
  }
}
