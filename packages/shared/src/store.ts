import type {
  CloudConfig,
  Mode,
  SummarizeIntent,
  Transcript,
} from './models';
import type {StorageAdapter} from './storage';
import type {Summarizer} from './summarizer';

type CreateStoreArgs = {
  storage: StorageAdapter;
  localSummarizer: Summarizer;
  cloudSummarizer: Summarizer;
};

const defaultCloudConfig: CloudConfig = {
  baseUrl: 'https://example.com/mock-llm',
};

export class BrieflyStore {
  private readonly storage: StorageAdapter;
  private readonly localSummarizer: Summarizer;
  private readonly cloudSummarizer: Summarizer;
  private transcripts: Transcript[] = [];
  private mode: Mode = 'local';
  private cloudConfig: CloudConfig = defaultCloudConfig;

  constructor(args: CreateStoreArgs) {
    this.storage = args.storage;
    this.localSummarizer = args.localSummarizer;
    this.cloudSummarizer = args.cloudSummarizer;
  }

  async hydrate() {
    this.transcripts = await this.storage.loadTranscripts();
  }

  getMode() {
    return this.mode;
  }

  setMode(mode: Mode) {
    this.mode = mode;
  }

  getCloudConfig() {
    return this.cloudConfig;
  }

  setCloudConfig(config: CloudConfig) {
    this.cloudConfig = config;
  }

  getTranscripts() {
    return [...this.transcripts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getTranscript(id: string) {
    return this.transcripts.find(item => item.id === id);
  }

  async addTranscript(input: Omit<Transcript, 'id' | 'createdAt'>) {
    const transcript: Transcript = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.transcripts.unshift(transcript);
    await this.storage.saveTranscripts(this.transcripts);
    return transcript;
  }

  async updateTranscriptText(id: string, text: string) {
    this.transcripts = this.transcripts.map(item =>
      item.id === id ? {...item, text} : item,
    );
    await this.storage.saveTranscripts(this.transcripts);
  }

  async summarize(id: string, intent: SummarizeIntent) {
    const transcript = this.getTranscript(id);
    if (!transcript) {
      return 'Transcript not found.';
    }

    if (this.mode === 'cloud') {
      return this.cloudSummarizer(transcript.text, intent, this.cloudConfig);
    }

    return this.localSummarizer(transcript.text, intent, this.cloudConfig);
  }
}
