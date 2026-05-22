import { ProcessingMode, CloudProvider } from '@/types';
import { requireOpenRouterSharedApiKey } from '@/constants/api/openRouter';
import { SummarizationProvider } from './summarizationProvider';
import { OnDeviceProvider } from './onDeviceProvider';
import { OpenRouterProvider } from './openRouterProvider';
import { GeminiProvider } from './geminiProvider';
import {
  SummarizationSettingsReader,
  StoreBackedSummarizationSettingsReader,
} from './summarizationSettings';
type ProviderBuilder = () => SummarizationProvider;
type CloudProviderBuilder = (apiKey: string) => SummarizationProvider;
interface SummarizationProviderFactory {
  create(mode: ProcessingMode): SummarizationProvider;
}
const CLOUD_PROVIDER_LABEL: Record<CloudProvider, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI (OpenRouter)',
  gemini: 'Gemini',
};
class ModeBasedSummarizationProviderFactory implements SummarizationProviderFactory {
  constructor(
    private readonly buildersByMode: Record<ProcessingMode, ProviderBuilder>,
    private readonly fallbackBuilder: ProviderBuilder
  ) {}
  create(mode: ProcessingMode): SummarizationProvider {
    const builder = this.buildersByMode[mode] ?? this.fallbackBuilder;
    return builder();
  }
}
class UserKeyCloudProviderResolver {
  constructor(
    private readonly settingsReader: SummarizationSettingsReader,
    private readonly cloudProviderBuilders: Record<CloudProvider, CloudProviderBuilder>
  ) {}
  resolve(): SummarizationProvider {
    const snapshot = this.settingsReader.getSnapshot();
    const builder = this.cloudProviderBuilders[snapshot.cloudProvider];
    if (!builder) {
      throw new Error(`Unknown cloud provider: ${snapshot.cloudProvider}`);
    }
    const apiKey = snapshot.apiKeys[snapshot.cloudProvider]?.trim() ?? '';
    if (!apiKey) {
      const providerLabel = CLOUD_PROVIDER_LABEL[snapshot.cloudProvider] ?? snapshot.cloudProvider;
      throw new Error(`${providerLabel} API key is not configured. Go to Settings to add your API key.`);
    }
    return builder(apiKey);
  }
}
function createDefaultFactory(
  settingsReader: SummarizationSettingsReader = new StoreBackedSummarizationSettingsReader()
): SummarizationProviderFactory {
  const cloudResolver = new UserKeyCloudProviderResolver(settingsReader, {
    openrouter: (key) => new OpenRouterProvider(key),
    openai: (key) => new OpenRouterProvider(key, 'openai'),
    gemini: (key) => new GeminiProvider(key),
  });
  return new ModeBasedSummarizationProviderFactory(
    {
      'on-device': () => new OnDeviceProvider(),
      'cloud-shared-openrouter': () =>
        new OpenRouterProvider(requireOpenRouterSharedApiKey()),
      'cloud-user-key': () => cloudResolver.resolve(),
      cloud: () => cloudResolver.resolve(),
    },
    () => new OnDeviceProvider()
  );
}
let activeFactory: SummarizationProviderFactory = createDefaultFactory();
export function configureSummarizationProviderFactory(factory: SummarizationProviderFactory): void {
  activeFactory = factory;
}
export function resetSummarizationProviderFactory(): void {
  activeFactory = createDefaultFactory();
}
export function createSummarizationProvider(mode: ProcessingMode): SummarizationProvider {
  return activeFactory.create(mode);
}
