/**
 * On-device Gemma 4 E2B GGUF for local summarization (llama.rn).
 *
 * Base model: https://huggingface.co/google/gemma-4-E2B-it
 * Quantized GGUF (Q4_K_M): bartowski/google_gemma-4-E2B-it-GGUF
 */
export const LOCAL_GEMMA_MODEL_SOURCE_REPO = 'https://huggingface.co/google/gemma-4-E2B-it';

export const LOCAL_GEMMA_MODEL_FILENAME = 'google_gemma-4-E2B-it-Q4_K_M.gguf';

/** Q4_K_M quant (~3.5 GB) of google/gemma-4-E2B-it. */
export const LOCAL_GEMMA_MODEL_DOWNLOAD_URL =
  'https://huggingface.co/bartowski/google_gemma-4-E2B-it-GGUF/resolve/main/google_gemma-4-E2B-it-Q4_K_M.gguf';

/** Minimum on-disk bytes for a complete Q4_K_M download. */
export const LOCAL_GEMMA_MIN_MODEL_BYTES = 3_000_000_000;

/** ~3.5 GB weights + headroom for KV cache. */
export const LOCAL_GEMMA_MIN_FREE_BYTES = 4_500_000_000;

/** Conservative context for mobile RAM (tokens). */
export const LOCAL_GEMMA_N_CTX = 2048;

/** Max transcript characters fed into the model after trimming. */
export const LOCAL_GEMMA_MAX_TRANSCRIPT_CHARS = 12_000;

/** GPU layer offload count (Metal on iOS, OpenCL on supported Android). */
export const LOCAL_GEMMA_N_GPU_LAYERS = 99;

/** Stop sequences for Gemma 4 turn-based chat (see google/gemma-4-E2B-it chat_template.jinja). */
export const LOCAL_GEMMA_STOP_WORDS = [
  '<|turn>user',
  '<|turn>system',
  '<|turn>model',
  '</s>',
  '<|end|>',
  '<|endoftext|>',
  '<|end_of_text|>',
];
