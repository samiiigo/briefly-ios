import 'react-native-gesture-handler';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAppBootstrap } from '@/shared/hooks/app/useAppBootstrap';
import { NavigatorBottomBlur } from '@/navigation/chrome/NavigatorBottomBlur';
import { LibraryFabChromeOverlay } from '@/navigation/overlays/LibraryFabChromeOverlay';
import { AppProviders } from '@/providers/AppProviders';
import { useAuth } from '@/providers/AuthProvider';
import { useResolvedColorScheme, useThemedColors } from '@/shared/theme';
import { iconFonts } from '@/shared/theme/iconFonts';
import { logger } from '@/shared/utils/logging/logger';

function RootLayoutContent() {
  const colors = useThemedColors();
  const resolvedScheme = useResolvedColorScheme();
  const [iconFontsLoaded, iconFontError] = useFonts(iconFonts);
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const stackScreenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right' as const,
      ...Platform.select({
        ios: { gestureEnabled: true },
        android: { gestureEnabled: false },
      }),
    }),
    [colors.background],
  );

  useEffect(() => {
    if (iconFontError) {
      logger.error('SYSTEM', 'Failed to load Ionicons font', {
        message: iconFontError.message,
      });
    }
  }, [iconFontError]);

  useAppBootstrap(iconFontsLoaded, status === 'authenticated');

  useEffect(() => {
    if (status === 'loading' || !iconFontsLoaded) return;
    const inAuthGroup = segments[0] === 'auth';
    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/auth/sign-in');
      return;
    }
    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [iconFontsLoaded, router, segments, status]);

  const rootStyle = useRootBackgroundStyle();

  if (!iconFontsLoaded || status === 'loading') {
    return (
      <View style={[rootStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={rootStyle}>
      <SafeAreaProvider>
        <View style={rootStyle}>
          <StatusBar style={resolvedScheme === 'light' ? 'dark' : 'light'} />
          <Stack screenOptions={stackScreenOptions}>
            <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
            <Stack.Screen name="search" options={{ animation: 'fade' }} />
            <Stack.Screen name="auth" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'pageSheet',
                animation: 'slide_from_bottom',
                gestureDirection: 'vertical',
                contentStyle: { backgroundColor: colors.surface },
              }}
            />
          </Stack>
          {status === 'authenticated' ? (
            <>
              <NavigatorBottomBlur scope="root" />
              <LibraryFabChromeOverlay />
            </>
          ) : null}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayout() {
  return (
    <AppProviders>
      <RootLayoutContent />
    </AppProviders>
  );
}

export default RootLayout;

function useRootBackgroundStyle() {
  const colors = useThemedColors();
  return useMemo(
    () => ({ flex: 1 as const, backgroundColor: colors.background }),
    [colors.background],
  );
}
