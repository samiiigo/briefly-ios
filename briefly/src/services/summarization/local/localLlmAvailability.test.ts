import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isOnDeviceSummarizationMode,
  LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE,
  LOCAL_LLM_MODEL_NOT_READY_MESSAGE,
} from './localLlmAvailability';

describe('localLlmAvailability', () => {
  it('detects on-device summarization mode', () => {
    assert.equal(isOnDeviceSummarizationMode('on-device'), true);
    assert.equal(isOnDeviceSummarizationMode('cloud-shared-openrouter'), false);
  });

  it('exposes user-facing blocker copy', () => {
    assert.match(LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE, /downloading/i);
    assert.match(LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE, /Settings/i);
    assert.match(LOCAL_LLM_MODEL_NOT_READY_MESSAGE, /download/i);
    assert.match(LOCAL_LLM_MODEL_NOT_READY_MESSAGE, /Gemma 4 E2B/i);
  });
});
