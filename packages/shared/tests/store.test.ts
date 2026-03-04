import {describe, expect, it, vi} from 'vitest';
import {BrieflyStore} from '../src/store';
import {createCloudSummarizer, createLocalSummarizer} from '../src/summarizer';
import {createInMemoryStorage} from '../src/storage';

describe('BrieflyStore', () => {
  it('uses local mode summarizer by default', async () => {
    const store = new BrieflyStore({
      storage: createInMemoryStorage(),
      localSummarizer: createLocalSummarizer(),
      cloudSummarizer: createCloudSummarizer(
        vi.fn(async () => new Response(JSON.stringify({summary: 'cloud'}))),
      ),
    });

    const transcript = await store.addTranscript({
      title: 't1',
      durationSeconds: 30,
      text: 'alpha beta gamma delta epsilon zeta',
    });

    const result = await store.summarize(transcript.id, 'summary');
    expect(result).toContain('Local summary:');
  });

  it('uses cloud summarizer when mode is cloud', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({summary: 'cloud summary result'}), {
        status: 200,
      }),
    );

    const store = new BrieflyStore({
      storage: createInMemoryStorage(),
      localSummarizer: createLocalSummarizer(),
      cloudSummarizer: createCloudSummarizer(fetchMock as unknown as typeof fetch),
    });

    store.setMode('cloud');
    store.setCloudConfig({baseUrl: 'https://example.com/mock', apiKey: 'abc123'});

    const transcript = await store.addTranscript({
      title: 't2',
      durationSeconds: 44,
      text: 'cloud test transcript',
    });

    const result = await store.summarize(transcript.id, 'insights');

    expect(result).toBe('cloud summary result');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('saves transcript edits', async () => {
    const store = new BrieflyStore({
      storage: createInMemoryStorage(),
      localSummarizer: createLocalSummarizer(),
      cloudSummarizer: createCloudSummarizer(
        vi.fn(async () => new Response(JSON.stringify({summary: 'unused'}))),
      ),
    });

    const transcript = await store.addTranscript({
      title: 'editable',
      durationSeconds: 10,
      text: 'old',
    });

    await store.updateTranscriptText(transcript.id, 'new text');
    expect(store.getTranscript(transcript.id)?.text).toBe('new text');
  });
});
