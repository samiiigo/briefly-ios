import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveTranscriptionRoute } from './transcriptionRouting';

describe('transcription route resolution', () => {
  it('maps live AssemblyAI mode directly', () => {
    assert.equal(resolveTranscriptionRoute('live-assemblyai'), 'live-assemblyai');
  });

  it('maps post-recording AssemblyAI mode directly', () => {
    assert.equal(resolveTranscriptionRoute('post-assemblyai'), 'post-assemblyai');
  });

  it('maps local on-device mode directly', () => {
    assert.equal(resolveTranscriptionRoute('local-on-device'), 'local-on-device');
  });

  it('maps legacy on-device to live AssemblyAI', () => {
    assert.equal(resolveTranscriptionRoute('on-device' as any), 'live-assemblyai');
  });

  it('maps legacy cloud to post-recording AssemblyAI', () => {
    assert.equal(resolveTranscriptionRoute('cloud' as any), 'post-assemblyai');
  });

  it('maps legacy on-device-first to local on-device', () => {
    assert.equal(resolveTranscriptionRoute('on-device-first' as any), 'local-on-device');
  });
});
