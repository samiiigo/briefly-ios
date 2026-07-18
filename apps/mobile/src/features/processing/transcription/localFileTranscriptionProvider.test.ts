import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LocalFileTranscriptionProvider } from './localFileTranscriptionProvider';
describe('LocalFileTranscriptionProvider', () => {
  it('throws a stable user-facing error for batch on-device transcription', async () => {
    const provider = new LocalFileTranscriptionProvider();
    await assert.rejects(
      () => provider.transcribe('file:///test.wav'),
      /On-device transcription from saved audio/,
    );
  });
});
