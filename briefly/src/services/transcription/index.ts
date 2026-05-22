/**
 * TranscriptionService — refactored orchestration layer (SRP + DIP)
 *
 * This thin facade coordinates the transcription workflow:
 *   1. Validate input
 *   2. Upload audio via AssemblyAIClient
 *   3. Poll for completion
 *   4. Build segments via segmentBuilder
 *
 * Each step lives in its own module with a single responsibility.
 * The orchestration depends on abstractions (the module interfaces),
 * not on low-level HTTP or parsing details (DIP).
 */

import { getPathInfo } from '@/utils/fileSystem/pathInfo';
import { TranscriptSegment, TranscriptionMode } from '@/types';
import { requireAssemblyAISharedApiKey } from '@/constants/api/assemblyAI';
import { normalizeTranscriptionMode } from '@/utils/processing/transcriptionMode';
import {
  uploadAudio,
  createTranscriptJob,
  pollForCompletion,
  AssemblyAITranscriptPayload,
} from './assemblyAIClient';
import { buildSentenceSegments, buildFallbackSegments } from './segmentBuilder';
import { WAV_HEADER_BYTES } from '@/services/audio/recordingOptions';
import { logger } from '@/utils/logging/logger';

/** ~0.25 s of 16 kHz mono PCM — below this, AssemblyAI often rejects the file. */
const MIN_AUDIO_BYTES = WAV_HEADER_BYTES + 8000;

interface AsyncTranscriptionClient {
  uploadAudio(audioUri: string, apiKey: string): Promise<string>;
  createTranscriptJob(uploadUrl: string, apiKey: string): Promise<string>;
  pollForCompletion(transcriptId: string, apiKey: string): Promise<AssemblyAITranscriptPayload>;
}

interface SegmentBuilder {
  buildFromWords(words: { text: string; start?: number; end?: number }[]): TranscriptSegment[];
  buildFromText(text: string): TranscriptSegment[];
}

interface TranscriptionDependencies {
  getApiKey(): string;
  getFileInfo(audioUri: string): Promise<{ exists: boolean; size?: number }>;
  client: AsyncTranscriptionClient;
  segmentBuilder: SegmentBuilder;
}

function createDefaultDependencies(): TranscriptionDependencies {
  return {
    getApiKey: requireAssemblyAISharedApiKey,
    getFileInfo: async (audioUri) => {
      const info = getPathInfo(audioUri);
      return { exists: info.exists, size: info.size };
    },
    client: {
      uploadAudio,
      createTranscriptJob,
      pollForCompletion,
    },
    segmentBuilder: {
      buildFromWords: buildSentenceSegments,
      buildFromText: buildFallbackSegments,
    },
  };
}

let dependencies: TranscriptionDependencies = createDefaultDependencies();

export function configureTranscriptionDependencies(next: Partial<TranscriptionDependencies>): void {
  dependencies = {
    ...dependencies,
    ...next,
    client: { ...dependencies.client, ...(next.client ?? {}) },
    segmentBuilder: { ...dependencies.segmentBuilder, ...(next.segmentBuilder ?? {}) },
  };
}

export function resetTranscriptionDependencies(): void {
  dependencies = createDefaultDependencies();
}

async function transcribeWithAssemblyAI(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  const apiKey = dependencies.getApiKey();
  const fileInfo = await dependencies.getFileInfo(audioUri);
  if (!fileInfo.exists) {
    logger.error('TranscriptionService', 'Audio file not found', { audioUri });
    throw new Error('Audio file not found.');
  }
  const fileSize = fileInfo.exists ? ((fileInfo as any).size ?? 0) : 0;
  if (fileSize < MIN_AUDIO_BYTES) {
    logger.error('TranscriptionService', 'Audio file too small to transcribe', { audioUri, fileSize });
    throw new Error('Recording is too short. Record for at least 10 seconds and try again.');
  }
  logger.info('TranscriptionService', 'Async transcription started', { audioUri, fileSize });

  const uploadUrl = await dependencies.client.uploadAudio(audioUri, apiKey);
  const transcriptId = await dependencies.client.createTranscriptJob(uploadUrl, apiKey);
  const payload = await dependencies.client.pollForCompletion(transcriptId, apiKey);

  const words = payload.words ?? [];
  const fullText = (payload.text ?? '').trim();
  const textWordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;

  if (fullText && words.length > 0 && textWordCount > words.length * 2) {
    logger.info('TranscriptionService', 'Using full transcript text (words array sparse)', {
      wordTimings: words.length,
      textWordCount,
    });
    const textSegments = dependencies.segmentBuilder.buildFromText(fullText);
    textSegments.forEach((segment) => onSegment?.(segment));
    return textSegments;
  }

  if (words.length > 0) {
    const segments = dependencies.segmentBuilder.buildFromWords(words);
    segments.forEach((segment) => onSegment?.(segment));
    if (segments.length > 0) {
      logger.info('TranscriptionService', 'Transcription result received', {
        segmentCount: segments.length,
        wordTimings: words.length,
        textWordCount,
      });
      return segments;
    }
  }

  const fallback = fullText;
  if (!fallback) {
    logger.error('TranscriptionService', 'Empty transcript returned');
    throw new Error('AssemblyAI returned an empty transcript.');
  }
  const fallbackSegments = dependencies.segmentBuilder.buildFromText(fallback);
  fallbackSegments.forEach((segment) => onSegment?.(segment));
  logger.info('TranscriptionService', 'Transcription result received (fallback text)', {
    segmentCount: fallbackSegments.length,
  });
  return fallbackSegments;
}

export const TranscriptionService = {
  async transcribe(
    audioUri: string,
    onSegment?: (segment: TranscriptSegment) => void,
    mode: TranscriptionMode = 'cloud'
  ): Promise<TranscriptSegment[]> {
    const normalizedMode = normalizeTranscriptionMode(mode as unknown as string);
    logger.info('TranscriptionService', 'Transcription submitted', {
      mode: normalizedMode,
      audioUri,
    });

    if (normalizedMode === 'local') {
      logger.warn(
        'TranscriptionService',
        'On-device file transcription unavailable; caller may fall back to cloud',
      );
      throw new Error(
        'On-device transcription from saved audio is not available on this device. Try Cloud mode in Settings.',
      );
    }

    return transcribeWithAssemblyAI(audioUri, onSegment);
  },
};

export type { TranscriptionDependencies };
