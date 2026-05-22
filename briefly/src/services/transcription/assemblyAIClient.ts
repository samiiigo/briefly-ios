/**
 * AssemblyAIClient (SRP)
 *
 * Single responsibility: low-level HTTP communication with AssemblyAI's
 * async transcription API. Handles upload, job creation, and polling.
 *
 * Separated from business logic (segment building, fallback handling)
 * so the HTTP layer can change independently.
 */

import {
  uploadAsync,
  FileSystemUploadType,
  FileSystemSessionType,
} from '@/utils/fileSystem/legacyUpload';
import { AssemblyAIConfig } from '@/constants/api/assemblyAI';
import { assertPublicEndpointRateLimit } from '@/security/rateLimiter';
import { RateLimitError } from '@/security/RateLimitError';
import { validateAssemblyAiTranscriptCreateBody } from '@/security/inputSchemas';
import { secureFetch } from '@/security/secureFetch';
import { logger } from '@/utils/logging/logger';

const API_BASE_URL = 'https://api.assemblyai.com/v2';
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 180;

function uploadContentType(audioUri: string): string {
  const lower = audioUri.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  return 'application/octet-stream';
}

export interface AssemblyAITranscriptPayload {
  words?: { text: string; start?: number; end?: number }[];
  text?: string;
}

function rethrowRateLimit(error: unknown): never {
  if (error instanceof RateLimitError) {
    throw new Error(
      `Transcription rate limited. Try again in about ${error.retryAfterSec} seconds.`
    );
  }
  throw error;
}

export async function uploadAudio(audioUri: string, apiKey: string): Promise<string> {
  await assertPublicEndpointRateLimit(`${API_BASE_URL}/upload`);
  logger.info('TranscriptionService', 'Uploading audio to AssemblyAI', { audioUri });
  const contentType = uploadContentType(audioUri);
  const upload = await uploadAsync(`${API_BASE_URL}/upload`, audioUri, {
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: apiKey,
      'Content-Type': contentType,
    },
    sessionType: FileSystemSessionType.BACKGROUND,
    httpMethod: 'POST',
  });

  if (upload.status !== 200) {
    logger.error('TranscriptionService', 'Audio upload failed', { status: upload.status });
    throw new Error(`AssemblyAI upload failed: ${upload.status} ${upload.body}`);
  }

  const payload = JSON.parse(upload.body);
  const uploadUrl = payload?.upload_url as string | undefined;
  if (!uploadUrl) {
    throw new Error('AssemblyAI upload did not return upload_url.');
  }
  logger.info('TranscriptionService', 'Audio uploaded successfully');
  return uploadUrl;
}

export async function createTranscriptJob(uploadUrl: string, apiKey: string): Promise<string> {
  const transcriptUrl = `${API_BASE_URL}/transcript`;
  await assertPublicEndpointRateLimit(transcriptUrl);
  logger.info('TranscriptionService', 'Creating transcript job');
  const body = validateAssemblyAiTranscriptCreateBody({
    audio_url: uploadUrl,
    punctuate: true,
    format_text: true,
    language_detection: true,
    speech_models: [AssemblyAIConfig.asyncModel, 'universal-2'],
  });
  let response: Response;
  try {
    response = await secureFetch(transcriptUrl, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    rethrowRateLimit(error);
  }

  if (!response.ok) {
    const body = await response.text();
    logger.error('TranscriptionService', 'Transcript job creation failed', { status: response.status });
    throw new Error(`AssemblyAI transcript create failed: ${response.status} ${body}`);
  }

  const payload = await response.json();
  const transcriptId = payload?.id as string | undefined;
  if (!transcriptId) {
    throw new Error('AssemblyAI transcript create did not return id.');
  }
  logger.info('TranscriptionService', 'Transcript job created', { transcriptId });
  return transcriptId;
}

export async function pollForCompletion(
  transcriptId: string,
  apiKey: string
): Promise<AssemblyAITranscriptPayload> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const pollUrl = `${API_BASE_URL}/transcript/${transcriptId}`;
    let response: Response;
    try {
      response = await secureFetch(pollUrl, {
        headers: { Authorization: apiKey },
      });
    } catch (error) {
      rethrowRateLimit(error);
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AssemblyAI transcript poll failed: ${response.status} ${body}`);
    }

    const payload = await response.json();
    const status = payload?.status as string | undefined;
    if (status === 'completed') {
      logger.info('TranscriptionService', 'Transcript job completed', { transcriptId });
      return payload;
    }
    if (status === 'error') {
      logger.error('TranscriptionService', 'Transcript job failed', {
        transcriptId,
        error: payload?.error,
      });
      throw new Error(payload?.error ?? 'AssemblyAI transcript job failed.');
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  logger.error('TranscriptionService', 'Transcript job timed out', { transcriptId });
  throw new Error('AssemblyAI transcript job timed out.');
}
