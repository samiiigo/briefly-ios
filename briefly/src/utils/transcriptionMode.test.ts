import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveAsyncTranscriptionMode,
  resolvePostRecordingPipeline,
  resolveRecordingTranscriptionPlan,
  requiresLiveOnDeviceCapture,
} from './transcriptionMode';

describe('resolveAsyncTranscriptionMode', () => {
  it('maps live AssemblyAI to post-recording for async reruns', () => {
    assert.equal(resolveAsyncTranscriptionMode('live-assemblyai'), 'post-assemblyai');
  });

  it('keeps post-recording AssemblyAI unchanged', () => {
    assert.equal(resolveAsyncTranscriptionMode('post-assemblyai'), 'post-assemblyai');
  });

  it('keeps local on-device unchanged', () => {
    assert.equal(resolveAsyncTranscriptionMode('local-on-device'), 'local-on-device');
  });
});

describe('resolveRecordingTranscriptionPlan', () => {
  const caps = { canCloudLive: true, canOnDeviceLive: true };

  it('always uses live on-device capture for local mode', () => {
    const plan = resolveRecordingTranscriptionPlan('local-on-device', caps);
    assert.equal(plan.settingsMode, 'local-on-device');
    assert.equal(plan.useLiveCapture, true);
    assert.equal(plan.liveEngine, 'on-device');
    assert.equal(requiresLiveOnDeviceCapture(plan), true);
  });

  it('uses cloud live for live AssemblyAI when supported', () => {
    const plan = resolveRecordingTranscriptionPlan('live-assemblyai', caps);
    assert.equal(plan.useLiveCapture, true);
    assert.equal(plan.liveEngine, 'cloud');
  });

  it('does not use live capture for post-recording mode', () => {
    const plan = resolveRecordingTranscriptionPlan('post-assemblyai', caps);
    assert.equal(plan.useLiveCapture, false);
    assert.equal(plan.liveEngine, 'none');
  });

  it('reports no on-device engine when native speech is unavailable', () => {
    const plan = resolveRecordingTranscriptionPlan('local-on-device', {
      canCloudLive: true,
      canOnDeviceLive: false,
    });
    assert.equal(plan.useLiveCapture, false);
    assert.equal(plan.liveEngine, 'none');
  });
});

describe('resolvePostRecordingPipeline', () => {
  const liveSegments = [{ id: '1', text: 'hello', startTime: 0, endTime: 1, isFinal: true }];

  it('always transcribes audio for post-recording mode even if a transcript exists', () => {
    const pipeline = resolvePostRecordingPipeline('post-assemblyai', liveSegments);
    assert.equal(pipeline.skipAsyncTranscription, false);
    assert.equal(pipeline.asyncTranscriptionMode, 'post-assemblyai');
  });

  it('skips async transcription for live mode when live transcript exists', () => {
    const pipeline = resolvePostRecordingPipeline('live-assemblyai', liveSegments);
    assert.equal(pipeline.skipAsyncTranscription, true);
    assert.equal(pipeline.asyncTranscriptionMode, 'post-assemblyai');
  });

  it('falls back to file transcription for live mode without a transcript', () => {
    const pipeline = resolvePostRecordingPipeline('live-assemblyai', []);
    assert.equal(pipeline.skipAsyncTranscription, false);
    assert.equal(pipeline.asyncTranscriptionMode, 'post-assemblyai');
  });

  it('skips async transcription for local mode when on-device transcript exists', () => {
    const pipeline = resolvePostRecordingPipeline('local-on-device', liveSegments);
    assert.equal(pipeline.skipAsyncTranscription, true);
  });

  it('requires transcription step for local mode without a transcript', () => {
    const pipeline = resolvePostRecordingPipeline('local-on-device', undefined);
    assert.equal(pipeline.skipAsyncTranscription, false);
  });
});
