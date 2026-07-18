import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveTranscriptionRoute } from './transcriptionRouting';
describe('transcription route resolution', () => {
  it('maps cloud mode directly', () => {
    assert.equal(resolveTranscriptionRoute('cloud'), 'cloud');
  });
  it('maps local mode directly', () => {
    assert.equal(resolveTranscriptionRoute('local'), 'local');
  });
  it('maps legacy live AssemblyAI to cloud', () => {
    assert.equal(resolveTranscriptionRoute('live-assemblyai' as any), 'cloud');
  });
  it('maps legacy post-recording to cloud', () => {
    assert.equal(resolveTranscriptionRoute('post-assemblyai' as any), 'cloud');
  });
  it('maps legacy local on-device to local', () => {
    assert.equal(resolveTranscriptionRoute('local-on-device' as any), 'local');
  });
});
