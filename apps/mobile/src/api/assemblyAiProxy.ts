import { invokeBrieflyFunction, requireAuthenticatedFunctionSession } from '@/api/brieflyFunctions';
import type { AssemblyAITranscriptPayload } from '@/features/processing/transcription/assemblyAIClient';

interface StreamTokenResponse {
  token: string;
  expiresInSeconds: number;
}

interface CreateTranscriptionJobResponse {
  jobId: string;
}

interface TranscriptionJobStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: AssemblyAITranscriptPayload;
  error?: string;
}

export async function fetchAssemblyAIStreamToken(): Promise<string> {
  await requireAuthenticatedFunctionSession();
  const response = await invokeBrieflyFunction<StreamTokenResponse>('assemblyai-stream-token', {});
  return response.token;
}

export async function createProxyTranscriptionJob(storagePath: string): Promise<string> {
  await requireAuthenticatedFunctionSession();
  const response = await invokeBrieflyFunction<CreateTranscriptionJobResponse>(
    'transcription-create-job',
    { storagePath },
  );
  return response.jobId;
}

export async function pollProxyTranscriptionJob(
  jobId: string,
): Promise<AssemblyAITranscriptPayload> {
  const maxAttempts = 180;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await invokeBrieflyFunction<TranscriptionJobStatusResponse>(
      'transcription-job-status',
      { jobId },
    );
    if (response.status === 'failed') {
      throw new Error(response.error ?? 'Transcription job failed.');
    }
    if (response.status === 'completed' && response.result) {
      return response.result;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error('Transcription job timed out.');
}

export async function uploadAudioToProxyStorage(audioUri: string, userId: string): Promise<string> {
  await requireAuthenticatedFunctionSession();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.m4a`;
  const storagePath = `${userId}/${fileName}`;
  const signed = await invokeBrieflyFunction<{ signedUrl: string; storagePath: string }>(
    'transcription-upload-url',
    { storagePath },
  );

  const fileResponse = await fetch(audioUri);
  const blob = await fileResponse.blob();
  const uploadResponse = await fetch(signed.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type || 'audio/mp4' },
    body: blob,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload audio for transcription (${uploadResponse.status}).`);
  }
  return signed.storagePath;
}
