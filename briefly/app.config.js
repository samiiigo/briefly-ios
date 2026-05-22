/** @param {string | undefined} value */
function normalize(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** @param {...(string | undefined)} values */
function firstDefined(...values) {
  for (const value of values) {
    const normalized = normalize(value);
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
}

/** @param {import('expo/config').ConfigContext} param0 */
module.exports = ({ config }) => {
  const extra = config.extra ?? {};

  // OWASP: prefer non-public env vars (EAS secrets). EXPO_PUBLIC_* is legacy dev-only.
  const assemblyAiApiKey =
    firstDefined(
      process.env.ASSEMBLYAI_API_KEY,
      process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY,
      extra.assemblyAiApiKey
    ) ?? '';

  const openRouterSharedApiKey =
    firstDefined(
      process.env.OPENROUTER_SHARED_API_KEY,
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
      extra.openRouterSharedApiKey
    ) ?? '';

  const plugins = [...(config.plugins ?? [])];
  if (!plugins.includes('expo-secure-store')) {
    plugins.push('expo-secure-store');
  }

  const hasLlamaPlugin = plugins.some(
    (entry) => (Array.isArray(entry) ? entry[0] : entry) === 'llama.rn',
  );
  if (!hasLlamaPlugin) {
    plugins.push([
      'llama.rn',
      {
        enableEntitlements: true,
        entitlementsProfile: 'production',
        forceCxx20: true,
        enableOpenCLAndHexagon: true,
      },
    ]);
  }

  return {
    ...config,
    plugins,
    extra: {
      ...extra,
      assemblyAiApiKey,
      openRouterSharedApiKey,
      appVariant: process.env.APP_VARIANT ?? 'development',
    },
  };
};
