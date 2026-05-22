import { TranscriptionMode } from '@/types';
import { normalizeTranscriptionMode } from '@/utils/processing/transcriptionMode';
import { TranscriptionProvider } from './transcriptionProvider';
import {
  CloudAssemblyAITranscriptionProvider,
  CloudTranscriptionDependencies,
  createDefaultCloudTranscriptionDependencies,
} from './cloudAssemblyAITranscriptionProvider';
import { LocalFileTranscriptionProvider } from './localFileTranscriptionProvider';
type TranscriptionProviderBuilder = () => TranscriptionProvider;
export interface TranscriptionProviderFactory {
  create(mode: TranscriptionMode): TranscriptionProvider;
}
class ModeBasedTranscriptionProviderFactory implements TranscriptionProviderFactory {
  constructor(
    private readonly buildersByMode: Record<TranscriptionMode, TranscriptionProviderBuilder>,
    private readonly fallbackBuilder: TranscriptionProviderBuilder,
  ) {}
  create(mode: TranscriptionMode): TranscriptionProvider {
    const normalized = normalizeTranscriptionMode(mode as unknown as string);
    const builder = this.buildersByMode[normalized] ?? this.fallbackBuilder;
    return builder();
  }
}
function createDefaultFactory(
  cloudDeps: CloudTranscriptionDependencies = createDefaultCloudTranscriptionDependencies(),
): TranscriptionProviderFactory {
  const cloudBuilder = () => new CloudAssemblyAITranscriptionProvider(cloudDeps);
  return new ModeBasedTranscriptionProviderFactory(
    {
      cloud: cloudBuilder,
      local: () => new LocalFileTranscriptionProvider(),
    },
    cloudBuilder,
  );
}
let activeFactory: TranscriptionProviderFactory = createDefaultFactory();
export function configureTranscriptionProviderFactory(
  factory: TranscriptionProviderFactory,
): void {
  activeFactory = factory;
}
export function resetTranscriptionProviderFactory(): void {
  activeFactory = createDefaultFactory();
}
export function createTranscriptionProvider(mode: TranscriptionMode): TranscriptionProvider {
  return activeFactory.create(mode);
}
export function configureCloudTranscriptionDependencies(
  next: Partial<CloudTranscriptionDependencies>,
): void {
  const current = createDefaultCloudTranscriptionDependencies();
  const merged: CloudTranscriptionDependencies = {
    ...current,
    ...next,
    client: { ...current.client, ...(next.client ?? {}) },
    segmentBuilder: { ...current.segmentBuilder, ...(next.segmentBuilder ?? {}) },
  };
  activeFactory = createDefaultFactory(merged);
}
