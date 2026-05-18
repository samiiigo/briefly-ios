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

  const assemblyAiApiKey =
    firstDefined(
      process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY,
      process.env.ASSEMBLYAI_API_KEY,
      extra.assemblyAiApiKey
    ) ?? '';

  const openRouterSharedApiKey =
    firstDefined(
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
      process.env.OPENROUTER_SHARED_API_KEY,
      extra.openRouterSharedApiKey
    ) ?? '';

  return {
    ...config,
    extra: {
      ...extra,
      assemblyAiApiKey,
      openRouterSharedApiKey,
      appVariant: process.env.APP_VARIANT ?? 'development',
    },
  };
};
