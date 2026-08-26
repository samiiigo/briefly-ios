import type { AudioRecordingResult } from './types';
import type { MeteringSource } from './contracts';
import { RecordingService } from './recordingService';
export interface RecordingCapturePort extends MeteringSource {
  start(): Promise<void>;
  stop(): Promise<AudioRecordingResult | undefined>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getActiveRecordingUri(): string | undefined;
}
export const defaultRecordingCapturePort: RecordingCapturePort = {
  start: () => RecordingService.start(),
  stop: () => RecordingService.stop(),
  pause: () => RecordingService.pause(),
  resume: () => RecordingService.resume(),
  getMetering: () => RecordingService.getMetering(),
  getActiveRecordingUri: () => RecordingService.getActiveRecordingUri(),
};
