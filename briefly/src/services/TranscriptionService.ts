/**
 * TranscriptionService
 *
 * Primary path: on-device using BrieflyTranscriber native Swift module
 * (AVAudioEngine + SFSpeechRecognizer). Requires a development build.
 *
 * Expo Go fallback: when the native module is not available, automatically
 * routes to cloud transcription if an API key is configured in Settings.
 * This fallback only applies to Expo Go — a real build always uses on-device.
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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

  // Native module not available (Expo Go) — fall back to cloud if a key is set.
  const { cloudApiKey } = useSettingsStore.getState();
  if (cloudApiKey) {
    return transcribeCloud(audioUri, onSegment);
  }

  throw new Error(
    'On-device transcription requires a development build.\n\n' +
    'Add a cloud API key in Settings to transcribe in Expo Go.'
  );
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

// ─── Cloud: route by provider (Expo Go fallback only) ─────────────────────────

async function transcribeCloud(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  const { cloudApiProvider } = useSettingsStore.getState();
  if (cloudApiProvider === 'gemini') {
    return transcribeWithGemini(audioUri, onSegment);
  }
  if (cloudApiProvider === 'anthropic' || cloudApiProvider === 'github') {
    throw new Error(
      `${cloudApiProvider === 'anthropic' ? 'Anthropic Claude' : 'GitHub Models'} does not support audio transcription.\n\n` +
      'Use a development build for on-device transcription, or switch to an OpenAI or Gemini key.'
    );
  }
  return transcribeWithOpenAI(audioUri, onSegment);
}

// ─── OpenAI Whisper ───────────────────────────────────────────────────────────

async function transcribeWithOpenAI(
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
      'OpenAI-No-Training': '1',
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI transcription failed: ${response.status} ${err}`);
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

// ─── Google Gemini ────────────────────────────────────────────────────────────

function audioMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    caf: 'audio/x-caf',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
  };
  return map[ext] ?? 'audio/mp4'; // m4a / mp4
}

async function transcribeWithGemini(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  const { cloudApiKey } = useSettingsStore.getState();

  if (!cloudApiKey) {
    throw new Error('Gemini API key is not configured. Go to Settings to add your API key.');
  }

  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error('Audio file not found');
  }

  const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent` +
    `?key=${cloudApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: audioMimeType(audioUri),
                data: base64Audio,
              },
            },
            {
              text:
                'Transcribe this audio recording accurately. ' +
                'Return only the spoken words exactly as said, ' +
                'with natural punctuation. No labels, no commentary.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini transcription failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text.trim()) {
    throw new Error('Gemini returned an empty transcription. Check your API key and audio file.');
  }

  const seg: TranscriptSegment = {
    id: generateId(),
    text: text.trim(),
    startTime: 0,
    endTime: 0,
    isFinal: true,
  };
  onSegment?.(seg);
  return [seg];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const TranscriptionService = {
  async transcribe(
    audioUri: string,
    onSegment?: (segment: TranscriptSegment) => void
  ): Promise<TranscriptSegment[]> {
    return transcribeOnDevice(audioUri, onSegment);
  },
};
