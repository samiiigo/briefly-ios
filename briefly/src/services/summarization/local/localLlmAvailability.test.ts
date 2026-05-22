import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isOnDeviceSummarizationModeFor } from './localLlmMode';
import {
  LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE,
  LOCAL_LLM_MODEL_NOT_READY_MESSAGE,
  LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE,
} from './localLlmMessages';
describe('localLlmAvailability', () => {
  it('detects on-device summarization mode', () => {
    assert.equal(isOnDeviceSummarizationModeFor('on-device'), true);
    assert.equal(isOnDeviceSummarizationModeFor('cloud-shared-openrouter'), false);
  });
  it('exposes user-facing blocker copy', () => {
    assert.match(LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE, /downloading/i);
    assert.match(LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE, /Settings/i);
    assert.match(LOCAL_LLM_MODEL_NOT_READY_MESSAGE, /download/i);
    assert.match(LOCAL_LLM_MODEL_NOT_READY_MESSAGE, /Gemma 4 E2B/i);
    assert.match(LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE, /Expo Go/i);
    assert.match(LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE, /prebuild/i);
  });
});
