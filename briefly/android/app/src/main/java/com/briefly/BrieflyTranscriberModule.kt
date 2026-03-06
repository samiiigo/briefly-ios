package com.briefly

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * BrieflyTranscriberModule
 *
 * Android native module that wraps Android's SpeechRecognizer for on-device
 * transcription. For production, swap recognizeFile() with a Whisper.cpp or
 * Vosk inference call on a background thread.
 */
class BrieflyTranscriberModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var speechRecognizer: SpeechRecognizer? = null

    override fun getName(): String = "BrieflyTranscriber"

    override fun getConstants(): Map<String, Any> = emptyMap()

    // ─── Transcription ────────────────────────────────────────────────────────

    @ReactMethod
    fun transcribeFile(filePath: String) {
        // Android SpeechRecognizer works on live audio, not file-based in all versions.
        // For file-based transcription, we use a background thread with a placeholder.
        // Replace the body of this method with a Whisper.cpp JNI call for production.
        Thread {
            Thread.sleep(2000) // Simulating processing
            val segment = Arguments.createMap().apply {
                putString("text", "On-device transcription on Android requires a bundled model. Wire up Whisper.cpp or Vosk here for production.")
                putDouble("startTime", 0.0)
                putDouble("endTime", 5.0)
                putBoolean("isFinal", true)
            }
            sendEvent("onTranscriptSegment", segment)
            sendEvent("onTranscriptionComplete", Arguments.createMap())
        }.start()
    }

    // ─── Summarization ────────────────────────────────────────────────────────

    @ReactMethod
    fun summarize(text: String, promise: Promise) {
        Thread {
            val result = extractiveSummarize(text)
            promise.resolve(result)
        }.start()
    }

    private fun extractiveSummarize(text: String): WritableMap {
        val sentences = text.split(Regex("[.!?]+"))
            .map { it.trim() }
            .filter { it.length > 20 }

        val summary = sentences.take(3).joinToString(". ")
        val keywords = listOf("decide", "action", "will", "should", "must", "key", "important")
        val insights = sentences
            .filter { s -> keywords.any { k -> s.lowercase().contains(k) } }
            .take(5)

        val insightsArray = Arguments.createArray()
        val insightsList = if (insights.isEmpty() && sentences.isNotEmpty()) {
            listOf(sentences[0])
        } else insights
        insightsList.forEach { insightsArray.pushString(it) }

        return Arguments.createMap().apply {
            putString("summary", summary.ifEmpty { text.take(200) })
            putArray("keyInsights", insightsArray)
        }
    }

    // ─── Event emitter ────────────────────────────────────────────────────────

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun onCatalystInstanceDestroy() {
        speechRecognizer?.destroy()
        speechRecognizer = null
    }
}
