import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveInterruptedProcessingResume,
  type InterruptedProcessingResumeAction,
} from './recordingProcessingResume';
import type { Recording } from '@/types';

function resumeFor(
  overrides: Partial<Pick<Recording, 'status' | 'transcript' | 'folder' | 'deletedAt'>>,
): InterruptedProcessingResumeAction {
  return resolveInterruptedProcessingResume({
    status: 'idle',
    ...overrides,
  });
}

describe('resolveInterruptedProcessingResume', () => {
  it('resumes full pipeline for transcribing', () => {
    assert.equal(resumeFor({ status: 'transcribing' }), 'full');
  });

  it('resumes summarization only when transcript exists', () => {
    assert.equal(
      resumeFor({
        status: 'summarizing',
        transcript: [{ id: '1', text: 'hello', startTime: 0, endTime: 1, isFinal: true }],
      }),
      'summarize-only',
    );
  });

  it('resumes full pipeline for summarizing without transcript', () => {
    assert.equal(resumeFor({ status: 'summarizing' }), 'full');
  });

  it('skips recently deleted and non-processing statuses', () => {
    assert.equal(resumeFor({ status: 'transcribing', folder: 'recently-deleted' }), 'skip');
    assert.equal(resumeFor({ status: 'transcribing', deletedAt: Date.now() }), 'skip');
    assert.equal(resumeFor({ status: 'ready' }), 'skip');
    assert.equal(resumeFor({ status: 'saved' }), 'skip');
  });
});
