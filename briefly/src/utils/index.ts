/**
 * Shared utilities.
 *
 * Domain folders under utils/:
 *   formatting/  — display formatting (dates, durations, file sizes)
 *   recording/   — recording entity helpers, export, validation, emoji
 *   providers/   — cloud provider key detection and metadata
 */
export {
  formatDuration,
  formatTimestamp,
  formatDate,
  formatGroupLabel,
  formatRecentsCardDate,
  formatRecentsGroupLabel,
  formatFileSize,
} from './formatting/formatting';
export {
  generateId,
  generateTitle,
  ensureUniqueTitle,
  groupRecordingsByTime,
} from './recording/recording';
export {
  detectProvider,
  providerEndpoint,
  providerLabel,
} from './providers/providerDetection';
export type { DetectedCloudProvider as CloudProvider } from './providers/providerDetection';
export { isIOS, isAndroid, isWeb, platformSelect } from './platform';
export {
  triggerHaptic,
  triggerNotificationHaptic,
  triggerSelectionHaptic,
} from './haptics';
