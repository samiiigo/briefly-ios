export const LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE =
  'The Gemma 4 E2B model is still downloading. Wait until the download finishes, then try summarizing again. Open Settings → Summarization to check progress.';

export const LOCAL_LLM_MODEL_NOT_READY_MESSAGE =
  'The on-device model is not downloaded yet. Open Settings → Summarization to download Gemma 4 E2B (~3.5 GB), then try again.';

export const LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE =
  'On-device Gemma summarization requires a development or production build with llama.rn. Expo Go does not include this native module. Rebuild with: npx expo prebuild --clean && npx expo run:ios';
