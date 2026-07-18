import Constants from 'expo-constants';
import {
  createPublicAppConfig,
  tryGetPublicAppConfig as tryGet,
  type PublicAppConfig,
} from '@briefly/env';

function readExtra(): Record<string, unknown> {
  return (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ?? {};
}

export type { PublicAppConfig };

/** Mobile adapter: injects Expo Constants.extra into @briefly/env. */
export function getPublicAppConfig(): PublicAppConfig {
  return createPublicAppConfig({ extra: readExtra() });
}

export function tryGetPublicAppConfig(): PublicAppConfig | null {
  return tryGet(readExtra());
}
