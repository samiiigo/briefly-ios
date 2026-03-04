package com.briefly

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap

class BrieflySpeechModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var startedAt: Long = 0

  override fun getName(): String = "BrieflySpeechModule"

  @ReactMethod
  fun isAvailable(promise: Promise) {
    promise.resolve(true)
  }

  @ReactMethod
  fun startTranscription(promise: Promise) {
    startedAt = System.currentTimeMillis()
    promise.resolve(null)
  }

  @ReactMethod
  fun stopTranscription(promise: Promise) {
    val payload = WritableNativeMap()
    payload.putString("text", "Android transcription placeholder from speech bridge")
    payload.putInt("durationSeconds", ((System.currentTimeMillis() - startedAt) / 1000).toInt())
    promise.resolve(payload)
  }
}
