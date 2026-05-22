import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveRecordingDetailUiState } from './recordingDetailUiState';
import type { Recording } from '@/types';
const baseRecording: Recording = {
  id: 'r1',
  title: 'Test',
  createdAt: 0,
  duration: 60,
  filePath: '/audio.wav',
  fileSize: 10000,
  processingMode: 'cloud-shared-openrouter',
  status: 'ready',
  folder: 'unlisted',
  transcript: [{ id: 's1', text: 'Hello world', startTime: 0, endTime: 1, isFinal: true }],
};
describe('deriveRecordingDetailUiState', () => {
  it('enables summary rerun when transcript exists and idle', () => {
    const ui = deriveRecordingDetailUiState(baseRecording, {
      hasAudio: true,
      filePath: '/a',
      fileSize: 10000,
    });
    assert.equal(ui.canRerunSummary, true);
    assert.equal(ui.summaryRerunDisabled, false);
  });
  it('shows processing banner for saved recording with audio', () => {
    const saved = { ...baseRecording, status: 'saved' as const, summary: undefined };
    const ui = deriveRecordingDetailUiState(saved, {
      hasAudio: true,
      filePath: '/a',
      fileSize: 10000,
    });
    assert.equal(ui.showProcessingBanner, true);
  });
});
