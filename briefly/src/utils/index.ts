/**
 * Lib barrel — re-exports from focused modules (SRP).
 *
 * Each module has a single reason to change:
 *   formatting.ts  — display formatting (dates, durations, file sizes)
 *   recording.ts   — recording entity helpers (IDs, titles, grouping)
 *   providers/providerDetection.ts — cloud provider key detection and metadata
 */

export {
  formatDuration,
  formatTimestamp,
  formatDate,
  formatGroupLabel,
  formatFileSize,
} from './formatting';

export {
  generateId,
  generateTitle,
  ensureUniqueTitle,
  groupRecordingsByTime,
} from './recording';

export {
  detectProvider,
  providerEndpoint,
  providerLabel,
} from './providers/providerDetection';

export type { DetectedCloudProvider as CloudProvider } from './providers/providerDetection';
