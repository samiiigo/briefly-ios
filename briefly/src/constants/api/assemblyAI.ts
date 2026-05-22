export {
  getAssemblyAISharedApiKey,
  requireAssemblyAISharedApiKey,
} from '@/security/sharedApiKeys';
const ASSEMBLYAI_STREAM_SAMPLE_RATE = 16000;
const ASSEMBLYAI_STREAM_MODEL = 'u3-rt-pro';
const ASSEMBLYAI_ASYNC_MODEL = 'universal-3-pro';
export const AssemblyAIConfig = {
  streamSampleRate: ASSEMBLYAI_STREAM_SAMPLE_RATE,
  streamModel: ASSEMBLYAI_STREAM_MODEL,
  asyncModel: ASSEMBLYAI_ASYNC_MODEL,
} as const;
