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
  private idCounter = 0;
  private listeners = new Set<() => void>();

  constructor(args: CreateStoreArgs) {
    this.storage = args.storage;
    this.localSummarizer = args.localSummarizer;
    this.cloudSummarizer = args.cloudSummarizer;
  }

  async hydrate() {
    this.transcripts = await this.storage.loadTranscripts();
    this.emitChange();
  }

  getMode() {
    return this.mode;
  }

  setMode(mode: Mode) {
    this.mode = mode;
    this.emitChange();
  }

  getCloudConfig() {
    return this.cloudConfig;
  }

  setCloudConfig(config: CloudConfig) {
    this.cloudConfig = config;
    this.emitChange();
  }

  getTranscripts() {
    return [...this.transcripts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getTranscript(id: string) {
    return this.transcripts.find(item => item.id === id);
  }

  async addTranscript(input: Omit<Transcript, 'id' | 'createdAt'>) {
    const transcript: Transcript = {
      id: this.createId(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.transcripts.unshift(transcript);
    await this.storage.saveTranscripts(this.transcripts);
    this.emitChange();
    return transcript;
  }

  async updateTranscriptText(id: string, text: string) {
    this.transcripts = this.transcripts.map(item =>
      item.id === id ? {...item, text} : item,
    );
    await this.storage.saveTranscripts(this.transcripts);
    this.emitChange();
  }

  async summarize(id: string, intent: SummarizeIntent) {
    const transcript = this.getTranscript(id);
    if (!transcript) {
      return 'Transcript not found.';
    }

    if (this.mode === 'cloud') {
      return this.cloudSummarizer(transcript.text, intent, this.cloudConfig);
    }

    return this.localSummarizer(transcript.text, intent);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private createId() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    this.idCounter += 1;
    const random = Math.floor(Math.random() * 0xffffff)
      .toString(36)
      .padStart(4, '0');
    return `${Date.now()}-${this.idCounter}-${random}`;
  }
}
