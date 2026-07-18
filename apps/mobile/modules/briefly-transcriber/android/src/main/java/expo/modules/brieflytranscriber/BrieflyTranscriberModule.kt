package expo.modules.brieflytranscriber

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BrieflyTranscriberModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BrieflyTranscriber")

    Events(
      "onPartialTranscript",
      "onFinalTranscript",
      "onStreamingState",
      "onTranscriptSegment",
      "onTranscriptionComplete",
      "onTranscriptionError",
      "onPCMChunk",
    )

    AsyncFunction("summarize") { text: String ->
      BrieflyOnDeviceSummarizer.summarize(text)
    }
  }
}
