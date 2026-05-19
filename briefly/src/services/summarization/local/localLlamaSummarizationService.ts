import { Platform } from 'react-native';
import { initLlama, type LlamaContext } from 'llama.rn';
import { logger } from '@/utils/logging/logger';
import {
  parseJsonSummary,
  segmentsToText,
  SUMMARIZATION_TIMEOUT_MS,
} from '../summarizationUtils';
import { SummarizationResult } from '../summarizationProvider';
import { TranscriptSegment } from '@/types';
import { buildGemmaSummarizationMessages } from './gemmaPrompt';
import { getLocalGemmaModelPath } from './gemmaModelDownload';
import { assertLocalLlmReadyForSummarization } from './localLlmAvailability';
import {
  LOCAL_GEMMA_MAX_TRANSCRIPT_CHARS,
  LOCAL_GEMMA_N_CTX,
  LOCAL_GEMMA_N_GPU_LAYERS,
  LOCAL_GEMMA_STOP_WORDS,
} from './localModelConfig';
import { LocalLlamaError, mapLlamaNativeError } from './localLlamaErrors';

const ON_DEVICE_SUMMARIZATION_TIMEOUT_MS = Math.max(SUMMARIZATION_TIMEOUT_MS, 120_000);

let inferenceLock: Promise<void> = Promise.resolve();

function withInferenceLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = inferenceLock.then(fn, fn);
  inferenceLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function trimTranscriptForContext(text: string): string {
  if (text.length <= LOCAL_GEMMA_MAX_TRANSCRIPT_CHARS) return text;
  const head = text.slice(0, Math.floor(LOCAL_GEMMA_MAX_TRANSCRIPT_CHARS * 0.7));
  const tail = text.slice(-Math.floor(LOCAL_GEMMA_MAX_TRANSCRIPT_CHARS * 0.25));
  return `${head}\n\n[... transcript truncated for on-device memory ...]\n\n${tail}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`)),
      timeoutMs,
    );
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function createContext(modelPath: string): Promise<LlamaContext> {
  const params = {
    model: modelPath,
    n_ctx: LOCAL_GEMMA_N_CTX,
    n_gpu_layers: LOCAL_GEMMA_N_GPU_LAYERS,
    use_mlock: false,
    use_mmap: true,
    n_threads: Math.max(2, (Platform.OS === 'ios' ? 4 : 3)),
  };

  logger.info('SUMMARY', 'Initializing llama context', {
    platform: Platform.OS,
    n_ctx: params.n_ctx,
    n_gpu_layers: params.n_gpu_layers,
  });

  const context = await initLlama(params);

  logger.info('SUMMARY', 'Llama context ready', {
    gpu: context.gpu,
    reasonNoGPU: context.reasonNoGPU,
    devices: context.devices,
  });

  return context;
}

async function runCompletion(
  context: LlamaContext,
  transcript: string,
  fallbackText: string,
): Promise<SummarizationResult> {
  const result = await context.completion({
    messages: buildGemmaSummarizationMessages(transcript),
    n_predict: 1400,
    temperature: 0.25,
    top_p: 0.9,
    stop: LOCAL_GEMMA_STOP_WORDS,
    jinja: true,
    add_generation_prompt: true,
  });

  const raw = result.text?.trim() ?? '';
  if (!raw) {
    throw new LocalLlamaError(
      'unknown',
      'The on-device model returned an empty response. Try a shorter recording or cloud summarization.',
    );
  }

  return parseJsonSummary(raw, fallbackText);
}

/**
 * Runs Gemma summarization in a fresh llama context that is released when done.
 */
export async function summarizeWithLocalLlama(
  segments: TranscriptSegment[],
): Promise<SummarizationResult> {
  return withInferenceLock(async () => {
    const fallbackText = segmentsToText(segments);
    if (!fallbackText.trim()) {
      throw new LocalLlamaError('unknown', 'No transcript text to summarize.');
    }

    const transcript = trimTranscriptForContext(fallbackText);

    assertLocalLlmReadyForSummarization();

    const modelPath = getLocalGemmaModelPath();
    let context: LlamaContext | null = null;

    try {
      context = await withTimeout(
        createContext(modelPath),
        ON_DEVICE_SUMMARIZATION_TIMEOUT_MS,
        'Model load',
      );

      return await withTimeout(
        runCompletion(context, transcript, fallbackText),
        ON_DEVICE_SUMMARIZATION_TIMEOUT_MS,
        'Summarization',
      );
    } catch (error: unknown) {
      if (error instanceof LocalLlamaError) throw error;
      throw mapLlamaNativeError(error);
    } finally {
      if (context) {
        try {
          await context.release();
          logger.info('SUMMARY', 'Llama context released');
        } catch (releaseError: unknown) {
          logger.warn('SUMMARY', 'Failed to release llama context', {
            error:
              releaseError instanceof Error ? releaseError.message : String(releaseError),
          });
        }
      }
    }
  });
}
