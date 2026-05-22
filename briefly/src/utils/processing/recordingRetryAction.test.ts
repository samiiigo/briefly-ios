import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { Recording } from '@/types';
import {
  __setRecordingAudioProbeForTests,
  resolveRecordingRetryAction,
} from './recordingRetryAction';

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

const audioPresentProbe = {
  getPathInfo: (uri: string) =>
    uri === '/audio.m4a' ? { exists: true, size: 1000 } : { exists: false, size: 0 },
  destFile: () => ({ exists: false, uri: '', size: 0 }),
};

const audioMissingProbe = {
  getPathInfo: () => ({ exists: false, size: 0 }),
  destFile: () => ({ exists: false, uri: '', size: 0 }),
};

afterEach(() => {
  __setRecordingAudioProbeForTests(null);
});

describe('resolveRecordingRetryAction', () => {
  it('prefers transcription retry when audio exists on disk but no transcript', () => {
    __setRecordingAudioProbeForTests(audioPresentProbe);

    const action = resolveRecordingRetryAction(
      baseRecording({ transcript: [] }),
      'cloud-shared-openrouter',
    );
    assert.equal(action?.kind, 'transcription');
    assert.equal(action?.icon, 'mic-outline');
  });

  it('offers summarization fallback when transcript exists', () => {
    __setRecordingAudioProbeForTests(audioMissingProbe);

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
    __setRecordingAudioProbeForTests(audioMissingProbe);

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
