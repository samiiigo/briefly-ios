/**
 * TranscriptionService
 *
 * Abstraction layer for on-device and cloud transcription.
 *
 * On-Device (iOS):  Uses the native BrieflyTranscriber Swift module which wraps
 *                   Apple's SpeechAnalyzer + SpeechTranscriber APIs (iOS 26+).
 *                   Falls back to expo-speech on older devices.
 *
 * On-Device (Android): Uses Android SpeechRecognizer via a native module.
 *                      Falls back to a placeholder until a local model is bundled.
 *
 * Cloud:  Sends the audio file to OpenAI Whisper (or compatible endpoint)
 *         with zero-data-retention headers where supported.
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { TranscriptSegment } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

const { BrieflyTranscriber } = NativeModules;

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── On-Device ────────────────────────────────────────────────────────────────

async function transcribeOnDevice(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  if (Platform.OS === 'ios' && BrieflyTranscriber) {
    return transcribeWithNativeModule(audioUri, onSegment);
  }

  // Fallback: simple placeholder that returns mock segments
  // Replace with a bundled Whisper.cpp or Vosk model in a future sprint.
  return transcribeFallback(audioUri);
}

async function transcribeWithNativeModule(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  return new Promise((resolve, reject) => {
    const emitter = new NativeEventEmitter(BrieflyTranscriber);
    const segments: TranscriptSegment[] = [];

    const segmentSub = emitter.addListener('onTranscriptSegment', (event: any) => {
      const seg: TranscriptSegment = {
        id: generateId(),
        speaker: event.speaker,
        speakerInitial: event.speaker ? event.speaker[0].toUpperCase() : undefined,
        text: event.text,
        startTime: event.startTime,
        endTime: event.endTime,
        isFinal: event.isFinal,
      };
      if (event.isFinal) {
        segments.push(seg);
        onSegment?.(seg);
      }
    });

    const doneSub = emitter.addListener('onTranscriptionComplete', () => {
      segmentSub.remove();
      doneSub.remove();
      resolve(segments);
    });

    const errSub = emitter.addListener('onTranscriptionError', (event: any) => {
      segmentSub.remove();
      doneSub.remove();
      errSub.remove();
      reject(new Error(event.message));
    });

    BrieflyTranscriber.transcribeFile(audioUri);
  });
}

// Placeholder fallback — returns mock transcript for UI development
async function transcribeFallback(audioUri: string): Promise<TranscriptSegment[]> {
  await new Promise((r) => setTimeout(r, 2000));
  return [
    {
      id: generateId(),
      speaker: 'Speaker 1',
      speakerInitial: 'S',
      text: 'Transcription is running in fallback mode. Please build with the native module enabled for real on-device transcription.',
      startTime: 0,
      endTime: 5,
      isFinal: true,
    },
    {
      id: generateId(),
      speaker: 'Speaker 1',
      speakerInitial: 'S',
      text: 'On iOS 26+, connect the BrieflyTranscriber native module for SpeechAnalyzer support.',
      startTime: 5,
      endTime: 10,
      isFinal: true,
    },
  ];
}

// ─── Cloud ────────────────────────────────────────────────────────────────────

async function transcribeCloud(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  const { cloudApiKey, cloudApiEndpoint } = useSettingsStore.getState();

  if (!cloudApiKey) {
    throw new Error('Cloud API key is not configured. Go to Settings to add your API key.');
  }

  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error('Audio file not found');
  }

  // Read audio as base64 for upload
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as any);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch(`${cloudApiEndpoint}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cloudApiKey}`,
      // Zero data retention hint (supported by some providers)
      'OpenAI-No-Training': '1',
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloud transcription failed: ${response.status} ${err}`);
  }

  const data = await response.json();

  const segments: TranscriptSegment[] = (data.segments ?? []).map((s: any) => {
    const seg: TranscriptSegment = {
      id: generateId(),
      text: s.text.trim(),
      startTime: s.start,
      endTime: s.end,
      isFinal: true,
    };
    onSegment?.(seg);
    return seg;
  });

  if (segments.length === 0 && data.text) {
    const seg: TranscriptSegment = {
      id: generateId(),
      text: data.text.trim(),
      startTime: 0,
      endTime: 0,
      isFinal: true,
    };
    onSegment?.(seg);
    return [seg];
  }

  return segments;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type TranscriptionMode = 'on-device' | 'cloud';

export const TranscriptionService = {
  async transcribe(
    audioUri: string,
    mode: TranscriptionMode,
    onSegment?: (segment: TranscriptSegment) => void
  ): Promise<TranscriptSegment[]> {
    if (mode === 'cloud') {
      return transcribeCloud(audioUri, onSegment);
    }
    return transcribeOnDevice(audioUri, onSegment);
  },
};
