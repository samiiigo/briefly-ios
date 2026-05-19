/** On-device Gemma GGUF used for local summarization (llama.rn). */
export const LOCAL_GEMMA_MODEL_FILENAME = 'gemma-2-2b-it-Q4_K_M.gguf';

/** Public GGUF mirror (Hugging Face resolve URL). */
export const LOCAL_GEMMA_MODEL_DOWNLOAD_URL =
  'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf';

/** ~1.6 GB quantized weights + headroom for extraction and KV cache. */
export const LOCAL_GEMMA_MIN_FREE_BYTES = 2_200_000_000;

/** Conservative context for mobile RAM (tokens). */
export const LOCAL_GEMMA_N_CTX = 2048;

/** Max transcript characters fed into the model after trimming. */
export const LOCAL_GEMMA_MAX_TRANSCRIPT_CHARS = 12_000;

/** GPU layer offload count (Metal on iOS, OpenCL on supported Android). */
export const LOCAL_GEMMA_N_GPU_LAYERS = 99;

export const LOCAL_GEMMA_STOP_WORDS = [
  '</s>',
  '<|end|>',
  '<|eot_id|>',
  '<|end_of_text|>',
  '<|end_of_turn|>',
  '<end_of_turn>',
];
