/**
 * TranscriptionService
 *
 * Transcription is always performed on-device using the BrieflyTranscriber
 * native Swift module (AVAudioEngine + SFSpeechRecognizer).
 *
 * Requires a development build (`npx expo run:ios`).
 * Cloud AI is used for summarization only — see SummarizationService.
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { TranscriptSegment } from '../types';

const { BrieflyTranscriber } = NativeModules;

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function transcribeOnDevice(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  if (Platform.OS === 'ios' && BrieflyTranscriber) {
    return transcribeWithNativeModule(audioUri, onSegment);
  }

  throw new Error(
    'On-device transcription requires a development build.\n\n' +
    'Run `npx expo run:ios` to build with the native transcription module.'
  );
}

async function transcribeWithNativeModule(
  audioUri: string,
  onSegment?: (segment: TranscriptSegment) => void
): Promise<TranscriptSegment[]> {
  return new Promise((resolve, reject) => {
    const emitter = new NativeEventEmitter(BrieflyTranscriber);
    const segments: TranscriptSegment[] = [];

    const segmentSub = emitter.addListener('onTranscriptSegment', (event: any) => {
      const seg: TranscriptSegment = {
        id: generateId(),
        speaker: event.speaker,
        speakerInitial: event.speaker ? event.speaker[0].toUpperCase() : undefined,
        text: event.text,
        startTime: event.startTime,
        endTime: event.endTime,
        isFinal: event.isFinal,
      };
      if (event.isFinal) {
        segments.push(seg);
        onSegment?.(seg);
      }
    });

    const doneSub = emitter.addListener('onTranscriptionComplete', () => {
      segmentSub.remove();
      doneSub.remove();
      resolve(segments);
    });

    const errSub = emitter.addListener('onTranscriptionError', (event: any) => {
      segmentSub.remove();
      doneSub.remove();
      errSub.remove();
      reject(new Error(event.message));
    });

    BrieflyTranscriber.transcribeFile(audioUri);
  });
}

export const TranscriptionService = {
  async transcribe(
    audioUri: string,
    onSegment?: (segment: TranscriptSegment) => void
  ): Promise<TranscriptSegment[]> {
    return transcribeOnDevice(audioUri, onSegment);
  },
};
