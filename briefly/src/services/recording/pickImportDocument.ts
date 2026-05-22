import type { DocumentPickerResult } from 'expo-document-picker';
import { supportsDocumentPicker } from '@/utils/platformCapabilities';
import { platformSelect } from '@/utils/platform';

export const DOCUMENT_PICKER_UNAVAILABLE_MESSAGE =
  'File import requires a Briefly development build. Use `npm start` (dev client) and run `npm run dev:android` — not Expo Go (`--go`).';

/** Opens the system picker for JSON backups or audio files. */
export async function pickImportDocument(): Promise<DocumentPickerResult> {
  if (!supportsDocumentPicker()) {
    throw new Error(DOCUMENT_PICKER_UNAVAILABLE_MESSAGE);
  }

  const DocumentPicker = await import('expo-document-picker');
  // Android SAF often omits application/json, which greys out .json files in the picker.
  const type = platformSelect({
    ios: ['application/json', 'audio/*'],
    android: '*/*',
  });
  return DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type,
  });
}
