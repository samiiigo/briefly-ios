/** @param {import('expo/config').ConfigContext} param0 */
module.exports = ({ config }) => {
  const extra = config.extra ?? {};

  const plugins = [...(config.plugins ?? [])];
  if (!plugins.includes('expo-secure-store')) {
    plugins.push('expo-secure-store');
  }
  if (!plugins.includes('expo-apple-authentication')) {
    plugins.push('expo-apple-authentication');
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
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '',
      supabasePublishableKey:
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
        extra.supabasePublishableKey ??
        extra.supabaseAnonKey ??
        '',
      appVariant: process.env.APP_VARIANT ?? extra.appVariant ?? 'development',
    },
  };
};
