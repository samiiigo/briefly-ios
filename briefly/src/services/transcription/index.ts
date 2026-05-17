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

import * as FileSystem from 'expo-file-system/legacy';
import { TranscriptSegment, TranscriptionMode } from '@/types';
import { requireAssemblyAISharedApiKey } from '@/constants/api/assemblyAI';
import { normalizeTranscriptionMode } from '@/utils/transcriptionMode';
import {
  uploadAudio,
  createTranscriptJob,
  pollForCompletion,
  AssemblyAITranscriptPayload,
} from './assemblyAIClient';
import { buildSentenceSegments, buildFallbackSegments } from './segmentBuilder';
import { WAV_HEADER_BYTES } from '@/services/audio/recordingOptions';
import { logger } from '@/utils/logger';

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
      const info = await FileSystem.getInfoAsync(audioUri);
      return { exists: info.exists, size: (info as any).size };
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
    throw new Error('Recording is too short or empty. Record for at least one second and try again.');
  }
  logger.info('TranscriptionService', 'Async transcription started', { audioUri, fileSize });

  const uploadUrl = await dependencies.client.uploadAudio(audioUri, apiKey);
  const transcriptId = await dependencies.client.createTranscriptJob(uploadUrl, apiKey);
  const payload = await dependencies.client.pollForCompletion(transcriptId, apiKey);

  const words = payload.words ?? [];
  if (words.length > 0) {
    const segments = dependencies.segmentBuilder.buildFromWords(words);
    segments.forEach((segment) => onSegment?.(segment));
    if (segments.length > 0) {
      logger.info('TranscriptionService', 'Transcription result received', {
        segmentCount: segments.length,
      });
      return segments;
    }
  }

  const fallback = (payload.text ?? '').trim();
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
    mode: TranscriptionMode = 'post-assemblyai'
  ): Promise<TranscriptSegment[]> {
    const normalizedMode = normalizeTranscriptionMode(mode as unknown as string);
    logger.info('TranscriptionService', 'Transcription submitted', {
      mode: normalizedMode,
      audioUri,
    });

    if (normalizedMode === 'local-on-device') {
      logger.warn('TranscriptionService', 'Local mode cannot be used for async transcription');
      throw new Error(
        'Local (on-device) mode does not upload audio. In this build, local transcripts must be captured live during recording. If no local transcript was captured, retry in Live Local mode with native transcription enabled.'
      );
    }

    return transcribeWithAssemblyAI(audioUri, onSegment);
  },
};

export type { TranscriptionDependencies };
