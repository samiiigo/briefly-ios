/**
 * Storage services — barrel export (ISP)
 *
 * Consumers import only the storage service they need.
 */

export { RecordingStorageService } from './recordingStorageService';
export { FolderStorageService } from './folderStorageService';
export { LocalModelStorageService } from './localModelStorageService';
export type { RecordingRepository, FolderRepository } from './contracts';
