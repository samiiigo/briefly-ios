/**
 * AssemblyAI background upload still uses expo-file-system legacy uploadAsync.
 * Migrate when a non-legacy streaming upload API is available in expo-file-system.
 */
export {
  uploadAsync,
  FileSystemUploadType,
  FileSystemSessionType,
} from 'expo-file-system/legacy';
export type { FileSystemUploadResult } from 'expo-file-system/legacy';
