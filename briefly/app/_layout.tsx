import 'react-native-gesture-handler';
import { useEffect, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppBootstrap } from '@/hooks/app/useAppBootstrap';
import { NavigatorBottomBlur } from '@/components/navigation/chrome/NavigatorBottomBlur';
import { LibraryFabChromeOverlay } from '@/components/navigation/overlays/LibraryFabChromeOverlay';
import { ThemeProvider, useResolvedColorScheme, useThemedColors } from '@/theme';
import { iconFonts } from '@/theme/iconFonts';
import { logger } from '@/utils/logging/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colors = useThemedColors();
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

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="armed" options={{ presentation: 'modal' }} />
      <Stack.Screen name="recording/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="search" options={{ animation: 'fade' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}

function RootLayoutContent() {
  const resolvedScheme = useResolvedColorScheme();
  const [iconFontsLoaded, iconFontError] = useFonts(iconFonts);
  const rootStyle = useRootBackgroundStyle();

  useEffect(() => {
    if (iconFontError) {
      logger.error('SYSTEM', 'Failed to load Ionicons font', {
        message: iconFontError.message,
      });
    }
    if (iconFontsLoaded || iconFontError) {
      SplashScreen.hideAsync();
    }
  }, [iconFontsLoaded, iconFontError]);

  useAppBootstrap(iconFontsLoaded);

  if (!iconFontsLoaded && !iconFontError) {
    return <View style={rootStyle} />;
  }

  return (
    <View style={rootStyle}>
      <StatusBar style={resolvedScheme === 'light' ? 'dark' : 'light'} />
      <RootLayoutNav />
      <NavigatorBottomBlur scope="root" />
      <LibraryFabChromeOverlay />
    </View>
  );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <RootLayoutContent />
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
