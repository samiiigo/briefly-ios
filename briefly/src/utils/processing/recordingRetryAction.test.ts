import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { Recording } from '@/types';
import {
  __setRecordingAudioAvailabilityForTests,
  type RecordingAudioAvailability,
} from '@/utils/recording/recordingPlayableAudio';
import { resolveRecordingRetryAction } from './recordingRetryAction';
function baseRecording(overrides: Partial<Recording> = {}): Recording {
  return {
    id: 'r1',
    title: 'Test',
    createdAt: 0,
    duration: 60,
    filePath: '/audio.m4a',
    fileSize: 1000,
    processingMode: 'cloud-shared-openrouter',
    status: 'error',
    ...overrides,
  };
}
const audioPresent: RecordingAudioAvailability = {
  hasAudio: true,
  filePath: '/audio.m4a',
  fileSize: 1000,
};
const audioMissing: RecordingAudioAvailability = {
  hasAudio: false,
  filePath: '',
  fileSize: 0,
};
afterEach(() => {
  __setRecordingAudioAvailabilityForTests(null);
});
describe('resolveRecordingRetryAction', () => {
  it('prefers transcription retry when audio exists on disk but no transcript', () => {
    __setRecordingAudioAvailabilityForTests(() => audioPresent);
    const action = resolveRecordingRetryAction(
      baseRecording({ transcript: [] }),
      'cloud-shared-openrouter',
    );
    assert.equal(action?.kind, 'transcription');
    assert.equal(action?.icon, 'mic-outline');
  });
  it('offers summarization fallback when transcript exists', () => {
    __setRecordingAudioAvailabilityForTests(() => audioMissing);
    const action = resolveRecordingRetryAction(
      baseRecording({
        processingMode: 'cloud',
        transcript: [{ id: '1', text: 'hello', startTime: 0, endTime: 1, isFinal: true }],
      }),
      'cloud-shared-openrouter',
    );
    assert.equal(action?.kind, 'summarization-fallback');
    assert.equal(action?.summarizationMode, 'cloud-shared-openrouter');
  });
  it('skips list avatar retry when a transcript exists so the row stays openable', () => {
    __setRecordingAudioAvailabilityForTests(() => audioMissing);
    const action = resolveRecordingRetryAction(
      baseRecording({
        transcript: [{ id: '1', text: 'hello', startTime: 0, endTime: 1, isFinal: true }],
      }),
      'cloud-shared-openrouter',
      { forListAvatar: true },
    );
    assert.equal(action, null);
  });
});
