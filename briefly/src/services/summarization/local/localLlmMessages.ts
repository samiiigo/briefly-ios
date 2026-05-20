export const LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE =
  'The Gemma 4 E2B model is still downloading. Wait until the download finishes, then try summarizing again. Open Settings → Summarization to check progress.';

export const LOCAL_LLM_MODEL_NOT_READY_MESSAGE =
  'The on-device model is not downloaded yet. Open Settings → Summarization to download Gemma 4 E2B (~3.5 GB), then try again.';

export const LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE =
  'On-device summarization is not available in Expo Go. Create a development build: npx expo prebuild --clean, then npx expo run:ios or npx expo run:android.';

export const LOCAL_LLM_NATIVE_FALLBACK_HINT =
  'Basic offline summaries work without the Gemma download. Download Gemma 4 E2B below for richer, structured summaries (~3.5 GB).';
