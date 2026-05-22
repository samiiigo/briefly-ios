/**
 * CloudAssemblyAITranscriptionProvider — cloud file transcription
 *
 * Low-level HTTP lives in assemblyAIClient; segment shaping in segmentBuilder.
 */
import { TranscriptSegment } from '@/types';
import { getPathInfo } from '@/utils/fileSystem/pathInfo';
import { requireAssemblyAISharedApiKey } from '@/constants/api/assemblyAI';
import { MIN_TRANSCRIPTION_AUDIO_BYTES } from './transcriptionAudioConstants';
import { logger } from '@/utils/logging/logger';
import {
  uploadAudio,
  createTranscriptJob,
  pollForCompletion,
  AssemblyAITranscriptPayload,
} from './assemblyAIClient';
import { buildSentenceSegments, buildFallbackSegments } from './segmentBuilder';
import { TranscriptionProvider } from './transcriptionProvider';
interface AsyncTranscriptionClient {
  uploadAudio(audioUri: string, apiKey: string): Promise<string>;
  createTranscriptJob(uploadUrl: string, apiKey: string): Promise<string>;
  pollForCompletion(transcriptId: string, apiKey: string): Promise<AssemblyAITranscriptPayload>;
}
interface SegmentBuilder {
  buildFromWords(words: { text: string; start?: number; end?: number }[]): TranscriptSegment[];
  buildFromText(text: string): TranscriptSegment[];
}
export interface CloudTranscriptionDependencies {
  getApiKey(): string;
  getFileInfo(audioUri: string): Promise<{ exists: boolean; size?: number }>;
  client: AsyncTranscriptionClient;
  segmentBuilder: SegmentBuilder;
}
export function createDefaultCloudTranscriptionDependencies(): CloudTranscriptionDependencies {
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
export class CloudAssemblyAITranscriptionProvider implements TranscriptionProvider {
  readonly name = 'cloud-assemblyai';
  constructor(private readonly deps: CloudTranscriptionDependencies) {}
  async transcribe(
    audioUri: string,
    onSegment?: (segment: TranscriptSegment) => void,
  ): Promise<TranscriptSegment[]> {
    const apiKey = this.deps.getApiKey();
    const fileInfo = await this.deps.getFileInfo(audioUri);
    if (!fileInfo.exists) {
      logger.error('TranscriptionService', 'Audio file not found', { audioUri });
      throw new Error('Audio file not found.');
    }
    const fileSize = fileInfo.size ?? 0;
    if (fileSize < MIN_TRANSCRIPTION_AUDIO_BYTES) {
      logger.error('TranscriptionService', 'Audio file too small to transcribe', {
        audioUri,
        fileSize,
      });
      throw new Error(
        'Recording is too short. Record for at least 10 seconds and try again.',
      );
    }
    logger.info('TranscriptionService', 'Async transcription started', { audioUri, fileSize });
    const uploadUrl = await this.deps.client.uploadAudio(audioUri, apiKey);
    const transcriptId = await this.deps.client.createTranscriptJob(uploadUrl, apiKey);
    const payload = await this.deps.client.pollForCompletion(transcriptId, apiKey);
    const words = payload.words ?? [];
    const fullText = (payload.text ?? '').trim();
    const textWordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;
    if (fullText && words.length > 0 && textWordCount > words.length * 2) {
      logger.info('TranscriptionService', 'Using full transcript text (words array sparse)', {
        wordTimings: words.length,
        textWordCount,
      });
      const textSegments = this.deps.segmentBuilder.buildFromText(fullText);
      textSegments.forEach((segment) => onSegment?.(segment));
      return textSegments;
    }
    if (words.length > 0) {
      const segments = this.deps.segmentBuilder.buildFromWords(words);
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
    const fallbackSegments = this.deps.segmentBuilder.buildFromText(fallback);
    fallbackSegments.forEach((segment) => onSegment?.(segment));
    logger.info('TranscriptionService', 'Transcription result received (fallback text)', {
      segmentCount: fallbackSegments.length,
    });
    return fallbackSegments;
  }
}
