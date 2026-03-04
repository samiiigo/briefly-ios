import type {CloudConfig, SummarizeIntent} from './models';

export type Summarizer = (
  transcriptText: string,
  intent: SummarizeIntent,
  cloudConfig?: CloudConfig,
) => Promise<string>;

export function createLocalSummarizer(): Summarizer {
  return async (transcriptText, intent) => {
    const trimmed = transcriptText.trim();
    if (!trimmed) {
      return 'No transcript text available.';
    }

    const words = trimmed.split(/\s+/);
    const preview = words.slice(0, Math.min(40, words.length)).join(' ');
    return intent === 'summary'
      ? `Local summary: ${preview}${words.length > 40 ? '…' : ''}`
      : `Local insights: key terms include ${words.slice(0, 8).join(', ')}.`;
  };
}

export function createCloudSummarizer(fetchImpl: typeof fetch = fetch): Summarizer {
  return async (transcriptText, intent, cloudConfig) => {
    if (!cloudConfig?.baseUrl) {
      return 'Cloud mode is enabled but no base URL is configured.';
    }

    const response = await fetchImpl(cloudConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cloudConfig.apiKey ? {Authorization: `Bearer ${cloudConfig.apiKey}`} : {}),
      },
      body: JSON.stringify({transcriptText, intent}),
    });

    if (!response.ok) {
      return `Cloud request failed (${response.status}).`;
    }

    const payload = (await response.json()) as {summary?: string};
    return payload.summary ?? 'Cloud response did not include a summary.';
  };
}
