/**
 * Audio services — barrel export (ISP)
 *
 * Consumers import only the service they need:
 *   import { PlaybackService } from '../services/audio';
 *   import { RecordingService } from '../services/audio';
 *   import { LiveTranscriptionService } from '../services/audio';
 *   import { AudioFileService } from '../services/audio';
 */

export { PlaybackService } from './PlaybackService';
export { RecordingService } from './RecordingService';
export { LiveTranscriptionService } from './LiveTranscriptionService';
export { AudioFileService } from './AudioFileService';
export type { AudioRecordingResult } from './types';
export type { LiveTranscriptionCallbacks } from './LiveTranscriptionService';
export type { AssemblyAIConnectionState } from './AssemblyAILiveTranscription';
