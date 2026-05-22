import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Recording } from '@/types';
import {
  isInitialProcessingFailure,
  isRecordingEntryNavigationLocked,
} from './recordingEntryAccess';
function baseRecording(overrides: Partial<Recording> = {}): Recording {
  return {
    id: 'r1',
    title: 'Test',
    createdAt: 0,
    duration: 60,
    filePath: '/audio.m4a',
    fileSize: 1000,
    processingMode: 'cloud-shared-openrouter',
    status: 'ready',
    ...overrides,
  };
}
describe('recordingEntryAccess', () => {
  it('locks navigation while transcribing or summarizing', () => {
    assert.equal(
      isRecordingEntryNavigationLocked(baseRecording({ status: 'transcribing' })),
      true,
    );
    assert.equal(
      isRecordingEntryNavigationLocked(baseRecording({ status: 'summarizing' })),
      true,
    );
  });
  it('locks navigation for initial processing failure without a transcript', () => {
    assert.equal(
      isInitialProcessingFailure(baseRecording({ status: 'error', transcript: [] })),
      true,
    );
    assert.equal(
      isRecordingEntryNavigationLocked(baseRecording({ status: 'error', transcript: [] })),
      true,
    );
  });
  it('allows navigation when summarization failed but transcript exists', () => {
    const recording = baseRecording({
      status: 'error',
      transcript: [{ id: '1', text: 'hello', startTime: 0, endTime: 1, isFinal: true }],
    });
    assert.equal(isInitialProcessingFailure(recording), false);
    assert.equal(isRecordingEntryNavigationLocked(recording), false);
  });
});
