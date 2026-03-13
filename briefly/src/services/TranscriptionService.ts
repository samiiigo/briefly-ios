import * as FileSystem from 'expo-file-system/legacy';
import { TranscriptSegment, TranscriptionMode } from '../types';
import { AssemblyAIConfig, requireAssemblyAISharedApiKey } from '../config/assemblyAI';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const API_BASE_URL = 'https://api.assemblyai.com/v2';
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 180;

async function uploadAudioToAssemblyAI(audioUri: string, apiKey: string): Promise<string> {
  const upload = await FileSystem.uploadAsync(`${API_BASE_URL}/upload`, audioUri, {
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
    httpMethod: 'POST',
  });

  if (upload.status !== 200) {
    throw new Error(`AssemblyAI upload failed: ${upload.status} ${upload.body}`);
  }

  const payload = JSON.parse(upload.body);
  const uploadUrl = payload?.upload_url as string | undefined;
  if (!uploadUrl) {
    throw new Error('AssemblyAI upload did not return upload_url.');
  }
  return uploadUrl;
}

async function createTranscriptJob(uploadUrl: string, apiKey: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadUrl,
      punctuate: true,
      format_text: true,
      language_detection: true,
      // AssemblyAI deprecated `speech_model` on the async endpoint.
      // Use `speech_models` (array) instead and restrict to async-safe models.
      speech_models: [AssemblyAIConfig.asyncModel],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AssemblyAI transcript create failed: ${response.status} ${body}`);
  }

  const payload = await response.json();
  const transcriptId = payload?.id as string | undefined;
  if (!transcriptId) {
    throw new Error('AssemblyAI transcript create did not return id.');
  }
  return transcriptId;
}

async function waitForTranscript(
  transcriptId: string,
  apiKey: string
): Promise<{ words?: { text: string; start?: number; end?: number }[]; text?: string }> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await fetch(`${API_BASE_URL}/transcript/${transcriptId}`, {
      headers: { Authorization: apiKey },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AssemblyAI transcript poll failed: ${response.status} ${body}`);
    }

    const payload = await response.json();
    const status = payload?.status as string | undefined;
    if (status === 'completed') {
      return payload;
    }
    if (status === 'error') {
      throw new Error(payload?.error ?? 'AssemblyAI transcript job failed.');
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('AssemblyAI transcript job timed out.');
}

async function transcribeWithAssemblyAI(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  const apiKey = requireAssemblyAISharedApiKey();
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error('Audio file not found.');
  }

  const uploadUrl = await uploadAudioToAssemblyAI(audioUri, apiKey);
  const transcriptId = await createTranscriptJob(uploadUrl, apiKey);
  const payload = await waitForTranscript(transcriptId, apiKey);

  const words = payload.words ?? [];
  if (words.length > 0) {
    const segments = words
      .map((word) => {
        const text = (word.text ?? '').trim();
        if (!text) {
          return null;
        }
        const segment: TranscriptSegment = {
          id: generateId(),
          text,
          startTime: typeof word.start === 'number' ? word.start / 1000 : 0,
          endTime: typeof word.end === 'number' ? word.end / 1000 : 0,
          isFinal: true,
        };
        onSegment?.(segment);
        return segment;
      })
      .filter((segment): segment is TranscriptSegment => !!segment);
    if (segments.length > 0) {
      return segments;
    }
  }

  const fallback = (payload.text ?? '').trim();
  if (!fallback) {
    throw new Error('AssemblyAI returned an empty transcript.');
  }
  const single: TranscriptSegment = {
    id: generateId(),
    text: fallback,
    startTime: 0,
    endTime: 0,
    isFinal: true,
  };
  onSegment?.(single);
  return [single];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const TranscriptionService = {
  async transcribe(
    audioUri: string,
    onSegment?: (segment: TranscriptSegment) => void,
    mode: TranscriptionMode = 'on-device'
  ): Promise<TranscriptSegment[]> {
    void mode;
    return transcribeWithAssemblyAI(audioUri, onSegment);
  },
};
