import type { DocumentPickerResult } from 'expo-document-picker';
import { supportsDocumentPicker } from '@/utils/platformCapabilities';

export const DOCUMENT_PICKER_UNAVAILABLE_MESSAGE =
  'File import requires a Briefly development build. Use `npm start` (dev client) and run `npm run dev:android` — not Expo Go (`--go`).';

/** Opens the system picker for JSON backups or audio files. */
export async function pickImportDocument(): Promise<DocumentPickerResult> {
  if (!supportsDocumentPicker()) {
    throw new Error(DOCUMENT_PICKER_UNAVAILABLE_MESSAGE);
  }

  const DocumentPicker = await import('expo-document-picker');
  return DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: ['application/json', 'audio/*'],
  });
}
