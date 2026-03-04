export type Transcript = {
  id: string;
  title: string;
  createdAt: string;
  durationSeconds: number;
  text: string;
};

export type Mode = 'local' | 'cloud';

export type SummarizeIntent = 'summary' | 'insights';

export type CloudConfig = {
  baseUrl: string;
  apiKey?: string;
};
