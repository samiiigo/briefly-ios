import { getSupabaseClient } from '@/api/supabaseClient';
import {
  createProxyTranscriptionJob,
  pollProxyTranscriptionJob,
  uploadAudioToProxyStorage,
} from '@/api/assemblyAiProxy';
import type { AssemblyAITranscriptPayload } from '@/features/processing/transcription/assemblyAIClient';

export async function uploadAudioViaProxy(audioUri: string): Promise<string> {
  const session = await getSupabaseClient().auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) {
    throw new Error('Sign in is required for cloud transcription.');
  }
  return uploadAudioToProxyStorage(audioUri, userId);
}

export async function createTranscriptJobViaProxy(storagePath: string): Promise<string> {
  return createProxyTranscriptionJob(storagePath);
}

export async function pollForCompletionViaProxy(
  jobId: string,
): Promise<AssemblyAITranscriptPayload> {
  return pollProxyTranscriptionJob(jobId);
}

export const proxyAssemblyAIClient = {
  uploadAudio: uploadAudioViaProxy,
  createTranscriptJob: async (storagePath: string, _apiKey: string) =>
    createTranscriptJobViaProxy(storagePath),
  pollForCompletion: async (jobId: string, _apiKey: string) => pollForCompletionViaProxy(jobId),
};
