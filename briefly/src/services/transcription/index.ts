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
import { TranscriptSegment, TranscriptionMode } from '../../types';
import { requireAssemblyAISharedApiKey } from '../../config/assemblyAI';
import { normalizeTranscriptionMode } from '../../utils/transcriptionMode';
import { uploadAudio, createTranscriptJob, pollForCompletion } from './AssemblyAIClient';
import { buildSentenceSegments, buildFallbackSegments } from './segmentBuilder';
import { logger } from '../../utils/logger';

async function transcribeWithAssemblyAI(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  const apiKey = requireAssemblyAISharedApiKey();
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    logger.error('TranscriptionService', 'Audio file not found', { audioUri });
    throw new Error('Audio file not found.');
  }
  const fileSize = fileInfo.exists ? ((fileInfo as any).size ?? 0) : 0;
  logger.info('TranscriptionService', 'Async transcription started', { audioUri, fileSize });

  const uploadUrl = await uploadAudio(audioUri, apiKey);
  const transcriptId = await createTranscriptJob(uploadUrl, apiKey);
  const payload = await pollForCompletion(transcriptId, apiKey);

  const words = payload.words ?? [];
  if (words.length > 0) {
    const segments = buildSentenceSegments(words);
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
  const fallbackSegments = buildFallbackSegments(fallback);
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
