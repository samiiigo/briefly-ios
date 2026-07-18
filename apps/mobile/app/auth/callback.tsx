import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { handleIncomingAuthUrl } from '@/features/auth/services/authService';
import { useThemedColors } from '@briefly/theme/native';

export default function AuthCallbackScreen() {
  const colors = useThemedColors();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const url = await Linking.getInitialURL();
        await handleIncomingAuthUrl(url);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to finish sign-in.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {error ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{error}</Text>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.message, { color: colors.textSecondary }]}>Finishing sign-in…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
  },
});
