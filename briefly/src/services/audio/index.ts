/**
 * Audio services — barrel export (ISP)
 *
 * Consumers import only the service they need:
 *   import { PlaybackService } from '@/services/audio';
 *   import { RecordingService } from '@/services/audio';
 *   import { LiveTranscriptionService } from '@/services/audio';
 *   import { AudioFileService } from '@/services/audio';
 */

export { PlaybackService } from './playbackService';
export { RecordingService } from './recordingService';
export { LiveTranscriptionService } from './liveTranscriptionService';
export { DecorativeLivePreview } from './decorativeLivePreview';
export { DecorativeOnDeviceLivePreview } from './decorativeOnDeviceLivePreview';
export { AudioFileService } from './audioFileService';
export type { AudioRecordingResult } from './types';
export type { PlaybackControls, MeteringSource } from './contracts';
export type { LiveTranscriptionCallbacks } from './liveTranscriptionService';
export type { AssemblyAIConnectionState } from './assemblyAILiveTranscription';
