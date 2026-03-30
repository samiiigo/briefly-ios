package com.briefly.app

import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.Buffer
import org.json.JSONObject
import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.TimeUnit
import kotlin.math.max

class BrieflyTranscriberModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  private val socketClient: OkHttpClient = OkHttpClient.Builder()
    .readTimeout(0, TimeUnit.MILLISECONDS)
    .build()

  private var webSocket: WebSocket? = null
  private var audioRecord: AudioRecord? = null
  private var audioThread: Thread? = null
  private var wavFile: RandomAccessFile? = null
  private var wavFilePath: String? = null
  private var bytesWritten: Long = 0L
  private var liveStartTimeMs: Long = 0L

  private var speechRecognizer: SpeechRecognizer? = null

  @Volatile private var isLive = false
  @Volatile private var isPaused = false
  @Volatile private var reconnectAttempts = 0

  @Volatile private var onDeviceMode = false

  private var apiKey: String = ""
  private var sampleRate: Int = DEFAULT_SAMPLE_RATE
  private var speechModel: String = DEFAULT_SPEECH_MODEL

  override fun getName(): String = "BrieflyTranscriber"

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for React Native event emitters.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for React Native event emitters.
  }

  @ReactMethod
  fun startLiveTranscription(options: ReadableMap, promise: Promise) {
    if (isLive) {
      promise.reject("ALREADY_LIVE", "Live transcription session already in progress.")
      return
    }

    val resolvedApiKey = resolveApiKey(options.getString("apiKey"))
    if (resolvedApiKey.isNullOrBlank()) {
      promise.reject(
        "MISSING_API_KEY",
        "AssemblyAI API key is missing. Configure EXPO_PUBLIC_ASSEMBLYAI_API_KEY or pass apiKey from JS config."
      )
      return
    }

    apiKey = resolvedApiKey
    sampleRate = if (options.hasKey("sampleRate")) options.getInt("sampleRate") else DEFAULT_SAMPLE_RATE
    speechModel = options.getString("speechModel") ?: DEFAULT_SPEECH_MODEL
    reconnectAttempts = 0

    try {
      setupAudioCapture()
      isLive = true
      isPaused = false
      liveStartTimeMs = System.currentTimeMillis()
      connectSocket()
      startAudioLoop()

      val result = Arguments.createMap()
      result.putInt("sampleRate", sampleRate)
      result.putString("speechModel", speechModel)
      promise.resolve(result)
    } catch (error: Exception) {
      cleanupSession(closeSocket = true)
      promise.reject("START_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun startOnDeviceLiveTranscription(options: ReadableMap, promise: Promise) {
    if (isLive) {
      promise.reject("ALREADY_LIVE", "Live transcription session already in progress.")
      return
    }

    if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
      promise.reject("UNAVAILABLE", "On-device speech recognition is not available on this device.")
      return
    }

    val recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(reactContext)
    if (recognizer == null) {
      promise.reject("UNAVAILABLE", "On-device speech recognizer could not be created.")
      return
    }

    speechRecognizer = recognizer
    onDeviceMode = true
    sampleRate = DEFAULT_SAMPLE_RATE
    reconnectAttempts = 0

    try {
      setupAudioCapture()
      isLive = true
      isPaused = false
      liveStartTimeMs = System.currentTimeMillis()
      startAudioLoop()

      recognizer.setRecognitionListener(object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {
          emitStreamingState("open", null)
        }

        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onBeginningOfSpeech() {}
        override fun onEndOfSpeech() {}

        override fun onError(error: Int) {
          emitError("On-device speech error: $error")
          emitStreamingState("closed", "error-$error")
        }

        override fun onResults(results: Bundle?) {
          val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          val text = list?.firstOrNull()?.trim().orEmpty()
          if (text.isNotEmpty()) {
            val body = Arguments.createMap()
            body.putString("text", text)
            emitEvent("onFinalTranscript", body)
          }
          emitStreamingState("closed", "final")
        }

        override fun onPartialResults(partialResults: Bundle?) {
          val list = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          val text = list?.firstOrNull()?.trim().orEmpty()
          if (text.isNotEmpty()) {
            val body = Arguments.createMap()
            body.putString("text", text)
            emitEvent("onPartialTranscript", body)
          }
        }

        override fun onEvent(eventType: Int, params: Bundle?) {}
      })

      val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
      }
      recognizer.startListening(intent)

      val result = Arguments.createMap()
      result.putInt("sampleRate", sampleRate)
      result.putString("speechModel", "on-device")
      promise.resolve(result)
    } catch (error: Exception) {
      cleanupSession(closeSocket = false)
      speechRecognizer?.destroy()
      speechRecognizer = null
      onDeviceMode = false
      promise.reject("ONDEVICE_START_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun pauseLiveTranscription(promise: Promise) {
    if (!isLive) {
      promise.resolve(null)
      return
    }
    isPaused = true
    emitStreamingState("paused", null)
    promise.resolve(null)
  }

  @ReactMethod
  fun pauseOnDeviceLiveTranscription(promise: Promise) {
    if (!isLive || !onDeviceMode) {
      promise.resolve(null)
      return
    }
    isPaused = true
    emitStreamingState("paused", null)
    promise.resolve(null)
  }

  @ReactMethod
  fun resumeLiveTranscription(promise: Promise) {
    if (!isLive) {
      promise.reject("NOT_LIVE", "No active live transcription session")
      return
    }
    isPaused = false
    emitStreamingState("open", null)
    promise.resolve(null)
  }

  @ReactMethod
  fun resumeOnDeviceLiveTranscription(promise: Promise) {
    if (!isLive || !onDeviceMode) {
      promise.reject("NOT_LIVE", "No active on-device live transcription session")
      return
    }
    isPaused = false
    emitStreamingState("open", null)
    promise.resolve(null)
  }

  @ReactMethod
  fun stopLiveTranscription(promise: Promise) {
    val elapsedMs = if (liveStartTimeMs > 0L) System.currentTimeMillis() - liveStartTimeMs else 0L
    val filePath = wavFilePath
    val previousSocket = webSocket

    cleanupSession(closeSocket = false)

    try {
      previousSocket?.send("""{"terminate_session": true}""")
      previousSocket?.close(1000, "client-stopped")
    } catch (_: Exception) {
      // Ignore close errors.
    }
    webSocket = null

    val result = Arguments.createMap()
    result.putString("uri", if (filePath != null) "file://$filePath" else "")
    result.putDouble("duration", elapsedMs.toDouble() / 1000.0)
    promise.resolve(result)
  }

  @ReactMethod
  fun stopOnDeviceLiveTranscription(promise: Promise) {
    val elapsedMs = if (liveStartTimeMs > 0L) System.currentTimeMillis() - liveStartTimeMs else 0L
    val filePath = wavFilePath

    speechRecognizer?.stopListening()
    speechRecognizer?.destroy()
    speechRecognizer = null

    cleanupSession(closeSocket = false)
    onDeviceMode = false

    val result = Arguments.createMap()
    result.putString("uri", if (filePath != null) "file://$filePath" else "")
    result.putDouble("duration", elapsedMs.toDouble() / 1000.0)
    promise.resolve(result)
  }

  @ReactMethod
  fun transcribeFile(filePath: String) {
    emitError(
      "Post-recording native transcription is disabled. Briefly uses AssemblyAI as the single provider."
    )
  }

  @ReactMethod
  fun summarize(text: String, promise: Promise) {
    val fallbackSummary = if (text.length > 200) text.substring(0, 200) else text
    val payload = Arguments.createMap()
    payload.putString("summary", fallbackSummary)
    payload.putArray("keyInsights", Arguments.createArray())
    promise.resolve(payload)
  }

  private fun setupAudioCapture() {
    val minBuffer = AudioRecord.getMinBufferSize(
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT
    )
    if (minBuffer <= 0) {
      throw IllegalStateException("Unable to initialize microphone buffer.")
    }

    val audioBufferSize = max(minBuffer, sampleRate / 2)

    val record = AudioRecord.Builder()
      .setAudioSource(MediaRecorder.AudioSource.MIC)
      .setAudioFormat(
        AudioFormat.Builder()
          .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
          .setSampleRate(sampleRate)
          .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
          .build()
      )
      .setBufferSizeInBytes(audioBufferSize)
      .build()

    if (record.state != AudioRecord.STATE_INITIALIZED) {
      record.release()
      throw IllegalStateException("Microphone is not available for recording.")
    }

    val outputFile = File(reactContext.filesDir, "recording-${System.currentTimeMillis()}.wav")
    val wav = RandomAccessFile(outputFile, "rw")
    writeWavHeader(wav, sampleRate, channels = 1, bitsPerSample = 16, dataLength = 0)

    audioRecord = record
    wavFile = wav
    wavFilePath = outputFile.absolutePath
    bytesWritten = 0L
  }

  private fun connectSocket() {
    emitStreamingState(if (reconnectAttempts > 0) "reconnecting" else "connecting", null)
    val url = "wss://streaming.assemblyai.com/v3/ws" +
      "?sample_rate=$sampleRate&speech_model=$speechModel&format_turns=true"
    val request = Request.Builder()
      .url(url)
      .addHeader("Authorization", apiKey)
      .build()

    webSocket = socketClient.newWebSocket(request, object : WebSocketListener() {
      override fun onOpen(webSocket: WebSocket, response: Response) {
        reconnectAttempts = 0
        emitStreamingState("open", null)
      }

      override fun onMessage(webSocket: WebSocket, text: String) {
        handleServerMessage(text)
      }

      override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
        if (isLive) {
          emitStreamingState("closed", reason)
        }
      }

      override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
        if (!isLive) {
          return
        }
        emitError("AssemblyAI connection failed: ${t.message ?: "unknown error"}")
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          emitStreamingState("closed", "reconnect-failed")
          return
        }
        reconnectAttempts += 1
        emitStreamingState("reconnecting", "attempt-$reconnectAttempts")
        connectSocket()
      }
    })
  }

  private fun startAudioLoop() {
    val record = audioRecord ?: throw IllegalStateException("Audio recorder not initialized.")
    record.startRecording()

    audioThread = Thread {
      val buffer = ByteArray(2048)
      while (isLive) {
        val read = record.read(buffer, 0, buffer.size)
        if (read <= 0) {
          continue
        }
        if (isPaused) {
          continue
        }
        try {
          wavFile?.write(buffer, 0, read)
          bytesWritten += read.toLong()
          if (!onDeviceMode) {
            webSocket?.send(Buffer().write(buffer, 0, read).readByteString(read.toLong()))
          }
        } catch (error: Exception) {
          emitError("Audio streaming failed: ${error.message}")
        }
      }
    }.apply {
      name = "BrieflyAssemblyAIAudioThread"
      start()
    }
  }

  private fun handleServerMessage(text: String) {
    val payload = try {
      JSONObject(text)
    } catch (_: Exception) {
      return
    }

    val type = payload.optString("type").lowercase()
    if (type == "error") {
      emitError(payload.optString("error", payload.optString("message", "AssemblyAI returned an error.")))
      return
    }
    if (type == "termination") {
      emitStreamingState("closed", "terminated")
      return
    }

    val transcript = payload.optString("transcript", "").trim()
    if (transcript.isEmpty()) {
      return
    }
    if (payload.optBoolean("end_of_turn", false)) {
      val body = Arguments.createMap()
      body.putString("text", transcript)
      emitEvent("onFinalTranscript", body)
    } else {
      val body = Arguments.createMap()
      body.putString("text", transcript)
      emitEvent("onPartialTranscript", body)
    }
  }

  private fun cleanupSession(closeSocket: Boolean) {
    isLive = false
    isPaused = false
    liveStartTimeMs = 0L

    audioThread?.join(500)
    audioThread = null

    try {
      audioRecord?.stop()
    } catch (_: Exception) {
      // Ignore recorder stop failures.
    }
    audioRecord?.release()
    audioRecord = null

    try {
      if (bytesWritten > 0L) {
        wavFile?.let { finalizeWavHeader(it, bytesWritten) }
      }
    } catch (_: Exception) {
      // Ignore finalization failures.
    }
    try {
      wavFile?.close()
    } catch (_: Exception) {
      // Ignore close failures.
    }
    wavFile = null

    try {
      speechRecognizer?.destroy()
    } catch (_: Exception) {
      // Ignore recognizer destroy failures.
    }
    speechRecognizer = null
    onDeviceMode = false

    if (closeSocket) {
      try {
        webSocket?.close(1000, "cleanup")
      } catch (_: Exception) {
        // Ignore socket close failures.
      }
      webSocket = null
    }
  }

  private fun finalizeWavHeader(file: RandomAccessFile, dataLength: Long) {
    file.seek(0)
    writeWavHeader(file, sampleRate, channels = 1, bitsPerSample = 16, dataLength = dataLength)
  }

  private fun writeWavHeader(
    file: RandomAccessFile,
    sampleRate: Int,
    channels: Int,
    bitsPerSample: Int,
    dataLength: Long
  ) {
    val byteRate = sampleRate * channels * bitsPerSample / 8
    val blockAlign = channels * bitsPerSample / 8
    val chunkSize = 36 + dataLength

    val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
    header.put("RIFF".toByteArray(Charsets.US_ASCII))
    header.putInt(chunkSize.toInt())
    header.put("WAVE".toByteArray(Charsets.US_ASCII))
    header.put("fmt ".toByteArray(Charsets.US_ASCII))
    header.putInt(16)
    header.putShort(1) // PCM
    header.putShort(channels.toShort())
    header.putInt(sampleRate)
    header.putInt(byteRate)
    header.putShort(blockAlign.toShort())
    header.putShort(bitsPerSample.toShort())
    header.put("data".toByteArray(Charsets.US_ASCII))
    header.putInt(dataLength.toInt())

    file.write(header.array())
  }

  private fun emitStreamingState(state: String, reason: String?) {
    val body = Arguments.createMap()
    body.putString("state", state)
    if (reason != null) {
      body.putString("reason", reason)
    }
    emitEvent("onStreamingState", body)
  }

  private fun emitError(message: String) {
    val body = Arguments.createMap()
    body.putString("message", message)
    emitEvent("onTranscriptionError", body)
  }

  private fun emitEvent(name: String, body: com.facebook.react.bridge.WritableMap) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(name, body)
  }

  private fun resolveApiKey(supplied: String?): String? {
    val suppliedTrimmed = supplied?.trim()
    if (!suppliedTrimmed.isNullOrEmpty()) {
      return suppliedTrimmed
    }
    val buildConfigKey = BuildConfig.ASSEMBLYAI_API_KEY.trim()
    return if (buildConfigKey.isNotEmpty()) buildConfigKey else null
  }

  companion object {
    private const val DEFAULT_SAMPLE_RATE = 16000
    private const val DEFAULT_SPEECH_MODEL = "u3-rt-pro"
    private const val MAX_RECONNECT_ATTEMPTS = 3
  }
}
