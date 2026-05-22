import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeTranscriptionMode,
  resolvePostRecordingPipeline,
  resolveDecorativePreviewEngine,
  canRunDecorativeLivePreview,
} from './transcriptionMode';

describe('normalizeTranscriptionMode', () => {
  it('maps legacy live and post modes to cloud', () => {
    assert.equal(normalizeTranscriptionMode('live-assemblyai'), 'cloud');
    assert.equal(normalizeTranscriptionMode('post-assemblyai'), 'cloud');
  });

  it('maps legacy local modes to local', () => {
    assert.equal(normalizeTranscriptionMode('local-on-device'), 'local');
    assert.equal(normalizeTranscriptionMode('on-device-first'), 'local');
  });
});

describe('resolvePostRecordingPipeline', () => {
  const liveSegments = [{ id: '1', text: 'hello', startTime: 0, endTime: 1, isFinal: true }];

  it('always transcribes from saved audio for cloud mode', () => {
    const pipeline = resolvePostRecordingPipeline('cloud', liveSegments);
    assert.equal(pipeline.skipAsyncTranscription, false);
    assert.equal(pipeline.asyncTranscriptionMode, 'cloud');
  });

  it('ignores decorative live transcript for local mode', () => {
    const pipeline = resolvePostRecordingPipeline('local', liveSegments);
    assert.equal(pipeline.skipAsyncTranscription, false);
    assert.equal(pipeline.asyncTranscriptionMode, 'local');
  });
});

describe('resolveDecorativePreviewEngine', () => {
  const caps = { canCloudLive: true, canOnDeviceLive: true };

  it('prefers on-device preview for local mode when supported', () => {
    assert.equal(resolveDecorativePreviewEngine('local', caps), 'on-device');
  });

  it('uses cloud preview for cloud mode', () => {
    assert.equal(resolveDecorativePreviewEngine('cloud', caps), 'cloud');
  });

  it('returns none when no live engines are available', () => {
    assert.equal(
      resolveDecorativePreviewEngine('cloud', { canCloudLive: false, canOnDeviceLive: false }),
      'none',
    );
  });
});

describe('canRunDecorativeLivePreview', () => {
  it('requires setting and a supported engine', () => {
    assert.equal(canRunDecorativeLivePreview(true, 'cloud'), true);
    assert.equal(canRunDecorativeLivePreview(false, 'cloud'), false);
    assert.equal(canRunDecorativeLivePreview(true, 'none'), false);
  });
});
